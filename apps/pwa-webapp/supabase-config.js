// ============================================
// SUPABASE API CONFIGURATION
// ============================================
// Use ONLY ASCII straight single quotes (U+0027 ') around strings - never curly/smart quotes from Word/PDF.
// CI injects secrets.SUPABASE_URL / secrets.SUPABASE_ANON_KEY on GitHub Pages deploy.
// For local dev, replace placeholders below or use localhost interception via the Python server.

(function() {
  try {
    var REAL_SUPABASE_CONFIG = {
      url: 'https://YOUR_PROJECT_REF.supabase.co',
      anonKey: 'YOUR_SUPABASE_ANON_KEY'
    };

    var SUPABASE_CONFIG = REAL_SUPABASE_CONFIG;

    if (typeof window !== "undefined") {
      window.SUPABASE_CONFIG = SUPABASE_CONFIG;
    }

    if (typeof window !== "undefined") {
      window.__rianellSupabaseConfigPromise = (async function () {
        try {
          var isLocalhost =
            typeof window !== "undefined" &&
            (window.location.hostname === "localhost" ||
              window.location.hostname === "127.0.0.1" ||
              window.location.hostname === "");

          if (isLocalhost) {
            try {
              var statusUrl =
                typeof window !== "undefined" && window.location && window.location.origin
                  ? new URL("/api/supabase-status", window.location.origin).href
                  : "/api/supabase-status";
              var response = await fetch(statusUrl, { credentials: "same-origin" });
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
    }
    if (typeof module !== "undefined" && module.exports) {
      module.exports = SUPABASE_CONFIG;
    }
  } catch (e) {
    console.warn("Supabase config failed to load:", e.message || e);
    var safe = { url: "", anonKey: "" };
    if (typeof window !== "undefined") {
      window.SUPABASE_CONFIG = safe;
      window.__rianellSupabaseConfigPromise = Promise.resolve();
    }
    if (typeof module !== "undefined" && module.exports) {
      module.exports = safe;
    }
  }
})();
