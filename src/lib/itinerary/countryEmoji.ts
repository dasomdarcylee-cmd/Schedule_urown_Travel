// 국가를 대표하는 아이콘 선택지. emoji는 유니코드 문자를 그대로, image는 사용자가 직접
// 만든 그림을 쓴다. 시트 헤더 셀에는 항상 "key + 이름" 형태의 텍스트로 저장되므로(예:
// "🐪 두바이", "[church] 산토리니"), 구글시트에서 직접 셀 텍스트를 바꿔도 동일하게 동작한다.
export interface CountryIconOption {
  key: string; // 시트에 저장되는 마커 텍스트
  kind: "emoji" | "image";
  value: string; // emoji: 표시할 문자, image: 이미지 경로
  label: string; // 드롭다운에 보여줄 설명
}

export const COUNTRY_ICON_OPTIONS: CountryIconOption[] = [
  { key: "🐪", kind: "emoji", value: "🐪", label: "🐪 사막" },
  { key: "🏛️", kind: "emoji", value: "🏛️", label: "🏛️ 고대 유적" },
  { key: "🌅", kind: "emoji", value: "🌅", label: "🌅 노을/섬" },
  { key: "🇰🇷", kind: "emoji", value: "🇰🇷", label: "🇰🇷 한국" },
  { key: "🗼", kind: "emoji", value: "🗼", label: "🗼 타워/도시" },
  { key: "⛩️", kind: "emoji", value: "⛩️", label: "⛩️ 신사/사원" },
  { key: "🕌", kind: "emoji", value: "🕌", label: "🕌 모스크" },
  { key: "🏖️", kind: "emoji", value: "🏖️", label: "🏖️ 해변" },
  { key: "🌋", kind: "emoji", value: "🌋", label: "🌋 화산" },
  { key: "🎡", kind: "emoji", value: "🎡", label: "🎡 관람차/도심" },
  { key: "🗽", kind: "emoji", value: "🗽", label: "🗽 자유의 여신상" },
  { key: "🐨", kind: "emoji", value: "🐨", label: "🐨 코알라" },
  { key: "🌸", kind: "emoji", value: "🌸", label: "🌸 벚꽃" },
  { key: "🍁", kind: "emoji", value: "🍁", label: "🍁 단풍" },
  { key: "🏔️", kind: "emoji", value: "🏔️", label: "🏔️ 산맥" },
  {
    key: "[church]",
    kind: "image",
    value: "/country-icons/santorini-church.png",
    label: "🏠 파란 지붕 하얀 교회",
  },
];

const DEFAULT_EMOJI = "📍";

function findOption(key: string): CountryIconOption | undefined {
  return COUNTRY_ICON_OPTIONS.find((o) => o.key === key);
}

export function splitCountryLabel(raw: string): { iconKey: string | null; name: string } {
  const trimmed = raw.trim();
  for (const opt of COUNTRY_ICON_OPTIONS) {
    if (trimmed === opt.key) return { iconKey: opt.key, name: "" };
    if (trimmed.startsWith(`${opt.key} `)) {
      return { iconKey: opt.key, name: trimmed.slice(opt.key.length).trim() };
    }
  }
  return { iconKey: null, name: trimmed };
}

export function joinCountryLabel(iconKey: string | null, name: string): string {
  return iconKey ? `${iconKey} ${name}`.trim() : name;
}

// 헤더에 그릴 아이콘 정보. 아직 아무것도 안 고르면 기본 마커(이모지 텍스트)를 쓴다.
export function countryIcon(raw: string): { kind: "emoji" | "image"; value: string; name: string } {
  const { iconKey, name } = splitCountryLabel(raw);
  const opt = iconKey ? findOption(iconKey) : undefined;
  if (opt) return { kind: opt.kind, value: opt.value, name };
  return { kind: "emoji", value: DEFAULT_EMOJI, name };
}
