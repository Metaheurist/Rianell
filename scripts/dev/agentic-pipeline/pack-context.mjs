/**
 * Codebase-aware context for agentic pack LLM prompts.
 * Assembles registers, docs, focus path inventories, gate excerpts, and recent git digests
 * so Thinking / Proposed actions cite real repo paths instead of generic advice.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  sanitizeAgentContext,
  filterAllowedContextPaths,
} from '../sanitize-agent-context.mjs';
import { silentSpawnSync } from './spawn-silent.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../..');

const MAX_DOC_CHARS = 4500;
const MAX_TOTAL_CHARS = 14000;
const MAX_GATE_CHARS = 1800;
const MAX_LIST_FILES = 48;
const MAX_GIT_CHARS = 1200;

/**
 * Per-pack context manifests. Paths are repo-relative (posix-ish).
 * @type {Record<string, {
 *   mission: string,
 *   registers?: string[],
 *   docs?: string[],
 *   focusPaths?: string[],
 *   gitPaths?: string[],
 *   constraints?: string[],
 * }>}
 */
export const PACK_CONTEXT_MANIFEST = {
  design: {
    mission:
      'Review design-token and icon-spec contracts; propose concrete token/CSS/icon doc fixes.',
    registers: ['docs/style-and-design/prompt-register.json'],
    docs: [
      'docs/style-and-design/icon-grid.md',
      'docs/style-and-design/prompt-register.json',
    ],
    focusPaths: [
      'apps/pwa-webapp/css/tokens.css',
      'docs/style-and-design',
      'scripts/verify/verify-design-tokens.mjs',
      'scripts/verify/verify-icon-spec.mjs',
    ],
    gitPaths: ['apps/pwa-webapp/css/', 'docs/style-and-design/', 'scripts/verify/verify-design-tokens.mjs'],
    constraints: [
      'Cite existing files under docs/style-and-design/ or apps/pwa-webapp/css/.',
      'Do not invent new design systems; extend ICON_CONTRACT / tokens already in-repo.',
    ],
  },
  planning: {
    mission:
      'Draft feature-planning advisory artifacts grounded in the next-phase plan and architecture standard.',
    registers: ['docs/development/planning-register.json'],
    docs: [
      'docs/next-phase-development-plan.md',
      'docs/architecture-standard.md',
      'docs/plans/MASTER.md',
    ],
    focusPaths: ['docs/next-phase-development-plan.md', 'docs/plans', 'docs/development'],
    gitPaths: ['docs/next-phase-development-plan.md', 'docs/plans/', 'CHANGELOG.md'],
    constraints: [
      'Advisory artifacts only — no product code edits unless paths already exist in context.',
      'Align proposals with packages/* vs apps/* dependency direction.',
    ],
  },
  i18n: {
    mission: 'Triage i18n coverage gaps and propose locale/key fills (propose-dir only until approve).',
    registers: ['docs/development/i18n-register.json'],
    docs: ['docs/development/i18n-register.json'],
    focusPaths: ['i18n-packs', 'scripts/i18n', 'scripts/verify/i18n-all.mjs'],
    gitPaths: ['i18n-packs/', 'scripts/i18n/', 'scripts/verify/i18n-all.mjs'],
    constraints: [
      'Never invent health/screening copy. Prefer Tier-C propose-dir workflow.',
      'Name concrete locale files or keys when known from gates.',
    ],
  },
  rtl: {
    mission: 'Find RTL layout risks for ar/he in the PWA shell and CSS.',
    registers: ['docs/development/rtl-register.json'],
    docs: ['docs/development/rtl-register.json'],
    focusPaths: [
      'apps/pwa-webapp/css',
      'apps/pwa-webapp/index.html',
      'i18n-packs/ar',
      'i18n-packs/he',
    ],
    gitPaths: ['apps/pwa-webapp/css/', 'i18n-packs/ar/', 'i18n-packs/he/'],
    constraints: [
      'Call out dir=rtl / logical CSS property gaps with file paths.',
    ],
  },
  a11y: {
    mission: 'Map a11y gate failures to concrete PWA / token fixes.',
    registers: ['docs/development/a11y-register.json'],
    docs: ['docs/development/a11y-register.json'],
    focusPaths: [
      'scripts/verify/verify-a11y-tokens.mjs',
      'scripts/audit/run-axe-audit.mjs',
      'apps/pwa-webapp/css/tokens.css',
    ],
    gitPaths: ['apps/pwa-webapp/', 'scripts/audit/', 'scripts/verify/verify-a11y-tokens.mjs'],
    constraints: [
      'Prefer WCAG-oriented fixes tied to failing selectors or token names from gate output.',
    ],
  },
  seo: {
    mission: 'Close SEO structured-data / sitemap / content check gaps.',
    registers: ['docs/development/seo-register.json'],
    docs: ['docs/development/seo-register.json'],
    focusPaths: ['scripts/seo', 'apps/pwa-webapp', 'wiki'],
    gitPaths: ['scripts/seo/', 'wiki/'],
    constraints: ['Name FAQ / MedicalWebPage / sitemap files that exist in context.'],
  },
  privacy: {
    mission: 'Review privacy docs / ROPA drift — never include health screening answers.',
    registers: ['docs/development/privacy-register.json'],
    docs: [
      'docs/development/privacy-register.json',
      'docs/project-reference.md',
    ],
    focusPaths: [
      'packages/shared/src/privacy',
      'scripts/verify/verify-ropa-drift.mjs',
      'wiki',
    ],
    gitPaths: ['packages/shared/src/privacy/', 'docs/', 'wiki/'],
    constraints: [
      'No PHQ/GAD content. Focus on consent, ROPA, and anonymised sharing prefs.',
    ],
  },
  security: {
    mission:
      'Security + CSP / unsafe-sink / threat-model deltas — advisory only; do not propose CSP file mutations.',
    registers: ['security/review-register.json'],
    docs: [
      'security/review-register.json',
      'docs/threat-model.md',
    ],
    focusPaths: [
      'scripts/verify/verify-csp-connect-src.mjs',
      'scripts/verify/verify-unsafe-sinks.mjs',
      'server/http_security.py',
    ],
    gitPaths: ['security/', 'scripts/verify/verify-csp', 'server/http_security.py', 'docs/threat-model.md'],
    constraints: [
      'Do not propose editing CSP allowlists in this pack.',
      'Reference STRIDE deltas vs docs/threat-model.md when relevant.',
    ],
  },
  deps: {
    mission: 'Triage npm audit findings into explicit bump candidates with risk labels.',
    registers: ['docs/development/deps-register.json'],
    docs: ['docs/development/deps-register.json'],
    focusPaths: ['package.json', 'package-lock.json'],
    gitPaths: ['package.json', 'package-lock.json'],
    constraints: [
      'List package@version bump candidates; never instruct silent npm install.',
      'Bumps require allowDependencyBump + operator confirm.',
    ],
  },
  migration: {
    mission: 'Enforce architecture migration: packages must not import apps; scripts layout hygiene.',
    registers: ['docs/development/migration-register.json'],
    docs: [
      'docs/architecture-standard.md',
      'docs/development/migration-register.json',
      'AGENTS.md',
    ],
    focusPaths: [
      'packages',
      'apps',
      'scripts/verify/migration-complete.mjs',
    ],
    gitPaths: ['packages/', 'apps/', 'scripts/', 'docs/architecture-standard.md'],
    constraints: [
      'Flag any packages/* → apps/* import direction violations with paths.',
    ],
  },
  changelog: {
    mission: 'Draft Keep-a-Changelog bullets from recent repo work under [Unreleased].',
    registers: ['docs/development/changelog-register.json'],
    docs: ['CHANGELOG.md', 'docs/development/changelog-register.json'],
    focusPaths: ['CHANGELOG.md'],
    gitPaths: ['CHANGELOG.md', 'docs/', 'scripts/dev/agentic-pipeline/', 'apps/pwa-webapp/'],
    constraints: [
      'Match existing CHANGELOG tone; Added/Changed/Fixed sections.',
      'Ground bullets in git digest + Unreleased section, not invented features.',
    ],
  },
  wikisync: {
    mission: 'Fix wiki / doc-link drift with concrete wiki or docs paths.',
    registers: ['docs/development/wikisync-register.json'],
    docs: ['docs/development/wikisync-register.json'],
    focusPaths: ['wiki', 'docs', 'scripts/verify/doc-links.mjs'],
    gitPaths: ['wiki/', 'docs/'],
    constraints: ['Prefer patches for broken links reported by gates.'],
  },
  image: {
    mission: 'Draft alt-text / image metadata advisories for content images (no binary invention).',
    registers: ['docs/development/image-register.json'],
    docs: ['docs/development/image-register.json'],
    focusPaths: ['apps/pwa-webapp/assets', 'docs/icons'],
    gitPaths: ['apps/pwa-webapp/assets/', 'docs/icons/'],
    constraints: ['No new binary assets; text/metadata only.'],
  },
  bootllm: {
    mission: 'Triage boot / first-inference latency risks from audit gates when present.',
    registers: ['docs/development/bootllm-register.json'],
    docs: ['docs/development/bootllm-register.json'],
    focusPaths: [
      'scripts/audit',
      'apps/pwa-webapp',
      'audit-history',
    ],
    gitPaths: ['scripts/audit/', 'audit-history/', 'apps/pwa-webapp/'],
    constraints: ['Use gate/boot audit paths when available; avoid inventing probe URLs.'],
  },
  perf: {
    mission: 'CWV + bundle-split triage with file-level backlog items.',
    docs: ['docs/development/agentic-pack-catalog.md'],
    focusPaths: [
      'scripts/verify',
      'apps/pwa-webapp',
      'packages',
    ],
    gitPaths: ['apps/pwa-webapp/', 'packages/', 'scripts/verify/'],
    constraints: ['Tie actions to bundle-split / CWV gate output when present.'],
  },
  visual: {
    mission: 'Visual pack: Gates → Q&A candidates → Approve → Polish×8 (C only). Product apply stays QA-gated separately.',
    docs: ['docs/development/visual-pack-harness.md'],
    focusPaths: [
      'apps/pwa-webapp/assets/visual-register.json',
      'artifacts/visual-gen/qa',
    ],
    gitPaths: ['apps/pwa-webapp/assets/', 'docs/development/visual-pack-harness.md'],
    constraints: ['Never auto-apply; require QA green + confirm.'],
  },
};

