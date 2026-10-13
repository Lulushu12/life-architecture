import { describe, it, expect, beforeEach } from "vitest";
import { chessStore, capGames, capStore, validateBackup, GAME_CAP, STORAGE_KEY, DEFAULT_SETTINGS } from "../../src/storage.js";

const game = (id, extra = {}) => ({ id, date: Number(String(id).replace(/\D/g, "")) || 0, sans: ["e4"], ...extra });

beforeEach(() => localStorage.clear());

describe("loading the store", () => {
  it("starts fresh with the default settings", () => {
    const s = chessStore.load();
    expect(s.settings).toEqual(DEFAULT_SETTINGS);
    expect(s.games).toEqual([]);
    expect(s.puzzleRating).toEqual({ r: 1200, n: 0, history: [] });
    expect(s.version).toBe(1);
  });

  it("fills missing settings, drops broken games and bad reviews", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        settings: { theme: "walnut", ai: { model: "m" } },
        games: [game("g1", { review: { moves: "nope" } }), { id: "bad", sans: [1] }, { sans: ["e4"] }],
        current: { sans: "not-an-array" },
      })
    );
    const s = chessStore.load();
    expect(s.settings.theme).toBe("walnut");
    expect(s.settings.pieces).toBe("cburnett");
    expect(s.settings.ai).toEqual({ baseUrl: "", apiKey: "", model: "m" });
    expect(s.games.map((g) => g.id)).toEqual(["g1"]);
    expect(s.games[0].review).toBeNull();
    expect(s.current).toBeNull();
  });

  it("keeps a corrupt copy and recovers when the saved data is unreadable", () => {
    localStorage.setItem(STORAGE_KEY, "{not json");
    const s = chessStore.load();
    expect(s._recovered).toBe(true);
    expect(localStorage.getItem(`${STORAGE_KEY}.corrupt`)).toBe("{not json");
  });

  it("round-trips through save", () => {
    const s = { ...chessStore.load(), games: [game("g7")] };
    expect(chessStore.save(s).ok).toBe(true);
    expect(chessStore.load().games[0].id).toBe("g7");
  });
});

describe("the 50-game cap", () => {
  it("drops reviewed games first, then the oldest, never favourites", () => {
    const games = [];
    for (let i = 1; i <= GAME_CAP + 3; i++) games.push(game(`g${i}`));
    games[0].favourite = true; // oldest, but starred
    games[10].review = { moves: [] }; // reviewed
    const { games: kept, pruned } = capGames(games);
    expect(pruned).toBe(3);
    const ids = new Set(kept.map((g) => g.id));
    expect(ids.has("g1")).toBe(true);
    expect(ids.has("g11")).toBe(false);
    expect(ids.has("g2")).toBe(false);
    expect(ids.has("g3")).toBe(false);
    expect(ids.has("g4")).toBe(true);
  });

  it("protects the current game and the newest one, and counts what it pruned", () => {
    const games = [];
    for (let i = 1; i <= GAME_CAP + 1; i++) games.push(game(`g${i}`));
    const s = capStore({ games, current: { id: "g1" }, capHits: 2 });
    expect(s.games.some((g) => g.id === "g1")).toBe(true);
    expect(s.games.some((g) => g.id === `g${GAME_CAP + 1}`)).toBe(true);
    expect(s.capHits).toBe(3);
  });

  it("leaves a store under the cap untouched", () => {
    const s = { games: [game("g1")] };
    expect(capStore(s)).toBe(s);
  });
});

describe("restoring a backup", () => {
  it("accepts anything with settings and a games array, dropping invalid games", () => {
    const r = validateBackup({ settings: {}, games: [game("g1"), { nope: true }] });
    expect(r.ok).toBe(true);
    expect(r.dropped).toBe(1);
    expect(r.data.games.length).toBe(1);
  });

  it("rejects data without settings or games", () => {
    expect(validateBackup({ games: [] })).toBe(false);
    expect(validateBackup({ settings: {} })).toBe(false);
    expect(validateBackup(null)).toBe(false);
  });
});
