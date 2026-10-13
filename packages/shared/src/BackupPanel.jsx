import { useRef, useState } from "react";
import { backupText, backupFilename, canDownload, copyToClipboard, downloadJson, readBackup } from "./backup.js";

function readLastBackup(prefix) {
  try {
    return localStorage.getItem(`${prefix}:lastBackup`);
  } catch {
    return null;
  }
}

function lastBackupLabel(iso) {
  const then = iso ? new Date(iso) : null;
  if (!then || isNaN(then)) return "never";
  const now = new Date();
  const a = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const b = new Date(then.getFullYear(), then.getMonth(), then.getDate());
  const days = Math.round((a - b) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

function readRaw(storageKey) {
  try {
    return localStorage.getItem(storageKey);
  } catch {
    return null;
  }
}

/**
 * Export/restore UI that works inside the APK as well as on the web.
 *
 * Props:
 *   data       - object to export (falls back to localStorage[storageKey])
 *   onRestore  - called with the parsed object and { dropped }
 *   validate   - (obj) => boolean | { ok, dropped?, data? }
 *   prefix     - filename prefix and the `${prefix}:lastBackup` key
 *   strip      - dotted paths removed from the export, e.g. "settings.ai.apiKey"
 *   storageKey - app's localStorage key; its raw value is kept in
 *                `${storageKey}.prerestore` before a restore replaces it
 *   saveFile   - optional async (text) => { path, bytes }: saves the backup as
 *                a real file on the device (the chess APK passes one). When
 *                given, it's offered first, ahead of the clipboard.
 */
// Above this, a copy through the clipboard can come back cut short on some
// phones (it happened with chess), so the panel warns and points elsewhere.
const CLIPBOARD_SAFE = 100_000;

const sizeLabel = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1e3))} KB`);

export function BackupPanel({ data, onRestore, validate, prefix, strip = [], storageKey, saveFile }) {
  const fileRef = useRef();
  const [text, setText] = useState(null);
  const [copied, setCopied] = useState(false);
  const [paste, setPaste] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const [lastBackup, setLastBackup] = useState(() => readLastBackup(prefix));
  const [saved, setSaved] = useState(null); // {path, bytes} | {error}
  const [saving, setSaving] = useState(false);

  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  const exportSource = () => {
    if (data !== undefined || !storageKey) return data;
    try {
      return JSON.parse(readRaw(storageKey));
    } catch {
      return null;
    }
  };

  const markBackedUp = () => {
    const iso = new Date().toISOString();
    try {
      localStorage.setItem(`${prefix}:lastBackup`, iso);
    } catch {
      /* the label just stays stale */
    }
    setLastBackup(iso);
  };

  const onCopy = async () => {
    const ok = await copyToClipboard(text);
    setCopied(ok);
    if (ok) markBackedUp();
  };

  const onSaveFile = async () => {
    setSaving(true);
    try {
      const res = await saveFile(text);
      setSaved(res);
      markBackedUp();
    } catch (e) {
      setSaved({ error: e?.message || "Couldn't save the file." });
    } finally {
      setSaving(false);
    }
  };

  const onDownload = () => {
    downloadJson(text, backupFilename(prefix));
    markBackedUp();
  };

  const onShare = async () => {
    const filename = backupFilename(prefix);
    try {
      let file = null;
      try {
        file = new File([text], filename, { type: "application/json" });
        if (!navigator.canShare?.({ files: [file] })) file = null;
      } catch {
        file = null;
      }
      if (file) await navigator.share({ files: [file], title: filename });
      else await navigator.share({ title: filename, text });
      markBackedUp();
    } catch (e) {
      if (e?.name !== "AbortError") setError("Sharing failed. Copy the text instead.");
    }
  };

  const restore = (raw) => {
    try {
      const { data: restored, dropped } = readBackup(raw, validate);
      if (storageKey) {
        const current = readRaw(storageKey);
        try {
          if (current != null) localStorage.setItem(`${storageKey}.prerestore`, current);
        } catch {
          /* no room for the safety copy; restore anyway */
        }
      }
      onRestore(restored, { dropped });
      setPaste("");
      setError("");
      setDone(dropped > 0 ? `Restored; ${dropped} invalid records were skipped.` : "Backup restored.");
    } catch (e) {
      setDone("");
      setError(e.message);
    }
  };

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (f) f.text().then(restore, () => setError("Couldn't read that file."));
    e.target.value = "";
  };

  return (
    <div className="backuppanel">
      <p className="hint small">Last backup: {lastBackupLabel(lastBackup)}</p>
      <div className="backuprow">
        <button
          className="linkbtn"
          onClick={() => {
            setText(backupText(exportSource(), { strip }));
            setCopied(false);
            setSaved(null);
          }}
        >
          Export backup
        </button>
        <button className="linkbtn" onClick={() => fileRef.current.click()}>
          Import from file
        </button>
        {/* No type filter: Android's pickers often label .json files as generic
            data and grey them out. A wrong file gets a clear error instead. */}
        <input ref={fileRef} type="file" hidden onChange={onFile} />
      </div>

      {text && (
        <div className="card">
          {saveFile && (
            <div className="backuprow">
              <button className="bigbtn" onClick={onSaveFile} disabled={saving}>
                {saving ? "Saving…" : "Save backup file"}
              </button>
            </div>
          )}
          {saved?.path && (
            <p className="okmsg small" role="status">
              ✓ Saved and checked: {saved.path} ({sizeLabel(saved.bytes)}). Restore it with Import from file.
            </p>
          )}
          {saved?.error && <p className="warn small">{saved.error}</p>}
          <p className="hint small">Backup size: {sizeLabel(text.length)}</p>
          {text.length > CLIPBOARD_SAFE && (
            <p className="warn small">
              This backup is large, and the clipboard can cut it short on some phones.
              {saveFile ? " Save it as a file instead." : canDownload() ? " Download it as a file instead." : " Check the pasted copy is complete."}
            </p>
          )}
          <div className="backuprow">
            <button className={saveFile ? "linkbtn" : "bigbtn"} onClick={onCopy}>
              {copied ? "✓ Copied" : "Copy to clipboard"}
            </button>
            {canShare && (
              <button className="linkbtn" onClick={onShare}>
                Share
              </button>
            )}
            {canDownload() && (
              <button className="linkbtn" onClick={onDownload}>
                Download file
              </button>
            )}
            <button className="linkbtn" onClick={() => setText(null)}>
              Close
            </button>
          </div>
          <textarea className="input backuptext" readOnly value={text} onFocus={(e) => e.target.select()} />
          <p className="hint small">
            Paste this somewhere safe. Uninstalling the app deletes everything it holds, so take a
            copy before you replace or reinstall it.
          </p>
        </div>
      )}

      <div className="field">
        <textarea
          className="input backuptext"
          placeholder="…or paste a backup here to restore it"
          value={paste}
          onChange={(e) => {
            setPaste(e.target.value);
            setError("");
            setDone("");
          }}
        />
        {error && <p className="warn">{error}</p>}
        {done && <p className="okmsg">{done}</p>}
        <button className="linkbtn" disabled={!paste.trim()} onClick={() => restore(paste)}>
          Restore from pasted text
        </button>
      </div>
    </div>
  );
}

export default BackupPanel;
