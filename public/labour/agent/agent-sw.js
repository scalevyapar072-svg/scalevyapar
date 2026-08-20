const STATIC_CACHE = 'rozgar-agent-static-v1'

self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== STATIC_CACHE)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return
  }

  const url = new URL(event.request.url)
  if (url.origin !== self.location.origin) {
    return
  }

  const isSafeStaticAsset =
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/images/rozgar/icons/') ||
    url.pathname === '/labour/agent/manifest.webmanifest'

  if (!isSafeStaticAsset) {
    return
  }

  event.respondWith(
    caches.open(STATIC_CACHE).then(async cache => {
      const cached = await cache.match(event.request)
      if (cached) {
        return cached
      }

      const response = await fetch(event.request)
      if (response.ok) {
        await cache.put(event.request, response.clone())
      }
      return response
    })
  )
})
