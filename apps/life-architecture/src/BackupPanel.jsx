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
 * This app styles itself from an inline stylesheet with its own class names, so
 * the markup here uses `bs` buttons and local styles rather than the shared
 * classes the other apps' copies of this component use.
 */
const boxStyle = {
  width: "100%",
  minHeight: 90,
  maxHeight: 220,
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  fontSize: 11,
  whiteSpace: "pre",
  overflow: "auto",
  background: "var(--bg2, #14171c)",
  color: "var(--fg, #e8e8e8)",
  border: "1px solid var(--bd, #2a2f38)",
  borderRadius: 8,
  padding: 8,
  marginTop: 8,
};

export default function BackupPanel({ data, onRestore, validate, prefix }) {
  const fileRef = useRef();
  const [text, setText] = useState(null);
  const [copied, setCopied] = useState(false);
  const [paste, setPaste] = useState("");
  const [msg, setMsg] = useState(null); // { ok, text }

  const restore = (raw) => {
    try {
      onRestore(parseBackup(raw, validate));
      setPaste("");
      setMsg({ ok: true, text: "Backup restored." });
    } catch (e) {
      setMsg({ ok: false, text: e.message });
    }
  };

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (f) f.text().then(restore);
    e.target.value = "";
  };

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          className="bs"
          onClick={() => {
            setText(backupText(typeof data === "function" ? data() : data));
            setCopied(false);
          }}
        >
          Export data
        </button>
        <button className="bs" onClick={() => fileRef.current.click()}>
          Import from file
        </button>
        <input ref={fileRef} type="file" accept="application/json" hidden onChange={onFile} />
      </div>

      {text && (
        <>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
            <button className="bs" onClick={async () => setCopied(await copyToClipboard(text))}>
              {copied ? "✓ Copied" : "Copy to clipboard"}
            </button>
            {canDownload() && (
              <button className="bs" onClick={() => downloadJson(text, backupFilename(prefix))}>
                Download file
              </button>
            )}
            <button className="bs" onClick={() => setText(null)}>
              Close
            </button>
          </div>
          <textarea style={boxStyle} readOnly value={text} onFocus={(e) => e.target.select()} />
          <div style={{ fontSize: 12, color: "var(--mut)", marginTop: 6 }}>
            Paste this somewhere safe. Uninstalling the app deletes everything it holds, so take a
            copy before you replace or reinstall it.
          </div>
        </>
      )}

      <textarea
        style={boxStyle}
        placeholder="…or paste a backup here to restore it"
        value={paste}
        onChange={(e) => {
          setPaste(e.target.value);
          setMsg(null);
        }}
      />
      {msg && (
        <div style={{ fontSize: 12, marginTop: 6, color: msg.ok ? "var(--ok, #4ade80)" : "var(--bad, #f87171)" }}>
          {msg.text}
        </div>
      )}
      <button className="bs" style={{ marginTop: 8 }} disabled={!paste.trim()} onClick={() => restore(paste)}>
        Restore from pasted text
      </button>
    </div>
  );
}
