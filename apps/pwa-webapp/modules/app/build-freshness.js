/**
 * Stale-shell detection: a browser- or edge-cached index.html can boot the previous deploy.
 * The page's <meta name="rianell-build"> is compared with the live asset-manifest.json buildId;
 * on a mismatch the page reloads once before the user interacts, otherwise offers a reload.
 * No imports: app.js bundles this module and tests load it directly.
 */

var RELOAD_GUARD_KEY = 'rianellBuildReload';

/** @returns {'none'|'reload'|'prompt'} */
function decideBuildFreshnessAction(opts) {
  var page = opts && opts.pageBuild;
  var latest = opts && opts.latestBuild;
  if (!page || !latest || page === latest) return 'none';
  if (opts.lastReloadFor === latest) return 'none';
  return opts.interacted ? 'prompt' : 'reload';
}

function readPageBuildId(doc) {
  try {
    var meta = doc && doc.querySelector && doc.querySelector('meta[name="rianell-build"]');
    var id = meta && meta.getAttribute('content');
    return id ? String(id).trim() : '';
  } catch (e) {
    return '';
  }
}

/**
 * @param {object} deps
 * @param {Document} deps.document
 * @param {Window} deps.window
 * @param {(url: string, init: object) => Promise<Response>} deps.fetch
 * @param {(message: string, title: string, onConfirm: Function, onCancel: Function, opts: object) => void} [deps.confirm]
 * @param {() => void} [deps.reload]
 * @returns {Promise<'none'|'reload'|'prompt'|'skipped'>}
 */
function checkBuildFreshness(deps) {
  var win = deps.window;
  var pageBuild = readPageBuildId(deps.document);
  if (!pageBuild) return Promise.resolve('skipped');
  if (win.navigator && win.navigator.onLine === false) return Promise.resolve('skipped');

  return deps
    .fetch('asset-manifest.json', { cache: 'no-store' })
    .then(function (res) {
      if (!res || !res.ok) return null;
      return res.json();
    })
    .then(function (manifest) {
      var latestBuild = manifest && manifest.buildId ? String(manifest.buildId) : '';
      var storage = null;
      try { storage = win.sessionStorage; } catch (e) {}
      var lastReloadFor = '';
      try { lastReloadFor = (storage && storage.getItem(RELOAD_GUARD_KEY)) || ''; } catch (e) {}
      var activation = win.navigator && win.navigator.userActivation;
      var interacted = !!(win.__rianellUserInteracted || (activation && activation.hasBeenActive));

      var action = decideBuildFreshnessAction({ pageBuild: pageBuild, latestBuild: latestBuild, lastReloadFor: lastReloadFor, interacted: interacted });
      if (action === 'none') return action;
      try { if (storage) storage.setItem(RELOAD_GUARD_KEY, latestBuild); } catch (e) {}
      var reload = deps.reload || function () { win.location.reload(); };
      if (action === 'reload') {
        reload();
        return action;
      }
      if (win.__rianellPwaUpdateModalShown || typeof deps.confirm !== 'function') return 'none';
      win.__rianellPwaUpdateModalShown = true;
      deps.confirm(
        'A new version of Rianell is available. Reload now to get the latest fixes and features. Your saved data on this device is kept.',
        'Update available',
        function () { reload(); },
        function () { win.__rianellPwaUpdateModalShown = false; },
        { confirmText: 'Reload', cancelText: 'Later' }
      );
      return action;
    })
    .catch(function () {
      return 'skipped';
    });
}

function trackFirstInteraction(win) {
  function mark() {
    win.__rianellUserInteracted = true;
    win.removeEventListener('pointerdown', mark, true);
    win.removeEventListener('keydown', mark, true);
  }
  win.addEventListener('pointerdown', mark, true);
  win.addEventListener('keydown', mark, true);
}

/** Runs the check when the main thread is idle so it never competes with boot. */
function scheduleBuildFreshnessCheck(deps) {
  var win = deps.window;
  trackFirstInteraction(win);
  var run = function () { checkBuildFreshness(deps); };
  if (typeof win.requestIdleCallback === 'function') win.requestIdleCallback(run, { timeout: 5000 });
  else win.setTimeout(run, 3000);
}

export { decideBuildFreshnessAction, readPageBuildId, checkBuildFreshness, scheduleBuildFreshnessCheck, RELOAD_GUARD_KEY };
