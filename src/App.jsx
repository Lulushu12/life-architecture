import { useState, useEffect } from "react";
import {
  DEFAULT_LONG, DEFAULT_DAILY, SCHEDULE as SCHEDULE_SEED,
  IDENTITY_STATEMENT, PILLARS, IDENTITY_SHIFT, HABIT_STACKS, ENVIRONMENT_DESIGN,
  OUTPUTS, REVIEW_CADENCE, PRINCIPLES, WORKOUT_VIDEOS, AI_CONTEXT,
} from "./personalData.js";

const FONT_LINK = document.createElement("link");
FONT_LINK.rel = "stylesheet";
FONT_LINK.href = "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;700&family=JetBrains+Mono:wght@400;600&display=swap";
document.head.appendChild(FONT_LINK);

const LEVELS = [
  { name: "Novice Adventurer",    min: 0 },
  { name: "Apprentice",           min: 1000 },
  { name: "Journeyman",           min: 3000 },
  { name: "Skilled Practitioner", min: 6000 },
  { name: "Expert",               min: 10000 },
  { name: "Master",               min: 15000 },
  { name: "Legendary Figure",     min: 22000 },
];
const CATEGORIES = ["Health & Fitness", "Medicine & Surgery", "Trading", "Hobbies & Creativity"];
const CAT_COLORS = {
  "Health & Fitness":     { accent: "#22c55e", light: "#86efac" },
  "Medicine & Surgery":   { accent: "#ef4444", light: "#fca5a5" },
  "Trading":              { accent: "#06b6d4", light: "#67e8f9" },
  "Hobbies & Creativity": { accent: "#f59e0b", light: "#fcd34d" },
};
const STREAK_MULT  = (s) => s >= 30 ? 3 : s >= 14 ? 2 : s >= 7 ? 1.5 : 1;
const STREAK_LABEL = (s) => s >= 30 ? "3x" : s >= 14 ? "2x" : s >= 7 ? "1.5x" : "1x";
const STREAK_COLOR = (s) => s >= 30 ? "#a855f7" : s >= 14 ? "#ef4444" : s >= 7 ? "#f59e0b" : "#64748b";
const todayKey = () => new Date().toISOString().slice(0, 10);

// The published build ships the neutral schedule from personalData.js. Personal
// schedules are kept out of this repo because it is public — set "la_schedule_v8"
// in localStorage to override it on a given device.
const SCHEDULE = (() => {
  try {
    const raw = localStorage.getItem("la_schedule_v8");
    if (raw) return JSON.parse(raw);
  } catch (_) { /* fall through to the seed */ }
  return SCHEDULE_SEED;
})();


const BLOCK_META = {
  swim:      { color:"#06b6d4", bg:"rgba(6,182,212,0.10)",   label:"SWIM" },
  vmo:       { color:"#a855f7", bg:"rgba(168,85,247,0.10)",  label:"VMO" },
  fullbody:  { color:"#22c55e", bg:"rgba(34,197,94,0.10)",   label:"FULL BODY" },
  trading:   { color:"#3b82f6", bg:"rgba(59,130,246,0.12)",  label:"TRADING" },
  gym_push:  { color:"#f59e0b", bg:"rgba(245,158,11,0.10)",  label:"GYM PUSH" },
  gym_pull:  { color:"#f59e0b", bg:"rgba(245,158,11,0.10)",  label:"GYM PULL" },
  gym_legs:  { color:"#f59e0b", bg:"rgba(245,158,11,0.10)",  label:"GYM LEGS" },
  gym_light: { color:"#f59e0b", bg:"rgba(245,158,11,0.08)",  label:"GYM LIGHT" },
  walk:      { color:"#86efac", bg:"rgba(134,239,172,0.08)", label:"WALK" },
  review:    { color:"#3b82f6", bg:"rgba(59,130,246,0.10)",  label:"REVIEW" },
  learning:  { color:"#94a3b8", bg:"rgba(148,163,184,0.08)", label:"LEARNING" },
  sacred:    { color:"#fbbf24", bg:"rgba(251,191,36,0.10)",  label:"PROTECTED" },
  decompress:{ color:"#475569", bg:"rgba(71,85,105,0.08)",   label:"DECOMPRESS" },
  wildcard:  { color:"#334155", bg:"rgba(51,65,85,0.06)",    label:"FREE" },
  mobility:  { color:"#a855f7", bg:"rgba(168,85,247,0.08)",  label:"MOBILITY" },
  sleep:     { color:"#1d4ed8", bg:"rgba(29,78,216,0.10)",   label:"SLEEP" },
};


