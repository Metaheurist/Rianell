/* Rianell PWA — versioned cache; user-triggered skipWaiting from app (Update modal). Bump CACHE_NAME when changing SW logic or forcing a full cache reset. */
var CACHE_PREFIX = 'rianell-static-';
var CACHE_NAME = CACHE_PREFIX + 'v2026-03-29-2';

self.addEventListener('install', function () {
  /* Do not skipWaiting here — page posts SKIP_WAITING when user taps Update */
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches
      .keys()
      .then(function (keys) {
        return Promise.all(
          keys.map(function (key) {
            if (key.indexOf(CACHE_PREFIX) === 0 && key !== CACHE_NAME) {
              return caches.delete(key);
            }
          })
        );
      })
      .then(function () {
        return self.clients.claim();
      })
  );
});

self.addEventListener('message', function (e) {
  if (e.data && e.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  try {
    var url = new URL(req.url);
    if (url.origin !== self.location.origin) return;

    var accept = req.headers.get('accept') || '';
    if (req.mode === 'navigate' || accept.indexOf('text/html') !== -1) {
      e.respondWith(
        fetch(req).then(
          function (res) {
            return res;
          },
          function () {
            return caches.match('/index.html').then(function (r) {
              return r || caches.match('index.html');
            });
          }
        )
      );
      return;
    }

    var path = url.pathname;
    if (!/\.(js|css|png|svg|json|woff2?|ico|webp)$/i.test(path)) return;

    e.respondWith(
      caches.open(CACHE_NAME).then(function (cache) {
        return fetch(req)
          .then(function (res) {
            if (res && res.ok) cache.put(req, res.clone());
            return res;
          })
          .catch(function () {
            return cache.match(req);
          });
      })
    );
  } catch (err) {}
});
