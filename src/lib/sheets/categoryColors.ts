import { CATEGORY_COLOR } from "../itinerary/types";
import type { TaskCategory } from "../itinerary/types";

const KV_KEY = "category-colors";

export type CategoryColorMap = Record<TaskCategory, string>;

export async function getCategoryColors(env: CloudflareEnv): Promise<CategoryColorMap> {
  try {
    const raw = await env.TOKEN_KV.get(KV_KEY);
    if (!raw) return { ...CATEGORY_COLOR };
    const stored = JSON.parse(raw) as Partial<CategoryColorMap>;
    return { ...CATEGORY_COLOR, ...stored };
  } catch {
    return { ...CATEGORY_COLOR };
  }
}

export async function setCategoryColor(
  env: CloudflareEnv,
  category: TaskCategory,
  color: string
): Promise<CategoryColorMap> {
  const current = await getCategoryColors(env);
  const next = { ...current, [category]: color };
  await env.TOKEN_KV.put(KV_KEY, JSON.stringify(next));
  return next;
}

// 사용자가 고른 색은 앱 칩(흰 글씨)에는 그대로 쓰고, 시트 셀 배경으로는 흰색과 섞어 밝게
// 만든다 — 검정/짙은 글씨를 그대로 쓰는 시트에서도 글씨가 잘 보이도록.
export function lightenHexForSheet(hex: string, amount = 0.72): string {
  const n = Number.parseInt(hex.replace("#", ""), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  return `#${[mix(r), mix(g), mix(b)].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}
