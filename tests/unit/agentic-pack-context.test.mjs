import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  gatherPackContext,
  buildPackLlmPrompt,
  PACK_CONTEXT_MANIFEST,
  ADVISORY_SYSTEM,
} from '../../scripts/dev/agentic-pipeline/pack-context.mjs';

test('PACK_CONTEXT_MANIFEST covers core advisory packs', () => {
  for (const id of ['design', 'security', 'changelog', 'migration', 'a11y']) {
    assert.ok(PACK_CONTEXT_MANIFEST[id], `missing manifest for ${id}`);
    assert.ok(PACK_CONTEXT_MANIFEST[id].mission.length > 20);
  }
});

test('gatherPackContext includes mission, docs, and gate failures', () => {
  const ctx = gatherPackContext('design', {
    topic: 'token contract',
    gateResults: [{
      cmd: 'npm run verify:design-tokens',
      status: 'fail',
      stderr: 'FAIL apps/pwa-webapp/css/tokens.css missing --ui-icon-stroke',
      stdout: '',
    }],
  });
  assert.equal(ctx.packId, 'design');
  assert.match(ctx.markdown, /Mission/);
  assert.match(ctx.markdown, /Gate results/);
  assert.match(ctx.markdown, /verify:design-tokens/);
  assert.match(ctx.markdown, /tokens\.css/);
  assert.ok(ctx.filesUsed.length >= 1, 'expected at least one doc/register file');
  assert.ok(ctx.charCount > 200);
});

test('buildPackLlmPrompt writes artifact and requires Repo context section', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'agentic-ctx-'));
  const built = buildPackLlmPrompt({
    packId: 'security',
    topic: 'CSP and threat-model',
    gateResults: [{ cmd: 'npm run verify:csp', status: 'pass', stdout: 'ok' }],
    writeArtifactDir: tmp,
  });
  assert.match(built.prompt, /## Repo context/);
  assert.match(built.prompt, /Proposed actions/);
  assert.match(ADVISORY_SYSTEM, /Repo context/);
  assert.ok(fs.existsSync(path.join(tmp, 'llm-context.md')));
  assert.ok(fs.existsSync(path.join(tmp, 'llm-context.meta.json')));
  const meta = JSON.parse(fs.readFileSync(path.join(tmp, 'llm-context.meta.json'), 'utf8'));
  assert.equal(meta.packId, 'security');
  assert.ok(Array.isArray(meta.filesUsed));
});

test('gatherPackContext redacts health terms from injected gate text', () => {
  const ctx = gatherPackContext('privacy', {
    gateResults: [{
      cmd: 'npm run verify:privacy-docs',
      status: 'fail',
      stderr: 'leak phq-9 screening responses in log',
    }],
  });
  assert.match(ctx.markdown, /REDACTED_HEALTH/);
  assert.doesNotMatch(ctx.markdown, /phq-9/i);
});
