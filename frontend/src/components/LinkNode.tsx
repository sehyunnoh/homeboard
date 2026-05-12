import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { BookmarkItem, BookmarkLink } from "../types";

type Props = {
  item: BookmarkLink;
  onEdit: (item: BookmarkItem) => void;
  onDelete: (id: string) => void;
};

export function LinkNode({ item, onEdit, onDelete }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center group">
      <span
        {...attributes}
        {...listeners}
        className="opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 select-none px-1 text-xs transition-opacity"
      >
        ⠿
      </span>
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 flex-1 min-w-0 px-3 py-1.5 rounded-md text-slate-600 hover:bg-blue-50 hover:text-blue-700 transition-colors text-sm"
        style={{ color: item.textColor, backgroundColor: item.bgColor, fontWeight: item.fontWeight ?? "bold", fontSize: item.fontSize }}
      >
        <img
          src={item.favicon ?? `https://www.google.com/s2/favicons?domain=${new URL(item.url).hostname}`}
          alt=""
          className="w-4 h-4 flex-shrink-0"
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
        />
        <span className="truncate">{item.name}</span>
      </a>
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity pr-1">
        <button onClick={() => onEdit(item)} title="Edit" className="p-1 rounded text-slate-400 hover:bg-slate-100 hover:text-slate-700 text-xs">✏️</button>
        <button onClick={() => onDelete(item.id)} title="Delete" className="p-1 rounded text-slate-400 hover:bg-slate-100 hover:text-red-500 text-xs">🗑️</button>
      </div>
    </div>
  );
}
