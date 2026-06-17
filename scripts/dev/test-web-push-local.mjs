#!/usr/bin/env node
/**
 * Local Web Push smoke (requires VAPID_PUBLIC_KEY + running server with push endpoint).
 */
console.log('test-web-push-local: configure VAPID keys and deploy push-notify endpoint before live send.');
console.log('Use Settings → Push notifications opt-in in the PWA after server exposes RIANELL_VAPID_PUBLIC_KEY.');
process.exit(0);
