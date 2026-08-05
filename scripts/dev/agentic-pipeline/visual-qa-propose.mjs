/**
 * Visual pack Q&A → approve → polish×8 proposal builder.
 *
 * Live pack: gates → screenshot Q&A → proposal items (broken ids).
 * Approve: selected ids → Gemini polish + qa-loop (max 8 rounds).
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { emptyProposal, writeProposal, readProposal } from './proposal.mjs';
import { silentSpawnSync, resolveSilentInvocation } from './spawn-silent.mjs';
import { writePackState, readPackState, ROOT } from './state.mjs';
import { writeQaProgress } from '../visual-polish-qa-status.mjs';
import { readModePrefs } from './mode-prefs.mjs';

const QA_ROOT = path.join(ROOT, 'artifacts/visual-gen/qa');
const BROKEN_PATH = path.join(QA_ROOT, 'broken.json');
const BROKEN_BACKUP = path.join(QA_ROOT, 'broken-before-approve.json');
const APPROVED_IDS = path.join(QA_ROOT, 'approved-repolish-ids.json');
const MAX_ROUNDS = 8;

function loadJson(p, fb) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return fb;
  }
}

/** Normalize broken.json ({ ids, reasons } | string[] | { broken }). */
export function loadBrokenList(filePath = BROKEN_PATH) {
  const j = loadJson(filePath, null);
  if (!j) return { ids: [], reasons: {}, at: null };
  if (Array.isArray(j)) {
    const ids = j.map((x) => (typeof x === 'string' ? x : x?.id)).filter(Boolean);
    return { ids, reasons: {}, at: null };
  }
  const ids = Array.isArray(j.ids)
    ? j.ids.map((x) => (typeof x === 'string' ? x : x?.id)).filter(Boolean)
    : Array.isArray(j.broken)
      ? j.broken.map((x) => (typeof x === 'string' ? x : x?.id)).filter(Boolean)
      : [];
  return {
    ids,
    reasons: j.reasons && typeof j.reasons === 'object' ? j.reasons : {},
    at: j.at || null,
  };
}

export function itemIdForVisualBroken(visualId) {
  return `visual-broken-${String(visualId).replace(/[^a-zA-Z0-9._:-]/g, '_').slice(0, 100)}`;
}

/**
 * Build selectable polish candidates from current Q&A artifacts.
 * @param {{ dryRun?: boolean, gateResults?: object[], ranQa?: boolean, fromRunAll?: boolean }} opts
 */
export function buildVisualPolishProposal(opts = {}) {
  const { dryRun = false, gateResults = [], ranQa = false, fromRunAll = false } = opts;
  const { ids, reasons, at } = loadBrokenList();
  const gateMeta = (gateResults || []).map((g) => ({
    label: g.cmd, status: g.status, cmd: g.cmd,
  }));

  if (!ids.length) {
    const prefs = readModePrefs();
    const canAmend = Boolean(prefs.visualApplyAfterPolish && prefs.confirmProductWrite);
    const items = canAmend
      ? [{
        id: 'visual-amend-repo',
        kind: 'visual_apply',
        title: 'Amend polished SVGs into apps/pwa-webapp (visual:apply)',
        detail: 'QA green — promote polished symbols/keyframes into the live PWA sources.',
        risk: 'high',
        selected: true,
        applyAdapter: 'visual-apply',
        targets: ['apps/pwa-webapp/'],
      }]
      : [{
        id: 'visual-qa-ack',
        kind: 'ack_only',
        title: 'Acknowledge Q&A (no polish needed) — use Amend to repo when ready',
        detail: at ? `Last Q&A at ${at}` : 'No broken ids in broken.json',
        risk: 'low',
        selected: true,
        applyAdapter: 'ack',
        targets: ['artifacts/visual-gen/qa/'],
      }];
    return emptyProposal('visual', {
      status: dryRun ? 'dry_run' : 'pending_approval',
      summary: ranQa
        ? (canAmend ? 'Q&A green — ready to amend polished SVGs into repo' : 'Q&A green — no polish candidates')
        : (fromRunAll
          ? 'No broken.json candidates (run-all skips live Q&A scan)'
          : 'No broken Q&A candidates yet — run Live to scan'),
      thinking: [
        'Visual flow: Gates → Q&A → Approve candidates → Polish×8 → optional Amend to repo.',
        ranQa
          ? 'Screenshot Q&A found zero broken items.'
          : 'Proposal reflects artifacts/visual-gen/qa/broken.json.',
        'Product apply (visual:apply) requires confirmProductWrite and broken.length === 0.',
      ].join(' '),
      items,
      gates: gateMeta,
    });
  }

  const items = ids.slice(0, 500).map((vid) => {
    const why = Array.isArray(reasons[vid]) ? reasons[vid].join('; ') : '';
    return {
      id: itemIdForVisualBroken(vid),
      kind: 'visual_repolish',
      title: String(vid),
      detail: (why || 'Q&A flagged for re-polish').slice(0, 240),
      risk: 'medium',
      selected: !dryRun,
      applyAdapter: 'visual-repolish',
      visualId: vid,
      targets: [`artifacts/visual-gen/polished/${vid}`],
    };
  });

  return emptyProposal('visual', {
    status: dryRun ? 'dry_run' : 'pending_approval',
    summary: `${ids.length} Q&A polish candidate(s) · approve to run up to ${MAX_ROUNDS} rounds`,
    thinking: [
      'Q&A listed broken polished glyphs.',
      'Approve selected candidates to start Gemma polish + qa-loop (max 8 rounds).',
      fromRunAll ? 'Run-all used existing QA artifacts (no live screenshot scan).' : '',
      at ? `Q&A snapshot: ${at}` : '',
    ].filter(Boolean).join(' '),
    items,
    gates: gateMeta,
  });
}

