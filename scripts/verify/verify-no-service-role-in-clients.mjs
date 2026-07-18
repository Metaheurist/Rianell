#!/usr/bin/env node
/**
 * Fail CI if secret keys or hardcoded credentials appear in tracked client sources.
 */
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const root = process.cwd();
const scanDirs = ['apps/pwa-webapp', 'packages'];
const forbidden = [
  /service_role/i,
  /SUPABASE_SERVICE_ROLE/,
  /\bsb_secret_[A-Za-z0-9_-]+/,
  /postgresql:\/\/postgres:[^@\s]+@/,
];
let failed = false;

function stripComments(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

function isTracked(relPath) {
  try {
    execSync(`git ls-files --error-unmatch "${relPath.replace(/\\/g, '/')}"`, {
      cwd: root,
      stdio: 'pipe',
    });
    return true;
  } catch {
    return false;
  }
}

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    const rel = path.relative(root, p).replace(/\\/g, '/');
    if (ent.isDirectory()) {
      if (ent.name === 'node_modules' || ent.name === '.trace-build' || ent.name === 'vendor') continue;
      walk(p);
    } else if (/\.(js|ts|tsx|jsx|html|json|env\.example)$/.test(ent.name)) {
      if (!isTracked(rel)) continue;
      const raw = fs.readFileSync(p, 'utf8');
      const text = stripComments(raw);
      for (const pat of forbidden) {
        if (pat.test(text)) {
          console.error(`verify-no-service-role-in-clients: forbidden pattern in tracked ${rel}`);
          failed = true;
        }
      }
      if (rel === 'apps/pwa-webapp/supabase-config.js') {
        if (/\bsb_publishable_[A-Za-z0-9_-]{10,}/.test(text)) {
          console.error(`verify-no-service-role-in-clients: hardcoded publishable key in ${rel} — use YOUR_ placeholders`);
          failed = true;
        }
        if (/https:\/\/[a-z0-9]{10,}\.supabase\.co/.test(text) && !/YOUR_PROJECT_REF/.test(text)) {
          console.error(`verify-no-service-role-in-clients: hardcoded Supabase URL in ${rel} — use YOUR_PROJECT_REF placeholder`);
          failed = true;
        }
      }
    }
  }
}

for (const d of scanDirs) walk(path.join(root, d));

if (failed) process.exit(1);
console.log('verify-no-service-role-in-clients: OK');
