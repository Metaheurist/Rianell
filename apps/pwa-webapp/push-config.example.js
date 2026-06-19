// Copy to push-config.js on the server and replace placeholders.
// Must be valid JavaScript: use only ASCII straight single quotes (') - not curly quotes from Word/PDF.
(function () {
  try {
    var REAL_PUSH_CONFIG = {
      vapidPublicKey: 'YOUR_VAPID_PUBLIC_KEY',
    };
    if (typeof window !== 'undefined') {
      window.RIANELL_VAPID_PUBLIC_KEY = REAL_PUSH_CONFIG.vapidPublicKey;
    }
  } catch (e) {
    if (typeof window !== 'undefined') {
      window.RIANELL_VAPID_PUBLIC_KEY = '';
    }
  }
})();
