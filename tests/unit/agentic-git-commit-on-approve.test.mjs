import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  filterCommitPaths,
  fallbackCommitMessage,
  sanitizeCommitMessage,
} from '../../scripts/dev/agentic-pipeline/git-commit-on-approve.mjs';

test('filterCommitPaths blocks secrets and traversal', () => {
  assert.deepEqual(
    filterCommitPaths(['docs/foo.md', 'security/.env', '../etc/passwd', 'apps/pwa-webapp/x.js']),
    ['docs/foo.md', 'apps/pwa-webapp/x.js'],
  );
});

test('fallbackCommitMessage is conventional and bounded', () => {
  const msg = fallbackCommitMessage('security', {
    id: 'a1',
    kind: 'code_hint',
    title: 'Tighten CSP connect-src for supabase',
  });
  assert.match(msg, /^chore\(agentic\/security\):/);
  assert.ok(msg.length < 120);
});

test('sanitizeCommitMessage strips fences and clamps', () => {
  const fb = 'chore(agentic/x): fallback';
  assert.equal(
    sanitizeCommitMessage('```\nfeat(a11y): fix contrast\n\n- token update\n```', fb),
    'feat(a11y): fix contrast\n\n- token update',
  );
  assert.equal(sanitizeCommitMessage('Commit message: fix(seo): titles', fb), 'fix(seo): titles');
  assert.equal(sanitizeCommitMessage('   ', fb), fb);
});
