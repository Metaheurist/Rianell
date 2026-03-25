/**
 * IndexedDB mirror for health logs (async backup; localStorage remains primary for sync boot).
 */
(function () {
  'use strict';
  var DB_NAME_LEGACY = 'health-app-logs-v1';
  var DB_NAME = 'rianell-logs-v1';
  var STORE = 'kv';
  var KEY = 'healthLogsJson';
  var mirrorTimer = null;
  var legacyMigrated = false;

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

  function openLegacyDb() {
    return new Promise(function (resolve, reject) {
      var r = indexedDB.open(DB_NAME_LEGACY, 1);
      r.onupgradeneeded = function () {
        try { r.result.createObjectStore(STORE); } catch (e) {}
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

  function migrateLegacyIdbOnce() {
    if (legacyMigrated) return Promise.resolve();
    legacyMigrated = true;
    return get(KEY).then(function (existing) {
      if (existing) return;
      return openLegacyDb().then(function (legDb) {
        return new Promise(function (resolve) {
          try {
            var tx = legDb.transaction(STORE, 'readonly');
            var req = tx.objectStore(STORE).get(KEY);
            req.onsuccess = function () {
              var val = req.result;
              try { legDb.close(); } catch (e) {}
              if (!val) {
                resolve();
                return;
              }
              put(KEY, val).then(resolve).catch(resolve);
            };
            req.onerror = function () {
              try { legDb.close(); } catch (e) {}
              resolve();
            };
          } catch (e) {
            try { legDb.close(); } catch (e2) {}
            resolve();
          }
        });
      }).catch(function () {});
    }).catch(function () {});
  }

  function scheduleMirror(logs) {
    if (mirrorTimer) clearTimeout(mirrorTimer);
    mirrorTimer = setTimeout(function () {
      mirrorTimer = null;
      try {
        migrateLegacyIdbOnce().then(function () {
          return put(KEY, JSON.stringify(logs));
        }).catch(function () {});
      } catch (e) {}
    }, 400);
  }

  function migrateFromLocalStorageOnce() {
    return migrateLegacyIdbOnce().then(function () {
      return get(KEY).then(function (idbVal) {
        if (idbVal) return;
        try {
          var raw = localStorage.getItem('healthLogs');
          if (!raw) return;
          return put(KEY, raw);
        } catch (e) {}
      }).catch(function () {});
    });
  }

  window.RianellLogsIDB = {
    scheduleMirror: scheduleMirror,
    migrateFromLocalStorageOnce: migrateFromLocalStorageOnce,
    getRaw: function () { return get(KEY); }
  };
  window.HealthLogsIDB = window.RianellLogsIDB; // deprecated alias
})();
