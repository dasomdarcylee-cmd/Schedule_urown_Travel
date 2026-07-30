import { getGoogleAccessToken } from "./googleAuth";
import { classifyTask } from "./colors";
import { getCategoryColors, lightenHexForSheet } from "./categoryColors";
import { generateTimeSlotsByCount } from "../itinerary/timeSlots";
import { splitTaskText, joinTaskText } from "../itinerary/taskMeta";
import { hasSoloMarker, stripSoloMarker, toggleSoloMarker } from "../itinerary/dayFlags";
import { splitTransitionCountries } from "../itinerary/countryEmoji";
import type { DayColumn, Itinerary, ItineraryTask, TaskCategory } from "../itinerary/types";

interface SheetsCellFormat {
  backgroundColor?: { red?: number; green?: number; blue?: number };
}

interface SheetsCell {
  formattedValue?: string;
  userEnteredFormat?: SheetsCellFormat;
  effectiveFormat?: SheetsCellFormat;
}

interface SheetsMerge {
  startRowIndex: number;
  endRowIndex: number;
  startColumnIndex: number;
  endColumnIndex: number;
}

interface SheetsResponse {
  sheets: Array<{
    properties: { title: string };
    merges?: SheetsMerge[];
    data: Array<{ rowData?: Array<{ values?: SheetsCell[] }> }>;
  }>;
}

const FIELDS =
  "sheets(properties.title,merges,data.rowData.values(formattedValue,userEnteredFormat.backgroundColor,effectiveFormat.backgroundColor))";

