import { expect } from "@playwright/test";

export const STORE_KEY = "chess-v1";

// Seeds localStorage once per test, before the app's first script runs.
// Later reloads keep whatever the app itself saved.
export async function seed(page, store) {
  await page.addInitScript(
    ([key, value]) => {
      if (sessionStorage.getItem("__seeded")) return;
      localStorage.clear();
      if (value) localStorage.setItem(key, value);
      sessionStorage.setItem("__seeded", "1");
    },
    [STORE_KEY, store ? JSON.stringify({ version: 1, settings: {}, games: [], ...store }) : null]
  );
}

export async function open(page) {
  await page.goto("./", { waitUntil: "domcontentloaded" });
  await expect(page.locator("h1.apptitle")).toBeVisible();
}

export async function readStore(page) {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key) || "null"), STORE_KEY);
}

export async function move(page, from, to) {
  await page.locator(`[data-sq="${from}"]`).click();
  await page.locator(`[data-sq="${to}"]`).click();
}

export const button = (page, name) => page.getByRole("button", { name }).first();
