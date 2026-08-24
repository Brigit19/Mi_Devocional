const CACHE_NAME = 'midevocional-v2026-08-24-final';

self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('💾 Cache abierto');
      return cache.addAll([
        '/Mi_Devocional/',
        '/Mi_Devocional/index.html',
        '/Mi_Devocional/manifest.json'
      ]).catch(() => Promise.resolve());
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker activado');
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

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) return response;
      
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200) return response;
        
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        
        return response;
      }).catch(() => {
        return caches.match('/Mi_Devocional/index.html');
      });
    })
  );
});
