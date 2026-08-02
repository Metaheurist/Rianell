/**
 * Aggregate Now / Thinking / Done / Planned for the Activity cockpit.
 */
import fs from 'node:fs';
import path from 'node:path';
import { humanGateLabel, readProposal } from './proposal.mjs';
import { runAllOrder } from './catalog.mjs';
import { packDir, readPackState, readRunAllState, ROOT } from './state.mjs';
import { readApplyQueue } from './apply-queue.mjs';

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

/**
 * Live Planned items from TranslateGemma propose-dir checkpoints
 * (includes pending gaps before a translation exists).
 */
export function loadI18nFillPlannedItems(packId = 'i18n') {
  const proposeDir = path.join(packDir(packId), 'fill-proposals');
  if (!fs.existsSync(proposeDir)) return [];
  const items = [];
  let files;
  try {
    files = fs.readdirSync(proposeDir).filter((f) => f.endsWith('.json')).sort();
  } catch {
    return [];
  }
  for (const file of files) {
    const locale = file.replace(/\.json$/i, '');
    const data = readJson(path.join(proposeDir, file), null);
    if (!data) continue;
    const entries = Array.isArray(data) ? data : (data.entries || data.strings || []);
    for (const ent of entries) {
      const key = ent.key;
      if (!key) continue;
      const proposed = ent.proposed ?? ent.value ?? null;
      const pending = proposed == null || ent.status === 'pending' || ent.status === 'failed';
      const soft = Boolean(ent.softAccept || ent.status === 'kept-soft');
      items.push({
        id: `i18n-${locale}-${key}`.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120),
        kind: 'i18n_string',
        title: pending
          ? `${locale} · ${key} · ${ent.status === 'failed' ? 'failed' : 'missing'}`
          : `${locale} · ${key}`,
        detail: pending
          ? `en: ${String(ent.sourceEn || ent.en || '').slice(0, 160)}\n→ (awaiting translation)`
          : `en: ${String(ent.sourceEn || ent.en || '').slice(0, 160)}\n→ ${String(proposed).slice(0, 160)}`,
        risk: soft ? 'medium' : (pending ? 'low' : 'low'),
        locale,
        key,
        sourceEn: ent.sourceEn || ent.en || '',
        proposed,
        softAccept: soft,
        // Only select filled strings for Approve; missing stay visible but unchecked.
        selected: !pending && !soft,
        applyAdapter: 'i18n-apply-fill',
        targets: [`i18n-packs/locale-packs/v1/${locale}.json`],
        fillStatus: ent.status || (pending ? 'pending' : 'ok'),
      });
    }
  }
  return items.slice(0, 2000);
}

export function buildPackActivity(packId) {
  const state = readPackState(packId);
  const report = readJson(path.join(packDir(packId), 'report.json'), null);
  const proposal = readProposal(packId);
  const stream = readPackStream(packId);
  const contextMeta = readJson(path.join(packDir(packId), 'llm-context.meta.json'), null);
  const researchJson = readJson(path.join(packDir(packId), 'web-research.json'), null);
  let researchMd = '';
  try {
    const rp = path.join(packDir(packId), 'web-research.md');
    if (fs.existsSync(rp)) researchMd = fs.readFileSync(rp, 'utf8');
  } catch { /* ignore */ }

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

  let plannedItems = proposal?.items || [];
  let plannedSummary = proposal?.summary || '';
  let plannedStatus = proposal?.status || null;

  // While TranslateGemma is filling (or just finished writing propose-dir), prefer
  // the live gap list so Planned shows missing entries immediately — not only after
  // the blocking fill process exits.
  if (packId === 'i18n') {
    const live = loadI18nFillPlannedItems(packId);
    const fill = stream.fillProgress;
    const filling = fill && ['filling', 'starting', 'done'].includes(fill.phase);
    if (live.length && (filling || !plannedItems.length || plannedStatus === 'filling')) {
      plannedItems = live;
      const pendingN = live.filter((it) => it.fillStatus === 'pending' || it.proposed == null).length;
      const filledN = live.length - pendingN;
      plannedSummary = fill?.locale
        ? `${fill.locale}: ${filledN}/${live.length} translated · ${pendingN} missing`
        : `${filledN}/${live.length} translated · ${pendingN} missing`;
      if (fill?.phase === 'filling' || fill?.phase === 'starting') {
        plannedStatus = 'filling';
      }
    }
  }

  // If a proposal is waiting, surface pending_approval even when report.ok was
  // false (e.g. LLM socket dropped after a usable partial was already written).
  const effectiveStatus = (
    (proposal?.status === 'pending_approval' || proposal?.approval?.state === 'pending')
    && Array.isArray(proposal?.items) && proposal.items.length
    && state.status === 'broken'
  ) ? 'pending_approval' : state.status;

  return {
    pack: packId,
    now: {
      status: effectiveStatus,
      stage: state.stage || report?.stage || null,
      model: state.model || report?.model || proposal?.model || null,
      startedAt: state.startedAt || null,
      finishedAt: state.finishedAt || null,
      paused: Boolean(state.paused),
      dryRun: Boolean(report?.dryRun),
      needsApproval: effectiveStatus === 'pending_approval'
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
    research: researchJson || researchMd
      ? {
        text: researchMd || '',
        configured: Boolean(researchJson?.configured),
        queries: researchJson?.queries || [],
        sources: researchJson?.sources?.length || 0,
        errors: researchJson?.errors || [],
        queriedAt: researchJson?.queriedAt || null,
      }
      : null,
    done,
    planned: {
      status: plannedStatus,
      summary: plannedSummary,
      items: plannedItems,
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
  const applyQueue = readApplyQueue();
  const applyQueued = (applyQueue.jobs || []).filter((j) => j.status === 'queued' || j.status === 'running');
  return {
    runAll: {
      status: run.status,
      currentPack: current,
      stepIndex: run.stepIndex,
      dryRun: run.dryRun,
      autoApprove: run.autoApprove || false,
      autoApproveMode: run.autoApproveMode || null,
      modelGrouped: run.modelGrouped !== false,
    },
    currentActivity: current ? buildPackActivity(current) : null,
    approvalQueue,
    applyQueue: {
      status: applyQueue.status,
      pending: applyQueued.length,
      jobs: applyQueued.map((j) => ({
        id: j.id,
        packId: j.packId,
        model: j.model,
        status: j.status,
      })),
    },
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
  let ids = [];
  if (fs.existsSync(brokenPath)) {
    try {
      const j = JSON.parse(fs.readFileSync(brokenPath, 'utf8'));
      if (Array.isArray(j)) {
        ids = j.map((x) => (typeof x === 'string' ? x : x?.id)).filter(Boolean);
      } else if (Array.isArray(j?.ids)) {
        ids = j.ids.map((x) => (typeof x === 'string' ? x : x?.id)).filter(Boolean);
      } else if (Array.isArray(j?.broken)) {
        ids = j.broken.map((x) => (typeof x === 'string' ? x : x?.id)).filter(Boolean);
      }
    } catch {
      ids = [];
    }
  }
  const count = ids.length;
  return {
    brokenCount: count,
    brokenPath: 'artifacts/visual-gen/qa/broken.json',
    applyAllowed: count === 0,
    flow: 'qa→approve→polish×8',
  };
}
