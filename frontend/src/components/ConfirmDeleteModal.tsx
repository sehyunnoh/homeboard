import { useEffect, useRef } from "react";

interface Props {
  name: string;
  isFolder: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDeleteModal({ name, isFolder, onConfirm, onClose }: Props) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { cancelRef.current?.focus(); }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
        <h2 className="text-base font-semibold text-slate-800 mb-2">삭제</h2>
        <p className="text-sm text-slate-600 break-words">
          "{name}"을(를) 정말 삭제할까요?
        </p>
        {isFolder && (
          <p className="text-xs text-red-500 mt-1">폴더 안의 모든 항목도 함께 삭제됩니다.</p>
        )}
        <div className="flex justify-end gap-2 mt-5">
          <button
            ref={cancelRef}
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-sm text-slate-600 hover:bg-slate-100"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className="px-3 py-1.5 rounded-lg text-sm text-white bg-red-500 hover:bg-red-600"
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  );
}
