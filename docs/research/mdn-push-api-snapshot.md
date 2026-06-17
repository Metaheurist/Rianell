# MDN Push API — notes for Rianell PWA (2026-06)

Source: [Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)

## Requirements

1. **Service worker** must be registered and active
2. **Notification permission** — request from a **user gesture** (Settings button)
3. **Push subscription** — `registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: vapidPublicKey })`
4. **Server** sends push via VAPID-signed Web Push protocol

## Rianell implementation

- Opt-in only (`appSettings.pushNotificationsEnabled`, default false)
- SW handles `push` + `notificationclick`
- Payload: `{ type: 'model_update' | 'app_update', message, minCacheVersion }`
- Subscriptions stored server-side; prune on HTTP 410

See [web-push-pwa-mdn-notes.md](./web-push-pwa-mdn-notes.md) for PWA tutorial cross-ref.
