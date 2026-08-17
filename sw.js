// Everythingbytish Enterprises — Service Worker
// Caches the app shell so the site installs as a PWA and loads instantly/offline.
// Never caches Firebase/Firestore/API calls — product, order, and account data
// always comes fresh from the network.

const CACHE_NAME = 'everythingbytish-v1';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './favicon.ico',
  './icon-48.png',
  './icon-72.png',
  './icon-96.png',
  './icon-128.png',
  './icon-144.png',
  './icon-152.png',
  './icon-167.png',
  './icon-180.png',
  './icon-192.png',
  './icon-256.png',
  './icon-384.png',
  './icon-512.png',
  './icon-maskable-192.png',
  './icon-maskable-512.png'
];

// Install: pre-cache the app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// Activate: clean up old caches from previous versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch strategy:
// - Never touch Firebase/Firestore/Google APIs — always go straight to network,
//   so products, orders, auth, and payments are always live and correct.
// - For the app shell (HTML/CSS/JS/icons/manifest), use network-first with a
//   cache fallback, so users always get the latest deployed version when
//   online, but the app still opens if they're offline.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = req.url;

  // Only handle GET requests
  if (req.method !== 'GET') return;

  // Bypass caching entirely for Firebase/Google/API calls
  if (
    url.includes('firestore.googleapis.com') ||
    url.includes('firebaseio.com') ||
    url.includes('identitytoolkit.googleapis.com') ||
    url.includes('securetoken.googleapis.com') ||
    url.includes('firebasestorage.googleapis.com') ||
    url.includes('googleapis.com') ||
    url.includes('google.com') ||
    url.includes('gstatic.com') ||
    url.includes('cdnjs.cloudflare.com')
  ) {
    return; // let the browser handle it normally (network only)
  }

  event.respondWith(
    fetch(req)
      .then((networkRes) => {
        // Update the cache with the fresh copy for offline fallback later
        const resClone = networkRes.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
        return networkRes;
      })
      .catch(() =>
        caches.match(req).then((cached) => cached || caches.match('./index.html'))
      )
  );
});
