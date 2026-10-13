// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync, readdirSync, readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { boxPayload, boxEndpoint, boxDue, boxErrorText, pushBackup, fetchTransport, BOX_INTERVAL_MS } from "../../src/boxBackup.js";

const STORE = {
  version: 1,
  settings: { ai: { baseUrl: "u", apiKey: "SECRET-KEY", model: "m" }, box: { enabled: true, url: "", token: "SECRET-TOKEN" } },
  games: [{ id: "g1", sans: ["e4"] }],
  boxStatus: { lastOk: 1 },
};

describe("box backup, the app side (plan item 14)", () => {
  it("leaves the API key, the box token and the box status out of the copy", () => {
    const text = boxPayload(STORE);
    expect(text).not.toContain("SECRET");
    const back = JSON.parse(text);
    expect(back.games).toEqual(STORE.games);
    expect(back.settings.box).toBeUndefined();
    expect(back.boxStatus).toBeUndefined();
    expect(STORE.settings.ai.apiKey).toBe("SECRET-KEY"); // the store itself is untouched
  });

  it("builds the address and refuses a bad one", () => {
    expect(boxEndpoint("https://box.tail1234.ts.net/")).toBe("https://box.tail1234.ts.net/v1/backups/chess");
    expect(boxEndpoint("box.local")).toBeNull();
    expect(boxEndpoint("")).toBeNull();
  });

  it("is due once a day at most, and only when set up", () => {
    const box = { enabled: true, url: "https://b", token: "x" };
    expect(boxDue(box, null, 1000)).toBe(true);
    expect(boxDue(box, { lastOk: 1000 }, 1000 + BOX_INTERVAL_MS - 1)).toBe(false);
    expect(boxDue(box, { lastOk: 1000 }, 1000 + BOX_INTERVAL_MS)).toBe(true);
    expect(boxDue({ ...box, enabled: false }, null)).toBe(false);
    expect(boxDue({ ...box, token: "" }, null)).toBe(false);
    // a failed try doesn't hold the next one back
    expect(boxDue(box, { lastOk: null, lastTry: 999, lastError: "x" }, 1000)).toBe(true);
  });

  it("explains failures in plain words and never throws", async () => {
    expect(boxErrorText({ status: 401 })).toMatch(/token/);
    expect(boxErrorText(null)).toMatch(/Couldn't reach the box/);
    const down = await pushBackup({ ...STORE, settings: { ...STORE.settings, box: { enabled: true, url: "https://b", token: "x" } } }, {
      transport: async () => {
        throw new TypeError("network");
      },
      now: () => 5,
    });
    expect(down).toMatchObject({ lastOk: 1, lastTry: 5 });
    expect(down.lastError).toMatch(/Couldn't reach/);
  });
});

// A real round trip against ops/la-backup/server.py.
describe("box backup against the real receiver", () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const serverPy = join(here, "../../../../ops/la-backup/server.py");
  const dataDir = mkdtempSync(join(tmpdir(), "la-backup-"));
  const tokenFile = join(dataDir, "token");
  const token = "k".repeat(32);
  let proc;
  let base;

  beforeAll(async () => {
    writeFileSync(tokenFile, token + "\n");
    proc = spawn("python3", [serverPy, "--port", "0", "--data-dir", join(dataDir, "store"), "--token-file", tokenFile]);
    base = await new Promise((resolve, reject) => {
      proc.stdout.on("data", (d) => {
        const m = String(d).match(/listening on ([\d.]+):(\d+)/);
        if (m) resolve(`http://${m[1]}:${m[2]}`);
      });
      proc.on("exit", (code) => reject(new Error("server exited " + code)));
    });
  });
  afterAll(() => proc?.kill());

  const storeFor = (t) => ({ ...STORE, settings: { ...STORE.settings, box: { enabled: true, url: base, token: t } } });

  it("stores a gzipped copy without secrets, once per distinct backup", async () => {
    const first = await pushBackup(storeFor(token), { transport: fetchTransport, now: () => 100 });
    expect(first).toMatchObject({ lastOk: 100, lastError: null });
    expect(first.lastId).toMatch(/_[0-9a-f]{12}$/);
    const again = await pushBackup(storeFor(token), { transport: fetchTransport, now: () => 200 });
    expect(again).toMatchObject({ lastOk: 200, lastId: first.lastId, lastError: null });
    const files = readdirSync(join(dataDir, "store", "chess")).filter((n) => n.endsWith(".json.gz") && n !== "latest.json.gz");
    expect(files).toHaveLength(1);
    const saved = gunzipSync(readFileSync(join(dataDir, "store", "chess", files[0]))).toString();
    expect(JSON.parse(saved).games).toEqual(STORE.games);
    expect(saved).not.toContain("SECRET");
  });

  it("reports a wrong token in plain words", async () => {
    const res = await pushBackup(storeFor("wrong-token-wrong-token"), { transport: fetchTransport, now: () => 300 });
    expect(res.lastError).toMatch(/refused the token/);
  });
});