/** Run screenshot Q&A (exit 1 = broken found — still ok for proposal). */
export function runVisualScreenshotQa() {
  writePackState('visual', {
    ...readPackState('visual'),
    stage: 'qa',
    status: 'running',
    updatedAt: new Date().toISOString(),
  });
  writeQaProgress({
    active: true,
    stage: 'screenshot-cards',
    phase: 'agentic-qa',
    round: 1,
    maxRounds: MAX_ROUNDS,
    detail: 'Agentic visual pack · screenshot Q&A',
    current: 0,
    total: 0,
  });
  const res = silentSpawnSync('npm', ['run', 'visual:polish:screenshot-qa'], {
    cwd: ROOT,
    env: process.env,
    timeout: 6 * 60 * 60 * 1000,
  });
  writeQaProgress({
    active: false,
    stage: 'needs-fix',
    phase: 'agentic-qa',
    detail: res.status === 0 ? 'Q&A finished green' : 'Q&A finished — candidates ready',
    exitCode: res.status,
  });
  return {
    ok: true,
    exitCode: res.status,
    ranQa: true,
  };
}

/**
 * After Approve: narrow broken list to selected ids and start qa-loop (max 8).
 * @param {object[]} items visual_repolish proposal items
 */
export function applyVisualRepolish(items) {
  const ids = items
    .map((it) => it.visualId || String(it.title || '').trim())
    .filter(Boolean);
  if (!ids.length) return { ok: false, error: 'no visual ids selected' };

  fs.mkdirSync(QA_ROOT, { recursive: true });
  const prev = loadBrokenList();
  fs.writeFileSync(BROKEN_BACKUP, `${JSON.stringify({
    at: new Date().toISOString(),
    ids: prev.ids,
    reasons: prev.reasons,
  }, null, 2)}\n`);

  const reasonMap = {};
  for (const id of ids) {
    if (prev.reasons[id]) reasonMap[id] = prev.reasons[id];
    else reasonMap[id] = ['approved for polish×8'];
  }
  const narrowed = {
    at: new Date().toISOString(),
    ids,
    reasons: reasonMap,
    approvedAt: new Date().toISOString(),
    maxRounds: MAX_ROUNDS,
  };
  fs.writeFileSync(BROKEN_PATH, `${JSON.stringify(narrowed, null, 2)}\n`);
  fs.writeFileSync(APPROVED_IDS, `${JSON.stringify({
    at: narrowed.at,
    ids,
    maxRounds: MAX_ROUNDS,
  }, null, 2)}\n`);

  writeQaProgress({
    active: true,
    stage: 'repolish',
    phase: 'approved-polish',
    round: 1,
    maxRounds: MAX_ROUNDS,
    current: 0,
    total: ids.length,
    unit: 'broken',
    brokenSoFar: ids.length,
    detail: `Approved ${ids.length} · polish Pass 1 (max ${MAX_ROUNDS})`,
  });

  writePackState('visual', {
    ...readPackState('visual'),
    stage: 'polish',
    status: 'running',
    updatedAt: new Date().toISOString(),
  });

  if (process.env.AGENTIC_VISUAL_TEST_NO_SPAWN === '1') {
    return {
      ok: true,
      paths: [
        path.relative(ROOT, BROKEN_PATH).replace(/\\/g, '/'),
        path.relative(ROOT, APPROVED_IDS).replace(/\\/g, '/'),
      ],
      deferred: true,
      pid: null,
      selected: ids.length,
      maxRounds: MAX_ROUNDS,
      dryTest: true,
    };
  }

  const inv = resolveSilentInvocation('npm', [
    'run', 'visual:polish:qa-loop', '--', '--now', `--max-rounds=${MAX_ROUNDS}`,
  ], { cwd: ROOT });
  const child = spawn(inv.cmd, inv.args, {
    cwd: ROOT,
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
    shell: inv.shell,
    env: {
      ...process.env,
      AGENTIC_HEADLESS: '1',
    },
  });
  child.on('exit', () => {
    finalizeVisualPolish().catch(() => {});
  });
  child.unref();

  return {
    ok: true,
    paths: [
      path.relative(ROOT, BROKEN_PATH).replace(/\\/g, '/'),
      path.relative(ROOT, APPROVED_IDS).replace(/\\/g, '/'),
    ],
    deferred: true,
    pid: child.pid,
    selected: ids.length,
    maxRounds: MAX_ROUNDS,
  };
}

