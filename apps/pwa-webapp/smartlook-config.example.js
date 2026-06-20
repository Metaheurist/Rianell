// Copy to smartlook-config.js on the server and replace placeholders.
// Must be valid JavaScript: use only ASCII straight single quotes (') - not curly quotes from Word/PDF.
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
