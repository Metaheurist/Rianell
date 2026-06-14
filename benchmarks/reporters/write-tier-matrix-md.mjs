/**
 * Write tier-matrix latest.md from v4 payload.
 */
import fs from 'fs';
import path from 'path';

/**
 * @param {string} repoRoot
 * @param {object} payload - buildTierMatrixPayload output
 */
export function writeTierMatrixMd(repoRoot, payload) {
  const dir = path.join(repoRoot, 'benchmarks', payload.slug || 'tier-matrix');
  fs.mkdirSync(dir, { recursive: true });
  const out = path.join(dir, 'latest.md');
  const meta = payload.meta || {};
  let body = `# Tier matrix performance suite\n\n`;
  body += `Status: **${payload.status}** · schema v${payload.schema_version}\n\n`;
  body += `## Run metadata\n\n| Key | Value |\n| --- | --- |\n`;
  for (const [k, v] of Object.entries(meta)) {
    body += `| ${k} | ${v} |\n`;
  }
  body += '\n';

  for (const run of payload.runs || []) {
    const label = `${run.platformType} tier ${run.tier}`;
    body += `## ${label}${run.tier <= 2 ? ' (AI engine only — no LLM)' : ''}\n\n`;
    body += `Run id: \`${run.id}\` · status: **${run.status}**\n\n`;
    if (run.profile) {
      body += `Profile: deferAI=${run.profile.deferAI}, maxChartPoints=${run.profile.maxChartPoints}, useWorkers=${run.profile.useWorkers}\n\n`;
    }
    const aspects = run.aspects || {};
    body += `| Aspect | Value |\n| --- | --- |\n`;
    for (const [k, v] of Object.entries(aspects)) {
      if (typeof v === 'object') continue;
      body += `| ${k} | ${v} |\n`;
    }
    if (run.console) {
      body += `| console.error | ${run.console.error} |\n`;
      body += `| debug_per_second_peak | ${run.console.debug_per_second_peak} |\n`;
    }
    if (run.god_mode) {
      body += `| god_mode_pass_pct | ${run.god_mode.pass_pct} |\n`;
    }
    body += '\n';
  }

  if (payload.optimization && Object.keys(payload.optimization).length) {
    body += `## Optimization summary\n\n`;
    for (const [k, v] of Object.entries(payload.optimization)) {
      body += `- **${k}**: ${v}\n`;
    }
    body += '\n';
  }

  fs.writeFileSync(out, body, 'utf8');
  return out;
}