function toAbs(rel) {
  return path.join(ROOT, rel.replace(/\\/g, '/'));
}

function relPosix(abs) {
  return path.relative(ROOT, abs).split(path.sep).join('/');
}

function readTextCapped(abs, maxChars = MAX_DOC_CHARS) {
  if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) return null;
  const raw = fs.readFileSync(abs, 'utf8');
  const slice = raw.length > maxChars ? `${raw.slice(0, maxChars)}\n…[truncated]` : raw;
  const clean = sanitizeAgentContext(slice, { sourcePath: relPosix(abs) });
  if (clean.blocked) return null;
  return clean.text;
}

/**
 * Shallow inventory of a file or directory (names + sizes only).
 * @param {string} rel
 * @param {number} budget
 */
function inventoryPath(rel, budget = MAX_LIST_FILES) {
  const abs = toAbs(rel);
  const lines = [];
  if (!fs.existsSync(abs)) {
    return [`(missing) ${rel}`];
  }
  const st = fs.statSync(abs);
  if (st.isFile()) {
    return [`file ${rel} (${st.size} bytes)`];
  }
  /** @type {{ rel: string, size: number }[]} */
  const found = [];
  function walk(dir, depth) {
    if (found.length >= budget) return;
    let ents;
    try {
      ents = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const ent of ents) {
      if (found.length >= budget) break;
      if (ent.name === 'node_modules' || ent.name === '.git' || ent.name === 'dist') continue;
      const child = path.join(dir, ent.name);
      const r = relPosix(child);
      if (PATH_IS_DENIED(r)) continue;
      if (ent.isDirectory()) {
        if (depth < 2) walk(child, depth + 1);
        else found.push({ rel: `${r}/`, size: 0 });
      } else if (ent.isFile()) {
        try {
          found.push({ rel: r, size: fs.statSync(child).size });
        } catch {
          found.push({ rel: r, size: 0 });
        }
      }
    }
  }
  walk(abs, 0);
  for (const f of found) {
    lines.push(f.size ? `${f.rel} (${f.size}b)` : f.rel);
  }
  if (!lines.length) lines.push(`(empty) ${rel}`);
  return lines;
}

