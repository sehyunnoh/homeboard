import type { BookmarkFolder, BookmarkItem, BookmarkLink } from "../types";
import { LinkNode } from "./LinkNode";

type Props = {
  item: BookmarkFolder;
  onToggle: (id: string) => void;
  onAddFolder: (parentId: string) => void;
  onAddLink: (parentId: string) => void;
  onEdit: (item: BookmarkItem) => void;
  onDelete: (id: string) => void;
};

export function FolderNode({ item, onToggle, onAddFolder, onAddLink, onEdit, onDelete }: Props) {
  return (
    <div>
      <div className="flex items-center group">
        <button
          onClick={() => onToggle(item.id)}
          className="flex items-center gap-1.5 flex-1 min-w-0 px-2 py-1.5 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors text-sm font-medium"
        >
          <span className="text-xs">{item.isOpen ? "▾" : "▸"}</span>
          <span className="truncate">{item.name}</span>
        </button>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity pr-1">
          <button
            onClick={() => onAddFolder(item.id)}
            title="폴더 추가"
            className="p-1 rounded text-slate-400 hover:bg-slate-100 hover:text-slate-700 text-xs"
          >
            📁
          </button>
          <button
            onClick={() => onAddLink(item.id)}
            title="링크 추가"
            className="p-1 rounded text-slate-400 hover:bg-slate-100 hover:text-slate-700 text-xs"
          >
            🔗
          </button>
          <button
            onClick={() => onEdit(item)}
            title="수정"
            className="p-1 rounded text-slate-400 hover:bg-slate-100 hover:text-slate-700 text-xs"
          >
            ✏️
          </button>
          <button
            onClick={() => onDelete(item.id)}
            title="삭제"
            className="p-1 rounded text-slate-400 hover:bg-slate-100 hover:text-red-500 text-xs"
          >
            🗑️
          </button>
        </div>
      </div>

      {item.isOpen && (
        <div className="ml-4 mt-0.5 border-l border-slate-200 pl-2 flex flex-col gap-0.5">
          {item.children.map((child) => (
            <TreeItem
              key={child.id}
              item={child}
              onToggle={onToggle}
              onAddFolder={onAddFolder}
              onAddLink={onAddLink}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TreeItem({
  item,
  onToggle,
  onAddFolder,
  onAddLink,
  onEdit,
  onDelete,
}: {
  item: BookmarkItem;
  onToggle: (id: string) => void;
  onAddFolder: (parentId: string) => void;
  onAddLink: (parentId: string) => void;
  onEdit: (item: BookmarkItem) => void;
  onDelete: (id: string) => void;
}) {
  if (item.type === "folder") {
    return (
      <FolderNode
        item={item}
        onToggle={onToggle}
        onAddFolder={onAddFolder}
        onAddLink={onAddLink}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );
  }
  return (
    <LinkNode
      item={item as BookmarkLink}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  );
}
