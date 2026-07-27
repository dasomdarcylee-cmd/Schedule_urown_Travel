export type TaskCategory = "transport" | "tour" | "food" | "other";

export const CATEGORY_LABEL: Record<TaskCategory, string> = {
  transport: "교통편",
  tour: "여행 투어",
  food: "식사 및 숙소",
  other: "기타",
};

// 여행 테마 파스텔 팔레트 (앱 UI의 칩 배경 — 흰 글씨와 대비되도록 진하게 유지)
export const CATEGORY_COLOR: Record<TaskCategory, string> = {
  transport: "#ff8a80",
  tour: "#5bc0de",
  food: "#7bc986",
  other: "#cbbfb2",
};

// 구글시트 셀에 실제로 써넣는 배경색 — 시트는 검정/짙은 글씨를 그대로 쓰므로 훨씬
// 연하게 (Google Sheets 기본 팔레트의 "연한 색상 3" 계열). 색조(hue)는 위 CATEGORY_COLOR와
// 동일하게 유지해서 colors.ts의 색조 기반 분류기가 계속 같은 카테고리로 인식한다.
export const CATEGORY_SHEET_COLOR: Record<TaskCategory, string> = {
  transport: "#f4cccc",
  tour: "#c9daf8",
  food: "#d9ead3",
  other: "#f3f3f3",
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
