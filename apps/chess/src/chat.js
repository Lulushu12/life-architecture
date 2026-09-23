// Bot banter: event detection from game state + eval swings, canned-line
// selection from the persona packs, and an optional live-AI layer that
// talks to any OpenAI-compatible endpoint configured in settings.

import { winPct } from "./engine.js";

// Detect chat-worthy events for the move just played.
// ctx: { move (chess.js verbose move), byBot, cpBefore, cpAfter (white persp),
//        botColor ('w'|'b'), thinkMs, pieceCount, prevPieceCount }
export function detectEvents(ctx) {
  const events = [];
  const { move, byBot, botColor } = ctx;
  const botSign = botColor === "w" ? 1 : -1;
  const dropForMover = moverWinDrop(ctx);

  if (move.san.includes("O-O")) events.push("castle");
  if (move.promotion) events.push("promote");

  if (dropForMover >= 18) events.push(byBot ? "i_blunder" : "you_blunder");
  else if (!byBot && dropForMover <= 0.8 && Math.abs(ctx.cpBefore) > 80) events.push("you_brilliant");

  if (move.captured && "qrbn".includes(move.captured))
    events.push(byBot ? "i_capture" : "you_capture");
  if (move.san.includes("+") || move.san.includes("#"))
    events.push(byBot ? "i_check" : "you_check");

  const botWin = winPct(ctx.cpAfter * botSign);
  if (botWin > 82) events.push("winning");
  else if (botWin < 18) events.push("losing");
  else if (botWin > 42 && botWin < 58) events.push("equal");

  if (!byBot && ctx.thinkMs > 45000) events.push("slow_move");
  if (ctx.pieceCount <= 12 && ctx.prevPieceCount > 12) events.push("endgame");

  return events;
}

function moverWinDrop({ move, cpBefore, cpAfter }) {
  const sign = move.color === "w" ? 1 : -1;
  return Math.max(0, winPct(cpBefore * sign) - winPct(cpAfter * sign));
}

// Priority when several events fire at once — one bubble per move, max.
const PRIORITY = [
  "i_win", "i_lose", "draw",
  "you_blunder", "i_blunder", "you_brilliant", "promote",
  "i_capture", "you_capture", "winning", "losing",
  "i_check", "you_check", "castle", "endgame", "slow_move", "equal", "greeting",
];

// Pick at most one line. cooldowns: { [category]: lastPly } mutated in place.
export function pickLine(persona, events, ply, cooldowns) {
  return pickLineWithEvent(persona, events, ply, cooldowns)?.text ?? null;
}

export function pickLineWithEvent(persona, events, ply, cooldowns) {
  const ordered = PRIORITY.filter((e) => events.includes(e));
  for (const ev of ordered) {
    const lines = persona.lines[ev];
    if (!lines || lines.length === 0) continue;
    const big = ["i_win", "i_lose", "draw", "greeting", "you_blunder", "i_blunder"].includes(ev);
    const cool = big ? 0 : ev === "equal" ? 24 : 10;
    if (cooldowns[ev] != null && ply - cooldowns[ev] < cool) continue;
    if (!big && Math.random() > persona.style.chattiness * 0.75) return null;
    cooldowns[ev] = ply;
    return { text: lines[Math.floor(Math.random() * lines.length)], event: ev };
  }
  return null;
}

// Optional live-AI reaction. Returns a string or null (any failure → null,
// callers fall back to the canned line). Never throws.
const EVENT_TEXT = {
  i_win: "you just won the game",
  i_lose: "you just lost the game",
  draw: "the game ended in a draw",
  you_blunder: "your opponent just blundered",
  i_blunder: "you just blundered",
  you_brilliant: "your opponent found a strong move",
  promote: "a pawn just promoted",
  i_capture: "you just captured a piece",
  you_capture: "your opponent just captured one of your pieces",
  winning: "you are winning",
  losing: "you are losing",
  i_check: "you just gave check",
  you_check: "your opponent just gave you check",
  castle: "someone just castled",
  endgame: "the game has reached an endgame",
  slow_move: "your opponent took a long time to move",
  equal: "the position is balanced",
  greeting: "the game is starting",
};

// Last `n` plies as numbered SAN ("21. Nf3 Nc6 22. Bb5"), not the whole PGN:
// the model only needs the recent moves to react, and short prompts are faster.
export function recentMoves(sans, n = 10, startPly = 0) {
  const from = Math.max(0, sans.length - n);
  const out = [];
  for (let i = from; i < sans.length; i++) {
    const ply = startPly + i;
    const num = Math.floor(ply / 2) + 1;
    if (ply % 2 === 0) out.push(`${num}. ${sans[i]}`);
    else out.push(i === from ? `${num}... ${sans[i]}` : sans[i]);
  }
  return out.join(" ");
}

export async function aiReact({ ai, persona, event, recent, cpWhitePersp, cpWhiteBefore, botColor }) {
  if (!ai?.baseUrl || !ai?.model) return null;
  try {
    const sign = botColor === "w" ? 1 : -1;
    const evalForBot = (sign * cpWhitePersp) / 100;
    const deltaForBot = cpWhiteBefore == null ? 0 : (sign * (cpWhitePersp - cpWhiteBefore)) / 100;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(ai.baseUrl.replace(/\/$/, "") + "/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(ai.apiKey ? { Authorization: "Bearer " + ai.apiKey } : {}),
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: ai.model,
        max_tokens: 60,
        messages: [
          {
            role: "system",
            content:
              `You are ${persona.name}, a chess bot: ${persona.tagline}. ` +
              `Personality: ${personaVoice(persona)}. React to the game in ONE short chat message ` +
              `(under 15 words), in character. Never give concrete move advice. No quotes around the reply.`,
          },
          {
            role: "user",
            content:
              `Last moves: ${recent || "(none yet)"}\nWhat just happened: ${EVENT_TEXT[event] || event}. ` +
              `Your eval: ${evalForBot > 0 ? "+" : ""}${evalForBot.toFixed(1)} pawns ` +
              `(${deltaForBot >= 0 ? "+" : ""}${deltaForBot.toFixed(1)} since the previous move).`,
          },
        ],
      }),
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const j = await res.json();
    const text = j.choices?.[0]?.message?.content?.trim();
    return text ? text.slice(0, 140) : null;
  } catch {
    return null;
  }
}

function personaVoice(p) {
  const a = p.style.aggression > 0.6 ? "aggressive, loves attacks" : p.style.aggression < 0.4 ? "calm, positional" : "balanced";
  const c = p.style.chattiness > 0.6 ? "talkative and playful" : "reserved, speaks rarely";
  return `${a}; ${c}`;
}
