/* Interval Timer PWA service worker */
const CACHE_NAME = 'interval-timer-v1';
const CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  // CDN assets we rely on; SW will cache them after first visit
  'https://unpkg.com/react@18/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
  'https://unpkg.com/@babel/standalone/babel.min.js',
  'https://cdn.tailwindcss.com'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => (k === CACHE_NAME ? null : caches.delete(k))))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Only handle GET
  if (event.request.method !== 'GET') return;

  // Cache-first for same-origin and CDN assets
  if (url.origin === location.origin || /^(https:\/\/unpkg\.com|https:\/\/cdn\.tailwindcss\.com)/.test(url.href)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const fetchPromise = fetch(event.request).then((network) => {
          const responseClone = network.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          return network;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    );
  }
});
