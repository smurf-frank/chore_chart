const CACHE_NAME = 'chore-chart-v2';
const ASSETS = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './repository.js',
    './db.js',
    './manifest.json',
    'https://sql.js.org/dist/sql-wasm.js',
    'https://sql.js.org/dist/sql-wasm.wasm',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Outfit:wght@400;700&display=swap'
];

// Pre-cache assets on install
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
    // Activate immediately instead of waiting
    self.skipWaiting();
});

// Network-first strategy: always try the network, fall back to cache (offline)
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Clone and update the cache with the fresh response
                const clone = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, clone);
                });
                return response;
            })
            .catch(() => {
                // Network failed — serve from cache (offline mode)
                return caches.match(event.request);
            })
    );
});

// Clean up old caches on activate
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                // Take control of all clients immediately
                return self.clients.claim();
            })
    );
});
