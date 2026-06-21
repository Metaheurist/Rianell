#!/usr/bin/env node
/**
 * Verify PWA CSP includes required connect-src and script-src hosts (Supabase, HF, Smartlook, OFF, etc.).
 */
import fs from 'fs';
import path from 'path';

const indexPath = path.join(process.cwd(), 'apps/pwa-webapp/index.html');
const html = fs.readFileSync(indexPath, 'utf8');
const cspMatch = html.match(/content="([^"]*connect-src[^"]*)"/i);
if (!cspMatch) {
  console.error('verify-csp-connect-src: no CSP connect-src in index.html');
  process.exit(1);
}
const csp = cspMatch[1];
if (!/connect-src[^;]*https:/.test(csp)) {
  console.error('verify-csp-connect-src: connect-src must allow https endpoints');
  process.exit(1);
}

const requiredConnectHosts = [
  'https://*.supabase.co',
  'https://huggingface.co',
  'https://*.huggingface.co',
  'https://cas-bridge.xethub.hf.co',
  'https://*.xethub.hf.co',
  'https://*.aws.cdn.hf.co',
  'https://raw.githubusercontent.com',
  'https://api.open-meteo.com',
  'https://air-quality-api.open-meteo.com',
  'https://world.openfoodfacts.org',
  'https://web-sdk.smartlook.com',
  'https://*.smartlook.com',
  'https://*.smartlook.cloud',
];

const requiredScriptHosts = [
  'https://web-sdk.smartlook.com',
  'https://*.smartlook.com',
  'https://*.smartlook.cloud',
];

const scriptSrcMatch = csp.match(/script-src\s+([^;]+)/i);
const scriptSrc = scriptSrcMatch ? scriptSrcMatch[1] : '';
if (!scriptSrc) {
  console.error('verify-csp-connect-src: no script-src in index.html CSP');
  process.exit(1);
}

let failed = false;
for (const host of requiredConnectHosts) {
  if (!csp.includes(host)) {
    console.error(`verify-csp-connect-src: connect-src missing ${host}`);
    failed = true;
  }
}
for (const host of requiredScriptHosts) {
  if (!scriptSrc.includes(host)) {
    console.error(`verify-csp-connect-src: script-src missing ${host}`);
    failed = true;
  }
}

if (failed) process.exit(1);

console.log('verify-csp-connect-src: OK');
