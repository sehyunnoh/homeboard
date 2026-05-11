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

const TEXT_PRESETS = [
  "#1e293b", // slate-800 (default)
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#3b82f6", // blue
  "#a855f7", // purple
  "#ec4899", // pink
  "#64748b", // gray
  "#ffffff", // white
];

const BG_PRESETS = [
  "#fef2f2", // red-50
  "#fff7ed", // orange-50
  "#fefce8", // yellow-50
  "#f0fdf4", // green-50
  "#eff6ff", // blue-50
  "#faf5ff", // purple-50
  "#fdf2f8", // pink-50
  "#f1f5f9", // slate-100
  "#1e293b", // dark
  "#000000", // black
];

function ColorField({
  label,
  presets,
  value,
  onChange,
}: {
  label: string;
  presets: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  const customRef = useRef<HTMLInputElement>(null);
  const isCustom = !!value && !presets.includes(value);

  return (
    <div>
      <span className="text-xs text-slate-500 mb-1.5 block">{label}</span>
      <div className="flex flex-wrap gap-1.5 items-center">
        {/* None */}
        <button
          type="button"
          onClick={() => onChange("")}
          title="None"
          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-slate-300 bg-white transition-all ${
            !value ? "border-slate-500 ring-2 ring-offset-1 ring-slate-400" : "border-slate-200 hover:border-slate-400"
          }`}
        >
          <span className="text-[10px] leading-none">✕</span>
        </button>

        {/* Presets */}
        {presets.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            title={color}
            className={`w-6 h-6 rounded-full border-2 transition-all ${
              value === color
                ? "border-slate-600 ring-2 ring-offset-1 ring-slate-400 scale-110"
                : "border-white hover:scale-110 hover:border-slate-300"
            }`}
            style={{ backgroundColor: color }}
          />
        ))}

        {/* Custom */}
        <label
          title="Custom color"
          className={`w-6 h-6 rounded-full border-2 cursor-pointer flex items-center justify-center overflow-hidden transition-all ${
            isCustom
              ? "border-slate-600 ring-2 ring-offset-1 ring-slate-400 scale-110"
              : "border-slate-200 hover:scale-110 hover:border-slate-300"
          }`}
          style={isCustom ? { backgroundColor: value } : undefined}
        >
          {!isCustom && (
            <span
              className="w-full h-full rounded-full"
              style={{
                background: "conic-gradient(red, yellow, lime, aqua, blue, magenta, red)",
              }}
            />
          )}
          <input
            ref={customRef}
            type="color"
            className="sr-only"
            value={isCustom ? value : "#000000"}
            onChange={(e) => onChange(e.target.value)}
          />
        </label>
      </div>
    </div>
  );
}

export function ItemModal({ config, onConfirm, onClose }: Props) {
  const isLink = config.mode === "add-link" || config.mode === "edit-link";
  const isEdit = config.mode === "edit-folder" || config.mode === "edit-link";

  const [name, setName] = useState(isEdit ? (config as { name: string }).name : "");
  const [url, setUrl] = useState(config.mode === "edit-link" ? config.url : "");
  const [textColor, setTextColor] = useState((config as { textColor?: string }).textColor ?? "");
  const [bgColor, setBgColor] = useState((config as { bgColor?: string }).bgColor ?? "");

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
    config.mode === "add-folder"  ? "Add Folder" :
    config.mode === "add-link"    ? "Add Link" :
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
          <div className="border-t border-slate-100 pt-3 flex flex-col gap-3">
            <ColorField label="Text color" presets={TEXT_PRESETS} value={textColor} onChange={setTextColor} />
            <ColorField label="Background" presets={BG_PRESETS} value={bgColor} onChange={setBgColor} />
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
