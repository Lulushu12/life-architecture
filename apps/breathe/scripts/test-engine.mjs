import assert from "node:assert/strict";
import { GETREADY_MS, activeMsAt, advanceBreathing, breathAt, breathingMs, pauseAt, resumeAt } from "../src/engine.js";
import { cyclesFor, patternById } from "../src/patterns.js";

let failed = 0;
function test(name, fn) {
  try {
    fn();
    console.log(`ok  ${name}`);
  } catch (err) {
    failed++;
    console.log(`FAIL ${name}\n  ${err.message}`);
  }
}

const whm = {
  type: "breathing",
  pattern: "whm",
  plannedRounds: 2,
  breathsPerRound: 30,
  secondsPerBreath: 3.5,
  recoverySeconds: 15,
  rounds: [],
};
const paced = (id, amount) => {
  const p = patternById(id);
  return {
    type: "breathing",
    pattern: id,
    plannedRounds: 1,
    phases: p.phases,
    cycles: cyclesFor(p, amount),
    rounds: [],
  };
};
const start = (t = 0) => ({
  id: "x",
  mode: "breathing",
  phase: "getready",
  round: 0,
  phaseStartedAt: t,
  pausedAt: null,
  pausedMs: 0,
  bellsRung: 0,
  startedAt: t,
});

test("whm breathing turns into retention after all breaths", () => {
  const end = GETREADY_MS + 30 * 3500;
  const r = advanceBreathing(start(), whm, end + 10);
  assert.equal(r.active.phase, "retention");
  assert.equal(r.active.phaseStartedAt, end);
  assert.equal(r.finished, false);
});

test("whm breath circle is symmetric in and out", () => {
  const b = breathAt(whm, 1750 / 2);
  assert.equal(b.kind, "in");
  assert.ok(Math.abs(b.level - 0.5) < 1e-9);
  assert.equal(breathAt(whm, 1750).kind, "out");
  assert.equal(breathAt(whm, 3500 * 4 + 100).index, 4);
});

test("box pattern finishes after its cycles with no retention", () => {
  const e = paced("box", 4);
  assert.equal(e.cycles, 15);
  const r = advanceBreathing(start(), e, GETREADY_MS + breathingMs(e) + 1);
  assert.equal(r.finished, true);
  assert.equal(r.endAt, GETREADY_MS + 15 * 16000);
  assert.ok(!r.events.some((ev) => ev.type === "retention"));
});

test("4-7-8 phases land on hold then out", () => {
  const e = paced("478", 4);
  assert.equal(breathAt(e, 5000).kind, "holdIn");
  assert.equal(breathAt(e, 5000).level, 1);
  assert.equal(breathAt(e, 12000).kind, "out");
  assert.equal(breathAt(e, 19500).index, 1);
});

test("physiological sigh double inhale keeps rising", () => {
  const e = paced("sigh", 3);
  const first = breathAt(e, 1999);
  const second = breathAt(e, 2500);
  assert.equal(first.seg, 0);
  assert.equal(second.seg, 1);
  assert.equal(second.kind, "in");
  assert.ok(second.level > first.level);
  assert.equal(e.cycles, 3);
});

test("coherent minutes round to whole cycles", () => {
  assert.equal(paced("coherent", 5).cycles, 27);
});

test("active time excludes pauses", () => {
  let a = { ...start(0), phase: "breathing" };
  a = pauseAt(a, 10000);
  assert.equal(activeMsAt(a, 50000), 10000);
  a = resumeAt(a, 40000);
  assert.equal(activeMsAt(a, 45000), 15000);
});

if (failed) {
  console.log(`${failed} failed`);
  process.exit(1);
}
console.log("all passed");
