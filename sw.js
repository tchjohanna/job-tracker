/* ═══════════════════════════════════════════════════════════
   Job Tracker Johanna — Service Worker
   Stratégie : Cache First pour les assets statiques,
               Network First pour les requêtes réseau
   ═══════════════════════════════════════════════════════════ */

const CACHE_NAME = 'job-tracker-v1';

/* Fichiers à mettre en cache lors de l'installation */
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Syne:wght@700&display=swap'
];

/* ── INSTALL : mise en cache des assets ── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

/* ── ACTIVATE : suppression des anciens caches ── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

/* ── FETCH : Cache First pour les assets, réseau sinon ── */
self.addEventListener('fetch', event => {
  /* On ignore les requêtes non-GET et les extensions navigateur */
  if (event.request.method !== 'GET') return;
  if (event.request.url.startsWith('chrome-extension')) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request)
        .then(response => {
          /* On ne cache que les réponses valides */
          if (!response || response.status !== 200 || response.type === 'opaque') {
            return response;
          }
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => {
          /* Fallback hors-ligne : retourne index.html */
          if (event.request.destination === 'document') {
            return caches.match('/index.html');
          }
        });
    })
  );
});
