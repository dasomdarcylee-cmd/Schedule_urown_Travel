"use client";

import { useState } from "react";
import { CURATED_COUNTRY_EMOJIS, splitCountryLabel, joinCountryLabel } from "@/lib/itinerary/countryEmoji";

const FIELD_CLASS =
  "mt-1 w-full rounded-xl border border-[#ffe1c2] bg-[#fff9f2] px-3 py-1.5 text-sm text-[#3a2e27] focus:border-[#ff9a62] focus:outline-none";
const LABEL_CLASS = "block text-xs font-bold text-[#9c8a7c]";

export function CountryEditModal({
  rawLabel,
  onClose,
  onSave,
}: {
  rawLabel: string;
  onClose: () => void;
  onSave: (newRaw: string) => Promise<void>;
}) {
  const initial = splitCountryLabel(rawLabel);
  const [name, setName] = useState(initial.name);
  const [emoji, setEmoji] = useState<string>(initial.emoji ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave(joinCountryLabel(emoji || null, name.trim()));
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3a2e27]/40 p-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl">
        <h2 className="mb-3 font-[family-name:var(--font-heading)] text-lg font-extrabold text-[#3a2e27]">
          🌍 국가 이름/아이콘 수정
        </h2>

        <label className={`mb-2 ${LABEL_CLASS}`}>
          국가 이름
          <input className={FIELD_CLASS} value={name} onChange={(e) => setName(e.target.value)} />
        </label>

        <label className={`mb-4 ${LABEL_CLASS}`}>
          대표 아이콘
          <select className={FIELD_CLASS} value={emoji} onChange={(e) => setEmoji(e.target.value)}>
            <option value="">📍 기본(선택 안 함)</option>
            {CURATED_COUNTRY_EMOJIS.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </label>

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
            disabled={saving || !name.trim()}
            className="rounded-full bg-[#ff9a62] px-4 py-1.5 text-sm font-bold text-white shadow-[0_4px_10px_rgba(255,154,98,0.35)] disabled:opacity-50"
          >
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}
