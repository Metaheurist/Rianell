#!/usr/bin/env node
/**
 * CLI: --status | --set=KEY | --clear
 */
import {
  getFirecrawlStatus,
  setFirecrawlApiKey,
  clearFirecrawlApiKey,
} from './firecrawl-config.mjs';

const setArg = process.argv.find((a) => a.startsWith('--set='));
if (process.argv.includes('--status')) {
  console.log(JSON.stringify({ ok: true, data: getFirecrawlStatus(), error: null }));
  process.exit(0);
}
if (setArg) {
  const r = setFirecrawlApiKey(setArg.slice('--set='.length));
  console.log(JSON.stringify(r));
  process.exit(r.ok ? 0 : 1);
}
if (process.argv.includes('--clear')) {
  const r = clearFirecrawlApiKey();
  console.log(JSON.stringify(r));
  process.exit(r.ok ? 0 : 1);
}
console.error('Usage: firecrawl-cli.mjs --status | --set=fc-… | --clear');
process.exit(2);
