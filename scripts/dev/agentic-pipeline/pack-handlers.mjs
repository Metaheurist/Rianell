import { runPack, npmGate, nodeGate } from './pack-runner.mjs';
import { runI18nFillPropose } from './i18n-fill.mjs';
import { ADVISORY_SYSTEM } from './pack-context.mjs';

function llm(topic, extra = {}) {
  return {
    llmSystem: ADVISORY_SYSTEM,
    llmTopic: topic,
    // Short handler note merged into Repo context by pack-runner (not a standalone generic prompt).
    llmPrompt: `Focus: ${topic}. Propose at least two concrete, path-cited actions (not a sole generic acknowledge).`,
    enrichContext: true,
    defaultKind: extra.defaultKind || 'code_hint',
    // Persist approved findings as artifacts when no product adapter applies.
    defaultAdapter: extra.defaultAdapter || 'write-approved-artifact',
  };
}

export const PACK_HANDLERS = {
  design: (o) => runPack('design', {
    ...o,
    gates: [npmGate('verify:icon-spec'), npmGate('verify:design-tokens')],
    ...llm('design-tokens, ICON_CONTRACT, and icon-spec alignment'),
  }),
  planning: (o) => runPack('planning', {
    ...o,
    gates: [],
    skipLlm: o.dryRun,
    ...llm('feature planning docs and unit-test proposals (advisory artifacts only)', {
      defaultAdapter: 'write-approved-artifact',
      defaultKind: 'doc_patch',
    }),
  }),
  i18n: (o) => runPack('i18n', {
    ...o,
    stage: 'check',
    gates: [npmGate('verify:i18n:check')],
    skipLlm: true,
    afterGates: async ({ dryRun, model, gateResults }) => {
      return runI18nFillPropose({ dryRun, model, gateResults });
    },
  }),
  rtl: (o) => runPack('rtl', {
    ...o,
    gates: [],
    ...llm('RTL layout risks for ar/he locales in PWA CSS and shell', {
      defaultAdapter: 'write-approved-artifact',
    }),
  }),
  a11y: (o) => runPack('a11y', {
    ...o,
    gates: [npmGate('verify:a11y-tokens'), npmGate('verify:a11y')],
    ...llm('accessibility gate failures → concrete PWA/token fixes', {
      defaultAdapter: 'write-approved-artifact',
      defaultKind: 'code_hint',
    }),
  }),
  seo: (o) => runPack('seo', {
    ...o,
    gates: [npmGate('seo:sitemap:check'), npmGate('seo:content:check'), npmGate('seo:pages:check')],
    ...llm('SEO structured data / sitemap / content check gaps', {
      defaultAdapter: 'write-approved-artifact',
    }),
  }),
  privacy: (o) => runPack('privacy', {
    ...o,
    gates: [
      npmGate('verify:privacy-docs'),
      nodeGate('scripts/verify/verify-ropa-drift.mjs'),
    ],
    ...llm('privacy ROPA / consent doc drift — never include health data'),
  }),
  security: (o) => runPack('security', {
    ...o,
    stage: o.stage || 'gates+review',
    gates: [
      npmGate('verify:csp'),
      npmGate('verify:llm-security'),
      npmGate('verify:unsafe-sinks'),
      npmGate('verify:cspro'),
    ],
    ...llm('security review and STRIDE threat-model deltas vs docs/threat-model.md — do not propose CSP file edits'),
  }),
  deps: (o) => runPack('deps', {
    ...o,
    gates: [npmGate('audit:deps')],
    ...llm('dependency advisory triage — list bump candidates; do not instruct silent install'),
    defaultKind: 'deps_note',
    defaultAdapter: 'write-approved-artifact',
  }),
  migration: (o) => runPack('migration', {
    ...o,
    gates: [npmGate('verify:migration')],
    ...llm('architecture migration — packages must not import apps'),
  }),
  changelog: (o) => runPack('changelog', {
    ...o,
    gates: [],
    ...llm('draft Keep-a-Changelog bullets from recent git + Unreleased section', {
      defaultKind: 'changelog_bullet',
      defaultAdapter: 'changelog-promote',
    }),
  }),
  wikisync: (o) => runPack('wikisync', {
    ...o,
    gates: [
      nodeGate('scripts/verify/doc-links.mjs', ['--strict']),
      npmGate('wiki:verify'),
    ],
    ...llm('wiki and doc-link drift patches from gate failures', {
      defaultKind: 'wiki_patch',
      defaultAdapter: 'wiki-sync',
    }),
  }),
  image: (o) => runPack('image', {
    ...o,
    gates: [],
    skipLlm: o.dryRun,
    ...llm('alt-text drafts for content images — no binary invention', {
      defaultAdapter: 'write-approved-artifact',
    }),
  }),
  bootllm: (o) => runPack('bootllm', {
    ...o,
    gates: process.env.PROBE_URL ? [npmGate('audit:boot:strict')] : [],
    ...llm('boot and first-inference latency regressions from audit artifacts'),
  }),
  perf: (o) => runPack('perf', {
    ...o,
    gates: [npmGate('verify:bundle-split'), npmGate('audit:cwv')],
    ...llm('CWV and bundle-split performance triage backlog'),
  }),
  visual: (o) => runPack('visual', {
    ...o,
    gates: [npmGate('verify:icon-spec')],
    skipLlm: true,
    stage: 'qa',
    afterGates: async (ctx) => {
      const { visualAfterGates } = await import('./visual-qa-propose.mjs');
      return visualAfterGates({
        ...ctx,
        fromRunAll: Boolean(o.fromRunAll),
      });
    },
  }),
};
