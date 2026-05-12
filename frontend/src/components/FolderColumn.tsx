import { useSortable, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { BookmarkFolder, BookmarkItem, BookmarkLink } from "../types";
import { FolderNode } from "./FolderNode";
import { LinkNode } from "./LinkNode";

type Props = {
  item: BookmarkFolder;
  onToggle: (id: string) => void;
  onAddFolder: (parentId: string) => void;
  onAddLink: (parentId: string) => void;
  onEdit: (item: BookmarkItem) => void;
  onDelete: (id: string) => void;
};

export function FolderColumn({ item, onToggle, onAddFolder, onAddLink, onEdit, onDelete }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex flex-col">
      <div className="flex items-center gap-1 group">
        <span
          {...attributes}
          {...listeners}
          className="opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 select-none px-1 transition-opacity"
          title="Drag to reorder"
        >
          ⠿
        </span>
        <button
          onClick={() => onToggle(item.id)}
          className="cursor-pointer text-sm font-semibold text-slate-700 flex-1 min-w-0 text-left flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-slate-200 hover:text-slate-900 transition-colors"
          style={{ color: item.textColor, backgroundColor: item.bgColor, fontWeight: item.fontWeight ?? "bold", fontSize: item.fontSize }}
        >
          <span className="text-lg text-slate-400">{item.isOpen ? "▾" : "▸"}</span>
          <span className="truncate">{item.name}</span>
        </button>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onAddFolder(item.id)} title="Add Folder" className="p-1 rounded text-slate-400 hover:bg-slate-100 hover:text-slate-700 text-xs">📁</button>
          <button onClick={() => onAddLink(item.id)} title="Add Link" className="p-1 rounded text-slate-400 hover:bg-slate-100 hover:text-slate-700 text-xs">🔗</button>
          <button onClick={() => onEdit(item)} title="Edit" className="p-1 rounded text-slate-400 hover:bg-slate-100 hover:text-slate-700 text-xs">✏️</button>
          <button onClick={() => onDelete(item.id)} title="Delete" className="p-1 rounded text-slate-400 hover:bg-slate-100 hover:text-red-500 text-xs">🗑️</button>
        </div>
      </div>

      {item.isOpen && (
        <div className="ml-4 mt-0.5 border-l border-slate-200 pl-2 flex flex-col gap-0.5">
          <SortableContext items={item.children.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            {item.children.map((child) =>
              child.type === "folder" ? (
                <FolderNode key={child.id} item={child} onToggle={onToggle} onAddFolder={onAddFolder} onAddLink={onAddLink} onEdit={onEdit} onDelete={onDelete} />
              ) : (
                <LinkNode key={child.id} item={child as BookmarkLink} onEdit={onEdit} onDelete={onDelete} />
              )
            )}
          </SortableContext>
        </div>
      )}
    </div>
  );
}
