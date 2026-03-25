/**
 * Android APK: compare native build to apk/latest.json and prompt to download newer APK.
 * Runs in legacy top-level WebView (Capacitor); no React shell. Matches former react-app App.tsx behavior.
 */
(function () {
  var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("android-update-check.js", "anonymous", arguments) : undefined;
  try {
    var UPDATE_BASE = 'https://rianell.com/';
    function isAndroidNative() {
      var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("android-update-check.js", "isAndroidNative", arguments) : undefined;
      try {
        try {
          var c = window.Capacitor;
          return !!(c && typeof c.isNativePlatform === 'function' && c.isNativePlatform() && typeof c.getPlatform === 'function' && c.getPlatform() === 'android');
        } catch (e) {
          return false;
        }
      } finally {
        __rianellTraceExit(__rt);
      }
    }
    if (!isAndroidNative()) return;
    function openApkUrl(url) {
      var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("android-update-check.js", "openApkUrl", arguments) : undefined;
      try {
        try {
          var B = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Browser;
          if (B && typeof B.open === 'function') {
            B.open({
              url: url
            });
            return;
          }
        } catch (e) {}
        try {
          window.open(url, '_blank');
        } catch (e2) {}
      } finally {
        __rianellTraceExit(__rt);
      }
    }
    function showModal(version, apkUrl) {
      var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("android-update-check.js", "showModal", arguments) : undefined;
      try {
        var overlay = document.createElement('div');
        overlay.setAttribute('data-rianell-apk-update', '1');
        overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:99999;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;padding:24px;';
        var box = document.createElement('div');
        box.style.cssText = 'background:#1e293b;color:#e2e8f0;border-radius:12px;padding:24px;max-width:360px;box-shadow:0 20px 40px rgba(0,0,0,0.3);';
        box.innerHTML = '<h3 style="margin:0 0 12px;font-size:18px;">Update available</h3>' + '<p style="margin:0 0 20px;font-size:14px;opacity:0.9;">A new version (build ' + String(version) + ') is available. Download and install to update.</p>';
        var actions = document.createElement('div');
        actions.style.cssText = 'display:flex;gap:12px;justify-content:flex-end;';
        var later = document.createElement('button');
        later.type = 'button';
        later.textContent = 'Later';
        later.style.cssText = 'padding:10px 18px;border-radius:8px;border:1px solid #475569;background:transparent;color:#e2e8f0;font-size:14px;cursor:pointer;';
        later.addEventListener('click', function () {
          var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("android-update-check.js", "anonymous", arguments) : undefined;
          try {
            overlay.remove();
          } finally {
            __rianellTraceExit(__rt);
          }
        });
        var dl = document.createElement('button');
        dl.type = 'button';
        dl.textContent = 'Download';
        dl.style.cssText = 'padding:10px 18px;border-radius:8px;border:none;background:#4caf50;color:#fff;font-size:14px;cursor:pointer;';
        dl.addEventListener('click', function () {
          var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("android-update-check.js", "anonymous", arguments) : undefined;
          try {
            openApkUrl(apkUrl);
          } finally {
            __rianellTraceExit(__rt);
          }
        });
        actions.appendChild(later);
        actions.appendChild(dl);
        box.appendChild(actions);
        overlay.appendChild(box);
        document.body.appendChild(overlay);
      } finally {
        __rianellTraceExit(__rt);
      }
    }
    function run() {
      var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("android-update-check.js", "run", arguments) : undefined;
      try {
        try {
          var AppPlugin = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App;
          if (!AppPlugin || typeof AppPlugin.getInfo !== 'function') return;
          AppPlugin.getInfo().then(function (info) {
            var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("android-update-check.js", "anonymous", arguments) : undefined;
            try {
              var currentBuild = parseInt(String(info && info.build || '0'), 10) || 0;
              var base = UPDATE_BASE.replace(/\/?$/, '/');
              return fetch(base + 'apk/latest.json', {
                cache: 'no-store'
              }).then(function (res) {
                var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("android-update-check.js", "anonymous", arguments) : undefined;
                try {
                  if (!res.ok) return;
                  return res.json().then(function (data) {
                    var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("android-update-check.js", "anonymous", arguments) : undefined;
                    try {
                      if (!data || !data.version || !data.file) return;
                      if (data.version <= currentBuild) return;
                      showModal(data.version, base + 'apk/' + data.file);
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
          }).catch(function () {
            var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("android-update-check.js", "anonymous", arguments) : undefined;
            try {} finally {
              __rianellTraceExit(__rt);
            }
          });
        } catch (e) {}
      } finally {
        __rianellTraceExit(__rt);
      }
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', run);
    } else {
      run();
    }
  } finally {
    __rianellTraceExit(__rt);
  }
})();