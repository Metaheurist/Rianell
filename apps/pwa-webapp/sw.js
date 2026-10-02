/* Rianell PWA - versioned cache; user-triggered skipWaiting from app (Update modal). Bump CACHE_NAME when changing SW logic or forcing a full cache reset. */
var CACHE_PREFIX = 'rianell-static-';
var CACHE_NAME = CACHE_PREFIX + 'v2026-10-02-nonblocking-v7';
/** app.<hash>.min.js / styles.<hash>.css never change once published. */
var HASHED_ASSET_RE = /\.[0-9a-f]{10,}(\.min)?\.(js|css)$/i;

var OFFLINE_HTML =
  '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">' +
  '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">' +
  '<title>Rianell</title></head><body style="font-family:system-ui,sans-serif;background:#070807;color:#e8eeec;' +
  'display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:20px;text-align:center">' +
  '<div><p style="font-size:1.1rem;margin-bottom:1rem">Could not reach Rianell.</p>' +
  '<p style="opacity:.85;margin-bottom:1.5rem">Check your connection, then try again.</p>' +
  '<button type="button" onclick="location.reload()" style="padding:12px 24px;font-size:1rem;background:#4caf50;' +
  'color:#fff;border:none;border-radius:8px;font-weight:600">Reload</button></div></body></html>';

/** Same-origin, complete (200), not opaque/redirected, and not marked no-store. */
function isCacheableResponse(response) {
  if (!response || !response.ok || response.status !== 200) return false;
  if (response.type !== 'basic' && response.type !== 'default') return false;
  var cc = (response.headers && response.headers.get('Cache-Control')) || '';
  return !/no-store/i.test(cc);
}

function cachePutSafe(cache, request, response) {
  try {
    if (isCacheableResponse(response)) return cache.put(request, response.clone()).catch(function () {});
  } catch (err) {}
  return Promise.resolve();
}

/** Write to the cache without delaying the response the page is waiting for. */
function cacheInBackground(event, request, response) {
  if (!isCacheableResponse(response)) return;
  var copy = response.clone();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function (cache) { return cache.put(request, copy); })
      .catch(function () {})
  );
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
  /* Do not skipWaiting here - page posts SKIP_WAITING when user taps Update */
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
      // Revalidate HTML with the server so a stale HTTP-cached index.html never boots the previous deploy's bundles.
      e.respondWith(
        fetch(req, { cache: 'no-cache' })
          .then(function (res) {
            cacheInBackground(e, req, res);
            return res;
          })
          .catch(function () {
            return offlineDocumentResponse();
          })
      );
      return;
    }

    var path = url.pathname;
    // Model weights are large and managed by the transformers.js cache, not the shell cache.
    if (path.indexOf('/models/') !== -1 || /\.(onnx|onnx_data|gguf|wasm)$/i.test(path)) return;
    if (!/\.(js|mjs|css|png|svg|json|woff2?|ico|webp)$/i.test(path)) return;

    if (HASHED_ASSET_RE.test(path)) {
      e.respondWith(
        caches.match(req).then(function (cached) {
          if (cached) return cached;
          return fetch(req).then(function (res) {
            cacheInBackground(e, req, res);
            return res;
          });
        })
      );
      return;
    }

    e.respondWith(
      fetch(req)
        .then(function (res) {
          cacheInBackground(e, req, res);
          return res;
        })
        .catch(function () {
          return caches.match(req).then(function (cached) {
            if (cached) return cached;
            throw new Error('offline asset miss');
          });
        })
    );
  } catch (err) {}
});

function parsePushPayload(event) {
  try {
    if (!event.data) return null;
    var text = event.data.text ? event.data.text() : '';
    if (!text) return null;
    return JSON.parse(text);
  } catch (e) {
    return null;
  }
}

function resolveSameOriginPushUrl(url) {
  try {
    var base = self.location.origin;
    var resolved = new URL(url || '/', base);
    if (resolved.origin !== base) return '/';
    return resolved.pathname + resolved.search + resolved.hash;
  } catch (e) {
    return '/';
  }
}

self.addEventListener('push', function (event) {
  var payload = parsePushPayload(event) || {};
  var title = payload.title || 'Rianell';
  var body = payload.message || payload.body || 'An update is available.';
  var data = {
    type: payload.type || 'app_update',
    minCacheVersion: payload.minCacheVersion || null,
    url: resolveSameOriginPushUrl(payload.url || '/'),
  };
  event.waitUntil(
    self.registration.showNotification(title, {
      body: body,
      icon: '/Icons/beta/Icon-192.png',
      badge: '/Icons/beta/Icon-192.png',
      data: data,
    })
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  var data = event.notification && event.notification.data ? event.notification.data : {};
  var targetUrl = resolveSameOriginPushUrl(data.url || '/');
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if ('focus' in client) {
          client.postMessage({ type: 'RIANELL_PUSH_CLICK', data: data });
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});
