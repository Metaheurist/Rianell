// Copy to supabase-config.js on the server and replace placeholders.
// Must be valid JavaScript: use only ASCII straight single quotes (') — not ' or ' from Word/PDF.
(function () {
  try {
    var REAL_SUPABASE_CONFIG = {
      url: 'https://YOUR_PROJECT_REF.supabase.co',
      anonKey: 'YOUR_SUPABASE_ANON_KEY'
    };
    if (typeof window !== 'undefined') {
      window.SUPABASE_CONFIG = REAL_SUPABASE_CONFIG;
    }
  } catch (e) {
    if (typeof window !== 'undefined') {
      window.SUPABASE_CONFIG = { url: '', anonKey: '' };
    }
  }
})();
