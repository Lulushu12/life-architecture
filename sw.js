/**
 * Life Architecture — Service Worker
 * Provides offline support via a cache-first strategy for static assets
 * and a network-first strategy for API/dynamic requests.
 */

const CACHE_NAME = 'life-architecture-v1'

// Assets to pre-cache on install
const PRECACHE_ASSETS = [
  '/life-architecture/',
  '/life-architecture/index.html',
  '/life-architecture/manifest.json',
  '/life-architecture/icon-192.png',
  '/life-architecture/icon-512.png',
]

// ── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  )
  self.skipWaiting()
})

// ── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

// ── Fetch ────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Only handle same-origin GET requests
  if (request.method !== 'GET' || url.origin !== self.location.origin) return

  event.respondWith(
    caches.match(request).then((cached) => {
      // Cache-first: serve cached version while revalidating in background
      const networkFetch = fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          }
          return response
        })
        .catch(() => cached) // fall back to cache if network fails

      return cached || networkFetch
    })
  )
})
