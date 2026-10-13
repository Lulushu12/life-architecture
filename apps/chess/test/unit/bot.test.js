import { describe, it, expect, vi, afterEach } from "vitest";
import { Chess } from "chess.js";
import { chooseBotMove, botMoveTime } from "../../src/bot.js";
import { FakeEngine, line, seqRandom } from "../fixtures/fakeEngine.js";

const START = new Chess().fen();
const calm = { aggression: 0, chattiness: 0.5 };

afterEach(() => vi.restoreAllMocks());

describe("bot strength bands (characterization)", () => {
  it("plays full strength at 3000+", async () => {
    const engine = new FakeEngine(() => ({ lines: [line("e2e4", 30)] }));
    expect(await chooseBotMove(engine, START, { elo: 3200, style: calm })).toBe("e2e4");
    expect(engine.calls[0]).toMatchObject({ movetime: 900 });
    expect(engine.calls[0].elo).toBeUndefined();
  });

  it("uses Stockfish's UCI_Elo from 1320 to 2999", async () => {
    const engine = new FakeEngine(() => ({ lines: [line("d2d4", 20)] }));
    expect(await chooseBotMove(engine, START, { elo: 1500, style: calm })).toBe("d2d4");
    expect(engine.calls[0]).toMatchObject({ movetime: 300, elo: 1500 });
  });

  it("starves the search below 1320 and asks for 8 lines", async () => {
    vi.spyOn(Math, "random").mockImplementation(seqRandom([0.99, 0]));
    const engine = new FakeEngine(() => ({ lines: [line("e2e4", 30), line("d2d4", 25)] }));
    await chooseBotMove(engine, START, { elo: 800, style: calm });
    expect(engine.calls[0]).toMatchObject({ nodes: 600, multipv: 8 });
  });

  it("sometimes plays a move outside the engine's top three (the blunder roll)", async () => {
    // first random < blunder chance (14% at 800), second picks the first outside move
    vi.spyOn(Math, "random").mockImplementation(seqRandom([0.01, 0]));
    const top = ["e2e4", "d2d4", "g1f3"];
    const engine = new FakeEngine(() => ({ lines: top.map((m, i) => line(m, 30 - i)) }));
    const move = await chooseBotMove(engine, START, { elo: 800, style: calm });
    expect(top).not.toContain(move);
    const legal = new Chess(START).moves({ verbose: true }).map((m) => m.from + m.to);
    expect(legal).toContain(move);
  });

  it("otherwise samples the engine's lines, favouring the best", async () => {
    vi.spyOn(Math, "random").mockImplementation(seqRandom([0.99, 0]));
    const engine = new FakeEngine(() => ({ lines: [line("e2e4", 30), line("a2a3", -200)] }));
    expect(await chooseBotMove(engine, START, { elo: 1200, style: calm })).toBe("e2e4");
  });

  it("move times step down with strength", () => {
    expect([3100, 2500, 1500, 900].map(botMoveTime)).toEqual([900, 500, 300, 180]);
  });
});
