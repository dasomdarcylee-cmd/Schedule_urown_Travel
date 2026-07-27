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
    <section className="w-full shrink-0 snap-start px-3 py-3">
      <header className="mb-2 flex items-baseline justify-between">
        <div className="text-lg font-semibold">{day.countries.join(" → ")}</div>
        <div className="text-right text-sm text-neutral-400">
          <div>
            {day.date} ({day.weekday})
          </div>
          <div>{day.dayIndex}일차</div>
        </div>
      </header>

      <div className="flex rounded-lg border border-neutral-800 bg-neutral-900/40">
        <div className="w-14 shrink-0 border-r border-neutral-800 text-right">
          {timeSlots.map((label, i) => (
            <div
              key={label}
              className="pr-2 text-[10px] text-neutral-500"
              style={{ height: ROW_HEIGHT }}
            >
              {i % 2 === 0 ? label : ""}
            </div>
          ))}
        </div>

        <div className="relative flex-1" style={{ height: gridHeight }}>
          {timeSlots.map((_, i) => (
            <div
              key={i}
              className={i % 2 === 0 ? "absolute inset-x-0 border-t border-neutral-800" : ""}
              style={{ top: i * ROW_HEIGHT }}
            />
          ))}

          {tasks.map((task) => (
            <TaskChip key={task.id} task={task} onClick={onTaskClick} />
          ))}

          {nowPos != null && (
            <div
              className="absolute inset-x-0 z-10 border-t-2 border-yellow-400"
              style={{ top: nowPos * ROW_HEIGHT }}
            >
              <span className="absolute -top-2 left-0 rounded bg-yellow-400 px-1 text-[10px] font-semibold text-black">
                지금
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
