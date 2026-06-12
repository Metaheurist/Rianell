/* Rianell PWA — versioned cache; user-triggered skipWaiting from app (Update modal). Bump CACHE_NAME when changing SW logic or forcing a full cache reset. */
var CACHE_PREFIX = 'rianell-static-';
var CACHE_NAME = CACHE_PREFIX + 'v2026-06-12-ui-overhaul';

var OFFLINE_HTML =
  '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">' +
  '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">' +
  '<title>Rianell</title></head><body style="font-family:system-ui,sans-serif;background:#070807;color:#e8eeec;' +
  'display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:20px;text-align:center">' +
  '<div><p style="font-size:1.1rem;margin-bottom:1rem">Could not reach Rianell.</p>' +
  '<p style="opacity:.85;margin-bottom:1.5rem">Check your connection, then try again.</p>' +
  '<button type="button" onclick="location.reload()" style="padding:12px 24px;font-size:1rem;background:#4caf50;' +
  'color:#fff;border:none;border-radius:8px;font-weight:600">Reload</button></div></body></html>';

function cachePutSafe(cache, request, response) {
  try {
    if (response && response.ok) return cache.put(request, response.clone());
  } catch (err) {}
  return Promise.resolve();
}

function fetchAndCache(cache, url) {
  return fetch(url, { cache: 'reload' })
    .then(function (res) {
      return cachePutSafe(cache, url, res);
    })
    .catch(function () {});
}

function precacheShell() {
  var urls = ['index.html', 'manifest.json', 'asset-manifest.json'];
  return fetch('asset-manifest.json', { cache: 'no-cache' })
    .then(function (res) {
      if (!res || !res.ok) return urls;
      return res.json().then(function (manifest) {
        if (manifest && manifest.mainJs) urls.push(manifest.mainJs);
        if (manifest && manifest.mainCss) urls.push(manifest.mainCss);
        return urls;
      });
    })
    .catch(function () {
      return urls;
    })
    .then(function (list) {
      return caches.open(CACHE_NAME).then(function (cache) {
        return Promise.all(list.map(function (url) { return fetchAndCache(cache, url); }));
      });
    });
}

function matchCachedDocument() {
  return caches.match('/index.html').then(function (r) {
    if (r) return r;
    return caches.match('index.html');
  });
}

function offlineDocumentResponse() {
  return matchCachedDocument().then(function (cached) {
    if (cached) return cached;
    return new Response(OFFLINE_HTML, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  });
}

self.addEventListener('install', function (e) {
  /* Do not skipWaiting here — page posts SKIP_WAITING when user taps Update */
  e.waitUntil(precacheShell());
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
        fetch(req)
          .then(function (res) {
            if (res && res.ok) {
              return caches.open(CACHE_NAME).then(function (cache) {
                return cachePutSafe(cache, req, res).then(function () { return res; });
              });
            }
            return res;
          })
          .catch(function () {
            return offlineDocumentResponse();
          })
      );
      return;
    }

    var path = url.pathname;
    if (!/\.(js|css|png|svg|json|woff2?|ico|webp)$/i.test(path)) return;

    e.respondWith(
      caches.open(CACHE_NAME).then(function (cache) {
        return fetch(req)
          .then(function (res) {
            return cachePutSafe(cache, req, res).then(function () { return res; });
          })
          .catch(function () {
            return cache.match(req).then(function (cached) {
              if (cached) return cached;
              throw new Error('offline asset miss');
            });
          });
      })
    );
  } catch (err) {}
});
