/** Shared chrome: stylesheet, progress rings, schedule block, quest rows, small widgets. */
import { useState } from "react";
import { BLOCK_META_V2 } from "../system/schedule.js";
import { STREAK_MULT, STREAK_LABEL, STREAK_COLOR, todayKey } from "../system/constants.js";

export const css = `
:root{
  --bg:#12151a;--card:#1b2026;--modal:#20262e;--th:#232a32;
  --bd:#293039;--bd2:#232932;--bdh:#3a444f;
  --tx:#f2f5f9;--tx1:#d7dde5;--tx2:#9fabb8;--mut:#8290a0;--dim:#5d6b7a;--fnt:#46525f;
  --acc:#4f8ef7;--acc-h:#3b76e0;--acc-soft:rgba(79,142,247,0.14);
  --blue-t:#8ab6ff;--green-t:#4ade80;--red-t:#f87171;--purp-t:#d8b4fe;
  --hover:rgba(255,255,255,0.04);--line:rgba(255,255,255,0.07);--ring:#2a323c;
  --sh:0 1px 2px rgba(0,0,0,0.25);
  --co-n:rgba(79,142,247,0.10);--co-g:rgba(245,158,11,0.10);--co-r:rgba(239,68,68,0.10);--co-gr:rgba(34,197,94,0.10);
}
[data-theme="light"]{
  --bg:#f2f4f8;--card:#ffffff;--modal:#ffffff;--th:#f4f6fa;
  --bd:#e8ecf2;--bd2:#eef1f6;--bdh:#c6d0dc;
  --tx:#212b36;--tx1:#3c4a59;--tx2:#5d6d7e;--mut:#7b8b9b;--dim:#9aa8b6;--fnt:#b8c2cd;
  --acc:#0066ee;--acc-h:#0052c2;--acc-soft:rgba(0,102,238,0.10);
  --blue-t:#0a58d0;--green-t:#178a4c;--red-t:#c92a2a;--purp-t:#6d28d9;
  --hover:rgba(23,32,44,0.05);--line:rgba(23,32,44,0.08);--ring:#e9edf3;
  --sh:0 1px 3px rgba(23,32,44,0.08),0 1px 2px rgba(23,32,44,0.05);
  --co-n:rgba(0,102,238,0.07);--co-g:rgba(217,119,6,0.09);--co-r:rgba(220,38,38,0.07);--co-gr:rgba(22,163,74,0.08);
}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{background:var(--bg);color:var(--tx);font-family:'DM Sans',sans-serif;-webkit-font-smoothing:antialiased}
.shell{display:flex;min-height:100vh}

/* ── Sidebar (desktop) ─────────────────────────────────────────────── */
.sidebar{width:232px;background:var(--card);border-right:1px solid var(--bd);padding:24px 12px 16px;position:sticky;top:0;height:100vh;overflow-y:auto;flex-shrink:0;display:flex;flex-direction:column}
.logo{padding:0 10px 18px;margin-bottom:10px;border-bottom:1px solid var(--bd)}
.logo-t{font-family:'Space Grotesk',sans-serif;font-size:17px;font-weight:700;line-height:1.25}
.logo-s{font-size:11px;color:var(--mut);margin-top:3px;font-weight:500}
.nav-s{padding:14px 10px 6px;font-size:11px;font-weight:700;color:var(--dim);letter-spacing:0.8px;text-transform:uppercase}
.nav-i{display:flex;align-items:center;gap:11px;padding:9px 12px;margin:1px 0;border-radius:10px;cursor:pointer;font-size:14px;font-weight:500;color:var(--tx2);transition:all 0.15s;user-select:none}
.nav-i:hover{color:var(--tx);background:var(--hover)}
.nav-i.active{color:var(--acc);background:var(--acc-soft);font-weight:600}
.nav-ic{width:22px;height:22px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.side-foot{margin-top:auto;padding:14px 10px 0;border-top:1px solid var(--bd)}
.side-mail{font-size:11px;color:var(--dim);margin-bottom:10px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.side-btn{width:100%;background:transparent;border:1px solid var(--bd);border-radius:99px;color:var(--tx2);font-size:12px;font-weight:600;font-family:'DM Sans',sans-serif;padding:8px 0;cursor:pointer;margin-bottom:6px;transition:all 0.15s}
.side-btn:hover{border-color:var(--bdh);color:var(--tx)}

/* ── Mobile chrome ─────────────────────────────────────────────────── */
.topbar{display:none;position:sticky;top:0;z-index:40;background:var(--card);border-bottom:1px solid var(--bd);padding:12px 16px;align-items:center;gap:10px}
.topbar-t{font-family:'Space Grotesk',sans-serif;font-size:16px;font-weight:700;flex:1}
.top-chip{font-size:12px;font-weight:700;color:var(--acc);background:var(--acc-soft);border-radius:99px;padding:5px 11px}
.top-btn{width:34px;height:34px;border-radius:50%;border:1px solid var(--bd);background:transparent;color:var(--tx2);cursor:pointer;font-size:15px;display:flex;align-items:center;justify-content:center}
.tabbar{display:none;position:fixed;bottom:0;left:0;right:0;z-index:50;background:var(--card);border-top:1px solid var(--bd);padding:6px 4px calc(6px + env(safe-area-inset-bottom));justify-content:space-around}
.tab-i{display:flex;flex-direction:column;align-items:center;gap:3px;padding:4px 10px;border-radius:12px;cursor:pointer;color:var(--mut);font-size:10.5px;font-weight:600;min-width:56px;user-select:none;-webkit-tap-highlight-color:transparent}
.tab-i.active{color:var(--acc)}

.content{flex:1;min-width:0;display:flex;flex-direction:column}
.main{flex:1;width:100%;max-width:780px;margin:0 auto;padding:28px 28px 56px}
.pg-title{font-family:'Space Grotesk',sans-serif;font-size:26px;font-weight:700;margin-bottom:4px}
.pg-sub{font-size:13.5px;color:var(--mut);margin-bottom:22px;line-height:1.55}

/* ── Level / XP header ─────────────────────────────────────────────── */
.xp-card{background:var(--card);border:1px solid var(--bd);box-shadow:var(--sh);border-radius:16px;padding:14px 18px;margin-bottom:22px;display:flex;align-items:center;gap:16px}
.xp-lv{font-family:'Space Grotesk',sans-serif;font-size:16px;font-weight:700;color:var(--tx)}
.xp-n{font-size:12px;color:var(--mut);margin-top:1px;font-weight:500}
.xp-w{flex:1}
.xp-meta{display:flex;justify-content:space-between;margin-bottom:5px;font-size:11.5px;font-weight:600}
.xp-bg{height:8px;background:var(--ring);border-radius:99px;overflow:hidden}
.xp-f{height:100%;background:var(--acc);border-radius:99px;transition:width 0.6s}
.ring-lv{font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:15px;color:var(--acc)}
.ring-lv-s{font-size:9px;font-weight:700;letter-spacing:0.5px;color:var(--mut)}

/* ── Cards & callouts ──────────────────────────────────────────────── */
.card{background:var(--card);border:1px solid var(--bd);box-shadow:var(--sh);border-radius:16px;padding:18px 20px;margin-bottom:14px}
.card-t{font-size:13px;font-weight:700;color:var(--tx);margin-bottom:12px}
.callout{border-radius:12px;padding:12px 15px;margin-bottom:14px;border-left:4px solid}
.cn{background:var(--co-n);border-color:var(--acc)}
.cg{background:var(--co-g);border-color:#f59e0b}
.cr{background:var(--co-r);border-color:#ef4444}
.cgr{background:var(--co-gr);border-color:#22c55e}
.ct{font-size:13px;line-height:1.65;color:var(--tx1)}
.ct strong{color:var(--tx)}

/* ── Schedule ──────────────────────────────────────────────────────── */
.day-tabs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px}
.day-tab{padding:7px 14px;border-radius:99px;cursor:pointer;font-size:13px;font-weight:600;border:1px solid var(--bd);background:var(--card);color:var(--tx2);transition:all 0.15s;user-select:none}
.day-tab:hover{border-color:var(--bdh);color:var(--tx)}
.day-tab.active{background:var(--acc);border-color:var(--acc);color:#fff}
.day-type{font-family:'Space Grotesk',sans-serif;font-size:16px;font-weight:700;color:var(--acc);margin-bottom:2px}
.day-sub{font-size:13px;color:var(--mut);margin-bottom:12px}
.blk{border-radius:12px;border:1px solid;margin-bottom:5px;overflow:hidden;transition:filter 0.15s}
.blk.ck{cursor:pointer}
.blk.ck:hover{filter:brightness(1.06)}
.blk-m{display:flex;align-items:center}
.blk-t{width:118px;flex-shrink:0;padding:10px 12px;font-size:11.5px;font-weight:700;border-right:1px solid var(--line)}
.blk-c{padding:10px 13px;flex:1}
.blk-l{font-size:13px;font-weight:600}
.blk-b{font-size:9.5px;font-weight:700;letter-spacing:0.8px;margin-left:7px;opacity:0.75}
.blk-a{padding:0 12px;font-size:10px;color:var(--dim);transition:transform 0.2s;flex-shrink:0}
.blk-a.open{transform:rotate(180deg)}
.blk-d{border-top:1px solid var(--line);padding:11px 13px}
.det{font-size:13px;color:var(--tx2);line-height:1.6;margin-bottom:8px}
.tm{background:rgba(168,85,247,0.08);border:1px solid rgba(168,85,247,0.3);border-radius:10px;padding:8px 11px;display:flex;gap:8px;align-items:flex-start}
.tm-l{font-size:10px;font-weight:700;letter-spacing:0.5px;color:#a855f7;flex-shrink:0;margin-top:2px}
.tm-t{font-size:12.5px;color:var(--purp-t);line-height:1.5}
.leg{display:flex;gap:12px;flex-wrap:wrap;margin-top:14px}
.leg-i{display:flex;align-items:center;gap:5px;font-size:11px;font-weight:600;color:var(--mut)}
.leg-d{width:8px;height:8px;border-radius:3px;flex-shrink:0}

/* ── Tables ────────────────────────────────────────────────────────── */
.tbl{width:100%;border-collapse:collapse;font-size:13px}
.tbl th{background:var(--th);padding:9px 12px;text-align:left;font-size:11px;font-weight:700;letter-spacing:0.6px;color:var(--mut);border-bottom:1px solid var(--bd)}
.tbl th:first-child{border-radius:8px 0 0 8px}
.tbl th:last-child{border-radius:0 8px 8px 0}
.tbl td{padding:10px 12px;border-bottom:1px solid var(--bd2);font-size:13px;line-height:1.5}
.tbl tr:last-child td{border-bottom:none}
.old{color:var(--red-t)}.nw{color:var(--green-t)}
.bld{color:var(--green-t);font-weight:600}.brk{color:var(--red-t);font-weight:600}
.law-n{font-weight:700;color:var(--acc)}

/* ── Chips & filters ───────────────────────────────────────────────── */
.frow{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:16px;align-items:center}
.chip{padding:7px 15px;border-radius:99px;border:1px solid var(--bd);background:var(--card);font-size:13px;font-weight:600;cursor:pointer;color:var(--tx2);transition:all 0.15s;user-select:none}
.chip:hover{border-color:var(--bdh);color:var(--tx)}
.chip.active{background:var(--acc);border-color:var(--acc);color:#fff}
.chip.dc{border-color:rgba(168,85,247,0.5);color:#a855f7}
.chip.dc.active{background:#a855f7;border-color:#a855f7;color:#fff}

/* ── Quests ────────────────────────────────────────────────────────── */
.cat-sec{margin-bottom:26px}
.cat-hdr{display:flex;align-items:center;gap:10px;margin-bottom:10px;flex-wrap:wrap}
.cat-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0}
.cat-nm{font-family:'Space Grotesk',sans-serif;font-size:16px;font-weight:700;color:var(--tx)}
.cat-xp{font-size:11.5px;font-weight:700;padding:3px 10px;border-radius:99px;border:1px solid}
.quest{background:var(--card);border:1px solid var(--bd);box-shadow:var(--sh);border-radius:14px;padding:13px 15px;display:flex;align-items:flex-start;gap:12px;margin-bottom:7px;transition:border-color 0.15s}
.quest:hover{border-color:var(--bdh)}
.quest.done{opacity:0.5}
.qchk{width:24px;height:24px;border-radius:50%;border:2px solid var(--bdh);flex-shrink:0;margin-top:1px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all 0.15s;font-size:12px;font-weight:700;color:white}
.qchk.lock{cursor:default;border-style:dashed}
.qb{flex:1;min-width:0}
.qt{font-size:14px;font-weight:500;color:var(--tx);line-height:1.45}
.qt.done{text-decoration:line-through;color:var(--dim)}
.qm{display:flex;align-items:center;gap:7px;margin-top:5px;flex-wrap:wrap}
.qxp{font-size:12px;font-weight:700;color:var(--acc)}
.qst{font-size:11px;padding:2.5px 9px;border-radius:99px;font-weight:700;display:flex;align-items:center;gap:4px}
.qnt{font-size:12px;color:var(--mut);margin-top:4px}
.qac{display:flex;gap:5px;flex-shrink:0}
.bi{width:30px;height:30px;border-radius:50%;border:1px solid var(--bd);background:transparent;cursor:pointer;color:var(--mut);display:flex;align-items:center;justify-content:center;font-size:12px;transition:all 0.15s}
.bi:hover{border-color:var(--acc);color:var(--acc);background:var(--acc-soft)}
.bi.del:hover{border-color:#ef4444;color:var(--red-t);background:rgba(239,68,68,0.1)}
.btn-add{width:100%;padding:11px;border-radius:12px;border:1px dashed var(--bdh);background:transparent;cursor:pointer;color:var(--acc);font-size:13px;font-weight:700;font-family:'DM Sans',sans-serif;transition:all 0.15s;margin-top:4px}
.btn-add:hover{border-color:var(--acc);background:var(--acc-soft)}
.dq{background:var(--card);border:1px solid var(--bd);box-shadow:var(--sh);border-radius:14px;padding:12px 15px;display:flex;align-items:center;gap:12px;margin-bottom:7px;transition:border-color 0.15s}
.dq:hover{border-color:var(--bdh)}
.dq.done{opacity:0.5}
.di{flex:1;min-width:0}
.dt{font-size:14px;font-weight:500;color:var(--tx);line-height:1.45}
.dt.done{text-decoration:line-through;color:var(--dim)}
.dm{display:flex;align-items:center;gap:8px;margin-top:4px;flex-wrap:wrap}
.sb{display:flex;align-items:center;gap:3px;font-size:12px;font-weight:700}
.mb{font-size:11px;padding:1.5px 8px;border-radius:99px;font-weight:700}
.dn{font-size:11.5px;color:var(--mut)}

/* ── Modal & forms ─────────────────────────────────────────────────── */
.overlay{position:fixed;inset:0;background:rgba(0,0,0,0.55);display:flex;align-items:center;justify-content:center;z-index:100;padding:20px}
.modal{background:var(--modal);border:1px solid var(--bd);border-radius:20px;box-shadow:0 12px 40px rgba(0,0,0,0.25);padding:24px;width:100%;max-width:460px;max-height:90vh;overflow-y:auto}
.mt{font-family:'Space Grotesk',sans-serif;font-size:19px;font-weight:700;margin-bottom:16px}
.fg{margin-bottom:13px}
.fl{font-size:11px;font-weight:700;color:var(--mut);letter-spacing:0.6px;text-transform:uppercase;display:block;margin-bottom:6px}
.fi,.fsel,.fta{width:100%;background:var(--bg);border:1px solid var(--bd);border-radius:12px;padding:10px 13px;color:var(--tx);font-family:'DM Sans',sans-serif;font-size:14px;outline:none;transition:border-color 0.15s}
.fi:focus,.fsel:focus,.fta:focus{border-color:var(--acc)}
.fsel option{background:var(--modal)}
.fta{resize:vertical;min-height:64px}
.mf{display:flex;gap:8px;justify-content:flex-end;margin-top:20px}
.bp{padding:10px 20px;border-radius:99px;background:var(--acc);color:white;border:none;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:13.5px;font-weight:700;transition:background 0.15s}
.bp:hover{background:var(--acc-h)}
.bp:disabled{opacity:0.4;cursor:not-allowed}
.bp.green{background:#16a34a}.bp.green:hover{background:#15803d}
.bp.amber{background:#d97706}.bp.amber:hover{background:#b45309}
.bs{padding:10px 18px;border-radius:99px;background:transparent;color:var(--tx2);border:1px solid var(--bd);cursor:pointer;font-family:'DM Sans',sans-serif;font-size:13.5px;font-weight:600;transition:all 0.15s}
.bs:hover{border-color:var(--bdh);color:var(--tx)}

/* ── Static pages ──────────────────────────────────────────────────── */
.pr{margin-bottom:18px;padding-bottom:18px;border-bottom:1px solid var(--bd2)}
.pr:last-child{border-bottom:none;margin-bottom:0;padding-bottom:0}
.pt{font-family:'Space Grotesk',sans-serif;font-size:16px;font-weight:700;color:var(--acc);margin-bottom:6px}
.pd{font-size:13.5px;color:var(--tx2);line-height:1.7}
.oc{background:var(--card);border:1px solid var(--bd);box-shadow:var(--sh);border-radius:14px;padding:15px 17px;margin-bottom:9px;display:flex;align-items:flex-start;gap:14px}
.oc.done{border-color:rgba(34,197,94,0.5)}
.on{font-family:'Space Grotesk',sans-serif;font-size:24px;font-weight:700;color:var(--fnt);flex-shrink:0;width:32px;text-align:center}
.oc.done .on{color:#22c55e}
.ot{font-size:14.5px;font-weight:600;color:var(--tx);margin-bottom:3px}
.od{font-size:13px;color:var(--mut);line-height:1.55}
.op{font-size:10.5px;padding:3px 10px;border-radius:99px;font-weight:700;margin-left:auto;flex-shrink:0;white-space:nowrap}

/* ── Fuel (MyFitnessPal-style diary) ───────────────────────────────── */
.fh-row{display:flex;align-items:center;gap:26px;flex-wrap:wrap}
.fh-big{font-family:'Space Grotesk',sans-serif;font-size:28px;font-weight:700;line-height:1}
.fh-lbl{font-size:10.5px;font-weight:700;letter-spacing:0.6px;text-transform:uppercase;color:var(--mut);margin-top:4px}
.fh-eq{flex:1;min-width:180px}
.fh-line{display:flex;align-items:center;gap:12px;padding:7px 0;font-size:14px}
.fh-line + .fh-line{border-top:1px solid var(--bd2)}
.fh-ic{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0}
.fh-k{flex:1;color:var(--tx2);font-weight:500}
.fh-v{font-weight:700;color:var(--tx)}
.mac-rings{display:flex;justify-content:space-around;gap:8px;flex-wrap:wrap}
.mac-ring{display:flex;flex-direction:column;align-items:center;gap:7px}
.mac-ring-v{font-family:'Space Grotesk',sans-serif;font-size:15px;font-weight:700}
.mac-ring-t{font-size:10px;font-weight:600;color:var(--mut)}
.mac-ring-n{font-size:12.5px;font-weight:700}
.mac-ring-l{font-size:11.5px;color:var(--mut);font-weight:600}
.dy-hd{display:flex;align-items:baseline;gap:10px}
.dy-nm{font-family:'Space Grotesk',sans-serif;font-size:15.5px;font-weight:700}
.dy-when{font-size:11.5px;color:var(--dim);margin-top:1px}
.dy-kcal{margin-left:auto;font-size:14px;font-weight:700;color:var(--tx2);flex-shrink:0}
.dy-en{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--bd2)}
.dy-en-b{flex:1;min-width:0}
.dy-en-t{font-size:13.5px;font-weight:500;line-height:1.4}
.dy-en-m{font-size:11.5px;color:var(--mut);margin-top:2px}
.dy-en-k{font-size:13px;font-weight:700;color:var(--tx2);flex-shrink:0}
.dy-add{background:transparent;border:none;color:var(--acc);font-size:13.5px;font-weight:700;font-family:'DM Sans',sans-serif;cursor:pointer;padding:11px 0 2px;display:block}
.dy-add:hover{color:var(--acc-h)}
.dy-panel{border-top:1px solid var(--bd2);margin-top:10px;padding-top:12px}
.dy-opt{display:flex;align-items:center;gap:10px;padding:9px 11px;border:1px solid var(--bd);border-radius:12px;margin-bottom:6px;cursor:pointer;transition:all 0.13s}
.dy-opt:hover{border-color:var(--acc);background:var(--acc-soft)}
.dy-plus{width:26px;height:26px;border-radius:50%;background:var(--acc-soft);color:var(--acc);display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:700;flex-shrink:0}

/* ── Train ─────────────────────────────────────────────────────────── */
.mac-row{display:flex;gap:14px;flex-wrap:wrap;margin-bottom:6px}
.mac{flex:1;min-width:130px}
.mac-l{display:flex;justify-content:space-between;font-size:11.5px;font-weight:600;color:var(--mut);margin-bottom:5px}
.mac-bg{height:8px;background:var(--ring);border-radius:99px;overflow:hidden}
.mac-f{height:100%;border-radius:99px;transition:width 0.4s}
.set-row{display:flex;gap:6px;align-items:center;margin-bottom:6px;flex-wrap:wrap}
.set-n{font-size:11px;font-weight:700;color:var(--dim);width:36px;flex-shrink:0}
.fi.sm{width:64px;padding:7px 8px;font-size:13px;text-align:center;border-radius:10px}
.tgl{padding:6px 11px;border-radius:99px;border:1px solid var(--bd);background:transparent;font-size:10.5px;font-weight:700;cursor:pointer;color:var(--mut);transition:all 0.12s;user-select:none;font-family:'DM Sans',sans-serif}
.tgl.on{border-color:#22c55e;color:var(--green-t);background:rgba(34,197,94,0.1)}
.tgl.bad{border-color:#ef4444;color:var(--red-t);background:rgba(239,68,68,0.1)}
.ex-card{background:var(--card);border:1px solid var(--bd);box-shadow:var(--sh);border-radius:14px;padding:14px 16px;margin-bottom:9px}
.ex-hd{display:flex;align-items:baseline;gap:9px;margin-bottom:9px;flex-wrap:wrap}
.ex-nm{font-size:14px;font-weight:700}
.ex-wt{font-size:12.5px;font-weight:700;color:#f59e0b}
.ex-nt{font-size:11.5px;color:var(--mut)}
.gate{font-size:12px;font-weight:600;padding:8px 11px;border-radius:10px;margin-top:6px;line-height:1.5}
.gate.advance{background:rgba(34,197,94,0.1);color:var(--green-t);border:1px solid rgba(34,197,94,0.35)}
.gate.hold{background:rgba(100,116,139,0.1);color:var(--tx2);border:1px solid rgba(100,116,139,0.3)}
.gate.drop_back{background:rgba(239,68,68,0.1);color:var(--red-t);border:1px solid rgba(239,68,68,0.35)}

/* ── Coach ─────────────────────────────────────────────────────────── */
.coach-card{border:1px solid var(--bd);box-shadow:var(--sh);border-radius:16px;padding:15px 17px;margin-top:12px;background:var(--card)}
.coach-pid{font-size:10.5px;font-weight:700;letter-spacing:0.6px;color:var(--acc);margin-bottom:6px;text-transform:uppercase}
.coach-act{font-size:13.5px;line-height:1.7;color:var(--tx)}

/* ── More page (mobile) ────────────────────────────────────────────── */
.mr-row{display:flex;align-items:center;gap:13px;padding:15px 17px;background:var(--card);border:1px solid var(--bd);box-shadow:var(--sh);border-radius:14px;margin-bottom:8px;cursor:pointer;transition:border-color 0.15s;user-select:none}
.mr-row:hover{border-color:var(--bdh)}
.mr-t{font-size:14.5px;font-weight:600;flex:1}
.mr-a{color:var(--dim);font-size:13px}

::-webkit-scrollbar{width:5px}
::-webkit-scrollbar-track{background:var(--bg)}
::-webkit-scrollbar-thumb{background:var(--bd);border-radius:99px}
@keyframes fs{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
.fi-anim{animation:fs 0.2s ease forwards}

@media(max-width:900px){
  .sidebar{display:none}
  .topbar{display:flex}
  .tabbar{display:flex}
  .main{padding:18px 14px calc(86px + env(safe-area-inset-bottom))}
  .pg-title{font-size:22px}
  .blk-t{width:96px;padding:9px 8px;font-size:10.5px}
  .fh-row{gap:18px}
}
`;

/** Circular progress ring (MyFitnessPal-style). */
export function Ring({ size = 108, stroke = 9, pct = 0, color = "var(--acc)", children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(100, pct));
  return (
    <div style={{ width: size, height: size, position: "relative", flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)", display: "block" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--ring)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - p / 100)} style={{ transition: "stroke-dashoffset 0.5s" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
        {children}
      </div>
    </div>
  );
}

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
        <span style={{ color: over ? "var(--red-t)" : value >= target ? "var(--green-t)" : "var(--mut)" }}>
          {Math.round(value)}/{target}{unit}
        </span>
      </div>
      <div className="mac-bg"><div className="mac-f" style={{ width: pct + "%", background: over ? "#ef4444" : color }} /></div>
    </div>
  );
}
