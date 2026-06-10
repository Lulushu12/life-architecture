/** Shared chrome: stylesheet, schedule block, quest rows, small widgets. */
import { useState } from "react";
import { BLOCK_META_V2 } from "../system/schedule.js";
import { STREAK_MULT, STREAK_LABEL, STREAK_COLOR, todayKey } from "../system/constants.js";

export const css = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{background:#060c18;color:#e2e8f0;font-family:'DM Sans',sans-serif}
.shell{display:flex;min-height:100vh}
.sidebar{width:210px;background:#0a1120;border-right:1px solid #1e2d40;padding:26px 0 16px;position:sticky;top:0;height:100vh;overflow-y:auto;flex-shrink:0;display:flex;flex-direction:column}
.logo{padding:0 16px 22px;border-bottom:1px solid #1e2d40;margin-bottom:14px}
.logo-t{font-family:'Bebas Neue',sans-serif;font-size:20px;letter-spacing:2px;line-height:1.1}
.logo-s{font-size:10px;color:#475569;font-family:'JetBrains Mono',monospace;letter-spacing:1px;margin-top:3px}
.nav-s{padding:12px 16px 4px;font-size:10px;color:#334155;letter-spacing:2px;font-family:'JetBrains Mono',monospace}
.nav-i{display:flex;align-items:center;gap:8px;padding:8px 16px;cursor:pointer;font-size:12px;font-weight:500;color:#64748b;border-left:3px solid transparent;transition:all 0.15s;user-select:none}
.nav-i:hover{color:#94a3b8;background:rgba(255,255,255,0.03)}
.nav-i.active{color:#e2e8f0;border-left-color:#3b82f6;background:rgba(59,130,246,0.08)}
.main{flex:1;padding:32px 40px;max-width:920px}
.pg-title{font-family:'Bebas Neue',sans-serif;font-size:40px;letter-spacing:3px;margin-bottom:5px}
.pg-sub{font-size:13px;color:#475569;margin-bottom:28px}
.xp-card{background:#0a1120;border:1px solid #1e2d40;border-radius:12px;padding:16px 20px;margin-bottom:28px;display:flex;align-items:center;gap:22px}
.xp-lv{font-family:'Bebas Neue',sans-serif;font-size:18px;letter-spacing:2px;color:#3b82f6}
.xp-n{font-family:'JetBrains Mono',monospace;font-size:11px;color:#64748b;margin-top:2px}
.xp-w{flex:1}
.xp-bg{height:5px;background:#1e2d40;border-radius:99px;overflow:hidden}
.xp-f{height:100%;background:linear-gradient(90deg,#3b82f6,#60a5fa);border-radius:99px;transition:width 0.6s}
.card{background:#0a1120;border:1px solid #1e2d40;border-radius:12px;padding:20px;margin-bottom:16px}
.card-t{font-size:10px;font-weight:700;color:#64748b;letter-spacing:2px;text-transform:uppercase;margin-bottom:13px;font-family:'JetBrains Mono',monospace}
.callout{border-radius:8px;padding:13px 16px;margin-bottom:16px;border-left:3px solid}
.cn{background:rgba(15,30,60,0.6);border-color:#3b82f6}
.cg{background:rgba(40,28,8,0.7);border-color:#f59e0b}
.cr{background:rgba(60,15,15,0.55);border-color:#ef4444}
.cgr{background:rgba(8,40,20,0.55);border-color:#22c55e}
.ct{font-size:13px;line-height:1.7;color:#cbd5e1}
.ct strong{color:#e2e8f0}
.day-tabs{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:16px}
.day-tab{padding:5px 12px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:500;border:1px solid #1e2d40;background:transparent;color:#64748b;transition:all 0.15s;user-select:none}
.day-tab:hover{border-color:#3b82f6;color:#93c5fd}
.day-tab.active{background:rgba(59,130,246,0.15);border-color:#3b82f6;color:#93c5fd}
.day-type{font-family:'Bebas Neue',sans-serif;font-size:16px;letter-spacing:2px;color:#3b82f6;margin-bottom:3px}
.day-sub{font-size:12px;color:#475569;margin-bottom:12px;font-style:italic}
.blk{border-radius:7px;border:1px solid;margin-bottom:3px;overflow:hidden;transition:filter 0.15s}
.blk.ck{cursor:pointer}
.blk.ck:hover{filter:brightness(1.09)}
.blk-m{display:flex;align-items:center}
.blk-t{width:125px;flex-shrink:0;padding:8px 10px;font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:600;border-right:1px solid rgba(255,255,255,0.06)}
.blk-c{padding:8px 12px;flex:1}
.blk-l{font-size:12px;font-weight:500}
.blk-b{font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:1px;margin-left:6px;opacity:0.7}
.blk-a{padding:0 10px;font-size:10px;color:#475569;transition:transform 0.2s;flex-shrink:0}
.blk-a.open{transform:rotate(180deg)}
.blk-d{border-top:1px solid rgba(255,255,255,0.06);padding:10px 12px}
.det{font-size:12px;color:#94a3b8;line-height:1.6;margin-bottom:8px}
.tm{background:rgba(168,85,247,0.08);border:1px solid rgba(168,85,247,0.3);border-radius:5px;padding:7px 10px;display:flex;gap:8px;align-items:flex-start}
.tm-l{font-family:'JetBrains Mono',monospace;font-size:9px;color:#a855f7;letter-spacing:1px;flex-shrink:0;margin-top:2px}
.tm-t{font-size:12px;color:#d8b4fe;line-height:1.5;font-style:italic}
.leg{display:flex;gap:10px;flex-wrap:wrap;margin-top:12px}
.leg-i{display:flex;align-items:center;gap:4px;font-size:10px;color:#475569}
.leg-d{width:6px;height:6px;border-radius:2px;flex-shrink:0}
.tbl{width:100%;border-collapse:collapse;font-size:12px}
.tbl th{background:#0d1b30;padding:8px 12px;text-align:left;font-size:10px;letter-spacing:1.5px;color:#475569;font-family:'JetBrains Mono',monospace;border-bottom:1px solid #1e2d40}
.tbl td{padding:9px 12px;border-bottom:1px solid #111827;font-size:12px;line-height:1.5}
.tbl tr:last-child td{border-bottom:none}
.old{color:#f87171}.nw{color:#4ade80}
.bld{color:#4ade80;font-weight:600}.brk{color:#f87171;font-weight:600}
.law-n{font-family:'JetBrains Mono',monospace;font-weight:600;color:#3b82f6}
.frow{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px;align-items:center}
.chip{padding:4px 12px;border-radius:99px;border:1px solid #1e2d40;font-size:11px;cursor:pointer;color:#64748b;transition:all 0.15s;user-select:none}
.chip:hover{border-color:#3b82f6;color:#93c5fd}
.chip.active{background:rgba(59,130,246,0.15);border-color:#3b82f6;color:#93c5fd}
.chip.dc{border-color:#a855f7;color:#a855f7}
.chip.dc.active{background:rgba(168,85,247,0.15);border-color:#a855f7;color:#d8b4fe}
.cat-sec{margin-bottom:28px}
.cat-hdr{display:flex;align-items:center;gap:10px;margin-bottom:10px;flex-wrap:wrap}
.cat-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.cat-nm{font-family:'Bebas Neue',sans-serif;font-size:18px;letter-spacing:2px}
.cat-xp{font-family:'JetBrains Mono',monospace;font-size:10px;padding:2px 8px;border-radius:99px;border:1px solid}
.quest{background:#0a1120;border:1px solid #1e2d40;border-radius:7px;padding:11px 13px;display:flex;align-items:flex-start;gap:11px;margin-bottom:4px;transition:border-color 0.15s}
.quest:hover{border-color:#2d3f56}
.quest.done{opacity:0.45}
.qchk{width:16px;height:16px;border-radius:3px;border:2px solid #1e2d40;flex-shrink:0;margin-top:2px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all 0.15s;font-size:10px;font-weight:700;color:white}
.qchk.lock{cursor:default;border-style:dashed}
.qb{flex:1;min-width:0}
.qt{font-size:12px;color:#e2e8f0;line-height:1.4}
.qt.done{text-decoration:line-through;color:#475569}
.qm{display:flex;align-items:center;gap:6px;margin-top:4px;flex-wrap:wrap}
.qxp{font-family:'JetBrains Mono',monospace;font-size:10px;color:#3b82f6}
.qst{font-size:10px;padding:2px 6px;border-radius:99px;font-family:'JetBrains Mono',monospace;font-weight:600;display:flex;align-items:center;gap:3px}
.qnt{font-size:10px;color:#475569;margin-top:3px;font-style:italic}
.qac{display:flex;gap:4px;flex-shrink:0;opacity:0;transition:opacity 0.15s}
.quest:hover .qac{opacity:1}
.bi{width:24px;height:24px;border-radius:5px;border:1px solid #1e2d40;background:transparent;cursor:pointer;color:#64748b;display:flex;align-items:center;justify-content:center;font-size:11px;transition:all 0.15s}
.bi:hover{border-color:#3b82f6;color:#93c5fd;background:rgba(59,130,246,0.1)}
.bi.del:hover{border-color:#ef4444;color:#f87171;background:rgba(239,68,68,0.1)}
.btn-add{width:100%;padding:8px;border-radius:6px;border:1px dashed #1e2d40;background:transparent;cursor:pointer;color:#475569;font-size:12px;font-family:'DM Sans',sans-serif;transition:all 0.15s;margin-top:3px}
.btn-add:hover{border-color:#3b82f6;color:#3b82f6;background:rgba(59,130,246,0.05)}
.dq{background:#0a1120;border:1px solid #1e2d40;border-radius:7px;padding:11px 13px;display:flex;align-items:center;gap:11px;margin-bottom:4px;transition:border-color 0.15s}
.dq:hover{border-color:#2d3f56}
.dq.done{opacity:0.45}
.di{flex:1;min-width:0}
.dt{font-size:12px;color:#e2e8f0;line-height:1.4}
.dt.done{text-decoration:line-through;color:#475569}
.dm{display:flex;align-items:center;gap:7px;margin-top:4px;flex-wrap:wrap}
.sb{display:flex;align-items:center;gap:3px;font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:600}
.mb{font-family:'JetBrains Mono',monospace;font-size:10px;padding:1px 6px;border-radius:99px;font-weight:700}
.dn{font-size:10px;color:#475569;font-style:italic}
.overlay{position:fixed;inset:0;background:rgba(0,0,0,0.75);display:flex;align-items:center;justify-content:center;z-index:100;padding:20px}
.modal{background:#0d1829;border:1px solid #1e2d40;border-radius:12px;padding:24px;width:100%;max-width:460px;max-height:90vh;overflow-y:auto}
.mt{font-family:'Bebas Neue',sans-serif;font-size:21px;letter-spacing:2px;margin-bottom:16px}
.fg{margin-bottom:13px}
.fl{font-size:10px;color:#64748b;letter-spacing:1.5px;font-family:'JetBrains Mono',monospace;display:block;margin-bottom:5px}
.fi,.fsel,.fta{width:100%;background:#060c18;border:1px solid #1e2d40;border-radius:6px;padding:8px 10px;color:#e2e8f0;font-family:'DM Sans',sans-serif;font-size:13px;outline:none;transition:border-color 0.15s}
.fi:focus,.fsel:focus,.fta:focus{border-color:#3b82f6}
.fsel option{background:#0d1829}
.fta{resize:vertical;min-height:64px}
.mf{display:flex;gap:8px;justify-content:flex-end;margin-top:20px}
.bp{padding:8px 16px;border-radius:6px;background:#3b82f6;color:white;border:none;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:600;transition:background 0.15s}
.bp:hover{background:#2563eb}
.bp:disabled{opacity:0.4;cursor:not-allowed}
.bp.green{background:#16a34a}.bp.green:hover{background:#15803d}
.bp.amber{background:#d97706}.bp.amber:hover{background:#b45309}
.bs{padding:8px 16px;border-radius:6px;background:transparent;color:#64748b;border:1px solid #1e2d40;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:13px;transition:all 0.15s}
.bs:hover{border-color:#3b82f6;color:#93c5fd}
.pr{margin-bottom:20px;padding-bottom:20px;border-bottom:1px solid #111827}
.pr:last-child{border-bottom:none;margin-bottom:0;padding-bottom:0}
.pt{font-family:'Bebas Neue',sans-serif;font-size:19px;letter-spacing:2px;color:#3b82f6;margin-bottom:6px}
.pd{font-size:13px;color:#94a3b8;line-height:1.7}
.oc{background:#0a1120;border:1px solid #1e2d40;border-radius:9px;padding:14px 16px;margin-bottom:9px;display:flex;align-items:flex-start;gap:13px}
.on{font-family:'Bebas Neue',sans-serif;font-size:28px;color:#1e2d40;flex-shrink:0;width:32px;text-align:center}
.ot{font-size:14px;font-weight:600;color:#e2e8f0;margin-bottom:3px}
.od{font-size:12px;color:#64748b;line-height:1.5}
.op{font-size:10px;padding:2px 8px;border-radius:99px;font-family:'JetBrains Mono',monospace;font-weight:600;margin-left:auto;flex-shrink:0;white-space:nowrap}
.mac-row{display:flex;gap:14px;flex-wrap:wrap;margin-bottom:6px}
.mac{flex:1;min-width:130px}
.mac-l{display:flex;justify-content:space-between;font-size:10px;font-family:'JetBrains Mono',monospace;color:#64748b;margin-bottom:4px}
.mac-bg{height:6px;background:#1e2d40;border-radius:99px;overflow:hidden}
.mac-f{height:100%;border-radius:99px;transition:width 0.4s}
.set-row{display:flex;gap:6px;align-items:center;margin-bottom:4px}
.set-n{font-family:'JetBrains Mono',monospace;font-size:10px;color:#475569;width:34px;flex-shrink:0}
.fi.sm{width:64px;padding:5px 7px;font-size:12px;text-align:center}
.tgl{padding:4px 9px;border-radius:5px;border:1px solid #1e2d40;background:transparent;font-size:10px;cursor:pointer;color:#64748b;font-family:'JetBrains Mono',monospace;transition:all 0.12s;user-select:none}
.tgl.on{border-color:#22c55e;color:#4ade80;background:rgba(34,197,94,0.1)}
.tgl.bad{border-color:#ef4444;color:#f87171;background:rgba(239,68,68,0.1)}
.ex-card{background:#0a1120;border:1px solid #1e2d40;border-radius:9px;padding:13px 15px;margin-bottom:8px}
.ex-hd{display:flex;align-items:baseline;gap:9px;margin-bottom:8px;flex-wrap:wrap}
.ex-nm{font-size:13px;font-weight:600}
.ex-wt{font-family:'JetBrains Mono',monospace;font-size:11px;color:#f59e0b}
.ex-nt{font-size:10px;color:#475569;font-style:italic}
.gate{font-size:11px;font-family:'JetBrains Mono',monospace;padding:6px 9px;border-radius:6px;margin-top:6px;line-height:1.5}
.gate.advance{background:rgba(34,197,94,0.1);color:#4ade80;border:1px solid rgba(34,197,94,0.35)}
.gate.hold{background:rgba(100,116,139,0.1);color:#94a3b8;border:1px solid rgba(100,116,139,0.3)}
.gate.drop_back{background:rgba(239,68,68,0.1);color:#f87171;border:1px solid rgba(239,68,68,0.35)}
.coach-card{border:1px solid #1e2d40;border-radius:9px;padding:14px 16px;margin-top:12px;background:#0a1120}
.coach-pid{font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:1px;color:#3b82f6;margin-bottom:6px}
.coach-act{font-size:13px;line-height:1.7;color:#e2e8f0}
::-webkit-scrollbar{width:4px}
::-webkit-scrollbar-track{background:#060c18}
::-webkit-scrollbar-thumb{background:#1e2d40;border-radius:99px}
@keyframes fs{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
.fi-anim{animation:fs 0.2s ease forwards}
@media(max-width:760px){.shell{flex-direction:column}.sidebar{width:100%;height:auto;position:relative;padding:12px 0}.main{padding:20px 14px}}
`;

export function Blk({ b }) {
  const [open, setOpen] = useState(false);
  const m = BLOCK_META_V2[b.type] || BLOCK_META_V2.wildcard;
  const inter = !!(b.detail || b.twoMin);
  return (
    <div className={"blk" + (inter ? " ck" : "")} style={{ borderColor: m.color + "55", background: m.bg, opacity: b.type === "wildcard" ? 0.6 : 1 }} onClick={() => inter && setOpen(o => !o)}>
      <div className="blk-m">
        <div className="blk-t" style={{ color: m.color }}>{b.time}</div>
        <div className="blk-c">
          <span className="blk-l" style={{ color: b.type === "wildcard" ? "#475569" : "#e2e8f0" }}>{b.label}</span>
          <span className="blk-b" style={{ color: m.color }}>{m.label}</span>
        </div>
        {inter && <div className={"blk-a" + (open ? " open" : "")}>▾</div>}
      </div>
      {open && (
        <div className="blk-d">
          {b.detail && <div className="det">{b.detail}</div>}
          {b.twoMin && <div className="tm"><span className="tm-l">FALLBACK</span><span className="tm-t">{b.twoMin}</span></div>}
        </div>
      )}
    </div>
  );
}

export function DQ({ q, onToggle, ac }) {
  const today = todayKey();
  const done = q.lastDone === today;
  const mult = STREAK_MULT(q.streak);
  const earnedXp = Math.round(q.baseXp * mult);
  const sc = STREAK_COLOR(q.streak);
  const locked = !!q.auto;
  return (
    <div className={"dq" + (done ? " done" : "")}>
      <div
        className={"qchk" + (locked ? " lock" : "")}
        onClick={() => !locked && onToggle(q.id)}
        title={locked ? "Auto-completed by the tracker" : ""}
        style={done ? { borderColor: ac, background: ac } : {}}
      >{done ? "✓" : locked ? "·" : ""}</div>
      <div className="di">
        <div className={"dt" + (done ? " done" : "")}>{q.title}</div>
        <div className="dm">
          <span className="qxp">+{earnedXp} XP</span>
          {q.streak > 0 && <span className="sb" style={{ color: sc }}>🔥 {q.streak}</span>}
          {mult > 1 && <span className="mb" style={{ color: sc, background: sc + "22", border: "1px solid " + sc }}>{STREAK_LABEL(q.streak)}</span>}
          {q.note && <span className="dn">{q.note}</span>}
        </div>
      </div>
    </div>
  );
}

export function MacroBar({ label, value, target, color, unit = "g" }) {
  const pct = Math.min(100, Math.round((value / target) * 100));
  const over = value > target * 1.03;
  return (
    <div className="mac">
      <div className="mac-l">
        <span>{label}</span>
        <span style={{ color: over ? "#f87171" : value >= target ? "#4ade80" : "#64748b" }}>
          {Math.round(value)}/{target}{unit}
        </span>
      </div>
      <div className="mac-bg"><div className="mac-f" style={{ width: pct + "%", background: over ? "#ef4444" : color }} /></div>
    </div>
  );
}
