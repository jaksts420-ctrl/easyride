/* Service worker: makes the PWA work offline (tickets must be readable without a network). */
const CACHE = 'easyride-v4';
const SHELL = [
  './', './index.html', './manifest.webmanifest', './assets/icon.svg',
  './css/app.css',
  './vendor/qrcode-generator.js', './vendor/jsQR.js',
  './js/bundle.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

/*
 * Network-first so a freshly deployed build is picked up immediately, with the cache as the
 * offline fallback — tickets and QR codes must stay readable without a network.
 * Strict same-origin check prevents caching third-party or opaque responses.
 */
self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET') return;
  let parsed;
  try { parsed = new URL(request.url); } catch { return; }
  if (parsed.origin !== self.location.origin) return;
  e.respondWith(
    fetch(request).then((res) => {
      if (res && res.ok && res.type === 'basic') {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
      }
      return res;
    }).catch(() => caches.match(request).then((hit) => hit || caches.match('./index.html')))
  );
});
