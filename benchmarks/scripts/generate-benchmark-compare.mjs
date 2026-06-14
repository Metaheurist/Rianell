/**
 * Build benchmarks/compare.md from history.json files + compare.config.json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DEFAULT_CONFIG = {
  window: 10,
  detail_windows: [5, 20],
  platforms: ['tier-matrix', 'settings-matrix', 'web-pwa', 'github-pages', 'capacitor-web', 'expo-rn', 'ai-engine-package', 'ai-engine-layers', 'ai-engine-algos', 'ai-engine-rn'],
};

const SLUG_LABELS = {
  'web-pwa': 'Web / PWA',
  'github-pages': 'GitHub Pages',
  'capacitor-web': 'Capacitor (legacy)',
  'expo-rn': 'Expo / RN bundles',
  'tier-matrix': 'Tier matrix (perf tiers 1–5)',
  'settings-matrix': 'Settings matrix (tier-3 variants)',
  'ai-engine-package': 'AI engine — Node package exports',
  'ai-engine-layers': 'AI engine — PWA layers (tier 3)',
  'ai-engine-algos': 'AI engine — PWA algorithms (tier 3)',
  'ai-engine-rn': 'AI engine — RN summarizeLogsForAi',
};

function loadConfig(repoRoot) {
  const p = path.join(repoRoot, 'benchmarks', 'compare.config.json');
  if (!fs.existsSync(p)) return { ...DEFAULT_CONFIG };
  try {
    const j = JSON.parse(fs.readFileSync(p, 'utf8'));
    return {
      window: Number(j.window) > 0 ? Number(j.window) : DEFAULT_CONFIG.window,
      detail_windows: Array.isArray(j.detail_windows)
        ? j.detail_windows.filter((n) => Number(n) > 0).map(Number)
        : DEFAULT_CONFIG.detail_windows,
      platforms: Array.isArray(j.platforms) && j.platforms.length ? j.platforms : DEFAULT_CONFIG.platforms,
    };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

function readHistory(repoRoot, slug) {
  const p = path.join(repoRoot, 'benchmarks', slug, 'history.json');
  if (!fs.existsSync(p)) return [];
  try {
    const arr = JSON.parse(fs.readFileSync(p, 'utf8'));
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function shortSha(sha) {
  if (!sha || sha === 'local') return sha || '—';
  return sha.slice(0, 7);
}

function formatMs(v) {
  if (v == null || Number.isNaN(v)) return '—';
  return String(Math.round(v));
}

function formatNum(v) {
  if (v == null || Number.isNaN(v)) return '—';
  return String(v);
}

/**
 * Mermaid xychart-beta (single series): labels short; values integers.
 */
