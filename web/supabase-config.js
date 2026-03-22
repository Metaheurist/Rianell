// ============================================
// SUPABASE API CONFIGURATION
// ============================================
// Credentials are loaded via JSON.parse (single ASCII string) so smart quotes in JS cannot break the file.
// Replace YOUR_PROJECT_REF and YOUR_SUPABASE_ANON_KEY inside the JSON string only. Use straight " only.
// DO NOT commit real keys to public Git — keep this file out of version control if it contains secrets.

(function () {
  'use strict';

  var SUPABASE_CONFIG = { url: '', anonKey: '' };

  try {
    var BASE_JSON = '{"url":"https://YOUR_PROJECT_REF.supabase.co","anonKey":"YOUR_SUPABASE_ANON_KEY"}';
    var parsed = JSON.parse(BASE_JSON);
    if (parsed && typeof parsed.url === 'string') SUPABASE_CONFIG.url = parsed.url;
    if (parsed && typeof parsed.anonKey === 'string') SUPABASE_CONFIG.anonKey = parsed.anonKey;
  } catch (e) {
    console.warn('supabase-config: invalid BASE_JSON (fix quotes or JSON)', e && e.message ? e.message : e);
  }

  if (typeof window !== 'undefined') {
    window.SUPABASE_CONFIG = SUPABASE_CONFIG;
  }

  (async function () {
    try {
      var isLocalhost = typeof window !== 'undefined' && (
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname === ''
      );

      if (isLocalhost) {
        try {
          var response = await fetch('http://localhost:8080/api/supabase-status');
          if (response.ok) {
            var status = await response.json();
            if (status.interception_enabled) {
              SUPABASE_CONFIG = {
                url: status.local_url,
                anonKey: 'local-test-key'
              };
              console.log('Using local Supabase interception (test database)');
              console.log('  Database: ' + (status.database_path || ''));
            } else {
              console.log('Using real Supabase (interception disabled)');
            }
          }
        } catch (err) {
          console.log('Using real Supabase (local server not available)');
        }
      }
    } catch (err) {
      console.warn('Supabase config: interception check failed', err);
    }
    if (typeof window !== 'undefined') {
      window.SUPABASE_CONFIG = SUPABASE_CONFIG;
    }
  })();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = SUPABASE_CONFIG;
  }
})();
