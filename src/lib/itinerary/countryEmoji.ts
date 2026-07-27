export const COUNTRY_EMOJI: Record<string, string> = {
  두바이: "🐪",
  아테네: "🏛️",
  산토리니: "🌅",
  한국: "🇰🇷",
};

export function countryLabel(country: string): string {
  return `${COUNTRY_EMOJI[country] ?? "📍"} ${country}`;
}
