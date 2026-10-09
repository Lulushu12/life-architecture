import { test, expect } from "@playwright/test";
import { seed, open, readStore, move, button } from "./helpers.js";

// Fool's mate, with you as White: two blunders for the review to find.
const FOOLS_MATE = ["f3", "e5", "g4", "Qh4#"];

test.describe("current behaviour", () => {
  test("home lists every section", async ({ page }) => {
    await seed(page, null);
    await open(page);
    for (const name of [
      "Play bots", "Pass & play", "Lessons", "Openings", "Pro games", "Analysis",
      "Engine match", "Custom position", "Import games", "Puzzles", "Game archive", "Stats",
    ]) {
      await expect(button(page, new RegExp(name))).toBeVisible();
    }
  });

  test("a bot game is playable and survives a reload", async ({ page }) => {
    await seed(page, null);
    await open(page);
    await button(page, /Play bots/).click();
    await page.locator(".botmini").first().click(); // an 800 bot, you play White
    await move(page, "e2", "e4");
    // the bot answers: two plies in the move list
    await expect(page.locator(".movelist .mlmove").nth(1)).toBeVisible({ timeout: 60_000 });
    const before = await readStore(page);
    expect(before.current.sans.length).toBeGreaterThanOrEqual(2);
    expect(before.current.sans[0]).toBe("e4");

    await page.reload({ waitUntil: "domcontentloaded" });
    // the app reopens on the game itself, with the moves intact
    await expect(page.locator(".movelist .mlmove").first()).toHaveText("e4");
    await page.locator(".topbar button").first().click();
    await expect(page.getByText(/Resume game/)).toBeVisible();
  });

  test("reviewing a game labels the moves and turns your blunders into puzzles", async ({ page }) => {
    await seed(page, {
      settings: { reviewMovetime: 100 },
      games: [{ id: "g1", date: 1, mode: "bot", personaId: "x", playerColor: "w", sans: FOOLS_MATE, result: "0-1", review: null }],
    });
    await open(page);
    await button(page, /Game archive/).click();
    await page.getByText(/tap to review/).first().click();
    await expect(page.locator(".acc-val").first()).toBeVisible({ timeout: 90_000 });
    const s = await readStore(page);
    const review = s.games[0].review;
    expect(review.moves.map((m) => m.san)).toEqual(FOOLS_MATE);
    expect(review.moves[3].class).not.toBe("blunder"); // the mating move is Black's best
    expect(s.puzzles.length).toBeGreaterThanOrEqual(1);
    expect(s.puzzles.every((p) => p.gameId === "g1" && p.solved === false)).toBe(true);
  });

  test("a blunder puzzle is solved by playing the best move", async ({ page }) => {
    await seed(page, {
      puzzles: [
        {
          id: "p1",
          // White to move; Qxf7# is mate
          fen: "r1bqkbnr/pppp1ppp/2n5/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4",
          bestSan: "Qxf7#",
          bestUci: "h5f7",
          playedSan: "Nf3",
          date: 1,
          solved: false,
        },
      ],
    });
    await open(page);
    await button(page, /Puzzles/).click();
    await page.getByText(/My blunders/).first().click();
    await move(page, "h5", "f7");
    await expect.poll(async () => (await readStore(page)).puzzles[0].solved, { timeout: 30_000 }).toBe(true);
  });

  test("a tier puzzle can be revealed and played through", async ({ page }) => {
    await seed(page, null);
    await open(page);
    await button(page, /Puzzles/).click();
    await page.getByText(/Starter/).first().click();
    await button(page, /^Reveal$/).click();
    await expect(page.getByText(/The move is/)).toBeVisible();
    await button(page, /Play it/).click();
    // revealing counts as a miss for the rating
    await expect.poll(async () => (await readStore(page)).puzzleRating.n).toBeGreaterThanOrEqual(1);
  });

  test("a lesson steps forward and a quiz can be shown", async ({ page }) => {
    await seed(page, null);
    await open(page);
    await button(page, /Lessons/).click();
    await page.getByText(/^Concepts/).first().click();
    await page.getByText(/Forks and Double Attacks/).first().click();
    await button(page, /Next/).click();
    await button(page, /Show me/).click();
    await expect(page.getByText(/The move is Nxc7\+/)).toBeVisible();
    await expect.poll(async () => (await readStore(page)).lessonProgress?.["forks-double-attacks"]?.step).toBe(1);
  });

  test("a pasted PGN is imported and reviewed", async ({ page }) => {
    await seed(page, { settings: { reviewMovetime: 100 } });
    await open(page);
    await button(page, /Import games/).click();
    await page.locator("textarea").first().fill(`[White "A"]\n[Black "B"]\n\n1. e4 e5 2. Nf3 Nc6 *`);
    await button(page, /Import & review/).click();
    await expect(page.locator(".acc-val").first()).toBeVisible({ timeout: 90_000 });
    const s = await readStore(page);
    expect(s.games[0].sans).toEqual(["e4", "e5", "Nf3", "Nc6"]);
  });

  test("analysis accepts a plain PGN", async ({ page }) => {
    await seed(page, null);
    await open(page);
    await button(page, /Analysis/).click();
    await button(page, /Paste FEN\/PGN/).click();
    await page.locator("textarea").first().fill("1. d4 d5 2. c4 *");
    await button(page, /^Load$/).click();
    await expect(page.locator(".movelist .mlmove")).toHaveText(["d4", "d5", "c4"]);
    await expect(page.getByText(/hit an error|Something went wrong/i)).toHaveCount(0);
  });

  // Audit bug 1: a PGN with a [FEN] header crashes the whole app.
  test("analysis accepts a PGN that starts from a FEN", async ({ page }) => {
    test.fail(true, "known bug 1 (fixed in plan item 3)");
    await seed(page, null);
    await open(page);
    await button(page, /Analysis/).click();
    await button(page, /Paste FEN\/PGN/).click();
    await page
      .locator("textarea")
      .first()
      .fill(`[SetUp "1"]\n[FEN "4k3/8/8/8/8/8/4P3/4K3 w - - 0 1"]\n\n1. e4 Kd7 *`);
    await button(page, /^Load$/).click();
    await expect(page.locator(".board, [data-sq]").first()).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(/hit an error|Something went wrong/i)).toHaveCount(0, { timeout: 5_000 });
    await expect(page.locator(".movelist .mlmove")).toHaveText(["e4", "Kd7"], { timeout: 5_000 });
  });

  test("board theme and piece set persist across a reload", async ({ page }) => {
    await seed(page, null);
    await open(page);
    await page.getByText(/Settings & themes/).click();
    await page.locator(".themeswatch").nth(1).click();
    await page.locator(".pieceswatch").nth(1).click();
    await expect.poll(async () => (await readStore(page)).settings.theme).not.toBe("brown");
    const chosen = (await readStore(page)).settings.theme;
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect.poll(async () => (await readStore(page)).settings.theme).toBe(chosen);
    expect((await readStore(page)).settings.pieces).not.toBe("cburnett");
  });

  test("a backup can be restored from pasted text", async ({ page }) => {
    await seed(page, null);
    await open(page);
    await page.getByText(/Settings & themes/).click();
    const backup = { version: 1, settings: { theme: "walnut" }, games: [{ id: "r1", sans: ["d4"], date: 1 }] };
    await page.getByPlaceholder(/paste a backup/i).fill(JSON.stringify(backup));
    await button(page, /Restore from pasted text/).click();
    await expect(page.locator(".okmsg", { hasText: "Backup restored" })).toBeVisible();
    const s = await readStore(page);
    expect(s.settings.theme).toBe("walnut");
    expect(s.games.map((g) => g.id)).toEqual(["r1"]);
  });

  test("pass and play alternates sides and saves the game", async ({ page }) => {
    await seed(page, null);
    await open(page);
    await button(page, /Pass & play/).click();
    await button(page, /Start game/).click();
    await move(page, "e2", "e4");
    await move(page, "e7", "e5");
    await expect.poll(async () => (await readStore(page)).current?.sans).toEqual(["e4", "e5"]);
    expect((await readStore(page)).current.mode).toBe("pass");
  });

  test("the opening explorer walks a line and hands it to the drill", async ({ page }) => {
    await seed(page, null);
    await open(page);
    await button(page, /Openings/).click();
    await page.locator(".openrow", { has: page.locator(".or-move", { hasText: /^e4$/ }) }).first().click();
    await page.locator(".openrow", { has: page.locator(".or-move", { hasText: /^e5$/ }) }).first().click();
    await expect(page.locator(".pathmove")).toHaveCount(2);
    await button(page, /Drill this line/).click();
    // you play White: play 1.e4, the drill answers 1...e5 from the line
    await move(page, "e2", "e4");
    await expect(page.locator(".movepath .pathmove")).toHaveText(["1.e4", "e5"], { timeout: 15_000 });
  });

  test("the app opens offline after the first visit", async ({ page, context }) => {
    await seed(page, null);
    await open(page);
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload({ waitUntil: "domcontentloaded" }); // let the worker control the page
    await page.evaluate(() => navigator.serviceWorker.ready);
    await context.setOffline(true);
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.locator("h1.apptitle")).toBeVisible();
    await context.setOffline(false);
  });
});
