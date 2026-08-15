import { useRef, useState } from "react";
import { backupText, backupFilename, canDownload, copyToClipboard, downloadJson, parseBackup } from "./backup.js";

/**
 * Export/restore UI that works inside the APK as well as on the web.
 *
 * The plain file download that used to sit here does nothing in a Capacitor
 * WebView — no DownloadListener is registered, so the click is swallowed. Since
 * uninstalling deletes the app's storage and Android backups are switched off,
 * a backup route that silently fails is the worst possible kind. Clipboard and
 * on-screen text always work; the file download is kept where it's supported.
 *
 * Props:
 *   data      — object to export
 *   onRestore — called with the parsed object
 *   validate  — (obj) => boolean, rejects backups from another app
 *   prefix    — filename prefix for the download
 */
export default function BackupPanel({ data, onRestore, validate, prefix }) {
  const fileRef = useRef();
  const [text, setText] = useState(null);
  const [copied, setCopied] = useState(false);
  const [paste, setPaste] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  const restore = (raw) => {
    try {
      onRestore(parseBackup(raw, validate));
      setPaste("");
      setError("");
      setDone("Backup restored.");
    } catch (e) {
      setDone("");
      setError(e.message);
    }
  };

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (f) f.text().then(restore);
    e.target.value = "";
  };

  return (
    <div className="backuppanel">
      <div className="backuprow">
        <button
          className="linkbtn"
          onClick={() => {
            setText(backupText(data));
            setCopied(false);
          }}
        >
          Export backup
        </button>
        <button className="linkbtn" onClick={() => fileRef.current.click()}>
          Import from file
        </button>
        <input ref={fileRef} type="file" accept="application/json" hidden onChange={onFile} />
      </div>

      {text && (
        <div className="card">
          <div className="backuprow">
            <button className="bigbtn" onClick={async () => setCopied(await copyToClipboard(text))}>
              {copied ? "✓ Copied" : "Copy to clipboard"}
            </button>
            {canDownload() && (
              <button className="linkbtn" onClick={() => downloadJson(text, backupFilename(prefix))}>
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
