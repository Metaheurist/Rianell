#!/usr/bin/env node
/**
 * Verify PWA CSP connect-src includes https endpoints for Supabase/API calls.
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
console.log('verify-csp-connect-src: OK');
