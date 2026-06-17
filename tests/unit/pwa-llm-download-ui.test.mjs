import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const summaryLlm = fs.readFileSync(
  new URL('../../apps/pwa-webapp/summary-llm.js', import.meta.url),
  'utf8',
);
const uiFeedback = fs.readFileSync(
  new URL('../../apps/pwa-webapp/ui-feedback.js', import.meta.url),
  'utf8',
);
const styles = fs.readFileSync(
  new URL('../../apps/pwa-webapp/styles.css', import.meta.url),
  'utf8',
);

test('PWA LLM download UI references Hugging Face (not generic model parts)', () => {
  assert.match(uiFeedback, /Downloading from Hugging Face/);
  assert.doesNotMatch(uiFeedback, /Downloading model parts/);
  assert.doesNotMatch(summaryLlm, /return 'model parts'/);
});

test('AI download modals stack above settings overlay', () => {
  assert.match(styles, /\.ai-model-download-consent[\s\S]*z-index:\s*100010/);
  assert.match(styles, /\.ai-model-download-progress[\s\S]*z-index:\s*100010/);
});

test('cancelAiModelDownload ignores late progress after cancel', () => {
  assert.match(summaryLlm, /if \(downloadCancelled\) return/);
  assert.match(summaryLlm, /window\.cancelAiModelDownload = cancelDownloadInFlight/);
});
