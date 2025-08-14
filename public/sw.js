// Service Worker for MPB Health CTO Dashboard PWA
const CACHE_NAME = 'mpb-dashboard-v2-' + new Date().getTime(); // Bust cache on each deploy
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  // Don't pre-cache hashed assets - they change on each build
];

// Install event - cache important files
self.addEventListener('install', (event) => {
  console.log('SW installing with cache:', CACHE_NAME);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip chrome-extension and other protocols
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Only cache successful responses
        if (response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache only if network fails
        return caches.match(event.request).then((response) => {
          if (response) {
            return response;
          }
          // For SPA routes, return cached index.html
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          throw new Error('Network failed and no cache available');
        });
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('SW activating, cleaning old caches');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheName.startsWith('mpb-dashboard-v2-')) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Claim all clients immediately
  return self.clients.claim();
});