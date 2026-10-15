import type { BookmarkItem } from "../types";

export const COLUMN_COUNT = 3;

const COLUMN_ID_RE = /^col-(\d+)$/;

export const columnDropId = (col: number) => `col-${col}`;

export function parseColumnDropId(id: string): number | null {
  const m = COLUMN_ID_RE.exec(id);
  if (!m) return null;
  const col = Number(m[1]);
  return col < COLUMN_COUNT ? col : null;
}

function isValidColumn(col: unknown): col is number {
  return typeof col === "number" && Number.isInteger(col) && col >= 0 && col < COLUMN_COUNT;
}

/** column 값이 없는 최상위 폴더에 예전 배치(폴더 순번 % 열 개수)대로 열을 채운다. */
export function normalizeColumns(tree: BookmarkItem[]): BookmarkItem[] {
  let folderIndex = 0;
  return tree.map((item) => {
    if (item.type !== "folder") return item;
    const idx = folderIndex++;
    return isValidColumn(item.column) ? item : { ...item, column: idx % COLUMN_COUNT };
  });
}

/** 최상위 폴더가 가장 적은 열 (동률이면 왼쪽 열). 새 컬럼을 넣을 위치로 쓴다. */
export function lightestColumn(tree: BookmarkItem[]): number {
  const counts = Array<number>(COLUMN_COUNT).fill(0);
  for (const item of tree) {
    if (item.type === "folder" && isValidColumn(item.column)) counts[item.column]++;
  }
  return counts.indexOf(Math.min(...counts));
}
