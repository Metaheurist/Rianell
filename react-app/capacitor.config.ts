/// <reference types="@capacitor/local-notifications" />
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.healthapp.tracker',
  appName: 'Health Tracker',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  android: {
    // Do not load HTTP subresources on HTTPS app origin (see docs/SECURITY.md, docs/android-network-security-notes.md)
    allowMixedContent: false,
  },
  plugins: {
    LocalNotifications: {
      iconColor: '#488AFF',
    },
  },
};

export default config;
