/* Optional static asset cache (register only when healthAppEnableStaticSW=1 or ?sw=1). */
var CACHE = 'health-app-static-v1';

self.addEventListener('install', function (e) {
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  try {
    var url = new URL(req.url);
    if (url.origin !== self.location.origin) return;
    var path = url.pathname;
    if (!/\.(js|css|png|svg|json|woff2?|ico|webp)$/i.test(path)) return;
    e.respondWith(
      caches.open(CACHE).then(function (cache) {
        return cache.match(req).then(function (cached) {
          if (cached) return cached;
          return fetch(req).then(function (res) {
            if (res && res.ok) cache.put(req, res.clone());
            return res;
          });
        });
      })
    );
  } catch (err) {}
});
