import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import {
  scanProjectStylingContract,
  buildPolishSystemPrompt,
  buildPolishUserPrompt,
  buildSituationalContext,
  createItemChat,
  driftSuspect,
  extractSvgUnit,
  hasUsableSvg,
  resolveStageB,
  buildAdditivePolishFallback,
  enforceTeamColors,
  polishedEqualsOriginal,
  ensurePolishedDiffers,
  resolveStemCanonical,
  buildStemIndex,
  missingOriginalGlyph,
} from '../../../scripts/dev/visual-polish-queue.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../../..');

test('visual-polish-queue script exists and --status exits 0', () => {
  const script = path.join(root, 'scripts/dev/visual-polish-queue.mjs');
  assert.ok(fs.existsSync(script), 'visual-polish-queue.mjs must exist');
  const res = spawnSync(process.execPath, [script, '--status'], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, VISUAL_POLISH_MODEL: 'gemma4:31b-it-qat' },
  });
  assert.equal(res.status, 0, res.stderr || res.stdout);
  assert.match(res.stderr || '', /PROJECT_STYLING_CONTRACT ingested/);
  const json = JSON.parse(res.stdout);
  assert.ok(typeof json.eligible === 'number');
  assert.ok(typeof json.pending === 'number');
  assert.equal(json.model, 'gemma4:31b-it-qat');
  assert.ok(json.contractFiles >= 1);
  assert.ok(json.contractChars > 100);
  assert.ok(Array.isArray(json.contractPaths));
  assert.ok(json.contractPaths.includes('DESIGN.md'));
  assert.ok(
    json.contractPaths.some((p) => p.includes('style-and-design') || /styling|visual-inventory|design-token/i.test(p)),
    'contract should include style docs (style-and-design/ or root styling/visual-inventory)',
  );
});

test('scanProjectStylingContract hydrates DESIGN.md and style docs', () => {
  const meta = scanProjectStylingContract(root);
  assert.ok(meta.files.length >= 5);
  assert.ok(meta.contract.includes('PROJECT_STYLING_CONTRACT'));
  assert.ok(meta.contract.includes('DESIGN.md'));
  assert.ok(meta.contract.includes('```markdown'));
  const system = buildPolishSystemPrompt(meta.contract);
  assert.match(system, /Brand Guardian/);
  assert.match(system, /CORE SUBJECT PRESERVATION/);
  assert.match(system, /BEGIN PROJECT_STYLING_CONTRACT/);
  assert.match(system, /stroke-width="1.5"/);
  assert.match(system, /C is always derived from B/);
  assert.match(system, /SITUATIONAL CONTEXT/);
});

