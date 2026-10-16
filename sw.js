/* ============================================================
   SERVICE WORKER — FatchFadh PWA
   Strategy: Cache-first untuk aset, Network-first untuk API
   ============================================================ */

const CACHE_VERSION = 'fatchfadh-v3.1';
const CACHE_ASSETS = [
  /* Root & HTML */
  '/',
  '/index.html',
  '/login.html',
  '/manifest.json',

  /* CSS */
  '/css/base.css',
  '/css/layout.css',
  '/css/components.css',
  '/css/pages/dashboard.css',
  '/css/pages/transaction.css',
  '/css/pages/category.css',
  '/css/pages/budget.css',
  '/css/pages/entry-modal.css',
  '/css/pages/auth.css',

  /* JS — main & core */
  '/js/main.js',
  '/js/router.js',
  '/js/utils.js',
  '/js/ui.js',
  '/js/store.js',
  '/js/export.js',
  '/js/pwa.js',

  /* JS — Firebase & Auth */
  '/js/firebase-config.js',
  '/js/firebase.js',
  '/js/auth.js',
  '/js/auth-page.js',
  '/js/sync.js',

  /* JS — data & components */
  '/js/data/dummy.js',
  '/js/components/numpad.js',
  '/js/components/modal-entry.js',
  '/js/components/modal-edit.js',

  /* JS — pages */
  '/js/pages/dashboard.js',
  '/js/pages/income.js',
  '/js/pages/expense.js',
  '/js/pages/category.js',
  '/js/pages/budget.js',

  /* Assets */
  '/assets/icon.svg',

  /* Font */
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap',
];

/* ---------- Install: cache semua aset ---------- */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      return cache.addAll(CACHE_ASSETS).catch((err) => {
        console.warn('[SW] Some assets failed to cache:', err);
      });
    })
  );
  self.skipWaiting();
});

/* ---------- Activate: bersihkan cache lama ---------- */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

/* ---------- Fetch: strategi cache ---------- */
self.addEventListener('fetch', (event) => {
  const { request } = event;

  /* Skip non-GET & chrome-extension */
  if (request.method !== 'GET') return;
  if (request.url.startsWith('chrome-extension://')) return;

  /* Skip Firebase API — biar selalu fresh */
  if (request.url.includes('firebase') || request.url.includes('googleapis')) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        /* Return cache, update di background (stale-while-revalidate) */
        fetch(request).then((response) => {
          if (response && response.status === 200) {
            caches.open(CACHE_VERSION).then((cache) => {
              cache.put(request, response.clone());
            });
          }
        }).catch(() => {});
        return cached;
      }

      /* Nggak ada di cache → fetch dari network, cache kalau sukses */
      return fetch(request).then((response) => {
        if (!response || response.status !== 200) return response;
        const responseClone = response.clone();
        caches.open(CACHE_VERSION).then((cache) => {
          cache.put(request, responseClone);
        });
        return response;
      }).catch(() => {
        /* Fallback: untuk navigasi, tampilkan index.html */
        if (request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});

/* ---------- Message dari app ---------- */
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});