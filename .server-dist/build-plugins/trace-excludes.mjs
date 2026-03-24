/**
 * Paths excluded from function-trace AST instrumentation (absolute or normalized paths).
 * Matching is done via basename or path segment checks for portability on Windows.
 */
import path from 'path';

const EXCLUDED_BASENAMES = new Set([
  'apexcharts.min.js',
  'sw.js',
  /** Defines __rianellTraceEnter; must not be wrapped (would call hooks before they exist). */
  'trace-runtime.js',
]);

const EXCLUDED_SUFFIXES = ['.min.js'];

/** Optional: whole file basename (e.g. heavy / fragile loaders). */
const EXCLUDED_OPTIONAL_BASENAMES = new Set([
  // 'summary-llm.js',
]);

/**
 * @param {string} absPath absolute file path
 * @param {string} [webRoot] optional web root for relative checks
 * @returns {boolean} true if file should NOT be instrumented
 */
export function shouldExcludeFile(absPath, webRoot) {
  const base = path.basename(absPath);
  if (EXCLUDED_BASENAMES.has(base)) return true;
  if (EXCLUDED_OPTIONAL_BASENAMES.has(base)) return true;
  for (const suf of EXCLUDED_SUFFIXES) {
    if (base.endsWith(suf) && base !== 'app.js') return true;
  }
  const norm = absPath.replace(/\\/g, '/');
  if (/\/workers\//.test(norm)) return true;
  if (webRoot) {
    const rel = path.relative(webRoot, absPath).replace(/\\/g, '/');
    if (rel.startsWith('workers/')) return true;
  }
  return false;
}
