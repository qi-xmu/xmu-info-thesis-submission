const CACHE_NAME = 'task-tracker-v1'

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET
  if (request.method !== 'GET') return

  // Skip non-http(s) requests (chrome-extension, etc.)
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return

  // Skip WebSocket upgrade requests (needed for Vite HMR)
  if (request.headers.get('upgrade')?.toLowerCase() === 'websocket') return

  // Skip Vite internal requests (HMR, dependencies, etc.)
  if (url.pathname.startsWith('/@') || url.pathname.includes('__vite')) return

  // API requests: network first, cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const clone = res.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          return res
        })
        .catch(() => caches.match(request).then((c) => c || new Response('Offline', { status: 503 })))
    )
    return
  }

  // HTML: always network first (prevents stale index.html)
  if (request.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const clone = res.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          return res
        })
        .catch(() => caches.match(request).then((c) => c || caches.match('/').then((h) => h || new Response('Offline', { status: 503 }))))
    )
    return
  }

  // Static assets (JS/CSS/images): cache first, network fallback
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached
      return fetch(request).then((res) => {
        if (res.ok) {
          const clone = res.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
        }
        return res
      })
    })
  )
})