function PATH_IS_DENIED(rel) {
  return filterAllowedContextPaths([rel]).length === 0;
}

function formatGates(gateResults) {
  if (!gateResults?.length) return '(no gates run)';
  const parts = [];
  for (const g of gateResults) {
    const head = `- ${g.status || '?'} · \`${g.cmd || ''}\``;
    let body = '';
    if (g.status === 'fail') {
      const err = String(g.stderr || g.stdout || '').slice(0, MAX_GATE_CHARS);
      const clean = sanitizeAgentContext(err).text;
      if (clean.trim()) body = `\n\`\`\`\n${clean}\n\`\`\``;
    } else if (g.stdout) {
      const out = String(g.stdout).slice(0, 400);
      const clean = sanitizeAgentContext(out).text;
      if (clean.trim()) body = `\n  stdout: ${clean.replace(/\s+/g, ' ').slice(0, 280)}`;
    }
    parts.push(head + body);
  }
  return parts.join('\n');
}

function gitDigest(gitPaths = []) {
  const paths = filterAllowedContextPaths(gitPaths).filter(Boolean);
  if (!paths.length) return '';
  const argsStat = ['diff', '--stat', 'HEAD~12', '--', ...paths];
  const argsLog = ['log', '--oneline', '-8', '--', ...paths];
  const run = (args) => {
    const res = silentSpawnSync('git', args, { cwd: ROOT });
    if (res.status !== 0) return '';
    return String(res.stdout || '').trim();
  };
  const stat = run(argsStat).slice(0, MAX_GIT_CHARS);
  const log = run(argsLog).slice(0, 600);
  const chunks = [];
  if (log) chunks.push(`Recent commits:\n${log}`);
  if (stat) chunks.push(`Diff --stat (≤12 commits):\n${stat}`);
  return chunks.join('\n\n');
}

