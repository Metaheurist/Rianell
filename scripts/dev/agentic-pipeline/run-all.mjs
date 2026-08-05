import { runAllOrder, resolvePackModel } from './catalog.mjs';
import { readRunAllState, writeRunAllState, readPackState } from './state.mjs';
import { PACK_HANDLERS } from './pack-handlers.mjs';
import { ollamaUnload } from './ollama-client.mjs';
import { autoAckPack, approvePack, filterProductTouchedPaths } from './apply-adapters.mjs';
import { readModePrefs } from './mode-prefs.mjs';

async function waitIfPaused() {
  for (;;) {
    const s = readRunAllState();
    if (s.status === 'cancelled') return 'cancelled';
    if (s.status !== 'paused') return 'ok';
    await new Promise((r) => setTimeout(r, 500));
  }
}

function productMutationOk(packId, approveResult, prefs) {
  if (packId === 'visual') {
    const proposal = approveResult?.data?.proposal;
    const state = proposal?.approval?.state || proposal?.status;
    if (state === 'polish_running' || approveResult?.data?.results?.some((r) => r.deferred)) {
      return { ok: true, deferred: true };
    }
    if (state === 'polish_complete') {
      // OK when amend pref off; when on, require applied product paths.
      if (prefs.visualApplyAfterPolish) {
        const paths = filterProductTouchedPaths(
          proposal?.approval?.touchedPaths || approveResult?.data?.touched || [],
        );
        return paths.length
          ? { ok: true }
          : { ok: false, error: 'no_product_mutation' };
      }
      return { ok: true, polishComplete: true };
    }
  }
  const paths = filterProductTouchedPaths(approveResult?.data?.touched || []);
  if (paths.length) return { ok: true, paths };
  return { ok: false, error: 'no_product_mutation' };
}

/**
 * Serial proposal sweep for all packs.
 * Never waits for human Approve between packs — proposals stay in the approval queue.
 * Packs are ordered by model group; Ollama unload only happens when the next pack
 * uses a different recommended model.
 *
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
  // Default: continue so all 16 packs can produce proposals for later Approve.
  const stopOnBroken = opts.stopOnBroken === true;
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
    modelGrouped: true,
    awaitApprovals: !autoApprove,
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

    const resolved = resolvePackModel(packId);
    const model = resolved.ok ? resolved.model : null;
    const nextId = order[i + 1];
    const nextModel = nextId && resolvePackModel(nextId).ok
      ? resolvePackModel(nextId).model
      : null;

    const result = await handler({
      dryRun,
      fromRunAll: true,
      productWrite: autoApproveMode === 'product-write' && confirmProductWrite,
    });
    // Never block the sequencer on human Approve — continue to the next pack.
    const needsApproval = Boolean(result.needsApproval) && !dryRun;
    let approvalState = needsApproval ? 'pending' : null;
    let packOk = result.ok;
    let packError = result.error || null;

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
        if (!ap.ok) {
          approvalState = 'pending';
          packOk = false;
          packError = ap.error?.message || ap.error || 'approve failed';
        } else {
          const mut = productMutationOk(packId, ap, {
            ...prefs,
            visualApplyAfterPolish: prefs.visualApplyAfterPolish,
          });
          if (mut.deferred) {
            approvalState = 'polish_running';
          } else if (mut.polishComplete) {
            approvalState = 'polish_complete';
          } else if (!mut.ok) {
            approvalState = 'pending';
            packOk = false;
            packError = mut.error || 'no_product_mutation';
          } else {
            approvalState = 'applied';
          }
        }
      }
    }

    state = readRunAllState();
    state.results[packId] = {
      ok: packOk,
      error: packError,
      needsApproval: needsApproval && (approvalState === 'pending'),
      approvalState,
      model: model || null,
    };
    writeRunAllState(state);

    // Unload only when leaving a model group (next pack uses a different model).
    if (!dryRun && model && model !== nextModel) {
      await ollamaUnload(model);
    }

    if (!packOk && stopOnBroken) {
      writeRunAllState({
        ...readRunAllState(),
        status: 'broken',
        currentPack: packId,
        finishedAt: new Date().toISOString(),
      });
      return readRunAllState();
    }
  }

  const final = readRunAllState();
  const pendingApprovals = Object.values(final.results || {})
    .some((r) => r && r.needsApproval);
  writeRunAllState({
    ...final,
    status: pendingApprovals ? 'awaiting_approvals' : 'passed',
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
