# Android network security (after `npx cap sync android`)

The Capacitor Android project is generated under `react-app/android/` after `npx cap add android` and `npx cap sync`.

## Mixed content

[react-app/capacitor.config.ts](../react-app/capacitor.config.ts) sets `allowMixedContent: false` so the WebView should not load HTTP subresources on an HTTPS app origin.

## Cleartext traffic

If you must allow HTTP to a dev host, use a **network security config** instead of global `usesCleartextTraffic`. See Android documentation for `network_security_config.xml` and restrict domains.

Review `usesCleartextTraffic` and exported activities on each release build.
