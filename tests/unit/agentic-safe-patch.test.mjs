import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  extractProposalFromMarkdown,
  parseActionBlock,
  validateProposalShape,
  PROPOSAL_SCHEMA_VERSION,
} from '../../scripts/dev/agentic-pipeline/proposal.mjs';
import {
  applySafePatch,
  isProductTrackedPath,
} from '../../scripts/dev/agentic-pipeline/research-apply.mjs';
import {
  ensureFindingsFallbackItem,
  reselectMutateItems,
} from '../../scripts/dev/agentic-pipeline/patch-author.mjs';
import { filterProductTouchedPaths } from '../../scripts/dev/agentic-pipeline/apply-adapters.mjs';

test('parseActionBlock captures kind path mode and fence', () => {
  const block = `[doc_patch] path=docs/development/agentic-findings/seo.md mode=append
Brief: note gap
\`\`\`patch
- **SEO** findings
\`\`\``;
  const it = parseActionBlock(block, { defaultKind: 'code_hint', defaultAdapter: 'safe-patch' });
  assert.equal(it.kind, 'doc_patch');
  assert.equal(it.path, 'docs/development/agentic-findings/seo.md');
  assert.equal(it.mode, 'append');
  assert.match(it.content, /SEO/);
  assert.equal(it.applyAdapter, 'safe-patch');
});

test('extractProposalFromMarkdown parses structured search_replace', () => {
  const md = `## Thinking
Need a unique CSS tweak.

## Proposed actions
1. [file_write] path=apps/pwa-webapp/styles.css mode=search_replace
\`\`\`patch
<<<SEARCH
:root {
=======
:root {
  /* agentic */
>>>REPLACE
\`\`\`
2. [doc_patch] path=docs/development/agentic-findings/design.md mode=append
\`\`\`patch
- note
\`\`\`
`;
  const p = extractProposalFromMarkdown('design', md, {
    model: 'test',
    defaultKind: 'code_hint',
    defaultAdapter: 'safe-patch',
  });
  assert.equal(p.schemaVersion, PROPOSAL_SCHEMA_VERSION);
  assert.equal(p.items.length, 2);
  assert.equal(p.items[0].mode, 'search_replace');
  assert.ok(p.items[0].find.includes(':root'));
  assert.ok(p.items[0].replace.includes('agentic'));
  assert.equal(validateProposalShape(p).ok, true);
});

test('applySafePatch search_replace requires unique find', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rianell-safe-patch-'));
  const prev = process.cwd();
  const rel = 'docs/development/_safe-patch-fixture.md';
  const abs = path.join(prev, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, 'alpha\nunique-token-xyz\nalpha\n', 'utf8');
  try {
    const fail = applySafePatch([{
      path: rel,
      mode: 'search_replace',
      find: 'alpha',
      replace: 'beta',
    }], true);
    assert.equal(fail.ok, false);

    const ok = applySafePatch([{
      path: rel,
      mode: 'search_replace',
      find: 'unique-token-xyz',
      replace: 'unique-token-ok',
    }], true);
    assert.equal(ok.ok, true);
    assert.ok(fs.readFileSync(abs, 'utf8').includes('unique-token-ok'));
  } finally {
    try { fs.unlinkSync(abs); } catch { /* ignore */ }
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('applySafePatch refuses without confirm', () => {
  const r = applySafePatch([{ path: 'docs/development/agentic-findings/x.md', mode: 'append', content: 'x' }], false);
  assert.equal(r.ok, false);
});

test('isProductTrackedPath excludes artifacts', () => {
  assert.equal(isProductTrackedPath('docs/foo.md'), true);
  assert.equal(isProductTrackedPath('artifacts/agentic/design/approved/ACK.md'), false);
  assert.deepEqual(
    filterProductTouchedPaths(['docs/a.md', 'artifacts/agentic/x', 'wiki/Home.md']),
    ['docs/a.md', 'wiki/Home.md'],
  );
});

test('findings fallback and reselect mutate items', () => {
  const items = reselectMutateItems([
    { id: '1', kind: 'file_write', path: 'docs/a.md', selected: false, title: 't' },
    { id: '2', kind: 'script_run', selected: true, title: 'npm run x' },
  ], { productWrite: true });
  assert.equal(items[0].selected, true);

  const withFindings = ensureFindingsFallbackItem('seo', [
    { id: 'ack', kind: 'ack_only', title: 'Ack', selected: true },
  ], 'thinking');
  assert.ok(withFindings.some((it) => it.path === 'docs/development/agentic-findings/seo.md'));
  assert.ok(withFindings.some((it) => it.applyAdapter === 'safe-patch' && it.content));
});
