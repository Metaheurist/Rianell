#!/usr/bin/env node
/**
 * Generate missing MOTD locale packs (LC-17).
 * Default: first 30 en-GB quotes, machineTranslated flag when not translated.
 * --translate: use DEEPL_AUTH_KEY or GOOGLE_TRANSLATE_API_KEY when set.
 * --full: all 101 en-GB messages (with --translate recommended).
 */
import fs from 'node:fs';
import path from 'node:path';
import { SHIPPED_LOCALES, localeLabel } from '../../packages/shared/src/i18n/locales.mjs';
import { canonicalMotdPacksDir } from '../../packages/shared/src/i18n/packPaths.mjs';
import { hasTranslateCredentials, translateBatch } from '../lib/machine-translate.mjs';
import { localeJsonPath, readJsonIfExists, sanitizeTranslation, writeJson } from './lib/safe-pack-io.mjs';

const root = process.cwd();
const dir = canonicalMotdPacksDir(root);
const doTranslate = process.argv.includes('--translate');
const fullSet = process.argv.includes('--full');
const dryRun = process.argv.includes('--dry-run');
const force = process.argv.includes('--force');

const canonical = JSON.parse(fs.readFileSync(path.join(dir, 'en-GB.json'), 'utf8'));
const sourceMessages = canonical.messages || [];
const sliceCount = fullSet ? sourceMessages.length : 30;
const source = sourceMessages.slice(0, sliceCount);

if (doTranslate && !hasTranslateCredentials()) {
  console.warn('generate-motd-locale-packs: --translate requested but no DEEPL_AUTH_KEY / GOOGLE_TRANSLATE_API_KEY');
}

const skipExisting = (locale) =>
  console.log(`generate-motd-locale-packs: skip existing ${locale}.json (use --force to overwrite)`);

for (const locale of SHIPPED_LOCALES) {
  if (locale === 'en-GB') continue;
  const outPath = localeJsonPath(dir, locale);

  let fd = null;
  if (!force && !dryRun) {
    try {
      fd = fs.openSync(outPath, 'wx');
    } catch (err) {
      if (err?.code !== 'EEXIST') throw err;
      skipExisting(locale);
      continue;
    }
  } else if (!force && fs.existsSync(outPath)) {
    skipExisting(locale);
    continue;
  }

  try {
    let messages = source.slice();
    let machineTranslated = false;

    if (doTranslate && hasTranslateCredentials() && locale !== 'en-US' && locale !== 'en-AU') {
      console.log(`generate-motd-locale-packs: translating ${messages.length} quote(s) → ${locale}…`);
      const translated = await translateBatch(messages, locale);
      messages = source.map((src, i) => sanitizeTranslation(src, translated[i]) ?? src);
      machineTranslated = true;
    } else if (locale !== 'en-GB') {
      machineTranslated = true;
    }

    const existing = force ? readJsonIfExists(outPath, {}) : {};
    const pack = {
      locale,
      label: localeLabel(locale),
      version: canonical.version || 2,
      messages,
      ...(existing.llmCapability ? { llmCapability: existing.llmCapability } : {}),
      ...(locale === 'ar' || locale === 'he' ? { llmCapability: 'ui-only' } : {}),
      ...(machineTranslated ? { machineTranslated: true } : {}),
    };

    if (dryRun) {
      console.log(`[dry-run] would write ${locale}.json (${messages.length} messages)`);
      continue;
    }
    writeJson(fd ?? outPath, pack);
    console.log(`generate-motd-locale-packs: wrote ${locale}.json (${messages.length} messages)`);
  } catch (err) {
    if (fd !== null) {
      fs.closeSync(fd);
      fd = null;
      fs.rmSync(outPath, { force: true });
    }
    throw err;
  } finally {
    if (fd !== null) fs.closeSync(fd);
  }
}
