/**
 * Coach backend — Firebase callable function holding the Anthropic key.
 * Runtime model: Sonnet (claude-sonnet-4-6). Fable never runs here.
 *
 * Deploy:
 *   cd functions && npm i
 *   firebase functions:secrets:set ANTHROPIC_API_KEY
 *   firebase deploy --only functions
 *
 * The coach NEVER writes Firestore — it returns a structured proposal; the
 * client renders a confirm card and writes after the user taps confirm.
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { initializeApp } from "firebase-admin/app";
import Anthropic from "@anthropic-ai/sdk";

initializeApp();
const ANTHROPIC_API_KEY = defineSecret("ANTHROPIC_API_KEY");

const MODEL = "claude-sonnet-4-6";

// ── Schemas (structured outputs) ─────────────────────────────────────────
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
              name: { type: "string", description: "Exercise name, matched to the protocol catalog when possible" },
              id: { type: "string", description: "Catalog id if matched (bench, lateral, squat, ...)" },
              sets: {
                type: "array",
                items: {
                  type: "object", additionalProperties: false,
                  required: ["reps", "weightKg", "clean", "painFree"],
                  properties: {
                    reps: { type: "integer" },
                    weightKg: { type: "number" },
                    clean: { type: "boolean" },
                    painFree: { type: "boolean" },
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
    flags: {
      type: "array",
      items: { type: "string", enum: ["shoulder_hardstop", "incomplete_log", "weight_jump_too_big", "untracked_estimate"] },
    },
    confidence: { type: "number", description: "0..1" },
  },
};

const COACH_SCHEMA = {
  type: "object", additionalProperties: false,
  required: ["type"],
  properties: {
    type: { type: "string", enum: ["directive", "deload_signal", "macro_fill", "review_trigger", "none"] },
    protocol_id: { type: "string", description: "Id of the protocol this derives from. Empty only when type=none." },
    action: { type: "string", description: "The action-only instruction. No motivation, no preamble." },
    macro_fill: {
      type: "object", additionalProperties: false,
      required: ["item", "closes"],
      properties: {
        item: { type: "string", description: "Concrete food suggestion from the user's meal options" },
        closes: { type: "string", description: "What gap it closes, e.g. '22g protein, 180 kcal'" },
      },
    },
    signals: { type: "array", items: { type: "string" }, description: "For deload_signal: the co-occurring signals (2+ required)" },
  },
};

// ── System prompts (static → cache_control) ──────────────────────────────
const COACH_SYSTEM = `You are the coach for a Sovereign Health Operating System. You enforce a fixed system; you do not motivate, encourage, or soften.

OUTPUT RULES
- Action only. No preamble, no validation, no emoji.
- Every directive must cite the protocol_id it derives from. If no protocol in the provided set matches, return type:"none" — never invent advice.
- For minor judgment calls, decide and state the action. Do not ask.
- Deload is NEVER self-prescribed: flag for discussion only, and only on 2+ co-occurring signals (weights regressing across 2 consecutive sessions, soreness not clearing in 48h, sleep quality dropping, motivation gone 3-4 consecutive days). Fewer than 2 signals → type:"none".
- Shoulder discomfort on any pressing/lateral work is a hard stop: drop to the previous weight, never advance.
- Macro gap-fill must respect the remaining fat budget and suggest only from the provided meal options.

You are given: the protocol set, today's schedule slot, and recent logs. Ground every response in those — not in general fitness knowledge.`;

const PARSE_SYSTEM = `You convert natural-language fitness/nutrition notes into structured logs for a PPL training system.

RULES
- Match exercises to the catalog ids when possible: bench, incline_db, pec_deck, lateral, tri_press, tri_push, lat_pull, low_row, ng_pull, rear_delt, db_curl, hammer, squat, leg_press, bss, nordic, back_ext, rdl, crunch.
- "3x10 at 40" → three sets of {reps:10, weightKg:40}. Unstated reps on a working set default to 10; unstated clean/painFree default to true.
- Any mention of shoulder pain/tweak/discomfort on a pressing or lateral/rear-delt movement → that exercise's sets get painFree:false AND flags includes "shoulder_hardstop".
- Meals: estimate macros realistically; add flag "untracked_estimate" when estimating from a vague description.
- Waist/weight measurements → kind:"metric".
- If the text is not a loggable event, kind:"unclear" with low confidence.
- confidence below 0.7 means the user should review before saving.`;

// ── Callable ─────────────────────────────────────────────────────────────
export const coach = onCall(
  { secrets: [ANTHROPIC_API_KEY], cors: true, region: "europe-west1" },
  async (req) => {
    if (!req.auth) throw new HttpsError("unauthenticated", "Sign in first.");
    const { op, text, situation, context } = req.data || {};
    if (!op) throw new HttpsError("invalid-argument", "op required");

    const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY.value() });

    try {
      if (op === "parseLog") {
        if (!text || typeof text !== "string" || text.length > 4000) {
          throw new HttpsError("invalid-argument", "text required (≤4000 chars)");
        }
        const response = await client.messages.create({
          model: MODEL,
          max_tokens: 2000,
          thinking: { type: "adaptive" },
          output_config: { effort: "low", format: { type: "json_schema", schema: PARSE_LOG_SCHEMA } },
          system: [{ type: "text", text: PARSE_SYSTEM, cache_control: { type: "ephemeral" } }],
          messages: [{
            role: "user",
            content: `Context: date=${context?.date || "unknown"}, planned session=${context?.plannedSession || "unknown"}, current lift weights=${JSON.stringify(context?.liftWeights || {})}.\n\nLog entry:\n${text}`,
          }],
        });
        return extractJson(response);
      }

      if (op === "coach") {
        if (!situation || typeof situation !== "string" || situation.length > 4000) {
          throw new HttpsError("invalid-argument", "situation required (≤4000 chars)");
        }
        const protocols = context?.protocols;
        if (!Array.isArray(protocols) || !protocols.length || JSON.stringify(protocols).length > 20000) {
          throw new HttpsError("invalid-argument", "context.protocols required");
        }
        const response = await client.messages.create({
          model: MODEL,
          max_tokens: 1500,
          thinking: { type: "adaptive" },
          output_config: { effort: "medium", format: { type: "json_schema", schema: COACH_SCHEMA } },
          system: [
            { type: "text", text: COACH_SYSTEM },
            { type: "text", text: "PROTOCOL SET:\n" + JSON.stringify(protocols, null, 1), cache_control: { type: "ephemeral" } },
          ],
          messages: [{
            role: "user",
            content:
              `TODAY: ${context?.date || "?"} (${context?.weekday || "?"}), planned session: ${context?.plannedSession || "?"}.\n` +
              `MACRO TARGETS: 2100 kcal / 160P / 65F / 210C. Today so far: ${JSON.stringify(context?.todayMacros || {})}.\n` +
              `MEAL OPTIONS (for macro_fill): ${JSON.stringify(context?.mealOptions || [])}\n` +
              `RECENT WORKOUTS (compact): ${JSON.stringify(context?.recentWorkouts || [])}\n` +
              (context?.bodyMetrics ? `WAIST LOG: ${JSON.stringify(context.bodyMetrics)}\n` : "") +
              `\nSITUATION:\n${situation}`,
          }],
        });
        return extractJson(response);
      }

      throw new HttpsError("invalid-argument", `unknown op: ${op}`);
    } catch (err) {
      if (err instanceof HttpsError) throw err;
      if (err instanceof Anthropic.APIError) {
        throw new HttpsError("unavailable", `coach model error (${err.status}): ${err.type || "api_error"}`);
      }
      throw new HttpsError("internal", "coach failed");
    }
  },
);

function extractJson(response) {
  const block = (response.content || []).find(b => b.type === "text");
  if (!block) throw new HttpsError("internal", "empty model response");
  try {
    return JSON.parse(block.text);
  } catch {
    throw new HttpsError("internal", "model returned non-JSON");
  }
}
