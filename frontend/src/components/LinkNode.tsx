import type { BookmarkItem, BookmarkLink } from "../types";

type Props = {
  item: BookmarkLink;
  onEdit: (item: BookmarkItem) => void;
  onDelete: (id: string) => void;
};

export function LinkNode({ item, onEdit, onDelete }: Props) {
  return (
    <div className="flex items-center group">
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 flex-1 min-w-0 px-3 py-1.5 rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors text-sm"
      >
        <img
          src={item.favicon ?? `https://www.google.com/s2/favicons?domain=${new URL(item.url).hostname}`}
          alt=""
          className="w-4 h-4 flex-shrink-0"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
        <span className="truncate">{item.name}</span>
      </a>
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity pr-1">
        <button
          onClick={() => onEdit(item)}
          title="Edit"
          className="p-1 rounded text-slate-400 hover:bg-slate-100 hover:text-slate-700 text-xs"
        >
          ✏️
        </button>
        <button
          onClick={() => onDelete(item.id)}
          title="Delete"
          className="p-1 rounded text-slate-400 hover:bg-slate-100 hover:text-red-500 text-xs"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}
