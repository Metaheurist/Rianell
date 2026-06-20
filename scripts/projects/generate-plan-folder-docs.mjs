#!/usr/bin/env node
/**
 * Generate security-performance.md, scope.md, references.md per Projects/plan-* folder.
 * Run: node scripts/projects/generate-plan-folder-docs.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
const projects = path.join(root, 'Projects');

const PLANS = [
  {
    dir: 'plan-01-platform-architecture',
    exec: '01',
    section: 13,
    title: 'Platform & architecture',
    ids: 'T1, T2',
    cve: [
      'Supply-chain: new Storybook/npm deps in T2 — run `npm audit --omit=dev` + OSV before merge.',
      'ES module split (T1): accidental exposure of internal APIs via `window.*` — avoid new globals.',
    ],
    perf: [
      'T1 extraction must not regress initial bundle: keep lazy-load for charts/LLM paths.',
      'Storybook (T2) is dev-only; exclude from `build-site.mjs` production graph.',
    ],
    mitigations: [
      'Pin Storybook in root devDependencies; SBOM via CI security-audit job.',
      'Incremental extract + `npm run build:web` + boot audit each slice.',
    ],
    verify: ['npm run test:unit', 'npm run build:web', 'npm run verify:root-hygiene'],
    extraEnv: 'verify:root-hygiene',
    firecrawl: ['.firecrawl/projects/owasp-masvs.md — OWASP MASVS / MASTG baseline'],
    docs: ['docs/architecture-standard.md', 'docs/SECURITY.md §Dependency scanning'],
    scope: 'DevEx only; no PHI in Storybook stories. Use synthetic fixtures.',
  },
  {
    dir: 'plan-02-accessibility-i18n',
    exec: '02',
    section: 10,
    title: 'Accessibility & i18n',
    ids: 'I1–I5',
    cve: [
      'XSS via locale packs if HTML injected in translations — all UI strings must be plain text; use escapeHTML at render boundaries.',
      'TTS (I4): third-party voice engines — no log text sent to cloud without explicit consent.',
    ],
    perf: [
      '14 locale packs: lazy-load non-active locales; avoid loading all JSON on boot.',
      'B1 rewrite (I2): optional post-process — cache per session, not per keystroke.',
    ],
    mitigations: ['npm run verify:i18n', 'Never auto-translate UGC log notes (B1).', 'RTL smoke ar/he on settings + home.'],
    verify: ['npm run verify:i18n', 'npm run test:unit'],
    extraEnv: 'verify:i18n',
    firecrawl: ['.firecrawl/projects/owasp-health-mobile.json — HIPAA mobile encryption at rest'],
    docs: ['docs/ai-security.md §3 UGC', 'scripts/verify/i18n-all.mjs'],
    scope: 'I6 NR. I5 chart palettes validated with plan 09.',
  },
  {
    dir: 'plan-03-settings-onboarding',
    exec: '03',
    section: 6,
    title: 'Settings & onboarding',
    ids: 'S1–S8',
    cve: [
      'Consent dashboard (S7): incorrect revoke must not leave ghost sync — audit network after revoke.',
      'S8 profile export: JSON import path — validate schema; reject prototype pollution keys.',
    ],
    perf: [
      'S4 settings search: index pane titles once at open, not on every keystroke in 9-pane carousel.',
      'Onboarding (S1/S2): defer heavy AI tab init until after first log save.',
    ],
    mitigations: ['parity:inventory:check', 'Schema-validate S8 import with shared zod/normalize.'],
    verify: ['npm run parity:inventory:check', 'npm run test:unit'],
    extraEnv: 'parity:inventory:check',
    firecrawl: ['.firecrawl/projects/owasp-masvs.md — MASVS-STORAGE, AUTH'],
    docs: ['docs/platform-parity.json', 'docs/privacy/global-baseline.md'],
    scope: 'S5 simple mode hides AI/pool — test with plan 14 X14.3.',
  },
  {
    dir: 'plan-04-logging-data-capture',
    exec: '04',
    section: 2,
    title: 'Logging & data capture',
    ids: 'L1–L11 (excl L4, L10, L12 NR)',
    cve: [
      'L5 barcode/OFF API: SSRF if URL user-controlled — allowlist openfoodfacts.org only.',
      'L11 voice→LLM: prompt injection in STT output — delimiter + schema validation (AI-02).',
    ],
    perf: [
      'L8 sub-entries: index by date key; avoid O(n) full log scan on every home render.',
    ],
    mitigations: ['Extend normalizeLogEntry with migration tests.', 'L9 offline queue: idempotent flush.'],
    verify: ['npm run test:unit', 'Export/import round-trip test'],
    extraEnv: '',
    firecrawl: ['.firecrawl/projects/owasp-health-mobile.json — on-device encryption'],
    docs: ['docs/data-model.md', 'docs/ai-security.md §3 prompt injection'],
    scope: 'L4 drug interactions NR. L10 wearables NR. L12 photo journal NR.',
  },
  {
    dir: 'plan-05-privacy-compliance',
    exec: '05',
    section: 7,
    title: 'Privacy & compliance',
    ids: 'P1–P7',
    cve: [
      'P4 E2E export: weak KDF or hardcoded salt — use PBKDF2/Argon2 + per-export salt documented.',
      'P7 WebAuthn: validate origin/rpId; RN biometrics bypass if only UI gate — lock storage APIs too.',
      'P3 local-only: race if async fetch in flight — abort controllers on enable.',
    ],
    perf: ['P2 activity log: cap entries (e.g. 500) with rotation.', 'P1 policy viewer: stream large markdown, do not innerHTML raw.'],
    mitigations: ['verify:privacy-docs', 'verify-no-service-role-in-clients', 'P6 defer until legal sign-off.'],
    verify: ['npm run verify:privacy-docs', 'node scripts/verify/verify-no-service-role-in-clients.mjs'],
    extraEnv: 'verify:privacy-docs',
    firecrawl: ['.firecrawl/projects/owasp-health-mobile.json — MFA, access controls'],
    docs: ['docs/privacy/dpia-health-sync.md', 'docs/SECURITY.md §Sensitive HTTP APIs'],
    scope: 'Pairs S7 consent dashboard. P4 enables CL2.',
  },
  {
    dir: 'plan-06-cloud-sync',
    exec: '06',
    section: 6,
    title: 'Cloud sync & portability',
    ids: 'D1–D7',
    cve: [
      'D6 share links: time-limited signed URLs; no PHI in query strings; RLS on read path.',
      'D5 CSV import: formula injection in Excel — prefix risky cells with single quote in export.',
      'D7 user cloud OAuth: store refresh tokens in secure-store only (RN) / encrypted pref (PWA).',
    ],
    perf: ['D2 auto-sync: exponential backoff; skip if local-only (P3).', 'D3 merge UI: diff only conflicting dates, not full log array.'],
    mitigations: ['Encrypted health_data unchanged', 'Delete-all-cloud clears all tables', 'parity:inventory:check'],
    verify: ['npm run test:unit', 'npm run parity:inventory:check'],
    extraEnv: 'parity:inventory:check',
    firecrawl: ['.firecrawl/projects/supabase-health-sync.json — RLS + client keys'],
    docs: ['docs/supabase-rls-recommended.sql', 'packages/cloud-sync'],
    scope: 'D6/D7 security review before production.',
  },
  {
    dir: 'plan-07-ai-engine',
    exec: '07',
    section: 4,
    title: 'AI engine (deterministic)',
    ids: 'A1–A8',
    cve: [
      'No new network CVE surface — local-only; ensure A8 export strips direct identifiers.',
      'A5 anomaly alerts: false positives are UX risk, not CVE — document thresholds.',
    ],
    perf: [
      'A1 parity: run analysis in worker chunk or requestIdleCallback on PWA for large logs.',
      'A3 hypothesis engine: cap factor count; memoize on log hash.',
    ],
    mitigations: ['Fixture tests PWA vs RN ranking', 'GDPR Art. 22 disclaimers preserved'],
    verify: ['npm run test:unit', 'packages/ai-engine tests'],
    extraEnv: '',
    firecrawl: ['OWASP AI Exchange — local inference reduces server-side LLM CVE class'],
    docs: ['docs/NEURAL_NETWORK_PLAN.md', 'docs/ai-security.md §7'],
    scope: 'A8 feeds RE1; A5 feeds R3.',
  },
  {
    dir: 'plan-08-llm-nlp',
    exec: '08',
    section: 5,
    title: 'On-device LLM & NLP',
    ids: 'N1–N11 (excl N8 NR)',
    cve: [
      'CVE baseline: @huggingface/transformers 3.3.2, onnxruntime-react-native — audit before bump.',
      'N1 chat: max 5 turns limits injection blast radius; no tool calling.',
      'N11: on-device parity only — no user-supplied commercial LLM URL (FREE-TIER-POLICY).',
      'N10 GGUF WASM: memory safety — cap model size tier.',
    ],
    perf: [
      'N7 instant tier: sub-100MB model; MOTD must not block shell reveal.',
      'N3 chart narration: truncate series points in prompt (max tokens).',
    ],
    mitigations: ['verify:llm-security', 'llm-golden-prompts CI', 'N4 ui-only locales enforced'],
    verify: ['npm run verify:llm-security', 'node scripts/test/llm-golden-prompts.mjs'],
    extraEnv: 'verify:llm-security',
    firecrawl: ['.firecrawl/projects/transformers-cve.json', 'docs/ai-security.md §4.3a'],
    docs: ['docs/ai-security.md', 'docs/runbooks/llm-rollout.md'],
    scope: 'N8 NR (wearables L10 excluded). Wellness-only guardrails all intents.',
  },
  {
    dir: 'plan-09-charts-analytics',
    exec: '09',
    section: 3,
    title: 'Charts & analytics',
    ids: 'C1–C10',
    cve: [
      'ApexCharts: sanitize series labels from user custom metrics (C8) before render.',
      'C6 PDF/PNG export: no embedded JS in PDF generators.',
    ],
    perf: [
      'C10 quick win: localStorage read once per charts tab open.',
      'Lazy-load ApexCharts; destroy charts on tab hide to free WebGL/canvas memory.',
      'C1 correlation cards: compute from cached A3 results, not re-run engine per render.',
    ],
    mitigations: ['I5 high-contrast palettes when ready', 'C4 only with L7 data'],
    verify: ['npm run test:unit', 'Manual chart smoke PWA + RN'],
    extraEnv: '',
    firecrawl: ['Chart.js/ApexCharts performance docs — debounce resize handlers'],
    docs: ['apps/rn-app/src/screens/ChartsScreen.tsx', 'apps/pwa-webapp/styles-charts.css'],
    scope: 'C6 feeds CL1 appointment PDF.',
  },
  {
    dir: 'plan-10-home-dashboard',
    exec: '10',
    section: 1,
    title: 'Home & dashboard',
    ids: 'H1–H7',
    cve: [
      'H5 weather API: API key in client is public — use server proxy or rate-limited key; no precise geolocation stored without consent.',
      'H7 LLM question: same injection rules as homeQuestion intent.',
    ],
    perf: [
      'H1 adaptive layout: compute card order once per session/day, not every render.',
      'H2 spoon widget: derive from cached aggregates, not full log scan.',
    ],
    mitigations: ['Respect S5 simple mode + aiEnabled', 'Max font scale layout test'],
    verify: ['npm run projects:gate:fast', 'Manual home smoke'],
    extraEnv: '',
    firecrawl: ['.firecrawl/projects/owasp-health-mobile.json — minimize PHI on screen'],
    docs: ['packages/shared/src/ai/homeSuggestions.mjs'],
    scope: 'H8 widgets NR. H4 requires L8.',
  },
  {
    dir: 'plan-11-notifications',
    exec: '11',
    section: 9,
    title: 'Notifications & engagement',
    ids: 'R1–R6',
    cve: [
      'R4 Web Push: VAPID private key server-side only; subscribe endpoint auth; encrypt payload per RFC 8291.',
      'Notification body must not contain PHI snippets — generic copy only.',
    ],
    perf: ['R1 learned timing: persist median in preferences, update weekly not per save.', 'Batch local notifications (L3 doses) with OS limits in mind.'],
    mitigations: ['verify:push-contract', 'Region + consent gates for R4', 'R2 requires L3, R3 requires A5'],
    verify: ['npm run verify:push-contract', 'npm run test:unit'],
    extraEnv: 'verify:push-contract',
    firecrawl: ['.firecrawl/projects/web-push-security.json — VAPID + encryption'],
    docs: ['docs/research/web-push-pwa-mdn-notes.md', 'apps/pwa-webapp/sw.js'],
    scope: 'Document iOS delivery variance in parity notes.',
  },
  {
    dir: 'plan-12-clinician-sharing',
    exec: '12',
    section: 11,
    title: 'Clinician & sharing',
    ids: 'CL1, CL2, CL4, CL5',
    cve: [
      'CL2 QR handoff: ephemeral keys; QR payload encrypted; no PHI in URL.',
      'CL1 PDF: metadata scrub (author/title); user confirms before share.',
      'CL5 LLM questions: wellness framing; not diagnosis.',
    ],
    perf: ['PDF generation off main thread where possible (RN expo-print async).', 'CL4 timeline: virtualize long med histories.'],
    mitigations: ['P4 crypto for CL2', 'Disclaimers on all clinician outputs', 'CL3 NR'],
    verify: ['npm run test:unit', 'PDF smoke mobile'],
    extraEnv: '',
    firecrawl: ['.firecrawl/projects/owasp-health-mobile.json — secure sharing / BAAs'],
    docs: ['apps/pwa-webapp/print-utils.js', 'docs/ai-security.md §6'],
    scope: 'X14.4 telehealth mode extends CL1/C6.',
  },
  {
    dir: 'plan-13-research-community',
    exec: '13',
    section: 12,
    title: 'Research & anonymized pool',
    ids: 'RE1, RE4',
    cve: [
      'RE1 k-anonymity: never return cohort stats below k threshold (recommend k>=5 document in UI).',
      'Re-identification via rare condition + date — suppress small cells.',
      'RE4 export: user own rows only; RLS enforced.',
    ],
    perf: ['Aggregation server-side or edge; cache cohort stats daily, not per request.'],
    mitigations: ['A8 payload shape', 'P5 DPIA helper copy', 'RE2/RE3 NR'],
    verify: ['npm run test:unit', 'No PII in anonymized payload audit'],
    extraEnv: '',
    firecrawl: ['.firecrawl/projects/k-anonymity.json'],
    docs: ['docs/privacy/dpia-health-sync.md', 'docs/supabase-rls-recommended.sql'],
    scope: 'Legal review before RE1 production copy.',
  },
  {
    dir: 'plan-14-cross-cutting',
    exec: '14',
    section: 14,
    title: 'Cross-cutting concepts',
    ids: 'X14.1–X14.5',
    cve: [
      'X14.5 PHQ-2/GAD-2: not diagnostic; crisis links HTTPS only; no scores sent to cloud without consent.',
      'X14.1 Weekly Review PDF: same controls as CL1.',
    ],
    perf: ['X14.1 guided flow: step lazy-load LLM/chart modules.', 'X14.4 presentation mode: reduce chart animation.'],
    mitigations: ['Audit plans 01–13 deferrals', 'X14.2 copy audit for local-first', 'Legal review X14.5'],
    verify: ['npm run projects:gate', 'End-to-end Weekly Review smoke'],
    extraEnv: '',
    firecrawl: ['.firecrawl/projects/owasp-masvs.md', 'docs/ai-security.md §6 GDPR Art. 22'],
    docs: ['docs/ai-security.md', 'All plan security-performance.md files'],
    scope: 'Capstone — no new IDs; integrates prior plans.',
  },
];

function mdList(items) {
  return items.map((i) => `- ${i}`).join('\n');
}

function writeVerifyScript(planDir, plan) {
  const scriptsDir = path.join(planDir, 'scripts');
  const lines = [
    '#!/usr/bin/env node',
    `/** Plan ${plan.exec} pre-rollout verify — run from repo root: node ${path.relative(root, path.join(scriptsDir, 'verify-plan.mjs')).replace(/\\\\/g, '/')} */`,
    "import { spawnSync } from 'node:child_process';",
    'const steps = [',
    ...plan.verify.map((v) => {
      if (v.startsWith('npm ')) return `  { cmd: 'npm', args: ['run', '${v.replace('npm run ', '')}'] },`;
      if (v.startsWith('node ')) return `  { cmd: process.execPath, args: ['${v.replace('node ', '')}'] },`;
      return `  // manual: ${v}`;
    }),
    '];',
    'for (const s of steps) {',
    "  if (!s.cmd) continue;",
    "  console.log('>', s.cmd, ...s.args);",
    "  const r = spawnSync(s.cmd, s.args, { stdio: 'inherit', shell: false });",
    '  if (r.status !== 0) process.exit(r.status ?? 1);',
    '}',
    "console.log('PLAN_VERIFY_OK');",
  ];
  fs.writeFileSync(path.join(scriptsDir, 'verify-plan.mjs'), lines.join('\n'));
}

