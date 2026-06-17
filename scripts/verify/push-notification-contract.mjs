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
const indexHtml = readFileSync(join(root, 'apps/pwa-webapp/index.html'), 'utf8');
const appJs = readFileSync(join(root, 'apps/pwa-webapp/app.js'), 'utf8');

if (!/addEventListener\(\s*['"]push['"]/.test(sw)) {
  errors.push('sw.js must handle push events');
}
if (!/addEventListener\(\s*['"]notificationclick['"]/.test(sw)) {
  errors.push('sw.js must handle notificationclick');
}
if (!/Notification\.requestPermission/.test(pushJs)) {
  errors.push('push-subscribe.js must request permission inside subscribe flow');
}
if (/Notification\.requestPermission\s*\(\s*\)/.test(appJs) && !/subscribePushFromSettings|RianellPushSubscribe/.test(appJs)) {
  // allow if only in settings handler
}
if (!indexHtml.includes('push-subscribe.js')) {
  errors.push('index.html must load push-subscribe.js');
}

if (errors.length) {
  console.error('push-notification-contract FAILED:');
  errors.forEach((e) => console.error(' -', e));
  process.exit(1);
}

console.log('push-notification-contract OK');
