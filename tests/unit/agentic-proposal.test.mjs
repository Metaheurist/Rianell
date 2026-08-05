import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  extractProposalFromMarkdown,
  validateProposalShape,
  PROPOSAL_SCHEMA_VERSION,
} from '../../scripts/dev/agentic-pipeline/proposal.mjs';

test('extractProposalFromMarkdown parses Thinking + Proposed actions', () => {
  const md = `## Thinking
Risks around tokens.

## Proposed actions
1. Fix focus ring on Settings in apps/pwa-webapp/styles.css
2. Document token drift in docs/development/a11y-register.json
`;
  const p = extractProposalFromMarkdown('a11y', md, { model: 'qwen2.5-coder:32b' });
  assert.equal(p.schemaVersion, PROPOSAL_SCHEMA_VERSION);
  assert.equal(p.pack, 'a11y');
  assert.match(p.thinking, /Risks around tokens/);
  assert.equal(p.items.length, 2);
  assert.equal(p.items[0].title.includes('focus ring'), true);
  assert.equal(validateProposalShape(p).ok, true);
});

test('extractProposalFromMarkdown falls back to ack_only', () => {
  const p = extractProposalFromMarkdown('design', 'plain text only');
  assert.equal(p.items.length, 1);
  assert.equal(p.items[0].kind, 'ack_only');
});

test('validateProposalShape rejects bad kind', () => {
  const bad = {
    pack: 'x',
    schemaVersion: PROPOSAL_SCHEMA_VERSION,
    items: [{ id: '1', title: 't', kind: 'nope' }],
  };
  assert.equal(validateProposalShape(bad).ok, false);
});
