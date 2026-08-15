import { useMemo, useState } from "react";

// ---------------------------------------------------------------------------
// Content loading — every monograph in ortho-db/<specialty-dir>/<id>.md is
// bundled raw at build time, so the whole knowledge base works offline.
// ---------------------------------------------------------------------------
const RAW = import.meta.glob("../ortho-db/*/*.md", { eager: true, query: "?raw", import: "default" });

function parseFrontmatter(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return { meta: {}, body: raw };
  const meta = {};
  for (const line of m[1].split("\n")) {
    const idx = line.indexOf(":");
    if (idx < 0) continue;
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim();
    if (val.startsWith("[") && val.endsWith("]")) {
      meta[key] = val.slice(1, -1).split(",").map(s => s.trim().replace(/^['"]|['"]$/g, "")).filter(Boolean);
    } else {
      meta[key] = val.replace(/^['"]|['"]$/g, "");
    }
  }
  return { meta, body: raw.slice(m[0].length) };
}

function splitSections(body) {
  const lines = body.split("\n");
  const sections = [];
  let cur = null;
  for (const line of lines) {
    const h = line.match(/^## (?!#)(.*)/);
    if (h) {
      if (cur) sections.push(cur);
      cur = { title: h[1].trim(), lines: [] };
    } else if (cur) {
      cur.lines.push(line);
    } else if (line.trim()) {
      cur = { title: "", lines: [line] };
    }
  }
  if (cur) sections.push(cur);
  return sections.map(s => ({ ...s, text: s.lines.join("\n").trim() })).filter(s => s.title || s.text);
}

const ENTRIES = Object.entries(RAW).map(([path, raw]) => {
  const { meta, body } = parseFrontmatter(raw);
  const id = meta.id || path.split("/").pop().replace(/\.md$/, "");
  const sections = splitSections(body);
  return {
    id,
    title: meta.title || id,
    region: meta.region || "—",
    specialty: meta.specialty || "Other",
    diagnoses: meta.diagnoses || [],
    classifications: meta.classifications || [],
    tags: meta.tags || [],
    updated: meta.updated || "",
    sections,
    searchText: (raw + " " + id).toLowerCase(),
  };
}).sort((a, b) => a.specialty.localeCompare(b.specialty) || a.title.localeCompare(b.title));

const SPECIALTY_ORDER = ["Trauma", "Arthroplasty", "Sports", "Spine", "Hand & Wrist", "Foot & Ankle", "Pediatrics", "Oncology & Metabolic", "Principles & Procedures"];
const SPEC_COLORS = {
  "Trauma": "#ef4444", "Arthroplasty": "#f59e0b", "Sports": "#22c55e",
  "Spine": "#3b82f6", "Hand & Wrist": "#a855f7", "Foot & Ankle": "#06b6d4",
  "Pediatrics": "#ec4899", "Oncology & Metabolic": "#94a3b8", "Principles & Procedures": "#fbbf24",
};

// ---------------------------------------------------------------------------
// Minimal GFM renderer (headings, tables, lists, quotes, hr, bold/italic/code/links)
// ---------------------------------------------------------------------------
function renderInline(text, keyBase) {
  const out = [];
  let rest = text, k = 0;
  const rx = /(\[([^\]]+)\]\((https?:\/\/[^)\s]+)\))|(\*\*([^*]+)\*\*)|(`([^`]+)`)|(\*([^*\n]+)\*)/;
  while (rest) {
    const m = rest.match(rx);
    if (!m) { out.push(rest); break; }
    if (m.index > 0) out.push(rest.slice(0, m.index));
    const key = keyBase + "-" + k++;
    if (m[1]) out.push(<a key={key} href={m[3]} target="_blank" rel="noreferrer" className="oc-link">{m[2]}</a>);
    else if (m[4]) out.push(<strong key={key} style={{ color: "#e2e8f0" }}>{m[5]}</strong>);
    else if (m[6]) out.push(<code key={key} className="oc-code">{m[7]}</code>);
    else out.push(<em key={key}>{m[9]}</em>);
    rest = rest.slice(m.index + m[0].length);
  }
  return out;
}

function Markdown({ text }) {
  const lines = text.split("\n");
  const blocks = [];
  let i = 0, k = 0;
  const isTableLine = (l) => /^\s*\|.*\|\s*$/.test(l);
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    const key = "b" + k++;

    const h = line.match(/^(#{3,5})\s+(.*)/);
    if (h) {
      const cls = h[1].length === 3 ? "oc-h3" : "oc-h4";
      blocks.push(<div key={key} className={cls}>{renderInline(h[2], key)}</div>);
      i++; continue;
    }
    if (/^\s*(---+|\*\*\*+)\s*$/.test(line)) { blocks.push(<hr key={key} className="oc-hr" />); i++; continue; }

    if (isTableLine(line)) {
      const tbl = [];
      while (i < lines.length && isTableLine(lines[i])) { tbl.push(lines[i]); i++; }
      const rows = tbl.map(r => r.trim().replace(/^\||\|$/g, "").split("|").map(c => c.trim()));
      const sepIdx = rows.findIndex(r => r.every(c => /^:?-{2,}:?$/.test(c)));
      const header = sepIdx > 0 ? rows[0] : null;
      const bodyRows = header ? rows.slice(sepIdx + 1) : rows.filter((_, idx) => idx !== sepIdx);
      blocks.push(
        <div key={key} className="oc-tblwrap">
          <table className="tbl oc-tbl">
            {header && <thead><tr>{header.map((c, ci) => <th key={ci}>{renderInline(c, key + ci)}</th>)}</tr></thead>}
            <tbody>{bodyRows.map((r, ri) => <tr key={ri}>{r.map((c, ci) => <td key={ci}>{renderInline(c, key + ri + "-" + ci)}</td>)}</tr>)}</tbody>
          </table>
        </div>
      );
      continue;
    }

    const li = line.match(/^(\s*)([-*]|\d+[.)])\s+(.*)/);
    if (li) {
      const items = [];
      while (i < lines.length) {
        const m2 = lines[i].match(/^(\s*)([-*]|\d+[.)])\s+(.*)/);
        if (m2) { items.push({ indent: m2[1].length, text: m2[3] }); i++; }
        else if (lines[i].match(/^\s{2,}\S/) && items.length) { items[items.length - 1].text += " " + lines[i].trim(); i++; }
        else break;
      }
      const ordered = /^\d/.test(li[2]);
      const L = ordered ? "ol" : "ul";
      blocks.push(
        <L key={key} className="oc-list">
          {items.map((it, ii) => <li key={ii} style={{ marginLeft: it.indent > 1 ? 16 : 0 }}>{renderInline(it.text, key + ii)}</li>)}
        </L>
      );
      continue;
    }

    if (/^\s*>\s?/.test(line)) {
      const q = [];
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) { q.push(lines[i].replace(/^\s*>\s?/, "")); i++; }
      blocks.push(<div key={key} className="oc-quote">{renderInline(q.join(" "), key)}</div>);
      continue;
    }

    const para = [line];
    i++;
    while (i < lines.length && lines[i].trim() && !isTableLine(lines[i]) && !/^(#{2,5}\s|\s*([-*]|\d+[.)])\s|\s*>|\s*---)/.test(lines[i])) {
      para.push(lines[i]); i++;
    }
    blocks.push(<p key={key} className="oc-p">{renderInline(para.join(" "), key)}</p>);
  }
  return <>{blocks}</>;
}

// ---------------------------------------------------------------------------
// UI
// ---------------------------------------------------------------------------
const orthoCss = `
.oc-search{width:100%;background:#0a1120;border:1px solid #1e2d40;border-radius:8px;padding:11px 14px;color:#e2e8f0;font-size:13px;font-family:'DM Sans',sans-serif;outline:none;margin-bottom:12px}
.oc-search:focus{border-color:#3b82f6}
.oc-chips{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:16px}
.oc-chip{padding:5px 11px;border-radius:6px;cursor:pointer;font-size:11px;font-weight:500;border:1px solid #1e2d40;background:transparent;color:#64748b;transition:all 0.15s;user-select:none}
.oc-chip:hover{color:#94a3b8;border-color:#334155}
.oc-chip.active{color:#e2e8f0;background:rgba(59,130,246,0.15);border-color:#3b82f6}
.oc-card{background:#0a1120;border:1px solid #1e2d40;border-radius:10px;padding:14px 16px;margin-bottom:10px;cursor:pointer;transition:all 0.15s}
.oc-card:hover{border-color:#334155;background:#0c1526}
.oc-card-t{font-size:14px;font-weight:600;color:#e2e8f0;margin-bottom:4px}
.oc-badge{display:inline-block;font-size:9px;font-family:'JetBrains Mono',monospace;letter-spacing:1px;padding:2px 7px;border-radius:4px;margin-right:6px}
.oc-dx{font-size:11px;color:#64748b;line-height:1.5;margin-top:6px}
.oc-meta{font-size:10px;color:#334155;font-family:'JetBrains Mono',monospace;margin-top:6px}
.oc-back{display:inline-flex;align-items:center;gap:6px;cursor:pointer;color:#64748b;font-size:12px;margin-bottom:14px;user-select:none}
.oc-back:hover{color:#93c5fd}
.oc-sec{background:#0a1120;border:1px solid #1e2d40;border-radius:10px;margin-bottom:10px;overflow:hidden}
.oc-sec>summary{list-style:none;cursor:pointer;padding:12px 16px;font-size:12px;font-weight:600;letter-spacing:1px;color:#93c5fd;font-family:'JetBrains Mono',monospace;user-select:none;display:flex;justify-content:space-between;align-items:center}
.oc-sec>summary::-webkit-details-marker{display:none}
.oc-sec>summary:hover{background:rgba(59,130,246,0.05)}
.oc-sec-body{padding:2px 16px 14px;border-top:1px solid #16233a}
.oc-h3{font-size:13px;font-weight:700;color:#e2e8f0;margin:16px 0 6px}
.oc-h4{font-size:12px;font-weight:600;color:#94a3b8;margin:12px 0 4px}
.oc-p{font-size:12px;color:#94a3b8;line-height:1.7;margin:6px 0}
.oc-list{margin:6px 0 6px 18px;font-size:12px;color:#94a3b8;line-height:1.7}
.oc-list li{margin-bottom:3px}
.oc-quote{border-left:3px solid #3b82f6;padding:6px 12px;margin:8px 0;font-size:12px;color:#93c5fd;background:rgba(59,130,246,0.06);border-radius:0 6px 6px 0}
.oc-link{color:#60a5fa;text-decoration:none;border-bottom:1px dotted #60a5fa55}
.oc-link:hover{color:#93c5fd}
.oc-code{background:#16233a;padding:1px 5px;border-radius:4px;font-family:'JetBrains Mono',monospace;font-size:11px;color:#fbbf24}
.oc-hr{border:none;border-top:1px solid #1e2d40;margin:14px 0}
.oc-tblwrap{overflow-x:auto;margin:8px 0}
.oc-tbl{min-width:100%}
.oc-tbl th{white-space:nowrap}
.oc-tbl td{font-size:11px;line-height:1.6}
.oc-count{font-size:10px;color:#334155;font-family:'JetBrains Mono',monospace;margin-bottom:10px}
.oc-empty{text-align:center;padding:60px 20px;color:#475569;font-size:13px}
`;

function Badge({ specialty }) {
  const c = SPEC_COLORS[specialty] || "#64748b";
  return <span className="oc-badge" style={{ color: c, background: c + "1a", border: `1px solid ${c}44` }}>{specialty.toUpperCase()}</span>;
}

function score(e, q) {
  let s = 0;
  if (e.title.toLowerCase().includes(q)) s += 100;
  if (e.diagnoses.some(d => d.toLowerCase().includes(q))) s += 60;
  if (e.classifications.some(c => c.toLowerCase().includes(q))) s += 50;
  if (e.tags.some(t => t.toLowerCase().includes(q))) s += 40;
  if (e.searchText.includes(q)) s += 10;
  return s;
}

function EntryDetail({ entry, onBack }) {
  return (
    <>
      <div className="oc-back" onClick={onBack}>← Back to index</div>
      <div className="pg-title">{entry.title.toUpperCase()}</div>
      <div style={{ margin: "6px 0 4px" }}>
        <Badge specialty={entry.specialty} />
        <span className="oc-badge" style={{ color: "#64748b", background: "#64748b1a", border: "1px solid #64748b44" }}>{entry.region.toUpperCase()}</span>
        {entry.updated && <span className="oc-meta">updated {entry.updated}</span>}
      </div>
      <div className="oc-dx" style={{ marginBottom: 16 }}>{entry.diagnoses.join(" · ")}</div>
      {entry.sections.map((s, i) => (
        <details key={i} className="oc-sec" open={i === 0 || /quick reference/i.test(s.title)}>
          <summary>{(s.title || "OVERVIEW").toUpperCase()}<span style={{ color: "#334155" }}>▾</span></summary>
          <div className="oc-sec-body"><Markdown text={s.text} /></div>
        </details>
      ))}
    </>
  );
}

export default function POrtho() {
  const [q, setQ] = useState("");
  const [spec, setSpec] = useState("All");
  const [selId, setSelId] = useState(null);

  const specialties = useMemo(() => {
    const present = new Set(ENTRIES.map(e => e.specialty));
    return SPECIALTY_ORDER.filter(s => present.has(s)).concat([...present].filter(s => !SPECIALTY_ORDER.includes(s)));
  }, []);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    let list = ENTRIES.filter(e => spec === "All" || e.specialty === spec);
    if (ql) list = list.map(e => [score(e, ql), e]).filter(([s]) => s > 0).sort((a, b) => b[0] - a[0]).map(([, e]) => e);
    return list;
  }, [q, spec]);

  const sel = selId && ENTRIES.find(e => e.id === selId);

  return (
    <>
      <style>{orthoCss}</style>
      {sel ? <EntryDetail entry={sel} onBack={() => setSelId(null)} /> : (
        <>
          <div className="pg-title">ORTHO CODEX</div>
          <div className="pg-sub">Classifications · techniques · treatment protocols · anatomy · evidence — offline-ready reference</div>
          <input className="oc-search" placeholder="Search diagnoses, classifications, techniques… (e.g. Garden, Schatzker, ACL, Latarjet)" value={q} onChange={e => setQ(e.target.value)} />
          <div className="oc-chips">
            {["All", ...specialties].map(s => (
              <div key={s} className={"oc-chip" + (spec === s ? " active" : "")} onClick={() => setSpec(s)}>{s}</div>
            ))}
          </div>
          <div className="oc-count">{filtered.length} MONOGRAPH{filtered.length === 1 ? "" : "S"} · {filtered.reduce((n, e) => n + e.diagnoses.length, 0)} DIAGNOSES</div>
          {filtered.length === 0 && <div className="oc-empty">{ENTRIES.length === 0 ? "Knowledge base is empty — monographs live in ortho-db/ and are bundled at build time." : "No matches. Try a classification name, diagnosis, or technique."}</div>}
          {filtered.map(e => (
            <div key={e.id} className="oc-card" onClick={() => setSelId(e.id)}>
              <div className="oc-card-t">{e.title}</div>
              <div><Badge specialty={e.specialty} /><span className="oc-badge" style={{ color: "#64748b", background: "#64748b1a", border: "1px solid #64748b44" }}>{e.region.toUpperCase()}</span></div>
              <div className="oc-dx">{e.diagnoses.slice(0, 8).join(" · ")}{e.diagnoses.length > 8 ? " · …" : ""}</div>
              <div className="oc-meta">{e.classifications.slice(0, 6).join(" / ")}{e.updated ? ` · updated ${e.updated}` : ""}</div>
            </div>
          ))}
        </>
      )}
    </>
  );
}
