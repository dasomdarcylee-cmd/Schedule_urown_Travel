export type TaskCategory = "transport" | "tour" | "food" | "other";

export const CATEGORY_LABEL: Record<TaskCategory, string> = {
  transport: "교통편",
  tour: "여행 투어",
  food: "식사 및 숙소",
  other: "기타",
};

// Google Sheets 배경색과 매칭할 카테고리별 대표 색상 (실제 시트 hex는 Sheets API 연동 후 보정)
export const CATEGORY_COLOR: Record<TaskCategory, string> = {
  transport: "#ef4444",
  tour: "#3b82f6",
  food: "#22c55e",
  other: "#6b7280",
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
