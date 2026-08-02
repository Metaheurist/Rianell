import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const ciYml = fs.readFileSync(new URL('../../.github/workflows/ci.yml', import.meta.url), 'utf8');

/** Parse top-level job keys and their `needs` from ci.yml (CRLF-safe). */
function parseJobs() {
  const lines = ciYml.split(/\r?\n/);
  const jobs = new Map();
  let cur = null;
  let collectingNeeds = false;
  for (const line of lines) {
    const jm = line.match(/^  ([a-zA-Z0-9_-]+):\s*$/);
    if (jm) {
      cur = { needs: [] };
      jobs.set(jm[1], cur);
      collectingNeeds = false;
      continue;
    }
    if (!cur) continue;
    const inline = line.match(/^    needs:\s*\[([^\]]*)\]\s*$/);
    if (inline) {
      cur.needs = inline[1].split(',').map((s) => s.trim()).filter(Boolean);
      collectingNeeds = false;
      continue;
    }
    if (/^    needs:\s*$/.test(line)) {
      cur.needs = [];
      collectingNeeds = true;
      continue;
    }
    if (collectingNeeds) {
      const m = line.match(/^      - ([a-zA-Z0-9_-]+)/);
      if (m) {
        cur.needs.push(m[1]);
        continue;
      }
      if (/^    [a-zA-Z]/.test(line)) collectingNeeds = false;
    }
  }
  return jobs;
}

test('CI phase fan-in: web gates feed deploy; binary gates feed server-exe', () => {
  const jobs = parseJobs();
  assert.ok(jobs.has('phase1-web-gates'));
  assert.ok(jobs.has('phase1-binary-gates'));

  assert.deepEqual(
    [...jobs.get('phase1-web-gates').needs].sort(),
    ['paths-filter', 'prepare-minified-assets', 'security-audit', 'unit-tests'].sort(),
  );

  const bin = jobs.get('phase1-binary-gates').needs;
  for (const id of [
    'paths-filter',
    'unit-tests',
    'security-audit',
    'agentic-harness-unit',
    'agentic-harness-catalog',
    'agentic-harness-ollama',
    'agentic-harness-dry-run',
  ]) {
    assert.ok(bin.includes(id), `binary gates need ${id}`);
  }
  assert.ok(!bin.includes('prepare-minified-assets'), 'binaries must not wait on minify');

  assert.deepEqual(jobs.get('deploy-pages').needs, ['phase1-web-gates']);
  assert.deepEqual(jobs.get('server-exe').needs, ['phase1-binary-gates']);
  assert.deepEqual(jobs.get('benchmarks-web').needs, ['prepare-minified-assets']);
});
