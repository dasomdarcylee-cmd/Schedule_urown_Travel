"use client";

import { useState } from "react";
import type { ItineraryTask, TaskCategory } from "@/lib/itinerary/types";
import { CATEGORY_COLOR, CATEGORY_LABEL } from "@/lib/itinerary/types";

export function TaskEditModal({
  task,
  onClose,
  onSave,
}: {
  task: ItineraryTask;
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
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave({
        originalEndSlot: task.endSlot,
        startSlot: task.startSlot,
        endSlot: task.endSlot,
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
