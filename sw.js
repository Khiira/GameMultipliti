// Service Worker para funcionamiento 100% offline
const CACHE_NAME = 'peke-tablas-cache-v7';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/three.min.js',
  '/peke3d.js',
  '/manifest.json',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Intentar cachear todos los archivos individualmente para evitar fallos por redirección
      for (const asset of ASSETS_TO_CACHE) {
        try {
          await cache.add(asset);
        } catch (err) {
          console.warn('Recurso en cache omitido o redirigido:', asset);
        }
      }
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Estrategia Cache-First infalible para navegación y recursos
self.addEventListener('fetch', (e) => {
  // Manejo de navegación (abrir la app, recargas, etc.)
  if (e.request.mode === 'navigate' || e.request.destination === 'document') {
    e.respondWith(
      caches.match(e.request)
        .then((cached) => cached || caches.match('/') || caches.match('/index.html') || caches.match('./index.html') || caches.match('./'))
        .then((foundDoc) => {
          if (foundDoc) return foundDoc;
          return fetch(e.request).then((networkRes) => {
            if (networkRes && networkRes.status === 200) {
              const clone = networkRes.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(e.request, clone);
                cache.put('/', clone.clone());
              });
            }
            return networkRes;
          });
        })
        .catch(() => caches.match('/') || caches.match('/index.html') || caches.match('./index.html') || caches.match('./'))
    );
    return;
  }

  // Manejo para el resto de archivos (css, js, imágenes)
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(e.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseToCache);
          });
        }
        return networkResponse;
      });
    })
  );
});
