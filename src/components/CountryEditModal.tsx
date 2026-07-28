"use client";

import { useState } from "react";
import { COUNTRY_ICON_OPTIONS, splitCountryLabel, joinCountryLabel } from "@/lib/itinerary/countryEmoji";
import type { CountryIconOption } from "@/lib/itinerary/countryEmoji";
import { CountryIconSwatch } from "./CountryIconSwatch";

const FIELD_CLASS =
  "mt-1 w-full rounded-xl border border-[#ffe1c2] bg-[#fff9f2] px-3 py-1.5 text-sm text-[#3a2e27] focus:border-[#ff9a62] focus:outline-none";
const LABEL_CLASS = "block text-xs font-bold text-[#9c8a7c]";

// 산토리니 옵션은 어울리는 이모지가 없어서, 파란 돔+하얀 벽 느낌의 스와치를 대신 쓴다.
// 이 스와치는 목록뿐 아니라 헤더 제목에도 동일하게 표시된다.
function OptionGlyph({ option }: { option: CountryIconOption }) {
  if (option.kind === "swatch") {
    return <CountryIconSwatch size={18} />;
  }
  return <span className="text-base leading-none">{option.value}</span>;
}

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
  const [iconKey, setIconKey] = useState<string>(initial.iconKey ?? "");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedOption = COUNTRY_ICON_OPTIONS.find((o) => o.key === iconKey);

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave(joinCountryLabel(iconKey || null, name.trim()));
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

        <div className="relative mb-4">
          <span className={LABEL_CLASS}>대표 아이콘</span>
          <button
            type="button"
            onClick={() => setPickerOpen((v) => !v)}
            className={`${FIELD_CLASS} flex items-center justify-between text-left`}
          >
            <span className="flex items-center gap-2">
              {selectedOption ? <OptionGlyph option={selectedOption} /> : <span>📍</span>}
              {selectedOption
                ? selectedOption.label.replace(/^\S+\s/, "")
                : "기본(선택 안 함)"}
            </span>
            <span className="text-[#c7b8ab]">▾</span>
          </button>

          {pickerOpen && (
            <div className="absolute inset-x-0 top-full z-10 mt-1 max-h-56 overflow-y-auto rounded-xl border border-[#ffe1c2] bg-white shadow-lg">
              <button
                type="button"
                onClick={() => {
                  setIconKey("");
                  setPickerOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[#fff6ec]"
              >
                <span>📍</span> 기본(선택 안 함)
              </button>
              {COUNTRY_ICON_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => {
                    setIconKey(opt.key);
                    setPickerOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[#fff6ec]"
                >
                  <OptionGlyph option={opt} />
                  {opt.label.replace(/^\S+\s/, "")}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mb-4 flex h-14 items-center justify-center rounded-xl border border-dashed border-[#ffe1c2] bg-[#fff9f2]">
          {selectedOption?.kind === "swatch" ? (
            <CountryIconSwatch size={40} />
          ) : (
            <span className="text-2xl">{selectedOption?.value ?? "📍"}</span>
          )}
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
