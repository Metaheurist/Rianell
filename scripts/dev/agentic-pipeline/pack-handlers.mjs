import { runPack, npmGate, nodeGate } from './pack-runner.mjs';

const ADVISORY = 'You are Rianell local agentic reviewer. Output concise markdown findings only. No secrets. No health scores.';

function llm(topic) {
  return {
    llmSystem: ADVISORY,
    llmPrompt: `Review Rianell pack topic: ${topic}. List top risks/gaps and concrete file-level next steps.`,
  };
}

export const PACK_HANDLERS = {
  design: (o) => runPack('design', {
    ...o,
    gates: [npmGate('verify:icon-spec'), npmGate('verify:design-tokens')],
    ...llm('design-tokens and icon contract'),
  }),
  planning: (o) => runPack('planning', {
    ...o,
    gates: [],
    skipLlm: o.dryRun,
    ...llm('feature planning docs and unit-test proposals (advisory artifacts only)'),
  }),
  i18n: (o) => runPack('i18n', {
    ...o,
    gates: [npmGate('verify:i18n')],
    skipLlm: true, // TranslateGemma via dedicated i18n:ollama when not dry-run — gates first
    ...(o.dryRun ? {} : { skipLlm: true }),
  }),
  rtl: (o) => runPack('rtl', {
    ...o,
    gates: [],
    ...llm('RTL layout risks for ar/he locales in PWA'),
  }),
  a11y: (o) => runPack('a11y', {
    ...o,
    gates: [npmGate('verify:a11y-tokens'), npmGate('verify:a11y')],
    ...llm('accessibility failures and fixes'),
  }),
  seo: (o) => runPack('seo', {
    ...o,
    gates: [npmGate('seo:sitemap:check'), npmGate('seo:content:check'), npmGate('seo:pages:check')],
    ...llm('SEO structured data gaps FAQ MedicalWebPage'),
  }),
  privacy: (o) => runPack('privacy', {
    ...o,
    gates: [
      npmGate('verify:privacy-docs'),
      nodeGate('scripts/verify/verify-ropa-drift.mjs'),
    ],
    ...llm('privacy ROPA consent gaps — never include health data'),
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
    ...llm('security review and STRIDE threat-model deltas vs docs/threat-model.md'),
  }),
  deps: (o) => runPack('deps', {
    ...o,
    gates: [npmGate('audit:deps')],
    ...llm('dependency advisory triage — do not bump packages'),
  }),
  migration: (o) => runPack('migration', {
    ...o,
    gates: [npmGate('verify:migration')],
    ...llm('architecture migration / packages must not import apps'),
  }),
  changelog: (o) => runPack('changelog', {
    ...o,
    gates: [],
    ...llm('draft changelog bullets from recent work — advisory only'),
  }),
  wikisync: (o) => runPack('wikisync', {
    ...o,
    gates: [
      nodeGate('scripts/verify/doc-links.mjs', ['--strict']),
      npmGate('wiki:verify'),
    ],
    ...llm('wiki and doc-link drift patches'),
  }),
  image: (o) => runPack('image', {
    ...o,
    gates: [],
    skipLlm: o.dryRun,
    ...llm('alt-text drafts for content images — no binary invention'),
  }),
  bootllm: (o) => runPack('bootllm', {
    ...o,
    gates: process.env.PROBE_URL ? [npmGate('audit:boot:strict')] : [],
    ...llm('boot and first-inference latency regressions'),
  }),
  perf: (o) => runPack('perf', {
    ...o,
    gates: [npmGate('verify:bundle-split'), npmGate('audit:cwv')],
    ...llm('CWV and bundle performance triage backlog'),
  }),
  visual: (o) => runPack('visual', {
    ...o,
    gates: [npmGate('verify:icon-spec')],
    skipLlm: true, // visual uses dedicated visual:* queues
  }),
};
