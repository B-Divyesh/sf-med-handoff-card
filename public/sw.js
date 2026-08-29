const VERSION = 'med-handoff-v9'
const SHELL = ['/', '/demo', '/index.html', '/demo/index.html', '/manifest.webmanifest', '/offline.html', '/404.html', '/privacy/index.html', '/terms/index.html', '/icons/icon-192.svg', '/icons/icon-512.svg', '/icons/apple-touch-icon.png', '/social-card.png']

self.addEventListener('install', event => event.waitUntil(caches.open(VERSION).then(cache => cache.addAll(SHELL))))
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== VERSION).map(key => caches.delete(key)))).then(() => self.clients.claim())))
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return
  const url = new URL(event.request.url)
  if (url.origin !== location.origin) return
  if (event.request.mode === 'navigate') {
    const fallback = url.pathname === '/privacy' || url.pathname === '/privacy/' ? '/privacy/index.html'
      : url.pathname === '/terms' || url.pathname === '/terms/' ? '/terms/index.html'
        : url.pathname === '/demo' ? '/demo/index.html'
          : url.pathname === '/' ? '/index.html' : '/offline.html'
    event.respondWith(fetch(event.request).catch(() => caches.match(fallback)))
    return
  }
  event.respondWith(caches.open(VERSION).then(cache => cache.match(new URL(event.request.url).pathname)).then(hit => hit || fetch(event.request).then(response => { if (response.ok) caches.open(VERSION).then(cache => cache.put(new URL(event.request.url).pathname, response.clone())); return response })))
})
self.addEventListener('message', event => {
  if (event.data?.type === 'cache-assets') {
    const assets = event.data.assets.filter(asset => typeof asset === 'string' && new URL(asset).origin === location.origin)
    event.waitUntil(caches.open(VERSION).then(cache => cache.addAll(assets)))
  }
  if (event.data === 'skip-waiting') self.skipWaiting()
})
