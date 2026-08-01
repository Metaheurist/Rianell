import fs from 'node:fs';
import path from 'node:path';

export function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

export function readCheckpoint(filePath, fallback = { completed: [], failed: [], status: 'idle' }) {
  try {
    if (!fs.existsSync(filePath)) return structuredClone(fallback);
    return { ...fallback, ...JSON.parse(fs.readFileSync(filePath, 'utf8')) };
  } catch {
    return structuredClone(fallback);
  }
}

export function writeCheckpoint(filePath, data) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

export function markCompleted(cp, id) {
  const completed = new Set(cp.completed || []);
  completed.add(id);
  const failed = (cp.failed || []).filter((x) => x !== id && x?.id !== id);
  return { ...cp, completed: [...completed], failed, updatedAt: new Date().toISOString() };
}

export function markFailed(cp, id, reason = '') {
  const failed = [...(cp.failed || []).filter((x) => (x?.id || x) !== id), { id, reason }];
  return { ...cp, failed, updatedAt: new Date().toISOString() };
}
