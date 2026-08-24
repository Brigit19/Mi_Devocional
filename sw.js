const CACHE_NAME = 'midevocional-v1';
const URLS_TO_CACHE = [
  '/Mi_Devocional/',
  '/Mi_Devocional/index.html',
  '/Mi_Devocional/manifest.json'
];

// Instalación
self.addEventListener('install', event => {
  console.log('🔧 Service Worker instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('💾 Cacheando archivos');
      return cache.addAll(URLS_TO_CACHE).catch(() => {
        console.log('⚠️ Algunos archivos no pudieron cachearse (normal en desarrollo)');
        return Promise.resolve();
      });
    })
  );
  self.skipWaiting();
});

// Activación
self.addEventListener('activate', event => {
  console.log('✅ Service Worker activado');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Eliminando cache viejo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch - Network first, fallback to cache
self.addEventListener('fetch', event => {
  const { request } = event;
  
  // Para archivos de API/Firebase, intenta red primero
  if (request.url.includes('firestore') || request.url.includes('firebase')) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response('Offline - Firestore no disponible', {
          status: 503,
          statusText: 'Service Unavailable'
        });
      })
    );
    return;
  }
  
  // Para otros recursos, intenta cache primero, luego red
  event.respondWith(
    caches.match(request).then(response => {
      return response || fetch(request).then(response => {
        // Cachear la respuesta si es válida
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(request, responseToCache);
        });
        return response;
      }).catch(() => {
        // Si falla, mostrar página offline
        if (request.destination === 'document') {
          return caches.match('/Mi_Devocional/index.html');
        }
        return new Response('Offline', { status: 503 });
      });
    })
  );
});

console.log('✅ Service Worker cargado y listo');
