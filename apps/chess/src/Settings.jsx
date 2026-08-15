import { useRef, useState } from "react";
import { TopBar, Toggle, SettingRow } from "./ui.jsx";
import { BOARD_THEMES, PIECE_SETS, PIECE_SET_NAMES, DEFAULT_ARROW_COLORS } from "./Board.jsx";
import { loadStore, saveStore } from "./storage.js";
import { backupText, backupFilename, canDownload, copyToClipboard, downloadJson, parseBackup } from "./backup.js";

const ARROW_LABELS = {
  hint: "Engine / best move",
  plan: "Your drawn plans",
  threat: "Opponent threats",
};

const RELEASE_URL = "https://github.com/Lulushu12/life-architecture/releases/tag/chess-latest";

export default function Settings({ store, setStore, nav }) {
  const fileRef = useRef();
  const [backup, setBackup] = useState(null); // exported text, shown for copying
  const [copied, setCopied] = useState(false);
  const [paste, setPaste] = useState("");
  const [pasteErr, setPasteErr] = useState("");
  const set = (patch) => setStore((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  const setAi = (patch) =>
    setStore((s) => ({ ...s, settings: { ...s.settings, ai: { ...s.settings.ai, ...patch } } }));

  const onImport = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    f.text().then((t) => {
      try {
        const imported = JSON.parse(t);
        if (!imported.settings || !Array.isArray(imported.games)) throw new Error("bad");
        saveStore(imported);
        setStore(loadStore());
        alert("Backup restored.");
      } catch {
        alert("Not a valid backup file.");
      }
    });
    e.target.value = "";
  };

  const restoreFrom = (text) => {
    try {
      const data = parseBackup(text, (d) => d.settings && Array.isArray(d.games));
      saveStore(data);
      setStore(loadStore());
      setPaste("");
      setPasteErr("");
      alert("Backup restored.");
    } catch (e) {
      setPasteErr(e.message);
    }
  };

  return (
    <div className="page">
      <TopBar title="Settings" onBack={() => nav("home")} />

      <h2>Board theme</h2>
      <div className="themerow">
        {Object.entries(BOARD_THEMES).map(([id, t]) => (
          <button
            key={id}
            className={"themeswatch" + (store.settings.theme === id ? " sel" : "")}
            onClick={() => set({ theme: id })}
            title={t.name}
          >
            <span style={{ background: t.light }} />
            <span style={{ background: t.dark }} />
            <span style={{ background: t.dark }} />
            <span style={{ background: t.light }} />
          </button>
        ))}
      </div>

      <h2>Piece style</h2>
      <div className="themerow">
        {Object.keys(PIECE_SETS).map((id) => (
          <button
            key={id}
            className={"pieceswatch" + (store.settings.pieces === id ? " sel" : "")}
            onClick={() => set({ pieces: id })}
            title={PIECE_SET_NAMES[id] || id}
            dangerouslySetInnerHTML={{ __html: PIECE_SETS[id].wN }}
          />
        ))}
      </div>

      <h2>Arrow colors</h2>
      {Object.keys(ARROW_LABELS).map((key) => (
        <SettingRow key={key} label={ARROW_LABELS[key]}>
          <input
            className="colorpick"
            type="color"
            value={store.settings.arrowColors?.[key] || DEFAULT_ARROW_COLORS[key]}
            onChange={(e) =>
              setStore((s) => ({
                ...s,
                settings: { ...s.settings, arrowColors: { ...s.settings.arrowColors, [key]: e.target.value } },
              }))
            }
          />
        </SettingRow>
      ))}
      <button className="linkbtn" onClick={() => set({ arrowColors: { ...DEFAULT_ARROW_COLORS } })}>
        Reset arrow colors
      </button>

      <h2>Game</h2>
      <SettingRow label="Sounds">
        <Toggle checked={store.settings.sounds} onChange={(v) => set({ sounds: v })} />
      </SettingRow>
      <SettingRow label="Haptics">
        <Toggle checked={store.settings.haptics} onChange={(v) => set({ haptics: v })} />
      </SettingRow>
      <SettingRow label="Eval bar in casual games">
        <Toggle checked={store.settings.evalBar} onChange={(v) => set({ evalBar: v })} />
      </SettingRow>

      <h2>Game review</h2>
      <SettingRow label="Time per position">
        <div className="chips">
          {[
            [200, "Fast"],
            [400, "Balanced"],
            [1000, "Deep"],
          ].map(([ms, label]) => (
            <button
              key={ms}
              className={"chip" + (store.settings.reviewMovetime === ms ? " sel" : "")}
              onClick={() => set({ reviewMovetime: ms })}
            >
              {label}
            </button>
          ))}
        </div>
      </SettingRow>

      <h2>Live AI banter (optional)</h2>
      <p className="hint small">
        Point this at any OpenAI-compatible endpoint (same as the Life Architecture coach —
        e.g. Gemini's free tier, or a local model over Tailscale) and the bots react with live,
        position-aware chat. Leave empty to use the built-in lines. The key stays on this device.
      </p>
      <input
        className="input"
        placeholder="Base URL (e.g. https://generativelanguage.googleapis.com/v1beta/openai)"
        value={store.settings.ai.baseUrl}
        onChange={(e) => setAi({ baseUrl: e.target.value.trim() })}
      />
      <input
        className="input"
        placeholder="API key"
        type="password"
        value={store.settings.ai.apiKey}
        onChange={(e) => setAi({ apiKey: e.target.value.trim() })}
      />
      <input
        className="input"
        placeholder="Model (e.g. gemini-2.5-flash)"
        value={store.settings.ai.model}
        onChange={(e) => setAi({ model: e.target.value.trim() })}
      />

      <h2>Data</h2>
      <p className="hint small">
        Everything lives in this app's own storage. Uninstalling deletes it, and backups are
        off by design — so take one before you uninstall or replace the app.
      </p>
      <div className="backuprow">
        <button
          className="linkbtn"
          onClick={() => {
            setBackup(backupText(store));
            setCopied(false);
          }}
        >
          Export backup
        </button>
        <button className="linkbtn" onClick={() => fileRef.current.click()}>
          Import from file
        </button>
        <input ref={fileRef} type="file" accept="application/json" hidden onChange={onImport} />
      </div>

      {backup && (
        <div className="card">
          <div className="backuprow">
            <button
              className="bigbtn"
              onClick={async () => setCopied(await copyToClipboard(backup))}
            >
              {copied ? "✓ Copied" : "Copy to clipboard"}
            </button>
            {canDownload() && (
              <button
                className="linkbtn"
                onClick={() => downloadJson(backup, backupFilename("chess"))}
              >
                Download file
              </button>
            )}
            <button className="linkbtn" onClick={() => setBackup(null)}>
              Close
            </button>
          </div>
          <textarea className="input backuptext" readOnly value={backup} onFocus={(e) => e.target.select()} />
          <p className="hint small">
            Paste this somewhere safe — a note, an email to yourself. Restoring it below brings
            back every game, puzzle and setting.
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
            setPasteErr("");
          }}
        />
        {pasteErr && <p className="warn">{pasteErr}</p>}
        <button className="linkbtn" disabled={!paste.trim()} onClick={() => restoreFrom(paste)}>
          Restore from pasted text
        </button>
      </div>

      <h2>Version</h2>
      <div className="backuprow">
        <span className="hint small">
          build {__BUILD_ID__} · {__BUILD_DATE__}
        </span>
        <a className="linkbtn" href={RELEASE_URL} target="_blank" rel="noreferrer">
          Check for updates
        </a>
      </div>
      <p className="hint small">
        Opens the release page in your browser. Download the APK there and install it over this
        one — your data stays put, as long as both builds are signed with the same key.
      </p>

      <p className="hint small footernote">
        Engine: Stockfish 16 NNUE (single-threaded WASM, GPLv3). Board pieces: cburnett set
        (lichess). Openings: lichess-org/chess-openings (CC0). Everything runs on-device.
      </p>
    </div>
  );
}
