/**
 * Shared UI Q&A stage + progress for Live polish preview.
 *
 * Writers: screenshot-qa, qa-loop, polish-queue (--repolish-from-qa)
 * Readers: visual-polish-live-preview (/api/gallery → qa)
 *
 * artifacts/visual-gen/qa/progress.json — live heartbeat while a stage runs
 * artifacts/visual-gen/qa/report.json   — last finished screenshot-QA result
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');
export const QA_ROOT = path.join(root, 'artifacts/visual-gen/qa');
export const QA_PROGRESS_PATH = path.join(QA_ROOT, 'progress.json');
export const QA_REPORT_PATH = path.join(QA_ROOT, 'report.json');
export const QA_BROKEN_PATH = path.join(QA_ROOT, 'broken.json');

/** @typedef {{
 *   updatedAt?: string,
 *   active?: boolean,
 *   stage?: string,
 *   label?: string,
 *   phase?: string,
 *   round?: number|null,
 *   maxRounds?: number|null,
 *   current?: number,
 *   total?: number,
 *   unit?: string,
 *   detail?: string|null,
 *   passedSoFar?: number,
 *   brokenSoFar?: number,
 *   exitCode?: number|null,
 * }} QaProgress */

const STAGE_LABELS = {
  'waiting-polish': 'Waiting for polish (C)',
  polish: 'Polish queue (C)',
  'screenshot-cards': 'UI Q&A · card screenshots',
  'stem-sheets': 'UI Q&A · stem contact sheets',
  'gemma-vision': 'UI Q&A · Gemma vision',
  'gemma-stem-vision': 'UI Q&A · stem vision',
  'writing-report': 'UI Q&A · writing report',
  repolish: 'UI Q&A · re-polish broken',
  passed: 'UI Q&A · all pass',
  'needs-fix': 'UI Q&A · needs fixes',
  idle: 'UI Q&A · idle',
};

export function qaStageLabel(stage) {
  return STAGE_LABELS[stage] || (stage ? `UI Q&A · ${stage}` : 'UI Q&A');
}

/** User-facing pass string, e.g. "Pass 2 (max 8)". Never "Pass 2 / 8" (reads like completed ratio). */
export function formatQaPass(round, maxRounds) {
  const r = Number(round);
  if (!Number.isFinite(r) || r <= 0) return null;
  const m = Number(maxRounds);
  if (Number.isFinite(m) && m > 0) return `Pass ${r} (max ${m})`;
  return `Pass ${r}`;
}

function loadJson(p, fallback) {
  if (!fs.existsSync(p)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return fallback;
  }
}

/**
 * Atomically-ish write progress heartbeat for the Live preview HUD.
 * Preserves round/maxRounds unless the patch explicitly sets them.
 * @param {QaProgress} patch
 */
