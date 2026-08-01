#!/usr/bin/env node
/**
 * CLI bridge for activity / proposal / approve / reject / stream / visual-qa.
 * Prints JSON envelope on stdout for Python agentic_console.
 */
import { buildPackActivity, buildRunAllActivity, readPackStream, visualQaStatus } from './activity.mjs';
import { approvePack, rejectPack, selectProposalItems, autoAckPack } from './apply-adapters.mjs';
import { readProposal } from './proposal.mjs';

function arg(name) {
  const a = process.argv.find((x) => x.startsWith(`--${name}=`));
  return a ? a.split('=').slice(1).join('=') : null;
}

function flag(name) {
  return process.argv.includes(`--${name}`);
}

function out(ok, data, error = null) {
  process.stdout.write(`${JSON.stringify({ ok, data, error })}\n`);
}

async function main() {
  const action = arg('action') || 'activity';
  const pack = arg('pack');

  if (action === 'run-all-activity') {
    out(true, buildRunAllActivity());
    return;
  }
  if (action === 'visual-qa') {
    out(true, visualQaStatus());
    return;
  }
  if (!pack && !['run-all-activity', 'visual-qa'].includes(action)) {
    out(false, null, { code: 'bad_args', message: 'pack required' });
    process.exitCode = 1;
    return;
  }

  if (action === 'activity') {
    out(true, buildPackActivity(pack));
    return;
  }
  if (action === 'proposal') {
    out(true, readProposal(pack));
    return;
  }
  if (action === 'stream') {
    out(true, readPackStream(pack));
    return;
  }
  if (action === 'select') {
    const ids = JSON.parse(arg('itemIds') || '[]');
    const selected = arg('selected') !== 'false';
    const r = selectProposalItems(pack, ids, selected);
    out(r.ok, r.data, r.error || null);
    if (!r.ok) process.exitCode = 1;
    return;
  }
  if (action === 'approve') {
    const r = await approvePack(pack, {
      itemIds: arg('itemIds') ? JSON.parse(arg('itemIds')) : undefined,
      confirmProductWrite: flag('confirmProductWrite'),
      allowDependencyBump: flag('allowDependencyBump'),
      gitCommitOnApprove: flag('gitCommitOnApprove'),
      by: arg('by') || 'operator',
    });
    out(r.ok, r.data, r.error || null);
    if (!r.ok) process.exitCode = 1;
    return;
  }
  if (action === 'reject') {
    const r = rejectPack(pack, { by: arg('by') || 'operator' });
    out(r.ok, r.data, r.error || null);
    if (!r.ok) process.exitCode = 1;
    return;
  }
  if (action === 'auto-ack') {
    const r = await autoAckPack(pack);
    out(r.ok !== false, r.data || r, r.error || null);
    return;
  }

  out(false, null, { code: 404, message: `unknown action ${action}` });
  process.exitCode = 1;
}

main().catch((e) => {
  out(false, null, { code: 'fatal', message: String(e?.message || e) });
  process.exit(1);
});
