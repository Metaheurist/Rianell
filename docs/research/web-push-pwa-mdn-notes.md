# Web Push + PWA notifications (MDN summary)

- Push and Notifications are separate APIs; the service worker receives push events and may show notifications.
- Permission must not be requested on page load - use an explicit Settings control.
- VAPID keys: public key in client subscribe call; private key on server only.
- Test locally with `scripts/dev/test-web-push-local.mjs` once VAPID env vars are set.
