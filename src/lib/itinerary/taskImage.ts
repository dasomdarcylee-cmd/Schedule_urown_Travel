// 일정 셀 텍스트 끝에 "[img:URL]" 마커를 붙여 사진 링크를 저장한다 (countryEmoji.ts의
// "[church] 산토리니" 마커 방식과 동일한 아이디어) — 시트 컬럼 구조를 바꾸지 않고도
// 사진 하나를 특정 일정에 매달아 둘 수 있다.
const IMAGE_MARKER_RE = /\s*\[img:([^\]]+)\]\s*$/;

export function splitTaskText(raw: string): { text: string; imageUrl: string | null } {
  const match = raw.match(IMAGE_MARKER_RE);
  if (!match) return { text: raw.trim(), imageUrl: null };
  return { text: raw.slice(0, match.index).trim(), imageUrl: match[1].trim() };
}

export function joinTaskText(text: string, imageUrl: string | null): string {
  const trimmedUrl = imageUrl?.trim();
  return trimmedUrl ? `${text.trim()} [img:${trimmedUrl}]` : text.trim();
}
