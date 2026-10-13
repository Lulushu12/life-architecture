// @vitest-environment node
// Plan item 16: how often the coach has nothing better than "best was X",
// measured on 25 bot games at 800-1200 reviewed by the app itself
// (test/fixtures/coach-corpus.json.gz, 652 inaccuracies or worse).
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { explainReviewMove } from "../../src/core/coach/index.js";

const corpus = JSON.parse(gunzipSync(readFileSync(new URL("../fixtures/coach-corpus.json.gz", import.meta.url))).toString());
const BAD = new Set(["inaccuracy", "mistake", "blunder", "miss"]);

const cache = {};
function coverage(pvsKey) {
  return (cache[pvsKey] ||= measure(pvsKey));
}

function measure(pvsKey) {
  let total = 0;
  let generic = 0;
  const types = {};
  for (const g of corpus) {
    const review = { moves: g.moves, evals: g.evals, pvs: g[pvsKey] };
    g.moves.forEach((m, i) => {
      if (!BAD.has(m.class)) return;
      total++;
      const top = explainReviewMove(review, i).facts[0]?.type || "none";
      types[top] = (types[top] || 0) + 1;
      if (top.startsWith("generic_")) generic++;
    });
  }
  return { total, generic, share: generic / total, types };
}

describe("coach coverage on the corpus (plan item 16)", () => {
  it("has 652 bad moves to explain", () => {
    expect(coverage("pvs6").total).toBe(652);
  });

  it("explains at least 85% of them in reviews made from now on (12-ply lines)", () => {
    const c = coverage("pvs12");
    console.log(`new reviews: ${(c.share * 100).toFixed(1)}% only "best was X"`, c.types);
    expect(c.share).toBeLessThanOrEqual(0.15);
  });

  it("explains at least 80% in reviews saved before (6-ply lines)", () => {
    const c = coverage("pvs6");
    console.log(`saved reviews: ${(c.share * 100).toFixed(1)}% only "best was X"`);
    expect(c.share).toBeLessThanOrEqual(0.2);
  });
});
