// Injected at GitHub Pages deploy from VAPID_PUBLIC_KEY secret (see prepare-pages-site action).
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
