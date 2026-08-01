/**
 * Aggregate Now / Thinking / Done / Planned for the Activity cockpit.
 */
import fs from 'node:fs';
import path from 'node:path';
import { humanGateLabel, readProposal } from './proposal.mjs';
import { runAllOrder } from './catalog.mjs';
import { packDir, readPackState, readRunAllState, ROOT } from './state.mjs';

function readJson(p, fallback = null) {
  try {
    if (!fs.existsSync(p)) return fallback;
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return fallback;
  }
}

export function readPackStream(packId) {
  const dir = packDir(packId);
  const meta = readJson(path.join(dir, 'llm-stream.meta.json'), { done: true });
  const partialPath = path.join(dir, 'llm-stream.partial.md');
  let text = '';
  if (fs.existsSync(partialPath)) {
    text = fs.readFileSync(partialPath, 'utf8');
  } else {
    const adv = path.join(dir, 'llm-advisory.md');
    if (fs.existsSync(adv)) text = fs.readFileSync(adv, 'utf8');
  }
  const fillProgress = readJson(path.join(dir, 'fill-progress.json'), null);
  return {
    text,
    done: meta?.done !== false,
    updatedAt: meta?.updatedAt || null,
    model: meta?.model || null,
    fillProgress,
  };
}

export function buildPackActivity(packId) {
  const state = readPackState(packId);
  const report = readJson(path.join(packDir(packId), 'report.json'), null);
  const proposal = readProposal(packId);
  const stream = readPackStream(packId);
  const contextMeta = readJson(path.join(packDir(packId), 'llm-context.meta.json'), null);

  const gates = (report?.gates || proposal?.gates || []).map((g) => ({
    label: humanGateLabel(g.cmd || g.label),
    status: g.status || 'unknown',
    cmd: g.cmd || '',
  }));

  const done = [
    ...gates.filter((g) => g.status === 'pass' || g.status === 'skipped-dry-run'),
  ];
  if (proposal?.approval?.state === 'applied') {
    done.push({
      label: 'Proposal applied',
      status: 'pass',
      cmd: proposal.approval.by || 'operator',
    });
  }

  return {
    pack: packId,
    now: {
      status: state.status,
      stage: state.stage || report?.stage || null,
      model: state.model || report?.model || proposal?.model || null,
      startedAt: state.startedAt || null,
      finishedAt: state.finishedAt || null,
      paused: Boolean(state.paused),
      dryRun: Boolean(report?.dryRun),
      needsApproval: state.status === 'pending_approval'
        || proposal?.status === 'pending_approval',
    },
    thinking: {
      text: proposal?.thinking || stream.text || '',
      streaming: stream.done === false,
      fillProgress: stream.fillProgress,
      context: contextMeta
        ? {
          filesUsed: contextMeta.filesUsed || [],
          charCount: contextMeta.charCount || 0,
          builtAt: contextMeta.builtAt || null,
        }
        : null,
    },
    done,
    planned: {
      status: proposal?.status || null,
      summary: proposal?.summary || '',
      items: proposal?.items || [],
      approval: proposal?.approval || null,
    },
    stream,
    proposal,
    report,
  };
}

export function buildRunAllActivity() {
  const run = readRunAllState();
  const order = run.order?.length ? run.order : runAllOrder();
  const current = run.currentPack;
  const approvalQueue = [];
  for (const id of order) {
    const st = readPackState(id);
    const prop = readProposal(id);
    const needs = st.status === 'pending_approval'
      || prop?.status === 'pending_approval'
      || run.results?.[id]?.needsApproval;
    if (needs) {
      approvalQueue.push({
        pack: id,
        status: st.status,
        summary: prop?.summary || 'Needs approval',
      });
    }
  }
  return {
    runAll: {
      status: run.status,
      currentPack: current,
      stepIndex: run.stepIndex,
      dryRun: run.dryRun,
      autoApprove: run.autoApprove || false,
      autoApproveMode: run.autoApproveMode || null,
    },
    currentActivity: current ? buildPackActivity(current) : null,
    approvalQueue,
    recentDone: order
      .filter((id) => run.results?.[id])
      .slice(-5)
      .map((id) => ({
        pack: id,
        ok: run.results[id].ok,
        needsApproval: Boolean(run.results[id].needsApproval),
        approvalState: run.results[id].approvalState || null,
      })),
  };
}

export function visualQaStatus() {
  const brokenPath = path.join(ROOT, 'artifacts/visual-gen/qa/broken.json');
  let broken = [];
  if (fs.existsSync(brokenPath)) {
    try {
      const j = JSON.parse(fs.readFileSync(brokenPath, 'utf8'));
      broken = Array.isArray(j) ? j : (j.broken || []);
    } catch {
      broken = [];
    }
  }
  const count = Array.isArray(broken) ? broken.length : 0;
  return {
    brokenCount: count,
    brokenPath: 'artifacts/visual-gen/qa/broken.json',
    applyAllowed: count === 0,
  };
}
