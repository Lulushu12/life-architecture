import { describe, it, expect } from "vitest";
import { ACCENTS, DEFAULT_ACCENT, appearanceVars, contrast, fontFamilyOf, customFamily } from "../../src/appearance.js";
import { fontFileProblem, fontNameFromFile, MAX_FONT_BYTES } from "../../src/fontStore.js";

const BG = "#141310";
const SURFACE = "#201e1a";

describe("app colours", () => {
  it("offers Teal (default), Plum, Copper and Brass, and never chess.com's green", () => {
    expect(ACCENTS.map((a) => a.name)).toEqual(["Teal", "Plum", "Copper", "Brass"]);
    expect(DEFAULT_ACCENT).toBe("teal");
    expect(ACCENTS.map((a) => a.hex.toLowerCase())).not.toContain("#81b64c");
  });

  it("every accent passes WCAG AA as text on the page and card, and with its own button text", () => {
    for (const a of ACCENTS) {
      expect(contrast(a.hex, BG)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(a.hex, SURFACE)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(a.ink, a.hex)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("produces the CSS variables for the chosen look, falling back to the defaults", () => {
    expect(appearanceVars({ accent: "plum" })["--accent"]).toBe("#a58be0");
    expect(appearanceVars({})["--accent"]).toBe("#3fb3a4");
    expect(appearanceVars({ accent: "nope" })["--accent-tint"]).toBe("rgba(63, 179, 164, 0.16)");
    expect(appearanceVars({})["--display"]).toMatch(/^"Sora"/);
  });
});

describe("display fonts", () => {
  it("resolves built-in, custom and missing fonts", () => {
    expect(fontFamilyOf("system")).toMatch(/^system-ui/);
    expect(fontFamilyOf("custom:abc", [{ id: "abc", name: "Mine" }])).toMatch(`"${customFamily("abc")}"`);
    // a backup restored on a device without that font falls back to Sora
    expect(fontFamilyOf("custom:gone", [])).toMatch(/^"Sora"/);
  });

  it("accepts only font files up to 2 MB", () => {
    expect(fontFileProblem({ name: "a.woff2", size: 1000 })).toBeNull();
    expect(fontFileProblem({ name: "a.TTF", size: 1000 })).toBeNull();
    expect(fontFileProblem({ name: "a.png", size: 1000 })).toMatch(/woff2/);
    expect(fontFileProblem({ name: "a.otf", size: MAX_FONT_BYTES + 1 })).toMatch(/2 MB/);
    expect(fontFileProblem(null)).toMatch(/No file/);
  });

  it("names a font from its file name", () => {
    expect(fontNameFromFile("Sora-ExtraBold.woff2")).toBe("Sora ExtraBold");
    expect(fontNameFromFile("my_font__v2.ttf")).toBe("my font v2");
  });
});
