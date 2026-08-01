/**
 * TranslateGemma propose-dir fill for agentic i18n pack.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { SHIPPED_LOCALES } from '../../../packages/shared/src/i18n/locales.mjs';
import { emptyProposal, writeProposal } from './proposal.mjs';
import { ensureDir, packDir, ROOT } from './state.mjs';
import { readModePrefs } from './mode-prefs.mjs';
import { buildPackLlmPrompt } from './pack-context.mjs';

const EN = new Set(['en-GB', 'en-US', 'en-AU']);
const TIER_C = ['ga', 'ar', 'he'];

export function resolveI18nLocales(scope) {
  if (scope === 'tier-c') return [...TIER_C];
  return SHIPPED_LOCALES.filter((l) => !EN.has(l));
}

export async function runI18nFillPropose({ dryRun, model, gateResults }) {
  const prefs = readModePrefs();
  const scope = prefs.i18nFillScope || 'full';
  const locales = resolveI18nLocales(scope);
  const proposeDir = path.join(packDir('i18n'), 'fill-proposals');
  const progressPath = path.join(packDir('i18n'), 'fill-progress.json');
  ensureDir(proposeDir);

  fs.writeFileSync(progressPath, `${JSON.stringify({
    locale: null,
    done: 0,
    total: 0,
    scope,
    phase: dryRun ? 'dry-run' : 'starting',
    updatedAt: new Date().toISOString(),
  }, null, 2)}\n`);

  if (dryRun) {
    const items = locales.slice(0, 3).map((locale, i) => ({
      id: `i18n-${locale}-stub-${i}`,
      kind: 'i18n_string',
      title: `${locale} · [dry-run stub]`,
      detail: 'Dry-run: no TranslateGemma call',
      risk: 'low',
      locale,
      key: `stub.key.${i}`,
      sourceEn: 'Stub',
      proposed: 'Stub',
      softAccept: false,
      selected: true,
      applyAdapter: 'i18n-apply-fill',
      targets: [`i18n-packs/locale-packs/v1/${locale}.json`],
    }));
    const proposal = emptyProposal('i18n', {
      model,
      status: 'dry_run',
      summary: `Dry-run stub · scope=${scope}`,
      thinking: `Would fill locales: ${locales.join(', ')} via TranslateGemma propose-dir.`,
      items,
      gates: (gateResults || []).map((g) => ({
        label: g.cmd, status: g.status, cmd: g.cmd,
      })),
    });
    writeProposal('i18n', proposal);
    return proposal;
  }

  const args = [
    'scripts/i18n/ollama-translate-gaps.mjs',
    `--model=${model || 'translategemma:27b'}`,
    `--locale=${locales.join(',')}`,
    `--propose-dir=${proposeDir}`,
    `--progress-file=${progressPath}`,
  ];
  // Cap during agentic unless overridden — full unattended fill can be huge
  if (process.env.AGENTIC_I18N_LIMIT) {
    args.push(`--limit=${process.env.AGENTIC_I18N_LIMIT}`);
  }

  const res = spawnSync(process.execPath, args, {
    cwd: ROOT,
    encoding: 'utf8',
    shell: false,
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  fs.writeFileSync(progressPath, `${JSON.stringify({
    ...(JSON.parse(fs.readFileSync(progressPath, 'utf8'))),
    phase: res.status === 0 ? 'done' : 'failed',
    exitCode: res.status,
    updatedAt: new Date().toISOString(),
  }, null, 2)}\n`);

  if (res.status !== 0) {
    throw new Error((res.stderr || res.stdout || `i18n fill exit ${res.status}`).slice(0, 500));
  }

  const items = [];
  for (const locale of locales) {
    const file = path.join(proposeDir, `${locale}.json`);
    if (!fs.existsSync(file)) continue;
    let data;
    try { data = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { continue; }
    const entries = Array.isArray(data) ? data : (data.entries || data.strings || []);
    for (const ent of entries) {
      const key = ent.key;
      const proposed = ent.proposed || ent.value;
      if (!key || proposed == null) continue;
      items.push({
        id: `i18n-${locale}-${key}`.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120),
        kind: 'i18n_string',
        title: `${locale} · ${key}`,
        detail: `en: ${String(ent.sourceEn || ent.en || '').slice(0, 160)}\n→ ${String(proposed).slice(0, 160)}`,
        risk: ent.softAccept || ent.status === 'kept-soft' ? 'medium' : 'low',
        locale,
        key,
        sourceEn: ent.sourceEn || ent.en || '',
        proposed,
        softAccept: Boolean(ent.softAccept || ent.status === 'kept-soft'),
        selected: !(ent.softAccept || ent.status === 'kept-soft'),
        applyAdapter: 'i18n-apply-fill',
        targets: [`i18n-packs/locale-packs/v1/${locale}.json`],
      });
    }
  }

  if (!items.length) {
    items.push({
      id: 'i18n-ack-empty',
      kind: 'ack_only',
      title: 'No translation gaps proposed',
      detail: 'TranslateGemma propose-dir produced no entries.',
      risk: 'low',
      selected: true,
      applyAdapter: 'ack',
      targets: [],
    });
  }

  const ctxBuilt = buildPackLlmPrompt({
    packId: 'i18n',
    topic: `TranslateGemma propose-dir fill · scope=${scope}`,
    gateResults,
    writeArtifactDir: packDir('i18n'),
  });
  const gateLine = (gateResults || [])
    .map((g) => `${g.status}:${g.cmd}`)
    .join('; ') || 'no gates';
  const sampleTargets = items
    .filter((it) => it.kind !== 'ack_only')
    .slice(0, 5)
    .map((it) => it.targets?.[0] || it.title)
    .join(', ');

  const proposal = emptyProposal('i18n', {
    model,
    status: 'pending_approval',
    summary: `${items.length} string(s) · scope=${scope}`,
    thinking: [
      `TranslateGemma propose-dir complete for ${locales.join(', ')} (scope=${scope}).`,
      `Gates: ${gateLine}.`,
      ctxBuilt.meta.filesUsed?.length
        ? `Repo context files: ${ctxBuilt.meta.filesUsed.slice(0, 8).join(', ')}.`
        : '',
      sampleTargets ? `Sample targets: ${sampleTargets}.` : '',
      'Review Planned items before apply (merge Tier-C only after Approve + confirm).',
    ].filter(Boolean).join(' '),
    items: items.slice(0, 2000),
    gates: (gateResults || []).map((g) => ({
      label: g.cmd, status: g.status, cmd: g.cmd,
    })),
  });
  writeProposal('i18n', proposal);
  return proposal;
}
