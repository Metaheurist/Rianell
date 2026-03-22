#!/usr/bin/env node
/**
 * CI guard: ensures docs/supabase-rls-recommended.sql still documents RLS baseline.
 * Does not connect to Supabase — operators must enable RLS in the dashboard (see docs/SECURITY.md).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sqlPath = path.join(__dirname, '..', 'docs', 'supabase-rls-recommended.sql');

const required = [
  ['ENABLE ROW LEVEL SECURITY', 'RLS enable examples'],
  ['CREATE POLICY', 'example policies'],
  ['anon key', 'reminder that anon key requires RLS'],
];

let sql = '';
try {
  sql = fs.readFileSync(sqlPath, 'utf8');
} catch (e) {
  console.error('verify-rls-baseline: missing file', sqlPath);
  process.exit(1);
}

const lower = sql.toLowerCase();
let failed = false;
for (const [needle, desc] of required) {
  if (!lower.includes(needle.toLowerCase())) {
    console.error(`verify-rls-baseline: expected ${desc} — substring not found: "${needle}"`);
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}
console.log('verify-rls-baseline: docs/supabase-rls-recommended.sql baseline OK');
