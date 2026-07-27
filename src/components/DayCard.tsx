import type { DayColumn, ItineraryTask } from "@/lib/itinerary/types";
import { isDayToday, nowSlotPosition } from "@/lib/itinerary/timezone";
import { TaskChip, ROW_HEIGHT } from "./TaskChip";

export function DayCard({
  day,
  timeSlots,
  tasks,
  now,
  onTaskClick,
}: {
  day: DayColumn;
  timeSlots: string[];
  tasks: ItineraryTask[];
  now: Date;
  onTaskClick?: (task: ItineraryTask) => void;
}) {
  const today = isDayToday(day, now);
  const nowPos = today ? nowSlotPosition(day, now) : null;
  const gridHeight = timeSlots.length * ROW_HEIGHT;

  return (
    <section className="h-full w-full shrink-0 snap-start overflow-y-auto px-3 pb-3">
      <div className="flex overflow-hidden rounded-2xl bg-white shadow-[0_6px_16px_rgba(255,154,98,0.18)]">
        <div className="w-16 shrink-0 text-right">
          {timeSlots.map((label, i) => (
            <div
              key={label}
              className="pr-2 text-xs font-bold text-[#8a7566]"
              style={{ height: ROW_HEIGHT }}
            >
              {i % 2 === 0 ? label : ""}
            </div>
          ))}
        </div>

        <div className="relative flex-1 pr-1" style={{ height: gridHeight }}>
          {timeSlots.map((_, i) => (
            <div
              key={i}
              className={i % 2 === 0 ? "absolute inset-x-0 border-t border-dashed border-[#fbe8d4]" : ""}
              style={{ top: i * ROW_HEIGHT }}
            />
          ))}

          {tasks.map((task) => (
            <TaskChip key={task.id} task={task} onClick={onTaskClick} />
          ))}

          {nowPos != null && (
            <div
              className="absolute inset-x-0 z-10 border-t-2 border-dashed border-[#ffc94d]"
              style={{ top: nowPos * ROW_HEIGHT }}
            >
              <span className="absolute -top-2.5 left-0 rounded-full bg-[#ffc94d] px-1.5 text-[10px] font-extrabold text-[#4a3400]">
                지금
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
