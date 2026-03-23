/// <reference types="@capacitor/local-notifications" />
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.healthapp.tracker',
  appName: 'Rianell',
  webDir: 'dist',
  /** Splash / flash colour while WebView loads (matches app chrome). */
  backgroundColor: '#0a0a0a',
  server: {
    androidScheme: 'https',
  },
  android: {
    // Do not load HTTP subresources on HTTPS app origin (see docs/SECURITY.md - Android section).
    // Cleartext to arbitrary hosts: use res/xml/network_security_config.xml (patch-android-sdk.js after cap sync), not usesCleartextTraffic.
    allowMixedContent: false,
    /** Off on device builds: avoids extra WebView debugging overhead (default follows debuggable flag). */
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    LocalNotifications: {
      iconColor: '#488AFF',
    },
  },
};

export default config;
