import type { TaskCategory } from "../itinerary/types";

export interface RgbColor {
  red?: number;
  green?: number;
  blue?: number;
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
