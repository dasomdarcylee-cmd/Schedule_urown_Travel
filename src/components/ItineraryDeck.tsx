"use client";

import { useEffect, useRef, useState } from "react";
import type { Itinerary, ItineraryTask } from "@/lib/itinerary/types";
import { CATEGORY_COLOR, CATEGORY_LABEL } from "@/lib/itinerary/types";
import { findTodayDayIndex } from "@/lib/itinerary/timezone";
import { countryDisplayLabel } from "@/lib/itinerary/countryEmoji";
import { DayCard } from "./DayCard";
import { TaskEditModal } from "./TaskEditModal";
import { CountryEditModal } from "./CountryEditModal";

const POLL_INTERVAL_MS = 20_000;

export function ItineraryDeck({ itinerary: initialItinerary }: { itinerary: Itinerary }) {
  const deckRef = useRef<HTMLDivElement>(null);
  const [itinerary, setItinerary] = useState(initialItinerary);
  const [now, setNow] = useState(() => new Date());
  const [editingTask, setEditingTask] = useState<ItineraryTask | null>(null);
  const [editingCountry, setEditingCountry] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
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

  // 초기 진입 시 "오늘" 카드로 스크롤 + 상단 제목의 활성 인덱스도 맞춰둔다
  useEffect(() => {
    const todayDayIndex = findTodayDayIndex(itinerary.days, now) ?? itinerary.days[0]?.dayIndex;
    const idx = itinerary.days.findIndex((d) => d.dayIndex === todayDayIndex);
    const el = deckRef.current;
    if (!el) return;
    if (idx > 0) {
      const target = el.children[idx] as HTMLElement | undefined;
      target?.scrollIntoView({ behavior: "instant" as ScrollBehavior, inline: "start" });
    }
    setActiveIndex(Math.max(idx, 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 가로 스크롤 위치만 보고 "지금 보고 있는 날"을 계산 — 세로 스크롤은 각 카드 내부에서만
  // 일어나므로 여기엔 영향을 주지 않는다.
  function handleDeckScroll() {
    const el = deckRef.current;
    if (!el) return;
    const width = el.clientWidth || 1;
    const idx = Math.round(el.scrollLeft / width);
    setActiveIndex(Math.min(Math.max(idx, 0), itinerary.days.length - 1));
  }

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

  async function handleSaveCountry(newRaw: string) {
    if (!editingCountry) return;
    const oldRaw = editingCountry;
    const res = await fetch("/api/itinerary/countries", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ oldRaw, newRaw }),
    });
    if (!res.ok) throw new Error("저장 실패");

    // 같은 국가가 여러 날에 걸쳐 등장하면 전부 함께 바뀐다 (서버와 동일한 규칙)
    setItinerary((prev) => ({
      ...prev,
      days: prev.days.map((d) => ({
        ...d,
        countries: d.countries.map((c) => (c === oldRaw ? newRaw : c)),
      })),
    }));
  }

  const activeDay = itinerary.days[activeIndex];

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

      {/* 스와이프해도 이 제목 영역은 고정, 텍스트만 현재 보고 있는 날짜의 국가로 바뀐다 */}
      {activeDay && (
        <header className="flex items-baseline justify-between px-3 pb-2">
          <div className="flex items-baseline gap-1 font-[family-name:var(--font-heading)] text-xl font-extrabold text-[#3a2e27]">
            {activeDay.countries.map((c, i) => (
              <span key={c} className="flex items-baseline gap-1">
                {i > 0 && <span className="text-[#c7b8ab]">→</span>}
                <button type="button" onClick={() => setEditingCountry(c)} className="active:opacity-60">
                  {countryDisplayLabel(c)}
                </button>
              </span>
            ))}
          </div>
          <div className="text-right text-sm font-semibold text-[#9c8a7c]">
            <div>
              {activeDay.date} ({activeDay.weekday})
            </div>
            <div className="mt-0.5 inline-block rounded-full bg-[#ff9a62] px-2 py-0.5 text-[11px] text-white">
              {activeDay.dayIndex}일차
            </div>
          </div>
        </header>
      )}

      <div
        ref={deckRef}
        onScroll={handleDeckScroll}
        className="flex flex-1 snap-x snap-mandatory overflow-x-auto overflow-y-hidden"
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

      {editingCountry && (
        <CountryEditModal
          rawLabel={editingCountry}
          onClose={() => setEditingCountry(null)}
          onSave={handleSaveCountry}
        />
      )}
    </div>
  );
}
