// Service Worker DISABLED for delivery
// This file is kept for compatibility but does nothing
console.log('Service Worker: Disabled for delivery - no caching or offline functionality');

// Immediately skip waiting and clear all caches
self.addEventListener('install', event => {
  console.log('Service Worker: Install blocked - disabled for delivery');
  // Skip waiting immediately without caching anything
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  console.log('Service Worker: Activate - clearing all caches and unregistering');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          console.log('Service Worker: Deleting cache', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      // Unregister this service worker
      return self.registration.unregister().then(() => {
        console.log('Service Worker: Unregistered itself');
        return self.clients.claim();
      });
    })
  );
});

self.addEventListener('fetch', event => {
  // Don't intercept any requests - let them go through normally without caching
  // Just return without calling event.respondWith() so browser handles it normally
  return;
});

// Disable all other service worker functionality
self.addEventListener('message', event => {
  // Ignore all messages
  return;
});

self.addEventListener('sync', event => {
  // Ignore sync events
  return;
});

self.addEventListener('push', event => {
  // Ignore push events
  return;
});
