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
        <h2 className="text-base font-semibold text-slate-800 mb-2">Delete</h2>
        <p className="text-sm text-slate-600 break-words">
          Are you sure you want to delete "{name}"?
        </p>
        {isFolder && (
          <p className="text-xs text-red-500 mt-1">Everything inside this folder will be deleted too.</p>
        )}
        <div className="flex justify-end gap-2 mt-5">
          <button
            ref={cancelRef}
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-sm text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-3 py-1.5 rounded-lg text-sm text-white bg-red-500 hover:bg-red-600"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
