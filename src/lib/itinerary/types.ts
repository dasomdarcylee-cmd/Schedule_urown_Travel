export type TaskCategory = "transport" | "tour" | "food" | "other";

export const CATEGORY_LABEL: Record<TaskCategory, string> = {
  transport: "교통편",
  tour: "여행 투어",
  food: "식사 및 숙소",
  other: "기타",
};

// 여행 테마 파스텔 팔레트. 채도/명도만 낮췄을 뿐 색조(hue)는 원래 빨강/파랑/초록과
// 동일하게 유지했으므로 colors.ts의 색조 기반 분류기는 그대로 동작한다.
export const CATEGORY_COLOR: Record<TaskCategory, string> = {
  transport: "#ff8a80",
  tour: "#5bc0de",
  food: "#7bc986",
  other: "#cbbfb2",
};

export interface ItineraryTask {
  id: string;
  dayIndex: number; // 1-based, "N일차"
  startSlot: number; // timeSlots 배열 인덱스
  endSlot: number; // inclusive
  text: string;
  cost: number | null;
  category: TaskCategory;
}

export interface DayColumn {
  dayIndex: number; // 1-based
  date: string; // e.g. "8-26"
  weekday: string; // e.g. "Wed"
  countries: string[]; // 이동일엔 2개국 모두 표시
}

export interface Itinerary {
  sheetTitle: string;
  days: DayColumn[];
  timeSlots: string[]; // "4:00 AM" ~ "9:00 PM", 30분 단위
  tasks: ItineraryTask[];
  revision: string;
}
