// Backup to a real file on the phone. The clipboard silently cut long
// backups short (and Android's WebView can't download files), so the APK
// writes the backup to Documents/Chess, which survives uninstalling the app,
// and reads it back to be sure it's whole. Restore with "Import from file".

const FOLDER = "Chess";

const pad = (n) => String(n).padStart(2, "0");

/** chess-backup-2026-10-10-140309.json: to the second, so names don't collide. */
export function backupFileName(prefix, d = new Date()) {
  return `${prefix}-backup-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}.json`;
}

/**
 * Writes `text` to Documents/Chess and checks it on disk. A name that can't
 * be written (for instance a file an earlier install made, which Android
 * won't let this one touch) is retried with a suffix. Resolves to
 * {path, bytes}; rejects with a plain message.
 */
export async function saveBackupFile(text, { prefix = "chess", fs = null, now = new Date() } = {}) {
  const { Filesystem, Directory, Encoding } = fs || (await import("@capacitor/filesystem"));
  const base = backupFileName(prefix, now).replace(/\.json$/, "");
  let last = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const name = `${base}${attempt > 1 ? `-${attempt}` : ""}.json`;
    const path = `${FOLDER}/${name}`;
    try {
      await Filesystem.writeFile({ path, data: text, directory: Directory.Documents, encoding: Encoding.UTF8, recursive: true });
      const back = await Filesystem.readFile({ path, directory: Directory.Documents, encoding: Encoding.UTF8 });
      if (back.data !== text) throw new Error("the file on disk doesn't match the backup");
      return { path: `Documents/${path}`, bytes: new Blob([text]).size };
    } catch (e) {
      last = e;
    }
  }
  throw new Error(`Couldn't save the file (${last?.message || "unknown error"}).`);
}
