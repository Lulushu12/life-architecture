/**
 * Chess — Service Worker
 * Cache-first with background revalidation. The engine files (wasm + 39MB
 * NNUE net) are precached so the whole app, engine included, works offline.
 */

const CACHE_NAME = 'chess-v1'

const PRECACHE_ASSETS = [
  '/life-architecture/chess/',
  '/life-architecture/chess/index.html',
  '/life-architecture/chess/manifest.json',
  '/life-architecture/chess/icon-192.png',
  '/life-architecture/chess/icon-512.png',
  '/life-architecture/chess/engine/stockfish-nnue-16-single.js',
  '/life-architecture/chess/engine/stockfish-nnue-16-single.wasm',
  '/life-architecture/chess/engine/nn-5af11540bbfe.nnue',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  )
  self.skipWaiting()
})

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

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  if (request.method !== 'GET' || url.origin !== self.location.origin) return

  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          }
          return response
        })
        .catch(() => cached)

      return cached || networkFetch
    })
  )
})
