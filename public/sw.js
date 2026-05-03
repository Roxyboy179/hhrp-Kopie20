// Service Worker für HHRP PWA - OPTIMIERT FÜR MOBILE PERFORMANCE 🚀
const CACHE_NAME = 'hhrp-v10-radio-ui';
const RUNTIME_CACHE = 'hhrp-runtime-v10';
const IMAGE_CACHE = 'hhrp-images-v10';

// Kritische Assets für sofortiges Laden
const CRITICAL_ASSETS = [
  '/',
  '/icon-192.png',
  '/icon-512.png',
  '/logo.webp',
  '/favicon.png'
];

// Install Event - Aggressive Caching
self.addEventListener('install', (event) => {
  console.log('[SW] 🚀 Fast Install...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CRITICAL_ASSETS).catch((err) => {
        console.error('[SW] Cache error:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Sofort übernehmen
self.addEventListener('activate', (event) => {
  console.log('[SW] ⚡ Fast Activate...');
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== RUNTIME_CACHE && key !== IMAGE_CACHE) {
            console.log('[SW] 🗑️ Delete old:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Stale-While-Revalidate für beste Performance
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Nur GET & HTTP(S)
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // Range-Requests (Audio/Video) NICHT intercepten – caches.put() unterstützt
  // keine 206-Responses und das brickt den Audio-Stream.
  if (request.headers.get('range')) {
    return;
  }

  // Cross-Origin NICHT intercepten (CDN-Avatare, Supabase Realtime,
  // STUN/ICE-Traffic, Discord, etc.) – verhindert "Failed to convert value to
  // 'Response'" Fehler, wenn Fetch scheitert und nichts gecacht ist.
  if (url.origin !== self.location.origin) {
    return;
  }

  // Offline-Fallback-Response (immer valide Response)
  const offlineResponse = () => new Response('', { status: 504, statusText: 'Offline' });

  // API Calls - Network Only (nie cachen!)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() =>
        new Response(JSON.stringify({ error: 'Offline' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        })
      )
    );
    return;
  }

  // Images - Cache First + Background Update
  if (request.destination === 'image' || url.pathname.match(/\.(png|jpg|jpeg|svg|webp|gif|ico)$/)) {
    event.respondWith(
      caches.open(IMAGE_CACHE).then((cache) => {
        return cache.match(request).then((cached) => {
          const fetchPromise = fetch(request).then((response) => {
            if (response && response.ok) {
              cache.put(request, response.clone()).catch(() => {});
            }
            return response;
          }).catch(() => cached || offlineResponse());

          return cached || fetchPromise;
        });
      }).catch(() => offlineResponse())
    );
    return;
  }

  // Static Assets (JS/CSS) - Stale-While-Revalidate
  if (url.pathname.match(/\.(js|css|woff2?|ttf|eot)$/)) {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then((cache) => {
        return cache.match(request).then((cached) => {
          const fetchPromise = fetch(request).then((response) => {
            if (response && response.ok) {
              cache.put(request, response.clone()).catch(() => {});
            }
            return response;
          }).catch(() => cached || offlineResponse());

          // Sofort gecachte Version zurückgeben, Update im Hintergrund
          return cached || fetchPromise;
        });
      }).catch(() => offlineResponse())
    );
    return;
  }

  // HTML Pages - Network First mit schnellem Fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      Promise.race([
        fetch(request).then((response) => {
          if (response && response.ok) {
            const clone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, clone);
            });
          }
          return response;
        }),
        new Promise((_, reject) => setTimeout(() => reject(), 3000)) // 3s Timeout
      ]).catch(() => {
        // Fallback zu Cache
        return caches.match(request).then((cached) => {
          if (cached) return cached;
          
          // Minimale Offline Response
          return new Response(`
            <!DOCTYPE html>
            <html lang="de">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Offline - HHRP</title>
              <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { 
                  background: #050505; 
                  color: white; 
                  font-family: -apple-system, system-ui, sans-serif;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  min-height: 100vh;
                  padding: 20px;
                }
                .container { text-align: center; max-width: 400px; }
                h1 { font-size: 3rem; margin-bottom: 1rem; }
                p { color: rgba(255,255,255,0.6); margin-bottom: 2rem; line-height: 1.6; }
                button { 
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  color: white;
                  border: none;
                  padding: 1rem 2rem;
                  border-radius: 12px;
                  font-size: 1rem;
                  font-weight: 600;
                  cursor: pointer;
                  transition: transform 0.2s;
                }
                button:active { transform: scale(0.95); }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>📵</h1>
                <p><strong>Keine Verbindung</strong><br>Bitte überprüfe deine Internetverbindung und versuche es erneut.</p>
                <button onclick="location.reload()">🔄 Erneut versuchen</button>
              </div>
            </body>
            </html>
          `, {
            headers: { 'Content-Type': 'text/html' }
          });
        });
      })
    );
    return;
  }

  // Default: Network First
  event.respondWith(
    fetch(request).catch(() =>
      caches.match(request).then((cached) => cached || offlineResponse())
    )
  );
});

// Message Event
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data?.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
    );
  }
});

// Push Notifications
self.addEventListener('push', (event) => {
  let data = {
    title: '🎮 Hamburg Horizon RP',
    body: 'Neue Benachrichtigung',
    icon: '/icon-512.png',
    badge: '/icon-192.png'
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      console.error('[SW] Push parse error:', e);
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/icon-512.png',
      badge: data.badge || '/icon-192.png',
      vibrate: [200, 100, 200],
      tag: data.tag || 'default',
      data: { url: data.url || '/profil', timestamp: Date.now() }
    })
  );
});

// Notification Click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data.url || '/profil';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
