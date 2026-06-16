#!/usr/bin/env node
/**
 * Phase 23 — local verify + optional server probe stages (push/CI require operator).
 * Usage: npm run migrate:root-hygiene-observe -- [--dry-run] [--from-stage=N]
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const fromIdx = args.indexOf('--from-stage');
const fromStage = fromIdx >= 0 ? Number(args[fromIdx + 1] || 1) : 1;

const probeUrl = process.env.PROBE_URL || 'http://127.0.0.1:8080/';

const STAGES = [
  {
    id: 'static_matrix',
    label: '23E static verify matrix',
    run: () => {
      runNpm('verify:root-hygiene');
      runNode('scripts/verify/doc-links.mjs', ['--strict']);
      runNpm('test:unit');
      runNpm('verify:i18n');
      runNpm('verify:csp');
      runNpm('verify:migration:foundation');
      runNpm('verify:migration');
      runNpm('parity');
      runNpm('wiki:verify');
    },
  },
  {
    id: 'local_server_probes',
    label: '23F local server probes (server must be running)',
    run: () => {
      runNpm('audit:boot:prepare');
      runNode('scripts/audit/audit-boot-full.mjs', [], {
        AUDIT_PROFILE: 'baseline',
        PROBE_URL: probeUrl,
        PROBE_PASS_MS: '120000',
        PROBE_WARM_PASS_MS: '120000',
      });
      runNode('scripts/audit/verify-deploy-html.mjs', [], { PROBE_URL: probeUrl });
      runNode('scripts/audit/audit-benchmark-security.mjs', [], {
        AUDIT_PROFILE: 'baseline',
        PROBE_URL: probeUrl,
      });
      runNode('scripts/audit/debug-boot-hang.mjs');
    },
  },
  {
    id: 'push_main',
    label: 'Push main (manual)',
    run: () => console.error('SKIP: push to main — operator action'),
  },
  {
    id: 'ci_watch',
    label: 'CI ci.yml watch (manual)',
    run: () => console.error('SKIP: gh run watch — operator action (see Phase 23G)'),
  },
];

function runNpm(script) {
  const cmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const r = spawnSync(cmd, ['run', script], {
    cwd: root,
    stdio: 'inherit',
    shell: /\.(cmd|bat)$/i.test(cmd),
  });
  if (r.status !== 0) throw new Error(`npm run ${script} failed`);
}

function runNode(rel, nodeArgs = [], env = {}) {
  const r = spawnSync(process.execPath, [path.join(root, rel), ...nodeArgs], {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, ...env },
  });
  if (r.status !== 0) throw new Error(`${rel} failed`);
}

for (let i = fromStage - 1; i < STAGES.length; i++) {
  const s = STAGES[i];
  console.error(`\n[root-hygiene-observe] Stage ${i + 1}: ${s.id} — ${s.label}`);
  if (dryRun) continue;
  try {
    s.run();
  } catch (e) {
    console.error(`STOP at stage ${i + 1} (${s.id}):`, e.message);
    process.exit(1);
  }
}

console.error('\n[root-hygiene-observe] Local stages passed (remote stages require operator).');
process.exit(0);
