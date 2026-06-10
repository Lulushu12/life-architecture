/**
 * Default quests. Health & Fitness daily quests are rewritten onto the v2
 * non-negotiables; other categories carry over from v8 unchanged.
 *
 * AUTO quests are completed by the tracker (workout/meal logs), not by hand:
 *   hf_gym     ← a workout log for today (full session or 10-min show-up minimum)
 *   hf_protein ← today's logged protein ≥ target
 *   hf_kcal    ← today's logged kcal within budget window
 */

export const AUTO_QUEST_IDS = ["hf_gym", "hf_protein", "hf_kcal"];

export const DEFAULT_DAILY_V2 = [
  // Health & Fitness — the v2 non-negotiables + tracker-driven quests
  { id: "hf_creatine", title: "Creatine 5g (after brushing teeth)",  category: "Health & Fitness", baseXp: 25,  streak: 0, lastDone: "" },
  { id: "hf_vmo",      title: "VMO exercises done",                  category: "Health & Fitness", baseXp: 50,  streak: 0, lastDone: "", note: "Every day incl. Sunday" },
  { id: "hf_gym",      title: "Training session done",               category: "Health & Fitness", baseXp: 75,  streak: 0, lastDone: "", note: "AUTO — completes from workout log", auto: true },
  { id: "hf_protein",  title: "Hit protein target (160g)",           category: "Health & Fitness", baseXp: 50,  streak: 0, lastDone: "", note: "AUTO — from meal log", auto: true },
  { id: "hf_kcal",     title: "Within caloric budget (2,100)",       category: "Health & Fitness", baseXp: 75,  streak: 0, lastDone: "", note: "AUTO — from meal log", auto: true },
  { id: "hf_despina",  title: "Despina time held (19:30–21:00)",     category: "Health & Fitness", baseXp: 75,  streak: 0, lastDone: "", note: "Phone down, no screens" },
  { id: "hf_phone",    title: "Phone docked at 21:00",               category: "Health & Fitness", baseXp: 25,  streak: 0, lastDone: "" },
  { id: "hf_mobility", title: "Bedtime mobility done (21:45)",       category: "Health & Fitness", baseXp: 50,  streak: 0, lastDone: "" },
  { id: "hf_lights",   title: "Lights out by 22:30",                 category: "Health & Fitness", baseXp: 50,  streak: 0, lastDone: "" },
  // Medicine & Surgery — carried over
  { id: "d8",  title: "Read one medical article",          category: "Medicine & Surgery",   baseXp: 50,  streak: 0, lastDone: "" },
  { id: "d9",  title: "10 min of CME content completed",   category: "Medicine & Surgery",   baseXp: 50,  streak: 0, lastDone: "" },
  { id: "d10", title: "Surgical case documented",          category: "Medicine & Surgery",   baseXp: 75,  streak: 0, lastDone: "", note: "OR days" },
  { id: "d11", title: "Pre-op case prep completed",        category: "Medicine & Surgery",   baseXp: 50,  streak: 0, lastDone: "", note: "OR days" },
  { id: "d12", title: "Post-op notes completed same day",  category: "Medicine & Surgery",   baseXp: 75,  streak: 0, lastDone: "", note: "OR days" },
  // Trading — carried over
  { id: "d13", title: "Trading deep work block completed", category: "Trading",              baseXp: 100, streak: 0, lastDone: "" },
  { id: "d14", title: "Trading journal entry written",     category: "Trading",              baseXp: 75,  streak: 0, lastDone: "" },
  { id: "d15", title: "No trades outside system rules",    category: "Trading",              baseXp: 100, streak: 0, lastDone: "" },
  { id: "d16", title: "Read/watched trading content",      category: "Trading",              baseXp: 50,  streak: 0, lastDone: "" },
  { id: "d17", title: "Weekly review completed",           category: "Trading",              baseXp: 150, streak: 0, lastDone: "", note: "Sunday" },
  // Hobbies & Creativity — carried over
  { id: "d18", title: "Learning block done",               category: "Hobbies & Creativity", baseXp: 50,  streak: 0, lastDone: "" },
  { id: "d19", title: "One page of a book read",           category: "Hobbies & Creativity", baseXp: 25,  streak: 0, lastDone: "" },
  { id: "d20", title: "20 min working on NixOS config",    category: "Hobbies & Creativity", baseXp: 50,  streak: 0, lastDone: "" },
  { id: "d21", title: "Fixed one NixOS issue",             category: "Hobbies & Creativity", baseXp: 75,  streak: 0, lastDone: "" },
  { id: "d22", title: "Documented a NixOS solution",       category: "Hobbies & Creativity", baseXp: 50,  streak: 0, lastDone: "" },
];