const STATUS_STYLE = {
  Active:    { bg:"rgba(34,197,94,0.15)",   color:"#22c55e", dot:"#22c55e" },
  Pending:   { bg:"rgba(100,116,139,0.15)", color:"#94a3b8", dot:"#64748b" },
  Completed: { bg:"rgba(59,130,246,0.15)",  color:"#3b82f6", dot:"#3b82f6" },
};
const DIFF_STYLE = {
  "Trivial":   { color:"#64748b", bg:"rgba(100,116,139,0.15)" },
  "Easy":      { color:"#22c55e", bg:"rgba(34,197,94,0.12)" },
  "Medium":    { color:"#3b82f6", bg:"rgba(59,130,246,0.12)" },
  "Hard":      { color:"#f59e0b", bg:"rgba(245,158,11,0.12)" },
  "Very Hard": { color:"#ef4444", bg:"rgba(239,68,68,0.12)" },
  "Legendary": { color:"#a855f7", bg:"rgba(168,85,247,0.12)" },
};
const NAV = [
  { id:"identity",   icon:"◈", label:"Identity" },
  { id:"habits",     icon:"⊕", label:"Atomic Habits" },
  { id:"outputs",    icon:"◎", label:"6-Month Outputs" },
  { id:"schedule",   icon:"▦", label:"Schedule" },
  { id:"quests",     icon:"⬡", label:"Quest Board" },
  { id:"review",     icon:"↻", label:"Review Cadence" },
  { id:"principles", icon:"≡", label:"Principles" },
  { id:"workouts",   icon:"▶", label:"Workouts" },
];

function getLevel(xp) {
  for (let i=LEVELS.length-1;i>=0;i--) if (xp>=LEVELS[i].min) return {...LEVELS[i],index:i};
  return {...LEVELS[0],index:0};
}
function getLevelProgress(xp) {
  const l=getLevel(xp),n=LEVELS[l.index+1];
  if (!n) return 100;
  return Math.round(((xp-l.min)/(n.min-l.min))*100);
}
function uid() { return "q"+Date.now()+Math.random().toString(36).slice(2,7); }

