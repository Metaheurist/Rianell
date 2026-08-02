#!/usr/bin/env node
/**
 * Generic CLI: node scripts/ci/agentic-pack-cli.mjs <packId> [--dry-run]
 */
import { PACK_HANDLERS } from '../dev/agentic-pipeline/pack-handlers.mjs';

const packId = process.argv[2];
const dryRun = process.argv.includes('--dry-run') || process.env.AGENTIC_DRY_RUN === '1';

if (!packId || !PACK_HANDLERS[packId]) {
  console.error(`Usage: node scripts/ci/agentic-pack-cli.mjs <${Object.keys(PACK_HANDLERS).join('|')}> [--dry-run]`);
  process.exit(1);
}

const result = await PACK_HANDLERS[packId]({ dryRun });
console.log(JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 1);
