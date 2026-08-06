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
  if (it.content != null && String(it.content).trim()) {
    // SEARCH markers without parsed find/replace still need a real patch pass.
    if (/<<<SEARCH|=======|>>>REPLACE/i.test(String(it.content))
      && (it.find == null || it.replace == null)) {
      return false;
    }
    return true;
  }
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

/**
 * Coerce incomplete search_replace items into findings appends so product-write
 * still mutates a tracked path when the LLM invented a bad find string.
 */
export function coerceUnapplyablePatches(packId, items) {
  const findingsPath = `docs/development/agentic-findings/${packId}.md`;
  const stamp = new Date().toISOString().slice(0, 10);
  return (items || []).map((it, idx) => {
    const looksMutate = MUTATE_KINDS.has(it.kind)
      || it.applyAdapter === 'safe-patch'
      || it.applyAdapter === 'research-file-write';
    if (!looksMutate) return it;
    const rel = normalizeRelPath(it.path || it.target || (it.targets && it.targets[0]));
    let find = it.find != null ? String(it.find) : null;
    let replace = it.replace != null ? String(it.replace) : null;
    let content = it.content != null
      ? String(it.content)
      : (it.proposed != null ? String(it.proposed) : '');
    let mode = String(it.mode || '').toLowerCase();

    if ((!find || !replace) && content && /<<<SEARCH|=======|>>>REPLACE/i.test(content)) {
      const m = content.replace(/\r\n/g, '\n').match(
        /<<<SEARCH\s*\n([\s\S]*?)\n[ \t]*=======\s*\n([\s\S]*?)(?:\n[ \t]*>>>REPLACE\s*)?$/i,
      );
      if (m) {
        const strip = (t) => {
          const lines = String(t || '').replace(/\s+$/, '').split('\n');
          const indents = lines.filter((l) => l.trim()).map((l) => (l.match(/^[ \t]*/)?.[0] || '').length);
          const n = indents.length ? Math.min(...indents) : 0;
          return lines.map((l) => (n ? l.slice(n) : l)).join('\n');
        };
        find = strip(m[1]);
        replace = strip(m[2]);
        mode = 'search_replace';
        content = '';
      }
    }

    const toFindings = (reason) => {
      const note = [
        '',
        `## ${stamp} · ${packId} (${reason})`,
        '',
        `- ${it.title || it.id || `item-${idx + 1}`}`,
        rel ? `- original path: ${rel}` : '- no path cited',
        content ? `\n\`\`\`\n${content.slice(0, 800)}\n\`\`\`` : '',
        String(it.detail || '').slice(0, 500),
        '',
      ].filter(Boolean).join('\n');
      return {
        ...it,
        kind: 'doc_patch',
        path: findingsPath,
        targets: [findingsPath],
        mode: 'append',
        content: note,
        proposed: note,
        find: undefined,
        replace: undefined,
        applyAdapter: 'safe-patch',
        selected: true,
        title: `Findings fallback: ${it.title || rel || it.id}`,
      };
    };

    // Mutate kinds must have path+body before resolveItemAdapter.
    if (!rel || !isAllowedWritePath(rel)) {
      return toFindings(rel ? `disallowed path ${rel}` : 'missing path');
    }
    if (!content && find == null && replace == null && !String(it.detail || '').trim()) {
      return toFindings('empty body');
    }

    if (mode === 'search_replace' && find != null && replace != null && rel) {
      const abs = path.join(ROOT, rel);
      if (fs.existsSync(abs)) {
        const prev = fs.readFileSync(abs, 'utf8');
        const count = prev.split(find).length - 1;
        if (count === 1) {
          return {
            ...it,
            path: rel,
            targets: [rel],
            mode: 'search_replace',
            find,
            replace,
            applyAdapter: 'safe-patch',
          };
        }
      }
      return toFindings(`search_replace unusable for ${rel}`);
    }

    if (mode === 'search_replace') {
      return toFindings('incomplete search_replace');
    }

    if ((mode === 'append' || mode === 'create' || mode === 'replace' || !mode)) {
      const body = content || String(it.detail || it.title || '').trim();
      if (!body) return toFindings('empty append/create body');
      if (mode === 'create' && rel && fs.existsSync(path.join(ROOT, rel))) {
        return toFindings(`create blocked (exists): ${rel}`);
      }
      return {
        ...it,
        path: rel,
        targets: [rel],
        mode: mode || (it.kind === 'file_create' ? 'create' : 'append'),
        content: body,
        proposed: body,
        applyAdapter: 'safe-patch',
        selected: true,
      };
    }
    return it;
  });
}
