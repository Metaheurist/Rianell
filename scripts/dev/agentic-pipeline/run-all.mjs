import { runAllOrder, resolvePackModel } from './catalog.mjs';
import { readRunAllState, writeRunAllState, readPackState } from './state.mjs';
import { PACK_HANDLERS } from './pack-handlers.mjs';
import { ollamaUnload } from './ollama-client.mjs';

async function waitIfPaused() {
  for (;;) {
    const s = readRunAllState();
    if (s.status === 'cancelled') return 'cancelled';
    if (s.status !== 'paused') return 'ok';
    await new Promise((r) => setTimeout(r, 500));
  }
}

/**
 * @param {{ skip?: string[], stopOnBroken?: boolean, dryRun?: boolean }} opts
 */
export async function executeRunAll(opts = {}) {
  const skip = new Set(opts.skip || []);
  const stopOnBroken = opts.stopOnBroken !== false;
  const dryRun = Boolean(opts.dryRun);
  const order = runAllOrder().filter((p) => !skip.has(p));

  let state = {
    status: 'running',
    stepIndex: 0,
    order,
    skip: [...skip],
    currentPack: null,
    results: {},
    dryRun,
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
    state = readRunAllState();
    state.results[packId] = { ok: result.ok, error: result.error || null };
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
