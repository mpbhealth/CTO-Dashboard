// Service Worker for MPB Health Dashboard PWA
// Version is set at build time for proper cache invalidation
const VERSION = '2.1.0';
const CACHE_NAME = 'mpb-dashboard-v' + VERSION;
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  // Don't pre-cache hashed assets - they change on each build
];

console.log('[SW] Service Worker version:', VERSION);

// ============================================
// NOTIFICATION HANDLING
// ============================================

// Default notification options
const DEFAULT_NOTIFICATION_OPTIONS = {
  icon: '/icons/icon-192.svg',
  badge: '/icons/icon-32x32.svg',
  vibrate: [100, 50, 100],
  requireInteraction: false,
};

// Priority-based notification settings
const PRIORITY_CONFIG = {
  critical: {
    requireInteraction: true,
    vibrate: [200, 100, 200, 100, 200],
    tag: 'critical',
  },
  high: {
    requireInteraction: true,
    vibrate: [150, 75, 150],
    tag: 'high',
  },
  info: {
    requireInteraction: false,
    vibrate: [100, 50, 100],
    tag: 'info',
  },
};

// Handle push notifications from server
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  let data = {
    title: 'MPB Health Dashboard',
    body: 'You have a new notification',
    priority: 'info',
    data: {},
  };
  
  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      console.warn('[SW] Failed to parse push data:', e);
      data.body = event.data.text();
    }
  }
  
  const priorityConfig = PRIORITY_CONFIG[data.priority] || PRIORITY_CONFIG.info;
  
  const options = {
    ...DEFAULT_NOTIFICATION_OPTIONS,
    ...priorityConfig,
    body: data.body,
    data: data.data || {},
    timestamp: Date.now(),
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification click - navigate to relevant page
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification.tag);
  
  event.notification.close();
  
  const notificationData = event.notification.data || {};
  const targetUrl = notificationData.url || '/';
  
  // Handle action button clicks
  if (event.action) {
    console.log('[SW] Action clicked:', event.action);
    switch (event.action) {
      case 'view':
        // Navigate to the notification source
        break;
      case 'dismiss':
        // Just close the notification (already done above)
        return;
      case 'acknowledge':
        // Could send acknowledgment back to server
        break;
    }
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            // Navigate existing window to target URL
            client.navigate(targetUrl);
            return client.focus();
          }
        }
        // No existing window - open a new one
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});

// Handle notification close (for analytics/tracking)
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed:', event.notification.tag);
});

// Listen for messages from the main app
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data.payload;
    const priorityConfig = PRIORITY_CONFIG[options.priority] || PRIORITY_CONFIG.info;
    
    self.registration.showNotification(title, {
      ...DEFAULT_NOTIFICATION_OPTIONS,
      ...priorityConfig,
      ...options,
    });
  }
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ============================================
// CACHING AND OFFLINE SUPPORT
// ============================================

// Install event - cache important files
self.addEventListener('install', (event) => {
  console.log('[SW] Installing with cache:', CACHE_NAME);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Opened cache');
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
            console.warn('[SW] Cache storage failed:', err);
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
          console.warn('[SW] Network request failed and no cache available:', event.request.url);
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
