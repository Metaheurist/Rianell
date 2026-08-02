#!/usr/bin/env node
/**
 * Redact secrets and health/screening material before any Ollama / agentic payload.
 */
const SECRET_PATTERNS = [
  /\b(service_role|SUPABASE_SERVICE_ROLE)\b/i,
  /\b(eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,})\b/,
  /\b(sk-[A-Za-z0-9]{20,})\b/,
  /\b(ghp_[A-Za-z0-9]{20,})\b/,
  /\b(xox[baprs]-[A-Za-z0-9-]{10,})\b/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
];

const PATH_DENY = [
  /(^|[\\/])\.env(\.|$)/i,
  /(^|[\\/])security[\\/]\.encryption_key$/i,
  /(^|[\\/])supabase-config\.js$/i,
  /(^|[\\/])security[\\/]\.env/i,
];

const HEALTH_PATTERNS = [
  /\b(phq-?9|gad-?7|phq9|gad7)\b/i,
  /\b(screening[_\s-]?responses?)\b/i,
];

/**
 * @param {string} text
 * @param {{ sourcePath?: string }} [opts]
 * @returns {{ ok: boolean, text: string, redactions: string[], blocked: boolean, reasons: string[] }}
 */
export function sanitizeAgentContext(text, opts = {}) {
  const reasons = [];
  const redactions = [];
  let out = String(text ?? '');
  const sourcePath = opts.sourcePath || '';

  for (const re of PATH_DENY) {
    if (sourcePath && re.test(sourcePath)) {
      return {
        ok: false,
        text: '',
        redactions: ['path-deny'],
        blocked: true,
        reasons: [`denied path: ${sourcePath}`],
      };
    }
  }

  for (const re of SECRET_PATTERNS) {
    if (re.test(out)) {
      out = out.replace(re, '[REDACTED_SECRET]');
      redactions.push(re.source);
      reasons.push('secret-like token redacted');
    }
  }

  for (const re of HEALTH_PATTERNS) {
    if (re.test(out)) {
      out = out.replace(re, '[REDACTED_HEALTH]');
      redactions.push(re.source);
      reasons.push('health/screening term redacted');
    }
  }

  // Long digit runs often leak ids / scores
  out = out.replace(/\b\d{6,}\b/g, (m) => {
    redactions.push('long-number');
    return '[REDACTED_NUM]';
  });

  return { ok: true, text: out, redactions, blocked: false, reasons };
}

/**
 * @param {string[]} paths
 * @returns {string[]}
 */
export function filterAllowedContextPaths(paths) {
  return (paths || []).filter((p) => !PATH_DENY.some((re) => re.test(p)));
}

const isMain = process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('sanitize-agent-context.mjs');
if (isMain) {
  const sample = process.argv.slice(2).join(' ') || 'safe text';
  const result = sanitizeAgentContext(sample);
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.blocked ? 1 : 0);
}
