/**
 * IndexedDB mirror for health logs (async backup; localStorage remains primary for sync boot).
 */
(function () {
  'use strict';
  var DB_NAME = 'health-app-logs-v1';
  var STORE = 'kv';
  var KEY = 'healthLogsJson';
  var mirrorTimer = null;

  function openDb() {
    return new Promise(function (resolve, reject) {
      var r = indexedDB.open(DB_NAME, 1);
      r.onupgradeneeded = function () {
        r.result.createObjectStore(STORE);
      };
      r.onsuccess = function () { resolve(r.result); };
      r.onerror = function () { reject(r.error); };
    });
  }

  function put(key, val) {
    return openDb().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).put(val, key);
        tx.oncomplete = function () { resolve(); };
        tx.onerror = function () { reject(tx.error); };
      });
    });
  }

  function get(key) {
    return openDb().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(STORE, 'readonly');
        var req = tx.objectStore(STORE).get(key);
        req.onsuccess = function () { resolve(req.result); };
        req.onerror = function () { reject(req.error); };
      });
    });
  }

  function scheduleMirror(logs) {
    if (mirrorTimer) clearTimeout(mirrorTimer);
    mirrorTimer = setTimeout(function () {
      mirrorTimer = null;
      try {
        put(KEY, JSON.stringify(logs)).catch(function () {});
      } catch (e) {}
    }, 400);
  }

  function migrateFromLocalStorageOnce() {
    return get(KEY).then(function (idbVal) {
      if (idbVal) return;
      try {
        var raw = localStorage.getItem('healthLogs');
        if (!raw) return;
        return put(KEY, raw);
      } catch (e) {}
    }).catch(function () {});
  }

  window.HealthLogsIDB = {
    scheduleMirror: scheduleMirror,
    migrateFromLocalStorageOnce: migrateFromLocalStorageOnce,
    getRaw: function () { return get(KEY); }
  };
})();
