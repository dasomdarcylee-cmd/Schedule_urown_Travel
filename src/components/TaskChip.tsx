import type { ItineraryTask, TaskCategory } from "@/lib/itinerary/types";

const ROW_HEIGHT = 28;

export function TaskChip({
  task,
  categoryColors,
  onClick,
}: {
  task: ItineraryTask;
  categoryColors: Record<TaskCategory, string>;
  onClick?: (task: ItineraryTask) => void;
}) {
  const top = task.startSlot * ROW_HEIGHT;
  const height = (task.endSlot - task.startSlot + 1) * ROW_HEIGHT - 2;
  const color = categoryColors[task.category];

  return (
    <button
      type="button"
      onClick={() => onClick?.(task)}
      className="absolute left-1 right-1 rounded-xl px-2 py-1 text-left text-xs leading-tight text-white shadow-[0_2px_4px_rgba(0,0,0,0.12)] overflow-hidden"
      style={{ top, height, minHeight: ROW_HEIGHT - 2, backgroundColor: color }}
    >
      <div className="font-bold truncate">{task.text}</div>
    </button>
  );
}

export { ROW_HEIGHT };
