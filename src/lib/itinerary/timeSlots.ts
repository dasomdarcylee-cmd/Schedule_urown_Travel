// 실제 시트의 시간행 개수만큼 라벨을 생성 (끝 시각을 가정하지 않음 — 시트가 기준).
export function generateTimeSlotsByCount(startHour: number, count: number, stepMinutes = 30): string[] {
  const slots: string[] = [];
  for (let i = 0; i < count; i++) {
    const mins = startHour * 60 + i * stepMinutes;
    const h24 = Math.floor(mins / 60) % 24;
    const m = mins % 60;
    const period = h24 < 12 ? "AM" : "PM";
    const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
    slots.push(`${h12}:${m.toString().padStart(2, "0")} ${period}`);
  }
  return slots;
}

export function generateTimeSlots(startHour = 4, endHour = 21, stepMinutes = 30): string[] {
  const slots: string[] = [];
  for (let mins = startHour * 60; mins <= endHour * 60; mins += stepMinutes) {
    const h24 = Math.floor(mins / 60);
    const m = mins % 60;
    const period = h24 < 12 ? "AM" : "PM";
    const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
    slots.push(`${h12}:${m.toString().padStart(2, "0")} ${period}`);
  }
  return slots;
}

// 현재 시각(해당 타임존)을 슬롯 그리드 상의 위치(0=첫 슬롯 시작, 슬롯 인덱스 단위 소수)로 변환.
// 그리드 범위 밖이면 null.
export function timeToSlotPosition(
  hour: number,
  minute: number,
  startHour = 4,
  endHour = 21,
  stepMinutes = 30
): number | null {
  const mins = hour * 60 + minute;
  const startMins = startHour * 60;
  const endMins = endHour * 60;
  if (mins < startMins || mins > endMins) return null;
  return (mins - startMins) / stepMinutes;
}
