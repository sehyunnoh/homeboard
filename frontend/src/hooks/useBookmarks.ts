import { useState, useEffect, useCallback } from "react";
import type { BookmarkTree, BookmarkItem } from "../types";

const API = "/api/bookmarks";

export function useBookmarks() {
  const [data, setData] = useState<BookmarkTree | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(API)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      });
  }, []);

  const save = useCallback((tree: BookmarkItem[]) => {
    const next: BookmarkTree = { version: 1, tree };
    setData(next);
    fetch(API, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
  }, []);

  return { data, loading, save };
}
