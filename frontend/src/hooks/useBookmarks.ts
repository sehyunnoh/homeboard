import { useState, useCallback } from "react";
import type { BookmarkTree, BookmarkItem } from "../types";
import { normalizeColumns } from "../utils/columns";

const STORAGE_KEY = "homeboard";

function load(): BookmarkTree {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: BookmarkTree = JSON.parse(raw);
      return { ...parsed, tree: normalizeColumns(parsed.tree) };
    }
  } catch {}
  return { version: 1, tree: [] };
}

export function useBookmarks() {
  const [data, setData] = useState<BookmarkTree>(load);

  const save = useCallback((tree: BookmarkItem[]) => {
    const next: BookmarkTree = { version: 1, tree: normalizeColumns(tree) };
    setData(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  return { data, save };
}
