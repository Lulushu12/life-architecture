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

    // The coach (plan item 5): a game summary, and the reason for 2.g4??
    await expect(page.locator(".coachcard")).toContainText("The turning point was 2. g4");
    await page.locator(".movelist .mlmove").nth(2).click();
    await expect(page.locator(".coachline")).toContainText("Qh4#");
    await button(page, /Show the reply/).click();
    await expect(page.locator(".previewbar")).toContainText("Qh4#");
  });

  // Audit bug 2 (fixed in plan item 3): "Retry from here" used to replace a
  // game in progress without asking.
  test("retrying from a review asks before replacing a game in progress", async ({ page }) => {
    const current = {
      id: "cur", mode: "bot", personaId: "x", playerColor: "w", serious: false, startFen: null,
      sans: ["e4", "e5"], chat: [], cps: [0, 0, 0], status: "playing", result: null, createdAt: 1,
    };
    await seed(page, {
      settings: { reviewMovetime: 100 },
      current,
      games: [{ id: "g1", date: 1, mode: "bot", personaId: "x", playerColor: "w", sans: FOOLS_MATE, result: "0-1", review: null }],
    });
    await open(page);
    await button(page, /Game archive/).click();
    await page.getByText(/tap to review/).first().click();
    await expect(page.locator(".acc-val").first()).toBeVisible({ timeout: 90_000 });
    await page.locator(".movelist .mlmove").nth(2).click(); // 2.g4??, allowing mate
    await button(page, /Retry from here/).click();
    await expect(page.getByText(/Replace your game in progress/)).toBeVisible();
    await button(page, /^Cancel$/).click();
    expect((await readStore(page)).current.id).toBe("cur");

    await button(page, /Retry from here/).click();
    await button(page, /Start new game/).click();
    await expect.poll(async () => (await readStore(page)).current?.id).not.toBe("cur");
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
    // shown in normal notation, not as raw squares (bug 12, fixed in plan item 3)
    await expect(page.getByText(/The move is [a-h][1-8][a-h][1-8]/)).toHaveCount(0);
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

  // Audit bug 1 (fixed in plan item 3): a PGN with a [FEN] header used to
  // crash the whole app.
  test("analysis accepts a PGN that starts from a FEN", async ({ page }) => {
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

  // Audit bug 4 (fixed in plan item 2): Analysis used to keep the previous
  // position's engine lines for most of a second after a move.
  test("analysis never shows the previous position's engine lines", async ({ page }) => {
    await seed(page, null);
    await open(page);
    await button(page, /Analysis/).click();
    const lines = page.locator(".engineline");
    await expect(lines.first()).toBeVisible({ timeout: 60_000 });
    const before = await lines.allTextContents();
    await move(page, "g1", "f3");
    const right = await lines.allTextContents();
    expect(right.filter((t) => before.includes(t))).toEqual([]);
  });

  // Audit bug 13 (fixed in plan item 2): the threat arrows used to show the
  // opponent's best idea even when it threatened nothing.
  test("analysis draws threat arrows only for real threats", async ({ page }) => {
    await seed(page, null);
    await open(page);
    await button(page, /Analysis/).click();
    const threat = page.locator('g[stroke="#d02a2a"]');
    await expect(page.locator(".engineline").first()).toBeVisible({ timeout: 60_000 });
    await page.waitForTimeout(1500); // the probe runs after the position's own eval
    await expect(threat).toHaveCount(0);

    // Black to move after 1.e4 e5 2.Bc4 Nc6 3.Qh5: White threatens Qxf7 mate.
    await button(page, /Paste FEN\/PGN/).click();
    await page.locator("textarea").first().fill("r1bqkbnr/pppp1ppp/2n5/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 3 3");
    await button(page, /^Load$/).click();
    await expect(threat.first()).toBeVisible({ timeout: 15_000 });
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

  test("the app colour applies at once and survives a reload", async ({ page }) => {
    await seed(page, null);
    await open(page);
    const accent = () => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--accent").trim());
    expect(await accent()).toBe("#3fb3a4"); // Teal by default
    await page.getByText(/Settings & themes/).click();
    await page.getByRole("radio", { name: /Plum/ }).click();
    expect(await accent()).toBe("#a58be0");
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect.poll(accent).toBe("#a58be0");
    expect((await readStore(page)).settings.accent).toBe("plum");
  });

  test("a font file can be added, used, kept across reloads and removed", async ({ page }) => {
    await seed(page, null);
    await open(page);
    await page.getByText(/Settings & themes/).click();
    await page.getByTestId("font-file").setInputFiles("node_modules/@fontsource/sora/files/sora-latin-800-normal.woff2");
    const added = page.getByRole("radio", { name: /sora latin 800 normal/i });
    await expect(added).toBeVisible();
    await expect(added).toHaveAttribute("aria-checked", "true");
    expect((await readStore(page)).settings.displayFont).toMatch(/^custom:/);
    const display = () => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--display"));
    expect(await display()).toContain("chess-user-font-");

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByRole("radio", { name: /sora latin 800 normal/i })).toBeVisible();
    await expect.poll(display).toContain("chess-user-font-");

    await page.getByRole("button", { name: "Remove" }).click();
    await expect(page.getByRole("radio", { name: /sora latin 800 normal/i })).toHaveCount(0);
    expect((await readStore(page)).settings.displayFont).toBe("sora");
  });

  test("a file that is not a font is refused with a reason", async ({ page }) => {
    await seed(page, null);
    await open(page);
    await page.getByText(/Settings & themes/).click();
    await page.getByTestId("font-file").setInputFiles({ name: "notes.txt", mimeType: "text/plain", buffer: Buffer.from("hello") });
    await expect(page.getByText(/Use a .woff2, .woff, .ttf or .otf font file/)).toBeVisible();
  });

  test("a backup can be restored from pasted text", async ({ page }) => {
    await seed(page, null);
    await open(page);
    await page.getByText(/Settings & themes/).click();
    await page.getByText("Backup and restore").click(); // the section starts closed
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
