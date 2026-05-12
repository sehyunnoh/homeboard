import { useCallback, useState, useRef } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy } from "@dnd-kit/sortable";
import { useBookmarks } from "./hooks/useBookmarks";
import { FolderColumn } from "./components/FolderColumn";
import { LinkNode } from "./components/LinkNode";
import { ItemModal } from "./components/ItemModal";
import type { ModalConfig, ModalResult } from "./components/ItemModal";
import type { BookmarkItem, BookmarkFolder, BookmarkLink } from "./types";

// ── icon button ───────────────────────────────────────────────

function IconButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <div className="relative group/tip">
      <button
        onClick={onClick}
        className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-300 hover:text-slate-800 transition-colors"
      >
        {icon}
      </button>
      <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover/tip:opacity-100 transition-opacity z-50">
        {label}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
      </div>
    </div>
  );
}

const ExpandIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M4 6L8 2L12 6M4 10L8 14L12 10" />
  </svg>
);
const CollapseIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M4 2L8 6L12 2M4 14L8 10L12 14" />
  </svg>
);
const ExportIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M8 3v7M5 7l3 3 3-3M3 13h10" />
  </svg>
);
const ImportIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M8 13V6M5 9l3-3 3 3M3 3h10" />
  </svg>
);
const PlusIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M8 3v10M3 8h10" />
  </svg>
);

// ─────────────────────────────────────────────────────────────

function toEditModal(item: BookmarkItem): ModalConfig {
  if (item.type === "folder") {
    return { mode: "edit-folder", id: item.id, name: item.name, textColor: item.textColor, bgColor: item.bgColor, fontWeight: item.fontWeight, fontSize: item.fontSize };
  }
  return { mode: "edit-link", id: item.id, name: item.name, url: (item as BookmarkLink).url, textColor: item.textColor, bgColor: item.bgColor, fontWeight: item.fontWeight, fontSize: item.fontSize };
}

// ── tree helpers ──────────────────────────────────────────────

function toggleInTree(tree: BookmarkItem[], id: string): BookmarkItem[] {
  return tree.map((item) => {
    if (item.type !== "folder") return item;
    if (item.id === id) return { ...item, isOpen: !item.isOpen };
    return { ...item, children: toggleInTree(item.children, id) };
  });
}

function addToTree(tree: BookmarkItem[], parentId: string | null, newItem: BookmarkItem): BookmarkItem[] {
  if (parentId === null) return [...tree, newItem];
  return tree.map((item) => {
    if (item.type !== "folder") return item;
    if (item.id === parentId)
      return { ...item, isOpen: true, children: [...item.children, newItem] };
    return { ...item, children: addToTree(item.children, parentId, newItem) };
  });
}

function updateInTree(
  tree: BookmarkItem[],
  id: string,
  updates: Partial<BookmarkFolder> | Partial<BookmarkLink>
): BookmarkItem[] {
  return tree.map((item) => {
    if (item.id === id) return { ...item, ...updates } as BookmarkItem;
    if (item.type === "folder")
      return { ...item, children: updateInTree(item.children, id, updates) };
    return item;
  });
}

function deleteFromTree(tree: BookmarkItem[], id: string): BookmarkItem[] {
  return tree
    .filter((item) => item.id !== id)
    .map((item) => {
      if (item.type !== "folder") return item;
      return { ...item, children: deleteFromTree(item.children, id) };
    });
}

function setAllOpen(tree: BookmarkItem[], isOpen: boolean): BookmarkItem[] {
  return tree.map((item) => {
    if (item.type !== "folder") return item;
    return { ...item, isOpen, children: setAllOpen(item.children, isOpen) };
  });
}

function allOpen(tree: BookmarkItem[]): boolean {
  return tree.every((item) => {
    if (item.type !== "folder") return true;
    return item.isOpen && allOpen(item.children);
  });
}

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

// ── DnD helpers ───────────────────────────────────────────────

function findItem(tree: BookmarkItem[], id: string): BookmarkItem | null {
  for (const item of tree) {
    if (item.id === id) return item;
    if (item.type === "folder") {
      const found = findItem(item.children, id);
      if (found) return found;
    }
  }
  return null;
}

