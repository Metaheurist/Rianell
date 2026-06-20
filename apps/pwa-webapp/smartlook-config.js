// Injected at GitHub Pages deploy from SMARTLOOK_PROJECT_KEY secret (see prepare-pages-site action).
// Canonical key: packages/shared/src/analytics/smartlookConfig.mjs
(function () {
  try {
    var REAL_SMARTLOOK_CONFIG = {
      projectKey: 'c205987c47aef0b2da2a93569620b15a81bef013',
      region: 'eu',
    };
    if (typeof window !== 'undefined') {
      window.SMARTLOOK_CONFIG = REAL_SMARTLOOK_CONFIG;
    }
  } catch (e) {
    if (typeof window !== 'undefined') {
      window.SMARTLOOK_CONFIG = { projectKey: '', region: 'eu' };
    }
  }
})();
