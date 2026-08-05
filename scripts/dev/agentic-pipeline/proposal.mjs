/**
 * Proposal schema + extractor for agentic pack approval flow.
 */
import fs from 'node:fs';
import path from 'node:path';
import { ensureDir, packDir, getAgenticRoot } from './state.mjs';

export const PROPOSAL_SCHEMA_VERSION = 1;

export const ITEM_KINDS = new Set([
  'ack_only', 'code_hint', 'doc_patch', 'i18n_string', 'wiki_patch',
  'changelog_bullet', 'visual_apply', 'visual_repolish', 'deps_note', 'deps_bump',
  'fact_check', 'file_write', 'file_create', 'script_run', 'tidy',
]);

const KIND_PREFIX = new Set([
  'fact_check', 'file_write', 'file_create', 'script_run', 'tidy',
  'doc_patch', 'code_hint', 'changelog_bullet', 'wiki_patch', 'deps_note', 'deps_bump',
  'visual_apply', 'ack_only',
]);

const PATH_RE = /\b((?:apps|packages|scripts|docs|wiki|i18n-packs|tests|server|benchmarks|artifacts\/agentic)\/[\w./-]+\.[\w]+|CHANGELOG\.md|AGENTS\.md|README\.md)\b/;

export function proposalPath(packId) {
  return path.join(packDir(packId), 'proposal.json');
}

export function emptyProposal(packId, extras = {}) {
  return {
    pack: packId,
    schemaVersion: PROPOSAL_SCHEMA_VERSION,
    status: extras.status || 'pending_approval',
    createdAt: new Date().toISOString(),
    model: extras.model || null,
    summary: extras.summary || '',
    thinking: extras.thinking || '',
    items: extras.items || [],
    gates: extras.gates || [],
    approval: {
      state: 'pending',
      at: null,
      by: null,
      confirmProductWrite: false,
      allowDependencyBump: false,
      gitCommitOnApprove: false,
      gitCommitSha: null,
      ...(extras.approval || {}),
    },
  };
}

export function readProposal(packId) {
  const p = proposalPath(packId);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

export function writeProposal(packId, proposal) {
  ensureDir(packDir(packId));
  const next = {
    ...proposal,
    pack: packId,
    schemaVersion: PROPOSAL_SCHEMA_VERSION,
  };
  fs.writeFileSync(proposalPath(packId), `${JSON.stringify(next, null, 2)}\n`);
  return next;
}

function defaultAdapterForKind(kind, fallback) {
  if (kind === 'file_write' || kind === 'file_create' || kind === 'doc_patch' || kind === 'code_hint') {
    return 'safe-patch';
  }
  if (kind === 'script_run') return 'research-script-run';
  if (kind === 'tidy') return 'research-tidy';
  if (kind === 'changelog_bullet') return 'changelog-promote';
  if (kind === 'wiki_patch') return 'wiki-sync';
  if (kind === 'i18n_string') return 'i18n-apply-fill';
  if (kind === 'visual_apply') return 'visual-apply';
  if (kind === 'visual_repolish') return 'visual-repolish';
  if (kind === 'deps_bump') return 'deps-bump';
  if (kind === 'fact_check') return 'write-approved-artifact';
  if (kind === 'ack_only') return 'ack';
  return fallback || 'ack';
}

/** Parse a single proposed-action block (title line + optional attrs / fence). */
export function parseActionBlock(rawBlock, opts = {}) {
  const block = String(rawBlock || '').trim();
  if (!block) return null;
  const lines = block.split(/\r?\n/);
  let first = (lines[0] || '').replace(/^(?:\d+[\).\]]|-|\*)\s+/, '').replace(/\*\*/g, '').trim();
  if (!first) return null;

  let kind = opts.defaultKind || 'ack_only';
  const prefix = first.match(/^\[([a-z_]+)\]\s*(.*)$/i);
  if (prefix && KIND_PREFIX.has(prefix[1].toLowerCase())) {
    kind = prefix[1].toLowerCase();
    first = prefix[2].trim() || first;
  }

  let mode = null;
  let itemPath = null;
  const pathAttr = first.match(/\bpath\s*=\s*["']?([^\s"']+)["']?/i);
  if (pathAttr) itemPath = pathAttr[1];
  const modeAttr = first.match(/\bmode\s*=\s*["']?(search_replace|append|create|replace)["']?/i);
  if (modeAttr) mode = modeAttr[1].toLowerCase();

  const rest = lines.slice(1).join('\n');
  const fence = rest.match(/```(?:patch|diff|text|md|markdown)?\s*\n([\s\S]*?)```/i);
  let content = fence ? fence[1].replace(/\s+$/, '') : null;
  let find = null;
  let replace = null;
  if (content && /<<<SEARCH|=======|>>>REPLACE/i.test(content)) {
    const m = content.match(/<<<SEARCH\s*\n([\s\S]*?)\n=======\s*\n([\s\S]*?)(?:\n>>>REPLACE)?$/i)
      || content.match(/find:\s*\n([\s\S]*?)\nreplace:\s*\n([\s\S]*)$/i);
    if (m) {
      find = m[1];
      replace = m[2];
      mode = mode || 'search_replace';
      content = null;
    }
  }

  const pathInText = `${first}\n${rest}`.match(PATH_RE);
  if (!itemPath && pathInText) itemPath = pathInText[1];

  const findLine = rest.match(/^\s*find:\s*(.+)$/im);
  const replaceLine = rest.match(/^\s*replace:\s*(.+)$/im);
  if (!find && findLine) find = findLine[1].trim();
  if (!replace && replaceLine) replace = replaceLine[1].trim();
  if (find != null && replace != null) mode = mode || 'search_replace';

  if (!mode) {
    if (kind === 'file_create') mode = 'create';
    else if (content) mode = 'replace';
    else if (kind === 'doc_patch' || kind === 'code_hint' || kind === 'file_write') mode = 'append';
  }

  const title = first
    .replace(/\bpath\s*=\s*["']?[^\s"']+["']?/ig, '')
    .replace(/\bmode\s*=\s*["']?[^\s"']+["']?/ig, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200) || `${kind} ${itemPath || ''}`.trim();

  const applyAdapter = opts.defaultAdapter
    ? defaultAdapterForKind(kind, opts.defaultAdapter)
    : defaultAdapterForKind(kind, 'ack');

  const item = {
    kind,
    title,
    detail: block.slice(0, 4000),
    risk: /security|csp|bump|lockfile|critical/i.test(block) ? 'high' : 'low',
    targets: itemPath ? [itemPath] : [],
    selected: !/bump|npm install/i.test(title),
    applyAdapter,
  };
  if (itemPath) item.path = itemPath;
  if (mode) item.mode = mode;
  if (content != null && content !== '') {
    item.content = content;
    item.proposed = content;
  }
  if (find != null) item.find = find;
  if (replace != null) item.replace = replace;
  return item;
}

/** Split ## Proposed actions into blocks and parse structured fields. */
export function extractProposalFromMarkdown(packId, markdown, opts = {}) {
  const text = String(markdown || '').trim();
  let thinking = text;
  let actionsBlock = '';
  const m = text.match(/##\s*Thinking\s*([\s\S]*?)(?=##\s*Proposed actions|$)/i);
  const a = text.match(/##\s*Proposed actions\s*([\s\S]*?)$/i);
  if (m) thinking = m[1].trim();
  if (a) actionsBlock = a[1].trim();

  const items = [];
  if (actionsBlock) {
    // Prefer numbered actions so fenced markdown bullets (`- note`) stay inside the body.
    const parts = actionsBlock.split(/(?=^\d+[\).\]]\s+)/m).map((p) => p.trim()).filter(Boolean);
    const blocks = parts.length > 1 || /^\d+[\).\]]\s+/m.test(actionsBlock)
      ? parts
      : actionsBlock.split(/(?=^(?:-|\*)\s+)/m).map((p) => p.trim()).filter(Boolean);
    for (const part of blocks) {
      const parsed = parseActionBlock(part, opts);
      if (!parsed) continue;
      items.push({
        id: `${packId}-${items.length + 1}`,
        ...parsed,
      });
    }
  }

  if (!items.length) {
    items.push({
      id: `${packId}-ack`,
      kind: 'ack_only',
      title: 'Acknowledge advisory findings',
      detail: thinking.slice(0, 500) || 'Review advisory and acknowledge.',
      risk: 'low',
      targets: [],
      selected: true,
      applyAdapter: 'ack',
    });
  }

  return emptyProposal(packId, {
    model: opts.model,
    summary: `${items.length} proposed action(s)`,
    thinking,
    items,
    gates: opts.gates || [],
    status: opts.dryRun ? 'dry_run' : 'pending_approval',
    approval: opts.dryRun ? { state: 'pending', by: null } : undefined,
  });
}

