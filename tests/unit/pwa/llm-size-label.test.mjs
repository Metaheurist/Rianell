import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const summaryLlm = fs.readFileSync(
  new URL('../../../apps/pwa-webapp/summary-llm.js', import.meta.url),
  'utf8',
);
const appJs = fs.readFileSync(new URL('../../../apps/pwa-webapp/app.js', import.meta.url), 'utf8');

function sliceBetween(src, start, end) {
  const from = src.indexOf(start);
  assert.ok(from >= 0, `missing ${start}`);
  const to = src.indexOf(end, from);
  assert.ok(to > from, `missing ${end} after ${start}`);
  return src.slice(from, to);
}

test('WebGPU is probed before the download consent dialog quotes a package size', () => {
  const src = sliceBetween(summaryLlm, 'async function ensurePipelineLoaded', 'async function getPipeline');
  const probeIdx = src.indexOf('await ensureWebGpuProbed()');
  const consentIdx = src.indexOf('await ensureDownloadConsent()');
  assert.ok(probeIdx > 0 && consentIdx > 0 && probeIdx < consentIdx, 'probe must precede consent');
  assert.equal(src.split('await ensureWebGpuProbed()').length - 1, 1, 'probe runs once per load');
});

test('probe state is exposed so Settings can tell when the size label is still a WASM guess', () => {
  assert.match(summaryLlm, /function isLlmDeviceProbeKnown\(\) \{\s*return webGpuProbeSettled \|\| readWebGpuCache\(\) !== null;/);
  const probe = sliceBetween(summaryLlm, 'async function ensureWebGpuProbed', 'function isLlmDeviceProbeKnown');
  // Both exits settle the flag, so a missing sessionStorage cannot cause endless re-probing.
  assert.equal(probe.split('webGpuProbeSettled = true;').length - 1, 2);
  assert.match(summaryLlm, /window\.isLlmDeviceProbeKnown = isLlmDeviceProbeKnown;/);
  assert.match(summaryLlm, /window\.ensureLlmDeviceProbed = function \(\) \{ return ensureWebGpuProbed\(\); \};/);
});

test('Settings requests the probe once and re-renders the model size label when it settles', () => {
  const src = sliceBetween(appJs, 'function refreshLlmModelSettingsHints', 'function promptAiModelDownloadConsent');
  const requestIdx = src.indexOf('window.ensureLlmDeviceProbed().then(refreshLlmModelSettingsHints');
  const statusIdx = src.indexOf('window.getAiModelStatus()');
  assert.ok(requestIdx > 0 && statusIdx > requestIdx, 'probe is requested before the label is computed');
  assert.match(appJs, /var llmDeviceProbeRequested = false;\s*function refreshLlmModelSettingsHints/);
  assert.match(src, /!llmDeviceProbeRequested/);
  assert.match(src, /llmDeviceProbeRequested = true;/);
  assert.match(src, /!window\.isLlmDeviceProbeKnown\(\)/);
});