function mermaidLineChart(title, xLabels, values, yTitle) {
  const nums = values.map((v) => (typeof v === 'number' && !Number.isNaN(v) ? Math.round(v) : 0));
  const maxVal = Math.max(1, ...nums);
  const top = Math.ceil(maxVal * 1.1);
  const safeLabels = xLabels.map((l) => {
    const s = String(l).replace(/[[\],":]/g, ' ');
    return s.length > 12 ? s.slice(0, 10) + '…' : s;
  });
  const vals = nums.join(', ');
  return [
    '```mermaid',
    'xychart-beta',
    `    title "${title.replace(/"/g, "'")}"`,
    `    x-axis [${safeLabels.map((l) => `"${l}"`).join(', ')}]`,
    `    y-axis "${yTitle}" 0 --> ${top}`,
    `    line [${vals}]`,
    '```',
    '',
  ].join('\n');
}

function sliceRuns(runs, n) {
  return runs.slice(0, Math.min(n, runs.length));
}

function buildWebSection(slug, runs, windowSize) {
  const slice = sliceRuns(runs, windowSize);
  if (!slice.length) {
    return [`### ${SLUG_LABELS[slug] || slug}\n`, '_No history yet._\n', ''];
  }
  const rows = slice.map((r) => {
    const m = r.meta || {};
    const lh = r.lighthouse || {};
    const st = r.status === 'skipped' ? 'skipped' : r.status || 'ok';
    return {
      date: (m.timestamp_utc || '').slice(0, 19).replace('T', ' '),
      sha: shortSha(m.git_sha),
      status: st,
      LCP_ms: formatMs(lh.LCP_ms),
      FCP_ms: formatMs(lh.FCP_ms),
      TBT_ms: formatMs(lh.TBT_ms),
      run: m.github_run_id || '—',
    };
  });
  const keys = Object.keys(rows[0]);
  let md = `### ${SLUG_LABELS[slug] || slug}\n\n`;
  md += `| ${keys.join(' | ')} |\n| ${keys.map(() => '---').join(' | ')} |\n`;
  for (const row of rows) {
    md += `| ${keys.map((k) => row[k]).join(' | ')} |\n`;
  }
  md += '\n';

  const okRuns = slice.filter((r) => r.status === 'ok' && r.lighthouse);
  if (okRuns.length >= 2) {
    const labels = okRuns.map((r) => shortSha(r.meta?.git_sha));
    md += mermaidLineChart(
      `${SLUG_LABELS[slug] || slug} — LCP (ms)`,
      labels,
      okRuns.map((r) => r.lighthouse.LCP_ms ?? 0),
      'ms',
    );
    md += mermaidLineChart(
      `${SLUG_LABELS[slug] || slug} — TBT (ms)`,
      labels,
      okRuns.map((r) => r.lighthouse.TBT_ms ?? 0),
      'ms',
    );
  } else if (okRuns.length === 1) {
    md += '_Chart needs at least two successful runs with Lighthouse data._\n\n';
  }
  return [md];
}

function buildExpoSection(runs, windowSize) {
  const slug = 'expo-rn';
  const slice = sliceRuns(runs, windowSize);
  if (!slice.length) {
    return [`### ${SLUG_LABELS[slug]}\n`, '_No history yet._\n', ''];
  }
  const rows = slice.map((r) => {
    const m = r.meta || {};
    const h = r.hermes || {};
    const st = r.status === 'skipped' ? 'skipped' : r.status || 'ok';
    return {
      date: (m.timestamp_utc || '').slice(0, 19).replace('T', ' '),
      sha: shortSha(m.git_sha),
      status: st,
      android_gzip: formatNum(h.android_gzip_bytes),
      ios_gzip: formatNum(h.ios_gzip_bytes),
      run: m.github_run_id || '—',
    };
  });
  const keys = Object.keys(rows[0]);
  let md = `### ${SLUG_LABELS[slug]}\n\n`;
  md += `Aggregates: **sum of gzip bytes** across all \`.hbc\` files per platform (stable for trends when chunk hashes change).\n\n`;
  md += `| ${keys.join(' | ')} |\n| ${keys.map(() => '---').join(' | ')} |\n`;
  for (const row of rows) {
    md += `| ${keys.map((k) => row[k]).join(' | ')} |\n`;
  }
  md += '\n';

  const okRuns = slice.filter((r) => r.status === 'ok' && r.hermes);
  if (okRuns.length >= 2) {
    const labels = okRuns.map((r) => shortSha(r.meta?.git_sha));
    md += mermaidLineChart(
      'Expo — Android Hermes gzip total (bytes)',
      labels,
      okRuns.map((r) => r.hermes.android_gzip_bytes ?? 0),
      'bytes',
    );
    md += mermaidLineChart(
      'Expo — iOS Hermes gzip total (bytes)',
      labels,
      okRuns.map((r) => r.hermes.ios_gzip_bytes ?? 0),
      'bytes',
    );
  } else if (okRuns.length === 1) {
    md += '_Chart needs at least two successful runs._\n\n';
  }
  return [md];
}

function buildTierMatrixSection(slug, runs, windowSize) {
  const slice = sliceRuns(runs, windowSize);
  if (!slice.length) {
    return [`### ${SLUG_LABELS[slug] || slug}\n`, '_No history yet._\n', ''];
  }
  const latest = slice[0];
  let md = `### ${SLUG_LABELS[slug] || slug}\n\n`;
  md += `Latest status: **${latest.status}** · schema v${latest.schema_version || '?'}\n\n`;
  if (Array.isArray(latest.runs)) {
    md += `| run | tier | cold_load_ms | ai_engine_ms | llm_requests | status |\n| --- | --- | --- | --- | --- | --- |\n`;
    for (const r of latest.runs) {
      const a = r.aspects || {};
      md += `| ${r.id} | ${r.tier} | ${formatMs(a.cold_load_ms)} | ${formatMs(a.ai_engine_ms)} | ${formatNum(a.ai_llm_network_requests)} | ${r.status} |\n`;
    }
    md += '\n';
    const t1Runs = slice
      .flatMap((h) => (h.runs || []).filter((r) => r.id === 'desktop-t1'))
      .filter((r) => r.aspects?.cold_load_ms != null);
    if (t1Runs.length >= 2) {
      md += mermaidLineChart(
        'desktop-t1 cold_load_ms',
        t1Runs.map((_, i) => `r${i + 1}`),
        t1Runs.map((r) => r.aspects.cold_load_ms),
        'ms',
      );
      md += mermaidLineChart(
        'desktop-t1 ai_engine_ms',
        t1Runs.map((_, i) => `r${i + 1}`),
        t1Runs.map((r) => r.aspects.ai_engine_ms ?? 0),
        'ms',
      );
    }
  }
  return [md];
}

function buildAiEngineSection(slug, runs, windowSize) {
  const slice = sliceRuns(runs, windowSize);
  if (!slice.length) {
    return [`### ${SLUG_LABELS[slug] || slug}\n`, '_No history yet._\n', ''];
  }
  const latest = slice[0];
  let md = `### ${SLUG_LABELS[slug] || slug}\n\n`;
  md += `Latest status: **${latest.status}** · schema v${latest.schema_version || '?'} · probes: ${latest.meta?.probe_count ?? '—'}\n\n`;
  if (Array.isArray(latest.probes)) {
    md += `| fixture | probe | type | ms | status |\n| --- | --- | --- | --- | --- |\n`;
    for (const p of latest.probes.slice(0, 40)) {
      md += `| ${p.fixture ?? '—'} | ${p.probe_id} | ${p.probe_type ?? '—'} | ${formatMs(p.ms)} | ${p.status} |\n`;
    }
    if (latest.probes.length > 40) md += `\n_…and ${latest.probes.length - 40} more probes._\n`;
    md += '\n';
    const fwd = latest.probes.filter((p) => p.probe_id === 'forward_full' && p.ms != null);
    if (fwd.length >= 2) {
      md += mermaidLineChart(
        `${slug} — forward_full (ms)`,
        fwd.map((_, i) => `r${i + 1}`),
        fwd.map((p) => p.ms),
        'ms',
      );
    }
    const analyze = slice
      .flatMap((h) => (h.probes || []).filter((p) => p.probe_id === 'analyzeHealthMetrics' && p.fixture === 'logs_30'))
      .filter((p) => p.ms != null);
    if (analyze.length >= 2) {
      md += mermaidLineChart(
        'ai-engine-package — analyzeHealthMetrics logs_30',
        analyze.map((_, i) => `r${i + 1}`),
        analyze.map((p) => p.ms),
        'ms',
      );
    }
  }
  return [md];
}

function sectionForSlug(slug, runs, windowSize) {
  if (slug === 'expo-rn') return buildExpoSection(runs, windowSize);
  if (slug === 'tier-matrix' || slug === 'settings-matrix') return buildTierMatrixSection(slug, runs, windowSize);
  if (slug.startsWith('ai-engine-')) return buildAiEngineSection(slug, runs, windowSize);
  return buildWebSection(slug, runs, windowSize);
}

/**
 * @param {string} repoRoot
 */
export function generateBenchmarkCompare(repoRoot) {
  const config = loadConfig(repoRoot);
  const generatedAt = new Date().toISOString();

  let body = `# Benchmark comparison (history)\n\n`;
  body += `Generated at **${generatedAt}**.\n\n`;
  body += `To change the default number of runs in the primary sections below, edit **[compare.config.json](./compare.config.json)** (\`window\`). `;
  body += `GitHub does not support interactive dropdowns in Markdown; optional **collapsed sections** list alternate window sizes.\n\n`;
  body += `---\n\n`;

  const primaryWindow = config.window;

  for (const slug of config.platforms) {
    const runs = readHistory(repoRoot, slug);
    const parts = sectionForSlug(slug, runs, primaryWindow);
    body += parts.join('');
    body += '\n';
  }

  const extras = config.detail_windows.filter((w) => w !== primaryWindow);
  for (const w of extras) {
    body += `<details>\n<summary>Last <strong>${w}</strong> runs (all platforms)</summary>\n\n`;
    for (const slug of config.platforms) {
      const runs = readHistory(repoRoot, slug);
      const parts = sectionForSlug(slug, runs, w);
      body += parts.join('');
      body += '\n';
    }
    body += `</details>\n\n`;
  }

  const out = path.join(repoRoot, 'benchmarks', 'compare.md');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, body, 'utf8');
  console.log('Wrote', out);
}

const invoked = Boolean(
  process.argv[1]?.replace(/\\/g, '/').endsWith('generate-benchmark-compare.mjs'),
);
if (invoked) {
  const repoRoot = process.argv[2] || path.resolve(__dirname, '..', '..');
  generateBenchmarkCompare(repoRoot);
}