/**
 * After polish qa-loop exits: mark polish_complete or auto-amend into repo.
 */
export async function finalizeVisualPolish() {
  const { ids } = loadBrokenList();
  const prefs = readModePrefs();
  const brokenCount = ids.length;

  if (brokenCount > 0) {
    writePackState('visual', {
      ...readPackState('visual'),
      status: 'pending_approval',
      stage: 'qa',
      finishedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    const proposal = readProposal('visual');
    if (proposal) {
      writeProposal('visual', {
        ...proposal,
        status: 'pending_approval',
        summary: `Polish finished with ${brokenCount} still broken — re-approve or Amend blocked`,
        approval: {
          ...proposal.approval,
          state: 'pending',
          at: new Date().toISOString(),
        },
      });
    }
    return { ok: true, broken: brokenCount, amended: false, status: 'pending_approval' };
  }

  const wantAmend = Boolean(prefs.visualApplyAfterPolish && prefs.confirmProductWrite);
  if (wantAmend) {
    const { applyVisualAmendToRepo } = await import('./apply-adapters.mjs');
    const applied = applyVisualAmendToRepo({ confirmProductWrite: true });
    writePackState('visual', {
      ...readPackState('visual'),
      status: applied.ok ? 'applied' : 'polish_complete',
      stage: applied.ok ? 'applied' : 'polish_complete',
      finishedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    const proposal = readProposal('visual');
    if (proposal) {
      writeProposal('visual', {
        ...proposal,
        status: applied.ok ? 'applied' : 'polish_complete',
        summary: applied.ok
          ? 'Polish green + amended polished SVGs into apps/pwa-webapp'
          : `Polish green but amend failed: ${applied.error || 'unknown'}`,
        approval: {
          ...proposal.approval,
          state: applied.ok ? 'applied' : 'polish_complete',
          at: new Date().toISOString(),
          confirmProductWrite: true,
          touchedPaths: applied.paths || [],
          amendError: applied.ok ? null : applied.error,
        },
      });
    }
    return {
      ok: applied.ok,
      broken: 0,
      amended: applied.ok,
      status: applied.ok ? 'applied' : 'polish_complete',
      error: applied.error || null,
      paths: applied.paths || [],
    };
  }

  writePackState('visual', {
    ...readPackState('visual'),
    status: 'polish_complete',
    stage: 'polish_complete',
    finishedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  const proposal = readProposal('visual');
  if (proposal) {
    writeProposal('visual', {
      ...proposal,
      status: 'polish_complete',
      summary: 'Polish complete (QA green) — optional Amend polished SVGs into repo',
      items: [
        ...(proposal.items || []).filter((it) => it.id !== 'visual-amend-repo'),
        {
          id: 'visual-amend-repo',
          kind: 'visual_apply',
          title: 'Amend polished SVGs into apps/pwa-webapp (visual:apply)',
          detail: 'QA green after polish — promote polished symbols/keyframes into live PWA sources.',
          risk: 'high',
          selected: true,
          applyAdapter: 'visual-apply',
          targets: ['apps/pwa-webapp/'],
        },
      ],
      approval: {
        ...proposal.approval,
        state: 'polish_complete',
        at: new Date().toISOString(),
      },
    });
  }
  return { ok: true, broken: 0, amended: false, status: 'polish_complete' };
}

/**
 * Visual pack afterGates hook.
 * @param {{ dryRun?: boolean, gateResults?: object[], fromRunAll?: boolean }} ctx
 */
export async function visualAfterGates(ctx = {}) {
  const { dryRun = false, gateResults = [], fromRunAll = false } = ctx;
  let ranQa = false;
  // Live / dry interactive: scan on Live only. Run-all uses existing broken.json.
  if (!dryRun && !fromRunAll) {
    runVisualScreenshotQa();
    ranQa = true;
  } else {
    writePackState('visual', {
      ...readPackState('visual'),
      stage: 'qa',
      updatedAt: new Date().toISOString(),
    });
  }
  return buildVisualPolishProposal({
    dryRun,
    gateResults,
    ranQa,
    fromRunAll,
  });
}