async function fetchRaw(env: CloudflareEnv, token: string): Promise<Response> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${env.GOOGLE_SHEET_ID}?fields=${encodeURIComponent(FIELDS)}`;
  return fetch(url, { headers: { authorization: `Bearer ${token}` }, cache: "no-store" });
}

function cellText(cell: SheetsCell | undefined): string {
  return cell?.formattedValue?.trim() ?? "";
}

function cellCategory(cell: SheetsCell | undefined) {
  const color = cell?.effectiveFormat?.backgroundColor ?? cell?.userEnteredFormat?.backgroundColor;
  return classifyTask(cellText(cell), color ?? null);
}

function parseCost(text: string): number | null {
  const cleaned = text.replace(/[^0-9.-]/g, "");
  if (!cleaned) return null;
  const value = Number.parseFloat(cleaned);
  return Number.isFinite(value) ? value : null;
}

function hashString(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16);
}

function findMergeAt(merges: SheetsMerge[], row: number, col: number): SheetsMerge | undefined {
  return merges.find(
    (m) => row >= m.startRowIndex && row < m.endRowIndex && col >= m.startColumnIndex && col < m.endColumnIndex
  );
}

export function parseSheetsResponse(json: SheetsResponse, categoryColors: Record<TaskCategory, string>): Itinerary {
  const sheet = json.sheets[0];
  if (!sheet) throw new Error("시트를 찾을 수 없음");

  const grid: SheetsCell[][] = (sheet.data[0]?.rowData ?? []).map((r) => r.values ?? []);
  const merges = sheet.merges ?? [];
  const numCols = grid.reduce((max, row) => Math.max(max, row.length), 0);

  // 시간행 범위: 3행(index 2)부터 첫 컬럼이 "Total"인 행 전까지
  let totalRowIndex = grid.length;
  for (let r = 2; r < grid.length; r++) {
    if (cellText(grid[r][0]) === "Total") {
      totalRowIndex = r;
      break;
    }
  }
  const numTimeRows = totalRowIndex - 2;
  const startHour = 4; // 시트 관례상 오전 4시 시작 (필요 시 grid[2][0] 라벨로 검증 가능)
  const timeSlots = generateTimeSlotsByCount(startHour, numTimeRows, 30);

  // 국가 헤더: 0행의 merge 범위로 판별
  const countryMerges = merges.filter((m) => m.startRowIndex === 0);
  function countryAt(col: number): string {
    const m = countryMerges.find((cm) => col >= cm.startColumnIndex && col < cm.endColumnIndex);
    if (m) return cellText(grid[0][m.startColumnIndex]);
    return cellText(grid[0][col]);
  }

  // 일자 쌍 컬럼: 1번 컬럼부터 2개씩
  const dayPairs: { leftCol: number; rightCol: number }[] = [];
  for (let c = 1; c + 1 < numCols; c += 2) {
    dayPairs.push({ leftCol: c, rightCol: c + 1 });
  }

  // 이동일을 정확히 표시하고 싶은 날짜는 두 가지 방식을 쓸 수 있다:
  // 1) 왼쪽(일정) 칸 하나에 직접 "아테네 -> 산토리니"처럼 화살표로 적기 (예전 방식)
  // 2) 왼쪽엔 체류국, 오른쪽(원래 금액 칸 자리, 헤더 행에서는 비어있음)엔 이동국(도착국)을
  //    따로 적기 — 둘 다 병합 없이 독립된 칸이어야 한다.
  // 둘 다 자동 감지(다음 날짜와 비교)/soloDay 토글보다 우선하며, 그 텍스트를 그대로 쓴다.
  const dayRawCountries = dayPairs.map((p) => countryAt(p.leftCol));
  const dayRightRawCountries = dayPairs.map((p) => countryAt(p.rightCol));
  const dayPrimaryCountries = dayRawCountries.map((raw) => splitTransitionCountries(raw)[0]);

  const days: DayColumn[] = dayPairs.map((pair, i) => {
    const dayLabelRaw = cellText(grid[1][pair.leftCol]);
    const dateWeekdayRawWithMarker = cellText(grid[1][pair.rightCol]);
    const soloDay = hasSoloMarker(dateWeekdayRawWithMarker);
    const dateWeekdayRaw = stripSoloMarker(dateWeekdayRawWithMarker);
    const dayIndex = Number.parseInt(dayLabelRaw, 10) || i + 1;
    const [date, weekday] = splitDateWeekday(dateWeekdayRaw);

    const leftRaw = dayRawCountries[i];
    const rightRaw = dayRightRawCountries[i];
    const legacyParts = splitTransitionCountries(leftRaw);

    // 다음 날짜 국가가 다를 때만 "이동일" 후보가 된다 — soloDay 마커로 이 날 하나만 끌 수 있다
    // (국가 헤더는 여러 날짜에 걸쳐 병합돼 있어서 날짜별로 따로 설정할 수 없기 때문).
    const nextCountry =
      i < dayPairs.length - 1 && dayPrimaryCountries[i + 1] !== dayPrimaryCountries[i]
        ? dayPrimaryCountries[i + 1]
        : null;

    let countries: string[];
    let countryRawTexts: string[];
    let explicit: boolean;
    let movingCountryColumn = false;

    if (legacyParts.length > 1) {
      countries = legacyParts;
      countryRawTexts = legacyParts.map(() => leftRaw);
      explicit = true;
    } else if (rightRaw && rightRaw !== leftRaw) {
      countries = [leftRaw, rightRaw];
      countryRawTexts = [leftRaw, rightRaw];
      explicit = true;
      movingCountryColumn = true;
    } else {
      explicit = false;
      countries = !soloDay && nextCountry ? [dayPrimaryCountries[i], nextCountry] : [dayPrimaryCountries[i]];
      countryRawTexts = countries;
    }

    return { dayIndex, date, weekday, countries, countryRawTexts, soloDay, nextCountry, explicit, movingCountryColumn };
  });

  const tasks: ItineraryTask[] = [];
  for (let pairIdx = 0; pairIdx < dayPairs.length; pairIdx++) {
    const { leftCol, rightCol } = dayPairs[pairIdx];
    const dayIndex = days[pairIdx].dayIndex;

    for (let r = 2; r < totalRowIndex; r++) {
      const merge = findMergeAt(merges, r, leftCol);
      if (merge && merge.startRowIndex !== r) continue; // 병합 셀의 시작 행이 아니면 스킵 (중복 방지)

      const rawText = cellText(grid[r][leftCol]);
      if (!rawText) continue;
      const { text, imageUrl, note } = splitTaskText(rawText);

      const startSlot = r - 2;
      const endSlot = merge ? merge.endRowIndex - 1 - 2 : startSlot;

      // 비용: 같은 행 범위 내 rightCol에서 첫 non-empty 값
      let cost: number | null = null;
      for (let rr = r; rr <= (merge ? merge.endRowIndex - 1 : r); rr++) {
        const raw = cellText(grid[rr]?.[rightCol]);
        if (raw) {
          cost = parseCost(raw);
          break;
        }
      }

      tasks.push({
        id: `${dayIndex}:${startSlot}`,
        dayIndex,
        startSlot,
        endSlot,
        text,
        cost,
        category: cellCategory(grid[r][leftCol]),
        imageUrl,
        note,
      });
    }
  }

  const revision = hashString(JSON.stringify(grid.map((row) => row.map((c) => c.formattedValue ?? ""))));

  return {
    sheetTitle: sheet.properties.title,
    days,
    timeSlots,
    tasks,
    categoryColors,
    revision,
  };
}

function splitDateWeekday(raw: string): [string, string] {
  const idx = raw.lastIndexOf(" ");
  if (idx === -1) return [raw, ""];
  return [raw.slice(0, idx), raw.slice(idx + 1)];
}

export async function fetchItinerary(env: CloudflareEnv): Promise<Itinerary> {
  let token = await getGoogleAccessToken(env);
  const [res, categoryColors] = await Promise.all([fetchRaw(env, token), getCategoryColors(env)]);
  let gridRes = res;

  if (gridRes.status === 401) {
    token = await getGoogleAccessToken(env, true);
    gridRes = await fetchRaw(env, token);
  }
  if (!gridRes.ok) throw new Error(`구글시트 조회 HTTP ${gridRes.status}`);

  const json = (await gridRes.json()) as SheetsResponse;
  return parseSheetsResponse(json, categoryColors);
}

export interface TaskEdit {
  dayIndex: number;
  originalStartSlot: number;
  originalEndSlot: number;
  startSlot: number;
  endSlot: number;
  text: string;
  cost: number | null;
  category: TaskCategory;
  imageUrl: string | null;
  note: string | null;
}

function hexToRgb01(hex: string) {
  const n = Number.parseInt(hex.replace("#", ""), 16);
  return { red: ((n >> 16) & 255) / 255, green: ((n >> 8) & 255) / 255, blue: (n & 255) / 255 };
}

async function getSheetId(env: CloudflareEnv, token: string): Promise<number> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${env.GOOGLE_SHEET_ID}?fields=${encodeURIComponent("sheets.properties.sheetId")}`;
  const res = await fetch(url, { headers: { authorization: `Bearer ${token}` }, cache: "no-store" });
  if (!res.ok) throw new Error(`시트 메타 조회 HTTP ${res.status}`);
  const json = (await res.json()) as { sheets: Array<{ properties: { sheetId: number } }> };
  return json.sheets[0].properties.sheetId;
}