export function writeQaProgress(patch = {}) {
  fs.mkdirSync(QA_ROOT, { recursive: true });
  const prev = loadJson(QA_PROGRESS_PATH, {});
  const next = {
    ...prev,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  // Keep pass counters across stage flips unless explicitly provided
  if (!('round' in patch) && prev.round != null) next.round = prev.round;
  if (!('maxRounds' in patch) && prev.maxRounds != null) next.maxRounds = prev.maxRounds;

  const stageChanged = !!(patch.stage && patch.stage !== prev.stage);
  const baseLabel = qaStageLabel(next.stage);
  const pass = formatQaPass(next.round, next.maxRounds);
  if (patch.label) {
    next.label = pass && !/pass\s*\d/i.test(patch.label)
      ? `${patch.label} · ${pass}`
      : patch.label;
  } else if (stageChanged || !next.label || next.label === prev.label) {
    next.label = pass ? `${baseLabel} · ${pass}` : baseLabel;
  } else if (pass && !/pass\s*\d/i.test(String(next.label))) {
    next.label = `${String(next.label).replace(/\s·\sPass\s+\d+(?:\s*(?:\/\s*\d+|\(max\s+\d+\)))?/i, '')} · ${pass}`;
  } else if (pass && /Pass\s+\d+\s*\/\s*\d+/i.test(String(next.label))) {
    // Migrate old "Pass N / M" wording to "Pass N (max M)"
    next.label = String(next.label).replace(/Pass\s+\d+\s*\/\s*\d+/gi, pass);
  }
  next.passLabel = pass;

  fs.writeFileSync(QA_PROGRESS_PATH, `${JSON.stringify(next, null, 2)}\n`);
  return next;
}

/**
 * Derive what the Live preview should show for the UI Q&A pipeline.
 * @param {{ pending?: number, polished?: number, eligible?: number }} counts
 */
export function deriveQaStatus(counts = {}) {
  const pending = Math.max(0, Number(counts.pending) || 0);
  const polished = Math.max(0, Number(counts.polished) || 0);
  const eligible = Math.max(0, Number(counts.eligible) || 0);
  const progress = loadJson(QA_PROGRESS_PATH, null);
  const report = loadJson(QA_REPORT_PATH, null);
  const brokenDoc = loadJson(QA_BROKEN_PATH, null);

  const progressFresh = isFresh(progress?.updatedAt, 20 * 60_000);
  const active = !!(progress?.active && progressFresh);

  let stage = 'idle';
  let label = qaStageLabel('idle');
  let current = 0;
  let total = 0;
  let unit = '';
  let detail = null;
  let round = progress?.round ?? null;
  let maxRounds = progress?.maxRounds ?? null;
  let pct = null;
  let source = 'idle';

  const brokenCount = Number(
    report?.brokenCount ?? brokenDoc?.ids?.length ?? progress?.brokenSoFar ?? 0,
  );
  const inQaLoop = Number(round) > 0 || (brokenCount > 0 && !!report?.at);

  if (active && progress) {
    stage = String(progress.stage || 'screenshot-cards');
    label = progress.label || withPass(qaStageLabel(stage), round, maxRounds);
    current = Number(progress.current) || 0;
    total = Number(progress.total) || 0;
    unit = progress.unit || '';
    detail = progress.detail || null;
    round = progress.round ?? round;
    maxRounds = progress.maxRounds ?? maxRounds;
    source = 'progress';
  } else if (pending > 0 && inQaLoop) {
    // Re-polish after a QA pass — keep Pass N visible (don't collapse to bare polish)
    stage = 'repolish';
    round = Number(round) > 0 ? Number(round) : 1;
    maxRounds = Number(maxRounds) > 0 ? Number(maxRounds) : 8;
    label = withPass(qaStageLabel('repolish'), round, maxRounds);
    current = polished;
    total = eligible || polished + pending;
    unit = 'polished';
    detail = `${formatQaPass(round, maxRounds) || `Pass ${round}`} · ${pending} re-polish pending`
      + (brokenCount ? ` · ${brokenCount} broken last scan` : '');
    source = 'repolish-queue';
  } else if (pending > 0) {
    stage = 'polish';
    label = withPass(qaStageLabel('polish'), round, maxRounds);
    current = polished;
    total = eligible || polished + pending;
    unit = 'polished';
    detail = `${pending} pending`;
    source = 'polish-queue';
  } else if (report && report.at) {
    const scanned = Number(report.scanned) || 0;
    const passed = Number(report.passed) || 0;
    if (brokenCount === 0 && scanned > 0) {
      stage = 'passed';
      label = withPass(qaStageLabel('passed'), round, maxRounds);
    } else if (brokenCount > 0) {
      stage = 'needs-fix';
      label = withPass(qaStageLabel('needs-fix'), round, maxRounds);
    } else {
      stage = 'idle';
      label = withPass(qaStageLabel('idle'), round, maxRounds);
    }
    current = passed;
    total = scanned || passed + brokenCount;
    unit = 'passed';
    detail = brokenCount
      ? `${brokenCount} broken · last run ${formatAt(report.at)}`
        + (formatQaPass(round, maxRounds) ? ` · ${formatQaPass(round, maxRounds)}` : '')
      : `last run ${formatAt(report.at)}`;
    source = 'report';
  } else if (pending <= 0 && polished > 0) {
    stage = 'idle';
    label = 'UI Q&A · ready (run screenshot QA)';
    current = polished;
    total = eligible || polished;
    unit = 'polished';
    detail = 'Polish complete — start visual:polish:qa-loop or screenshot-qa';
    source = 'ready';
  }

  const passLabel = formatQaPass(round, maxRounds);
  if (passLabel && label && !/pass\s*\d/i.test(label)) {
    label = `${label} · ${passLabel}`;
  }

  if (total > 0) pct = Math.min(100, Math.round((current / total) * 100));
  else if (stage === 'passed') pct = 100;
  else if (stage === 'idle' && pending <= 0 && polished <= 0) pct = null;

  const fromProgress = active && progress;
  const fromReport = !fromProgress && !!report?.at && (stage === 'passed' || stage === 'needs-fix');

  return {
    stage,
    label,
    passLabel,
    phase: progress?.phase || (stage.startsWith('gemma') || stage.includes('screenshot') || stage === 'stem-sheets' || stage === 'writing-report'
      ? 'screenshot-qa'
      : stage === 'repolish'
        ? 'repolish'
        : stage === 'polish' || stage === 'waiting-polish'
          ? 'polish'
          : stage === 'passed' || stage === 'needs-fix'
            ? 'report'
            : 'idle'),
    active: active || source === 'repolish-queue',
    current,
    total,
    unit,
    pct,
    detail,
    round: round == null ? null : Number(round),
    maxRounds: maxRounds == null ? null : Number(maxRounds),
    passedSoFar: fromProgress
      ? Number(progress?.passedSoFar) || 0
      : fromReport
        ? Number(report.passed) || 0
        : 0,
    brokenSoFar: fromProgress
      ? Number(progress?.brokenSoFar) || 0
      : fromReport
        ? Number(report.brokenCount) || 0
        : (source === 'repolish-queue' ? brokenCount : 0),
    reportAt: report?.at || null,
    reportBroken: report ? Number(report.brokenCount) || 0 : null,
    reportPassed: report ? Number(report.passed) || 0 : null,
    reportScanned: report ? Number(report.scanned) || 0 : null,
    gemmaVision: !!(report?.gemmaVision),
    source,
    updatedAt: active
      ? progress?.updatedAt
      : (fromReport ? report?.at : progress?.updatedAt) || null,
  };
}

function withPass(base, round, maxRounds) {
  const pass = formatQaPass(round, maxRounds);
  return pass ? `${base} · ${pass}` : base;
}

function isFresh(iso, maxAgeMs) {
  if (!iso) return false;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return false;
  return Date.now() - t <= maxAgeMs;
}

function formatAt(iso) {
  if (!iso) return '—';
  return String(iso).replace('T', ' ').replace(/\.\d+Z$/, 'Z');
}
