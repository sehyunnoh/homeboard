import { useCallback, useState, useRef, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy } from "@dnd-kit/sortable";
import { useBookmarks } from "./hooks/useBookmarks";
import { FolderColumn } from "./components/FolderColumn";
import { LinkNode } from "./components/LinkNode";
import { ItemModal } from "./components/ItemModal";
import type { ModalConfig } from "./components/ItemModal";
import type { BookmarkItem, BookmarkFolder, BookmarkLink } from "./types";

function toEditModal(item: BookmarkItem): ModalConfig {
  if (item.type === "folder") {
    return { mode: "edit-folder", id: item.id, name: item.name };
  }
  return { mode: "edit-link", id: item.id, name: item.name, url: (item as BookmarkLink).url };
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

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

// ── component ─────────────────────────────────────────────────

export default function App() {
  const { data, loading, save } = useBookmarks();
  const [modal, setModal] = useState<ModalConfig | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [dataFilePath, setDataFilePath] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(useSensor(PointerSensor));

  useEffect(() => {
    fetch("/api/info")
      .then((r) => r.json())
      .then((d) => setDataFilePath(d.dataFile));
  }, []);

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
    (id: string) => {
      if (!data) return;
      save(toggleInTree(data.tree, id));
    },
    [data, save]
  );

  const handleModalConfirm = useCallback(
    ({ name, url }: { name: string; url?: string }) => {
      if (!data || !modal) return;
      let nextTree = data.tree;

      if (modal.mode === "add-folder") {
        nextTree = addToTree(data.tree, modal.parentId, {
          id: `folder-${makeId()}`, type: "folder", name, isOpen: true, children: [],
        });
      } else if (modal.mode === "add-link") {
        nextTree = addToTree(data.tree, modal.parentId, {
          id: `link-${makeId()}`, type: "link", name, url: url!,
          favicon: `https://www.google.com/s2/favicons?domain=${new URL(url!).hostname}`,
        });
      } else if (modal.mode === "edit-folder") {
        nextTree = updateInTree(data.tree, modal.id, { name });
      } else if (modal.mode === "edit-link") {
        nextTree = updateInTree(data.tree, modal.id, {
          name, url: url!,
          favicon: `https://www.google.com/s2/favicons?domain=${new URL(url!).hostname}`,
        });
      }

      save(nextTree);
      setModal(null);
    },
    [data, modal, save]
  );

  const handleDelete = useCallback(
    (id: string) => {
      if (!data) return;
      save(deleteFromTree(data.tree, id));
    },
    [data, save]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id || !data) return;
      const oldIndex = data.tree.findIndex((i) => i.id === active.id);
      const newIndex = data.tree.findIndex((i) => i.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;
      save(arrayMove(data.tree, oldIndex, newIndex));
    },
    [data, save]
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        Loading...
      </div>
    );
  }

  if (!data) return null;

  const folders = data.tree.filter((i) => i.type === "folder") as BookmarkFolder[];
  const rootLinks = data.tree.filter((i) => i.type === "link") as BookmarkLink[];

  return (
    <div className="min-h-screen p-8">
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <h1 className="text-2xl font-semibold text-slate-800">Homeboard</h1>
        {dataFilePath && (
          <span className="text-xs text-slate-400 font-mono">{dataFilePath}</span>
        )}
        <div className="flex gap-1 ml-auto">
          <button
            onClick={() => data && save(setAllOpen(data.tree, true))}
            className="px-3 py-1 rounded-lg text-xs bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
          >
            모두 펼치기
          </button>
          <button
            onClick={() => data && save(setAllOpen(data.tree, false))}
            className="px-3 py-1 rounded-lg text-xs bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
          >
            모두 접기
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1 rounded-lg text-xs bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
          >
            JSON 가져오기
          </button>
          <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
          {editMode && (
            <button
              onClick={() => setModal({ mode: "add-folder", parentId: null })}
              className="px-3 py-1 rounded-lg text-xs bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
            >
              + 폴더
            </button>
          )}
          <button
            onClick={() => setEditMode((v) => !v)}
            className={`px-3 py-1 rounded-lg text-xs transition-colors ${
              editMode
                ? "bg-slate-800 text-white hover:bg-slate-700"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {editMode ? "편집 완료" : "편집"}
          </button>
        </div>
      </div>

      {/* 3컬럼 그리드 */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={folders.map((f) => f.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-3 gap-6">
            {folders.map((folder) => (
              <FolderColumn
                key={folder.id}
                item={folder}
                editMode={editMode}
                onToggle={handleToggle}
                onAddFolder={(parentId) => setModal({ mode: "add-folder", parentId })}
                onAddLink={(parentId) => setModal({ mode: "add-link", parentId })}
                onEdit={(i) => setModal(toEditModal(i))}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* 루트 링크 (폴더 밖 링크) */}
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

      {modal && (
        <ItemModal config={modal} onConfirm={handleModalConfirm} onClose={() => setModal(null)} />
      )}
    </div>
  );
}
