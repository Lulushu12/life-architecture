import { Chess } from "chess.js";
import { getPersona } from "./personas.js";
import { canDownload, copyToClipboard } from "@shared/backup.js";

const pad = (n) => String(n).padStart(2, "0");
const esc = (v) => String(v ?? "").replace(/\\/g, "\\\\").replace(/"/g, '\\"');

function pgnDate(ms) {
  const d = new Date(ms || Date.now());
  if (isNaN(d)) return "????.??.??";
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
}

function splitLabel(label) {
  const base = String(label || "").split(" · ")[0];
  const m = base.split(" vs ");
  return m.length === 2 ? { w: m[0].trim(), b: m[1].trim() } : null;
}

export function gamePlayers(game) {
  if (game.mode === "bot") {
    const p = getPersona(game.personaId);
    const bot = { name: p.name, elo: p.elo };
    const you = { name: "You", elo: null };
    return game.playerColor === "b" ? { w: bot, b: you } : { w: you, b: bot };
  }
  if (game.mode === "engine" && game.names) return { w: { name: game.names.w }, b: { name: game.names.b } };
  if (game.players) return { w: { name: game.players.w, elo: game.players.wElo }, b: { name: game.players.b, elo: game.players.bElo } };
  if (game.mode === "import") {
    const s = splitLabel(game.label);
    if (s) return { w: { name: s.w }, b: { name: s.b } };
  }
  if (game.mode === "analysis") return { w: { name: "Analysis" }, b: { name: "Analysis" } };
  return { w: { name: "White" }, b: { name: "Black" } };
}

function movetext(game) {
  const tokens = [];
  let startPly = 0;
  if (game.startFen) {
    const parts = game.startFen.split(" ");
    startPly = (Math.max(1, parseInt(parts[5], 10) || 1) - 1) * 2 + (parts[1] === "b" ? 1 : 0);
  }
  game.sans.forEach((san, i) => {
    const ply = startPly + i;
    const num = Math.floor(ply / 2) + 1;
    if (ply % 2 === 0) tokens.push(`${num}.`);
    else if (i === 0) tokens.push(`${num}...`);
    tokens.push(san);
  });
  tokens.push(game.result || "*");
  const lines = [];
  let line = "";
  for (const t of tokens) {
    if (line && line.length + 1 + t.length > 79) {
      lines.push(line);
      line = t;
    } else line = line ? `${line} ${t}` : t;
  }
  if (line) lines.push(line);
  return lines.join("\n");
}

export function gamePgn(game) {
  const players = gamePlayers(game);
  const tags = [
    ["Event", game.headers?.Event || "Life Architecture Chess"],
    ["Site", game.headers?.Site || "Life Architecture Chess"],
    ["Date", game.headers?.Date || pgnDate(game.date)],
    ["Round", "-"],
    ["White", players.w.name],
    ["Black", players.b.name],
    ["Result", game.result || "*"],
  ];
  if (players.w.elo) tags.push(["WhiteElo", players.w.elo]);
  if (players.b.elo) tags.push(["BlackElo", players.b.elo]);
  if (game.review?.opening) {
    tags.push(["ECO", game.review.opening.eco]);
    tags.push(["Opening", game.review.opening.name]);
  }
  if (game.reason) tags.push(["Termination", game.reason]);
  if (game.review?.accuracy) {
    const a = game.review.accuracy;
    tags.push(["Accuracy", `White ${a.w}, Black ${a.b}`]);
  }
  if (game.startFen) {
    tags.push(["SetUp", "1"]);
    tags.push(["FEN", game.startFen]);
  }
  const head = tags.map(([k, v]) => `[${k} "${esc(v)}"]`).join("\n");
  return `${head}\n\n${movetext(game)}\n`;
}

export function gamesPgn(games) {
  return games.map(gamePgn).join("\n");
}

export function pgnFilename(label = "games") {
  const safe = String(label).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "games";
  return `chess-${safe}-${new Date().toISOString().slice(0, 10)}.pgn`;
}

export function finalFen(game) {
  try {
    const c = game.startFen ? new Chess(game.startFen) : new Chess();
    for (const s of game.sans) c.move(s);
    return c.fen();
  } catch {
    return game.startFen || new Chess().fen();
  }
}

export function canShare() {
  return typeof navigator !== "undefined" && typeof navigator.share === "function";
}

export async function shareText(text, filename) {
  let file = null;
  try {
    file = new File([text], filename, { type: "application/x-chess-pgn" });
    if (!navigator.canShare?.({ files: [file] })) file = null;
  } catch {
    file = null;
  }
  if (file) await navigator.share({ files: [file], title: filename });
  else await navigator.share({ title: filename, text });
}

export function downloadText(text, filename, type = "application/x-chess-pgn") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export { canDownload, copyToClipboard };
