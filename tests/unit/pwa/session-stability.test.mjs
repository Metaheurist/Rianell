import { readFileSync } from 'fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const appJs = readFileSync('apps/pwa-webapp/app.js', 'utf8');
const perfUtils = readFileSync('apps/pwa-webapp/performance-utils.js', 'utf8');
const privacyRegion = readFileSync('apps/pwa-webapp/privacy-region.js', 'utf8');
const summaryLlm = readFileSync('apps/pwa-webapp/summary-llm.js', 'utf8');

// L1 — _voiceInputObserver is disconnected on beforeunload
test('L1: _voiceInputObserver.disconnect() is called in beforeunload cleanup', () => {
  assert.match(
    perfUtils,
    /_voiceInputObserver\.disconnect\(\)/,
    'performance-utils.js must disconnect _voiceInputObserver on beforeunload',
  );
  assert.match(
    perfUtils,
    /window\._voiceInputObserver\s*=\s*null/,
    'performance-utils.js must null _voiceInputObserver after disconnect',
  );
  const beforeunloadBlock = perfUtils.slice(
    perfUtils.indexOf("addEventListener('beforeunload'"),
    perfUtils.indexOf("addEventListener('beforeunload'") + 500,
  );
  assert.match(
    beforeunloadBlock,
    /_voiceInputObserver/,
    '_voiceInputObserver cleanup must be inside the beforeunload listener',
  );
});

// L2 — __rianellBootLog ring-buffer cap in app.js
test('L2: __rianellBootLog has ring-buffer cap in app.js', () => {
  assert.match(
    appJs,
    /__rianellBootLog\.length\s*>=\s*100/,
    'app.js must cap __rianellBootLog at 100 entries',
  );
  assert.match(
    appJs,
    /__rianellBootLog\.shift\(\)/,
    'app.js must call shift() to discard oldest boot log entries',
  );
});

// L2b — global.__rianellBootLog ring-buffer cap in privacy-region.js
test('L2b: global.__rianellBootLog has ring-buffer cap in privacy-region.js', () => {
  assert.match(
    privacyRegion,
    /global\.__rianellBootLog\.length\s*>=\s*100/,
    'privacy-region.js must cap global.__rianellBootLog at 100 entries',
  );
  assert.match(
    privacyRegion,
    /global\.__rianellBootLog\.shift\(\)/,
    'privacy-region.js must call shift() on global.__rianellBootLog',
  );
});

// L4 — privacy-region.js stores observer/interval refs and clears them in unlockAppChrome
test('L4: privacy-region.js declares module-scoped consent observer and interval refs', () => {
  assert.match(
    privacyRegion,
    /var _privacyConsentObserver\s*=\s*null/,
    'privacy-region.js must declare _privacyConsentObserver module var',
  );
  assert.match(
    privacyRegion,
    /var _privacyConsentIntervalId\s*=\s*null/,
    'privacy-region.js must declare _privacyConsentIntervalId module var',
  );
});

test('L4: unlockAppChrome disconnects consent observer and clears interval', () => {
  const unlockStart = privacyRegion.indexOf('function unlockAppChrome');
  const unlockBlock = privacyRegion.slice(unlockStart, unlockStart + 900);
  assert.match(
    unlockBlock,
    /_privacyConsentObserver\.disconnect\(\)/,
    'unlockAppChrome must call _privacyConsentObserver.disconnect()',
  );
  assert.match(
    unlockBlock,
    /clearInterval\(_privacyConsentIntervalId\)/,
    'unlockAppChrome must call clearInterval(_privacyConsentIntervalId)',
  );
  assert.match(
    unlockBlock,
    /_privacyConsentObserver\s*=\s*null/,
    'unlockAppChrome must null _privacyConsentObserver after disconnect',
  );
  assert.match(
    unlockBlock,
    /_privacyConsentIntervalId\s*=\s*null/,
    'unlockAppChrome must null _privacyConsentIntervalId after clearInterval',
  );
});

