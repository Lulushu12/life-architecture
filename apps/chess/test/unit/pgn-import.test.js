import { describe, it, expect, vi, afterEach } from "vitest";
import { gamePgn, gamesPgn, finalFen, gamePlayers } from "../../src/pgn.js";
import { parseImported, fetchRecentGames, toArchiveGame, ImportError } from "../../src/importers.js";
import { personasByLang } from "../../src/personas.js";

afterEach(() => vi.unstubAllGlobals());

describe("PGN export", () => {
  it("writes the tags and numbered movetext for a bot game", () => {
    const bot = personasByLang("en")[0];
    const pgn = gamePgn({
      id: "g1",
      mode: "bot",
      personaId: bot.id,
      playerColor: "w",
      date: new Date(2026, 0, 2).getTime(),
      sans: ["e4", "e5", "Nf3"],
      result: "1-0",
      reason: "resignation",
      review: { opening: { eco: "C40", name: "King's Knight Opening" }, accuracy: { w: 90, b: 70 } },
    });
    expect(pgn).toContain('[White "You"]');
    expect(pgn).toContain(`[Black "${bot.name}"]`);
    expect(pgn).toContain(`[BlackElo "${bot.elo}"]`);
    expect(pgn).toContain('[Date "2026.01.02"]');
    expect(pgn).toContain('[ECO "C40"]');
    expect(pgn).toContain('[Accuracy "White 90, Black 70"]');
    expect(pgn).toContain('[Termination "resignation"]');
    expect(pgn.trim().endsWith("1. e4 e5 2. Nf3 1-0")).toBe(true);
  });

  it("starts black-to-move games from a FEN with the move number and dots", () => {
    const fen = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";
    const pgn = gamePgn({ id: "x", mode: "analysis", startFen: fen, sans: ["e5", "Nf3"] });
    expect(pgn).toContain('[SetUp "1"]');
    expect(pgn).toContain(`[FEN "${fen}"]`);
    expect(pgn).toContain("1... e5 2. Nf3 *");
    expect(gamePlayers({ mode: "analysis" }).w.name).toBe("Analysis");
  });

  it("joins several games and finds the final position", () => {
    expect(gamesPgn([{ sans: ["e4"] }, { sans: ["d4"] }]).split("[Event").length).toBe(3);
    expect(finalFen({ sans: ["e4", "e5"] })).toMatch(/^rnbqkbnr\/pppp1ppp\/8\/4p3\/4P3/);
  });
});

const SAMPLE_PGN = `[Event "Rated blitz game"]
[Site "https://lichess.org/abcd1234"]
[White "Me"]
[Black "Them"]
[WhiteElo "950"]
[BlackElo "?"]
[Result "0-1"]

1. f3 e5 2. g4 Qh4# 0-1`;

describe("PGN import", () => {
  it("parses headers, finds the user's colour and keeps the moves", () => {
    const g = parseImported(SAMPLE_PGN, { source: "lichess", sourceId: "lichess:abcd1234", user: "me" });
    expect(g).toMatchObject({
      white: "Me",
      black: "Them",
      whiteElo: "950",
      blackElo: null,
      result: "0-1",
      playerColor: "w",
      sans: ["f3", "e5", "g4", "Qh4#"],
      url: "https://lichess.org/abcd1234",
    });
    const archived = toArchiveGame(g, "id1", 5);
    expect(archived).toMatchObject({ id: "id1", mode: "import", label: "Me vs Them", playerColor: "w", review: null });
  });

  it("rejects games that are too short, unparseable, or a variant", () => {
    expect(parseImported("1. e4 *", { user: "x" })).toBeNull();
    expect(parseImported("not a pgn ((", { user: "x" })).toBeNull();
    expect(parseImported(`[Variant "Atomic"]\n\n1. e4 e5 *`, { user: "x" })).toBeNull();
  });
});

function jsonResponse(body, status = 200) {
  return { ok: status < 400, status, json: async () => body, text: async () => JSON.stringify(body) };
}

describe("import by username", () => {
  it("rejects invalid usernames before any request", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(fetchRecentGames("lichess", "a b!")).rejects.toBeInstanceOf(ImportError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reads Lichess NDJSON and skips variants and junk lines", async () => {
    const lines = [
      JSON.stringify({ id: "g1", pgn: SAMPLE_PGN, variant: "standard", lastMoveAt: 2 }),
      "garbage",
      JSON.stringify({ id: "g2", pgn: SAMPLE_PGN, variant: "chess960" }),
    ].join("\n");
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, status: 200, text: async () => lines })));
    const games = await fetchRecentGames("lichess", "Me");
    expect(games.map((g) => g.sourceId)).toEqual(["lichess:g1"]);
  });

  it("explains a missing player", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({}, 404)));
    await expect(fetchRecentGames("chesscom", "nobody")).rejects.toThrow(/No Chess.com player named "nobody"/);
  });

  // Audit bug 7: only the last two monthly archives are read, so a player who
  // paused for two months imports nothing even though older games exist.
  it.fails("finds games older than the last two months", async () => {
    const archives = ["m1", "m2", "m3"].map((m) => `https://api.chess.com/pub/player/me/games/${m}`);
    const old = { pgn: SAMPLE_PGN, uuid: "u1", end_time: 1, rules: "chess" };
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url) => {
        if (url.endsWith("/archives")) return jsonResponse({ archives });
        if (url.endsWith("m1")) return jsonResponse({ games: [old] });
        return jsonResponse({ games: [] });
      })
    );
    const games = await fetchRecentGames("chesscom", "me");
    expect(games.length).toBe(1);
  });
});