// dayIndex는 시트 관례상 "N일차" 컬럼쌍이 1번 컬럼부터 순서대로 배치된다는 가정으로 위치를 계산한다
// (fetchItinerary의 dayPairs 구성과 동일한 규칙).
function dayColumns(dayIndex: number) {
  const leftCol = 1 + (dayIndex - 1) * 2;
  return { leftCol, rightCol: leftCol + 1 };
}

export async function updateTask(env: CloudflareEnv, edit: TaskEdit): Promise<void> {
  let token = await getGoogleAccessToken(env);
  const [sheetId, categoryColors] = await Promise.all([getSheetId(env, token), getCategoryColors(env)]);
  const { leftCol, rightCol } = dayColumns(edit.dayIndex);
  const timeRowOffset = 2; // 헤더 2행 다음부터 시간행 시작

  const requests: unknown[] = [];

  const oldStartRow = edit.originalStartSlot + timeRowOffset;
  const oldEndRow = edit.originalEndSlot + timeRowOffset + 1;
  const newStartRow = edit.startSlot + timeRowOffset;
  const newEndRow = edit.endSlot + timeRowOffset + 1;

  // 1) 기존 범위 병합 해제 + 내용 삭제 (이동/길이 변경 시 잔여 텍스트가 남지 않도록)
  if (oldEndRow > oldStartRow + 1) {
    requests.push({
      unmergeCells: {
        range: {
          sheetId,
          startRowIndex: oldStartRow,
          endRowIndex: oldEndRow,
          startColumnIndex: leftCol,
          endColumnIndex: leftCol + 1,
        },
      },
    });
  }
  requests.push({
    updateCells: {
      range: {
        sheetId,
        startRowIndex: oldStartRow,
        endRowIndex: oldEndRow,
        startColumnIndex: leftCol,
        endColumnIndex: rightCol + 1,
      },
      fields: "userEnteredValue,userEnteredFormat.backgroundColor",
      rows: Array.from({ length: oldEndRow - oldStartRow }, () => ({
        values: [{ userEnteredValue: null, userEnteredFormat: {} }, { userEnteredValue: null }],
      })),
    },
  });

  // 2) 새 범위에 텍스트/비용/색상 기록
  const color = hexToRgb01(lightenHexForSheet(categoryColors[edit.category]));
  requests.push({
    updateCells: {
      range: {
        sheetId,
        startRowIndex: newStartRow,
        endRowIndex: newStartRow + 1,
        startColumnIndex: leftCol,
        endColumnIndex: rightCol + 1,
      },
      fields: "userEnteredValue,userEnteredFormat.backgroundColor",
      rows: [
        {
          values: [
            {
              userEnteredValue: { stringValue: joinTaskText(edit.text, edit.imageUrl, edit.note) },
              userEnteredFormat: { backgroundColor: color },
            },
            { userEnteredValue: edit.cost != null ? { numberValue: edit.cost } : null },
          ],
        },
      ],
    },
  });

  // 3) 여러 행에 걸치면 leftCol만 세로로 병합
  if (newEndRow > newStartRow + 1) {
    requests.push({
      mergeCells: {
        range: {
          sheetId,
          startRowIndex: newStartRow,
          endRowIndex: newEndRow,
          startColumnIndex: leftCol,
          endColumnIndex: leftCol + 1,
        },
        mergeType: "MERGE_ALL",
      },
    });
  }

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${env.GOOGLE_SHEET_ID}:batchUpdate`;
  let res = await fetch(url, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ requests }),
  });

  if (res.status === 401) {
    token = await getGoogleAccessToken(env, true);
    res = await fetch(url, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ requests }),
    });
  }
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`구글시트 업데이트 HTTP ${res.status}: ${body}`);
  }
}

// 국가 헤더 텍스트(이모지+이름)를 바꾼다. 같은 국가가 시트에 여러 번 등장하면(예: 아테네를
// 두 번 방문) 그 모든 헤더 셀을 한꺼번에 갱신한다 — 개별로 다르게 부를 이유가 없기 때문.
export async function updateCountryLabel(env: CloudflareEnv, oldRaw: string, newRaw: string): Promise<void> {
  let token = await getGoogleAccessToken(env);
  const sheetId = await getSheetId(env, token);
  let gridRes = await fetchRaw(env, token);
  if (gridRes.status === 401) {
    token = await getGoogleAccessToken(env, true);
    gridRes = await fetchRaw(env, token);
  }
  if (!gridRes.ok) throw new Error(`구글시트 조회 HTTP ${gridRes.status}`);

  const json = (await gridRes.json()) as SheetsResponse;
  const sheet = json.sheets[0];
  const merges = sheet.merges ?? [];
  const grid: SheetsCell[][] = (sheet.data[0]?.rowData ?? []).map((r) => r.values ?? []);
  const countryMerges = merges.filter((m) => m.startRowIndex === 0);

  const targetCols = new Set<number>();
  for (const m of countryMerges) {
    if (cellText(grid[0][m.startColumnIndex]) === oldRaw) targetCols.add(m.startColumnIndex);
  }
  for (let c = 0; c < (grid[0]?.length ?? 0); c++) {
    const insideMerge = countryMerges.some((m) => c >= m.startColumnIndex && c < m.endColumnIndex);
    if (!insideMerge && cellText(grid[0][c]) === oldRaw) targetCols.add(c);
  }
  if (targetCols.size === 0) throw new Error("해당 국가를 시트 헤더에서 찾을 수 없음");

  const requests = Array.from(targetCols).map((col) => ({
    updateCells: {
      range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: col, endColumnIndex: col + 1 },
      fields: "userEnteredValue",
      rows: [{ values: [{ userEnteredValue: { stringValue: newRaw } }] }],
    },
  }));

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${env.GOOGLE_SHEET_ID}:batchUpdate`;
  let res = await fetch(url, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ requests }),
  });
  if (res.status === 401) {
    token = await getGoogleAccessToken(env, true);
    res = await fetch(url, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ requests }),
    });
  }
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`구글시트 업데이트 HTTP ${res.status}: ${body}`);
  }
}

