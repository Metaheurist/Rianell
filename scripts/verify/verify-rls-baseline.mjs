#!/usr/bin/env node
/**
 * CI guard: supabase/Schema.sql RLS baseline + CVE-2025-48757 audit SQL + GDPR erasure proc.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sqlPath = path.join(__dirname, '../..', 'supabase', 'Schema.sql');

const required = [
  ['ENABLE ROW LEVEL SECURITY', 'RLS enable examples'],
  ['CREATE POLICY', 'example policies'],
  ['anon key', 'reminder that anon key requires RLS'],
  ['(select auth.uid())', 'RLS plan-cache pattern (select auth.uid())'],
  ['consent_audit_log', 'consent audit log table'],
  ['delete_all_user_data', 'GDPR erasure stored procedure'],
  ['cve_rls', 'CVE-2025-48757 RLS audit query'],
  ['cve_anon_select', 'CVE-2025-48757 anon SELECT audit query'],
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
    console.error(`verify-rls-baseline: expected ${desc} - substring not found: "${needle}"`);
    failed = true;
  }
}

// Policies must use (select auth.uid()) plan-cache pattern
const policySection = sql.split('§2 ROW LEVEL SECURITY')[1]?.split('§3')[0] || '';
const authUidUses = (policySection.match(/auth\.uid\(\)/g) || []).length;
const cachedUses = (policySection.match(/\(select auth\.uid\(\)\)/g) || []).length;
if (authUidUses > 0 && authUidUses !== cachedUses) {
  console.error(`verify-rls-baseline: ${authUidUses - cachedUses} bare auth.uid() in policies — use (select auth.uid())`);
  failed = true;
}

if (failed) process.exit(1);
console.log('verify-rls-baseline: supabase/Schema.sql baseline OK');