/**
 * @param {string} packId
 * @param {{ gateResults?: object[], topic?: string }} [opts]
 */
export function gatherPackContext(packId, opts = {}) {
  const manifest = PACK_CONTEXT_MANIFEST[packId] || {
    mission: `Review Rianell pack ${packId} with file-level next steps.`,
    docs: [`docs/development/${packId}-register.json`],
    focusPaths: ['docs/development', 'AGENTS.md'],
    gitPaths: ['docs/', 'CHANGELOG.md'],
    constraints: ['Cite only paths present in Repo context.'],
  };

  const filesUsed = [];
  const sections = [];
  let total = 0;

  const push = (title, body) => {
    if (!body || !String(body).trim()) return;
    const block = `### ${title}\n${String(body).trim()}\n`;
    if (total + block.length > MAX_TOTAL_CHARS) {
      const room = MAX_TOTAL_CHARS - total - 32;
      if (room < 200) return;
      sections.push(block.slice(0, room) + '\n…[context budget truncated]\n');
      total = MAX_TOTAL_CHARS;
      return;
    }
    sections.push(block);
    total += block.length;
  };

  push('Mission', manifest.mission);
  if (opts.topic) push('Pack topic', opts.topic);

  if (manifest.constraints?.length) {
    push('Hard constraints', manifest.constraints.map((c) => `- ${c}`).join('\n'));
  }

  const registerPaths = filterAllowedContextPaths([
    ...(manifest.registers || []),
    ...(manifest.docs || []).filter((d) => d.endsWith('-register.json') || d.includes('register')),
  ]);
  const docBodies = [];
  for (const rel of [...new Set([...(manifest.registers || []), ...(manifest.docs || [])])]) {
    if (PATH_IS_DENIED(rel)) continue;
    const text = readTextCapped(toAbs(rel));
    if (text == null) continue;
    filesUsed.push(rel);
    docBodies.push(`#### ${rel}\n\`\`\`\n${text}\n\`\`\``);
  }
  if (docBodies.length) push('Registers & docs', docBodies.join('\n\n'));

  const focus = filterAllowedContextPaths(manifest.focusPaths || []);
  if (focus.length) {
    const inv = [];
    for (const rel of focus) {
      inv.push(`#### ${rel}\n${inventoryPath(rel).map((l) => `- ${l}`).join('\n')}`);
    }
    push('Focus path inventory', inv.join('\n\n'));
  }

  const gatesMd = formatGates(opts.gateResults || []);
  push('Gate results', gatesMd);

  const digest = gitDigest(manifest.gitPaths || []);
  if (digest) {
    const clean = sanitizeAgentContext(digest).text;
    push('Recent git (pack paths)', clean);
  }

  // Shared architecture anchors (short) for every pack
  const anchors = [
    'docs/architecture-standard.md',
    'AGENTS.md',
  ];
  const anchorBits = [];
  for (const rel of anchors) {
    if (filesUsed.includes(rel)) continue;
    const text = readTextCapped(toAbs(rel), 1200);
    if (text) {
      filesUsed.push(rel);
      anchorBits.push(`#### ${rel}\n\`\`\`\n${text}\n\`\`\``);
    }
  }
  if (anchorBits.length) push('Architecture anchors (excerpt)', anchorBits.join('\n\n'));

  const markdown = sections.join('\n');
  return {
    packId,
    mission: manifest.mission,
    filesUsed,
    charCount: markdown.length,
    markdown,
    manifest,
  };
}

