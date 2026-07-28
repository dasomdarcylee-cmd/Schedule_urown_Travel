export function NoteViewer({ note, onClose }: { note: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3a2e27]/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-3 font-[family-name:var(--font-heading)] text-lg font-extrabold text-[#3a2e27]">
          ℹ️ 메모
        </h2>
        <p className="whitespace-pre-wrap text-sm text-[#3a2e27]">{note}</p>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-[#ff9a62] px-4 py-1.5 text-sm font-bold text-white shadow-[0_4px_10px_rgba(255,154,98,0.35)]"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
