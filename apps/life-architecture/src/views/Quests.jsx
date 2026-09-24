import { useState } from "react";
import { CATEGORIES, CAT_COLORS, uid } from "../system/constants.js";
import { milestonesOf, milestoneShares, milestoneProgress, longEarned } from "../system/milestones.js";
import { DQ, Ring } from "./shared.jsx";
import { daysUntil, dueLabel } from "./Today.jsx";

const FILTER_KEY = "la:questFilter";
const readFilter = () => { try { return localStorage.getItem(FILTER_KEY) || "All"; } catch { return "All"; } };

const STATUS_STYLE = {
  Active:    { bg: "rgba(34,197,94,0.15)",   color: "var(--green-t)", dot: "#22c55e" },
  Pending:   { bg: "rgba(100,116,139,0.15)", color: "var(--tx2)", dot: "#64748b" },
  Completed: { bg: "rgba(59,130,246,0.15)",  color: "var(--blue-t)", dot: "#3b82f6" },
};
const DIFF_STYLE = {
  "Trivial":   { color: "var(--grey-t)", bg: "rgba(100,116,139,0.15)" },
  "Easy":      { color: "var(--green-t)", bg: "rgba(34,197,94,0.12)" },
  "Medium":    { color: "var(--blue-t)", bg: "rgba(59,130,246,0.12)" },
  "Hard":      { color: "var(--gold)", bg: "rgba(245,158,11,0.12)" },
  "Very Hard": { color: "var(--red-t)", bg: "rgba(239,68,68,0.12)" },
  "Legendary": { color: "var(--purp-t)", bg: "rgba(168,85,247,0.12)" },
};