// 특정 날짜 하나만 "다음 날짜 국가 표시 끄기"를 켜거나 끈다. 국가 헤더 셀은 여러 날짜에
// 걸쳐 병합돼 있어 날짜별로 따로 설정할 수 없으므로, 병합되지 않은 날짜/요일 셀에
// soloDay 마커를 붙여 이 날짜 하나에만 적용되는 설정으로 저장한다.
export async function updateDaySolo(env: CloudflareEnv, dayIndex: number, solo: boolean): Promise<void> {
  let token = await getGoogleAccessToken(env);
  const [sheetId, gridRes0] = await Promise.all([getSheetId(env, token), fetchRaw(env, token)]);
  let gridRes = gridRes0;
  if (gridRes.status === 401) {
    token = await getGoogleAccessToken(env, true);
    gridRes = await fetchRaw(env, token);
  }
  if (!gridRes.ok) throw new Error(`구글시트 조회 HTTP ${gridRes.status}`);

  const json = (await gridRes.json()) as SheetsResponse;
  const sheet = json.sheets[0];
  const grid: SheetsCell[][] = (sheet.data[0]?.rowData ?? []).map((r) => r.values ?? []);
  const { rightCol } = dayColumns(dayIndex);
  const currentRaw = cellText(grid[1]?.[rightCol]);
  const newRaw = toggleSoloMarker(currentRaw, solo);

  const requests = [
    {
      updateCells: {
        range: { sheetId, startRowIndex: 1, endRowIndex: 2, startColumnIndex: rightCol, endColumnIndex: rightCol + 1 },
        fields: "userEnteredValue",
        rows: [{ values: [{ userEnteredValue: { stringValue: newRaw } }] }],
      },
    },
  ];

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${env.GOOGLE_SHEET_ID}:batchUpdate`;
  let res = await fetch(url, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ requests }),
  });
  if (res.status === 401) {
    token = await getGoogleAccessToken(env, true);
    res = await fetch(url, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ requests }),
    });
  }
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`구글시트 업데이트 HTTP ${res.status}: ${body}`);
  }
}

// 특정 날짜의 국가 헤더 오른쪽(이동국가) 칸을 설정/해제한다. 이 날짜가 다른 날짜들과
// 국가 헤더 병합에 걸쳐 있으면, 그 병합을 필요한 만큼만 쪼개서 이 날짜의 왼쪽 칸(체류국,
// 원래 텍스트 유지)과 오른쪽 칸(이동국)을 독립시킨 다음 오른쪽 칸에 값을 써넣는다.
export async function setDayMovingCountry(
  env: CloudflareEnv,
  dayIndex: number,
  newRaw: string | null
): Promise<void> {
  let token = await getGoogleAccessToken(env);
  const [sheetId, gridRes0] = await Promise.all([getSheetId(env, token), fetchRaw(env, token)]);
  let gridRes = gridRes0;
  if (gridRes.status === 401) {
    token = await getGoogleAccessToken(env, true);
    gridRes = await fetchRaw(env, token);
  }
  if (!gridRes.ok) throw new Error(`구글시트 조회 HTTP ${gridRes.status}`);

  const json = (await gridRes.json()) as SheetsResponse;
  const sheet = json.sheets[0];
  const merges = sheet.merges ?? [];
  const grid: SheetsCell[][] = (sheet.data[0]?.rowData ?? []).map((r) => r.values ?? []);
  const { leftCol, rightCol } = dayColumns(dayIndex);

  const countryMerges = merges.filter((m) => m.startRowIndex === 0);
  const merge = countryMerges.find((m) => leftCol >= m.startColumnIndex && leftCol < m.endColumnIndex);

  const singleCell = (col: number, text: string) => ({
    updateCells: {
      range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: col, endColumnIndex: col + 1 },
      fields: "userEnteredValue",
      rows: [{ values: [{ userEnteredValue: { stringValue: text } }] }],
    },
  });
  const mergeRange = (startCol: number, endCol: number) => ({
    mergeCells: {
      range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: startCol, endColumnIndex: endCol },
      mergeType: "MERGE_ALL",
    },
  });

  const requests: unknown[] = [];

  if (merge) {
    const wholeText = cellText(grid[0][merge.startColumnIndex]);
    const beforeEmpty = merge.startColumnIndex >= leftCol;
    const afterEmpty = rightCol + 1 >= merge.endColumnIndex;

    requests.push({
      unmergeCells: {
        range: {
          sheetId,
          startRowIndex: 0,
          endRowIndex: 1,
          startColumnIndex: merge.startColumnIndex,
          endColumnIndex: merge.endColumnIndex,
        },
      },
    });
    // unmerge 후엔 원래 병합의 앵커(맨 왼쪽) 셀만 텍스트를 유지하므로, 이 날짜와 뒤쪽
    // 조각의 새 앵커가 될 셀에는 원래 텍스트를 먼저 채워 넣은 다음 다시 병합한다.
    if (!afterEmpty) requests.push(singleCell(rightCol + 1, wholeText));
    if (merge.startColumnIndex !== leftCol) requests.push(singleCell(leftCol, wholeText));
    if (!beforeEmpty) requests.push(mergeRange(merge.startColumnIndex, leftCol));
    if (!afterEmpty) requests.push(mergeRange(rightCol + 1, merge.endColumnIndex));
  }

  requests.push({
    updateCells: {
      range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: rightCol, endColumnIndex: rightCol + 1 },
      fields: "userEnteredValue",
      rows: [{ values: [{ userEnteredValue: newRaw ? { stringValue: newRaw } : null }] }],
    },
  });

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${env.GOOGLE_SHEET_ID}:batchUpdate`;
  let res = await fetch(url, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ requests }),
  });
  if (res.status === 401) {
    token = await getGoogleAccessToken(env, true);
    res = await fetch(url, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ requests }),
    });
  }
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`구글시트 업데이트 HTTP ${res.status}: ${body}`);
  }
}

