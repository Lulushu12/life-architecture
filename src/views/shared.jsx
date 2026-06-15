/** Shared chrome: stylesheet, schedule block, quest rows, small widgets. */
import { useState } from "react";
import { BLOCK_META_V2 } from "../system/schedule.js";
import { STREAK_MULT, STREAK_LABEL, STREAK_COLOR, todayKey } from "../system/constants.js";

export const css = `
:root{
  --bg:#060c18;--card:#0a1120;--modal:#0d1829;--th:#0d1b30;
  --bd:#1e2d40;--bd2:#111827;--bdh:#2d3f56;
  --tx:#e2e8f0;--tx1:#cbd5e1;--tx2:#94a3b8;--mut:#64748b;--dim:#475569;--fnt:#334155;
  --blue-t:#93c5fd;--green-t:#4ade80;--red-t:#f87171;--purp-t:#d8b4fe;
  --hover:rgba(255,255,255,0.03);--line:rgba(255,255,255,0.06);
  --co-n:rgba(15,30,60,0.6);--co-g:rgba(40,28,8,0.7);--co-r:rgba(60,15,15,0.55);--co-gr:rgba(8,40,20,0.55);
}
[data-theme="light"]{
  --bg:#eef2f7;--card:#ffffff;--modal:#ffffff;--th:#e7edf4;
  --bd:#d8e0ea;--bd2:#e8edf3;--bdh:#94a3b8;
  --tx:#0f172a;--tx1:#334155;--tx2:#475569;--mut:#64748b;--dim:#8295ab;--fnt:#a5b3c4;
  --blue-t:#1d4ed8;--green-t:#15803d;--red-t:#b91c1c;--purp-t:#6d28d9;
  --hover:rgba(15,23,42,0.04);--line:rgba(15,23,42,0.08);
  --co-n:rgba(59,130,246,0.07);--co-g:rgba(245,158,11,0.10);--co-r:rgba(239,68,68,0.07);--co-gr:rgba(34,197,94,0.08);
}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{background:var(--bg);color:var(--tx);font-family:'DM Sans',sans-serif}
.shell{display:flex;min-height:100vh}
.sidebar{width:210px;background:var(--card);border-right:1px solid var(--bd);padding:26px 0 16px;position:sticky;top:0;height:100vh;overflow-y:auto;flex-shrink:0;display:flex;flex-direction:column}
.logo{padding:0 16px 22px;border-bottom:1px solid var(--bd);margin-bottom:14px}
.logo-t{font-family:'Space Grotesk',sans-serif;font-size:20px;letter-spacing:2px;line-height:1.1}
.logo-s{font-size:10px;color:var(--dim);font-family:'JetBrains Mono',monospace;letter-spacing:1px;margin-top:3px}
.nav-s{padding:12px 16px 4px;font-size:10px;color:var(--fnt);letter-spacing:2px;font-family:'JetBrains Mono',monospace}
.nav-i{display:flex;align-items:center;gap:8px;padding:8px 16px;cursor:pointer;font-size:12px;font-weight:500;color:var(--mut);border-left:3px solid transparent;transition:all 0.15s;user-select:none}
.nav-i:hover{color:var(--tx2);background:var(--hover)}
.nav-i.active{color:var(--tx);border-left-color:#3b82f6;background:rgba(59,130,246,0.08)}
.main{flex:1;padding:32px 40px;max-width:920px}
.pg-title{font-family:'Space Grotesk',sans-serif;font-size:40px;letter-spacing:3px;margin-bottom:5px}
.pg-sub{font-size:13px;color:var(--dim);margin-bottom:28px}
.xp-card{background:var(--card);border:1px solid var(--bd);border-radius:12px;padding:16px 20px;margin-bottom:28px;display:flex;align-items:center;gap:22px}
.xp-lv{font-family:'Space Grotesk',sans-serif;font-size:18px;letter-spacing:2px;color:#3b82f6}
.xp-n{font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--mut);margin-top:2px}
.xp-w{flex:1}
.xp-bg{height:5px;background:var(--bd);border-radius:99px;overflow:hidden}
.xp-f{height:100%;background:linear-gradient(90deg,#3b82f6,#60a5fa);border-radius:99px;transition:width 0.6s}
.card{background:var(--card);border:1px solid var(--bd);border-radius:12px;padding:20px;margin-bottom:16px}
.card-t{font-size:10px;font-weight:700;color:var(--mut);letter-spacing:2px;text-transform:uppercase;margin-bottom:13px;font-family:'JetBrains Mono',monospace}
.callout{border-radius:8px;padding:13px 16px;margin-bottom:16px;border-left:3px solid}
.cn{background:var(--co-n);border-color:#3b82f6}
.cg{background:var(--co-g);border-color:#f59e0b}
.cr{background:var(--co-r);border-color:#ef4444}
.cgr{background:var(--co-gr);border-color:#22c55e}
.ct{font-size:13px;line-height:1.7;color:var(--tx1)}
.ct strong{color:var(--tx)}
.day-tabs{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:16px}
.day-tab{padding:5px 12px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:500;border:1px solid var(--bd);background:transparent;color:var(--mut);transition:all 0.15s;user-select:none}
.day-tab:hover{border-color:#3b82f6;color:var(--blue-t)}
.day-tab.active{background:rgba(59,130,246,0.15);border-color:#3b82f6;color:var(--blue-t)}
.day-type{font-family:'Space Grotesk',sans-serif;font-size:16px;letter-spacing:2px;color:#3b82f6;margin-bottom:3px}
.day-sub{font-size:12px;color:var(--dim);margin-bottom:12px;font-style:italic}
.blk{border-radius:7px;border:1px solid;margin-bottom:3px;overflow:hidden;transition:filter 0.15s}
.blk.ck{cursor:pointer}
.blk.ck:hover{filter:brightness(1.09)}
.blk-m{display:flex;align-items:center}
.blk-t{width:125px;flex-shrink:0;padding:8px 10px;font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:600;border-right:1px solid rgba(255,255,255,0.06)}
.blk-c{padding:8px 12px;flex:1}
.blk-l{font-size:12px;font-weight:500}
.blk-b{font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:1px;margin-left:6px;opacity:0.7}
.blk-a{padding:0 10px;font-size:10px;color:var(--dim);transition:transform 0.2s;flex-shrink:0}
.blk-a.open{transform:rotate(180deg)}
.blk-d{border-top:1px solid var(--line);padding:10px 12px}
.det{font-size:12px;color:var(--tx2);line-height:1.6;margin-bottom:8px}
.tm{background:rgba(168,85,247,0.08);border:1px solid rgba(168,85,247,0.3);border-radius:5px;padding:7px 10px;display:flex;gap:8px;align-items:flex-start}
.tm-l{font-family:'JetBrains Mono',monospace;font-size:9px;color:#a855f7;letter-spacing:1px;flex-shrink:0;margin-top:2px}
.tm-t{font-size:12px;color:var(--purp-t);line-height:1.5;font-style:italic}
.leg{display:flex;gap:10px;flex-wrap:wrap;margin-top:12px}
.leg-i{display:flex;align-items:center;gap:4px;font-size:10px;color:var(--dim)}
.leg-d{width:6px;height:6px;border-radius:2px;flex-shrink:0}
.tbl{width:100%;border-collapse:collapse;font-size:12px}
.tbl th{background:var(--th);padding:8px 12px;text-align:left;font-size:10px;letter-spacing:1.5px;color:var(--dim);font-family:'JetBrains Mono',monospace;border-bottom:1px solid var(--bd)}
.tbl td{padding:9px 12px;border-bottom:1px solid var(--bd2);font-size:12px;line-height:1.5}
.tbl tr:last-child td{border-bottom:none}
.old{color:var(--red-t)}.nw{color:var(--green-t)}
.bld{color:var(--green-t);font-weight:600}.brk{color:var(--red-t);font-weight:600}
.law-n{font-family:'JetBrains Mono',monospace;font-weight:600;color:#3b82f6}
.frow{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px;align-items:center}
.chip{padding:4px 12px;border-radius:99px;border:1px solid var(--bd);font-size:11px;cursor:pointer;color:var(--mut);transition:all 0.15s;user-select:none}
.chip:hover{border-color:#3b82f6;color:var(--blue-t)}
.chip.active{background:rgba(59,130,246,0.15);border-color:#3b82f6;color:var(--blue-t)}
.chip.dc{border-color:#a855f7;color:#a855f7}
.chip.dc.active{background:rgba(168,85,247,0.15);border-color:#a855f7;color:var(--purp-t)}
.cat-sec{margin-bottom:28px}
.cat-hdr{display:flex;align-items:center;gap:10px;margin-bottom:10px;flex-wrap:wrap}
.cat-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.cat-nm{font-family:'Space Grotesk',sans-serif;font-size:18px;letter-spacing:2px}
.cat-xp{font-family:'JetBrains Mono',monospace;font-size:10px;padding:2px 8px;border-radius:99px;border:1px solid}
.quest{background:var(--card);border:1px solid var(--bd);border-radius:7px;padding:11px 13px;display:flex;align-items:flex-start;gap:11px;margin-bottom:4px;transition:border-color 0.15s}
.quest:hover{border-color:var(--bdh)}
.quest.done{opacity:0.45}
.qchk{width:16px;height:16px;border-radius:3px;border:2px solid var(--bd);flex-shrink:0;margin-top:2px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all 0.15s;font-size:10px;font-weight:700;color:white}
.qchk.lock{cursor:default;border-style:dashed}
.qb{flex:1;min-width:0}
.qt{font-size:12px;color:var(--tx);line-height:1.4}
.qt.done{text-decoration:line-through;color:var(--dim)}
.qm{display:flex;align-items:center;gap:6px;margin-top:4px;flex-wrap:wrap}
.qxp{font-family:'JetBrains Mono',monospace;font-size:10px;color:#3b82f6}
.qst{font-size:10px;padding:2px 6px;border-radius:99px;font-family:'JetBrains Mono',monospace;font-weight:600;display:flex;align-items:center;gap:3px}
.qnt{font-size:10px;color:var(--dim);margin-top:3px;font-style:italic}
.qac{display:flex;gap:4px;flex-shrink:0;opacity:0;transition:opacity 0.15s}
.quest:hover .qac{opacity:1}
.bi{width:24px;height:24px;border-radius:5px;border:1px solid var(--bd);background:transparent;cursor:pointer;color:var(--mut);display:flex;align-items:center;justify-content:center;font-size:11px;transition:all 0.15s}
.bi:hover{border-color:#3b82f6;color:var(--blue-t);background:rgba(59,130,246,0.1)}
.bi.del:hover{border-color:#ef4444;color:var(--red-t);background:rgba(239,68,68,0.1)}
.btn-add{width:100%;padding:8px;border-radius:6px;border:1px dashed var(--bd);background:transparent;cursor:pointer;color:var(--dim);font-size:12px;font-family:'DM Sans',sans-serif;transition:all 0.15s;margin-top:3px}
.btn-add:hover{border-color:#3b82f6;color:#3b82f6;background:rgba(59,130,246,0.05)}
.dq{background:var(--card);border:1px solid var(--bd);border-radius:7px;padding:11px 13px;display:flex;align-items:center;gap:11px;margin-bottom:4px;transition:border-color 0.15s}
.dq:hover{border-color:var(--bdh)}
.dq.done{opacity:0.45}
.di{flex:1;min-width:0}
.dt{font-size:12px;color:var(--tx);line-height:1.4}
.dt.done{text-decoration:line-through;color:var(--dim)}
.dm{display:flex;align-items:center;gap:7px;margin-top:4px;flex-wrap:wrap}
.sb{display:flex;align-items:center;gap:3px;font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:600}
.mb{font-family:'JetBrains Mono',monospace;font-size:10px;padding:1px 6px;border-radius:99px;font-weight:700}
.dn{font-size:10px;color:var(--dim);font-style:italic}
.overlay{position:fixed;inset:0;background:rgba(0,0,0,0.75);display:flex;align-items:center;justify-content:center;z-index:100;padding:20px}
.modal{background:var(--modal);border:1px solid var(--bd);border-radius:12px;padding:24px;width:100%;max-width:460px;max-height:90vh;overflow-y:auto}
.mt{font-family:'Space Grotesk',sans-serif;font-size:21px;letter-spacing:2px;margin-bottom:16px}
.fg{margin-bottom:13px}
.fl{font-size:10px;color:var(--mut);letter-spacing:1.5px;font-family:'JetBrains Mono',monospace;display:block;margin-bottom:5px}
.fi,.fsel,.fta{width:100%;background:var(--bg);border:1px solid var(--bd);border-radius:6px;padding:8px 10px;color:var(--tx);font-family:'DM Sans',sans-serif;font-size:13px;outline:none;transition:border-color 0.15s}
.fi:focus,.fsel:focus,.fta:focus{border-color:#3b82f6}
.fsel option{background:var(--modal)}
.fta{resize:vertical;min-height:64px}
.mf{display:flex;gap:8px;justify-content:flex-end;margin-top:20px}
.bp{padding:8px 16px;border-radius:6px;background:#3b82f6;color:white;border:none;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:600;transition:background 0.15s}
.bp:hover{background:#2563eb}
.bp:disabled{opacity:0.4;cursor:not-allowed}
.bp.green{background:#16a34a}.bp.green:hover{background:#15803d}
.bp.amber{background:#d97706}.bp.amber:hover{background:#b45309}
.bs{padding:8px 16px;border-radius:6px;background:transparent;color:var(--mut);border:1px solid var(--bd);cursor:pointer;font-family:'DM Sans',sans-serif;font-size:13px;transition:all 0.15s}
.bs:hover{border-color:#3b82f6;color:var(--blue-t)}
.pr{margin-bottom:20px;padding-bottom:20px;border-bottom:1px solid var(--bd2)}
.pr:last-child{border-bottom:none;margin-bottom:0;padding-bottom:0}
.pt{font-family:'Space Grotesk',sans-serif;font-size:19px;letter-spacing:2px;color:#3b82f6;margin-bottom:6px}
.pd{font-size:13px;color:var(--tx2);line-height:1.7}
.oc{background:var(--card);border:1px solid var(--bd);border-radius:9px;padding:14px 16px;margin-bottom:9px;display:flex;align-items:flex-start;gap:13px}
.oc.done{border-color:rgba(34,197,94,0.45)}
.on{font-family:'Space Grotesk',sans-serif;font-size:28px;color:var(--bd);flex-shrink:0;width:32px;text-align:center}
.oc.done .on{color:#22c55e}
.ot{font-size:14px;font-weight:600;color:var(--tx);margin-bottom:3px}
.od{font-size:12px;color:var(--mut);line-height:1.5}
.op{font-size:10px;padding:2px 8px;border-radius:99px;font-family:'JetBrains Mono',monospace;font-weight:600;margin-left:auto;flex-shrink:0;white-space:nowrap}
.mac-row{display:flex;gap:14px;flex-wrap:wrap;margin-bottom:6px}
.mac{flex:1;min-width:130px}
.mac-l{display:flex;justify-content:space-between;font-size:10px;font-family:'JetBrains Mono',monospace;color:var(--mut);margin-bottom:4px}
.mac-bg{height:6px;background:var(--bd);border-radius:99px;overflow:hidden}
.mac-f{height:100%;border-radius:99px;transition:width 0.4s}
.set-row{display:flex;gap:6px;align-items:center;margin-bottom:4px}
.set-n{font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--dim);width:34px;flex-shrink:0}
.fi.sm{width:64px;padding:5px 7px;font-size:12px;text-align:center}
.tgl{padding:4px 9px;border-radius:5px;border:1px solid var(--bd);background:transparent;font-size:10px;cursor:pointer;color:var(--mut);font-family:'JetBrains Mono',monospace;transition:all 0.12s;user-select:none}
.tgl.on{border-color:#22c55e;color:var(--green-t);background:rgba(34,197,94,0.1)}
.tgl.bad{border-color:#ef4444;color:var(--red-t);background:rgba(239,68,68,0.1)}
.ex-card{background:var(--card);border:1px solid var(--bd);border-radius:9px;padding:13px 15px;margin-bottom:8px}
.ex-hd{display:flex;align-items:baseline;gap:9px;margin-bottom:8px;flex-wrap:wrap}
.ex-nm{font-size:13px;font-weight:600}
.ex-wt{font-family:'JetBrains Mono',monospace;font-size:11px;color:#f59e0b}
.ex-nt{font-size:10px;color:var(--dim);font-style:italic}
.gate{font-size:11px;font-family:'JetBrains Mono',monospace;padding:6px 9px;border-radius:6px;margin-top:6px;line-height:1.5}
.gate.advance{background:rgba(34,197,94,0.1);color:var(--green-t);border:1px solid rgba(34,197,94,0.35)}
.gate.hold{background:rgba(100,116,139,0.1);color:var(--tx2);border:1px solid rgba(100,116,139,0.3)}
.gate.drop_back{background:rgba(239,68,68,0.1);color:var(--red-t);border:1px solid rgba(239,68,68,0.35)}
.coach-card{border:1px solid var(--bd);border-radius:9px;padding:14px 16px;margin-top:12px;background:var(--card)}
.coach-pid{font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:1px;color:#3b82f6;margin-bottom:6px}
.coach-act{font-size:13px;line-height:1.7;color:var(--tx)}
::-webkit-scrollbar{width:4px}
::-webkit-scrollbar-track{background:var(--bg)}
::-webkit-scrollbar-thumb{background:var(--bd);border-radius:99px}
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
          <span className="blk-l" style={{ color: b.type === "wildcard" ? "var(--dim)" : "var(--tx)" }}>{b.label}</span>
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
