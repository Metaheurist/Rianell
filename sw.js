const CACHE_NAME = 'health-dashboard-v2.0.0'; // Updated for lazy loading optimizations
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/manifest.json',
  '/apexcharts.min.js', // Local ApexCharts file
  // User's actual icon files
  '/Icons/Icon-16.png',
  '/Icons/Icon-32.png',
  '/Icons/Icon-48.png',
  '/Icons/Icon-72.png',
  '/Icons/Icon-96.png',
  '/Icons/Icon-128.png',
  '/Icons/Icon-144.png',
  '/Icons/Icon-152.png',
  '/Icons/Icon-180.png',
  '/Icons/Icon-192.png',
  '/Icons/Icon-256.png',
  '/Icons/Icon-384.png',
  '/Icons/Icon-512.png'
];

// Install event - cache resources
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching files');
        return cache.addAll(urlsToCache.filter(url => !url.startsWith('/Icons/'))) // Cache main files first
          .then(() => {
            // Cache icons individually to avoid failing on missing files
            return Promise.all(
              urlsToCache.filter(url => url.startsWith('/Icons/')).map(url => {
                return cache.add(url).catch(err => {
                  console.log(`Failed to cache icon ${url}:`, err);
                });
              })
            );
          })
          .catch(err => {
            console.log('Service Worker: Cache addAll failed:', err);
          });
      })
      .then(() => {
        console.log('Service Worker: Install complete');
        return self.skipWaiting(); // Activate immediately
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Activate complete');
      return self.clients.claim(); // Take control immediately
    })
  );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension, chrome:, and other non-http requests
  const url = event.request.url;
  if (!url.startsWith('http') || url.startsWith('chrome-extension://') || url.startsWith('chrome://')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        if (response) {
          console.log('Service Worker: Serving from cache:', event.request.url);
          return response;
        }

        console.log('Service Worker: Fetching from network:', event.request.url);
        return fetch(event.request).then(response => {
          // Don't cache if not a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          // Cache asynchronously (don't block response)
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache).catch(err => {
                console.debug('Failed to cache response:', err);
              });
            })
            .catch(err => {
              console.debug('Failed to open cache:', err);
            });

          return response;
        }).catch(err => {
          // Network error - return cached version if available, or undefined
          console.debug('Network fetch failed:', err);
          return undefined;
        });
      })
      .catch(() => {
        // If both cache and network fail, show offline page for navigation requests
        if (event.request.destination === 'document') {
          return caches.match('/index.html');
        }
      })
  );
});

// Background sync for health data
self.addEventListener('sync', event => {
  if (event.tag === 'health-data-sync') {
    console.log('Service Worker: Background sync triggered');
    event.waitUntil(
      // Add any background sync logic here
      // For example, syncing data when connection is restored
      Promise.resolve()
    );
  }
});

// Push notifications (for daily reminders)
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'Time to log your daily health data!',
    icon: '/Icons/Icon-192.png',
    badge: '/Icons/Icon-72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'log-now',
        title: 'Log Now',
        icon: '/Icons/Icon-128.png'
      },
      {
        action: 'remind-later',
        title: 'Remind Later',
        icon: '/Icons/Icon-128.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Your\'s Health Dashboard Reminder', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();

  event.waitUntil(
    (async () => {
      try {
        const url = event.notification.data?.url || '/';
        
        if (event.action === 'open' || event.action === 'log-now') {
          // Open the app
          const clientList = await clients.matchAll({ type: 'window', includeUncontrolled: true });
          
          // Check if app is already open
          for (const client of clientList) {
            if (client.url.includes(self.location.origin) && 'focus' in client) {
              await client.focus();
              await client.navigate(url);
              return;
            }
          }
          
          // Open new window
          await clients.openWindow(url);
        } else if (event.action === 'dismiss' || event.action === 'remind-later') {
          // User dismissed, do nothing
          console.log('User dismissed notification');
        } else {
          // Default action - open the app
          const clientList = await clients.matchAll({ type: 'window', includeUncontrolled: true });
          for (const client of clientList) {
            if (client.url.includes(self.location.origin) && 'focus' in client) {
              await client.focus();
              await client.navigate(url);
              return;
            }
          }
          await clients.openWindow(url);
        }
      } catch (error) {
        // Silently handle errors (e.g., if window was already closed)
        console.debug('Notification click handler error:', error);
      }
    })()
  );
});

// Performance monitoring
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
