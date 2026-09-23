import { useState } from "react";
import { testConnection } from "../data/branchSync.js";
import { getCoachConfig, setCoachConfig } from "../coach/client.js";

const PUBLIC_REPO = "lulushu12/life-architecture";

export default function Setup({ initial, onDone, onCancel }) {
  const [mode, setMode] = useState(initial?.mode === "github" ? "github" : "local");
  const [showGithub, setShowGithub] = useState(initial?.mode === "github");
  const [repo, setRepo] = useState(initial?.repo || "");
  const [branch, setBranch] = useState(initial?.branch || "");
  const savedToken = initial?.token || "";
  const [token, setToken] = useState("");
  const [dropToken, setDropToken] = useState(false);
  const effectiveToken = token.trim() || (dropToken ? "" : savedToken);
  const isPublicRepo = repo.trim().toLowerCase() === PUBLIC_REPO;
  const [test, setTest] = useState(null);
  const [testing, setTesting] = useState(false);
  const coach0 = getCoachConfig();
  const [showCoach, setShowCoach] = useState(!!coach0?.url);
  const [coachUrl, setCoachUrl] = useState(coach0?.url || "");
  const [coachModel, setCoachModel] = useState(coach0?.model || "");
  const [coachKey, setCoachKey] = useState(coach0?.apiKey || "");

  const canSave = mode === "local" || (repo.trim().includes("/") && branch.trim() && effectiveToken);

  const runTest = async () => {
    setTesting(true); setTest(null);
    try { setTest(await testConnection({ repo: repo.trim(), branch: branch.trim(), token: effectiveToken })); }
    catch { setTest({ ok: false, msg: "Could not reach GitHub. Check your connection." }); }
    finally { setTesting(false); }
  };

  const save = () => {
    setCoachConfig(coachUrl.trim() ? { url: coachUrl.trim(), model: coachModel.trim(), apiKey: coachKey.trim() } : null);
    onDone(mode === "local"
      ? { mode: "local" }
      : { mode: "github", repo: repo.trim(), branch: branch.trim(), token: effectiveToken });
  };

  const ModeCard = ({ id, title, desc }) => (
    <button type="button" aria-pressed={mode === id} onClick={() => setMode(id)} style={{ textAlign: "left", fontFamily: "inherit",
      flex: 1, minWidth: 200, cursor: "pointer", borderRadius: 14, padding: "14px 16px",
      border: `2px solid ${mode === id ? "var(--acc)" : "var(--bd)"}`,
      background: mode === id ? "var(--acc-soft)" : "var(--card)", transition: "all 0.15s",
    }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: mode === id ? "var(--acc)" : "var(--tx)", marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 12.5, color: "var(--mut)", lineHeight: 1.5 }}>{desc}</div>
    </button>
  );

  return (
    <div>
      <div style={{ width: "100%", maxWidth: 560 }}>
        <div className="pg-title">Sync & coach</div>
        <div className="pg-sub">Local mode is the default. Move data between devices with a backup export and import (More, Data).</div>

        <div className="card">
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
            <ModeCard id="local" title="This device only (recommended)" desc="Everything stays on this device. No token, no network. Use backup and import to move data." />
            {showGithub
              ? <ModeCard id="github" title="Git branch sync (deprecated)" desc="Commits your logs to a branch of a GitHub repo. Kept for existing setups only." />
              : <button type="button" className="bs" style={{ minHeight: 44 }} onClick={() => setShowGithub(true)}>Show deprecated GitHub sync</button>}
          </div>

          {mode === "github" && (
            <>
              <div className="fg"><label className="fl">Repository (owner/name)</label>
                <input className="fi" value={repo} onChange={e => setRepo(e.target.value)} placeholder="you/private-data-repo" /></div>
              {isPublicRepo && <div className="callout cr"><div className="ct" style={{ fontSize: 12.5 }}><strong>This is the public app repo.</strong> Anything committed here is readable by everyone. Use a separate private repository.</div></div>}
              <div className="fg"><label className="fl">Branch, one per person</label>
                <input className="fi" value={branch} onChange={e => setBranch(e.target.value)} placeholder="e.g. data/radu" /></div>
              <div className="fg"><label className="fl">Fine-grained access token</label>
                <input className="fi" type="password" autoComplete="off" value={token} onChange={e => { setToken(e.target.value); setDropToken(false); }} placeholder={savedToken && !dropToken ? "Token saved. Paste a new one to replace it" : "github_pat_..."} />
                {savedToken && !dropToken && !token && (
                  <div className="btnrow" style={{ marginTop: 6 }}>
                    <span style={{ fontSize: 12, color: "var(--mut)", alignSelf: "center" }}>A token is saved on this device.</span>
                    <button type="button" className="bs" onClick={() => setDropToken(true)}>Remove token</button>
                  </div>
                )}
                <div style={{ fontSize: 11.5, color: "var(--mut)", lineHeight: 1.55, marginTop: 6 }}>
                  Fine-grained token scoped to <b>one private data repo only</b> with <b>Contents: read &amp; write</b>. It is stored in plain text in this browser.
                </div>
              </div>
              <div className="callout cr"><div className="ct" style={{ fontSize: 12.5 }}>
                <strong>Do not use a token with write access to the public Lulushu12/life-architecture repo.</strong> Every app on this site shares this
                browser storage, so a leaked token could rewrite the app itself, and anything committed to a public repo (your health logs included) is readable by anyone.
                Use a separate private repository, or better, stay in local mode and use backup and import.
              </div></div>
              {test && <div className={"callout " + (test.ok ? "cgr" : "cr")}><div className="ct" style={{ fontSize: 12.5 }}>{test.msg}</div></div>}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button className="bs" onClick={runTest} disabled={testing || !repo.trim() || !branch.trim()}>{testing ? "Checking…" : "Test connection"}</button>
              </div>
            </>
          )}

          <div style={{ borderTop: "1px solid var(--bd2)", marginTop: 16, paddingTop: 14 }}>
            <button type="button" aria-expanded={showCoach} onClick={() => setShowCoach(s => !s)} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8, userSelect: "none", width: "100%", minHeight: 44, color: "var(--tx)" }}>
              <span style={{ fontSize: 13.5, fontWeight: 700 }}>AI Coach</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--mut)", background: "var(--hover)", borderRadius: 99, padding: "2px 8px" }}>optional</span>
              <span style={{ marginLeft: "auto", color: "var(--dim)", fontSize: 11, transform: showCoach ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</span>
            </button>
            {showCoach && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 12.5, color: "var(--mut)", lineHeight: 1.6, marginBottom: 12 }}>
                  Powers log parsing and the protocol coach. Point it at any OpenAI-compatible endpoint.
                  A <b>local model</b> works great: install Ollama, run <code style={{ fontSize: 11.5 }}>ollama pull qwen2.5:7b-instruct</code>,
                  and use the defaults below. Nothing leaves your machine.
                </div>
                <div className="fg"><label className="fl">Endpoint (OpenAI-compatible base URL)</label>
                  <input className="fi" value={coachUrl} onChange={e => setCoachUrl(e.target.value)} placeholder="http://localhost:11434/v1" /></div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <div className="fg" style={{ flex: 2, minWidth: 160 }}><label className="fl">Model</label>
                    <input className="fi" value={coachModel} onChange={e => setCoachModel(e.target.value)} placeholder="qwen2.5:7b-instruct" /></div>
                  <div className="fg" style={{ flex: 1, minWidth: 120 }}><label className="fl">API key (if hosted)</label>
                    <input className="fi" type="password" value={coachKey} onChange={e => setCoachKey(e.target.value)} placeholder="none for local" /></div>
                </div>
                <div style={{ fontSize: 11.5, color: "var(--dim)", lineHeight: 1.55 }}>
                  <b>Phone-friendly:</b> Google's Gemini API has a free tier and works from anywhere: endpoint
                  {" "}<code style={{ fontSize: 11 }}>https://generativelanguage.googleapis.com/v1beta/openai</code>, model
                  {" "}<code style={{ fontSize: 11 }}>gemini-2.5-flash</code>, key from aistudio.google.com.
                  For Ollama, allow the app's origin: <code style={{ fontSize: 11 }}>OLLAMA_ORIGINS=*</code> (or this site's URL);
                  browsers only allow <b>localhost</b> endpoints from the hosted app; a LAN IP will not work over https.
                  Leave the endpoint empty to keep the coach off.
                </div>
              </div>
            )}
          </div>

          <div className="mf">
            {onCancel && <button className="bs" onClick={onCancel}>Cancel</button>}
            <button className="bp" onClick={save} disabled={!canSave}>Save</button>
          </div>
        </div>

        {mode === "github" && <div style={{ fontSize: 12, color: "var(--dim)", lineHeight: 1.6 }}>The branch must already exist in the data repo.</div>}
      </div>
    </div>
  );
}
