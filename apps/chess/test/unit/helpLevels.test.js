import { describe, it, expect } from "vitest";
import { HELP_PRESETS, presetFlags, presetOf, presetName, helpOf, isSerious } from "../../src/helpLevels.js";

describe("help levels", () => {
  it("has three presets, from none to full", () => {
    expect(HELP_PRESETS.map((p) => p.name)).toEqual(["On my own", "Some help", "Full help"]);
    expect(presetFlags("own")).toEqual({ evalBar: false, threats: false, suggest: false, coach: false });
    expect(presetFlags("full")).toEqual({ evalBar: true, threats: true, suggest: true, coach: true });
    expect(presetFlags("nope")).toEqual(presetFlags("some"));
  });

  it("names the preset a set of switches matches, or Custom", () => {
    expect(presetOf(presetFlags("some"))).toBe("some");
    expect(presetOf({ ...presetFlags("some"), coach: true })).toBe("custom");
    expect(presetName("custom")).toBe("Custom");
  });

  it("keeps old games behaving as before", () => {
    expect(helpOf({ serious: true })).toEqual(presetFlags("own"));
    expect(helpOf({}, { evalBar: true })).toEqual({ evalBar: true, threats: false, suggest: false, coach: false });
    expect(helpOf({}, { evalBar: false }).evalBar).toBe(false);
    expect(helpOf({ help: { evalBar: true, threats: true } })).toEqual({ evalBar: true, threats: true, suggest: false, coach: false });
  });

  it("treats On my own as the old serious mode", () => {
    expect(isSerious(presetFlags("own"))).toBe(true);
    expect(isSerious(presetFlags("some"))).toBe(false);
  });
});
