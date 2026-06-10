/**
 * Client wrapper for the coach callable. The coach proposes; the user
 * confirms; the CLIENT writes Firestore. Never the other way around.
 */

import { getFunctions, httpsCallable } from "firebase/functions";
import { PROTOCOLS } from "../system/protocols.js";
import { OPTIONS } from "../system/meals.js";

let _callable = null;
function callable() {
  if (!_callable) _callable = httpsCallable(getFunctions(undefined, "europe-west1"), "coach");
  return _callable;
}

export const CONFIDENCE_FLOOR = 0.7;

/** Natural language → structured log proposal. */
export async function parseLog(text, ctx) {
  const res = await callable()({ op: "parseLog", text, context: ctx });
  return res.data;
}

/** Situation → protocol-grounded directive. */
export async function askCoach(situation, ctx) {
  const res = await callable()({
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

export function coachConfigured() {
  // The callable exists only after `firebase deploy --only functions`;
  // callers catch errors and show the offline card regardless.
  return true;
}

export function explainCoachError(err) {
  const code = err?.code || "";
  if (code.includes("unauthenticated")) return "Sign in to use the coach.";
  if (code.includes("unavailable")) return "Coach model temporarily unavailable — try again.";
  if (code.includes("not-found") || code.includes("internal")) return "Coach backend not deployed yet (firebase deploy --only functions).";
  return "Coach unreachable. Logs still work — the tracker is fully offline-capable.";
}