/**
 * Build the full user prompt for a pack LLM call.
 * @param {{
 *   packId: string,
 *   topic?: string,
 *   gateResults?: object[],
 *   writeArtifactDir?: string,
 * }} opts
 */
export function buildPackLlmPrompt(opts) {
  const ctx = gatherPackContext(opts.packId, {
    gateResults: opts.gateResults,
    topic: opts.topic,
  });

  const prompt = [
    `You are reviewing the **${opts.packId}** pack for the Rianell monorepo.`,
    '',
    'Use ONLY the Repo context below. Prefer citing real paths that appear there.',
    'If context is thin, say what is missing instead of inventing files.',
    '',
    '## Repo context',
    ctx.markdown,
    '',
    '## Your job',
    `- Topic focus: ${opts.topic || ctx.mission}`,
    '- In **## Thinking**: reference specific gate outcomes, docs, or paths from Repo context (not generic best practices).',
    '- In **## Proposed actions**: numbered, concrete, file-level next steps (path + what to change). Max 8 items.',
    '- Mark risk implicitly via wording (advisory vs product-write). Do not invent secrets or health data.',
  ].join('\n');

  const clean = sanitizeAgentContext(prompt);
  const meta = {
    packId: opts.packId,
    filesUsed: ctx.filesUsed,
    charCount: clean.text.length,
    redactions: clean.redactions?.length || 0,
    builtAt: new Date().toISOString(),
  };

  if (opts.writeArtifactDir) {
    try {
      fs.mkdirSync(opts.writeArtifactDir, { recursive: true });
      fs.writeFileSync(path.join(opts.writeArtifactDir, 'llm-context.md'), `${clean.text}\n`);
      fs.writeFileSync(
        path.join(opts.writeArtifactDir, 'llm-context.meta.json'),
        `${JSON.stringify(meta, null, 2)}\n`,
      );
    } catch {
      /* non-fatal */
    }
  }

  return {
    prompt: clean.text,
    meta,
    context: ctx,
  };
}

export const ADVISORY_SYSTEM = `You are the Rianell local agentic reviewer for this monorepo.

Output markdown with exactly these sections:
## Thinking
(2–6 short paragraphs or bullets grounded in the provided Repo context — cite paths, gate names, or doc titles. Avoid generic advice that could apply to any app.)
## Proposed actions
1. Concrete action with repo path(s)
2. Next action with repo path(s)

Rules:
- Prefer paths that appear under ## Repo context.
- Do not invent files, packages, or APIs.
- No secrets. No health scores or screening answers.
- Do not propose silent dependency installs or CSP allowlist edits unless the pack constraints explicitly allow it.`;

export { ROOT as PACK_CONTEXT_ROOT };
