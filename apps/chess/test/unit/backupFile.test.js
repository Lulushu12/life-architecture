import { describe, it, expect } from "vitest";
import { readBackup, looksCutOff } from "@shared/backup.js";
import { backupFileName, saveBackupFile } from "../../src/backupFile.js";

describe("cut-off backups (the clipboard truncation you hit)", () => {
  const full = JSON.stringify({ version: 1, games: [{ id: "g1", sans: ["e4", "e5"] }], note: "a {brace} in a string" }, null, 2);

  it("tells a cut-off backup from a complete one", () => {
    expect(looksCutOff(full)).toBe(false);
    expect(looksCutOff(full.slice(0, 40))).toBe(true);
    expect(looksCutOff(full.slice(0, full.indexOf("{brace}") + 3))).toBe(true); // stops inside a string
    expect(looksCutOff("not json at all")).toBe(false);
  });

  it("says so plainly instead of a vague JSON error", () => {
    expect(() => readBackup(full.slice(0, 60), () => true)).toThrow(/incomplete: it stops after 60 characters/);
    expect(() => readBackup("hello", () => true)).toThrow("That isn't valid JSON.");
    expect(readBackup(full, () => true).data.games[0].id).toBe("g1");
  });
});

// A stand-in for @capacitor/filesystem.
function fakeFs({ failNames = [], corrupt = false } = {}) {
  const files = {};
  return {
    files,
    Directory: { Documents: "DOCUMENTS" },
    Encoding: { UTF8: "utf8" },
    Filesystem: {
      async writeFile({ path, data, directory }) {
        if (directory !== "DOCUMENTS") throw new Error("wrong directory");
        if (failNames.some((n) => path.endsWith(n))) throw new Error("EACCES");
        files[path] = corrupt ? data.slice(0, 10) : data;
        return { uri: "file:///storage/emulated/0/Documents/" + path };
      },
      async readFile({ path }) {
        return { data: files[path] };
      },
    },
  };
}

describe("saving a backup file on the phone", () => {
  const when = new Date(2026, 9, 10, 14, 3, 9);

  it("names files to the second", () => {
    expect(backupFileName("chess", when)).toBe("chess-backup-2026-10-10-140309.json");
  });

  it("writes to Documents/Chess and reads it back to be sure", async () => {
    const fs = fakeFs();
    const res = await saveBackupFile('{"a":1}', { fs, now: when });
    expect(res.path).toBe("Documents/Chess/chess-backup-2026-10-10-140309.json");
    expect(fs.files["Chess/chess-backup-2026-10-10-140309.json"]).toBe('{"a":1}');
  });

  it("picks another name when that one can't be written (a file left by an old install)", async () => {
    const fs = fakeFs({ failNames: ["140309.json"] });
    const res = await saveBackupFile('{"a":1}', { fs, now: when });
    expect(res.path).toBe("Documents/Chess/chess-backup-2026-10-10-140309-2.json");
  });

  it("fails loudly when the file on disk doesn't match", async () => {
    await expect(saveBackupFile('{"a":1,"b":2}', { fs: fakeFs({ corrupt: true }), now: when })).rejects.toThrow(/Couldn't save/);
  });
});
