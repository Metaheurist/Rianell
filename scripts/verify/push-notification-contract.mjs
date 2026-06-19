#!/usr/bin/env node
/**
 * Assert PWA push contract: SW has push handler; no permission prompt on load.
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const errors = [];

const sw = readFileSync(join(root, 'apps/pwa-webapp/sw.js'), 'utf8');
const pushJs = readFileSync(join(root, 'apps/pwa-webapp/push-subscribe.js'), 'utf8');
const pushConfig = readFileSync(join(root, 'apps/pwa-webapp/push-config.js'), 'utf8');
const indexHtml = readFileSync(join(root, 'apps/pwa-webapp/index.html'), 'utf8');
const appJs = readFileSync(join(root, 'apps/pwa-webapp/app.js'), 'utf8');

if (!/addEventListener\(\s*['"]push['"]/.test(sw)) {
  errors.push('sw.js must handle push events');
}
if (!/addEventListener\(\s*['"]notificationclick['"]/.test(sw)) {
  errors.push('sw.js must handle notificationclick');
}
if (!/RIANELL_PUSH_CLICK/.test(sw)) {
  errors.push('sw.js must post RIANELL_PUSH_CLICK to clients');
}
if (!/Icons\/beta\/Icon-192\.png/.test(sw)) {
  errors.push('sw.js push icon must use Icons/beta/Icon-192.png');
}
if (!/Notification\.requestPermission/.test(pushJs)) {
  errors.push('push-subscribe.js must request permission inside subscribe flow');
}
if (!/canOfferWebPush/.test(pushJs)) {
  errors.push('push-subscribe.js must gate subscribe with canOfferWebPush');
}
if (!/vapidPublicKey/.test(pushConfig)) {
  errors.push('push-config.js must define vapidPublicKey');
}
if (!indexHtml.includes('push-subscribe.js')) {
  errors.push('index.html must load push-subscribe.js');
}
if (!indexHtml.includes('push-config.js')) {
  errors.push('index.html must load push-config.js');
}
if (!/unsubscribePushFromSettings/.test(appJs)) {
  errors.push('app.js must support unsubscribePushFromSettings');
}
if (!/RIANELL_PUSH_CLICK/.test(appJs)) {
  errors.push('app.js must handle RIANELL_PUSH_CLICK from service worker');
}
if (!/syncPushSettingsUi/.test(appJs)) {
  errors.push('app.js must sync push settings UI');
}

if (errors.length) {
  console.error('push-notification-contract FAILED:');
  errors.forEach((e) => console.error(' -', e));
  process.exit(1);
}

console.log('push-notification-contract OK');
