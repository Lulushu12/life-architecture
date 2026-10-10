// Kill switch for the retired Calories service worker (the app moved to /food/).
// An installed copy fetches this on its next update check, clears its caches,
// unregisters itself and reloads open pages onto the redirect.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k.startsWith("calories-")).map((k) => caches.delete(k)));
      await self.registration.unregister();
      const pages = await self.clients.matchAll({ type: "window" });
      for (const p of pages) p.navigate(p.url);
    })()
  );
});
