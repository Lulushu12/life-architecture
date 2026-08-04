import { useState } from "react";
import { CATEGORIES, CAT_COLORS, todayKey } from "../system/constants.js";
import { DQ } from "./shared.jsx";

const STATUS_STYLE = {
  Active:    { bg: "rgba(34,197,94,0.15)",   color: "#22c55e", dot: "#22c55e" },
  Pending:   { bg: "rgba(100,116,139,0.15)", color: "#94a3b8", dot: "#64748b" },
  Completed: { bg: "rgba(59,130,246,0.15)",  color: "#3b82f6", dot: "#3b82f6" },
};
const DIFF_STYLE = {
  "Trivial":   { color: "#64748b", bg: "rgba(100,116,139,0.15)" },
  "Easy":      { color: "#22c55e", bg: "rgba(34,197,94,0.12)" },
  "Medium":    { color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
  "Hard":      { color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  "Very Hard": { color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
  "Legendary": { color: "#a855f7", bg: "rgba(168,85,247,0.12)" },
};

function LQ({ q, onEdit, onDel, onToggle, ac }) {
  const ss = STATUS_STYLE[q.status] || STATUS_STYLE.Pending;
  const ds = q.difficulty ? (DIFF_STYLE[q.difficulty] || DIFF_STYLE["Medium"]) : null;
  return (
    <div className={"quest" + (q.status === "Completed" ? " done" : "")}>
      <div className="qchk" onClick={() => onToggle(q.id)} style={q.status === "Completed" ? { borderColor: ac, background: ac } : {}}>{q.status === "Completed" ? "✓" : ""}</div>
      <div className="qb">
        <div className={"qt" + (q.status === "Completed" ? " done" : "")}>{q.title}</div>
        <div className="qm">
          <span className="qxp">+{q.xp.toLocaleString()} XP</span>
          <span className="qst" style={{ background: ss.bg, color: ss.color }}><span style={{ width: 5, height: 5, borderRadius: "50%", background: ss.dot, display: "inline-block" }} />{q.status}</span>
          {ds && <span className="qst" style={{ background: ds.bg, color: ds.color }}>{q.difficulty}</span>}
        </div>
        {q.notes && <div className="qnt">{q.notes}</div>}
      </div>
      <div className="qac">
        <button className="bi" onClick={() => onEdit(q)}>✎</button>
        <button className="bi del" onClick={() => onDel(q.id)}>✕</button>
      </div>
    </div>
  );
}

export default function Quests({ longQ, dailyQ, toggleLong, toggleDaily, delLong, openAdd, openEdit, filter, setFilter }) {
  const showDaily = filter === "Daily";
  const today = todayKey();
  const doneToday = dailyQ.filter(q => q.lastDone === today).length;
  const longXP = longQ.filter(q => q.status === "Completed").reduce((s, q) => s + q.xp, 0);
  const fq = (cat) => longQ.filter(q => q.category === cat).filter(q => filter === "All" || q.status === filter);
  return (
    <>
      <div className="pg-title">Quest Board</div>
      <div className="pg-sub">Long-term milestones and daily non-negotiables. AUTO quests complete from the tracker — log it once.</div>
      <div className="frow">
        {["All", "Active", "Pending", "Completed"].map(f => <div key={f} className={"chip" + (filter === f ? " active" : "")} onClick={() => setFilter(f)}>{f}</div>)}
        <div className={"chip dc" + (filter === "Daily" ? " active" : "")} onClick={() => setFilter("Daily")}>🔥 Daily</div>
        <div style={{ marginLeft: "auto", fontSize: 12, fontWeight: 600, color: "var(--mut)" }}>
          {showDaily ? `${doneToday}/${dailyQ.length} today` : `${longQ.filter(q => q.status === "Completed").length}/${longQ.length} · ${longXP.toLocaleString()} XP`}
        </div>
      </div>
      {showDaily ? (
        CATEGORIES.map(cat => {
          const items = dailyQ.filter(q => q.category === cat);
          if (!items.length) return null;
          const { accent, light } = CAT_COLORS[cat];
          return (
            <div className="cat-sec" key={cat}>
              <div className="cat-hdr">
                <div className="cat-dot" style={{ background: accent }} />
                <div className="cat-nm" style={{ color: light }}>{cat}</div>
                <div className="cat-xp" style={{ color: accent, borderColor: accent, background: accent + "18" }}>{items.filter(q => q.lastDone === today).length}/{items.length} today</div>
              </div>
              {items.map(q => <DQ key={q.id} q={q} onToggle={toggleDaily} ac={accent} />)}
            </div>
          );
        })
      ) : (
        CATEGORIES.map(cat => {
          const items = fq(cat);
          const all = longQ.filter(q => q.category === cat);
          const earned = all.filter(q => q.status === "Completed").reduce((s, q) => s + q.xp, 0);
          const total = all.reduce((s, q) => s + q.xp, 0);
          const { accent, light } = CAT_COLORS[cat];
          return (
            <div className="cat-sec" key={cat}>
              <div className="cat-hdr">
                <div className="cat-dot" style={{ background: accent }} />
                <div className="cat-nm" style={{ color: light }}>{cat}</div>
                <div className="cat-xp" style={{ color: accent, borderColor: accent, background: accent + "18" }}>{earned.toLocaleString()} / {total.toLocaleString()} XP</div>
              </div>
              {items.length === 0 ? <div style={{ fontSize: 12, color: "#334155", padding: "8px 0", fontStyle: "italic" }}>No quests matching filter.</div> : items.map(q => <LQ key={q.id} q={q} onEdit={openEdit} onDel={delLong} onToggle={toggleLong} ac={accent} />)}
              <button className="btn-add" onClick={() => openAdd(cat)}>+ Add Quest</button>
            </div>
          );
        })
      )}
    </>
  );
}

export function QModal({ modal, onSave, onClose }) {
  const isEdit = modal.mode === "edit";
  const [title, setTitle] = useState(isEdit ? modal.quest.title : "");
  const [category, setCategory] = useState(isEdit ? modal.quest.category : (modal.category || CATEGORIES[0]));
  const [xp, setXp] = useState(isEdit ? String(modal.quest.xp) : "");
  const [status, setStatus] = useState(isEdit ? modal.quest.status : "Active");
  const [notes, setNotes] = useState(isEdit ? modal.quest.notes : "");
  const [difficulty, setDifficulty] = useState(isEdit ? (modal.quest.difficulty || "") : "");
  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
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
        <div className="fg"><label className="fl">STATUS</label><select className="fsel" value={status} onChange={e => setStatus(e.target.value)}><option>Active</option><option>Pending</option><option>Completed</option></select></div>
        <div className="mf">
          <button className="bs" onClick={onClose}>Cancel</button>
          <button className="bp" onClick={() => { if (!title.trim() || !xp) return; onSave({ title: title.trim(), category, xp: parseInt(xp) || 0, status, notes: notes.trim(), difficulty }); }} disabled={!title.trim() || !xp}>{isEdit ? "Save Changes" : "Add Quest"}</button>
        </div>
      </div>
    </div>
  );
}
