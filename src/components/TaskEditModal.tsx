"use client";

import { useState } from "react";
import type { ItineraryTask, TaskCategory } from "@/lib/itinerary/types";
import { CATEGORY_COLOR, CATEGORY_LABEL } from "@/lib/itinerary/types";
import { formatDurationSlots } from "@/lib/itinerary/timeSlots";

const MAX_DURATION_SLOTS = 16; // 최대 8시간
const FIELD_CLASS =
  "mt-1 w-full rounded-xl border border-[#ffe1c2] bg-[#fff9f2] px-3 py-1.5 text-sm text-[#3a2e27] focus:border-[#ff9a62] focus:outline-none";
const LABEL_CLASS = "block text-xs font-bold text-[#9c8a7c]";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3a2e27]/40 p-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl">
        <h2 className="mb-3 font-[family-name:var(--font-heading)] text-lg font-extrabold text-[#3a2e27]">
          ✏️ 일정 수정
        </h2>

        <label className={`mb-2 ${LABEL_CLASS}`}>
          내용
          <input className={FIELD_CLASS} value={text} onChange={(e) => setText(e.target.value)} />
        </label>

        <div className="mb-2 flex gap-2">
          <label className={`flex-1 ${LABEL_CLASS}`}>
            시작 시간
            <select
              className={FIELD_CLASS}
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

          <label className={`flex-1 ${LABEL_CLASS}`}>
            소요시간
            <select
              className={FIELD_CLASS}
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

        <label className={`mb-2 ${LABEL_CLASS}`}>
          비용
          <input
            className={FIELD_CLASS}
            value={cost}
            inputMode="decimal"
            placeholder="없음"
            onChange={(e) => setCost(e.target.value)}
          />
        </label>

        <div className="mb-4">
          <span className={LABEL_CLASS}>카테고리</span>
          <div className="mt-1 flex gap-2">
            {(Object.keys(CATEGORY_LABEL) as TaskCategory[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setCategory(key)}
                className="flex items-center gap-1 rounded-full border-2 px-2.5 py-1 text-xs font-bold"
                style={{
                  borderColor: category === key ? CATEGORY_COLOR[key] : "#ffe1c2",
                  color: category === key ? CATEGORY_COLOR[key] : "#9c8a7c",
                  backgroundColor: category === key ? `${CATEGORY_COLOR[key]}1a` : "transparent",
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
            className="rounded-full px-3 py-1.5 text-sm font-bold text-[#9c8a7c]"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-full bg-[#ff9a62] px-4 py-1.5 text-sm font-bold text-white shadow-[0_4px_10px_rgba(255,154,98,0.35)] disabled:opacity-50"
          >
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}
