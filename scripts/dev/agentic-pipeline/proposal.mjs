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

/** Split LLM markdown into Thinking + Proposed actions numbered list. */
export function extractProposalFromMarkdown(packId, markdown, opts = {}) {
  const text = String(markdown || '').trim();
  let thinking = text;
  let actionsBlock = '';
  const m = text.match(/##\s*Thinking\s*([\s\S]*?)(?=##\s*Proposed actions|$)/i);
  const a = text.match(/##\s*Proposed actions\s*([\s\S]*?)$/i);
  if (m) thinking = m[1].trim();
  if (a) actionsBlock = a[1].trim();

  const items = [];
  const lines = actionsBlock.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    const num = line.match(/^(?:\d+[\).\]]|-|\*)\s+(.+)$/);
    if (!num) continue;
    const title = num[1].replace(/\*\*/g, '').trim();
    if (!title) continue;
    const id = `${packId}-${items.length + 1}`;
    items.push({
      id,
      kind: opts.defaultKind || 'ack_only',
      title: title.slice(0, 200),
      detail: title,
      risk: /security|csp|bump|lockfile|critical/i.test(title) ? 'high' : 'low',
      targets: [],
      selected: !/bump|npm install/i.test(title),
      applyAdapter: opts.defaultAdapter || 'ack',
    });
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
