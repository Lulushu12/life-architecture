// How much help a bot game gives. A preset is a bundle of switches; any
// switch can be changed mid-game, which makes the game's level "Custom".

export const HELP_SWITCHES = ["evalBar", "threats", "suggest", "coach"];

export const HELP_PRESETS = [
  { id: "own", name: "On my own", blurb: "No eval bar, no arrows, no coach", flags: { evalBar: false, threats: false, suggest: false, coach: false } },
  { id: "some", name: "Some help", blurb: "Eval bar and threat arrows", flags: { evalBar: true, threats: true, suggest: false, coach: false } },
  { id: "full", name: "Full help", blurb: "Adds the best-move arrow and the coach", flags: { evalBar: true, threats: true, suggest: true, coach: true } },
];
export const DEFAULT_PRESET = "some";

export const SWITCH_LABELS = {
  evalBar: "Eval bar",
  threats: "Threat arrows",
  suggest: "Best-move arrow",
  coach: "Coach",
};

export function presetFlags(id) {
  return { ...(HELP_PRESETS.find((p) => p.id === id) || HELP_PRESETS.find((p) => p.id === DEFAULT_PRESET)).flags };
}

/** The preset these switches match, or "custom". */
export function presetOf(flags) {
  const hit = HELP_PRESETS.find((p) => HELP_SWITCHES.every((k) => !!flags?.[k] === p.flags[k]));
  return hit ? hit.id : "custom";
}

export function presetName(id) {
  return HELP_PRESETS.find((p) => p.id === id)?.name || "Custom";
}

/**
 * The help a game runs with. Games started before help levels existed keep
 * behaving as they did: serious games had no eval bar, casual ones followed
 * the eval-bar setting, and neither had arrows or a coach.
 */
export function helpOf(game, settings = {}) {
  if (game?.help) return { ...presetFlags("own"), ...game.help };
  if (game?.serious) return presetFlags("own");
  return { evalBar: settings.evalBar !== false, threats: false, suggest: false, coach: false };
}

/** "On my own" plays like the old serious mode: no eval talk from the bot either. */
export const isSerious = (flags) => presetOf(flags) === "own";
