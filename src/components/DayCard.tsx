import type { DayColumn, ItineraryTask, TaskCategory } from "@/lib/itinerary/types";
import { isDayToday, nowSlotPosition } from "@/lib/itinerary/timezone";
import { TaskChip, ROW_HEIGHT } from "./TaskChip";
import { CostChip } from "./CostChip";

export function DayCard({
  day,
  timeSlots,
  tasks,
  now,
  categoryColors,
  onTaskClick,
  onOpenImage,
}: {
  day: DayColumn;
  timeSlots: string[];
  tasks: ItineraryTask[];
  now: Date;
  categoryColors: Record<TaskCategory, string>;
  onTaskClick?: (task: ItineraryTask) => void;
  onOpenImage?: (url: string) => void;
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

        {/* 일정 컬럼 — 실제 시트의 왼쪽(일정) 컬럼 */}
        <div className="relative flex-1 border-r border-dashed border-[#fbe8d4]" style={{ height: gridHeight }}>
          {timeSlots.map((_, i) => (
            <div
              key={i}
              className={i % 2 === 0 ? "absolute inset-x-0 border-t border-dashed border-[#fbe8d4]" : ""}
              style={{ top: i * ROW_HEIGHT }}
            />
          ))}

          {tasks.map((task) => (
            <TaskChip
              key={task.id}
              task={task}
              categoryColors={categoryColors}
              onClick={onTaskClick}
              onOpenImage={onOpenImage}
            />
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

        {/* 금액 컬럼 — 실제 시트의 오른쪽(금액) 컬럼과 동일한 구조 */}
        <div className="relative w-14 shrink-0" style={{ height: gridHeight }}>
          {timeSlots.map((_, i) => (
            <div
              key={i}
              className={i % 2 === 0 ? "absolute inset-x-0 border-t border-dashed border-[#fbe8d4]" : ""}
              style={{ top: i * ROW_HEIGHT }}
            />
          ))}
          {tasks.map((task) => (
            <CostChip key={task.id} task={task} categoryColors={categoryColors} onClick={onTaskClick} />
          ))}
        </div>
      </div>
    </section>
  );
}
