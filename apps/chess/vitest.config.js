import { defineConfig } from "vitest/config";
import path from "node:path";

// Unit tests only. Kept apart from vite.config.js so the service-worker
// plugin and the build-time defines stay out of the test run.
export default defineConfig({
  resolve: {
    alias: { "@shared": path.resolve(__dirname, "../../packages/shared/src") },
    // packages/shared has no node_modules of its own; resolve its imports here.
    dedupe: ["react", "react-dom", "@capacitor/core", "@capacitor/app", "@capacitor/local-notifications"],
  },
  define: {
    __BUILD_ID__: JSON.stringify("test"),
    __BUILD_DATE__: JSON.stringify("2026-01-01"),
  },
  test: {
    include: ["test/unit/**/*.test.js"],
    environment: "jsdom",
  },
});
