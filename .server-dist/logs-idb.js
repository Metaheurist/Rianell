/**
 * IndexedDB mirror for health logs (async backup; localStorage remains primary for sync boot).
 */
(function () {
  'use strict';

  var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("logs-idb.js", "anonymous", arguments) : undefined;
  try {
    var DB_NAME_LEGACY = 'health-app-logs-v1';
    var DB_NAME = 'rianell-logs-v1';
    var STORE = 'kv';
    var KEY = 'healthLogsJson';
    var mirrorTimer = null;
    var legacyMigrated = false;
    function openDb() {
      var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("logs-idb.js", "openDb", arguments) : undefined;
      try {
        return new Promise(function (resolve, reject) {
          var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("logs-idb.js", "anonymous", arguments) : undefined;
          try {
            var r = indexedDB.open(DB_NAME, 1);
            r.onupgradeneeded = function () {
              var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("logs-idb.js", "anonymous", arguments) : undefined;
              try {
                r.result.createObjectStore(STORE);
              } finally {
                __rianellTraceExit(__rt);
              }
            };
            r.onsuccess = function () {
              var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("logs-idb.js", "anonymous", arguments) : undefined;
              try {
                resolve(r.result);
              } finally {
                __rianellTraceExit(__rt);
              }
            };
            r.onerror = function () {
              var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("logs-idb.js", "anonymous", arguments) : undefined;
              try {
                reject(r.error);
              } finally {
                __rianellTraceExit(__rt);
              }
            };
          } finally {
            __rianellTraceExit(__rt);
          }
        });
      } finally {
        __rianellTraceExit(__rt);
      }
    }
    function openLegacyDb() {
      var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("logs-idb.js", "openLegacyDb", arguments) : undefined;
      try {
        return new Promise(function (resolve, reject) {
          var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("logs-idb.js", "anonymous", arguments) : undefined;
          try {
            var r = indexedDB.open(DB_NAME_LEGACY, 1);
            r.onupgradeneeded = function () {
              var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("logs-idb.js", "anonymous", arguments) : undefined;
              try {
                try {
                  r.result.createObjectStore(STORE);
                } catch (e) {}
              } finally {
                __rianellTraceExit(__rt);
              }
            };
            r.onsuccess = function () {
              var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("logs-idb.js", "anonymous", arguments) : undefined;
              try {
                resolve(r.result);
              } finally {
                __rianellTraceExit(__rt);
              }
            };
            r.onerror = function () {
              var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("logs-idb.js", "anonymous", arguments) : undefined;
              try {
                reject(r.error);
              } finally {
                __rianellTraceExit(__rt);
              }
            };
          } finally {
            __rianellTraceExit(__rt);
          }
        });
      } finally {
        __rianellTraceExit(__rt);
      }
    }
    function put(key, val) {
      var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("logs-idb.js", "put", arguments) : undefined;
      try {
        return openDb().then(function (db) {
          var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("logs-idb.js", "anonymous", arguments) : undefined;
          try {
            return new Promise(function (resolve, reject) {
              var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("logs-idb.js", "anonymous", arguments) : undefined;
              try {
                var tx = db.transaction(STORE, 'readwrite');
                tx.objectStore(STORE).put(val, key);
                tx.oncomplete = function () {
                  var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("logs-idb.js", "anonymous", arguments) : undefined;
                  try {
                    resolve();
                  } finally {
                    __rianellTraceExit(__rt);
                  }
                };
                tx.onerror = function () {
                  var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("logs-idb.js", "anonymous", arguments) : undefined;
                  try {
                    reject(tx.error);
                  } finally {
                    __rianellTraceExit(__rt);
                  }
                };
              } finally {
                __rianellTraceExit(__rt);
              }
            });
          } finally {
            __rianellTraceExit(__rt);
          }
        });
      } finally {
        __rianellTraceExit(__rt);
      }
    }
    function get(key) {
      var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("logs-idb.js", "get", arguments) : undefined;
      try {
        return openDb().then(function (db) {
          var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("logs-idb.js", "anonymous", arguments) : undefined;
          try {
            return new Promise(function (resolve, reject) {
              var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("logs-idb.js", "anonymous", arguments) : undefined;
              try {
                var tx = db.transaction(STORE, 'readonly');
                var req = tx.objectStore(STORE).get(key);
                req.onsuccess = function () {
                  var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("logs-idb.js", "anonymous", arguments) : undefined;
                  try {
                    resolve(req.result);
                  } finally {
                    __rianellTraceExit(__rt);
                  }
                };
                req.onerror = function () {
                  var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("logs-idb.js", "anonymous", arguments) : undefined;
                  try {
                    reject(req.error);
                  } finally {
                    __rianellTraceExit(__rt);
                  }
                };
              } finally {
                __rianellTraceExit(__rt);
              }
            });
          } finally {
            __rianellTraceExit(__rt);
          }
        });
      } finally {
        __rianellTraceExit(__rt);
      }
    }
    function migrateLegacyIdbOnce() {
      var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("logs-idb.js", "migrateLegacyIdbOnce", arguments) : undefined;
      try {
        if (legacyMigrated) return Promise.resolve();
        legacyMigrated = true;
        return get(KEY).then(function (existing) {
          var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("logs-idb.js", "anonymous", arguments) : undefined;
          try {
            if (existing) return;
            return openLegacyDb().then(function (legDb) {
              var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("logs-idb.js", "anonymous", arguments) : undefined;
              try {
                return new Promise(function (resolve) {
                  var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("logs-idb.js", "anonymous", arguments) : undefined;
                  try {
                    try {
                      var tx = legDb.transaction(STORE, 'readonly');
                      var req = tx.objectStore(STORE).get(KEY);
                      req.onsuccess = function () {
                        var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("logs-idb.js", "anonymous", arguments) : undefined;
                        try {
                          var val = req.result;
                          try {
                            legDb.close();
                          } catch (e) {}
                          if (!val) {
                            resolve();
                            return;
                          }
                          put(KEY, val).then(resolve).catch(resolve);
                        } finally {
                          __rianellTraceExit(__rt);
                        }
                      };
                      req.onerror = function () {
                        var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("logs-idb.js", "anonymous", arguments) : undefined;
                        try {
                          try {
                            legDb.close();
                          } catch (e) {}
                          resolve();
                        } finally {
                          __rianellTraceExit(__rt);
                        }
                      };
                    } catch (e) {
                      try {
                        legDb.close();
                      } catch (e2) {}
                      resolve();
                    }
                  } finally {
                    __rianellTraceExit(__rt);
                  }
                });
              } finally {
                __rianellTraceExit(__rt);
              }
            }).catch(function () {
              var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("logs-idb.js", "anonymous", arguments) : undefined;
              try {} finally {
                __rianellTraceExit(__rt);
              }
            });
          } finally {
            __rianellTraceExit(__rt);
          }
        }).catch(function () {
          var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("logs-idb.js", "anonymous", arguments) : undefined;
          try {} finally {
            __rianellTraceExit(__rt);
          }
        });
      } finally {
        __rianellTraceExit(__rt);
      }
    }
    function scheduleMirror(logs) {
      var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("logs-idb.js", "scheduleMirror", arguments) : undefined;
      try {
        if (mirrorTimer) clearTimeout(mirrorTimer);
        mirrorTimer = setTimeout(function () {
          var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("logs-idb.js", "anonymous", arguments) : undefined;
          try {
            mirrorTimer = null;
            try {
              migrateLegacyIdbOnce().then(function () {
                var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("logs-idb.js", "anonymous", arguments) : undefined;
                try {
                  return put(KEY, JSON.stringify(logs));
                } finally {
                  __rianellTraceExit(__rt);
                }
              }).catch(function () {
                var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("logs-idb.js", "anonymous", arguments) : undefined;
                try {} finally {
                  __rianellTraceExit(__rt);
                }
              });
            } catch (e) {}
          } finally {
            __rianellTraceExit(__rt);
          }
        }, 400);
      } finally {
        __rianellTraceExit(__rt);
      }
    }
    function migrateFromLocalStorageOnce() {
      var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("logs-idb.js", "migrateFromLocalStorageOnce", arguments) : undefined;
      try {
        return migrateLegacyIdbOnce().then(function () {
          var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("logs-idb.js", "anonymous", arguments) : undefined;
          try {
            return get(KEY).then(function (idbVal) {
              var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("logs-idb.js", "anonymous", arguments) : undefined;
              try {
                if (idbVal) return;
                try {
                  var raw = localStorage.getItem('healthLogs');
                  if (!raw) return;
                  return put(KEY, raw);
                } catch (e) {}
              } finally {
                __rianellTraceExit(__rt);
              }
            }).catch(function () {
              var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("logs-idb.js", "anonymous", arguments) : undefined;
              try {} finally {
                __rianellTraceExit(__rt);
              }
            });
          } finally {
            __rianellTraceExit(__rt);
          }
        });
      } finally {
        __rianellTraceExit(__rt);
      }
    }
    window.RianellLogsIDB = {
      scheduleMirror: scheduleMirror,
      migrateFromLocalStorageOnce: migrateFromLocalStorageOnce,
      getRaw: function () {
        var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("logs-idb.js", "anonymous", arguments) : undefined;
        try {
          return get(KEY);
        } finally {
          __rianellTraceExit(__rt);
        }
      }
    };
    window.HealthLogsIDB = window.RianellLogsIDB; // deprecated alias
  } finally {
    __rianellTraceExit(__rt);
  }
})();