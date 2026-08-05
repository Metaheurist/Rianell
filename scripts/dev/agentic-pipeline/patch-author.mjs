/**
 * Second-pass Ollama authoring of concrete safe-patch bodies.
 */
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './state.mjs';
import { isAllowedWritePath, normalizeRelPath } from './research-apply.mjs';
import { ollamaGenerate } from './ollama-client.mjs';

const MUTATE_KINDS = new Set(['file_write', 'file_create', 'doc_patch', 'code_hint']);
const MAX_ITEMS = 3;
const MAX_FILE_CHARS = 12_000;

function hasBody(it) {
  if (it.find != null && it.replace != null) return true;
  if (it.content != null && String(it.content).trim()) return true;
  if (it.proposed != null && String(it.proposed).trim()) return true;
  return false;
}

function parseAuthorJson(text) {
  const raw = String(text || '').trim();
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fence ? fence[1].trim() : raw;
  try {
    return JSON.parse(body);
  } catch {
    const m = body.match(/\{[\s\S]*\}/);
    if (!m) return null;
    try {
      return JSON.parse(m[0]);
    } catch {
      return null;
    }
  }
}

/**
 * Fill missing patch bodies for selected mutate items (max 3).
 * @param {string} packId
 * @param {object[]} items
 * @param {{ model?: string, dryRun?: boolean }} opts
 */
export async function authorPatchBodies(packId, items, opts = {}) {
  if (opts.dryRun || process.env.AGENTIC_SKIP_PATCH_AUTHOR === '1') {
    return items;
  }
  const model = opts.model;
  if (!model) return items;

  let authored = 0;
  const next = [];
  for (const it of items) {
    if (authored >= MAX_ITEMS || !MUTATE_KINDS.has(it.kind) || it.selected === false || hasBody(it)) {
      next.push(it);
      continue;
    }
    const rel = normalizeRelPath(it.path || it.target || (it.targets && it.targets[0]));
    if (!rel || !isAllowedWritePath(rel)) {
      next.push(it);
      continue;
    }
    const abs = path.join(ROOT, rel);
    let snippet = '';
    if (fs.existsSync(abs)) {
      snippet = fs.readFileSync(abs, 'utf8').slice(0, MAX_FILE_CHARS);
    }
    const prompt = [
      `Pack: ${packId}`,
      `Target path: ${rel}`,
      `Action title: ${it.title}`,
      `Detail: ${String(it.detail || '').slice(0, 800)}`,
      '',
      'Return ONLY JSON (no prose) with one of:',
      '{"mode":"search_replace","find":"...","replace":"..."}',
      '{"mode":"append","content":"..."}',
      '{"mode":"create","content":"..."}',
      'Prefer search_replace with a unique find snippet from the file.',
      'Keep change small. No secrets. No CSP allowlist edits.',
      '',
      '## Current file (truncated)',
      snippet || '(file missing - use create or append)',
    ].join('\n');

    try {
      const text = await ollamaGenerate({
        model,
        prompt,
        system: 'You author minimal repo patches as JSON only.',
        numPredict: 800,
        think: false,
      });
      const parsed = parseAuthorJson(text);
      if (!parsed || typeof parsed !== 'object') {
        next.push(it);
        continue;
      }
      const mode = String(parsed.mode || '').toLowerCase();
      const patched = { ...it, applyAdapter: 'safe-patch' };
      if (mode === 'search_replace' && parsed.find != null && parsed.replace != null) {
        patched.mode = 'search_replace';
        patched.find = String(parsed.find);
        patched.replace = String(parsed.replace);
        patched.path = rel;
        patched.targets = [rel];
        authored += 1;
        next.push(patched);
        continue;
      }
      if ((mode === 'append' || mode === 'create' || mode === 'replace') && parsed.content != null) {
        patched.mode = mode === 'replace' ? 'replace' : mode;
        patched.content = String(parsed.content);
        patched.proposed = patched.content;
        patched.path = rel;
        patched.targets = [rel];
        authored += 1;
        next.push(patched);
        continue;
      }
    } catch {
      /* keep item without body */
    }
    next.push(it);
  }
  return next;
}

/**
 * Ensure at least one product finding note item exists for product-write.
 */
export function ensureFindingsFallbackItem(packId, items, thinking = '') {
  const list = Array.isArray(items) ? [...items] : [];
  const hasMutateBody = list.some((it) => {
    if (it.selected === false) return false;
    const rel = normalizeRelPath(it.path || it.target || (it.targets && it.targets[0]));
    if (!rel || rel.startsWith('artifacts/')) return false;
    return hasBody(it)
      || ['changelog_bullet', 'wiki_patch', 'i18n_string', 'visual_apply'].includes(it.kind);
  });
  if (hasMutateBody) return list;

  const findingsPath = `docs/development/agentic-findings/${packId}.md`;
  const stamp = new Date().toISOString().slice(0, 10);
  const body = [
    '',
    `## ${stamp} · ${packId}`,
    '',
    ...(list.slice(0, 6).map((it) => `- ${it.title}`)),
    thinking ? '' : '',
    thinking ? String(thinking).slice(0, 600) : '',
    '',
  ].filter((line, i, arr) => !(line === '' && arr[i - 1] === '')).join('\n');

  list.push({
    id: `${packId}-findings`,
    kind: 'doc_patch',
    title: `Record ${packId} findings in ${findingsPath}`,
    detail: `Append agentic findings for ${packId}`,
    risk: 'low',
    path: findingsPath,
    targets: [findingsPath],
    mode: 'append',
    content: body.trimStart() || `\n## ${stamp} · ${packId}\n\n- Findings recorded by agentic harness.\n`,
    proposed: body.trimStart() || `\n## ${stamp} · ${packId}\n\n- Findings recorded by agentic harness.\n`,
    selected: true,
    applyAdapter: 'safe-patch',
  });
  return list;
}

/** Re-select mutate items that have a path (product-write path). */
export function reselectMutateItems(items, { productWrite = false } = {}) {
  if (!productWrite) return items;
  return (items || []).map((it) => {
    const mutate = MUTATE_KINDS.has(it.kind)
      || it.kind === 'changelog_bullet'
      || it.kind === 'wiki_patch'
      || it.kind === 'i18n_string'
      || it.kind === 'visual_apply';
    const rel = normalizeRelPath(it.path || it.target || (it.targets && it.targets[0]));
    if (mutate && (rel || ['changelog_bullet', 'wiki_patch', 'i18n_string', 'visual_apply'].includes(it.kind))) {
      return { ...it, selected: it.kind === 'deps_bump' ? it.selected : true };
    }
    return it;
  });
}
