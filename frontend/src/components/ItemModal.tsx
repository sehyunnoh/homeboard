import { useState, useEffect, useRef } from "react";

export type ModalConfig =
  | { mode: "add-folder"; parentId: string | null }
  | { mode: "add-link"; parentId: string | null }
  | { mode: "edit-folder"; id: string; name: string; textColor?: string; bgColor?: string }
  | { mode: "edit-link"; id: string; name: string; url: string; textColor?: string; bgColor?: string };

export type ModalResult = {
  name: string;
  url?: string;
  textColor?: string;
  bgColor?: string;
};

type Props = {
  config: ModalConfig;
  onConfirm: (data: ModalResult) => void;
  onClose: () => void;
};

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [enabled, setEnabled] = useState(!!value);
  const DEFAULT = label === "Text color" ? "#1e293b" : "#eff6ff";

  const toggle = () => {
    if (enabled) {
      setEnabled(false);
      onChange("");
    } else {
      setEnabled(true);
      onChange(DEFAULT);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-slate-500 w-24">{label}</span>
      <input
        type="color"
        disabled={!enabled}
        value={enabled ? value || DEFAULT : DEFAULT}
        onChange={(e) => onChange(e.target.value)}
        className="w-8 h-8 rounded border border-slate-200 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
      />
      <button
        type="button"
        onClick={toggle}
        className={`text-xs px-2 py-0.5 rounded transition-colors ${
          enabled
            ? "bg-slate-200 text-slate-600 hover:bg-slate-300"
            : "bg-slate-100 text-slate-400 hover:bg-slate-200"
        }`}
      >
        {enabled ? "Reset" : "Set"}
      </button>
    </div>
  );
}

export function ItemModal({ config, onConfirm, onClose }: Props) {
  const isLink = config.mode === "add-link" || config.mode === "edit-link";
  const isEdit = config.mode === "edit-folder" || config.mode === "edit-link";

  const [name, setName] = useState(isEdit ? (config as { name: string }).name : "");
  const [url, setUrl] = useState(config.mode === "edit-link" ? config.url : "");
  const [textColor, setTextColor] = useState(
    (config as { textColor?: string }).textColor ?? ""
  );
  const [bgColor, setBgColor] = useState(
    (config as { bgColor?: string }).bgColor ?? ""
  );

  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => { nameRef.current?.focus(); }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onConfirm({
      name: name.trim(),
      url: isLink ? url.trim() : undefined,
      textColor: textColor || undefined,
      bgColor: bgColor || undefined,
    });
  };

  const title =
    config.mode === "add-folder" ? "Add Folder" :
    config.mode === "add-link"   ? "Add Link" :
    config.mode === "edit-folder" ? "Edit Folder" : "Edit Link";

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
        <h2 className="text-base font-semibold text-slate-800 mb-4">{title}</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Name</label>
            <input
              ref={nameRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter name"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-400"
            />
          </div>
          {isLink && (
            <div>
              <label className="text-xs text-slate-500 mb-1 block">URL</label>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                type="url"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-400"
              />
            </div>
          )}
          <div className="border-t border-slate-100 pt-3 flex flex-col gap-2">
            <span className="text-xs text-slate-400">Colors</span>
            <ColorField label="Text color" value={textColor} onChange={setTextColor} />
            <ColorField label="Background" value={bgColor} onChange={setBgColor} />
          </div>
          <div className="flex gap-2 justify-end mt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg text-sm text-slate-500 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg text-sm bg-slate-800 text-white hover:bg-slate-700 transition-colors"
            >
              {isEdit ? "Save" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
