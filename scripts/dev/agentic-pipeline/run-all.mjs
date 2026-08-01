import { runAllOrder, resolvePackModel } from './catalog.mjs';
import { readRunAllState, writeRunAllState, readPackState } from './state.mjs';
import { PACK_HANDLERS } from './pack-handlers.mjs';
import { ollamaUnload } from './ollama-client.mjs';
import { autoAckPack, approvePack } from './apply-adapters.mjs';
import { readModePrefs } from './mode-prefs.mjs';

async function waitIfPaused() {
  for (;;) {
    const s = readRunAllState();
    if (s.status === 'cancelled') return 'cancelled';
    if (s.status !== 'paused') return 'ok';
    await new Promise((r) => setTimeout(r, 500));
  }
}

/**
 * @param {{
 *   skip?: string[],
 *   stopOnBroken?: boolean,
 *   dryRun?: boolean,
 *   autoApprove?: boolean,
 *   autoApproveMode?: 'ack'|'product-write',
 *   confirmProductWrite?: boolean,
 *   allowDependencyBump?: boolean,
 *   gitCommitOnApprove?: boolean,
 * }} opts
 */
export async function executeRunAll(opts = {}) {
  const prefs = readModePrefs();
  const skip = new Set(opts.skip || []);
  const stopOnBroken = opts.stopOnBroken !== false;
  const dryRun = Boolean(opts.dryRun);
  const autoApprove = opts.autoApprove != null ? Boolean(opts.autoApprove) : Boolean(prefs.autoApprove);
  const autoApproveMode = opts.autoApproveMode || prefs.autoApproveMode || 'ack';
  const confirmProductWrite = Boolean(opts.confirmProductWrite ?? prefs.confirmProductWrite);
  const allowDependencyBump = Boolean(opts.allowDependencyBump ?? prefs.allowDependencyBump);
  const gitCommitOnApprove = Boolean(opts.gitCommitOnApprove ?? prefs.gitCommitOnApprove);
  const order = runAllOrder().filter((p) => !skip.has(p));

  if (autoApprove && autoApproveMode === 'product-write' && !confirmProductWrite && !dryRun) {
    writeRunAllState({
      status: 'broken',
      error: 'autoApprove product-write requires confirmProductWrite',
      order,
      results: {},
      finishedAt: new Date().toISOString(),
    });
    return readRunAllState();
  }

  let state = {
    status: 'running',
    stepIndex: 0,
    order,
    skip: [...skip],
    currentPack: null,
    results: {},
    dryRun,
    autoApprove,
    autoApproveMode,
    startedAt: new Date().toISOString(),
  };
  writeRunAllState(state);

  for (let i = 0; i < order.length; i++) {
    const gate = await waitIfPaused();
    if (gate === 'cancelled') {
      writeRunAllState({
        ...readRunAllState(),
        status: 'cancelled',
        finishedAt: new Date().toISOString(),
      });
      return readRunAllState();
    }

    const packId = order[i];
    state = { ...readRunAllState(), stepIndex: i, currentPack: packId, status: 'running' };
    writeRunAllState(state);

    const handler = PACK_HANDLERS[packId];
    if (!handler) {
      state.results[packId] = { ok: false, error: 'no handler' };
      writeRunAllState(state);
      if (stopOnBroken) {
        writeRunAllState({ ...readRunAllState(), status: 'broken', finishedAt: new Date().toISOString() });
        return readRunAllState();
      }
      continue;
    }

    const result = await handler({ dryRun });
    const needsApproval = Boolean(result.needsApproval) && !dryRun;
    let approvalState = needsApproval ? 'pending' : null;

    if (!dryRun && needsApproval && autoApprove) {
      if (autoApproveMode === 'ack') {
        const ack = await autoAckPack(packId);
        approvalState = ack.ok ? 'applied' : 'pending';
      } else if (autoApproveMode === 'product-write' && confirmProductWrite) {
        const ap = await approvePack(packId, {
          confirmProductWrite: true,
          allowDependencyBump,
          gitCommitOnApprove,
          by: 'auto-product',
        });
        approvalState = ap.ok ? 'applied' : 'pending';
      }
    }

    state = readRunAllState();
    state.results[packId] = {
      ok: result.ok,
      error: result.error || null,
      needsApproval: needsApproval && approvalState === 'pending',
      approvalState,
    };
    writeRunAllState(state);

    if (!dryRun) {
      const resolved = resolvePackModel(packId);
      if (resolved.ok && resolved.model) {
        await ollamaUnload(resolved.model);
      }
    }

    if (!result.ok && stopOnBroken) {
      writeRunAllState({
        ...readRunAllState(),
        status: 'broken',
        currentPack: packId,
        finishedAt: new Date().toISOString(),
      });
      return readRunAllState();
    }
  }

  writeRunAllState({
    ...readRunAllState(),
    status: 'passed',
    currentPack: null,
    stepIndex: order.length,
    finishedAt: new Date().toISOString(),
  });
  return readRunAllState();
}

export function pauseRunAll() {
  const s = readRunAllState();
  writeRunAllState({ ...s, status: 'paused', updatedAt: new Date().toISOString() });
  return readRunAllState();
}

export function resumeRunAll() {
  const s = readRunAllState();
  writeRunAllState({ ...s, status: 'running', updatedAt: new Date().toISOString() });
  return readRunAllState();
}

export function cancelRunAll() {
  const s = readRunAllState();
  writeRunAllState({
    ...s,
    status: 'cancelled',
    finishedAt: new Date().toISOString(),
  });
  return readRunAllState();
}

export function getRunAllStatus() {
  const state = readRunAllState();
  const packs = {};
  for (const id of runAllOrder()) {
    packs[id] = readPackState(id);
  }
  return { ...state, packs };
}
