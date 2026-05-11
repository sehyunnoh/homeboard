import { useState, useCallback } from "react";
import type { BookmarkTree, BookmarkItem } from "../types";

const STORAGE_KEY = "homeboard";

function load(): BookmarkTree {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { version: 1, tree: [] };
}

export function useBookmarks() {
  const [data, setData] = useState<BookmarkTree>(load);

  const save = useCallback((tree: BookmarkItem[]) => {
    const next: BookmarkTree = { version: 1, tree };
    setData(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  return { data, loading: false, save };
}
