/**
 * Deep layout diagnostic for shell 0×0 boot failures.
 */
import { getChromium } from '@rianell/build-tools/probe-utils';

const url = process.env.PROBE_URL || 'http://127.0.0.1:8080/#home';
const chromium = await getChromium();
const browser = await chromium.launch({ headless: true, args: ['--disable-dev-shm-usage', '--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
await ctx.addInitScript(() => {
  try {
    localStorage.setItem('rianellTutorialSeen', '1');
    localStorage.setItem('rianellHealthDataConsent', 'accepted');
    localStorage.setItem('rianellSettings', JSON.stringify({
      privacyRegion: 'eea_uk',
      uiLocale: 'en-GB',
      healthDataConsent: true,
      policyAcknowledgedVersion: 'v1.0.0',
      aiModelDownloadConsent: 'deferred',
    }));
    localStorage.setItem('rianellPerfBenchmark', JSON.stringify({
      version: 5,
      platformType: 'desktop',
      tier: 5,
      heuristic: true,
      ts: Date.now(),
      gpu: { good: false, backend: 'none' },
    }));
  } catch (e) { /* ignore */ }
});
const page = await ctx.newPage();
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
await page.waitForTimeout(8000);

const diag = await page.evaluate(() => {
  function chain(id) {
    const el = document.getElementById(id);
    if (!el) return { missing: true };
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return {
      id,
      tag: el.tagName,
      classes: el.className,
      display: cs.display,
      visibility: cs.visibility,
      opacity: cs.opacity,
      position: cs.position,
      width: cs.width,
      height: cs.height,
      minHeight: cs.minHeight,
      maxHeight: cs.maxHeight,
      transform: cs.transform,
      overflow: cs.overflow,
      contain: cs.contain,
      contentVisibility: cs.contentVisibility,
      offsetW: el.offsetWidth,
      offsetH: el.offsetHeight,
      scrollW: el.scrollWidth,
      scrollH: el.scrollHeight,
      rect: { w: r.width, h: r.height, top: r.top, left: r.left },
      inlineStyle: el.getAttribute('style') || '',
      childCount: el.children.length,
      inert: el.hasAttribute('inert'),
      parent: el.parentElement
        ? { tag: el.parentElement.tagName, id: el.parentElement.id, classes: el.parentElement.className }
        : null,
    };
  }

  const body = document.body;
  const html = document.documentElement;
  const appShell = chain('appShell');
  const blockers = [...document.querySelectorAll(
    '.modal-overlay, .loading-overlay, .privacy-region-gate-overlay, .health-data-consent-overlay, #cssReloadOverlay, #rianellBootRecoveryOverlay',
  )].map((el) => {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return {
      id: el.id,
      classes: el.className,
      display: cs.display,
      visibility: cs.visibility,
      opacity: cs.opacity,
      zIndex: cs.zIndex,
      rect: { w: r.width, h: r.height },
    };
  });

  return {
    bodyClasses: body.className,
    htmlRect: html.getBoundingClientRect(),
    bodyRect: body.getBoundingClientRect(),
    bodyCs: {
      w: getComputedStyle(body).width,
      h: getComputedStyle(body).height,
      display: getComputedStyle(body).display,
      overflow: getComputedStyle(body).overflow,
      bg: getComputedStyle(body).backgroundColor,
    },
    stylesheetLoaded: !!document.getElementById('mainStylesheet')?.sheet,
    stylesheets: [...document.styleSheets].length,
    appShell,
    mainContent: chain('main-content'),
    homeTab: chain('homeTab'),
    homeGreeting: chain('homeGreeting'),
    loadingOverlay: chain('loadingOverlay'),
    blockers,
    shellMisplaced: appShell?.parent?.id === 'settingsOverlay',
    bootLog: (window.__rianellBootLog || []).slice(-8),
    greetingText: document.getElementById('homeGreeting')?.textContent?.trim() || '',
  };
});

console.log(JSON.stringify(diag, null, 2));
await browser.close();

const ok = !diag.shellMisplaced
  && (diag.appShell?.offsetH || 0) > 100
  && (diag.mainContent?.offsetH || 0) > 100
  && diag.greetingText.length > 0;
process.exit(ok ? 0 : 1);