test('buildSituationalContext includes location surrounding function and A description', () => {
  const entry = {
    id: 'fancy:icon-close:rainbow',
    kind: 'sprite',
    viewBox: '0 0 24 24',
    team: 'rainbow',
    sourcePath: 'apps/pwa-webapp/index.html',
    usageSites: [{ file: 'apps/pwa-webapp/index.html', ref: '#icon-close' }],
    themes: ['rainbow'],
    states: ['fancy', 'bold'],
    context: 'Close control for modals and sheets.',
    currentPayload: '<path d="M6 6l12 12M18 6 6 18"/>',
  };
  const brief = buildSituationalContext(entry, entry.currentPayload);
  assert.match(brief, /SITUATIONAL CONTEXT/);
  assert.match(brief, /LOCATION \(source\): apps\/pwa-webapp\/index\.html/);
  assert.match(brief, /LOCATION \(usage sites\)/);
  assert.match(brief, /#icon-close/);
  assert.match(brief, /SURROUNDING:/);
  assert.match(brief, /FUNCTION: Close control/);
  assert.match(brief, /ORIGINAL A DESCRIPTION/);
  assert.match(brief, /M6 6l12 12/);
});

test('createItemChat starts a fresh per-item message list with system role', () => {
  const chat = createItemChat('SYSTEM CONTRACT');
  assert.equal(chat.messages.length, 1);
  assert.equal(chat.messages[0].role, 'system');
  assert.equal(chat.messages[0].content, 'SYSTEM CONTRACT');
  const src = fs.readFileSync(path.join(root, 'scripts/dev/visual-polish-queue.mjs'), 'utf8');
  assert.match(src, /\/api\/chat/);
  assert.match(src, /chatMode: 'per-item'/);
});

test('buildPolishUserPrompt multi-pass modes and driftSuspect close→ring', () => {
  const entry = { id: 'fancy:icon-close:rainbow', kind: 'sprite', viewBox: '0 0 24 24', team: 'rainbow', context: 'close' };
  const original = '<path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="2"/>';
  const qwen = '<svg><path d="M6 6l12 12M18 6 6 18"/></svg>';
  const lock = buildPolishUserPrompt(entry, { originalText: original, qwenText: qwen, mode: 'subject-lock' });
  assert.match(lock, /SUBJECT-LOCK/);
  const polish = buildPolishUserPrompt(entry, {
    originalText: original,
    qwenText: qwen,
    subjectLock: 'SUBJECT_LOCK: subject=close; core_shapes=path; must_keep=X',
    mode: 'polish',
  });
  assert.match(polish, /POLISH pass/);
  assert.match(polish, /LOCKED:/);
  const drifted = '<circle cx="12" cy="12" r="8" stroke="#f0f"/><circle cx="12" cy="12" r="6"/>';
  assert.equal(driftSuspect(original, drifted, entry.id), true);
  assert.equal(driftSuspect(original, original, entry.id), false);
  assert.equal(
    missingOriginalGlyph(
      '<circle cx="12" cy="8" r="4"/><ellipse cx="12" cy="16" rx="7.5" ry="3"/>',
      '<circle cx="12" cy="12" r="8"/>',
    ),
    true,
  );
  const noisy = 'Thinking Process:\n\n1. foo\n<circle cx="12" cy="8" r="4"/>\n```\nmore';
  assert.equal(extractSvgUnit(noisy), '<circle cx="12" cy="8" r="4"/>');
  const proseFalse = 'Use `<g>` or `<path>` elements for grouping. Thinking Process: no real shapes.';
  assert.equal(extractSvgUnit(proseFalse), '');
  assert.equal(hasUsableSvg(proseFalse), false);
  const stage = resolveStageB(proseFalse, '<circle cx="12" cy="8" r="4"/>');
  assert.equal(stage.source, 'original-fallback');
  assert.match(stage.text, /circle/);
  const add = buildAdditivePolishFallback('<circle cx="12" cy="8" r="4"/>', { team: 'rainbow' });
  assert.match(add, /theme-glow/);
  assert.match(add, /cx="12" cy="8" r="4"/);
  assert.doesNotMatch(add, /^<circle/);
  const rb = enforceTeamColors(
    '<g fill="currentColor" stroke="currentColor"><circle cx="12" cy="8" r="4"/></g>',
    { team: 'red-black' },
  );
  assert.match(rb, /#ff4d5a|#ff8d98/);
  assert.doesNotMatch(rb, /currentColor/);
  const a = '<circle cx="12" cy="8" r="4"/><ellipse cx="12" cy="16" rx="7.5" ry="3"/>';
  assert.equal(polishedEqualsOriginal(a, a), true);
  const forced = ensurePolishedDiffers(a, a, { team: 'mint', id: 'fancy:icon-user:mint' });
  assert.equal(polishedEqualsOriginal(a, forced), false);
  assert.match(forced, /rianell-|theme-fx|theme-glow|data-polish/);
  const idx = buildStemIndex([
    { id: 'sprite:icon-target', currentPayload: a },
    { id: 'fancy:icon-target:mint', team: 'mint', currentPayload: a },
  ]);
  const stem = resolveStemCanonical({ id: 'fancy:icon-target:mint', team: 'mint', currentPayload: a }, idx);
  assert.equal(stem.stem, 'icon-target');
  assert.equal(stem.plainId, 'sprite:icon-target');
  const final = buildPolishUserPrompt(entry, {
    originalText: original,
    qwenText: qwen,
    gemmaDraft: drifted,
    comparativeDraft: drifted,
    mode: 'final-drift',
  });
  assert.match(final, /FINAL \+ DRIFT CHECK-IN/);
});

test('visual-gen-apply prefers polished path when present', () => {
  const applySrc = fs.readFileSync(path.join(root, 'scripts/dev/visual-gen-apply.mjs'), 'utf8');
  assert.match(applySrc, /polished/);
  assert.match(applySrc, /polishedAbs/);
  const overridesSrc = fs.readFileSync(path.join(root, 'scripts/dev/visual-gen-write-overrides.mjs'), 'utf8');
  assert.match(overridesSrc, /polished/);
});

test('visual-gen-queue extracts first unit instead of hard-failing multi-svg', () => {
  const src = fs.readFileSync(path.join(root, 'scripts/dev/visual-gen-queue.mjs'), 'utf8');
  assert.match(src, /extractFirstUnit/);
  assert.doesNotMatch(src, /multi-unit response/);
});
