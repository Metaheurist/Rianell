#!/usr/bin/env node
/** @test scripts/verify-llm-models.mjs manifest shape */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const manifestPath = path.join(__dirname, '..', '..', 'apps', 'pwa-webapp', 'models', 'manifest.json');

test('llm models manifest lists self-hosted SmolLM and Llama entries', () => {
  assert.ok(fs.existsSync(manifestPath), 'manifest.json must exist');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  assert.ok(Array.isArray(manifest.models) && manifest.models.length >= 2);
  const ids = manifest.models.map((m) => m.id);
  assert.ok(ids.some((id) => id.includes('SmolLM2')));
  assert.ok(ids.some((id) => id.includes('Llama-3.2')));
  for (const model of manifest.models) {
    assert.ok(model.sourceRepo, `${model.id} needs sourceRepo`);
    assert.ok(model.revision, `${model.id} needs revision`);
    assert.ok(Array.isArray(model.files) && model.files.length > 0, `${model.id} needs files`);
    const paths = model.files.map((f) => (typeof f === 'string' ? f : f.path));
    assert.ok(paths.includes('config.json'), `${model.id} needs config.json`);
  }
});
