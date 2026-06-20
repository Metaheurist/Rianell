// Injected at GitHub Pages deploy from SMARTLOOK_PROJECT_KEY secret (see prepare-pages-site action).
(function () {
  try {
    var REAL_SMARTLOOK_CONFIG = {
      projectKey: 'YOUR_SMARTLOOK_PROJECT_KEY',
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
