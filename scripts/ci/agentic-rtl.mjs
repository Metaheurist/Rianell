#!/usr/bin/env node
import { PACK_HANDLERS } from '../dev/agentic-pipeline/pack-handlers.mjs';
const dryRun = process.argv.includes('--dry-run') || process.env.AGENTIC_DRY_RUN === '1';
const result = await PACK_HANDLERS['rtl']({ dryRun });
console.log(JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 1);
