import type { DayColumn } from "./types";
import { timeToSlotPosition } from "./timeSlots";

export const COUNTRY_TIMEZONE: Record<string, string> = {
  두바이: "Asia/Dubai",
  아테네: "Europe/Athens",
  산토리니: "Europe/Athens",
  한국: "Asia/Seoul",
};

function localDateParts(now: Date, timeZone: string) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  });
  const parts = fmt.formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "0";
  return {
    month: Number(get("month")),
    day: Number(get("day")),
    hour: Number(get("hour")) % 24,
    minute: Number(get("minute")),
  };
}

// day.date는 "8-26" 형식 (월-일). 해당 날짜에 걸린 국가들 중 하나라도 현지 날짜가
// 오늘과 일치하면 그 날이 "오늘"이다.
export function isDayToday(day: DayColumn, now = new Date()): boolean {
  const [month, dayOfMonth] = day.date.split("-").map(Number);
  return day.countries.some((country) => {
    const tz = COUNTRY_TIMEZONE[country];
    if (!tz) return false;
    const local = localDateParts(now, tz);
    return local.month === month && local.day === dayOfMonth;
  });
}

export function findTodayDayIndex(days: DayColumn[], now = new Date()): number | null {
  const match = days.find((d) => isDayToday(d, now));
  return match ? match.dayIndex : null;
}

// 오늘 카드에서 "지금" 표시줄을 그릴 그리드 위치(슬롯 인덱스, 소수 가능)를 구한다.
// 이동일처럼 국가가 2개면 먼저 매칭되는 국가의 현지시각을 쓴다.
export function nowSlotPosition(
  day: DayColumn,
  now = new Date(),
  startHour = 4,
  endHour = 21,
  stepMinutes = 30
): number | null {
  for (const country of day.countries) {
    const tz = COUNTRY_TIMEZONE[country];
    if (!tz) continue;
    const local = localDateParts(now, tz);
    const [month, dayOfMonth] = day.date.split("-").map(Number);
    if (local.month !== month || local.day !== dayOfMonth) continue;
    return timeToSlotPosition(local.hour, local.minute, startHour, endHour, stepMinutes);
  }
  return null;
}
