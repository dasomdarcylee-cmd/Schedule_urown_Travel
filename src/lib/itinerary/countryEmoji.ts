// 국가를 대표할 수 있게 고른 15개 이모지. 사용자가 이 중에서 골라 국가 이름 앞에 붙인다.
// 실제로 시트의 국가 헤더 셀 텍스트에 "이모지 + 이름" 형태로 그대로 저장되므로, 구글시트에서
// 직접 셀을 수정해도 동일하게 반영된다.
export const CURATED_COUNTRY_EMOJIS = [
  "🐪", // 사막
  "🏛️", // 고대 유적
  "🌅", // 노을/섬
  "🇰🇷", // 한국
  "🗼", // 타워/도시
  "⛩️", // 신사/사원
  "🕌", // 모스크
  "🏖️", // 해변
  "🌋", // 화산
  "🎡", // 관람차/도심
  "🗽", // 자유의 여신상
  "🐨", // 코알라
  "🌸", // 벚꽃
  "🍁", // 단풍
  "🏔️", // 산맥
];

const DEFAULT_EMOJI = "📍";

export function splitCountryLabel(raw: string): { emoji: string | null; name: string } {
  const trimmed = raw.trim();
  for (const emoji of CURATED_COUNTRY_EMOJIS) {
    if (trimmed === emoji) return { emoji, name: "" };
    if (trimmed.startsWith(`${emoji} `)) {
      return { emoji, name: trimmed.slice(emoji.length).trim() };
    }
  }
  return { emoji: null, name: trimmed };
}

export function joinCountryLabel(emoji: string | null, name: string): string {
  return emoji ? `${emoji} ${name}`.trim() : name;
}

// 화면에 보여줄 표시용 라벨. 이모지를 아직 안 골랐으면 기본 마커를 붙인다.
export function countryDisplayLabel(raw: string): string {
  const { emoji, name } = splitCountryLabel(raw);
  return `${emoji ?? DEFAULT_EMOJI} ${name}`;
}
