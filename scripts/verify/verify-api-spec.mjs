#!/usr/bin/env node
/** Plan 18 API6 — OpenAPI spec contract verify. */
import fs from 'node:fs';
import path from 'node:path';

const specPath = path.join(process.cwd(), 'docs/api/openapi.yaml');
const spec = fs.readFileSync(specPath, 'utf8');
const required = ['/v1/logs', 'bearerAuth', 'openapi: 3'];
const missing = required.filter((r) => !spec.includes(r.replace('openapi: ', 'openapi:')));
if (missing.length) {
  console.error('API_SPEC_VERIFY_FAIL missing:', missing.join(', '));
  process.exit(1);
}
console.log('API_SPEC_VERIFY_OK');
