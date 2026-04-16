// Service Worker für HHRP PWA - Optimiert für Supabase
const CACHE_NAME = 'hhrp-v3';
const OFFLINE_CACHE = 'hhrp-offline-v3';

// Statische Assets die gecacht werden sollen
const STATIC_ASSETS = [
  '/icon-192.png',
  '/icon-512.png',
  '/logo.webp',
  '/favicon.png',
];

// Install Event - Cache nur statische Assets und Offline-Seite
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    Promise.all([
      // Cache statische Assets
      caches.open(CACHE_NAME).then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS).catch((error) => {
          console.log('[SW] Cache static assets error:', error);
        });
      }),
      // Cache Offline-Seite separat
      caches.open(OFFLINE_CACHE).then((cache) => {
        console.log('[SW] Caching offline page');
        return fetch('/offline').then((response) => {
          return cache.put('/offline', response);
        }).catch((error) => {
          console.log('[SW] Cache offline page error:', error);
        });
      })
    ])
  );
  self.skipWaiting();
});

// Fetch Event - Intelligentes Caching
self.addEventListener('fetch', (event) => {
  // Nur GET-Requests cachen - POST, PUT, DELETE werden nicht gecached
  if (event.request.method !== 'GET') {
    return;
  }

  // Nur HTTP/HTTPS Requests
  if (!event.request.url.startsWith('http')) {
    return;
  }

  const url = new URL(event.request.url);
  
  // Ignoriere chrome-extension und andere Protokolle
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return;
  }

  // ⚠️ KRITISCH: API-Calls NIEMALS cachen (immer frische Daten von Supabase!)
  if (url.pathname.startsWith('/api/')) {
    console.log('[SW] API call - Network only:', url.pathname);
    event.respondWith(
      fetch(event.request).catch(() => {
        // Bei Netzwerkfehler für API-Calls: Keine gecachte Response zurückgeben
        return new Response(JSON.stringify({ error: 'Offline - keine Verbindung' }), {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // Statische Assets: Cache-First
  if (STATIC_ASSETS.includes(url.pathname) || url.pathname.match(/\.(png|jpg|jpeg|svg|webp|ico|css|js)$/)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) {
          return cached;
        }
        return fetch(event.request).then((response) => {
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // HTML-Seiten: Network-First, bei Offline → Offline-Seite
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Erfolgreiche Responses können gecacht werden (optional)
        if (response && response.status === 200 && event.request.mode === 'navigate') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        console.log('[SW] Network failed, checking cache...');
        // Versuche gecachte Version zu laden
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            console.log('[SW] Serving from cache');
            return cachedResponse;
          }
          
          // Wenn es eine Navigation ist und keine gecachte Version existiert → Offline-Seite
          if (event.request.mode === 'navigate') {
            console.log('[SW] Serving offline page');
            return caches.match('/offline').then((offlinePage) => {
              if (offlinePage) {
                return offlinePage;
              }
              // Fallback: Inline Offline-Seite
              return new Response(`
                <!DOCTYPE html>
                <html lang="de">
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>Offline - HHRP</title>
                  <style>
                    body { margin: 0; padding: 0; background: #050505; color: white; font-family: system-ui; display: flex; align-items: center; justify-content: center; min-height: 100vh; text-align: center; }
                    .container { max-width: 500px; padding: 2rem; }
                    h1 { font-size: 2rem; margin-bottom: 1rem; }
                    p { color: rgba(255,255,255,0.6); margin-bottom: 2rem; }
                    button { background: #ef4444; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 0.5rem; font-size: 1rem; cursor: pointer; }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <h1>📵 Keine Verbindung</h1>
                    <p>Du bist offline. Bitte überprüfe deine Internetverbindung.</p>
                    <button onclick="location.reload()">Erneut versuchen</button>
                  </div>
                </body>
                </html>
              `, {
                status: 200,
                headers: { 'Content-Type': 'text/html' }
              });
            });
          }
          
          // Für andere Ressourcen
          return new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/plain' }
          });
        });
      })
  );
});

// Activate Event - Alte Caches löschen
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Lösche alle Caches außer den aktuellen
          if (cacheName !== CACHE_NAME && cacheName !== OFFLINE_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Übernehme sofort die Kontrolle über alle Clients
  self.clients.claim();
  console.log('[SW] Activated and ready!');
});

// Message Event - Ermöglicht manuelles Cache-Clearing vom Client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            console.log('[SW] Clearing cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
      })
    );
  }
});

// ═══════════════════════════════════════════════════════════════
// PUSH NOTIFICATIONS für PWA
// ═══════════════════════════════════════════════════════════════

// Push Event - Empfange Push-Benachrichtigungen
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  let data = {
    title: '🎮 Hamburg Horizon RP',
    body: 'Neue Benachrichtigung',
    icon: '/icon-512.png',
    badge: '/icon-192.png',
    tag: 'default'
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      console.error('[SW] Error parsing push data:', e);
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icon-512.png',
    badge: data.badge || '/icon-192.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'default',
    requireInteraction: data.requireInteraction || false,
    data: {
      url: data.url || '/profil',
      timestamp: Date.now(),
      type: data.type
    },
    actions: data.actions || []
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification Click Event
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification.tag);
  event.notification.close();

  const urlToOpen = event.notification.data.url || '/profil';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Prüfe ob bereits ein Fenster offen ist
      for (const client of clientList) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      // Öffne neues Fenster
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
