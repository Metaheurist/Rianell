import { Capacitor } from '@capacitor/core';

/**
 * Native (Capacitor): single WebView document — load legacy app directly (no React iframe shell).
 * Browser / Vite: dynamically load the React shell + iframe (see app-web.tsx).
 */
if (Capacitor.isNativePlatform()) {
  window.location.replace(new URL('legacy/index.html', window.location.href).href);
} else {
  void import('./app-web.tsx');
}
