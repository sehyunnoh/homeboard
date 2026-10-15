export type BackupInterval = "weekly" | "monthly";

export type Settings = {
  backupEnabled: boolean;
  backupInterval: BackupInterval;
  /** 백업 폴더에 남겨 둘 최근 백업 파일 개수 */
  backupKeep: number;
  /** 마지막으로 백업한 시각 (ms) */
  lastBackupAt?: number;
};

const STORAGE_KEY = "homeboard-settings";

export const DEFAULT_SETTINGS: Settings = {
  backupEnabled: false,
  backupInterval: "monthly",
  backupKeep: 12,
};

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    // 저장소를 못 읽으면 기본값으로 시작
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: Settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // 저장 실패는 무시 (다음 변경 때 다시 시도)
  }
}

/** 마지막 백업 이후 주기가 지났는지. 백업한 적이 없으면 true. */
export function isBackupDue(lastBackupAt: number | undefined, interval: BackupInterval): boolean {
  if (!lastBackupAt) return true;
  const next = new Date(lastBackupAt);
  if (interval === "monthly") next.setMonth(next.getMonth() + 1);
  else next.setDate(next.getDate() + 7);
  return Date.now() >= next.getTime();
}
