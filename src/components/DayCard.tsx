import type { DayColumn, ItineraryTask } from "@/lib/itinerary/types";
import { isDayToday, nowSlotPosition } from "@/lib/itinerary/timezone";
import { countryLabel } from "@/lib/itinerary/countryEmoji";
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
        <div className="font-[family-name:var(--font-heading)] text-xl font-extrabold text-[#3a2e27]">
          {day.countries.map((c) => countryLabel(c)).join(" → ")}
        </div>
        <div className="text-right text-sm font-semibold text-[#9c8a7c]">
          <div>
            {day.date} ({day.weekday})
          </div>
          <div className="mt-0.5 inline-block rounded-full bg-[#ff9a62] px-2 py-0.5 text-[11px] text-white">
            {day.dayIndex}일차
          </div>
        </div>
      </header>

      <div className="flex overflow-hidden rounded-2xl bg-white shadow-[0_6px_16px_rgba(255,154,98,0.18)]">
        <div className="w-14 shrink-0 text-right">
          {timeSlots.map((label, i) => (
            <div
              key={label}
              className="pr-2 text-[10px] font-semibold text-[#c7b8ab]"
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
