import { useState } from "react";
import { canDownload, copyToClipboard } from "@shared/backup.js";
import { useToast } from "@shared/ui.jsx";
import { computeRentz, computeWhist, ordinal, ranks, signed } from "./rules.js";
import { PALETTE, colorIdx, initials } from "./players.js";

const computeOf = (g) => (g.type === "whist" ? computeWhist(g) : computeRentz(g));
const typeName = (g) => (g.type === "whist" ? "Whist" : "Rentz");
const dateOf = (g) =>
  new Date(g.createdAt || g.updatedAt || Date.now()).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export function resultsText(game) {
  const c = computeOf(game);
  const place = ranks(c.totals);
  const best = Math.max(...c.totals);
  const count = c.rows.filter((r) => r.cum).length;
  const unit = game.type === "whist" ? "round" : "hand";
  const rows = game.players.map((p, i) => ({ p, t: c.totals[i], r: place[i] })).sort((a, b) => a.r - b.r || b.t - a.t);
  const nameW = Math.max(...rows.map((x) => x.p.length));
  const totW = Math.max(...rows.map((x) => String(x.t).length));
  const lines = rows.map(
    (x) =>
      `${x.r}. ${x.p.padEnd(nameW)}  ${String(x.t).padStart(totW)}` + (x.t < best ? `  (${signed(x.t - best)})` : "")
  );
  const head = `${typeName(game)}, ${dateOf(game)}: ${count} ${unit}${count === 1 ? "" : "s"}${c.done ? "" : " so far"}`;
  return [head, "", ...lines].join("\n");
}