const css = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{background:#060c18;color:#e2e8f0;font-family:'DM Sans',sans-serif}
.shell{display:flex;min-height:100vh}
.sidebar{width:210px;background:#0a1120;border-right:1px solid #1e2d40;padding:26px 0;position:sticky;top:0;height:100vh;overflow-y:auto;flex-shrink:0}
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
.sub{background:rgba(245,158,11,0.06);border:1px solid rgba(245,158,11,0.2);border-radius:5px;padding:7px 10px;display:flex;gap:8px;align-items:flex-start;margin-top:6px}
.sub-l{font-family:'JetBrains Mono',monospace;font-size:9px;color:#f59e0b;letter-spacing:1px;flex-shrink:0;margin-top:2px}
.sub-t{font-size:12px;color:#fcd34d;line-height:1.5}
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
.bs{padding:8px 16px;border-radius:6px;background:transparent;color:#64748b;border:1px solid #1e2d40;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:13px;transition:all 0.15s}
.bs:hover{border-color:#3b82f6;color:#93c5fd}
.ass{background:rgba(59,130,246,0.06);border:1px solid #1e2d40;border-radius:6px;padding:12px 13px;margin-bottom:13px}
.ash{display:flex;align-items:center;margin-bottom:8px}
.asl{font-size:10px;color:#475569;font-family:'JetBrains Mono',monospace;letter-spacing:1px}
.bc{font-size:10px;color:#3b82f6;background:rgba(59,130,246,0.1);border:1px solid #3b82f6;border-radius:3px;padding:2px 8px;cursor:pointer;font-family:'JetBrains Mono',monospace;transition:all 0.15s;margin-left:auto}
.bc:hover{background:rgba(59,130,246,0.2)}
.bc.cp{color:#22c55e;border-color:#22c55e;background:rgba(34,197,94,0.1)}
.pp{background:#060c18;border:1px solid #1e2d40;border-radius:5px;padding:8px 10px;font-size:10px;color:#475569;font-family:'JetBrains Mono',monospace;line-height:1.5;margin-bottom:7px;white-space:pre-wrap;word-break:break-word}
.oc{background:#0a1120;border:1px solid #1e2d40;border-radius:9px;padding:14px 16px;margin-bottom:9px;display:flex;align-items:flex-start;gap:13px}
.on{font-family:'Bebas Neue',sans-serif;font-size:28px;color:#1e2d40;flex-shrink:0;width:32px;text-align:center}
.ot{font-size:14px;font-weight:600;color:#e2e8f0;margin-bottom:3px}
.od{font-size:12px;color:#64748b;line-height:1.5}
.op{font-size:10px;padding:2px 8px;border-radius:99px;font-family:'JetBrains Mono',monospace;font-weight:600;margin-left:auto;flex-shrink:0;white-space:nowrap}
.pr{margin-bottom:20px;padding-bottom:20px;border-bottom:1px solid #111827}
.pr:last-child{border-bottom:none;margin-bottom:0;padding-bottom:0}
.pt{font-family:'Bebas Neue',sans-serif;font-size:19px;letter-spacing:2px;color:#3b82f6;margin-bottom:6px}
.pd{font-size:13px;color:#94a3b8;line-height:1.7}
::-webkit-scrollbar{width:4px}
::-webkit-scrollbar-track{background:#060c18}
::-webkit-scrollbar-thumb{background:#1e2d40;border-radius:99px}
@keyframes fs{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
.fi-anim{animation:fs 0.2s ease forwards}
`;

export default function App() {
  const [page,setPage]=useState("identity");
  const [longQ,setLongQ]=useState(DEFAULT_LONG);
  const [dailyQ,setDailyQ]=useState(DEFAULT_DAILY);
  const [modal,setModal]=useState(null);
  const [schedDay,setSchedDay]=useState("Monday");
  const [filter,setFilter]=useState("All");

  useEffect(()=>{
    try{const lr=localStorage.getItem("la_long_v8");if(lr)setLongQ(JSON.parse(lr));
      const dr=localStorage.getItem("la_daily_v8");if(dr)setDailyQ(JSON.parse(dr));}catch(_){}
  },[]);

  const saveLong=(q)=>{setLongQ(q);try{localStorage.setItem("la_long_v8",JSON.stringify(q));}catch(_){}};
  const saveDaily=(q)=>{setDailyQ(q);try{localStorage.setItem("la_daily_v8",JSON.stringify(q));}catch(_){}};

  const today=todayKey();
  const longXP=longQ.filter(q=>q.status==="Completed").reduce((s,q)=>s+q.xp,0);
  const dailyXP=dailyQ.reduce((s,q)=>{if(q.lastDone!==today)return s;return s+Math.round(q.baseXp*STREAK_MULT(q.streak));},0);
  const totalXP=longXP+dailyXP;
  const level=getLevel(totalXP);
  const progress=getLevelProgress(totalXP);

  const onLongSave=(data)=>{
    if(modal.mode==="add")saveLong([...longQ,{id:uid(),status:"Active",...data}]);
    else saveLong(longQ.map(q=>q.id===modal.quest.id?{...q,...data}:q));
    setModal(null);
  };
  const delLong=(id)=>saveLong(longQ.filter(q=>q.id!==id));
  const toggleLong=(id)=>saveLong(longQ.map(q=>q.id===id?{...q,status:q.status==="Completed"?"Active":"Completed"}:q));
  const toggleDaily=(id)=>{
    const t=todayKey();
    saveDaily(dailyQ.map(q=>{
      if(q.id!==id)return q;
      if(q.lastDone===t)return{...q,lastDone:"",streak:Math.max(0,q.streak-1)};
      const yest=new Date();yest.setDate(yest.getDate()-1);
      const yk=yest.toISOString().slice(0,10);
      return{...q,lastDone:t,streak:q.lastDone===yk?q.streak+1:1};
    }));
  };
  const fq=(cat)=>longQ.filter(q=>q.category===cat).filter(q=>filter==="All"||q.status===filter);

  return(
    <>
      <style>{css}</style>
      <div className="shell">
        <aside className="sidebar">
          <div className="logo">
            <div className="logo-t">LIFE<br/>ARCHITECTURE</div>
            <div className="logo-s">v8 · 2026</div>
          </div>
          <div className="nav-s">SECTIONS</div>
          {NAV.map(n=>(
            <div key={n.id} className={"nav-i"+(page===n.id?" active":"")} onClick={()=>setPage(n.id)}>
              <span style={{fontSize:13}}>{n.icon}</span>{n.label}
            </div>
          ))}
        </aside>
        <main className="main">
          <div className="xp-card">
            <div>
              <div className="xp-lv">{level.name}</div>
              <div className="xp-n">{totalXP.toLocaleString()} XP total</div>
            </div>
            <div className="xp-w">
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontSize:10,color:"#475569"}}>Level {level.index+1}</span>
                <span style={{fontSize:10,color:"#3b82f6",fontFamily:"JetBrains Mono"}}>{progress}%</span>
              </div>
              <div className="xp-bg"><div className="xp-f" style={{width:progress+"%"}}/></div>
              {level.index<LEVELS.length-1&&(
                <div style={{fontSize:10,color:"#334155",marginTop:3,fontFamily:"JetBrains Mono"}}>
                  Next: {LEVELS[level.index+1].name} @ {LEVELS[level.index+1].min.toLocaleString()} XP
                </div>
              )}
            </div>
          </div>
          <div className="fi-anim" key={page}>
            {page==="identity"&&<PIdentity/>}
            {page==="habits"&&<PHabits/>}
            {page==="outputs"&&<POutputs/>}
            {page==="schedule"&&<PSchedule schedDay={schedDay} setSchedDay={setSchedDay}/>}
            {page==="quests"&&<PQuests longQ={longQ} dailyQ={dailyQ} filter={filter} setFilter={setFilter} fq={fq} openAdd={cat=>setModal({mode:"add",category:cat})} openEdit={q=>setModal({mode:"edit",quest:q})} delLong={delLong} toggleLong={toggleLong} toggleDaily={toggleDaily}/>}
            {page==="review"&&<PReview/>}
            {page==="principles"&&<PPrinciples/>}
            {page==="workouts"&&<PWorkouts/>}
          </div>
        </main>
      </div>
      {modal&&<QModal modal={modal} onSave={onLongSave} onClose={()=>setModal(null)}/>}
    </>
  );
}

function Blk({b}){
  const[open,setOpen]=useState(false);
  const m=BLOCK_META[b.type]||BLOCK_META.wildcard;
  const inter=!!(b.detail||b.twoMin);
  return(
    <div className={"blk"+(inter?" ck":"")} style={{borderColor:m.color+"55",background:m.bg,opacity:b.type==="wildcard"?0.5:1}} onClick={()=>inter&&setOpen(o=>!o)}>
      <div className="blk-m">
        <div className="blk-t" style={{color:m.color}}>{b.time}</div>
        <div className="blk-c">
          <span className="blk-l" style={{color:b.type==="wildcard"?"#475569":"#e2e8f0"}}>{b.label}</span>
          <span className="blk-b" style={{color:m.color}}>{m.label}</span>
        </div>
        {inter&&<div className={"blk-a"+(open?" open":"")}>▾</div>}
      </div>
      {open&&(
        <div className="blk-d">
          {b.detail&&<div className="det" dangerouslySetInnerHTML={{__html:b.detail}}/>}
          {b.twoMin&&<div className="tm"><span className="tm-l">2 MIN</span><span className="tm-t">{b.twoMin}</span></div>}
          {b.isGymSubstitute&&b.substituteLabel&&<div className="sub"><span className="sub-l">SUB</span><span className="sub-t">{b.substituteLabel}</span></div>}
        </div>
      )}
    </div>
  );
}

function PIdentity(){
  return(
    <>
      <div className="pg-title">IDENTITY</div>
      <div className="pg-sub">Who you are becoming, not what you want to achieve</div>
      <div className="callout cg"><div className="ct"><strong>Core Belief: </strong>"You do not rise to the level of your goals. You fall to the level of your systems." — James Clear</div></div>
      <div className="card">
        <div className="card-t">Identity Statement</div>
        <p style={{fontSize:14,fontWeight:600,color:"#e2e8f0",lineHeight:1.7}}>{IDENTITY_STATEMENT}</p>
      </div>
      <div className="card">
        <div className="card-t">Four Pillars</div>
        {PILLARS.map(([t,d])=>(
          <div key={t} style={{display:"flex",gap:12,marginBottom:12,alignItems:"flex-start"}}>
            <span style={{fontFamily:"Bebas Neue",fontSize:12,letterSpacing:2,color:"#3b82f6",width:64,flexShrink:0,paddingTop:2}}>{t}</span>
            <span style={{fontSize:12,color:"#94a3b8",lineHeight:1.6}}>{d}</span>
          </div>
        ))}
      </div>
      <div className="card">
        <div className="card-t">Identity Shift</div>
        <table className="tbl">
          <thead><tr><th>OLD (Reactive)</th><th>NEW (Intentional)</th></tr></thead>
          <tbody>
            {IDENTITY_SHIFT.map(([o,n],i)=><tr key={i}><td className="old">{o}</td><td className="nw">{n}</td></tr>)}
          </tbody>
        </table>
      </div>
    </>
  );
}

function PHabits(){
  return(
    <>
      <div className="pg-title">ATOMIC HABITS</div>
      <div className="pg-sub">The framework powering the entire system</div>
      <div className="card">
        <div className="card-t">The Four Laws</div>
        <table className="tbl">
          <thead><tr><th>LAW</th><th>CUE</th><th>BUILD</th><th>BREAK</th></tr></thead>
          <tbody>
            {[["1st","Cue","Obvious","Invisible"],["2nd","Craving","Attractive","Unattractive"],["3rd","Response","Easy","Difficult"],["4th","Reward","Satisfying","Unsatisfying"]].map(([l,c,b,r])=>(
              <tr key={l}><td><span className="law-n">{l} Law</span></td><td style={{color:"#94a3b8"}}>{c}</td><td><span className="bld">{b}</span></td><td><span className="brk">{r}</span></td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="card">
        <div className="card-t">Habit Stacking</div>
        <div className="callout cg" style={{marginBottom:12}}><div className="ct"><em>"After I [CURRENT HABIT], I will [NEW HABIT]."</em></div></div>
        {HABIT_STACKS.map((s,i)=>(
          <div key={i} style={{display:"flex",gap:8,marginBottom:8,alignItems:"flex-start"}}>
            <span style={{color:"#3b82f6",fontFamily:"JetBrains Mono",fontSize:11,marginTop:2,flexShrink:0}}>→</span>
            <span style={{fontSize:12,color:"#94a3b8",lineHeight:1.6}}>{s}</span>
          </div>
        ))}
      </div>
      <div className="card">
        <div className="card-t">The 2-Minute Rule</div>
        <p style={{fontSize:12,color:"#94a3b8",lineHeight:1.7,marginBottom:12}}>Every block in the schedule has a 2-minute version. Tap any block to see it. The goal is never to skip — it is to downgrade.</p>
        <div className="tm"><span className="tm-l">RULE</span><span className="tm-t">"Never miss twice. If you cannot do the full thing, do the 2-minute version. Showing up in reduced form is infinitely better than not showing up at all."</span></div>
      </div>
      <div className="card">
        <div className="card-t">Streak Multipliers</div>
        <p style={{fontSize:12,color:"#94a3b8",lineHeight:1.6,marginBottom:12}}>Daily quests compound over time. Consecutive days multiply your XP reward.</p>
        {[[0,"6 days","1x","#64748b","Base XP"],[7,"13 days","1.5x","#f59e0b","Good momentum"],[14,"29 days","2x","#ef4444","Strong habit"],[30,"+ days","3x","#a855f7","Identity locked"]].map(([a,b,mult,col,desc])=>(
          <div key={mult} style={{display:"flex",gap:10,alignItems:"center",marginBottom:7}}>
            <span style={{fontFamily:"JetBrains Mono",fontSize:10,color:"#475569",width:55,flexShrink:0}}>{a}-{b}</span>
            <span style={{fontFamily:"JetBrains Mono",fontSize:13,fontWeight:700,color:col,width:34}}>{mult}</span>
            <span style={{fontSize:12,color:"#64748b"}}>{desc}</span>
          </div>
        ))}
      </div>
      <div className="card">
        <div className="card-t">Environment Design</div>
        {ENVIRONMENT_DESIGN.map((s,i)=>(
          <div key={i} style={{display:"flex",gap:8,marginBottom:8,alignItems:"flex-start"}}>
            <span style={{color:"#f59e0b",fontSize:11,marginTop:2,flexShrink:0}}>◆</span>
            <span style={{fontSize:12,color:"#94a3b8",lineHeight:1.6}}>{s}</span>
          </div>
        ))}
      </div>
    </>
  );
}

function POutputs(){
  return(
    <>
      <div className="pg-title">6-MONTH OUTPUTS</div>
      <div className="pg-sub">Concrete evidence the system is working</div>
      {OUTPUTS.map(o=>(
        <div className="oc" key={o.num}>
          <div className="on">{o.num}</div>
          <div style={{flex:1}}><div className="ot">{o.title}</div><div className="od">{o.done}</div></div>
          <div className="op" style={{color:o.pc,background:o.pb,border:"1px solid "+o.pc}}>{o.pri}</div>
        </div>
      ))}
    </>
  );
}

function PSchedule({schedDay,setSchedDay}){
  const day=SCHEDULE[schedDay];
  const used=[...new Set(day.blocks.map(b=>b.type))].filter(t=>t!=="wildcard");
  return(
    <>
      <div className="pg-title">SCHEDULE</div>
      <div className="pg-sub">Tap any block to expand details and 2-minute version</div>
      <div className="day-tabs">{Object.keys(SCHEDULE).map(d=><div key={d} className={"day-tab"+(schedDay===d?" active":"")} onClick={()=>setSchedDay(d)}>{d}</div>)}</div>
      <div className="day-type">{day.type}</div>
      <div className="day-sub">{day.subtitle}</div>
      {day.blocks.map((b,i)=><Blk key={i} b={b}/>)}
      <div className="leg">{used.map(t=>{const m=BLOCK_META[t];if(!m)return null;return <div key={t} className="leg-i"><div className="leg-d" style={{background:m.color}}/>{m.label}</div>;})}</div>
    </>
  );
}

function PQuests({longQ,dailyQ,filter,setFilter,fq,openAdd,openEdit,delLong,toggleLong,toggleDaily}){
  const showDaily=filter==="Daily";
  const today=todayKey();
  const doneToday=dailyQ.filter(q=>q.lastDone===today).length;
  const longXP=longQ.filter(q=>q.status==="Completed").reduce((s,q)=>s+q.xp,0);
  return(
    <>
      <div className="pg-title">QUEST BOARD</div>
      <div className="pg-sub">Long-term milestones and daily habits — all tracked</div>
      <div className="frow">
        {["All","Active","Pending","Completed"].map(f=><div key={f} className={"chip"+(filter===f?" active":"")} onClick={()=>setFilter(f)}>{f}</div>)}
        <div className={"chip dc"+(filter==="Daily"?" active":"")} onClick={()=>setFilter("Daily")}>🔥 Daily</div>
        <div style={{marginLeft:"auto",fontFamily:"JetBrains Mono",fontSize:10,color:"#475569"}}>
          {showDaily?`${doneToday}/${dailyQ.length} today`:`${longQ.filter(q=>q.status==="Completed").length}/${longQ.length} · ${longXP.toLocaleString()} XP`}
        </div>
      </div>
      {showDaily?(
        CATEGORIES.map(cat=>{
          const items=dailyQ.filter(q=>q.category===cat);
          if(!items.length)return null;
          const{accent,light}=CAT_COLORS[cat];
          return(
            <div className="cat-sec" key={cat}>
              <div className="cat-hdr">
                <div className="cat-dot" style={{background:accent}}/>
                <div className="cat-nm" style={{color:light}}>{cat}</div>
                <div className="cat-xp" style={{color:accent,borderColor:accent,background:accent+"18"}}>{items.filter(q=>q.lastDone===today).length}/{items.length} today</div>
              </div>
              {items.map(q=><DQ key={q.id} q={q} onToggle={toggleDaily} ac={accent}/>)}
            </div>
          );
        })
      ):(
        CATEGORIES.map(cat=>{
          const items=fq(cat);
          const all=longQ.filter(q=>q.category===cat);
          const earned=all.filter(q=>q.status==="Completed").reduce((s,q)=>s+q.xp,0);
          const total=all.reduce((s,q)=>s+q.xp,0);
          const{accent,light}=CAT_COLORS[cat];
          return(
            <div className="cat-sec" key={cat}>
              <div className="cat-hdr">
                <div className="cat-dot" style={{background:accent}}/>
                <div className="cat-nm" style={{color:light}}>{cat}</div>
                <div className="cat-xp" style={{color:accent,borderColor:accent,background:accent+"18"}}>{earned.toLocaleString()} / {total.toLocaleString()} XP</div>
              </div>
              {items.length===0?<div style={{fontSize:12,color:"#334155",padding:"8px 0",fontStyle:"italic"}}>No quests matching filter.</div>:items.map(q=><LQ key={q.id} q={q} onEdit={openEdit} onDel={delLong} onToggle={toggleLong} ac={accent}/>)}
              <button className="btn-add" onClick={()=>openAdd(cat)}>+ Add Quest</button>
            </div>
          );
        })
      )}
    </>
  );
}

function LQ({q,onEdit,onDel,onToggle,ac}){
  const ss=STATUS_STYLE[q.status]||STATUS_STYLE.Pending;
  const ds=q.difficulty?(DIFF_STYLE[q.difficulty]||DIFF_STYLE["Medium"]):null;
  return(
    <div className={"quest"+(q.status==="Completed"?" done":"")}>
      <div className="qchk" onClick={()=>onToggle(q.id)} style={q.status==="Completed"?{borderColor:ac,background:ac}:{}}>{q.status==="Completed"?"✓":""}</div>
      <div className="qb">
        <div className={"qt"+(q.status==="Completed"?" done":"")}>{q.title}</div>
        <div className="qm">
          <span className="qxp">+{q.xp.toLocaleString()} XP</span>
          <span className="qst" style={{background:ss.bg,color:ss.color}}><span style={{width:5,height:5,borderRadius:"50%",background:ss.dot,display:"inline-block"}}/>{q.status}</span>
          {ds&&<span className="qst" style={{background:ds.bg,color:ds.color}}>{q.difficulty}</span>}
        </div>
        {q.notes&&<div className="qnt">{q.notes}</div>}
      </div>
      <div className="qac">
        <button className="bi" onClick={()=>onEdit(q)}>✎</button>
        <button className="bi del" onClick={()=>onDel(q.id)}>✕</button>
      </div>
    </div>
  );
}

function DQ({q,onToggle,ac}){
  const today=todayKey();
  const done=q.lastDone===today;
  const mult=STREAK_MULT(q.streak);
  const earnedXp=Math.round(q.baseXp*mult);
  const sc=STREAK_COLOR(q.streak);
  return(
    <div className={"dq"+(done?" done":"")}>
      <div className="qchk" onClick={()=>onToggle(q.id)} style={done?{borderColor:ac,background:ac}:{}}>{done?"✓":""}</div>
      <div className="di">
        <div className={"dt"+(done?" done":"")}>{q.title}</div>
        <div className="dm">
          <span className="qxp">+{earnedXp} XP</span>
          {q.streak>0&&<span className="sb" style={{color:sc}}>🔥 {q.streak}</span>}
          {mult>1&&<span className="mb" style={{color:sc,background:sc+"22",border:"1px solid "+sc}}>{STREAK_LABEL(q.streak)}</span>}
          {q.note&&<span className="dn">{q.note}</span>}
        </div>
      </div>
    </div>
  );
}

function PReview(){
  return(
    <>
      <div className="pg-title">REVIEW CADENCE</div>
      <div className="pg-sub">The feedback loop that keeps the system calibrated</div>
      {REVIEW_CADENCE.map(s=>(
        <div className="card" key={s.title}>
          <div className="card-t">{s.title}</div>
          {s.items.map((item,i)=>(
            <div key={i} style={{display:"flex",gap:8,marginBottom:8,alignItems:"flex-start"}}>
              <span style={{color:"#3b82f6",fontFamily:"JetBrains Mono",fontSize:11,marginTop:2,flexShrink:0}}>□</span>
              <span style={{fontSize:12,color:"#94a3b8",lineHeight:1.6}}>{item}</span>
            </div>
          ))}
        </div>
      ))}
      <div className="callout cn"><div className="ct"><strong>The Plateau of Latent Potential — </strong>Results lag behind habits. You may feel like nothing is changing — then cross a threshold and see rapid progress. The system is working even when it does not feel like it.</div></div>
    </>
  );
}

function PPrinciples(){
  return(
    <>
      <div className="pg-title">PRINCIPLES</div>
      <div className="pg-sub">The operating rules of the system</div>
      <div className="card">
        {PRINCIPLES.map(([t,d])=>(
          <div className="pr" key={t}>
            <div className="pt">{t}</div>
            <div className="pd">{d}</div>
          </div>
        ))}
      </div>
    </>
  );
}

function PWorkouts(){
  const vids=WORKOUT_VIDEOS;
  return(
    <>
      <div className="pg-title">WORKOUTS</div>
      <div className="pg-sub">Reference videos for all home training blocks</div>
      {vids.map(v=>(
        <div key={v.title} className="card" style={{display:"flex",alignItems:"flex-start",gap:16}}>
          <div style={{width:36,height:36,borderRadius:8,background:v.color+"22",border:"1px solid "+v.color+"55",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:16}}>▶</div>
          <div style={{flex:1}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:5}}>
              <a href={v.url} target="_blank" rel="noreferrer" style={{fontSize:14,fontWeight:600,color:v.color,textDecoration:"none"}}>{v.title}</a>
              <span style={{fontSize:10,color:"#475569",fontFamily:"JetBrains Mono",padding:"2px 7px",borderRadius:99,border:"1px solid #1e2d40"}}>{v.cat}</span>
            </div>
            <div style={{fontSize:12,color:"#64748b",lineHeight:1.6}}>{v.desc}</div>
            <a href={v.url} target="_blank" rel="noreferrer" style={{fontSize:10,color:"#475569",fontFamily:"JetBrains Mono",marginTop:5,display:"inline-block",textDecoration:"none"}}>{v.url}</a>
          </div>
        </div>
      ))}
    </>
  );
}

function QModal({modal,onSave,onClose}){
  const isEdit=modal.mode==="edit";
  const[title,setTitle]=useState(isEdit?modal.quest.title:"");
  const[category,setCategory]=useState(isEdit?modal.quest.category:(modal.category||CATEGORIES[0]));
  const[xp,setXp]=useState(isEdit?String(modal.quest.xp):"");
  const[status,setStatus]=useState(isEdit?modal.quest.status:"Active");
  const[notes,setNotes]=useState(isEdit?modal.quest.notes:"");
  const[difficulty,setDifficulty]=useState(isEdit?(modal.quest.difficulty||""):"");
  const[copied,setCopied]=useState(false);

  const prompt=title.trim()?`Assess this quest for XP in my Atomic Habits life system.

Quest: "${title.trim()}"
Category: ${category}
Notes: ${notes.trim()||"none"}

${AI_CONTEXT}

Score on four axes (1-5): duration, effort, obstacles, frequency.
XP range: 200-2000 in multiples of 50.

Return this JSON only - no markdown:
{"xp": 750, "difficulty": "Medium", "reasoning": "one sentence", "axes": {"duration": 3, "effort": 3, "obstacles": 2, "frequency": 3}}`:"";

  const copy=async()=>{
    if(!prompt)return;
    try{await navigator.clipboard.writeText(prompt);setCopied(true);setTimeout(()=>setCopied(false),2500);}catch(_){}
  };

  return(
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="mt">{isEdit?"EDIT QUEST":"NEW QUEST"}</div>
        <div className="fg"><label className="fl">QUEST TITLE</label><input className="fi" value={title} onChange={e=>setTitle(e.target.value)} placeholder="What needs to be done?" autoFocus/></div>
        <div className="fg"><label className="fl">CATEGORY</label><select className="fsel" value={category} onChange={e=>setCategory(e.target.value)}>{CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
        <div className="fg"><label className="fl">NOTES — more detail = better assessment</label><textarea className="fta" value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Context, sub-tasks, timeline..."/></div>
        <div className="ass">
          <div className="ash">
            <span className="asl">CLAUDE ASSESSMENT</span>
            <button className={"bc"+(copied?" cp":"")} onClick={copy} disabled={!title.trim()}>{copied?"Copied!":"Copy prompt"}</button>
          </div>
          {title.trim()?<><div className="pp">{prompt.slice(0,200)}...</div><div style={{fontSize:10,color:"#475569",lineHeight:1.5}}>Paste into Claude, enter returned XP and difficulty below.</div></>:<div style={{fontSize:10,color:"#334155",fontStyle:"italic"}}>Enter a title to generate the prompt.</div>}
        </div>
        <div style={{display:"flex",gap:11}}>
          <div className="fg" style={{flex:1}}><label className="fl">XP REWARD</label><input className="fi" type="number" value={xp} onChange={e=>setXp(e.target.value)} min={0} step={50} placeholder="From assessment or manual"/></div>
          <div className="fg" style={{flex:1}}><label className="fl">DIFFICULTY</label>
            <select className="fsel" value={difficulty} onChange={e=>setDifficulty(e.target.value)}>
              <option value="">- unset -</option>
              {Object.keys(DIFF_STYLE).map(d=><option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>
        <div className="fg"><label className="fl">STATUS</label><select className="fsel" value={status} onChange={e=>setStatus(e.target.value)}><option>Active</option><option>Pending</option><option>Completed</option></select></div>
        <div className="mf">
          <button className="bs" onClick={onClose}>Cancel</button>
          <button className="bp" onClick={()=>{if(!title.trim()||!xp)return;onSave({title:title.trim(),category,xp:parseInt(xp)||0,status,notes:notes.trim(),difficulty});}} disabled={!title.trim()||!xp}>{isEdit?"Save Changes":"Add Quest"}</button>
        </div>
      </div>
    </div>
  );
}