/** v8 daily-quest id → v2 id. Streaks/lastDone carry across. Unmapped HF ids are retired. */
export const V8_DAILY_MIGRATION = {
  d2: "hf_gym",       // "Gym session done"
  d3: "hf_mobility",  // "Bedtime mobility done"
  d4: "hf_lights",    // "Lights out by 22:30"
  d5: "hf_protein",   // "Hit protein target"
  d6: "hf_kcal",      // "Stayed within caloric budget"
  d7: "hf_vmo",       // "VMO workout done"
  // d1 (swim), d7b (full body home), d7c (core circuit) — retired with v8
};

// Long-term quests carry over untouched (v8 DEFAULT_LONG remains the default
// for new accounts; existing accounts keep their Firestore longQ as-is).
export const DEFAULT_LONG = [
  { id:"l1",  title:"4 consecutive weeks of full PPL compliance (no slides)", category:"Health & Fitness",     xp:1000, status:"Active",  notes:"" },
  { id:"l2",  title:"8 consecutive weeks of training without a missed week", category:"Health & Fitness",     xp:1200, status:"Active",  notes:"" },
  { id:"l3",  title:"Maintain lights out by 22:30 for 30 days",             category:"Health & Fitness",     xp:600,  status:"Active",  notes:"" },
  { id:"l4",  title:"Lose first 5kg",                                        category:"Health & Fitness",     xp:1000, status:"Active",  notes:"Tracked via waist + scale" },
  { id:"l5",  title:"Lose 15kg total by end of summer",                      category:"Health & Fitness",     xp:2000, status:"Active",  notes:"Hard deadline: end of September" },
  { id:"l6",  title:"First overload-gate advance on every Push lift",        category:"Health & Fitness",     xp:800,  status:"Active",  notes:"3×10 clean ×2 sessions, per lift" },
  { id:"l7",  title:"SRATS conference - slides + script finalized",          category:"Medicine & Surgery",   xp:1000, status:"Pending", notes:"" },
  { id:"l8",  title:"Both CAD patents approved",                             category:"Medicine & Surgery",   xp:1200, status:"Active",  notes:"" },
  { id:"l9",  title:"Submit a case report or research paper",               category:"Medicine & Surgery",   xp:1500, status:"Pending", notes:"" },
  { id:"l10", title:"Complete a structured CME course (min. 10 hours)",      category:"Medicine & Surgery",   xp:700,  status:"Pending", notes:"" },
  { id:"l11", title:"Attend one orthopedic conference this year",            category:"Medicine & Surgery",   xp:800,  status:"Pending", notes:"" },
  { id:"l12", title:"Review and document 20 surgical outcomes",              category:"Medicine & Surgery",   xp:1000, status:"Pending", notes:"" },
  { id:"l13", title:"Submit a research abstract internationally",            category:"Medicine & Surgery",   xp:1200, status:"Pending", notes:"" },
  { id:"l14", title:"Complete v1 of documented trading system",              category:"Trading",              xp:1500, status:"Active",  notes:"" },
  { id:"l15", title:"Execute 50 trades fully within documented rules",       category:"Trading",              xp:1000, status:"Active",  notes:"" },
  { id:"l16", title:"Weekly trading review for 8 consecutive weeks",        category:"Trading",              xp:800,  status:"Active",  notes:"" },
  { id:"l17", title:"Complete a structured trading course or book",          category:"Trading",              xp:700,  status:"Pending", notes:"" },
  { id:"l18", title:"Ship first working 3D Slicer module",                  category:"Hobbies & Creativity", xp:900,  status:"Pending", notes:"" },
  { id:"l19", title:"Read 6 books in 6 months",                             category:"Hobbies & Creativity", xp:600,  status:"Pending", notes:"" },
  { id:"l20", title:"NixOS boots cleanly with full config declared",         category:"Hobbies & Creativity", xp:400,  status:"Active",  notes:"Milestone 1/4" },
  { id:"l21", title:"All essential apps installed and working via Nix",     category:"Hobbies & Creativity", xp:500,  status:"Pending", notes:"Milestone 2/4" },
  { id:"l22", title:"Dotfiles fully managed with Home Manager",             category:"Hobbies & Creativity", xp:600,  status:"Pending", notes:"Milestone 3/4" },
  { id:"l23", title:"NixOS configured as daily driver - stable",            category:"Hobbies & Creativity", xp:700,  status:"Pending", notes:"Milestone 4/4" },
];
