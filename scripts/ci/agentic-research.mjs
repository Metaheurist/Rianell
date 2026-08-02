#!/usr/bin/env node
/**
 * Smoke the shared Research stage (Firecrawl) for one pack — not a pack tab.
 * Usage: npm run agentic:research -- [--pack=planning] [--dry-run]
 */
import { researchBeforeLlm } from '../dev/agentic-pipeline/research-pack.mjs';
import { packDir, ensureDir } from '../dev/agentic-pipeline/state.mjs';

const dryRun = process.argv.includes('--dry-run');
const packArg = process.argv.find((a) => a.startsWith('--pack='));
const packId = packArg ? packArg.slice('--pack='.length) : 'planning';
const dir = packDir(packId);
ensureDir(dir);

const meta = await researchBeforeLlm({ packId, dryRun, dir, topic: packId });
console.log(JSON.stringify({
  ok: true,
  pack: packId,
  dryRun,
  configured: meta?.configured,
  sources: meta?.sources ?? 0,
  queries: meta?.queries || [],
  artifactDir: dir,
}, null, 2));
process.exit(0);
