/**
 * Download chunked LLM artifacts, reassemble, and cache for Transformers.js fetch.
 */
(function () {
  'use strict';

  var CACHE_NAME = 'rianell-llm-assembled-v1';
  var assembledBlobUrls = Object.create(null);
  var installedFetch = null;

  function normalizeModelFileEntries(model) {
    var raw = (model && model.files) || [];
    return raw.map(function (entry) {
      if (typeof entry === 'string') {
        return { path: entry, sizeBytes: null, chunks: null };
      }
      return {
        path: String(entry.path || ''),
        sizeBytes: entry.sizeBytes != null ? entry.sizeBytes : null,
        chunks: Array.isArray(entry.chunks) ? entry.chunks.slice() : null,
      };
    }).filter(function (e) { return e.path; });
  }

  function buildModelFileUrl(baseUrl, modelId, revision, filePath) {
    var base = String(baseUrl || '/').replace(/\/?$/, '/');
    var rev = revision || 'main';
    var p = String(filePath || '').replace(/^\/+/, '');
    return base + 'models/' + modelId + '/resolve/' + rev + '/' + p;
  }

  function mergeArrayBuffers(buffers) {
    var total = 0;
    for (var i = 0; i < buffers.length; i += 1) total += buffers[i].byteLength;
    var out = new Uint8Array(total);
    var offset = 0;
    for (var j = 0; j < buffers.length; j += 1) {
      out.set(new Uint8Array(buffers[j]), offset);
      offset += buffers[j].byteLength;
    }
    return out.buffer;
  }

  async function fetchManifest(baseUrl) {
    var url = String(baseUrl || '/').replace(/\/?$/, '/') + 'models/manifest.json';
    var res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('Could not load models manifest (' + res.status + ')');
    return res.json();
  }

  async function downloadAndAssembleFile(baseUrl, modelId, revision, entry, onProgress) {
    var logicalUrl = buildModelFileUrl(baseUrl, modelId, revision, entry.path);
    if (!entry.chunks || !entry.chunks.length) {
      return null;
    }

    if (typeof caches !== 'undefined') {
      try {
        var cache = await caches.open(CACHE_NAME);
        var cached = await cache.match(logicalUrl);
        if (cached) {
          return cached.blob();
        }
      } catch (e) {}
    }

    var buffers = [];
    for (var i = 0; i < entry.chunks.length; i += 1) {
      var chunkPath = entry.chunks[i];
      var chunkUrl = buildModelFileUrl(baseUrl, modelId, revision, chunkPath);
      if (typeof onProgress === 'function') {
        onProgress({ file: entry.path, chunk: i + 1, chunks: entry.chunks.length });
      }
      var res = await fetch(chunkUrl, { cache: 'no-store' });
      if (!res.ok) {
        throw new Error('Chunk download failed (' + res.status + '): ' + chunkUrl);
      }
      buffers.push(await res.arrayBuffer());
    }

    var merged = mergeArrayBuffers(buffers);
    var blob = new Blob([merged], { type: 'application/octet-stream' });

    if (typeof caches !== 'undefined') {
      try {
        var cacheStore = await caches.open(CACHE_NAME);
        await cacheStore.put(logicalUrl, new Response(blob.slice()));
      } catch (e2) {}
    }

    return blob;
  }

  async function preloadChunkedModelFiles(baseUrl, modelId, onProgress) {
    var manifest = await fetchManifest(baseUrl);
    var model = (manifest.models || []).find(function (m) { return m.id === modelId; });
    if (!model) return;

    var entries = normalizeModelFileEntries(model);
    for (var i = 0; i < entries.length; i += 1) {
      var entry = entries[i];
      if (!entry.chunks || !entry.chunks.length) continue;
      var logicalUrl = buildModelFileUrl(baseUrl, modelId, model.revision || 'main', entry.path);
      var blob = await downloadAndAssembleFile(baseUrl, modelId, model.revision || 'main', entry, onProgress);
      if (blob) {
        if (assembledBlobUrls[logicalUrl]) {
          try { URL.revokeObjectURL(assembledBlobUrls[logicalUrl]); } catch (e) {}
        }
        assembledBlobUrls[logicalUrl] = URL.createObjectURL(blob);
      }
    }
  }

  function installModelFetchShim(mod) {
    if (!mod || !mod.env) return;
    if (installedFetch) {
      mod.env.fetch = installedFetch;
      return;
    }
    var orig = (typeof mod.env.fetch === 'function' && mod.env.fetch) ||
      (typeof globalThis.fetch === 'function' && globalThis.fetch.bind(globalThis));
    if (!orig) return;

    installedFetch = async function modelFetch(input, init) {
      var url = typeof input === 'string' ? input : (input && input.url ? input.url : '');
      if (url && assembledBlobUrls[url]) {
        var blobUrl = assembledBlobUrls[url];
        var res = await orig(blobUrl, init);
        return res;
      }
      if (url && typeof caches !== 'undefined') {
        try {
          var cache = await caches.open(CACHE_NAME);
          var hit = await cache.match(url);
          if (hit) return hit;
        } catch (e) {}
      }
      return orig(input, init);
    };

    mod.env.fetch = installedFetch;
  }

  async function clearAssembledModelCache() {
    Object.keys(assembledBlobUrls).forEach(function (key) {
      try {
        URL.revokeObjectURL(assembledBlobUrls[key]);
      } catch (e) {}
      delete assembledBlobUrls[key];
    });
    installedFetch = null;
    if (typeof caches !== 'undefined') {
      try {
        await caches.delete(CACHE_NAME);
      } catch (e) {}
    }
  }

  if (typeof window !== 'undefined') {
    window.RianellModelChunkLoader = {
      preloadChunkedModelFiles: preloadChunkedModelFiles,
      installModelFetchShim: installModelFetchShim,
      clearAssembledModelCache: clearAssembledModelCache,
      normalizeModelFileEntries: normalizeModelFileEntries,
      logicalFilePaths: function (model) {
        return normalizeModelFileEntries(model).map(function (e) { return e.path; });
      },
    };
  }
})();
