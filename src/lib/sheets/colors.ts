import { lightenHexForSheet, hexToRgb01 } from "./categoryColors";
import type { CategoryColorMap } from "./categoryColors";
import type { TaskCategory } from "../itinerary/types";

export interface RgbColor {
  red?: number;
  green?: number;
  blue?: number;
}

const EXACT_MATCH_TOLERANCE = 0.02;

function colorsClose(a: RgbColor, b: RgbColor): boolean {
  const ar = a.red ?? 1;
  const ag = a.green ?? 1;
  const ab = a.blue ?? 1;
  const br = b.red ?? 1;
  const bg = b.green ?? 1;
  const bb = b.blue ?? 1;
  return (
    Math.abs(ar - br) < EXACT_MATCH_TOLERANCE &&
    Math.abs(ag - bg) < EXACT_MATCH_TOLERANCE &&
    Math.abs(ab - bb) < EXACT_MATCH_TOLERANCE
  );
}

// 앱에서 카테고리를 고르면 그 카테고리의 (밝게 조정된) 색을 셀 배경에 정확히 칠한다
// (updateTask 참고). 그러니 셀 색이 현재 설정된 카테고리 색 중 하나와 (거의) 정확히
// 일치하면, 색조 버킷 추정 없이 그 카테고리로 바로 확정한다 — "기타"처럼 채도가 낮아
// 색조 버킷이 애매한 카테고리도 정확히 구분되고, "해당없음"도 이 방식으로만 구분 가능하다.
function matchConfiguredCategory(
  color: RgbColor | null | undefined,
  categoryColors: CategoryColorMap
): TaskCategory | null {
  if (!color) return null;
  for (const key of Object.keys(categoryColors) as TaskCategory[]) {
    const painted = hexToRgb01(lightenHexForSheet(categoryColors[key]));
    if (colorsClose(color, painted)) return key;
  }
  return null;
}

// 시트 배경색(0~1 RGB)을 색상표(hex)로 정확히 매칭하지 않고, 색조(hue)로 3버킷(빨강/초록/파랑)에
// 최근접 분류한다. 사용자가 정확히 어떤 팔레트 스와치를 썼는지 몰라도 동작하도록 하기 위함.
// 흰색/배경 없음/아주 옅은 회색은 "other"로 취급.
export function classifyBackgroundColor(color: RgbColor | null | undefined): TaskCategory {
  if (!color) return "other";
  const r = color.red ?? 1;
  const g = color.green ?? 1;
  const b = color.blue ?? 1;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;
  const saturation = max === min ? 0 : (max - min) / (1 - Math.abs(2 * lightness - 1));

  // 흰색/기본 배경(색 없음)은 채도가 매우 낮음
  if (saturation < 0.15) return "other";

  let hue: number;
  if (max === r) hue = ((g - b) / (max - min)) % 6;
  else if (max === g) hue = (b - r) / (max - min) + 2;
  else hue = (r - g) / (max - min) + 4;
  hue *= 60;
  if (hue < 0) hue += 360;

  if (hue < 60 || hue >= 300) return "transport"; // 빨강 계열
  if (hue < 180) return "food"; // 초록 계열
  return "tour"; // 파랑 계열
}

const TRANSPORT_KEYWORDS = [
  "flight",
  "비행",
  "이동",
  "경유",
  "도착",
  "출발",
  "공항",
  "ferry",
  "페리",
  "mred",
  "departure",
  "arrival",
  "pickup",
  "pickups",
];
const TOUR_KEYWORDS = ["투어", "관광", "cruise", "acropolis", "아크로폴리스"];
const FOOD_KEYWORDS = [
  "카페",
  "cafe",
  "café",
  "식사",
  "숙소",
  "check in",
  "checkin",
  "호텔",
  "hotel",
  "브런치",
  "저녁",
  "조식",
  "중식",
  "레스토랑",
  "restaurant",
];

// 실제 시트에는 아직 배경색이 칠해져 있지 않은 기존 항목이 많다. 색이 없으면 텍스트 키워드로
// 대략 분류하고, 이후 앱에서 사용자가 카테고리를 직접 고쳐 저장하면 그때부터는 색이 기록되어
// classifyBackgroundColor가 우선 적용된다.
export function classifyTask(
  text: string,
  color: RgbColor | null | undefined,
  categoryColors?: CategoryColorMap
): TaskCategory {
  const exact = categoryColors ? matchConfiguredCategory(color, categoryColors) : null;
  if (exact) return exact;

  const byColor = classifyBackgroundColor(color);
  if (byColor !== "other") return byColor;

  const lower = text.toLowerCase();
  if (TRANSPORT_KEYWORDS.some((k) => lower.includes(k))) return "transport";
  if (TOUR_KEYWORDS.some((k) => lower.includes(k))) return "tour";
  if (FOOD_KEYWORDS.some((k) => lower.includes(k))) return "food";
  return "other";
}
