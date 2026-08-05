import { useRef } from "react";
import { TopBar, Toggle, SettingRow } from "./ui.jsx";
import { BOARD_THEMES } from "./Board.jsx";
import { exportStore, loadStore, saveStore } from "./storage.js";

export default function Settings({ store, setStore, nav }) {
  const fileRef = useRef();
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
      <div className="backuprow">
        <button className="linkbtn" onClick={() => exportStore(store)}>
          Export backup
        </button>
        <button className="linkbtn" onClick={() => fileRef.current.click()}>
          Import backup
        </button>
        <input ref={fileRef} type="file" accept="application/json" hidden onChange={onImport} />
      </div>

      <p className="hint small footernote">
        Engine: Stockfish 16 NNUE (single-threaded WASM, GPLv3). Board pieces: cburnett set
        (lichess). Openings: lichess-org/chess-openings (CC0). Everything runs on-device.
      </p>
    </div>
  );
}
