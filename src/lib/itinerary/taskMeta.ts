// 일정 셀 텍스트 끝에 "[img:URL]", "[note:내용]" 같은 마커를 붙여 사진/메모를 저장한다
// (countryEmoji.ts의 "[church] 산토리니" 마커 방식과 동일한 아이디어) — 시트 컬럼 구조를
// 바꾸지 않고도 부가 정보를 특정 일정에 매달아 둘 수 있다.
const MARKER_RE = /\s*\[(img|note):([^\]]*)\]/g;

export function splitTaskText(raw: string): { text: string; imageUrl: string | null; note: string | null } {
  let imageUrl: string | null = null;
  let note: string | null = null;

  const text = raw
    .replace(MARKER_RE, (_match, key: string, value: string) => {
      const trimmed = value.trim();
      if (key === "img") imageUrl = trimmed || null;
      else if (key === "note") note = trimmed || null;
      return "";
    })
    .trim();

  return { text, imageUrl, note };
}

export function joinTaskText(text: string, imageUrl: string | null, note: string | null): string {
  let result = text.trim();
  const trimmedNote = note?.trim();
  const trimmedUrl = imageUrl?.trim();
  if (trimmedNote) result += ` [note:${trimmedNote}]`;
  if (trimmedUrl) result += ` [img:${trimmedUrl}]`;
  return result;
}
