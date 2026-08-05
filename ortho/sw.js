/**
 * Ortho Reference — Service Worker
 * Cache-first with background revalidation, same pattern as the
 * Life Architecture app. Scoped to /life-architecture/ortho/.
 */

const CACHE_NAME = 'ortho-v1'

const PRECACHE_ASSETS = [
  '/life-architecture/ortho/',
  '/life-architecture/ortho/index.html',
  '/life-architecture/ortho/manifest.json',
  '/life-architecture/ortho/icon-192.png',
  '/life-architecture/ortho/icon-512.png',
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
