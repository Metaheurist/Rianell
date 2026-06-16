#!/usr/bin/env node
/**
 * Legacy Phase 2 one-shot — do not run without review.
 * One-time Phase 2: nest scripts/*.mjs into category subdirs + flat shims.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const scriptsDir = path.join(root, 'scripts');

const MAP = {
  build: [
    'build-pwa-vendor.mjs', 'sync-tokens-to-pwa.mjs', 'generate-icon-set.mjs',
    'add-beta-badge-to-icons.mjs', 'smoke-function-trace.mjs',
  ],
  i18n: [
    'sync-i18n-assets.mjs', 'sync-locale-packs-to-pwa.mjs', 'sync-policy-pack.mjs',
    'generate-locale-overrides.mjs', 'auto-translate-ui-strings.mjs', 'auto-translate-policy-strings.mjs',
    'translate-motd-packs.mjs', 'translate-prompt-packs.mjs', 'generate-motd-locale-packs.mjs',
    'generate-prompt-packs-all-locales.mjs', 'build-content-catalog-keys.mjs', 'batch-mt-content-keys.mjs',
    'batch-mt-tier-a.mjs', 'batch-mt-hybrid-keys.mjs', 'merge-tier-a-overrides-from-packs.mjs',
    'build-tier-a-exact-overrides.mjs', 'apply-tier-a-exact-overrides.mjs', 'fill-tier-a-rule-based.mjs',
    'generate-tier-a-exact-overrides.mjs', 'expand-en-gb-catalog.mjs', 'merge-audit-into-catalog.mjs',
    'apply-html-i18n.mjs', 'i18n-audit-shared.mjs',
  ],
  verify: [
    'verify-locale-packs.mjs', 'verify-prompt-packs.mjs', 'verify-motd-packs.mjs',
    'verify-motd-translation-coverage.mjs', 'verify-no-html-in-locale-packs.mjs',
    'verify-no-hardcoded-ui.mjs', 'verify-translation-coverage.mjs', 'verify-mixed-language-strings.mjs',
    'verify-policy-packs.mjs', 'verify-policy-locale-consistency.mjs', 'verify-privacy-docs.mjs',
    'verify-csp-connect-src.mjs', 'verify-no-service-role-in-clients.mjs', 'verify-supabase-schema-parity.mjs',
    'verify-rls-baseline.mjs', 'check-platform-parity.mjs', 'parity-inventory.mjs', 'audit-hardcoded-strings.mjs',
  ],
  ci: [
    'update-readme-build-info.mjs', 'generate-dependencies-doc.mjs', 'generate-security-inventory.mjs',
    'split-readme-to-docs.mjs', 'apply-uk-english-md.mjs', 'watch-deploy-cancel-rest.mjs', 'deploy-probe-loop.mjs',
  ],
  audit: [
    'audit-boot-full.mjs', 'audit-benchmark-security.mjs', 'verify-deploy-html.mjs',
    'fetch-securityheaders-report.mjs', 'debug-boot-hang.mjs', 'probe-cold-diagnostic.mjs',
  ],
  wiki: ['sync-wiki.mjs', 'verify-wiki.mjs'],
  models: [
    'download-llm-models.mjs', 'verify-llm-models.mjs', 'upload-llm-models-supabase.mjs',
    'verify-no-model-weights-in-git.mjs',
  ],
};

function moveFile(subdir, name) {
  const from = path.join(scriptsDir, name);
  const toDir = path.join(scriptsDir, subdir);
  const to = path.join(toDir, name);
  if (!fs.existsSync(from)) {
    if (fs.existsSync(to)) return;
    throw new Error(`Missing: ${from}`);
  }
  fs.mkdirSync(toDir, { recursive: true });
  fs.renameSync(from, to);
  const shim = `import './${subdir}/${name}';\n`;
  fs.writeFileSync(from, shim, 'utf8');
  console.log(`moved ${name} -> ${subdir}/`);
}

function patchImports(filePath) {
  let s = fs.readFileSync(filePath, 'utf8');
  const dir = path.dirname(filePath);
  const rel = path.relative(scriptsDir, dir).replace(/\\/g, '/');
  if (!rel || rel === '.') return;
  const depth = rel.split('/').length;
  const libPrefix = '../'.repeat(depth) + 'lib/';
  const pkgPrefix = '../'.repeat(depth + 1) + 'packages/';
  s = s.replace(/from '\.\/lib\//g, `from '${libPrefix}`);
  s = s.replace(/from "\.\/lib\//g, `from "${libPrefix}`);
  s = s.replace(/from '\.\.\/packages\//g, `from '${pkgPrefix}`);
  s = s.replace(/from "\.\.\/packages\//g, `from "${pkgPrefix}`);
  fs.writeFileSync(filePath, s, 'utf8');
}

for (const [subdir, files] of Object.entries(MAP)) {
  for (const f of files) moveFile(subdir, f);
}

for (const [subdir, files] of Object.entries(MAP)) {
  for (const f of files) {
    patchImports(path.join(scriptsDir, subdir, f));
  }
}

// Cross-spawn path fixes
const syncWiki = path.join(scriptsDir, 'wiki', 'sync-wiki.mjs');
if (fs.existsSync(syncWiki)) {
  let s = fs.readFileSync(syncWiki, 'utf8');
  s = s.replace(/scripts\/verify-wiki\.mjs/g, 'scripts/wiki/verify-wiki.mjs');
  s = s.replace(/node scripts\/verify-wiki\.mjs/g, 'node scripts/wiki/verify-wiki.mjs');
  fs.writeFileSync(syncWiki, s, 'utf8');
}

const auditBoot = path.join(scriptsDir, 'audit', 'audit-boot-full.mjs');
if (fs.existsSync(auditBoot)) {
  let s = fs.readFileSync(auditBoot, 'utf8');
  s = s.replace(/scripts\/audit-benchmark-security\.mjs/g, 'scripts/audit/audit-benchmark-security.mjs');
  fs.writeFileSync(auditBoot, s, 'utf8');
}

console.log('Done nesting scripts.');
