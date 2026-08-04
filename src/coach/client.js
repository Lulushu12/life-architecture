/**
 * Client wrapper for the coach endpoint. The coach proposes; the user
 * confirms; the CLIENT writes the store. Never the other way around.
 *
 * The backend is optional: set a plain HTTPS endpoint URL (e.g. a deployed
 * copy of functions/index.js behind any HTTP wrapper) in localStorage under
 * "la3_coach_url". Without it, the tracker works fully offline and the
 * Coach page shows a "not configured" message.
 */

import { PROTOCOLS } from "../system/protocols.js";
import { OPTIONS } from "../system/meals.js";

function coachUrl() {
  try { return localStorage.getItem("la3_coach_url") || ""; } catch { return ""; }
}
export function coachConfigured() { return !!coachUrl(); }

async function call(payload) {
  const url = coachUrl();
  if (!url) { const e = new Error("coach not configured"); e.code = "not-configured"; throw e; }
  let res;
  try {
    res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data: payload }) });
  } catch {
    const e = new Error("network"); e.code = "unavailable"; throw e;
  }
  if (!res.ok) { const e = new Error(`coach ${res.status}`); e.code = res.status === 404 ? "not-found" : "unavailable"; throw e; }
  const body = await res.json();
  return { data: body.result ?? body.data ?? body };
}

export const CONFIDENCE_FLOOR = 0.7;

/** Natural language → structured log proposal. */
export async function parseLog(text, ctx) {
  const res = await call({ op: "parseLog", text, context: ctx });
  return res.data;
}

/** Situation → protocol-grounded directive. */
export async function askCoach(situation, ctx) {
  const res = await call({
    op: "coach",
    situation,
    context: {
      ...ctx,
      protocols: PROTOCOLS,
      mealOptions: Object.values(OPTIONS).flat().map(o => ({ label: o.label, kcal: o.kcal, protein: o.protein, fat: o.fat, carbs: o.carbs })),
    },
  });
  return res.data;
}

/** Nightly deload screen — same coach op, fixed instruction. Flags only; never prescribes. */
export async function deloadCheck(ctx) {
  return askCoach(
    "Scheduled deload screen. Evaluate the recent logs for the deload_suspicion protocol. " +
    "Return deload_signal ONLY if 2+ signals co-occur; otherwise type:none.",
    ctx,
  );
}

export function explainCoachError(err) {
  const code = err?.code || "";
  if (code === "not-configured" || code.includes("not-found")) return "Coach backend not configured — the tracker works without it. Set a coach endpoint URL to enable it.";
  if (code.includes("unavailable")) return "Coach temporarily unreachable — try again.";
  return "Coach unreachable. Logs still work — the tracker is fully offline-capable.";
}