for (const plan of PLANS) {
  const planDir = path.join(projects, plan.dir);
  if (!fs.existsSync(planDir)) {
    console.error('Missing', planDir);
    process.exit(1);
  }

  const sec = `# Plan ${plan.exec} — Security & performance review

**Section ${plan.section}:** ${plan.title} · **IDs:** ${plan.ids}

Cross-checked against repo [SECURITY.md](../../docs/SECURITY.md), [ai-security.md](../../docs/ai-security.md), and Firecrawl research in [.firecrawl/projects/](../../.firecrawl/projects/).

---

## CVE & exploit surface

${mdList(plan.cve)}

**CI baseline:** \`npm audit --omit=dev\`, OSV-Scanner, Gitleaks in [\`.github/workflows/ci.yml\`](../../.github/workflows/ci.yml). High/critical production deps must be fixed or accepted-risk documented before plan rollout commit.

---

## Performance

${mdList(plan.perf)}

**Local gate:** [\`server/launch-server.ps1\`](../../server/launch-server.ps1) compiled mode + boot audit — no console \`pageerror\` regressions.

---

## Mitigations (implementation)

${mdList(plan.mitigations)}

---

## Pre-commit verify

\`\`\`bash
node Projects/${plan.dir}/scripts/verify-plan.mjs
${plan.extraEnv ? `$env:PROJECTS_EXTRA_VERIFY = "${plan.extraEnv}"  # PowerShell\nnpm run projects:gate` : 'npm run projects:gate'}
\`\`\`

See [../ROLLOUT-GATE.md](../ROLLOUT-GATE.md).
`;

  const scope = `# Plan ${plan.exec} — Scope & scripts

**Section ${plan.section}:** ${plan.title} · **IDs:** ${plan.ids}

## In scope

- Features listed in [plan.md](./plan.md) and [../MASTER.md](../MASTER.md) §${plan.section}
- ${plan.scope}

## Out of scope (NR)

See [../MASTER.md §Excluded](../MASTER.md#excluded-nr).

## Folder layout

| File | Purpose |
|------|---------|
| [plan.md](./plan.md) | Agent runbook |
| [security-performance.md](./security-performance.md) | CVE + perf review |
| [references.md](./references.md) | External docs + Firecrawl |
| [scripts/verify-plan.mjs](./scripts/verify-plan.mjs) | Pre-rollout verify |

## Agent scripts (repo root)

| Command | When |
|---------|------|
| \`node Projects/${plan.dir}/scripts/verify-plan.mjs\` | Before local gate |
| \`npm run projects:gate\` | Full local CI-parity test |
| \`npm run projects:ci-watch\` | After push |
`;

  const refs = `# Plan ${plan.exec} — References

## Internal

${mdList(plan.docs.map((d) => `[\`${d}\`](../../${d})`))}

## Firecrawl research (local cache)

${mdList(plan.firecrawl.map((f) => `\`${f}\``))}

## External (verify online)

| Topic | URL |
|-------|-----|
| OWASP MASVS | https://owasp.org/www-project-mobile-app-security/ |
| OWASP Top 10 2025 | https://owasp.org/Top10/2025/ |
| Web Push encryption | https://www.rfc-editor.org/rfc/rfc8291 |
| Supabase RLS | https://supabase.com/docs/guides/database/postgres/row-level-security |
| Transformers.js | https://huggingface.co/docs/transformers.js |

Re-run Firecrawl before major dependency bumps:

\`\`\`bash
firecrawl search "<plan-specific query>" --limit 5 --scrape -o .firecrawl/projects/plan-${plan.exec}.json
\`\`\`
`;

  fs.writeFileSync(path.join(planDir, 'security-performance.md'), sec);
  fs.writeFileSync(path.join(planDir, 'scope.md'), scope);
  fs.writeFileSync(path.join(planDir, 'references.md'), refs);
  writeVerifyScript(planDir, plan);
  console.log('Wrote', plan.dir);
}

console.log('Done:', PLANS.length, 'plans');
