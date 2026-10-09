import { defineConfig, devices } from "@playwright/test";

// Browser flows against the production build, with the real Stockfish WASM.
// Locally the bundled Chromium is used (PLAYWRIGHT_BROWSERS_PATH); CI installs it.
const PORT = 4187;

export default defineConfig({
  testDir: "test/e2e",
  timeout: 120_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    ...devices["Pixel 5"],
    baseURL: `http://localhost:${PORT}/life-architecture/chess/`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "phone", use: { browserName: "chromium" } }],
  webServer: {
    command: `npx vite build && npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/life-architecture/chess/`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
