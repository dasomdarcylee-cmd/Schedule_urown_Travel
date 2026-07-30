export type TaskCategory = "transport" | "tour" | "food" | "other" | "none";

export const CATEGORY_LABEL: Record<TaskCategory, string> = {
  transport: "교통편",
  tour: "여행 투어",
  food: "식사 및 숙소",
  other: "기타",
  none: "해당없음",
};

// 여행 테마 파스텔 팔레트 (앱 UI의 칩 배경 — 흰 글씨와 대비되도록 진하게 유지)
export const CATEGORY_COLOR: Record<TaskCategory, string> = {
  transport: "#ff8a80",
  tour: "#5bc0de",
  food: "#7bc986",
  other: "#cbbfb2",
  none: "#a8a29a",
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
  countryRawTexts: string[]; // countries와 나란히, 각 항목을 수정할 때 정확히 매칭할 원본 텍스트
  soloDay: boolean; // true면 다음 날짜 국가가 달라도 이 날은 국가 1개만 표시
  nextCountry: string | null; // 다음 날짜 국가(현재와 다를 때만) — 이동 표시 토글에 사용
  explicit: boolean; // true면 자동 감지/soloDay 토글 대신, 명시적으로 지정한 표시를 그대로 씀
  movingCountryColumn: boolean; // true면 오른쪽(이동국가) 칸 방식 — 앱에서 추가/제거 가능
}

export interface Itinerary {
  sheetTitle: string;
  days: DayColumn[];
  timeSlots: string[]; // "4:00 AM" ~ "9:00 PM", 30분 단위
  tasks: ItineraryTask[];
  categoryColors: Record<TaskCategory, string>;
  revision: string;
}
