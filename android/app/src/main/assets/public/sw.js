const CACHE_NAME = 'garment-system-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.jpg'
];

// Install Service Worker and cache essential shells
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Clean up old caches on activation
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Stale-While-Revalidate caching strategy for optimal instant loading and reliability
self.addEventListener('fetch', (event) => {
  // Only handle HTTP/HTTPS (ignore chrome-extension, etc.)
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch in the background and update the cache
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse);
              });
            }
          })
          .catch(() => {
            // Ignore background fetch failures when offline
          });
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        // Cache newly fetched assets dynamically if they are successful static assets
        if (
          networkResponse && 
          networkResponse.status === 200 && 
          (event.request.url.includes('.js') || event.request.url.includes('.css') || event.request.url.includes('.png') || event.request.url.includes('.jpg'))
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      });
    })
  );
});
