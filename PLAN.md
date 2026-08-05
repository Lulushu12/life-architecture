# Life Architecture v3 — Rebuild Plan

> Build brief for the agent. Self-contained: the v2 operating-system doc
> (`sovereign_health_operating_system_v2`, in the owner's Google Drive) is the
> health source of truth; this file is the architectural source of truth.

## Build pipeline

- **Fable (`claude-fable-5`)** builds the app — one-time, high-leverage. It pays
  its premium once, not on the runtime hot path.
- **Sonnet (`claude-sonnet-4-6`)** is the *runtime* coach the shipped app calls.
  An order of magnitude cheaper ($3/$15 vs $10/$50) and more than enough for
  parse-and-match work.

Net: **Fable builds → the app it ships calls Sonnet at runtime.** Fable never
touches the per-request path.

---

## Context — why this is a rebuild, not a feature add

Two sources currently disagree:

- **The live app** (`src/App.jsx`, "v8"): swim-daily, Gym A/B, "wife", a 4-category
  XP quest board. Entirely **static** — `SCHEDULE` and `DEFAULT_*` are hardcoded
  constants; the Workouts tab is read-only text. No set/rep/weight logging, no
  meal/macro logging.
- **The v2 doc** ("v2.0, May 2026"): a *different, newer* system — PPL rotation at
  Titan Park, no swimming, "Despina", creatine, hard macro targets
  (2,100 kcal / 160P / 65F / 210C), progressive-overload gates, compliance
  protocols, gym network, waist tracking.

"Rebuild to make it more feasible" = **(1)** reconcile the app onto the v2 doc, and
**(2)** turn static content into a living tracker.

## Decisions (locked)

1. **Merge** — keep the XP/levels/streaks engine, the 4 life categories
   (Health & Fitness, Medicine, Trading, Hobbies), quest board, Identity/
   Principles/Review tabs, Firebase sync, and PWA. **Swap only the Health &
   Fitness content** onto the v2 doc.
2. **Full coach layer** — build the deterministic tracker *and* the Sonnet coach
   (Phases 0–3).

---

## Target architecture

Keep the stack (React 18 + Vite + Firebase Auth/Firestore + PWA, `gh-pages`
deploy). Break the `App.jsx` monolith into:

- **`src/system/`** — the v2 operating system as **structured data**, not prose:
  PPL rotation, exercise protocols (with starting weights), meal options, macro
  targets, gym network, non-negotiables, and `protocols.js` (compliance rules).
  This replaces the hardcoded `SCHEDULE` / `DEFAULT_*` constants.
- **`src/data/`** — Firestore models for the living data (below).
- **`src/coach/`** — the Sonnet integration (client wrapper for the callable fn).
- **`src/views/`** — per-tab components split out of `App.jsx`.
- **`functions/`** — Firebase Cloud Function `coach` holding the Anthropic key.

### Where the coach runs

Client-side PWA can't hold an API key. The coach runs behind a **callable Cloud
Function**:

```
React PWA ──callable──▶ functions/coach ──▶ Sonnet (claude-sonnet-4-6)
   │                       (key here)
   └── writes confirmed logs to Firestore directly
```

The coach **never writes Firestore itself** — it returns a structured proposal,
the UI renders a confirm card, the client writes. Hard-to-reverse actions stay
gated behind a tap.

---

## Data model (the new, living part)

```
workoutLog:   { date, session: "Push|Pull|Legs", gym, exercises: [
                  { name, sets: [{ reps, weightKg, clean, painFree }] } ],
                cardioMin, notes, missed: bool, slidPPL: bool }

liftProgress: { exercise, currentWeightKg, cleanSessionsInARow,
                lastAdvanced, history: [...] }   // drives the overload gate

mealLog:      { date, slot: "breakfast|preworkout|recovery|dinner|snack",
                option, kcal, protein, fat, carbs }

bodyMetrics:  { date, waistCm, weightKg }        // waist every 2nd Sunday
```

**Progressive-overload gate** (centerpiece, pure code — no AI): advance a lift by
the smallest increment **only** when 3×10 is clean and pain-free across **two
consecutive sessions**; hard-stop on shoulder discomfort (drop to previous weight,
never advance). Deterministic state machine driven by `liftProgress`; computes
`advance / hold / drop-back` after each logged session.

---

## The merge connection (what makes this worth doing)

The living tracker becomes the **evidence source** for XP — logging the actual
sets *is* the quest completion. No duplicate bookkeeping.

| Logged action | Auto-completes / awards |
|---|---|
| Clean PPL session logged | "Gym session done" daily quest + XP |
| Macros hit for the day | "Hit protein target" / "Within caloric budget" quests |
| Creatine + VMO toggled | Non-negotiable streak (breaks per compliance protocol) |
| Overload gate advances a lift | One-off progression XP bonus |

---

## Phases

| Phase | Deliverable |
|---|---|
| **0** | **Migration.** Encode v2 doc into `src/system/`. Rewrite Health & Fitness `DEFAULT_DAILY` quests to the non-negotiables. Delete old `SCHEDULE`. Firestore migration so existing `longQ`/`dailyQ`/XP survive. |
| **1** | Workout logging UI + `liftProgress` overload-gate engine (pure functions, deterministic). |
| **2** | Meal logging + macro running-total + waist log. |
| **3** | Sonnet coach (natural-language logging, compliance reasoning, deload detection, macro gap-fill, waist triggers). |
| **4** | Polish: PWA offline, Firestore migration verified, XP/gamification layer kept and wired to the tracker. |

Phases 0–2 are deterministic and never touch the API. Phase 3 is the coach.

---

## Phase 3 — coach spec (runtime = Sonnet)

### Model config

```js
const COACH = {
  model: "claude-sonnet-4-6",
  thinking: { type: "adaptive" },
  output_config: { effort: "medium" }, // parseLog: "low"
  max_tokens: 4000,
};
```

- `effort` **defaults to `high` on Sonnet 4.6** — set it explicitly or pay for it.
- No `max` effort on Sonnet (`low`/`medium`/`high` only — fine here).
- No `temperature`/`top_p`/`budget_tokens`; no assistant prefills (all 400 on 4.6).
- Structured outputs + adaptive thinking supported.

### Two entry points

**A. `parseLog`** — natural language → structured log. Pure structured output, no
tools, `effort:"low"`. Discriminated by `kind: workout|meal|metric|unclear`. A
workout parse captures per-set `{reps, weightKg, clean, painFree}` and emits
`flags` — notably `shoulder_hardstop` caught **at parse time**, before the overload
engine. `confidence < 0.7` or `kind:"unclear"` → client confirms instead of writing.

**B. `coach`** — context-injected reasoning brain. Input: the structured protocol
set + today's schedule slot + recent logs + the situation. Output discriminated by
`type: directive|deload_signal|macro_fill|review_trigger|none`, always carrying the
`protocol_id` it derived from (audit trail).

### Compliance reasoning structure

Encode the doc's "if-X-then-Y" rules as **structured data** in
`src/system/protocols.js` — inject them; Fable/Sonnet matches + adapts + **cites**,
never recites from memory. Example entries:

```js
{ id: "miss_gym",
  trigger: "A scheduled training session was missed.",
  action: "Go the next day. Do not double up. Slide PPL forward one day. " +
          "Two consecutive misses → the third day is mandatory (full session or 10-min bike).",
  routing: null },

{ id: "wednesday_collapse",
  trigger: "Wednesday Titan Park leg slot is at risk (left Pallady late / emergency).",
  action: "Recovery routing depends on time.",
  routing: [
    { if: "left Pallady after 13:20 but before 14:00", then: "Skip Titan Park; drive toward Sun Plaza; 30-min capped session at Sudului." },
    { if: "genuine emergency past 14:00",              then: "Force-skip. Do not train after 20:00. Mark it. Slide PPL." } ] }
```

Cover every protocol in the doc: `skip_meal`, `miss_gym`, `sleep_drift`,
`untracked_food`, `skip_vmo`, `wednesday_collapse`, `surprise_consult`, `call_day`,
`deload_suspicion`.

### Scheduled evaluations (not chat)

Same `coach` machinery, fired by a scheduled function with a fixed instruction:

- **Deload** (nightly): inject last ~10 sessions + sleep/mood → return
  `deload_signal` **only** when 2+ of {weights regressing 2 sessions, soreness
  >48h, sleep dropping, motivation gone 3–4 days} co-occur. Per the doc, it
  **flags for discussion, never self-prescribes.**
- **Waist review** (every 2nd Sunday): last 2 measurements → 4 weeks flat →
  suggest −25–38g carbs from Meal 3; performance degrading → suggest a planned snack.

### System prompt (action-only, doc-faithful)

The doc's voice — *"No motivation. No pep talks. Just the recovery action."* —
drives the prompt:

```
You are the coach for a Sovereign Health Operating System. You enforce a fixed
system; you do not motivate, encourage, or soften.

OUTPUT RULES
- Action only. No preamble, no validation, no emoji.
- Every directive must cite the protocol_id it derives from. If no protocol in
  the provided set matches, return type:"none" — never invent advice.
- For minor judgment calls, decide and state the action. Do not ask.
- Deload is NEVER self-prescribed: flag for discussion only, on 2+ co-occurring signals.
- Shoulder discomfort on any pressing/lateral work is a hard stop: drop to the
  previous weight, never advance.

You are given: the protocol set, today's schedule slot, and recent logs. Ground
every response in those — not in general fitness knowledge.
```

### Cost & caching

Static system rules + protocol set go first with a `cache_control` breakpoint;
only the live situation varies. Daily logging + a nightly check lands at fractions
of a cent on Sonnet.

---

## Build-agent rubric (for Fable)

Iterate to "done" against:

- Workout logging persists to Firestore.
- Overload gate matches the doc's 2-session clean-and-pain-free rule (verify across
  a 2-session test); shoulder hard-stop blocks advancement.
- Macro totals compute correctly against the 2,100 / 160 / 65 / 210 target.
- Health & Fitness quests auto-complete from logs (no manual double-entry).
- Schedule reflects v2 (PPL / Titan Park / Despina), not v8 (swim / Gym A-B).
- Existing `longQ`/`dailyQ`/XP data survives the migration.
- `coach` Cloud Function deploys and returns schema-valid structured output for
  both `parseLog` and `coach`.

## Non-goals (this build)

- No new auth/hosting; reuse Firebase + `gh-pages`.
- Coach does not write Firestore directly (propose → confirm → client writes).
- No `max` effort, no Fable on the runtime path.
