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

export interface ItineraryTask {
  id: string;
  dayIndex: number; // 1-based, "N일차"
  startSlot: number; // timeSlots 배열 인덱스
  endSlot: number; // inclusive
  text: string;
  cost: number | null;
  category: TaskCategory;
  imageUrl: string | null;
  note: string | null;
}

export interface DayColumn {
  dayIndex: number; // 1-based
  date: string; // e.g. "8-26"
  weekday: string; // e.g. "Wed"
  countries: string[]; // 이동일엔 2개국 모두 표시 (soloDay가 true면 항상 1개)
  soloDay: boolean; // true면 다음 날짜 국가가 달라도 이 날은 국가 1개만 표시
  nextCountry: string | null; // 다음 날짜 국가(현재와 다를 때만) — 이동 표시 토글에 사용
  explicit: boolean; // true면 이 날짜 헤더 칸 자체에 "->"가 있어 그 텍스트 그대로 표시 (토글 무관)
  rawCountryText: string; // 이 날짜 국가 헤더 칸의 원본 텍스트 — 수정 시 정확한 매칭에 사용
}

export interface Itinerary {
  sheetTitle: string;
  days: DayColumn[];
  timeSlots: string[]; // "4:00 AM" ~ "9:00 PM", 30분 단위
  tasks: ItineraryTask[];
  categoryColors: Record<TaskCategory, string>;
  revision: string;
}