// L5 — session-elapsed maxChartPoints decay
test('L5: chart rendering applies session-elapsed maxPoints decay', () => {
  assert.match(
    appJs,
    /_sessionElapsedMs/,
    'app.js must use _sessionElapsedMs for session-elapsed cap',
  );
  assert.match(
    appJs,
    /_sessionCapFactor/,
    'app.js must compute _sessionCapFactor from session elapsed time',
  );
  assert.match(
    appJs,
    /3600000/,
    'app.js must reference 3600000ms (1h) threshold for session decay',
  );
  assert.match(
    appJs,
    /1800000/,
    'app.js must reference 1800000ms (30min) threshold for session decay',
  );
});

// L6 — SW dismiss counter
test('L6: SW update dismissal counter forces update after 3 dismissals', () => {
  assert.match(
    appJs,
    /rianellUpdateDismissCount/,
    'app.js must track rianellUpdateDismissCount in sessionStorage',
  );
  assert.match(
    appJs,
    /_cnt\s*>=\s*3/,
    'app.js must force SKIP_WAITING after 3 dismissals',
  );
  const dismissBlock = appJs.slice(
    appJs.indexOf('rianellUpdateDismissCount'),
    appJs.indexOf('rianellUpdateDismissCount') + 400,
  );
  assert.match(
    dismissBlock,
    /SKIP_WAITING/,
    'rianellUpdateDismissCount block must trigger SKIP_WAITING when count >= 3',
  );
});

// L7 — verify-no-cspro-none.mjs script exists and checks for connect-src none
test('L7: verify-no-cspro-none.mjs exists and checks for connect-src none', () => {
  const script = readFileSync('scripts/verify/verify-no-cspro-none.mjs', 'utf8');
  assert.match(
    script,
    /connect-src.*'none'/,
    'verify-no-cspro-none.mjs must check for connect-src none pattern',
  );
  assert.match(
    script,
    /content-security-policy-report-only/i,
    'verify-no-cspro-none.mjs must check the CSPRO header',
  );
  assert.match(
    script,
    /process\.exit\(1\)/,
    'verify-no-cspro-none.mjs must exit 1 on failure',
  );
});

// L7 — verify:cspro is wired into package.json
test('L7: verify:cspro script is registered in package.json', () => {
  const pkg = readFileSync('package.json', 'utf8');
  assert.match(
    pkg,
    /verify:cspro/,
    'package.json must include verify:cspro script',
  );
  assert.match(
    pkg,
    /verify-no-cspro-none\.mjs/,
    'package.json verify:cspro must point to the new verify script',
  );
});

// L7 — stress:memory script is registered in package.json
test('L7: stress:memory script is registered in package.json', () => {
  const pkg = readFileSync('package.json', 'utf8');
  assert.match(
    pkg,
    /stress:memory/,
    'package.json must include stress:memory script',
  );
  assert.match(
    pkg,
    /stress-test-memory\.mjs/,
    'package.json stress:memory must point to the stress test script',
  );
});

// L8 — pre-flight heap guard in summary-llm.js
test('L8: summary-llm.js applies pre-flight heap pressure guard before GPU LLM load', () => {
  assert.match(
    summaryLlm,
    /_heapPressure/,
    'summary-llm.js must declare _heapPressure guard',
  );
  assert.match(
    summaryLlm,
    /performance\.memory\.usedJSHeapSize\s*>\s*209715200/,
    'summary-llm.js must check heap > 200MB (209715200 bytes)',
  );
  assert.match(
    summaryLlm,
    /gpuPlans\s*=\s*\[\]/,
    'summary-llm.js must clear gpuPlans when heap pressure detected',
  );
});

test('L8: summary-llm.js nulls cachedPipeline in GPU catch block before WASM fallback', () => {
  const catchBlock = summaryLlm.slice(
    summaryLlm.indexOf('cachedPipeline = null; }'),
    summaryLlm.indexOf('cachedPipeline = null; }') + 200,
  );
  assert.ok(
    catchBlock.length > 0,
    'summary-llm.js catch block must null cachedPipeline before WASM fallback',
  );
});