function findParentId(
  tree: BookmarkItem[],
  id: string,
  parentId: string | null = null
): string | null | undefined {
  for (const item of tree) {
    if (item.id === id) return parentId;
    if (item.type === "folder") {
      const result = findParentId(item.children, id, item.id);
      if (result !== undefined) return result;
    }
  }
  return undefined;
}

function isDescendant(tree: BookmarkItem[], sourceId: string, targetId: string): boolean {
  const source = findItem(tree, sourceId);
  if (!source || source.type !== "folder") return false;
  return !!findItem(source.children, targetId);
}

function extractItem(tree: BookmarkItem[], id: string): { tree: BookmarkItem[]; item: BookmarkItem | null } {
  let found: BookmarkItem | null = null;
  const next = tree
    .filter((item) => {
      if (item.id === id) { found = item; return false; }
      return true;
    })
    .map((item) => {
      if (item.type !== "folder") return item;
      const result = extractItem(item.children, id);
      if (result.item) found = result.item;
      return { ...item, children: result.tree };
    });
  return { tree: next, item: found };
}

function reorderInParent(tree: BookmarkItem[], activeId: string, overId: string): BookmarkItem[] {
  const ai = tree.findIndex((i) => i.id === activeId);
  const oi = tree.findIndex((i) => i.id === overId);
  if (ai !== -1 && oi !== -1) return arrayMove(tree, ai, oi);
  return tree.map((item) => {
    if (item.type !== "folder") return item;
    return { ...item, children: reorderInParent(item.children, activeId, overId) };
  });
}

function insertBefore(tree: BookmarkItem[], overId: string, newItem: BookmarkItem): BookmarkItem[] {
  for (let i = 0; i < tree.length; i++) {
    if (tree[i].id === overId) {
      return [...tree.slice(0, i), newItem, ...tree.slice(i)];
    }
  }
  return tree.map((item) => {
    if (item.type !== "folder") return item;
    return { ...item, children: insertBefore(item.children, overId, newItem) };
  });
}

function insertIntoFolder(tree: BookmarkItem[], folderId: string, newItem: BookmarkItem): BookmarkItem[] {
  return tree.map((item) => {
    if (item.id === folderId && item.type === "folder")
      return { ...item, isOpen: true, children: [...item.children, newItem] };
    if (item.type === "folder")
      return { ...item, children: insertIntoFolder(item.children, folderId, newItem) };
    return item;
  });
}

// ── component ─────────────────────────────────────────────────

