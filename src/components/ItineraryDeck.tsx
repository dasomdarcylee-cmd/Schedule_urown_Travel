"use client";

import { useEffect, useRef, useState } from "react";
import type { Itinerary, ItineraryTask } from "@/lib/itinerary/types";
import { CATEGORY_COLOR, CATEGORY_LABEL } from "@/lib/itinerary/types";
import { findTodayDayIndex } from "@/lib/itinerary/timezone";
import { DayCard } from "./DayCard";
import { TaskEditModal } from "./TaskEditModal";

const POLL_INTERVAL_MS = 20_000;

export function ItineraryDeck({ itinerary: initialItinerary }: { itinerary: Itinerary }) {
  const deckRef = useRef<HTMLDivElement>(null);
  const [itinerary, setItinerary] = useState(initialItinerary);
  const [now, setNow] = useState(() => new Date());
  const [editingTask, setEditingTask] = useState<ItineraryTask | null>(null);
  const revisionRef = useRef(initialItinerary.revision);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      if (document.hidden) return;
      try {
        const res = await fetch("/api/itinerary", { cache: "no-store" });
        if (!res.ok) return;
        const fresh = (await res.json()) as Itinerary;
        if (!cancelled && fresh.revision !== revisionRef.current) {
          revisionRef.current = fresh.revision;
          setItinerary(fresh);
        }
      } catch {
        // 폴링 실패는 조용히 무시하고 다음 주기에 재시도
      }
    }

    const id = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    const todayIndex = findTodayDayIndex(itinerary.days, now) ?? itinerary.days[0]?.dayIndex;
    const el = deckRef.current;
    if (!el || todayIndex == null) return;
    const target = el.children[todayIndex - 1] as HTMLElement | undefined;
    target?.scrollIntoView({ behavior: "instant" as ScrollBehavior, inline: "start" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tasksByDay = new Map<number, ItineraryTask[]>();
  for (const task of itinerary.tasks) {
    const list = tasksByDay.get(task.dayIndex) ?? [];
    list.push(task);
    tasksByDay.set(task.dayIndex, list);
  }

  function scrollByCard(dir: 1 | -1) {
    const el = deckRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth, behavior: "smooth" });
  }

  async function handleSaveEdit(edit: {
    originalEndSlot: number;
    startSlot: number;
    endSlot: number;
    text: string;
    cost: number | null;
    category: ItineraryTask["category"];
  }) {
    if (!editingTask) return;
    const res = await fetch(`/api/itinerary/tasks/${editingTask.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(edit),
    });
    if (!res.ok) throw new Error("저장 실패");

    // 낙관적 업데이트: 서버 재조회 없이 화면에 바로 반영, 다음 폴링에서 실제 값으로 보정됨
    setItinerary((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === editingTask.id
          ? { ...t, startSlot: edit.startSlot, endSlot: edit.endSlot, text: edit.text, cost: edit.cost, category: edit.category }
          : t
      ),
    }));
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-3 px-3 py-2">
        <div className="flex gap-2.5 text-xs font-semibold text-[#9c8a7c]">
          {Object.entries(CATEGORY_LABEL)
            .filter(([key]) => key !== "other")
            .map(([key, label]) => (
              <span key={key} className="flex items-center gap-1">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: CATEGORY_COLOR[key as keyof typeof CATEGORY_COLOR] }}
                />
                {label}
              </span>
            ))}
        </div>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => scrollByCard(-1)}
            className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#ff9a62] shadow-[0_4px_10px_rgba(255,154,98,0.25)]"
          >
            ← 이전
          </button>
          <button
            type="button"
            onClick={() => scrollByCard(1)}
            className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#ff9a62] shadow-[0_4px_10px_rgba(255,154,98,0.25)]"
          >
            다음 →
          </button>
        </div>
      </div>

      <div
        ref={deckRef}
        className="flex flex-1 snap-x snap-mandatory overflow-x-auto overflow-y-auto"
      >
        {itinerary.days.map((day) => (
          <DayCard
            key={day.dayIndex}
            day={day}
            timeSlots={itinerary.timeSlots}
            tasks={tasksByDay.get(day.dayIndex) ?? []}
            now={now}
            onTaskClick={setEditingTask}
          />
        ))}
      </div>

      {editingTask && (
        <TaskEditModal
          task={editingTask}
          timeSlots={itinerary.timeSlots}
          onClose={() => setEditingTask(null)}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
}
