/** First-run / settings screen — replaces the old login. No accounts:
 *  pick device-only storage, or sync to a git branch of the repo. */
import { useState } from "react";
import { testConnection } from "../data/branchSync.js";

const DEFAULT_REPO = "Lulushu12/life-architecture";

export default function Setup({ initial, onDone, onCancel }) {
  const [mode, setMode] = useState(initial?.mode || "github");
  const [repo, setRepo] = useState(initial?.repo || DEFAULT_REPO);
  const [branch, setBranch] = useState(initial?.branch || "");
  const [token, setToken] = useState(initial?.token || "");
  const [test, setTest] = useState(null);
  const [testing, setTesting] = useState(false);

  const canSave = mode === "local" || (repo.trim().includes("/") && branch.trim() && token.trim());

  const runTest = async () => {
    setTesting(true); setTest(null);
    try { setTest(await testConnection({ repo: repo.trim(), branch: branch.trim(), token: token.trim() })); }
    catch { setTest({ ok: false, msg: "Could not reach GitHub — check your connection." }); }
    finally { setTesting(false); }
  };

  const save = () => onDone(mode === "local"
    ? { mode: "local" }
    : { mode: "github", repo: repo.trim(), branch: branch.trim(), token: token.trim() });

  const ModeCard = ({ id, title, desc }) => (
    <div onClick={() => setMode(id)} style={{
      flex: 1, minWidth: 200, cursor: "pointer", borderRadius: 14, padding: "14px 16px",
      border: `2px solid ${mode === id ? "var(--acc)" : "var(--bd)"}`,
      background: mode === id ? "var(--acc-soft)" : "var(--card)", transition: "all 0.15s",
    }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: mode === id ? "var(--acc)" : "var(--tx)", marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 12.5, color: "var(--mut)", lineHeight: 1.5 }}>{desc}</div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 520 }}>
        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 26, fontWeight: 700 }}>Life Architecture</div>
          <div style={{ fontSize: 13.5, color: "var(--mut)", marginTop: 4 }}>No account needed. Choose where your data lives.</div>
        </div>

        <div className="card">
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
            <ModeCard id="github" title="Sync to a git branch" desc="Data is committed to a branch of the repo — one branch per person. Works across devices." />
            <ModeCard id="local" title="This device only" desc="Everything stays in this browser. No token, no network. You can turn on sync later." />
          </div>

          {mode === "github" && (
            <>
              <div className="fg"><label className="fl">Repository (owner/name)</label>
                <input className="fi" value={repo} onChange={e => setRepo(e.target.value)} placeholder={DEFAULT_REPO} /></div>
              <div className="fg"><label className="fl">Branch — one per person</label>
                <input className="fi" value={branch} onChange={e => setBranch(e.target.value)} placeholder="e.g. data/radu" /></div>
              <div className="fg"><label className="fl">Fine-grained access token</label>
                <input className="fi" type="password" value={token} onChange={e => setToken(e.target.value)} placeholder="github_pat_…" />
                <div style={{ fontSize: 11.5, color: "var(--mut)", lineHeight: 1.55, marginTop: 6 }}>
                  Create at GitHub → Settings → Developer settings → Fine-grained tokens. Scope it to <b>this repo only</b> with
                  {" "}<b>Contents: read &amp; write</b>. It never leaves this browser.
                </div>
              </div>
              <div className="callout cg"><div className="ct" style={{ fontSize: 12.5 }}>
                <strong>Privacy note:</strong> your logs are committed to the branch as plain JSON — anyone who can read the repo can read them. Keep the repo <b>private</b>.
              </div></div>
              {test && <div className={"callout " + (test.ok ? "cgr" : "cr")}><div className="ct" style={{ fontSize: 12.5 }}>{test.msg}</div></div>}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button className="bs" onClick={runTest} disabled={testing || !repo.trim() || !branch.trim()}>{testing ? "Checking…" : "Test connection"}</button>
              </div>
            </>
          )}

          <div className="mf">
            {onCancel && <button className="bs" onClick={onCancel}>Cancel</button>}
            <button className="bp" onClick={save} disabled={!canSave}>{mode === "local" ? "Start — device only" : "Save & start"}</button>
          </div>
        </div>

        <div style={{ fontSize: 12, color: "var(--dim)", textAlign: "center", lineHeight: 1.6 }}>
          The branch must already exist — create it from the repo's main branch.<br />Changing these settings later: More → Data &amp; sync.
        </div>
      </div>
    </div>
  );
}
