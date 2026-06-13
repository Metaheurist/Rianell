#!/usr/bin/env node
/**
 * Fail CI if service_role or secret Supabase keys appear in client bundles.
 */
import fs from 'fs';
import path from 'path';

const root = process.cwd();
const scanDirs = ['apps/pwa-webapp', 'apps/rn-app/src', 'packages'];
const forbidden = [/service_role/i, /SUPABASE_SERVICE_ROLE/, /\bsb_secret_[A-Za-z0-9_-]+/];
let failed = false;

function stripComments(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === 'node_modules' || ent.name === '.trace-build' || ent.name === 'vendor') continue;
      walk(p);
    } else if (/\.(js|ts|tsx|jsx|html|json)$/.test(ent.name)) {
      const raw = fs.readFileSync(p, 'utf8');
      const text = stripComments(raw);
      for (const pat of forbidden) {
        if (pat.test(text)) {
          console.error(`verify-no-service-role-in-clients: forbidden pattern in ${p}`);
          failed = true;
        }
      }
    }
  }
}

for (const d of scanDirs) walk(path.join(root, d));

if (failed) process.exit(1);
console.log('verify-no-service-role-in-clients: OK');