export default function App() {
  const { data, save } = useBookmarks();
  const [modal, setModal] = useState<ModalConfig | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleExport = useCallback(() => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    a.download = `bookmarks_${ts}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [data]);

  const handleImport = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const parsed = JSON.parse(ev.target?.result as string);
          if (!parsed.version || !Array.isArray(parsed.tree)) {
            alert("올바른 bookmarks.json 형식이 아닙니다.");
            return;
          }
          save(parsed.tree);
        } catch {
          alert("JSON 파싱에 실패했습니다.");
        }
        e.target.value = "";
      };
      reader.readAsText(file);
    },
    [save]
  );

  const handleToggle = useCallback(
    (id: string) => save(toggleInTree(data.tree, id)),
    [data, save]
  );

  const handleModalConfirm = useCallback(
    ({ name, url, textColor, bgColor, fontWeight, fontSize }: ModalResult) => {
      if (!modal) return;
      let nextTree = data.tree;

      if (modal.mode === "add-folder") {
        nextTree = addToTree(data.tree, modal.parentId, {
          id: `folder-${makeId()}`, type: "folder", name, isOpen: true, children: [], textColor, bgColor, fontWeight, fontSize,
        });
      } else if (modal.mode === "add-link") {
        nextTree = addToTree(data.tree, modal.parentId, {
          id: `link-${makeId()}`, type: "link", name, url: url!,
          favicon: `https://www.google.com/s2/favicons?domain=${new URL(url!).hostname}`,
          textColor, bgColor, fontWeight, fontSize,
        });
      } else if (modal.mode === "edit-folder") {
        nextTree = updateInTree(data.tree, modal.id, { name, textColor, bgColor, fontWeight, fontSize });
      } else if (modal.mode === "edit-link") {
        nextTree = updateInTree(data.tree, modal.id, {
          name, url: url!,
          favicon: `https://www.google.com/s2/favicons?domain=${new URL(url!).hostname}`,
          textColor, bgColor, fontWeight, fontSize,
        });
      }

      save(nextTree);
      setModal(null);
    },
    [data, modal, save]
  );

  const handleDelete = useCallback(
    (id: string) => save(deleteFromTree(data.tree, id)),
    [data, save]
  );

  const handleDragStart = useCallback(({ active }: DragStartEvent) => {
    setActiveId(active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);
      if (!over || active.id === over.id) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      // 최상위 컬럼 재정렬
      const topIds = data.tree.filter((i) => i.type === "folder").map((i) => i.id);
      if (topIds.includes(activeId)) {
        if (topIds.includes(overId)) {
          const oi = data.tree.findIndex((i) => i.id === activeId);
          const ni = data.tree.findIndex((i) => i.id === overId);
          save(arrayMove(data.tree, oi, ni));
        }
        return;
      }

      // 자신의 하위로 드롭 방지
      if (isDescendant(data.tree, activeId, overId)) return;

      const activeItem = findItem(data.tree, activeId);
      const overItem = findItem(data.tree, overId);
      const activeParent = findParentId(data.tree, activeId);
      const overParent = findParentId(data.tree, overId);

      const droppingLinkOntoFolder =
        activeItem?.type === "link" && overItem?.type === "folder";

      if (activeParent === overParent && !droppingLinkOntoFolder) {
        // 같은 부모 → 순서 변경
        // (단, 링크를 같은 부모의 폴더 위에 드롭하는 경우는 제외)
        save(reorderInParent(data.tree, activeId, overId));
      } else if (overItem?.type === "folder") {
        // 폴더 위에 드롭 → 그 폴더 안으로 이동
        const { tree: without, item } = extractItem(data.tree, activeId);
        if (!item) return;
        save(insertIntoFolder(without, overId, item));
      } else {
        // 링크 앞에 드롭 → 앞에 삽입
        const { tree: without, item } = extractItem(data.tree, activeId);
        if (!item) return;
        save(insertBefore(without, overId, item));
      }
    },
    [data, save]
  );

  const folders = data.tree.filter((i) => i.type === "folder") as BookmarkFolder[];
  const rootLinks = data.tree.filter((i) => i.type === "link") as BookmarkLink[];
  const activeItem = activeId ? findItem(data.tree, activeId) : null;

  return (
    <div className="min-h-screen p-8">
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <h1 className="text-2xl font-semibold text-slate-800">Homeboard</h1>
        <div className="flex gap-1 ml-auto items-center">
          <IconButton
            icon={allOpen(data.tree) ? <CollapseIcon /> : <ExpandIcon />}
            label={allOpen(data.tree) ? "Collapse All" : "Expand All"}
            onClick={() => save(setAllOpen(data.tree, !allOpen(data.tree)))}
          />
          <IconButton icon={<ExportIcon />} label="Export JSON" onClick={handleExport} />
          <IconButton icon={<ImportIcon />} label="Import JSON" onClick={() => importRef.current?.click()} />
          <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
          <IconButton icon={<PlusIcon />} label="Add Column" onClick={() => setModal({ mode: "add-folder", parentId: null })} />
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <SortableContext items={folders.map((f) => f.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-3">
            {folders.map((folder) => (
              <FolderColumn
                key={folder.id}
                item={folder}
                onToggle={handleToggle}
                onAddFolder={(parentId) => setModal({ mode: "add-folder", parentId })}
                onAddLink={(parentId) => setModal({ mode: "add-link", parentId })}
                onEdit={(i) => setModal(toEditModal(i))}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </SortableContext>

        {rootLinks.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-1">
            {rootLinks.map((link) => (
              <LinkNode
                key={link.id}
                item={link}
                onEdit={(i) => setModal(toEditModal(i))}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        <DragOverlay>
          {activeItem && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 shadow-lg text-sm text-slate-700 opacity-90 max-w-xs">
              {activeItem.type === "folder" ? "📁" : "🔗"}
              <span className="truncate">{activeItem.name}</span>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {modal && (
        <ItemModal config={modal} onConfirm={handleModalConfirm} onClose={() => setModal(null)} />
      )}
    </div>
  );
}
