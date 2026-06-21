#!/usr/bin/env node
/**
 * Compares table names in supabase/Schema.sql between environments (stub for dual-project CI).
 */
import fs from 'node:fs';
import path from 'node:path';

const schemaPath = path.join(process.cwd(), 'supabase', 'Schema.sql');
if (!fs.existsSync(schemaPath)) {
  console.error('verify-supabase-schema-parity: missing Schema.sql');
  process.exit(1);
}
const sql = fs.readFileSync(schemaPath, 'utf8');
const required = ['user_privacy_profile', 'health_data', 'user_keys', 'anonymized_data', 'bug_reports', 'user_achievements'];
const missing = required.filter((t) => !sql.includes(`public.${t}`));
if (missing.length) {
  console.error('verify-supabase-schema-parity: Schema.sql missing tables:', missing.join(', '));
  process.exit(1);
}
console.log('verify-supabase-schema-parity: required tables present in Schema.sql');
