// ============================================
// SUPABASE API CONFIGURATION
// ============================================
// ⚠️ IMPORTANT: This file contains sensitive credentials
// DO NOT commit this file to version control (GitHub, etc.)
// This file is excluded via .gitignore

// Get your credentials from: https://app.supabase.com/project/_/settings/api
// ⚠️ IMPORTANT: Use the PUBLISHABLE/ANON key, NOT the secret key!
// Secret keys (sb_secret_...) are for server-side only and will cause "Forbidden" errors in browsers
// You need the key that starts with "sb_publishable_" from the "Publishable key" section

// Real Supabase configuration
const REAL_SUPABASE_CONFIG = {
  url: 'https://gitnxgfbbpykwqvogmqq.supabase.co',
  anonKey: 'sb_publishable_K_1etT5oKxV5g5dOF2KjOQ_dhLnJuyo' // Use your PUBLISHABLE key (starts with sb_publishable_)
};

// Check if running on localhost and if server has interception enabled
let SUPABASE_CONFIG = REAL_SUPABASE_CONFIG;

// Auto-detect local server and check interception status
(async function() {
  // Check if we're running on localhost
  const isLocalhost = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1' ||
                      window.location.hostname === '';
  
  if (isLocalhost) {
    try {
      // Check if local server has interception enabled
      const response = await fetch('http://localhost:8080/api/supabase-status');
      if (response.ok) {
        const status = await response.json();
        if (status.interception_enabled) {
          // Use local server instead of real Supabase
          SUPABASE_CONFIG = {
            url: status.local_url,
            anonKey: 'local-test-key' // Dummy key for local server
          };
          console.log('✓ Using local Supabase interception (test database)');
          console.log(`  Database: ${status.database_path}`);
        } else {
          console.log('✓ Using real Supabase (interception disabled)');
        }
      }
    } catch (error) {
      // Server not running or error - use real Supabase
      console.log('✓ Using real Supabase (local server not available)');
    }
  }
})();

// Make config available globally for cloud-sync.js
if (typeof window !== 'undefined') {
  window.SUPABASE_CONFIG = SUPABASE_CONFIG;
}

// Export for use in cloud-sync.js (Node.js compatibility)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SUPABASE_CONFIG;
}
