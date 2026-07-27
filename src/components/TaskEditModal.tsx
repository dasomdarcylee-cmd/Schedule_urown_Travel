"use client";

import { useState } from "react";
import type { ItineraryTask, TaskCategory } from "@/lib/itinerary/types";
import { CATEGORY_COLOR, CATEGORY_LABEL } from "@/lib/itinerary/types";
import { formatDurationSlots } from "@/lib/itinerary/timeSlots";

const MAX_DURATION_SLOTS = 16; // 최대 8시간

export function TaskEditModal({
  task,
  timeSlots,
  onClose,
  onSave,
}: {
  task: ItineraryTask;
  timeSlots: string[];
  onClose: () => void;
  onSave: (edit: {
    originalEndSlot: number;
    startSlot: number;
    endSlot: number;
    text: string;
    cost: number | null;
    category: TaskCategory;
  }) => Promise<void>;
}) {
  const [text, setText] = useState(task.text);
  const [cost, setCost] = useState(task.cost != null ? String(task.cost) : "");
  const [category, setCategory] = useState<TaskCategory>(task.category);
  const [startSlot, setStartSlot] = useState(task.startSlot);
  const [durationSlots, setDurationSlots] = useState(task.endSlot - task.startSlot + 1);
  const [saving, setSaving] = useState(false);

  const maxDurationHere = Math.min(MAX_DURATION_SLOTS, timeSlots.length - startSlot);

  async function handleSave() {
    setSaving(true);
    try {
      const endSlot = Math.min(startSlot + durationSlots - 1, timeSlots.length - 1);
      await onSave({
        originalEndSlot: task.endSlot,
        startSlot,
        endSlot,
        text,
        cost: cost.trim() === "" ? null : Number.parseFloat(cost),
        category,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-lg bg-neutral-900 p-4 shadow-xl">
        <h2 className="mb-3 text-sm font-semibold text-neutral-300">일정 수정</h2>

        <label className="mb-2 block text-xs text-neutral-400">
          내용
          <input
            className="mt-1 w-full rounded border border-neutral-700 bg-neutral-800 px-2 py-1 text-sm text-neutral-100"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </label>

        <div className="mb-2 flex gap-2">
          <label className="block flex-1 text-xs text-neutral-400">
            시작 시간
            <select
              className="mt-1 w-full rounded border border-neutral-700 bg-neutral-800 px-2 py-1 text-sm text-neutral-100"
              value={startSlot}
              onChange={(e) => setStartSlot(Number(e.target.value))}
            >
              {timeSlots.map((label, i) => (
                <option key={i} value={i}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="block flex-1 text-xs text-neutral-400">
            소요시간
            <select
              className="mt-1 w-full rounded border border-neutral-700 bg-neutral-800 px-2 py-1 text-sm text-neutral-100"
              value={durationSlots}
              onChange={(e) => setDurationSlots(Number(e.target.value))}
            >
              {Array.from({ length: maxDurationHere }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {formatDurationSlots(n)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="mb-2 block text-xs text-neutral-400">
          비용
          <input
            className="mt-1 w-full rounded border border-neutral-700 bg-neutral-800 px-2 py-1 text-sm text-neutral-100"
            value={cost}
            inputMode="decimal"
            placeholder="없음"
            onChange={(e) => setCost(e.target.value)}
          />
        </label>

        <div className="mb-4">
          <span className="block text-xs text-neutral-400">카테고리</span>
          <div className="mt-1 flex gap-2">
            {(Object.keys(CATEGORY_LABEL) as TaskCategory[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setCategory(key)}
                className="flex items-center gap-1 rounded border px-2 py-1 text-xs"
                style={{
                  borderColor: category === key ? CATEGORY_COLOR[key] : "#404040",
                  color: category === key ? CATEGORY_COLOR[key] : "#a3a3a3",
                }}
              >
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: CATEGORY_COLOR[key] }}
                />
                {CATEGORY_LABEL[key]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded px-3 py-1.5 text-sm text-neutral-400"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}
