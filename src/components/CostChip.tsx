import type { ItineraryTask, TaskCategory } from "@/lib/itinerary/types";
import { ROW_HEIGHT } from "./TaskChip";

// 실제 시트에서 일정(왼쪽)과 금액(오른쪽)이 별도 컬럼인 것과 동일하게, 금액을 일정 칩과
// 분리된 컬럼에 표시한다. 시트 구조를 그대로 반영하기 위함 (사용자 요청).
export function CostChip({
  task,
  categoryColors,
  onClick,
}: {
  task: ItineraryTask;
  categoryColors: Record<TaskCategory, string>;
  onClick?: (task: ItineraryTask) => void;
}) {
  if (task.cost == null) return null;
  const top = task.startSlot * ROW_HEIGHT;
  const color = categoryColors[task.category];

  return (
    <button
      type="button"
      onClick={() => onClick?.(task)}
      className="absolute left-0.5 right-0.5 truncate rounded-md py-1 text-center text-[11px] font-extrabold"
      style={{ top, height: ROW_HEIGHT - 2, color }}
    >
      ${task.cost}
    </button>
  );
}