export function renderPng(game, scale = 2) {
  const c = computeOf(game);
  const rows = c.rows.filter((r) => r.cum);
  const n = game.players.length;
  const place = ranks(c.totals);
  const labelW = game.type === "whist" ? 64 : 124;
  const colW = 92;
  const rowH = 28;
  const titleH = 46;
  const headH = 64;
  const footH = 58;
  const pad = 16;
  const W = pad * 2 + labelW + colW * n;
  const H = pad * 2 + titleH + headH + rows.length * rowH + footH;
  const canvas = document.createElement("canvas");
  canvas.width = W * scale;
  canvas.height = H * scale;
  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);
  const font = (w, s) => `${w} ${s}px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
  const clip = (text, max) => {
    let t = text;
    while (t.length > 1 && ctx.measureText(t).width > max) t = t.slice(0, -1);
    return t === text ? t : t.slice(0, -1) + "…";
  };
  const C = {
    bg: "#0b1220",
    surface: "#131c2e",
    surface2: "#1b2740",
    border: "#24314d",
    text: "#e6ecf7",
    muted: "#8b98b3",
    ok: "#22c55e",
    bad: "#ef4444",
    gold: "#f59e0b",
  };

  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);
  ctx.textBaseline = "middle";

  ctx.fillStyle = C.text;
  ctx.font = font(800, 20);
  ctx.textAlign = "left";
  ctx.fillText(`${typeName(game)} · ${dateOf(game)}`, pad, pad + titleH / 2 - 4);

  const top = pad + titleH;
  const colX = (i) => pad + labelW + colW * i;
  ctx.fillStyle = C.surface2;
  ctx.fillRect(pad, top, W - pad * 2, headH);
  game.players.forEach((p, i) => {
    const cx = colX(i) + colW / 2;
    const pal = PALETTE[colorIdx(game, i)];
    ctx.fillStyle = pal.bg;
    ctx.beginPath();
    ctx.arc(cx, top + 20, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = pal.ink;
    ctx.font = font(800, 11);
    ctx.textAlign = "center";
    ctx.fillText(initials(p), cx, top + 20.5);
    ctx.fillStyle = C.text;
    ctx.font = font(700, 13);
    ctx.fillText(clip(p, colW - 10), cx, top + 47);
  });
  ctx.fillStyle = C.muted;
  ctx.font = font(700, 11);
  ctx.textAlign = "left";
  ctx.fillText(game.type === "whist" ? "CARDS" : "GAME", pad + 8, top + headH / 2);

  let y = top + headH;
  rows.forEach((r, k) => {
    ctx.fillStyle = k % 2 ? C.surface : C.bg;
    ctx.fillRect(pad, y, W - pad * 2, rowH);
    ctx.fillStyle = C.muted;
    ctx.font = font(600, 12.5);
    ctx.textAlign = "left";
    const label = game.type === "whist" ? String(r.cards) : r.def?.name || "";
    ctx.fillText(clip(label, labelW - 12), pad + 8, y + rowH / 2);
    for (let p = 0; p < n; p++) {
      const cx = colX(p) + colW / 2;
      const good = game.type === "whist" ? r.ok[p] : r.pts[p] > 0;
      const bad = game.type === "whist" ? r.ok[p] === false : r.pts[p] < 0;
      ctx.fillStyle = good ? C.ok : bad ? C.bad : C.text;
      ctx.font = font(700, 14);
      ctx.textAlign = "center";
      const bonus = r.bonus?.[p] ? (r.bonus[p] > 0 ? " ★" : " ▼") : "";
      ctx.fillText(String(r.cum[p]) + bonus, cx, y + rowH / 2);
    }
    y += rowH;
  });

  ctx.strokeStyle = C.border;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad, y + 0.5);
  ctx.lineTo(W - pad, y + 0.5);
  ctx.stroke();
  ctx.fillStyle = C.surface2;
  ctx.fillRect(pad, y + 1, W - pad * 2, footH - 1);
  ctx.fillStyle = C.muted;
  ctx.font = font(700, 11);
  ctx.textAlign = "left";
  ctx.fillText("TOTAL", pad + 8, y + footH / 2);
  const medal = ["", C.gold, "#9aa7bd", "#b87a4b"];
  for (let p = 0; p < n; p++) {
    const cx = colX(p) + colW / 2;
    ctx.fillStyle = C.text;
    ctx.font = font(800, 20);
    ctx.textAlign = "center";
    ctx.fillText(String(c.totals[p]), cx, y + 22);
    ctx.fillStyle = rows.length ? medal[place[p]] || C.muted : C.muted;
    ctx.font = font(700, 11.5);
    ctx.fillText(rows.length ? ordinal(place[p]) : "", cx, y + 43);
  }
  return canvas;
}

const toBlob = (canvas) => new Promise((res) => canvas.toBlob(res, "image/png"));
const fileBase = (game) => `${game.type}-${new Date(game.createdAt || Date.now()).toISOString().slice(0, 10)}`;

async function shareText(game) {
  const text = resultsText(game);
  if (typeof navigator.share === "function") {
    try {
      await navigator.share({ title: `${typeName(game)} results`, text });
      return "shared";
    } catch (e) {
      if (e?.name === "AbortError") return "cancelled";
    }
  }
  return (await copyToClipboard(text)) ? "copied" : "failed";
}

async function shareImage(game) {
  const blob = await toBlob(renderPng(game));
  const name = fileBase(game) + ".png";
  if (blob && canDownload()) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return "downloaded";
  }
  if (blob) {
    let file = null;
    try {
      file = new File([blob], name, { type: "image/png" });
      if (!navigator.canShare?.({ files: [file] })) file = null;
    } catch {
      file = null;
    }
    if (file) {
      try {
        await navigator.share({ files: [file], title: `${typeName(game)} results` });
        return "shared";
      } catch (e) {
        if (e?.name === "AbortError") return "cancelled";
      }
    }
  }
  return (await copyToClipboard(resultsText(game))) ? "copied-text" : "failed";
}

const MESSAGES = {
  copied: "Results copied. Paste them into the chat.",
  "copied-text": "Pictures can't be shared here, so the results were copied as text.",
  downloaded: "Score table saved as a picture.",
  failed: "Couldn't share or copy the results.",
};

export function ShareButtons({ game }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const run = async (fn) => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fn(game);
      if (MESSAGES[res]) toast(MESSAGES[res]);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="sharerow">
      <button type="button" className="bigbtn secondary" disabled={busy} onClick={() => run(shareText)}>
        Share results
      </button>
      <button type="button" className="bigbtn secondary" disabled={busy} onClick={() => run(shareImage)}>
        Share picture
      </button>
    </div>
  );
}
