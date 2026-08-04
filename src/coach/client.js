/**
 * Coach client — talks directly to any OpenAI-compatible chat endpoint from
 * the browser. No backend of ours required:
 *
 *   - Local model:  Ollama (http://localhost:11434/v1), LM Studio
 *                   (http://localhost:1234/v1), llama.cpp server — free,
 *                   private, key optional.
 *   - Hosted model: any OpenAI-compatible provider — needs its API key,
 *                   which then lives in THIS browser only. Fine for a
 *                   personal device; do not do it on shared machines.
 *
 * The coach proposes; the user confirms; the CLIENT writes the store.
 * Never the other way around.
 */

import { PROTOCOLS } from "../system/protocols.js";
import { OPTIONS } from "../system/meals.js";

const CFG_KEY = "la3_coach";

export function getCoachConfig() {
  try { const r = localStorage.getItem(CFG_KEY); return r ? JSON.parse(r) : null; } catch { return null; }
}
export function setCoachConfig(cfg) {
  try {
    if (cfg && cfg.url) localStorage.setItem(CFG_KEY, JSON.stringify(cfg));
    else localStorage.removeItem(CFG_KEY);
  } catch { /* blocked */ }
}
export function coachConfigured() { return !!getCoachConfig()?.url; }

export const CONFIDENCE_FLOOR = 0.7;

// ── Schemas (ported from functions/index.js) ─────────────────────────────
const PARSE_LOG_SCHEMA = {
  type: "object", additionalProperties: false,
  required: ["kind", "confidence"],
  properties: {
    kind: { type: "string", enum: ["workout", "meal", "metric", "unclear"] },
    workout: {
      type: "object", additionalProperties: false,
      required: ["session", "exercises"],
      properties: {
        session: { type: "string", enum: ["Push", "Pull", "Legs", "CallDay"] },
        exercises: {
          type: "array",
          items: {
            type: "object", additionalProperties: false,
            required: ["name", "sets"],
            properties: {
              name: { type: "string" },
              id: { type: "string" },
              sets: {
                type: "array",
                items: {
                  type: "object", additionalProperties: false,
                  required: ["reps", "weightKg", "clean", "painFree"],
                  properties: {
                    reps: { type: "integer" }, weightKg: { type: "number" },
                    clean: { type: "boolean" }, painFree: { type: "boolean" },
                  },
                },
              },
            },
          },
        },
        cardioMin: { type: "integer" },
        notes: { type: "string" },
      },
    },
    meal: {
      type: "object", additionalProperties: false,
      required: ["slot", "description", "kcal", "protein", "fat", "carbs"],
      properties: {
        slot: { type: "string", enum: ["breakfast", "preworkout", "recovery", "dinner", "snack"] },
        description: { type: "string" },
        kcal: { type: "number" }, protein: { type: "number" },
        fat: { type: "number" }, carbs: { type: "number" },
      },
    },
    metric: {
      type: "object", additionalProperties: false,
      properties: { waistCm: { type: "number" }, weightKg: { type: "number" } },
      required: [],
    },
    flags: { type: "array", items: { type: "string", enum: ["shoulder_hardstop", "incomplete_log", "weight_jump_too_big", "untracked_estimate"] } },
    confidence: { type: "number" },
  },
};

const COACH_SCHEMA = {
  type: "object", additionalProperties: false,
  required: ["type"],
  properties: {
    type: { type: "string", enum: ["directive", "deload_signal", "macro_fill", "review_trigger", "none"] },
    protocol_id: { type: "string" },
    action: { type: "string" },
    macro_fill: {
      type: "object", additionalProperties: false,
      required: ["item", "closes"],
      properties: { item: { type: "string" }, closes: { type: "string" } },
    },
    signals: { type: "array", items: { type: "string" } },
  },
};

// ── System prompts (ported from functions/index.js) ──────────────────────
const COACH_SYSTEM = `You are the coach for a Sovereign Health Operating System. You enforce a fixed system; you do not motivate, encourage, or soften.

OUTPUT RULES
- Action only. No preamble, no validation, no emoji.
- Every directive must cite the protocol_id it derives from. If no protocol in the provided set matches, return type:"none" — never invent advice.
- For minor judgment calls, decide and state the action. Do not ask.
- Deload is NEVER self-prescribed: flag for discussion only, and only on 2+ co-occurring signals (weights regressing across 2 consecutive sessions, soreness not clearing in 48h, sleep quality dropping, motivation gone 3-4 consecutive days). Fewer than 2 signals → type:"none".
- Shoulder discomfort on any pressing/lateral work is a hard stop: drop to the previous weight, never advance.
- Macro gap-fill must respect the remaining fat budget and suggest only from the provided meal options.

You are given: the protocol set, today's schedule slot, and recent logs. Ground every response in those — not in general fitness knowledge.
Respond with ONLY a JSON object matching this schema, no markdown fences, no commentary:
${JSON.stringify(COACH_SCHEMA)}`;

