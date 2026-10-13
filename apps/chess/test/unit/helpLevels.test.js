import { describe, it, expect } from "vitest";
import { HELP_PRESETS, presetFlags, presetOf, presetName, helpOf, isSerious } from "../../src/helpLevels.js";

describe("help levels", () => {
  it("has three presets, from none to full", () => {
    expect(HELP_PRESETS.map((p) => p.name)).toEqual(["On my own", "Some help", "Full help"]);
    expect(presetFlags("own")).toEqual({ evalBar: false, threats: false, check: false, suggest: false, coach: false });
    expect(presetFlags("full")).toEqual({ evalBar: true, threats: true, check: true, suggest: true, coach: true });
    expect(presetFlags("some")).toEqual({ evalBar: true, threats: true, check: true, suggest: false, coach: false });
    expect(presetFlags("nope")).toEqual(presetFlags("some"));
  });

  it("names the preset a set of switches matches, or Custom", () => {
    expect(presetOf(presetFlags("some"))).toBe("some");
    expect(presetOf({ ...presetFlags("some"), coach: true })).toBe("custom");
    expect(presetName("custom")).toBe("Custom");
  });

  it("keeps old games behaving as before", () => {
    expect(helpOf({ serious: true })).toEqual(presetFlags("own"));
    expect(helpOf({}, { evalBar: true })).toEqual({ evalBar: true, threats: false, check: false, suggest: false, coach: false });
    expect(helpOf({}, { evalBar: false }).evalBar).toBe(false);
    expect(helpOf({ help: { evalBar: true, threats: true } })).toEqual({ evalBar: true, threats: true, check: true, suggest: false, coach: false });
  });

  it("gives games started before the blunder check the check their level now has", () => {
    // started on Some help and Full help: keep the level's name, gain the check
    expect(presetOf(helpOf({ help: { evalBar: true, threats: true, suggest: false, coach: false } }))).toBe("some");
    expect(presetOf(helpOf({ help: { evalBar: true, threats: true, suggest: true, coach: true } }))).toBe("full");
    // On my own and custom levels don't gain it
    expect(helpOf({ help: presetFlags("own") }).check).toBe(false);
    expect(helpOf({ help: { evalBar: true, threats: false, suggest: false, coach: true } }).check).toBe(false);
    // a choice made since is kept
    expect(helpOf({ help: { ...presetFlags("some"), check: false } }).check).toBe(false);
  });

  it("treats On my own as the old serious mode", () => {
    expect(isSerious(presetFlags("own"))).toBe(true);
    expect(isSerious(presetFlags("some"))).toBe(false);
  });
});
