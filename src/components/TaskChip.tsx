import type { ItineraryTask, TaskCategory } from "@/lib/itinerary/types";

const ROW_HEIGHT = 28;

export function TaskChip({
  task,
  categoryColors,
  onClick,
  onOpenImage,
  onOpenNote,
}: {
  task: ItineraryTask;
  categoryColors: Record<TaskCategory, string>;
  onClick?: (task: ItineraryTask) => void;
  onOpenImage?: (url: string) => void;
  onOpenNote?: (note: string) => void;
}) {
  const top = task.startSlot * ROW_HEIGHT;
  const height = (task.endSlot - task.startSlot + 1) * ROW_HEIGHT - 2;
  const color = categoryColors[task.category];

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick?.(task)}
      onKeyDown={(e) => {
        if (e.key === "Enter") onClick?.(task);
      }}
      className="absolute left-1 right-1 flex items-start gap-1 rounded-xl px-2 py-1 text-left text-xs leading-tight text-white shadow-[0_2px_4px_rgba(0,0,0,0.12)] overflow-hidden cursor-pointer"
      style={{ top, height, minHeight: ROW_HEIGHT - 2, backgroundColor: color }}
    >
      <div className="min-w-0 flex-1 font-bold truncate">{task.text}</div>
      {task.note && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenNote?.(task.note!);
          }}
          className="shrink-0 leading-none"
          aria-label="메모 보기"
        >
          ℹ️
        </button>
      )}
      {task.imageUrl && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenImage?.(task.imageUrl!);
          }}
          className="shrink-0 leading-none"
          aria-label="사진 보기"
        >
          📷
        </button>
      )}
    </div>
  );
}

export { ROW_HEIGHT };
