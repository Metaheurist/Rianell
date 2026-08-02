/**
 * Deferred apply queue for approved proposal items.
 * Approve enqueues work; drain processes jobs grouped by recommended model
 * (same model contiguous) so Ollama isn't thrashed mid-apply batch.
 */
import fs from 'node:fs';
import path from 'node:path';
import { resolvePackModel, runAllOrder } from './catalog.mjs';
import { AGENTIC_ROOT, ensureDir } from './state.mjs';
import { ollamaUnload } from './ollama-client.mjs';

export const APPLY_QUEUE_PATH = path.join(AGENTIC_ROOT, 'apply-queue.json');

function emptyQueue() {
  return {
    schemaVersion: 1,
    status: 'idle',
    jobs: [],
    updatedAt: null,
    lastDrainAt: null,
    lastError: null,
  };
}

export function readApplyQueue() {
  try {
    if (!fs.existsSync(APPLY_QUEUE_PATH)) return emptyQueue();
    const raw = JSON.parse(fs.readFileSync(APPLY_QUEUE_PATH, 'utf8'));
    return {
      ...emptyQueue(),
      ...raw,
      jobs: Array.isArray(raw.jobs) ? raw.jobs : [],
    };
  } catch {
    return emptyQueue();
  }
}

export function writeApplyQueue(queue) {
  ensureDir(AGENTIC_ROOT);
  const next = {
    ...emptyQueue(),
    ...queue,
    updatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(APPLY_QUEUE_PATH, `${JSON.stringify(next, null, 2)}\n`);
  return next;
}

export function clearApplyQueue() {
  writeApplyQueue(emptyQueue());
  return readApplyQueue();
}

/** Stable model-group rank from run-all order (first appearance of each recommended model). */
export function modelGroupRanks(catalogOrder = runAllOrder()) {
  const ranks = new Map();
  for (const packId of catalogOrder) {
    const m = resolvePackModel(packId).model || '_none';
    if (!ranks.has(m)) ranks.set(m, ranks.size);
  }
  return ranks;
}

/**
 * Sort queued jobs: model group order → pack order within group → enqueue time.
 * @param {Array<{packId:string,model?:string,enqueuedAt?:string,status?:string}>} jobs
 */
export function sortJobsByModelGroup(jobs, catalogOrder = runAllOrder()) {
  const ranks = modelGroupRanks(catalogOrder);
  const packRank = new Map(catalogOrder.map((p, i) => [p, i]));
  return [...jobs].sort((a, b) => {
    const ma = ranks.get(a.model || '_none') ?? 999;
    const mb = ranks.get(b.model || '_none') ?? 999;
    if (ma !== mb) return ma - mb;
    const pa = packRank.get(a.packId) ?? 999;
    const pb = packRank.get(b.packId) ?? 999;
    if (pa !== pb) return pa - pb;
    return String(a.enqueuedAt || '').localeCompare(String(b.enqueuedAt || ''));
  });
}

/**
 * @param {{
 *   packId: string,
 *   itemIds: string[],
 *   confirmProductWrite?: boolean,
 *   allowDependencyBump?: boolean,
 *   gitCommitOnApprove?: boolean,
 *   by?: string,
 * }} jobSpec
 */
export function enqueueApprovedWork(jobSpec) {
  const resolved = resolvePackModel(jobSpec.packId);
  const model = resolved.ok ? resolved.model : '_none';
  const job = {
    id: `${jobSpec.packId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    packId: jobSpec.packId,
    model,
    itemIds: [...(jobSpec.itemIds || [])],
    confirmProductWrite: Boolean(jobSpec.confirmProductWrite),
    allowDependencyBump: Boolean(jobSpec.allowDependencyBump),
    gitCommitOnApprove: Boolean(jobSpec.gitCommitOnApprove),
    by: jobSpec.by || 'operator',
    status: 'queued',
    enqueuedAt: new Date().toISOString(),
    finishedAt: null,
    error: null,
  };
  const q = readApplyQueue();
  q.jobs.push(job);
  writeApplyQueue(q);
  return job;
}

/**
 * Process all queued jobs (model-grouped). Idempotent if already draining.
 * @param {{
 *   executeJob: (job: object) => Promise<{ok:boolean,error?:any,data?:any}>,
 *   unloadBetweenModels?: boolean,
 * }} opts
 */
export async function drainApplyQueue(opts) {
  const executeJob = opts?.executeJob;
  if (typeof executeJob !== 'function') {
    return { ok: false, error: 'executeJob required' };
  }
  const unloadBetween = opts.unloadBetweenModels !== false;

  let q = readApplyQueue();
  if (q.status === 'running') {
    return { ok: true, skipped: true, reason: 'already_draining', data: q };
  }

  q = writeApplyQueue({ ...q, status: 'running', lastError: null });
  const pending = q.jobs.filter((j) => j.status === 'queued');
  const ordered = sortJobsByModelGroup(pending);
  let lastModel = null;
  const results = [];

  try {
    for (const job of ordered) {
      // Re-read in case cancel cleared jobs mid-drain
      const live = readApplyQueue();
      const cur = live.jobs.find((j) => j.id === job.id);
      if (!cur || cur.status !== 'queued') continue;

      if (unloadBetween && lastModel && job.model && lastModel !== job.model && lastModel !== '_none') {
        await ollamaUnload(lastModel);
      }

      cur.status = 'running';
      cur.startedAt = new Date().toISOString();
      writeApplyQueue(live);

      let r;
      try {
        r = await executeJob(cur);
      } catch (e) {
        r = { ok: false, error: e?.message || String(e) };
      }

      const after = readApplyQueue();
      const slot = after.jobs.find((j) => j.id === job.id);
      if (slot) {
        slot.status = r.ok ? 'applied' : 'failed';
        slot.finishedAt = new Date().toISOString();
        slot.error = r.ok ? null : (r.error || 'apply failed');
        slot.result = r.data || null;
        writeApplyQueue(after);
      }
      results.push({ id: job.id, packId: job.packId, ok: Boolean(r.ok), error: r.error || null });
      lastModel = job.model || lastModel;
    }

    if (unloadBetween && lastModel && lastModel !== '_none') {
      await ollamaUnload(lastModel);
    }

    const final = readApplyQueue();
    writeApplyQueue({
      ...final,
      status: 'idle',
      lastDrainAt: new Date().toISOString(),
      lastError: null,
    });
    return { ok: true, data: { results, queue: readApplyQueue() } };
  } catch (e) {
    const final = readApplyQueue();
    writeApplyQueue({
      ...final,
      status: 'idle',
      lastDrainAt: new Date().toISOString(),
      lastError: e?.message || String(e),
    });
    return { ok: false, error: e?.message || String(e), data: { results } };
  }
}
