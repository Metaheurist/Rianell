import fs from 'fs';
import path from 'path';

/**
 * @param {string} repoRoot
 * @param {object} payload - buildAiEnginePayload output
 */
export function writeAiEngineMd(repoRoot, payload) {
  const dir = path.join(repoRoot, 'benchmarks', payload.slug || 'ai-engine-package');
  fs.mkdirSync(dir, { recursive: true });
  const out = path.join(dir, 'latest.md');
  const meta = payload.meta || {};
  let body = `# ${payload.slug}\n\n`;
  body += `Kind: **${payload.kind}** · Status: **${payload.status}** · schema v${payload.schema_version}\n\n`;
  body += `## Run metadata\n\n| Key | Value |\n| --- | --- |\n`;
  for (const [k, v] of Object.entries(meta)) {
    body += `| ${k} | ${v} |\n`;
  }
  body += '\n## Probes\n\n';
  body += '| fixture | probe | type | ms | status |\n| --- | --- | --- | --- | --- |\n';
  for (const p of payload.probes || []) {
    body += `| ${p.fixture ?? '—'} | ${p.probe_id} | ${p.probe_type ?? '—'} | ${p.ms ?? '—'} | ${p.status} |\n`;
  }
  if (payload.optimization && Object.keys(payload.optimization).length) {
    body += '\n## Optimization\n\n';
    for (const [k, v] of Object.entries(payload.optimization)) {
      body += `- **${k}**: ${JSON.stringify(v)}\n`;
    }
  }
  fs.writeFileSync(out, body, 'utf8');
  return out;
}
