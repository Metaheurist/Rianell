#!/usr/bin/env node
/** @test scripts/models/verify-llm-models.mjs manifest shape */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const manifestPath = path.join(__dirname, '..', '..', 'apps', 'pwa-webapp', 'models', 'manifest.json');

test('llm models manifest lists the small, large and wasm packages at pinned revisions', () => {
  assert.ok(fs.existsSync(manifestPath), 'manifest.json must exist');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  assert.deepEqual(manifest.models.map((m) => m.package).sort(), ['large', 'small', 'wasm']);
  const summaryLlm = fs.readFileSync(path.join(__dirname, '..', '..', 'apps', 'pwa-webapp', 'summary-llm.js'), 'utf8');
  for (const model of manifest.models) {
    assert.ok(model.sourceRepo, `${model.id} needs sourceRepo`);
    assert.match(model.revision, /^[0-9a-f]{40}$/, `${model.id} revision must be a commit SHA`);
    assert.ok(
      new RegExp(`id:\\s*'${model.id.replace(/[.]/g, '\\.')}',\\s*revision:\\s*'${model.revision}'`).test(summaryLlm),
      `${model.id}@${model.revision} must match LLM_PACKAGES in summary-llm.js`,
    );
    assert.ok(Array.isArray(model.files) && model.files.length > 0, `${model.id} needs files`);
    const paths = model.files.map((f) => (typeof f === 'string' ? f : f.path));
    assert.ok(paths.includes('config.json'), `${model.id} needs config.json`);
  }
});
