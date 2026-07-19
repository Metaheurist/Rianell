import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildPrompt, validate } from '../../scripts/i18n/lib/ollama-translate.mjs';

const AR = { name: 'Arabic', code: 'ar' };

test('buildPrompt omits the script directive by default', () => {
  const p = buildPrompt('Features', AR);
  assert.ok(!/native Arabic script/i.test(p), 'default prompt has no strict-script clause');
  assert.match(p, /translate the following English text into Arabic/i);
});

test('buildPrompt adds a script-forcing directive when strictScript is set', () => {
  const p = buildPrompt('Features', AR, { strictScript: true });
  assert.match(p, /native Arabic script/i);
  // Brand/clinical tokens are explicitly allowed to stay Latin.
  assert.match(p, /Rianell/);
  assert.match(p, /PHQ-9/);
});

test('validate enforces native script for RTL locales', () => {
  assert.equal(validate('ar', 'Symptoms', 'الأعراض').ok, true);
  assert.equal(validate('ar', 'Symptoms', 'Symptoms translated').reason, 'not-arabic-script');
  assert.equal(validate('he', 'Symptoms', 'תסמינים').ok, true);
  assert.equal(validate('he', 'Symptoms', 'Latin only').reason, 'not-hebrew-script');
});

test('validate rejects identical-to-English, placeholder drift, and HTML', () => {
  assert.equal(validate('de-DE', 'Save', 'Save').reason, 'identical-to-en');
  assert.equal(validate('de-DE', 'Hi {name}', 'Hallo').reason, 'placeholder-mismatch');
  assert.equal(validate('de-DE', 'Hi {name}', 'Hallo {name}').ok, true);
  assert.equal(validate('de-DE', 'Bold', '<b>Fett</b>').reason, 'html');
  assert.equal(validate('de-DE', 'text', '').reason, 'empty');
});
