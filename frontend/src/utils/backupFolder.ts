// File System Access API (Chrome/Edge). lib.dom에 타입이 없어서 쓰는 부분만 직접 선언한다.

type PermissionMode = { mode: "readwrite" };

type FsWritable = { write(data: string): Promise<void>; close(): Promise<void> };

export type DirHandle = {
  kind: "directory";
  name: string;
  queryPermission(desc: PermissionMode): Promise<PermissionState>;
  requestPermission(desc: PermissionMode): Promise<PermissionState>;
  getFileHandle(name: string, opts: { create: boolean }): Promise<{ createWritable(): Promise<FsWritable> }>;
  removeEntry(name: string): Promise<void>;
  entries(): AsyncIterableIterator<[string, { kind: "file" | "directory" }]>;
};

type WindowWithPicker = Window & {
  showDirectoryPicker?: (opts?: { mode?: "readwrite" }) => Promise<DirHandle>;
};

export const isFolderBackupSupported = () => typeof (window as WindowWithPicker).showDirectoryPicker === "function";

export async function pickBackupFolder(): Promise<DirHandle | null> {
  try {
    return await (window as WindowWithPicker).showDirectoryPicker!({ mode: "readwrite" });
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") return null; // 사용자가 취소
    throw e;
  }
}

export async function hasWritePermission(handle: DirHandle): Promise<boolean> {
  return (await handle.queryPermission({ mode: "readwrite" })) === "granted";
}

/** 사용자 클릭 안에서 호출해야 권한 창이 뜬다. */
export async function ensureWritePermission(handle: DirHandle): Promise<boolean> {
  if (await hasWritePermission(handle)) return true;
  return (await handle.requestPermission({ mode: "readwrite" })) === "granted";
}

// ── 폴더 핸들 보관 (IndexedDB) ────────────────────────────────

const DB_NAME = "homeboard";
const STORE = "handles";
const HANDLE_KEY = "backup-folder";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function withStore<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const req = run(db.transaction(STORE, mode).objectStore(STORE));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } finally {
    db.close();
  }
}

export async function loadStoredFolder(): Promise<DirHandle | null> {
  try {
    return ((await withStore("readonly", (s) => s.get(HANDLE_KEY))) as DirHandle | undefined) ?? null;
  } catch {
    return null;
  }
}

export const storeFolder = (handle: DirHandle) => withStore("readwrite", (s) => s.put(handle, HANDLE_KEY));

export const clearStoredFolder = () => withStore("readwrite", (s) => s.delete(HANDLE_KEY));

// ── 백업 파일 쓰기 ────────────────────────────────────────────

// 직접 내보낸 bookmarks_*.json 파일을 지우지 않도록 자동 백업만의 접두사를 쓴다.
const BACKUP_PREFIX = "homeboard-backup_";

/** 백업 파일을 쓰고, 오래된 자동 백업을 최근 keep개만 남기고 삭제한다. */
export async function writeBackup(handle: DirHandle, json: string, keep: number): Promise<string> {
  const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const fileName = `${BACKUP_PREFIX}${ts}.json`;

  const file = await handle.getFileHandle(fileName, { create: true });
  const writable = await file.createWritable();
  await writable.write(json);
  await writable.close();

  const names: string[] = [];
  for await (const [name, entry] of handle.entries()) {
    if (entry.kind === "file" && name.startsWith(BACKUP_PREFIX) && name.endsWith(".json")) names.push(name);
  }
  names.sort(); // 이름에 ISO 시각이 들어 있어 사전순 = 시간순
  for (const old of names.slice(0, Math.max(0, names.length - Math.max(1, keep)))) {
    await handle.removeEntry(old);
  }
  return fileName;
}
