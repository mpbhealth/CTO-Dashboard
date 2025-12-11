// Service Worker for MPB Health Dashboard PWA
// Version is set at build time for proper cache invalidation
const VERSION = '2.0.2';
const CACHE_NAME = 'mpb-dashboard-v' + VERSION;
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  // Don't pre-cache hashed assets - they change on each build
];

console.log('[SW] Service Worker version:', VERSION);

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

  const requestUrl = new URL(event.request.url);

  // Skip external API calls (Supabase, third-party APIs)
  // Only cache same-origin requests
  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  // Skip API endpoints and data requests
  if (requestUrl.pathname.startsWith('/rest/') ||
      requestUrl.pathname.startsWith('/auth/') ||
      requestUrl.pathname.startsWith('/storage/') ||
      requestUrl.pathname.startsWith('/functions/')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Only cache successful responses from same origin
        if (response.status === 200 && requestUrl.origin === self.location.origin) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          }).catch((err) => {
            console.warn('Cache storage failed:', err);
          });
        }
        return response;
      })
      .catch((error) => {
        // Fallback to cache only if network fails
        return caches.match(event.request).then((response) => {
          if (response) {
            return response;
          }
          // For SPA routes, return cached index.html
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html').then((indexResponse) => {
              if (indexResponse) {
                return indexResponse;
              }
              // Return a basic offline page response
              return new Response('App is offline. Please check your connection.', {
                status: 503,
                statusText: 'Service Unavailable',
                headers: new Headers({
                  'Content-Type': 'text/plain'
                })
              });
            });
          }
          // For other requests, return a simple error response instead of throwing
          console.warn('Network request failed and no cache available:', event.request.url);
          return new Response('', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating version:', VERSION);
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      console.log('[SW] Found caches:', cacheNames);
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete all caches except current version
          if (cacheName !== CACHE_NAME && cacheName.startsWith('mpb-dashboard-v')) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Cache cleanup complete, claiming clients');
      return self.clients.claim();
    })
  );
});