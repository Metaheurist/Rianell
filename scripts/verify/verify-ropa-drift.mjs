#!/usr/bin/env node
/**
 * CI guard: docs/privacy/ropa.json processing activities cover Schema.sql public tables.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '../..');
const ropaPath = path.join(root, 'docs/privacy/ropa.json');
const schemaPath = path.join(root, 'supabase/Schema.sql');

const ropa = JSON.parse(fs.readFileSync(ropaPath, 'utf8'));
const schema = fs.readFileSync(schemaPath, 'utf8');

const tableRe = /CREATE TABLE IF NOT EXISTS public\.(\w+)/g;
const schemaTables = new Set();
let m;
while ((m = tableRe.exec(schema)) !== null) {
  schemaTables.add(m[1]);
}

const ropaText = JSON.stringify(ropa).toLowerCase();
const ropaTables = new Set();
for (const pa of ropa.processing_activities || []) {
  for (const t of pa.supabase_tables || []) {
    ropaTables.add(String(t).toLowerCase());
  }
}
const optionalTables = new Set();
let failed = false;

for (const table of schemaTables) {
  if (optionalTables.has(table)) continue;
  const inRopa = ropaText.includes(table.toLowerCase()) || ropaTables.has(table.toLowerCase());
  if (!inRopa) {
    console.error(`verify-ropa-drift: table ${table} in Schema.sql not referenced in ropa.json`);
    failed = true;
  }
}

if (failed) process.exit(1);
console.log(`verify-ropa-drift: ${schemaTables.size} schema tables OK against ropa.json`);