const PARSE_SYSTEM = `You convert natural-language fitness/nutrition notes into structured logs for a PPL training system.

RULES
- Match exercises to the catalog ids when possible: bench, incline_db, pec_deck, lateral, tri_press, tri_push, lat_pull, low_row, ng_pull, rear_delt, db_curl, hammer, squat, leg_press, bss, nordic, back_ext, rdl, crunch.
- "3x10 at 40" → three sets of {reps:10, weightKg:40}. Unstated reps on a working set default to 10; unstated clean/painFree default to true.
- Any mention of shoulder pain/tweak/discomfort on a pressing or lateral/rear-delt movement → that exercise's sets get painFree:false AND flags includes "shoulder_hardstop".
- Meals: estimate macros realistically; add flag "untracked_estimate" when estimating from a vague description.
- Waist/weight measurements → kind:"metric".
- If the text is not a loggable event, kind:"unclear" with low confidence.
- confidence below 0.7 means the user should review before saving.
Respond with ONLY a JSON object matching this schema, no markdown fences, no commentary:
${JSON.stringify(PARSE_LOG_SCHEMA)}`;

// ── OpenAI-compatible transport ──────────────────────────────────────────
async function chat({ system, user, schema, schemaName, maxTokens }) {
  const cfg = getCoachConfig();
  if (!cfg?.url) { const e = new Error("coach not configured"); e.code = "not-configured"; throw e; }
  const url = cfg.url.replace(/\/+$/, "") + "/chat/completions";
  const headers = { "Content-Type": "application/json", ...(cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {}) };
  const base = {
    model: cfg.model || "llama3.1",
    max_tokens: maxTokens,
    temperature: 0.2,
    messages: [{ role: "system", content: system }, { role: "user", content: user }],
  };
  // Prefer enforced structured output; some servers reject the parameter, so degrade gracefully.
  const attempts = [
    { ...base, response_format: { type: "json_schema", json_schema: { name: schemaName, strict: true, schema } } },
    { ...base, response_format: { type: "json_object" } },
    base,
  ];
  let lastErr;
  for (const body of attempts) {
    let res;
    try {
      res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
    } catch {
      const e = new Error("network"); e.code = "unavailable"; throw e;
    }
    if (res.status === 400 || res.status === 422) { lastErr = res.status; continue; } // response_format unsupported → try next shape
    if (res.status === 401 || res.status === 403) { const e = new Error("auth"); e.code = "auth"; throw e; }
    if (res.status === 404) { const e = new Error("not found"); e.code = "not-found"; throw e; }
    if (!res.ok) { const e = new Error(`coach ${res.status}`); e.code = "unavailable"; throw e; }
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content ?? "";
    return parseJsonLoose(text);
  }
  const e = new Error(`coach rejected request (${lastErr})`); e.code = "unavailable"; throw e;
}

/** Small local models sometimes wrap JSON in fences or prose — dig it out. */
function parseJsonLoose(text) {
  try { return JSON.parse(text); } catch { /* keep digging */ }
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) { try { return JSON.parse(fenced[1]); } catch { /* keep digging */ } }
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) { try { return JSON.parse(text.slice(start, end + 1)); } catch { /* fall through */ } }
  const e = new Error("model returned non-JSON"); e.code = "bad-output"; throw e;
}

// ── Ops (same signatures the views already use) ──────────────────────────

/** Natural language → structured log proposal. */
export async function parseLog(text, ctx) {
  return chat({
    system: PARSE_SYSTEM,
    user: `Context: date=${ctx?.date || "unknown"}, planned session=${ctx?.plannedSession || "unknown"}, current lift weights=${JSON.stringify(ctx?.liftWeights || {})}.\n\nLog entry:\n${text}`,
    schema: PARSE_LOG_SCHEMA, schemaName: "parse_log", maxTokens: 2000,
  });
}

/** Situation → protocol-grounded directive. */
export async function askCoach(situation, ctx) {
  const mealOptions = ctx?.mealOptions || Object.values(OPTIONS).flat().map(o => ({ label: o.label, kcal: o.kcal, protein: o.protein, fat: o.fat, carbs: o.carbs }));
  return chat({
    system: COACH_SYSTEM + "\n\nPROTOCOL SET:\n" + JSON.stringify(ctx?.protocols || PROTOCOLS, null, 1),
    user:
      `TODAY: ${ctx?.date || "?"} (${ctx?.weekday || "?"}), planned session: ${ctx?.plannedSession || "?"}.\n` +
      `MACRO TARGETS: 2100 kcal / 160P / 65F / 210C. Today so far: ${JSON.stringify(ctx?.todayMacros || {})}.\n` +
      `MEAL OPTIONS (for macro_fill): ${JSON.stringify(mealOptions)}\n` +
      `RECENT WORKOUTS (compact): ${JSON.stringify(ctx?.recentWorkouts || [])}\n` +
      (ctx?.bodyMetrics ? `WAIST LOG: ${JSON.stringify(ctx.bodyMetrics)}\n` : "") +
      `\nSITUATION:\n${situation}`,
    schema: COACH_SCHEMA, schemaName: "coach_directive", maxTokens: 1500,
  });
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
  if (code === "not-configured") return "Coach not set up — point it at a local model (e.g. Ollama) under More → Data & sync → settings. The tracker works fully without it.";
  if (code === "auth") return "The coach endpoint rejected the API key.";
  if (code === "not-found") return "No chat endpoint at that URL — it should be an OpenAI-compatible base like http://localhost:11434/v1.";
  if (code === "bad-output") return "The model didn't return valid JSON — try again, or use a slightly larger model.";
  if (code === "unavailable" || code.includes("unavailable")) return "Coach endpoint unreachable. Is the local model server running (and OLLAMA_ORIGINS set)?";
  return "Coach unreachable. Logs still work — the tracker is fully offline-capable.";
}
