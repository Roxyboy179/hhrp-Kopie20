// Service Worker für HHRP PWA
const CACHE_NAME = 'hhrp-v1';
const urlsToCache = [
  '/',
  '/bewerbung',
  '/team',
  '/faq',
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache opened');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.log('Cache addAll error:', error);
      })
  );
  self.skipWaiting();
});

// Fetch Event - Network First Strategy (nur für HTTP/HTTPS)
self.addEventListener('fetch', (event) => {
  // Nur HTTP/HTTPS Requests cachen
  if (!event.request.url.startsWith('http')) {
    return;
  }

  // Ignoriere chrome-extension und andere Protokolle
  const url = new URL(event.request.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Nur erfolgreiche Responses cachen
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }

        // Clone the response
        const responseToCache = response.clone();
        
        caches.open(CACHE_NAME)
          .then((cache) => {
            cache.put(event.request, responseToCache);
          })
          .catch((error) => {
            console.log('Cache put error:', error);
          });
        
        return response;
      })
      .catch(() => {
        // Fallback zu Cache bei Netzwerkfehler
        return caches.match(event.request);
      })
  );
});

// Activate Event
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
    })
  );
  self.clients.claim();
});

