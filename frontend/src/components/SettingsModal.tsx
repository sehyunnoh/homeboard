import { useEffect } from "react";
import type { BackupApi } from "../hooks/useBackup";
import { isFolderBackupSupported } from "../utils/backupFolder";
import type { BackupInterval } from "../utils/settings";

type Props = {
  backup: BackupApi;
  onClose: () => void;
};

function formatDate(ms?: number) {
  return ms ? new Date(ms).toLocaleString("en-US") : "Never";
}

export function SettingsModal({ backup, onClose }: Props) {
  const { settings, updateSettings, folderName, busy, error, backupNow, chooseFolder, removeFolder } = backup;
  const supported = isFolderBackupSupported();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center mb-4">
          <h2 className="text-base font-semibold text-slate-800">Settings</h2>
          <button onClick={onClose} className="ml-auto text-slate-400 hover:text-slate-700 px-1" title="Close">✕</button>
        </div>

        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-slate-700">Automatic backup</h3>

          {!supported && (
            <p className="text-xs text-red-500">
              This browser doesn't support choosing a folder. Please use Chrome or Edge.
            </p>
          )}

          <div>
            <label className="text-xs text-slate-500 mb-1 block">Backup folder</label>
            <div className="flex items-center gap-2">
              <span className="flex-1 min-w-0 truncate border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-slate-50">
                {folderName ?? "No folder selected"}
              </span>
              <button
                onClick={chooseFolder}
                disabled={!supported}
                className="px-3 py-2 rounded-lg text-sm bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-50"
              >
                {folderName ? "Change" : "Choose folder"}
              </button>
              {folderName && (
                <button onClick={removeFolder} className="px-2 py-2 rounded-lg text-sm text-slate-400 hover:text-red-500" title="Remove folder">
                  Remove
                </button>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">For security reasons only the folder name is shown, not the full path.</p>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={settings.backupEnabled}
              disabled={!folderName}
              onChange={(e) => updateSettings({ backupEnabled: e.target.checked })}
            />
            Back up automatically on a schedule
          </label>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-slate-500 mb-1 block">Frequency</label>
              <select
                value={settings.backupInterval}
                onChange={(e) => updateSettings({ backupInterval: e.target.value as BackupInterval })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-400"
              >
                <option value="monthly">Monthly</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="text-xs text-slate-500 mb-1 block">Backups to keep</label>
              <input
                type="number"
                min={1}
                max={100}
                value={settings.backupKeep}
                onChange={(e) => updateSettings({ backupKeep: Math.min(100, Math.max(1, Number(e.target.value) || 1)) })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-400"
              />
            </div>
          </div>
          <p className="text-xs text-slate-400 -mt-1">
            When the limit is exceeded, the oldest automatic backups (<code>homeboard-backup_*.json</code>) are deleted first.
          </p>

          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={backupNow}
              disabled={!folderName || busy}
              className="px-3 py-2 rounded-lg text-sm text-white bg-slate-700 hover:bg-slate-800 disabled:opacity-50"
            >
              {busy ? "Backing up…" : "Back up now"}
            </button>
            <span className="text-xs text-slate-500">Last backup: {formatDate(settings.lastBackupAt)}</span>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <p className="text-xs text-slate-400">
            A backup runs when you open the app and the schedule is due. If the browser has revoked folder access, click the banner at the top once to allow it again.
          </p>
        </section>
      </div>
    </div>
  );
}
