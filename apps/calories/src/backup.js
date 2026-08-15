// Backup that survives the APK.
//
// The old export built a Blob and clicked an <a download>. That works on the
// web, but Capacitor registers no DownloadListener, so inside the APK the click
// does nothing at all — silently. Since uninstalling an app deletes its
// localStorage, a backup route that quietly fails is worse than none: it's the
// one thing standing between you and losing every game you've played.
//
// So: clipboard first (works everywhere, no permission, no native plugin), with
// the raw text always on screen to select by hand, and the file download kept
// as a bonus where the browser supports it.

export function backupText(store) {
  return JSON.stringify(store, null, 2);
}

export function backupFilename(prefix) {
  return `${prefix}-backup-${new Date().toISOString().slice(0, 10)}.json`;
}

/** True when a real file download is likely to work (i.e. not in the APK). */
export function canDownload() {
  return import.meta.env.MODE !== "android";
}

/** Copy to clipboard. Resolves false when blocked, so callers can fall back. */
export async function copyToClipboard(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* denied, or no secure context — fall through */
  }
  // execCommand is deprecated but still the only fallback in some WebViews.
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export function downloadJson(text, filename) {
  const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Parse pasted or loaded backup text. `validate` should throw or return false
 * for anything that isn't a backup of this app.
 */
export function parseBackup(text, validate) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("That isn't valid JSON.");
  }
  if (!validate(data)) throw new Error("That doesn't look like a backup of this app.");
  return data;
}
