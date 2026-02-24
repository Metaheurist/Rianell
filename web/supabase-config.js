// ============================================
// SUPABASE API CONFIGURATION
// ============================================
// Use only straight quotes (') and ASCII characters; avoid pasting from Word or web pages.
// If you see "Invalid or unexpected token" at line 18, replace url/anonKey with plain ASCII (no smart quotes).
// [!] IMPORTANT: This file contains sensitive credentials
// DO NOT commit this file to version control (GitHub, etc.)
// This file is excluded via .gitignore

// Get your credentials from: https://app.supabase.com/project/_/settings/api
// [!] IMPORTANT: Use the PUBLISHABLE/ANON key, NOT the secret key!
// Secret keys (sb_secret_...) are for server-side only and will cause "Forbidden" errors in browsers
// You need the key that starts with "sb_publishable_" from the "Publishable key" section

(function() {
  try {
    // Real Supabase configuration (use double quotes to avoid smart-quote paste issues)
    var REAL_SUPABASE_CONFIG = {
      url: "https://YOUR_PROJECT_REF.supabase.co",
      anonKey: "YOUR_SUPABASE_ANON_KEY"
    };

    var SUPABASE_CONFIG = REAL_SUPABASE_CONFIG;

    // Auto-detect local server and check interception status
    (async function() {
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
                  anonKey: "local-test-key"
                };
                console.log("Using local Supabase interception (test database)");
                console.log("  Database: " + (status.database_path || ""));
              } else {
                console.log("Using real Supabase (interception disabled)");
              }
            }
          } catch (err) {
            console.log("Using real Supabase (local server not available)");
          }
        }
      } catch (err) {
        console.warn("Supabase config: interception check failed", err);
      }
      if (typeof window !== "undefined") {
        window.SUPABASE_CONFIG = SUPABASE_CONFIG;
      }
    })();

    if (typeof window !== "undefined") {
      window.SUPABASE_CONFIG = SUPABASE_CONFIG;
    }
    if (typeof module !== "undefined" && module.exports) {
      module.exports = SUPABASE_CONFIG;
    }
  } catch (e) {
    console.warn("Supabase config failed to load:", e.message || e);
    var safe = { url: "", anonKey: "" };
    if (typeof window !== "undefined") {
      window.SUPABASE_CONFIG = safe;
    }
    if (typeof module !== "undefined" && module.exports) {
      module.exports = safe;
    }
  }
})();
