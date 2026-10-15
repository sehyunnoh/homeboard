import { useCallback, useEffect, useRef, useState } from "react";
import type { BookmarkTree } from "../types";
import {
  clearStoredFolder,
  ensureWritePermission,
  hasWritePermission,
  loadStoredFolder,
  pickBackupFolder,
  storeFolder,
  writeBackup,
} from "../utils/backupFolder";
import type { DirHandle } from "../utils/backupFolder";
import { isBackupDue, loadSettings, saveSettings } from "../utils/settings";
import type { Settings } from "../utils/settings";

export function useBackup(data: BookmarkTree) {
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [folder, setFolder] = useState<DirHandle | null>(null);
  const [folderLoaded, setFolderLoaded] = useState(false);
  // 백업 시기가 됐지만 폴더 쓰기 권한이 풀려 있어 클릭이 필요한 상태
  const [needsAction, setNeedsAction] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startupChecked = useRef(false);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  }, []);

  useEffect(() => {
    loadStoredFolder().then((handle) => {
      setFolder(handle);
      setFolderLoaded(true);
    });
  }, []);

  /** 백업 파일을 쓴다. 실패하면 error에 이유를 남기고 false를 돌려준다. */
  const runBackup = useCallback(
    async (handle: DirHandle) => {
      setBusy(true);
      setError(null);
      try {
        await writeBackup(handle, JSON.stringify(data, null, 2), settings.backupKeep);
        updateSettings({ lastBackupAt: Date.now() });
        setNeedsAction(false);
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Backup failed.");
        return false;
      } finally {
        setBusy(false);
      }
    },
    [data, settings.backupKeep, updateSettings]
  );

  // 앱을 열었을 때 한 번: 주기가 지났으면 조용히 백업하거나, 권한이 필요하면 배너를 띄운다.
  useEffect(() => {
    if (!folderLoaded || startupChecked.current) return;
    startupChecked.current = true;
    if (!folder || !settings.backupEnabled || data.tree.length === 0) return;
    if (!isBackupDue(settings.lastBackupAt, settings.backupInterval)) return;

    hasWritePermission(folder)
      .then((granted) => {
        if (granted) runBackup(folder);
        else setNeedsAction(true);
      })
      .catch(() => setNeedsAction(true));
  }, [folderLoaded, folder, settings, data, runBackup]);

  /** 지금 백업. 클릭 핸들러에서 불러야 권한 요청 창이 뜬다. */
  const backupNow = useCallback(async () => {
    if (!folder) return;
    setError(null);
    try {
      if (!(await ensureWritePermission(folder))) {
        setError("Write access to the folder was not granted.");
        return;
      }
    } catch {
      setError("Can't access the folder. Please choose it again.");
      return;
    }
    await runBackup(folder);
  }, [folder, runBackup]);

  const chooseFolder = useCallback(async () => {
    setError(null);
    try {
      const handle = await pickBackupFolder();
      if (!handle) return;
      await storeFolder(handle);
      setFolder(handle);
      updateSettings({ backupEnabled: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't choose the folder.");
    }
  }, [updateSettings]);

  const removeFolder = useCallback(async () => {
    await clearStoredFolder();
    setFolder(null);
    setNeedsAction(false);
    updateSettings({ backupEnabled: false });
  }, [updateSettings]);

  return {
    settings,
    updateSettings,
    folderName: folder?.name ?? null,
    needsAction,
    dismissNeedsAction: () => setNeedsAction(false),
    busy,
    error,
    backupNow,
    chooseFolder,
    removeFolder,
  };
}

export type BackupApi = ReturnType<typeof useBackup>;
