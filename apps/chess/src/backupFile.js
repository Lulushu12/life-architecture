// Backup to a real file inside the APK. The WebView has no download handler
// and no Web Share, so the shared BackupPanel can only offer the clipboard
// there; these go through Capacitor's Filesystem and Share plugins instead.
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

// Time in the name too: two backups on the same day must not overwrite each
// other, and after a reinstall the app may not own an older file of the same name.
function filename() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const stamp = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
  return `chess-backup-${stamp}.json`;
}

// Documents is shared storage, so the file survives uninstalling the app.
// Android 10 and older need the storage permission for it; newer versions
// report it as granted.
async function saveToPhone(text) {
  const perm = await Filesystem.requestPermissions();
  if (perm.publicStorage !== "granted") throw new Error("Storage permission denied, so the file wasn't saved.");
  const name = filename();
  await Filesystem.writeFile({ path: name, data: text, directory: Directory.Documents, encoding: Encoding.UTF8 });
  return `Saved to Documents/${name}`;
}

// Cache dir + share sheet: the user picks Drive, Files, a chat, etc. The
// cache path is the only one exposed through the FileProvider (file_paths.xml).
async function shareFile(text) {
  const name = filename();
  const { uri } = await Filesystem.writeFile({
    path: `backups/${name}`,
    data: text,
    directory: Directory.Cache,
    encoding: Encoding.UTF8,
    recursive: true,
  });
  try {
    await Share.share({ title: name, files: [uri] });
  } catch (e) {
    if (/cancel/i.test(e?.message || "")) return false;
    throw e;
  }
  return undefined;
}

export const FILE_ACTIONS = [
  { label: "Save to phone", run: saveToPhone },
  { label: "Share file", run: shareFile },
];
