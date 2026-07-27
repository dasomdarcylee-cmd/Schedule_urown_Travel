import { CATEGORY_COLOR } from "@/lib/itinerary/types";
import type { ItineraryTask } from "@/lib/itinerary/types";

const ROW_HEIGHT = 28;

export function TaskChip({
  task,
  onClick,
}: {
  task: ItineraryTask;
  onClick?: (task: ItineraryTask) => void;
}) {
  const top = task.startSlot * ROW_HEIGHT;
  const height = (task.endSlot - task.startSlot + 1) * ROW_HEIGHT - 2;
  const color = CATEGORY_COLOR[task.category];

  return (
    <button
      type="button"
      onClick={() => onClick?.(task)}
      className="absolute left-1 right-1 rounded-md px-2 py-1 text-left text-xs leading-tight text-white shadow-sm overflow-hidden"
      style={{ top, height, minHeight: ROW_HEIGHT - 2, backgroundColor: color }}
    >
      <div className="font-medium truncate">{task.text}</div>
      {task.cost != null && <div className="opacity-80">${task.cost}</div>}
    </button>
  );
}

export { ROW_HEIGHT };
