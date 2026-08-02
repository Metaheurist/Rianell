/**
 * Shared Research tool (Firecrawl) — runs as a wizard stage on every pack
 * after Gates and before LLM/proposal so Ollama can ground Approvals.
 *
 * Not a standalone pack tab. Artifacts land under each pack dir:
 *   artifacts/agentic/<packId>/web-research.{json,md}
 */
import fs from 'node:fs';
import path from 'node:path';
import { packDir, ensureDir, ROOT } from './state.mjs';
import { researchWeb, formatResearchContext } from './firecrawl-client.mjs';
import { getFirecrawlStatus } from './firecrawl-config.mjs';
import { classifyResearchAction } from './research-apply.mjs';
import { PACK_CONTEXT_MANIFEST } from './pack-context.mjs';

function loadRegister() {
  const p = path.join(ROOT, 'docs/development/research-register.json');
  if (!fs.existsSync(p)) {
    return { defaultQueries: [], byPack: {}, scrapeTop: 2, limitPerQuery: 3 };
  }
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return { defaultQueries: [], byPack: {}, scrapeTop: 2, limitPerQuery: 3 };
  }
}

/**
 * Pack-scoped queries: register.byPack → defaults → mission-derived.
 */
export function resolvePackResearchQueries(packId, opts = {}) {
  if (Array.isArray(opts.queries) && opts.queries.length) {
    return opts.queries.map(String).filter(Boolean).slice(0, 3);
  }
  const envQ = process.env.RESEARCH_QUERIES;
  if (envQ) {
    return envQ.split('|').map((s) => s.trim()).filter(Boolean).slice(0, 3);
  }
  const reg = loadRegister();
  const byPack = reg.byPack?.[packId];
  if (Array.isArray(byPack) && byPack.length) return byPack.slice(0, 3);

  const mission = PACK_CONTEXT_MANIFEST[packId]?.mission || opts.topic || packId;
  const head = String(mission).replace(/\s+/g, ' ').trim().slice(0, 140);
  const defaults = (reg.defaultQueries || []).slice(0, 1);
  return [
    `Rianell PWA health app — ${packId} pack: ${head}`,
    ...defaults,
  ].filter(Boolean).slice(0, 3);
}

function writeBrief(outDir, bundle, llmPromptExtra) {
  ensureDir(outDir);
  fs.writeFileSync(path.join(outDir, 'web-research.json'), `${JSON.stringify(bundle, null, 2)}\n`);
  const md = formatResearchContext(bundle);
  fs.writeFileSync(path.join(outDir, 'web-research.md'), `${md}\n`);
  return {
    stage: 'research',
    sources: bundle.sources?.length || 0,
    configured: Boolean(bundle.configured),
    queries: bundle.queries || [],
    llmPromptExtra,
    researchMarkdown: md,
  };
}

/**
 * beforeLlm hook — wizard stage "research" for any pack.
 * Soft-fails to a stub brief when dry-run or key missing (never hard-breaks the pack).
 */
export async function researchBeforeLlm(ctx = {}) {
  const packId = ctx.packId || 'design';
  const outDir = ctx.dir || packDir(packId);
  const status = getFirecrawlStatus();
  const reg = loadRegister();
  const queries = resolvePackResearchQueries(packId, {
    queries: ctx.queries,
    topic: ctx.topic,
  });

  const grounder = [
    '',
    '## Research brief (use for Approvals)',
    `Pack: ${packId}. Ground ## Thinking claims against Sources below when URLs exist.`,
    'Prefer repo truth if sources conflict. Cite URLs for external facts.',
    'Do not invent health/screening clinical advice. Mark unsupported claims.',
  ].join('\n');

  if (ctx.dryRun || process.env.AGENTIC_SKIP_RESEARCH === '1') {
    const stub = {
      queriedAt: new Date().toISOString(),
      packId,
      queries,
      sources: [],
      errors: [{ query: '(dry-run)', error: process.env.AGENTIC_SKIP_RESEARCH === '1' ? 'AGENTIC_SKIP_RESEARCH=1' : 'Firecrawl skipped in dry-run' }],
      configured: status.configured,
    };
    const md = formatResearchContext(stub);
    return writeBrief(outDir, stub, `${md}\n${grounder}\nDry-run stub — no live web results.\n`);
  }

  if (!status.configured) {
    const stub = {
      queriedAt: new Date().toISOString(),
      packId,
      queries,
      sources: [],
      errors: [{ query: '(config)', error: 'FIRECRAWL_API_KEY not configured' }],
      configured: false,
    };
    const md = formatResearchContext(stub);
    return writeBrief(
      outDir,
      stub,
      `${md}\n${grounder}\nNo Firecrawl key — decide from repo context only; operator can set the key in Settings.\n`,
    );
  }

  let bundle;
  try {
    bundle = await researchWeb(queries, {
      limitPerQuery: reg.limitPerQuery || 3,
      scrapeTop: reg.scrapeTop ?? 1,
      maxQueries: 3,
    });
  } catch (err) {
    bundle = {
      queriedAt: new Date().toISOString(),
      queries,
      sources: [],
      errors: [{ query: '(firecrawl)', error: String(err?.message || err) }],
    };
  }
  bundle.configured = true;
  bundle.packId = packId;
  const md = formatResearchContext(bundle);
  return writeBrief(outDir, bundle, `${md}\n${grounder}\n`);
}

/**
 * Optional: reclassify proposal items that used research prefixes.
 * Remains available for adapters; most packs keep their own defaultKind.
 */
export function researchRefineProposal(proposal) {
  if (!proposal?.items) return proposal;
  const items = proposal.items.map((it) => {
    const prefix = String(it.title || '').match(/^\[(fact_check|file_write|file_create|script_run|tidy)\]\s*(.*)$/i);
    let title = it.title;
    let kind = it.kind;
    let applyAdapter = it.applyAdapter;
    let detail = it.detail || '';
    if (prefix) {
      kind = prefix[1].toLowerCase();
      title = prefix[2].trim() || title;
      if (kind === 'fact_check') applyAdapter = 'write-approved-artifact';
      else if (kind === 'tidy') applyAdapter = 'research-tidy';
      else if (kind === 'script_run') applyAdapter = 'research-script-run';
      else applyAdapter = 'research-file-write';
    } else {
      const c = classifyResearchAction(title, detail);
      kind = c.kind;
      applyAdapter = c.applyAdapter;
    }
    const pathHit = `${title} ${detail}`.match(/\b((?:apps|packages|scripts|docs|wiki|i18n-packs|tests|server|benchmarks|artifacts\/agentic)\/[\w./-]+\.[\w]+|CHANGELOG\.md|AGENTS\.md|README\.md)\b/);
    const npmHit = `${title} ${detail}`.match(/\bnpm run ([a-z0-9:_-]+)/i);
    const next = {
      ...it,
      title: title.slice(0, 200),
      kind,
      applyAdapter,
      risk: /file_|script_run/.test(kind) ? 'high' : (it.risk || 'low'),
      selected: kind === 'script_run' || kind === 'file_write' || kind === 'file_create' ? false : it.selected !== false,
    };
    if (pathHit) {
      next.path = pathHit[1];
      next.targets = [pathHit[1]];
    }
    if (npmHit) next.npmScript = npmHit[1];
    return next;
  });
  return { ...proposal, items, summary: `${items.length} research-grounded action(s)` };
}
