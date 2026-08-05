/**
 * Whist & Rentz — Service Worker
 * Cache-first with background revalidation, same pattern as the
 * Life Architecture app. Scoped to /life-architecture/whist/.
 */

const CACHE_NAME = 'whist-v1'

const PRECACHE_ASSETS = [
  '/life-architecture/whist/',
  '/life-architecture/whist/index.html',
  '/life-architecture/whist/manifest.json',
  '/life-architecture/whist/icon-192.png',
  '/life-architecture/whist/icon-512.png',
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
