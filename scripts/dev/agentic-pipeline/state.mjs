import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensureDir, readCheckpoint, writeCheckpoint } from './checkpoint.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../..');

/** Live root — honors `AGENTIC_ROOT` so unit tests can isolate artifacts. */
export function getAgenticRoot() {
  return process.env.AGENTIC_ROOT
    ? path.resolve(process.env.AGENTIC_ROOT)
    : path.join(ROOT, 'artifacts', 'agentic');
}

/** Snapshot alias; prefer getAgenticRoot() when env may change between calls. */
export const AGENTIC_ROOT = getAgenticRoot();

export function packDir(packId) {
  return path.join(getAgenticRoot(), packId);
}

export function packStatePath(packId) {
  return path.join(packDir(packId), 'state.json');
}

export function readPackState(packId) {
  return readCheckpoint(packStatePath(packId), {
    packId,
    status: 'idle',
    model: null,
    stage: null,
    completed: [],
    failed: [],
    paused: false,
  });
}

export function writePackState(packId, state) {
  ensureDir(packDir(packId));
  writeCheckpoint(packStatePath(packId), { ...state, packId });
}

export function pausePack(packId) {
  const s = readPackState(packId);
  writePackState(packId, { ...s, status: 'paused', paused: true, updatedAt: new Date().toISOString() });
  return readPackState(packId);
}

export function resumePack(packId) {
  const s = readPackState(packId);
  writePackState(packId, { ...s, status: 'running', paused: false, updatedAt: new Date().toISOString() });
  return readPackState(packId);
}

export function runAllStatePath() {
  return path.join(getAgenticRoot(), 'run-all-state.json');
}

export function readRunAllState() {
  return readCheckpoint(runAllStatePath(), {
    status: 'idle',
    stepIndex: 0,
    order: [],
    skip: [],
    currentPack: null,
    results: {},
  });
}

export function writeRunAllState(state) {
  ensureDir(getAgenticRoot());
  writeCheckpoint(runAllStatePath(), state);
}

export { ROOT, ensureDir };
