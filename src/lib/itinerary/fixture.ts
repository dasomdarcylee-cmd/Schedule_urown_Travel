import { generateTimeSlots } from "./timeSlots";
import type { DayColumn, Itinerary, ItineraryTask, TaskCategory } from "./types";
import { CATEGORY_COLOR } from "./types";

// 실제 "Travel Schedule" 구글시트(Dubai and Greece 탭)를 읽어 확인한 구조를 바탕으로 만든
// 개발용 목업 데이터. 요일/날짜/국가/이동일 구성은 실제 시트와 일치하지만, 시간대별 세부
// 일정은 UI 개발을 위한 예시일 뿐 100% 그대로는 아님 — 실제 데이터는 Sheets API 연동
// (src/lib/sheets/itinerary.ts, 5단계)에서 대체된다.

const TIME_SLOTS = generateTimeSlots(4, 21, 30);

function slot(hour: number, minute: 0 | 30): number {
  return (hour * 60 + minute - 4 * 60) / 30;
}

const DAYS: DayColumn[] = [
  { dayIndex: 1, date: "8-26", weekday: "Wed", countries: ["두바이"] },
  { dayIndex: 2, date: "8-27", weekday: "Thu", countries: ["두바이"] },
  { dayIndex: 3, date: "8-28", weekday: "Fri", countries: ["두바이", "아테네"] },
  { dayIndex: 4, date: "8-29", weekday: "Sat", countries: ["아테네"] },
  { dayIndex: 5, date: "8-30", weekday: "Sun", countries: ["아테네", "산토리니"] },
  { dayIndex: 6, date: "8-31", weekday: "Mon", countries: ["산토리니"] },
  { dayIndex: 7, date: "9-1", weekday: "Tue", countries: ["산토리니"] },
  { dayIndex: 8, date: "9-2", weekday: "Wed", countries: ["산토리니", "아테네"] },
  { dayIndex: 9, date: "9-3", weekday: "Thu", countries: ["아테네"] },
  { dayIndex: 10, date: "9-4", weekday: "Fri", countries: ["아테네", "한국"] },
  { dayIndex: 11, date: "9-5", weekday: "Sat", countries: ["한국"] },
];

function task(
  dayIndex: number,
  start: [number, 0 | 30],
  end: [number, 0 | 30],
  text: string,
  category: TaskCategory,
  cost: number | null = null
): ItineraryTask {
  const startSlot = slot(start[0], start[1]);
  return {
    id: `${dayIndex}:${startSlot}`,
    dayIndex,
    startSlot,
    endSlot: slot(end[0], end[1]),
    text,
    cost,
    category,
  };
}

const TASKS: ItineraryTask[] = [
  task(1, [19, 0], [19, 30], "Emirates 200 (인천→두바이, 9h30m)", "transport", 200),
  task(2, [4, 0], [4, 30], "두바이 도착 (4:25)", "transport"),
  task(2, [6, 30], [8, 0], "City 투어", "tour"),
  task(2, [18, 30], [19, 0], "Tribes", "food"),
  task(3, [8, 0], [8, 30], "Delphi", "tour"),
  task(3, [14, 0], [14, 30], "사막투어 이동", "transport"),
  task(3, [16, 0], [16, 30], "두바이 출발 (16:20)", "transport"),
  task(3, [16, 30], [17, 0], "아테네행 5시간 비행", "transport"),
  task(3, [20, 0], [20, 30], "아테네 도착 (20:25), Welcome Pickups", "food"),
  task(4, [17, 0], [17, 30], "아크로폴리스", "tour"),
  task(5, [9, 0], [9, 30], "카페", "food"),
  task(5, [13, 0], [13, 30], "이동 (페리 선착장)", "transport"),
  task(6, [7, 0], [7, 30], "Ferry (7:00)", "transport"),
  task(6, [12, 0], [12, 30], "산토리니 도착 (12:00)", "transport"),
  task(6, [13, 0], [13, 30], "숙소 Check in", "food"),
  task(6, [14, 0], [15, 0], "Akrotiri Daily Cruise", "tour"),
  task(7, [10, 0], [10, 30], "산토리니 투어 - 초이", "tour"),
  task(7, [15, 0], [15, 30], "Three Bells of Fira", "tour"),
  task(7, [16, 0], [16, 30], "Imerovigli", "tour"),
  task(8, [8, 0], [8, 30], "메테오라", "tour"),
  task(8, [8, 30], [9, 0], "Ferry (8:10)", "transport"),
  task(8, [9, 0], [9, 30], "카페", "food"),
  task(8, [13, 30], [14, 0], "아테네 도착 (13:50)", "transport"),
  task(9, [15, 0], [15, 30], "수니온곶", "tour"),
  task(10, [8, 0], [8, 30], "경유 준비 (2:20~17:05)", "transport"),
  task(10, [20, 0], [20, 30], "Qatar 139 (아테네→한국 경유)", "transport", 139),
  task(11, [4, 0], [4, 30], "경유", "transport"),
  task(11, [17, 0], [17, 30], "한국 도착 (17:05)", "transport"),
];

export const tripFixture: Itinerary = {
  sheetTitle: "Dubai and Greece",
  days: DAYS,
  timeSlots: TIME_SLOTS,
  tasks: TASKS,
  categoryColors: CATEGORY_COLOR,
  revision: "fixture-v1",
};
