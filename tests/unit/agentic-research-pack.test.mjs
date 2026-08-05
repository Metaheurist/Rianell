import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  isAllowedWritePath,
  isAllowedNpmScript,
  isAllowedNodeScript,
  classifyResearchAction,
} from '../../scripts/dev/agentic-pipeline/research-apply.mjs';
import {
  researchRefineProposal,
  resolvePackResearchQueries,
  researchBeforeLlm,
} from '../../scripts/dev/agentic-pipeline/research-pack.mjs';
import { redactKey } from '../../scripts/dev/agentic-pipeline/firecrawl-config.mjs';
import { packDir, ensureDir } from '../../scripts/dev/agentic-pipeline/state.mjs';

test('research path allowlist denies secrets and traversal', () => {
  assert.equal(isAllowedWritePath('docs/development/foo.md'), true);
  assert.equal(isAllowedWritePath('scripts/dev/x.mjs'), true);
  assert.equal(isAllowedWritePath('security/.env'), false);
  assert.equal(isAllowedWritePath('../etc/passwd'), false);
  assert.equal(isAllowedWritePath('apps/pwa-webapp/../../security/.env'), false);
});

test('research script allowlist', () => {
  assert.equal(isAllowedNpmScript('verify:i18n'), true);
  assert.equal(isAllowedNpmScript('evil;rm'), false);
  assert.equal(isAllowedNodeScript('scripts/verify/doc-links.mjs'), true);
  assert.equal(isAllowedNodeScript('node_modules/x.js'), false);
});

test('classifyResearchAction and refine prefixes', () => {
  assert.equal(classifyResearchAction('tidy research artifacts').kind, 'tidy');
  assert.equal(classifyResearchAction('npm run verify:i18n').applyAdapter, 'research-script-run');
  const prop = researchRefineProposal({
    items: [
      { id: '1', title: '[file_write] docs/development/research-register.json — sync scrapeTop', selected: true },
      { id: '2', title: '[fact_check] CSP claim matches MDN', selected: true },
      { id: '3', title: '[script_run] npm run verify:doc-links', selected: true },
      { id: '4', title: '[tidy] Clear research tmp', selected: true },
    ],
  });
  assert.equal(prop.items[0].kind, 'file_write');
  assert.equal(prop.items[0].applyAdapter, 'safe-patch');
  assert.equal(prop.items[0].path, 'docs/development/research-register.json');
  assert.equal(prop.items[0].selected, true);
  assert.equal(prop.items[1].kind, 'fact_check');
  assert.equal(prop.items[2].npmScript, 'verify:doc-links');
  assert.equal(prop.items[3].applyAdapter, 'research-tidy');
});

test('redactKey never returns full secret', () => {
  const full = 'fc-TESTKEY000000000000000000000001';
  const hint = redactKey(full);
  // ASCII ellipsis — Windows consoles mojibake U+2026
  assert.ok(hint.includes('...') || hint.includes('…'));
  assert.ok(!hint.includes('TESTKEY000000'));
});

test('research register is shared-stage scoped', () => {
  const p = path.join(process.cwd(), 'docs/development/research-register.json');
  assert.ok(fs.existsSync(p));
  const j = JSON.parse(fs.readFileSync(p, 'utf8'));
  assert.equal(j.scope, 'shared-stage-every-pack');
  assert.ok(j.byPack?.security?.length);
});

test('resolvePackResearchQueries prefers byPack', () => {
  const q = resolvePackResearchQueries('security');
  assert.ok(q.length >= 1);
  assert.match(q[0], /CSP|OWASP|security/i);
});

test('researchBeforeLlm dry-run writes pack-local artifacts', async () => {
  const packId = 'planning';
  const dir = packDir(packId);
  ensureDir(dir);
  const meta = await researchBeforeLlm({ packId, dryRun: true, dir, topic: 'planning' });
  assert.equal(meta.stage, 'research');
  assert.ok(meta.llmPromptExtra.includes('Web research') || meta.llmPromptExtra.includes('Research'));
  assert.ok(fs.existsSync(path.join(dir, 'web-research.json')));
  assert.ok(fs.existsSync(path.join(dir, 'web-research.md')));
});

test('os.tmpdir smoke for fixture isolation', () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'rianell-fc-'));
  fs.writeFileSync(path.join(d, 'x.env'), 'FIRECRAWL_API_KEY=\n');
  assert.ok(fs.existsSync(path.join(d, 'x.env')));
  fs.rmSync(d, { recursive: true, force: true });
});
