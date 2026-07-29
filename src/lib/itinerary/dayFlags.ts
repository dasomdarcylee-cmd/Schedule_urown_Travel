// 국가 헤더는 여러 날짜 컬럼에 걸쳐 병합돼 있어서, "이 날은 다음 날짜 국가를 같이
// 보여주지 마라" 같은 날짜별 설정을 헤더 셀에는 못 담는다(병합된 칸은 전부 같은 텍스트를
// 공유하기 때문). 대신 날짜/요일 칸(날짜별로 항상 따로 있는 칸)에 "[solo]" 마커를 붙여
// 그 날짜 하나에만 적용되는 설정으로 저장한다.
const SOLO_MARKER_RE = /\s*\[solo\]\s*$/;

export function hasSoloMarker(raw: string): boolean {
  return SOLO_MARKER_RE.test(raw);
}

export function stripSoloMarker(raw: string): string {
  return raw.replace(SOLO_MARKER_RE, "").trim();
}

export function toggleSoloMarker(raw: string, solo: boolean): string {
  const base = stripSoloMarker(raw);
  return solo ? `${base} [solo]` : base;
}