// 특정 카테고리로 분류된 모든 일정 셀의 배경색을 새 색으로 다시 칠한다. 카테고리 색을
// 바꾸면 앱 화면뿐 아니라 시트에 이미 칠해진 셀들도 같은 의미(카테고리)를 유지하도록.
export async function recolorCategory(
  env: CloudflareEnv,
  category: TaskCategory,
  newColor: string
): Promise<void> {
  let token = await getGoogleAccessToken(env);
  const sheetId = await getSheetId(env, token);
  let gridRes = await fetchRaw(env, token);
  if (gridRes.status === 401) {
    token = await getGoogleAccessToken(env, true);
    gridRes = await fetchRaw(env, token);
  }
  if (!gridRes.ok) throw new Error(`구글시트 조회 HTTP ${gridRes.status}`);

  const json = (await gridRes.json()) as SheetsResponse;
  const sheet = json.sheets[0];
  const merges = sheet.merges ?? [];
  const grid: SheetsCell[][] = (sheet.data[0]?.rowData ?? []).map((r) => r.values ?? []);
  const numCols = grid.reduce((max, row) => Math.max(max, row.length), 0);

  let totalRowIndex = grid.length;
  for (let r = 2; r < grid.length; r++) {
    if (cellText(grid[r][0]) === "Total") {
      totalRowIndex = r;
      break;
    }
  }

  const dayPairs: { leftCol: number }[] = [];
  for (let c = 1; c + 1 < numCols; c += 2) dayPairs.push({ leftCol: c });

  const color = hexToRgb01(lightenHexForSheet(newColor));
  const requests: unknown[] = [];

  for (const { leftCol } of dayPairs) {
    for (let r = 2; r < totalRowIndex; r++) {
      const merge = findMergeAt(merges, r, leftCol);
      if (merge && merge.startRowIndex !== r) continue;
      const cell = grid[r][leftCol];
      if (!cellText(cell)) continue;
      if (cellCategory(cell) !== category) continue;

      requests.push({
        updateCells: {
          range: { sheetId, startRowIndex: r, endRowIndex: r + 1, startColumnIndex: leftCol, endColumnIndex: leftCol + 1 },
          fields: "userEnteredFormat.backgroundColor",
          rows: [{ values: [{ userEnteredFormat: { backgroundColor: color } }] }],
        },
      });
    }
  }

  if (requests.length === 0) return;

  const url2 = `https://sheets.googleapis.com/v4/spreadsheets/${env.GOOGLE_SHEET_ID}:batchUpdate`;
  let res2 = await fetch(url2, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ requests }),
  });
  if (res2.status === 401) {
    token = await getGoogleAccessToken(env, true);
    res2 = await fetch(url2, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ requests }),
    });
  }
  if (!res2.ok) {
    const body = await res2.text();
    throw new Error(`구글시트 업데이트 HTTP ${res2.status}: ${body}`);
  }
}
