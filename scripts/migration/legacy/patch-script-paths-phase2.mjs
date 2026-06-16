#!/usr/bin/env node
/** Legacy Phase 2 one-shot — do not run without review. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const MAP = {
  'build-pwa-vendor.mjs': 'build/build-pwa-vendor.mjs',
  'sync-tokens-to-pwa.mjs': 'build/sync-tokens-to-pwa.mjs',
  'generate-icon-set.mjs': 'build/generate-icon-set.mjs',
  'add-beta-badge-to-icons.mjs': 'build/add-beta-badge-to-icons.mjs',
  'smoke-function-trace.mjs': 'build/smoke-function-trace.mjs',
  'sync-i18n-assets.mjs': 'i18n/sync-i18n-assets.mjs',
  'sync-locale-packs-to-pwa.mjs': 'i18n/sync-locale-packs-to-pwa.mjs',
  'sync-policy-pack.mjs': 'i18n/sync-policy-pack.mjs',
  'generate-locale-overrides.mjs': 'i18n/generate-locale-overrides.mjs',
  'auto-translate-ui-strings.mjs': 'i18n/auto-translate-ui-strings.mjs',
  'auto-translate-policy-strings.mjs': 'i18n/auto-translate-policy-strings.mjs',
  'translate-motd-packs.mjs': 'i18n/translate-motd-packs.mjs',
  'translate-prompt-packs.mjs': 'i18n/translate-prompt-packs.mjs',
  'generate-motd-locale-packs.mjs': 'i18n/generate-motd-locale-packs.mjs',
  'generate-prompt-packs-all-locales.mjs': 'i18n/generate-prompt-packs-all-locales.mjs',
  'build-content-catalog-keys.mjs': 'i18n/build-content-catalog-keys.mjs',
  'batch-mt-content-keys.mjs': 'i18n/batch-mt-content-keys.mjs',
  'batch-mt-tier-a.mjs': 'i18n/batch-mt-tier-a.mjs',
  'batch-mt-hybrid-keys.mjs': 'i18n/batch-mt-hybrid-keys.mjs',
  'merge-tier-a-overrides-from-packs.mjs': 'i18n/merge-tier-a-overrides-from-packs.mjs',
  'build-tier-a-exact-overrides.mjs': 'i18n/build-tier-a-exact-overrides.mjs',
  'apply-tier-a-exact-overrides.mjs': 'i18n/apply-tier-a-exact-overrides.mjs',
  'fill-tier-a-rule-based.mjs': 'i18n/fill-tier-a-rule-based.mjs',
  'generate-tier-a-exact-overrides.mjs': 'i18n/generate-tier-a-exact-overrides.mjs',
  'expand-en-gb-catalog.mjs': 'i18n/expand-en-gb-catalog.mjs',
  'merge-audit-into-catalog.mjs': 'i18n/merge-audit-into-catalog.mjs',
  'apply-html-i18n.mjs': 'i18n/apply-html-i18n.mjs',
  'i18n-audit-shared.mjs': 'i18n/i18n-audit-shared.mjs',
  'verify-locale-packs.mjs': 'verify/verify-locale-packs.mjs',
  'verify-prompt-packs.mjs': 'verify/verify-prompt-packs.mjs',
  'verify-motd-packs.mjs': 'verify/verify-motd-packs.mjs',
  'verify-motd-translation-coverage.mjs': 'verify/verify-motd-translation-coverage.mjs',
  'verify-no-html-in-locale-packs.mjs': 'verify/verify-no-html-in-locale-packs.mjs',
  'verify-no-hardcoded-ui.mjs': 'verify/verify-no-hardcoded-ui.mjs',
  'verify-translation-coverage.mjs': 'verify/verify-translation-coverage.mjs',
  'verify-mixed-language-strings.mjs': 'verify/verify-mixed-language-strings.mjs',
  'verify-policy-packs.mjs': 'verify/verify-policy-packs.mjs',
  'verify-policy-locale-consistency.mjs': 'verify/verify-policy-locale-consistency.mjs',
  'verify-privacy-docs.mjs': 'verify/verify-privacy-docs.mjs',
  'verify-csp-connect-src.mjs': 'verify/verify-csp-connect-src.mjs',
  'verify-no-service-role-in-clients.mjs': 'verify/verify-no-service-role-in-clients.mjs',
  'verify-supabase-schema-parity.mjs': 'verify/verify-supabase-schema-parity.mjs',
  'verify-rls-baseline.mjs': 'verify/verify-rls-baseline.mjs',
  'check-platform-parity.mjs': 'verify/check-platform-parity.mjs',
  'parity-inventory.mjs': 'verify/parity-inventory.mjs',
  'audit-hardcoded-strings.mjs': 'verify/audit-hardcoded-strings.mjs',
  'update-readme-build-info.mjs': 'ci/update-readme-build-info.mjs',
  'generate-dependencies-doc.mjs': 'ci/generate-dependencies-doc.mjs',
  'generate-security-inventory.mjs': 'ci/generate-security-inventory.mjs',
  'split-readme-to-docs.mjs': 'ci/split-readme-to-docs.mjs',
  'apply-uk-english-md.mjs': 'ci/apply-uk-english-md.mjs',
  'watch-deploy-cancel-rest.mjs': 'ci/watch-deploy-cancel-rest.mjs',
  'deploy-probe-loop.mjs': 'ci/deploy-probe-loop.mjs',
  'audit-boot-full.mjs': 'audit/audit-boot-full.mjs',
  'audit-benchmark-security.mjs': 'audit/audit-benchmark-security.mjs',
  'verify-deploy-html.mjs': 'audit/verify-deploy-html.mjs',
  'fetch-securityheaders-report.mjs': 'audit/fetch-securityheaders-report.mjs',
  'debug-boot-hang.mjs': 'audit/debug-boot-hang.mjs',
  'probe-cold-diagnostic.mjs': 'audit/probe-cold-diagnostic.mjs',
  'sync-wiki.mjs': 'wiki/sync-wiki.mjs',
  'verify-wiki.mjs': 'wiki/verify-wiki.mjs',
  'download-llm-models.mjs': 'models/download-llm-models.mjs',
  'verify-llm-models.mjs': 'models/verify-llm-models.mjs',
  'upload-llm-models-supabase.mjs': 'models/upload-llm-models-supabase.mjs',
  'verify-no-model-weights-in-git.mjs': 'models/verify-no-model-weights-in-git.mjs',
};

function patchFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  let s = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  for (const [base, nested] of Object.entries(MAP)) {
    const old = `scripts/${base}`;
    const neu = `scripts/${nested}`;
    if (s.includes(old)) {
      s = s.split(old).join(neu);
      changed = true;
    }
  }
  if (changed) {
    fs.writeFileSync(filePath, s, 'utf8');
    console.log('patched', path.relative(root, filePath));
  }
}

function walk(dir, exts) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (['node_modules', '.git', 'App build', 'ci-minified', '.server-dist'].includes(ent.name)) continue;
      walk(p, exts);
    } else if (exts.some((e) => ent.name.endsWith(e))) {
      patchFile(p);
    }
  }
}

patchFile(path.join(root, 'package.json'));
walk(path.join(root, '.github'), ['.yml', '.yaml']);
walk(path.join(root, 'tests'), ['.mjs', '.ts']);
walk(path.join(root, 'docs'), ['.md']);
walk(path.join(root, 'scripts'), ['.mjs']);
walk(path.join(root, 'wiki'), ['.md']);
patchFile(path.join(root, 'README.md'));

console.log('Path patch complete.');
