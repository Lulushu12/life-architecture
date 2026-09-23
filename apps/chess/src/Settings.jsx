import { TopBar, Toggle, SettingRow } from "./ui.jsx";
import { BackupPanel } from "@shared/BackupPanel.jsx";
import { useToast } from "@shared/ui.jsx";
import { BOARD_THEMES, TEXTURES, PIECE_SETS, PIECE_SET_NAMES, DEFAULT_ARROW_COLORS } from "./Board.jsx";
import { STORAGE_KEY, validateBackup } from "./storage.js";

const ARROW_LABELS = {
  hint: "Engine / best move",
  plan: "Your drawn plans",
  threat: "Opponent threats",
};

const RELEASE_URL = "https://github.com/Lulushu12/life-architecture/releases/tag/chess-latest";

const COORD_FONTS = [
  [null, "Default"],
  ["Georgia, 'Times New Roman', serif", "Serif"],
  ["ui-monospace, 'Roboto Mono', Menlo, monospace", "Mono"],
  ["'sans-serif-condensed', 'Arial Narrow', sans-serif", "Narrow"],
];

export default function Settings({ store, setStore, nav }) {
  const toast = useToast();
  const set = (patch) => setStore((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  const themeDef = BOARD_THEMES[store.settings.theme] || BOARD_THEMES.brown;
  const bc = store.settings.boardCustom || {};
  const setBc = (patch) => set({ boardCustom: { ...bc, ...patch } });
  const previewPieces = PIECE_SETS[store.settings.pieces] || PIECE_SETS.cburnett;
  const setAi = (patch) =>
    setStore((s) => ({ ...s, settings: { ...s.settings, ai: { ...s.settings.ai, ...patch } } }));

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

      <h2>Board colors & coordinates</h2>
      <div
        className="boardpreview"
        style={{
          "--light": bc.light || themeDef.light,
          "--dark": bc.dark || themeDef.dark,
          "--tex": (themeDef.tex && TEXTURES[themeDef.tex]) || "none",
          "--coord-color": bc.coordColor || "currentColor",
          "--coord-font": bc.coordFont || "inherit",
        }}
      >
        <div className="psq light">
          <div className="pc" dangerouslySetInnerHTML={{ __html: previewPieces.wN }} />
        </div>
        <div className="psq dark">
          <div className="pc" dangerouslySetInnerHTML={{ __html: previewPieces.bN }} />
          <span className="coord pv">e4</span>
        </div>
        <div className="psq light">
          <span className="coord pv">d5</span>
        </div>
        <div className="psq dark">
          <div className="pc" dangerouslySetInnerHTML={{ __html: previewPieces.wP }} />
        </div>
      </div>
      <SettingRow label="Light squares">
        <div className="chips">
          <input
            className="colorpick"
            type="color"
            value={bc.light || themeDef.light}
            onChange={(e) => setBc({ light: e.target.value })}
          />
          <button className="linkbtn" disabled={!bc.light} onClick={() => setBc({ light: null })}>
            Default
          </button>
        </div>
      </SettingRow>
      <SettingRow label="Dark squares">
        <div className="chips">
          <input
            className="colorpick"
            type="color"
            value={bc.dark || themeDef.dark}
            onChange={(e) => setBc({ dark: e.target.value })}
          />
          <button className="linkbtn" disabled={!bc.dark} onClick={() => setBc({ dark: null })}>
            Default
          </button>
        </div>
      </SettingRow>
      <SettingRow label="Coordinate color">
        <div className="chips">
          <input
            className="colorpick"
            type="color"
            value={bc.coordColor || "#ece9e4"}
            onChange={(e) => setBc({ coordColor: e.target.value })}
          />
          <button className="linkbtn" disabled={!bc.coordColor} onClick={() => setBc({ coordColor: null })}>
            Default
          </button>
        </div>
      </SettingRow>
      <SettingRow label="Coordinate font">
        <div className="chips">
          {COORD_FONTS.map(([val, label]) => (
            <button
              key={label}
              className={"chip" + ((bc.coordFont || null) === val ? " sel" : "")}
              onClick={() => setBc({ coordFont: val })}
            >
              {label}
            </button>
          ))}
        </div>
      </SettingRow>
      <p className="hint small">
        "Default" follows the board theme picked above. A theme's texture keeps working under your own
        square colors, so you can recolor a wood or marble board freely.
      </p>

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
      <SettingRow label="Piece animation speed">
        <div className="sliderwrap">
          <input
            type="range"
            min={0}
            max={600}
            step={20}
            value={store.settings.animMs}
            onChange={(e) => set({ animMs: +e.target.value })}
          />
          <span className="slidervalue">{store.settings.animMs === 0 ? "Off" : store.settings.animMs + " ms"}</span>
        </div>
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
        Point this at any OpenAI-compatible endpoint (same as the Life Architecture coach,
        e.g. Gemini's free tier, or a local model over Tailscale) and the bots react with live,
        position-aware chat. Leave empty to use the built-in lines. The key stays on this device and is never included in backups.
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
        Everything lives in this app's own storage. Uninstalling deletes it, so take a backup
        before you uninstall or replace the app.
      </p>
      <BackupPanel
        data={store}
        prefix="chess"
        storageKey={STORAGE_KEY}
        strip={["settings.ai.apiKey"]}
        validate={validateBackup}
        onRestore={(data, { dropped }) => {
          setStore((s) => ({
            ...data,
            settings: {
              ...data.settings,
              ai: { ...data.settings.ai, apiKey: data.settings.ai?.apiKey || s.settings.ai.apiKey },
            },
          }));
          toast(dropped ? `Backup restored; ${dropped} damaged games were skipped.` : "Backup restored.");
        }}
      />

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
        one. Your data stays put as long as both builds are signed with the same key.
      </p>

      <p className="hint small footernote">
        Engine: Stockfish 16 NNUE (single-threaded WASM, GPLv3). Board pieces: cburnett set
        (lichess). Openings: lichess-org/chess-openings (CC0). Everything runs on-device.
      </p>
    </div>
  );
}
