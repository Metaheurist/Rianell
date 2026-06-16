#!/usr/bin/env node
/** Ensure every shipped locale has a MOTD pack with at least 30 messages. */
import fs from 'node:fs';
import path from 'node:path';
import { SHIPPED_LOCALES } from '../../packages/shared/src/i18n/locales.mjs';
import { canonicalMotdPacksDir } from '../../packages/shared/src/i18n/packPaths.mjs';

const root = process.cwd();
const dir = canonicalMotdPacksDir(root);
const minMessages = 30;
let failed = false;

function fail(msg) {
  console.error(`verify-motd-packs: ${msg}`);
  failed = true;
}

for (const locale of SHIPPED_LOCALES) {
  const p = path.join(dir, `${locale}.json`);
  if (!fs.existsSync(p)) {
    fail(`missing ${locale}.json`);
    continue;
  }
  const pack = JSON.parse(fs.readFileSync(p, 'utf8'));
  const count = Array.isArray(pack.messages) ? pack.messages.length : 0;
  if (count < minMessages) fail(`${locale}.json has ${count} messages (need ${minMessages})`);
}

if (failed) process.exit(1);
console.log(`verify-motd-packs: all ${SHIPPED_LOCALES.length} locales have ≥${minMessages} MOTD messages`);
