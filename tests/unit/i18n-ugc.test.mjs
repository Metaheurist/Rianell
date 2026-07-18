import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const enGb = JSON.parse(
  fs.readFileSync(new URL('../../i18n-packs/locale-packs/v1/en-GB.json', import.meta.url), 'utf8'),
);
const privacyRegionJs = fs.readFileSync(
  new URL('../../apps/pwa-webapp/privacy-region.js', import.meta.url),
  'utf8',
);

const UGC_KEYS = [
  'logs.ugc.userEntered',
  'export.section.notes',
  'export.section.symptoms',
  'export.section.vitals',
];

test('en-GB catalog defines UGC boundary keys', () => {
  for (const key of UGC_KEYS) {
    assert.ok(enGb.strings[key], `missing ${key} in en-GB locale pack`);
  }
});

test('policy machine-translated notice key exists', () => {
  assert.equal(
    typeof enGb.strings['policy.machineTranslatedNotice'],
    'string',
    'policy.machineTranslatedNotice must be a string',
  );
});

test('PWA policy viewer shows disclaimer for non-en-GB locales', () => {
  assert.match(privacyRegionJs, /policy\.machineTranslatedNotice/);
  assert.match(privacyRegionJs, /en-GB/);
});

test('no UGC auto-translate helper in app sources', () => {
  const roots = [
    '../../apps/pwa-webapp/app.js',
  ];
  for (const rel of roots) {
    const src = fs.readFileSync(new URL(rel, import.meta.url), 'utf8');
    assert.doesNotMatch(src, /translateUgcForDisplay/);
  }
});

test('PWA export uses localized CSV headers only', () => {
  const exportUtils = fs.readFileSync(
    new URL('../../apps/pwa-webapp/export-utils.js', import.meta.url),
    'utf8',
  );
  assert.match(exportUtils, /exportUi\('export\.csv\./);
  assert.match(exportUtils, /log\.notes/);
});

test('summary-llm wraps user notes with USER_NOTE delimiters', () => {
  const summaryLlm = fs.readFileSync(
    new URL('../../apps/pwa-webapp/summary-llm.js', import.meta.url),
    'utf8',
  );
  assert.match(summaryLlm, /---USER_NOTE---/);
  assert.match(summaryLlm, /---END_USER_NOTE---/);
});