function LQ({ q, onEdit, onDel, onToggle, onMilestone, ac, today }) {
  const [open, setOpen] = useState(false);
  const ms = milestonesOf(q);
  const prog = milestoneProgress(q);
  const shares = milestoneShares(q);
  const ss = STATUS_STYLE[q.status] || STATUS_STYLE.Pending;
  const n = q.due && q.status !== "Completed" ? daysUntil(q.due, today) : null;
  const ds = q.difficulty ? (DIFF_STYLE[q.difficulty] || DIFF_STYLE["Medium"]) : null;
  return (
    <div className={"quest" + (q.status === "Completed" ? " done" : "")}>
      <button type="button" className="qchk" aria-label={q.status === "Completed" ? `Mark ${q.title} active` : `Complete ${q.title}`} onClick={() => onToggle(q.id)} style={{ width: 32, height: 32, background: q.status === "Completed" ? ac : "transparent", borderColor: q.status === "Completed" ? ac : undefined }}>{q.status === "Completed" ? "✓" : ""}</button>
      <div className="qb">
        <div className={"qt" + (q.status === "Completed" ? " done" : "")}>{q.title}</div>
        <div className="qm">
          <span className="qxp">{ms.length && q.status !== "Completed" ? `${longEarned(q).toLocaleString()} / ${q.xp.toLocaleString()} XP` : `+${q.xp.toLocaleString()} XP`}</span>
          <span className="qst" style={{ background: ss.bg, color: ss.color }}><span style={{ width: 5, height: 5, borderRadius: "50%", background: ss.dot, display: "inline-block" }} />{q.status}</span>
          {ds && <span className="qst" style={{ background: ds.bg, color: ds.color }}>{q.difficulty}</span>}
          {n != null && <span className={"qdue" + (n < 0 ? " over" : "")}>{dueLabel(n)}</span>}
        </div>
        {q.notes && <div className="qnt">{q.notes}</div>}
        {ms.length > 0 && (
          <>
            <button type="button" className="ms-bar" aria-expanded={open} onClick={() => setOpen(o => !o)} aria-label={`${prog.done} of ${prog.total} milestones done, ${open ? "hide" : "show"} milestones`}>
              <span className="xp-bg" style={{ display: "block", flex: 1 }}><span className="xp-f" style={{ display: "block", width: prog.pct + "%", background: ac }} /></span>
              <span className="ms-n">{prog.done}/{prog.total}</span>
              <span className={"blk-a" + (open ? " open" : "")} aria-hidden="true">▾</span>
            </button>
            {open && (
              <div className="ms-list">
                {ms.map((m, i) => (
                  <button type="button" key={m.id} className={"ms-i" + (m.done ? " done" : "")} aria-pressed={!!m.done} onClick={() => onMilestone(q.id, m.id)}>
                    <span className="qchk" aria-hidden="true" style={m.done ? { borderColor: ac, background: ac, width: 20, height: 20, fontSize: 11 } : { width: 20, height: 20 }}>{m.done ? "✓" : ""}</span>
                    <span className="ms-t">{m.title}</span>
                    <span className="ms-x">+{shares[i]}</span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      <div className="qac">
        <button className="bi" aria-label={`Edit ${q.title}`} onClick={() => onEdit(q)}>✎</button>
        <button className="bi del" aria-label={`Delete ${q.title}`} onClick={() => onDel(q.id)}>✕</button>
      </div>
    </div>
  );
}

export default function Quests({ data, today, level, total, toggleLong, toggleMilestone, toggleDaily, onQuestMenu, delLong, openAdd, openEdit }) {
  const { longQ, dailyQ } = data;
  const [filter, setFilterState] = useState(readFilter);
  const setFilter = (f) => { setFilterState(f); try { localStorage.setItem(FILTER_KEY, f); } catch { /* blocked */ } };
  const showDaily = filter === "Daily";
  const doneToday = dailyQ.filter(q => q.lastDone === today).length;
  const longXP = longQ.reduce((s, q) => s + longEarned(q), 0);
  const fq = (cat) => longQ.filter(q => q.category === cat).filter(q => filter === "All" || q.status === filter);
  return (
    <>
      <div className="pg-title">Quest Board</div>
      <div className="pg-sub">Long-term milestones and daily non-negotiables. Auto quests complete from the tracker: log it once.</div>
      <div className="xp-card">
        <Ring size={62} stroke={6} pct={level.progress}>
          <span className="ring-lv">{level.level}</span>
          <span className="ring-lv-s">LV</span>
        </Ring>
        <div className="xp-w">
          <div className="xp-lv">{level.name}</div>
          <div className="xp-n">{total.toLocaleString()} XP{level.next ? ` · ${(level.next - total).toLocaleString()} to level ${level.level + 1}` : " · max level"}</div>
          <div className="xp-bg" style={{ marginTop: 8 }}><div className="xp-f" style={{ width: level.progress + "%" }} /></div>
        </div>
      </div>
      <div className="frow">
        {["All", "Active", "Pending", "Completed"].map(f => <button type="button" key={f} className={"chip" + (filter === f ? " active" : "")} aria-pressed={filter === f} onClick={() => setFilter(f)}>{f}</button>)}
        <button type="button" className={"chip dc" + (filter === "Daily" ? " active" : "")} aria-pressed={filter === "Daily"} onClick={() => setFilter("Daily")}>🔥 Daily</button>
        <div style={{ marginLeft: "auto", fontSize: 12, fontWeight: 600, color: "var(--mut)" }}>
          {showDaily ? `${doneToday}/${dailyQ.length} today` : `${longQ.filter(q => q.status === "Completed").length}/${longQ.length} · ${longXP.toLocaleString()} XP`}
        </div>
      </div>
      {showDaily ? (
        CATEGORIES.map(cat => {
          const items = dailyQ.filter(q => q.category === cat);
          if (!items.length) return null;
          const { accent, text } = CAT_COLORS[cat];
          return (
            <div className="cat-sec" key={cat}>
              <div className="cat-hdr">
                <div className="cat-dot" style={{ background: accent }} />
                <div className="cat-nm">{cat}</div>
                <div className="cat-xp" style={{ color: text, borderColor: accent, background: accent + "18" }}>{items.filter(q => q.lastDone === today).length}/{items.length} today</div>
              </div>
              {items.map(q => <DQ key={q.id} q={q} today={today} onToggle={toggleDaily} onMenu={onQuestMenu} ac={accent} />)}
            </div>
          );
        })
      ) : (
        CATEGORIES.map(cat => {
          const items = fq(cat);
          const all = longQ.filter(q => q.category === cat);
          const earned = all.reduce((s, q) => s + longEarned(q), 0);
          const total = all.reduce((s, q) => s + q.xp, 0);
          const { accent, text } = CAT_COLORS[cat];
          return (
            <div className="cat-sec" key={cat}>
              <div className="cat-hdr">
                <div className="cat-dot" style={{ background: accent }} />
                <div className="cat-nm">{cat}</div>
                <div className="cat-xp" style={{ color: text, borderColor: accent, background: accent + "18" }}>{earned.toLocaleString()} / {total.toLocaleString()} XP</div>
              </div>
              {items.length === 0 ? <div style={{ fontSize: 12, color: "var(--dim)", padding: "8px 0", fontStyle: "italic" }}>No quests matching filter.</div> : items.map(q => <LQ key={q.id} q={q} today={today} onEdit={openEdit} onDel={delLong} onToggle={toggleLong} onMilestone={toggleMilestone} ac={accent} />)}
              <button className="btn-add" onClick={() => openAdd(cat)}>+ Add Quest</button>
            </div>
          );
        })
      )}
    </>
  );
}

function DailyModal({ quest, onSave, onClose }) {
  const [title, setTitle] = useState(quest.title);
  const [baseXp, setBaseXp] = useState(String(quest.baseXp ?? 25));
  const [note, setNote] = useState(quest.note || "");
  const xpNum = parseInt(baseXp, 10);
  const valid = title.trim() && Number.isFinite(xpNum) && xpNum >= 0 && xpNum <= 1000;
  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()} onKeyDown={e => e.key === "Escape" && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label="Edit daily quest">
        <div className="mt">Edit daily quest</div>
        <div className="fg"><label className="fl" htmlFor="dq-title">QUEST TITLE</label><input id="dq-title" className="fi" value={title} onChange={e => setTitle(e.target.value)} autoFocus /></div>
        <div className="fg"><label className="fl" htmlFor="dq-xp">BASE XP</label><input id="dq-xp" className="fi" type="number" inputMode="numeric" min={0} max={1000} step={5} value={baseXp} onChange={e => setBaseXp(e.target.value)} />
          <div className="qhint">Streak multipliers apply on top: x1.5 at 7 days, x2 at 14, x3 at 30. Already earned XP is unchanged.</div>
        </div>
        <div className="fg"><label className="fl" htmlFor="dq-note">NOTE</label><input id="dq-note" className="fi" value={note} onChange={e => setNote(e.target.value)} placeholder="Short hint shown on the row" /></div>
        <div className="mf">
          <button className="bs" onClick={onClose}>Cancel</button>
          <button className="bp" disabled={!valid} onClick={() => valid && onSave({ title: title.trim(), baseXp: xpNum, note: note.trim() || undefined })}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}

export function QModal({ modal, onSave, onClose }) {
  if (modal.mode === "daily") return <DailyModal quest={modal.quest} onSave={onSave} onClose={onClose} />;
  return <LongModal modal={modal} onSave={onSave} onClose={onClose} />;
}

function LongModal({ modal, onSave, onClose }) {
  const isEdit = modal.mode === "edit";
  const [title, setTitle] = useState(isEdit ? modal.quest.title : "");
  const [category, setCategory] = useState(isEdit ? modal.quest.category : (modal.category || CATEGORIES[0]));
  const [xp, setXp] = useState(isEdit ? String(modal.quest.xp) : "");
  const [status, setStatus] = useState(isEdit ? modal.quest.status : "Active");
  const [notes, setNotes] = useState(isEdit ? modal.quest.notes : "");
  const [difficulty, setDifficulty] = useState(isEdit ? (modal.quest.difficulty || "") : "");
  const [due, setDue] = useState(isEdit ? (modal.quest.due || "") : "");
  const [milestones, setMilestones] = useState(() => (isEdit ? milestonesOf(modal.quest).map(m => ({ ...m })) : []));
  const setMs = (id, patch) => setMilestones(list => list.map(m => (m.id === id ? { ...m, ...patch } : m)));
  const moveMs = (idx, dir) => setMilestones(list => {
    const j = idx + dir;
    if (j < 0 || j >= list.length) return list;
    const next = [...list];
    [next[idx], next[j]] = [next[j], next[idx]];
    return next;
  });
  const cleanMs = milestones.map(m => ({ ...m, title: m.title.trim() })).filter(m => m.title);
  const previewShares = milestoneShares({ xp: parseInt(xp) || 0, milestones: cleanMs });
  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()} onKeyDown={e => e.key === "Escape" && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={isEdit ? "Edit Quest" : "New Quest"}>
        <div className="mt">{isEdit ? "Edit Quest" : "New Quest"}</div>
        <div className="fg"><label className="fl">QUEST TITLE</label><input className="fi" value={title} onChange={e => setTitle(e.target.value)} placeholder="What needs to be done?" autoFocus /></div>
        <div className="fg"><label className="fl">CATEGORY</label><select className="fsel" value={category} onChange={e => setCategory(e.target.value)}>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
        <div className="fg"><label className="fl">NOTES</label><textarea className="fta" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Context, sub-tasks, timeline..." /></div>
        <div style={{ display: "flex", gap: 11 }}>
          <div className="fg" style={{ flex: 1 }}><label className="fl">XP REWARD</label><input className="fi" type="number" value={xp} onChange={e => setXp(e.target.value)} min={0} step={50} /></div>
          <div className="fg" style={{ flex: 1 }}><label className="fl">DIFFICULTY</label>
            <select className="fsel" value={difficulty} onChange={e => setDifficulty(e.target.value)}>
              <option value="">- unset -</option>
              {Object.keys(DIFF_STYLE).map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>
        <div className="fg">
          <label className="fl">MILESTONES (OPTIONAL)</label>
          {milestones.map((m, i) => (
            <div className="ms-edit" key={m.id}>
              <button type="button" className="qchk" aria-label={m.done ? `Mark milestone ${i + 1} open` : `Mark milestone ${i + 1} done`} aria-pressed={!!m.done} onClick={() => setMs(m.id, { done: !m.done })} style={m.done ? { background: "var(--acc)", borderColor: "var(--acc)" } : {}}>{m.done ? "✓" : ""}</button>
              <input className="fi" value={m.title} aria-label={`Milestone ${i + 1}`} placeholder={`Milestone ${i + 1}`} onChange={e => setMs(m.id, { title: e.target.value })} />
              <span className="ms-x">{m.title.trim() ? `+${previewShares[cleanMs.findIndex(c => c.id === m.id)] ?? 0}` : ""}</span>
              <button type="button" className="bi" aria-label={`Move milestone ${i + 1} up`} disabled={i === 0} onClick={() => moveMs(i, -1)}>↑</button>
              <button type="button" className="bi del" aria-label={`Remove milestone ${i + 1}`} onClick={() => setMilestones(list => list.filter(x => x.id !== m.id))}>✕</button>
            </div>
          ))}
          <button type="button" className="btn-add" onClick={() => setMilestones(list => [...list, { id: uid(), title: "", done: false }])}>+ Add milestone</button>
          {cleanMs.length > 0 && <div className="qhint">XP is split across milestones; each done milestone pays its share.</div>}
        </div>
        <div className="fg"><label className="fl">DUE DATE (OPTIONAL)</label><input className="fi" type="date" value={due} onChange={e => setDue(e.target.value)} /></div>
        <div className="fg"><label className="fl">STATUS</label><select className="fsel" value={status} onChange={e => setStatus(e.target.value)}><option>Active</option><option>Pending</option><option>Completed</option></select></div>
        <div className="mf">
          <button className="bs" onClick={onClose}>Cancel</button>
          <button className="bp" onClick={() => { if (!title.trim() || !xp) return; onSave({ title: title.trim(), category, xp: parseInt(xp) || 0, status: cleanMs.length && cleanMs.every(m => m.done) ? "Completed" : status, notes: notes.trim(), difficulty, due: due || undefined, milestones: cleanMs.length ? cleanMs : undefined }); }} disabled={!title.trim() || !xp}>{isEdit ? "Save Changes" : "Add Quest"}</button>
        </div>
      </div>
    </div>
  );
}