export function humanGateLabel(cmd) {
  const s = String(cmd || '');
  if (s.includes('verify:i18n')) return 'i18n checks';
  if (s.includes('design-tokens')) return 'Design tokens';
  if (s.includes('icon-spec')) return 'Icon spec';
  if (s.includes('a11y')) return 'Accessibility';
  if (s.includes('seo:')) return 'SEO check';
  if (s.includes('privacy') || s.includes('ropa')) return 'Privacy / ROPA';
  if (s.includes('csp') || s.includes('cspro') || s.includes('unsafe-sinks') || s.includes('llm-security')) {
    return 'Security gate';
  }
  if (s.includes('audit:deps')) return 'Dependency audit';
  if (s.includes('migration')) return 'Migration verify';
  if (s.includes('wiki') || s.includes('doc-links')) return 'Docs / wiki';
  if (s.includes('bundle-split') || s.includes('cwv')) return 'Performance';
  if (s.includes('boot')) return 'Boot audit';
  return s.replace(/^npm run\s+/, '').slice(0, 48) || 'Gate';
}

export function appendApprovalLog(entry) {
  ensureDir(getAgenticRoot());
  const p = path.join(getAgenticRoot(), 'approval-log.jsonl');
  fs.appendFileSync(p, `${JSON.stringify({ ...entry, at: new Date().toISOString() })}\n`);
}

export function validateProposalShape(proposal) {
  if (!proposal || typeof proposal !== 'object') return { ok: false, error: 'not an object' };
  if (proposal.schemaVersion !== PROPOSAL_SCHEMA_VERSION) {
    return { ok: false, error: `schemaVersion must be ${PROPOSAL_SCHEMA_VERSION}` };
  }
  if (!proposal.pack) return { ok: false, error: 'pack required' };
  if (!Array.isArray(proposal.items)) return { ok: false, error: 'items must be array' };
  for (const it of proposal.items) {
    if (!it.id || !it.title) return { ok: false, error: 'item needs id+title' };
    if (it.kind && !ITEM_KINDS.has(it.kind)) return { ok: false, error: `bad kind ${it.kind}` };
  }
  return { ok: true };
}
