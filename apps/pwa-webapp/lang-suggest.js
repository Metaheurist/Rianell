/**
 * Rianell "view in your language" banner (SEO-safe, no auto-redirect).
 *
 * On the crawlable static marketing/feature pages, this reads the visitor's
 * browser language, and - only if a localized version of THIS page exists - * shows a small dismissable banner linking to it. It never redirects (that would
 * be cloaking and traps users), never runs on already-localized pages, and
 * remembers a dismissal in localStorage.
 *
 * Loaded via <script defer src="/lang-suggest.js"></script> from static pages
 * only. No dependencies; styles are applied via CSSOM (not affected by CSP
 * style-src). Same-origin script, so script-src 'self' is sufficient.
 */
(function () {
  'use strict';

  var DISMISS_KEY = 'rianell.langSuggest.dismissed';
  // Localizable English base paths that have a per-locale counterpart.
  var BASE_PATHS = [
    '/', '/features/', '/symptom-tracking/', '/mental-health-check/',
    '/ai-insights/', '/community/', '/conditions/', '/about.html',
  ];
  var SLUGS = ['de', 'fr', 'es', 'it', 'pl', 'nl', 'pt-br', 'pt-pt', 'ga', 'ar', 'he'];

  var L = {
    de: { slug: 'de', dir: 'ltr', lang: 'de', msg: 'Diese Seite ist auch auf Deutsch verfügbar.', cta: 'Auf Deutsch ansehen', close: 'Schließen' },
    fr: { slug: 'fr', dir: 'ltr', lang: 'fr', msg: 'Cette page est aussi disponible en français.', cta: 'Voir en français', close: 'Fermer' },
    es: { slug: 'es', dir: 'ltr', lang: 'es', msg: 'Esta página también está disponible en español.', cta: 'Ver en español', close: 'Cerrar' },
    it: { slug: 'it', dir: 'ltr', lang: 'it', msg: 'Questa pagina è disponibile anche in italiano.', cta: 'Vedi in italiano', close: 'Chiudi' },
    pl: { slug: 'pl', dir: 'ltr', lang: 'pl', msg: 'Ta strona jest również dostępna w języku polskim.', cta: 'Zobacz po polsku', close: 'Zamknij' },
    nl: { slug: 'nl', dir: 'ltr', lang: 'nl', msg: 'Deze pagina is ook beschikbaar in het Nederlands.', cta: 'Bekijk in het Nederlands', close: 'Sluiten' },
    ptbr: { slug: 'pt-br', dir: 'ltr', lang: 'pt-BR', msg: 'Esta página também está disponível em português.', cta: 'Ver em português', close: 'Fechar' },
    ptpt: { slug: 'pt-pt', dir: 'ltr', lang: 'pt-PT', msg: 'Esta página também está disponível em português.', cta: 'Ver em português', close: 'Fechar' },
    ga: { slug: 'ga', dir: 'ltr', lang: 'ga', msg: 'Tá an leathanach seo ar fáil i nGaeilge freisin.', cta: 'Féach as Gaeilge', close: 'Dún' },
    ar: { slug: 'ar', dir: 'rtl', lang: 'ar', msg: 'هذه الصفحة متوفرة أيضًا باللغة العربية.', cta: 'عرض بالعربية', close: 'إغلاق' },
    he: { slug: 'he', dir: 'rtl', lang: 'he', msg: 'דף זה זמין גם בעברית.', cta: 'הצג בעברית', close: 'סגור' },
  };

  /** Map a list of BCP-47 browser languages to a locale key, or null. */
  function pickLocale(langs) {
    for (var i = 0; i < langs.length; i++) {
      var l = String(langs[i] || '').toLowerCase();
      if (!l) continue;
      if (l === 'en' || l.indexOf('en-') === 0) return null; // already served in English
      if (l === 'pt-br') return 'ptbr';
      if (l.indexOf('pt') === 0) return 'ptpt';
      if (l.indexOf('de') === 0) return 'de';
      if (l.indexOf('fr') === 0) return 'fr';
      if (l.indexOf('es') === 0) return 'es';
      if (l.indexOf('it') === 0) return 'it';
      if (l.indexOf('pl') === 0) return 'pl';
      if (l.indexOf('nl') === 0) return 'nl';
      if (l.indexOf('ga') === 0) return 'ga';
      if (l.indexOf('ar') === 0) return 'ar';
      if (l.indexOf('he') === 0 || l.indexOf('iw') === 0) return 'he';
    }
    return null;
  }

  function currentPath() {
    var p = window.location.pathname || '/';
    // Normalise "/features/index.html" → "/features/" if a server ever exposes it.
    p = p.replace(/index\.html$/, '');
    if (p === '') p = '/';
    return p;
  }

  function alreadyLocalized(path) {
    var seg = path.split('/')[1];
    return SLUGS.indexOf(seg) !== -1;
  }

  function targetFor(entry, path) {
    return path === '/' ? '/' + entry.slug + '/' : '/' + entry.slug + path;
  }

  function dismissed() {
    try { return window.localStorage.getItem(DISMISS_KEY) === '1'; } catch (e) { return false; }
  }
  function rememberDismissed() {
    try { window.localStorage.setItem(DISMISS_KEY, '1'); } catch (e) { /* ignore */ }
  }

  function build(entry, href) {
    var bar = document.createElement('div');
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', entry.msg);
    bar.setAttribute('data-lang-suggest', entry.slug);
    bar.setAttribute('dir', entry.dir);
    bar.lang = entry.lang;
    var s = bar.style;
    s.position = 'fixed'; s.left = '0'; s.right = '0'; s.bottom = '0'; s.zIndex = '2147483000';
    s.display = 'flex'; s.alignItems = 'center'; s.gap = '14px'; s.flexWrap = 'wrap';
    s.padding = '12px 18px';
    s.background = '#0d130f'; s.color = '#e8eee9';
    s.borderTop = '1px solid #1e2a24';
    s.font = '15px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif';
    s.boxShadow = '0 -6px 24px rgba(0,0,0,.35)';

    var msg = document.createElement('span');
    msg.textContent = entry.msg;
    msg.style.flex = '1 1 240px';

    var link = document.createElement('a');
    link.href = href;
    link.textContent = entry.cta;
    var ls = link.style;
    ls.display = 'inline-block'; ls.padding = '9px 16px'; ls.borderRadius = '9px';
    ls.background = 'linear-gradient(90deg,#78c06e,#2e7d50)'; ls.color = '#04120b';
    ls.fontWeight = '700'; ls.textDecoration = 'none'; ls.whiteSpace = 'nowrap';

    var close = document.createElement('button');
    close.type = 'button';
    close.setAttribute('aria-label', entry.close);
    close.textContent = '✕';
    var cs = close.style;
    cs.background = 'transparent'; cs.border = '0'; cs.color = '#9fb0a6';
    cs.fontSize = '18px'; cs.lineHeight = '1'; cs.cursor = 'pointer'; cs.padding = '6px';
    close.addEventListener('click', function () {
      rememberDismissed();
      if (bar.parentNode) bar.parentNode.removeChild(bar);
    });

    bar.appendChild(msg);
    bar.appendChild(link);
    bar.appendChild(close);
    return bar;
  }

  function run() {
    try {
      if (dismissed()) return;
      var path = currentPath();
      if (BASE_PATHS.indexOf(path) === -1) return;
      if (alreadyLocalized(path)) return;
      var langs = (navigator.languages && navigator.languages.length)
        ? navigator.languages
        : [navigator.language || navigator.userLanguage];
      var key = pickLocale(langs);
      if (!key || !L[key]) return;
      var entry = L[key];
      var href = targetFor(entry, path);
      document.body.appendChild(build(entry, href));
    } catch (e) { /* never break the page for a suggestion banner */ }
  }

  // Exported for unit testing (evaluated in a Node vm sandbox with a fake `module`).
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { pickLocale: pickLocale, targetFor: targetFor, currentPath: currentPath, alreadyLocalized: alreadyLocalized, BASE_PATHS: BASE_PATHS, SLUGS: SLUGS, L: L };
  }

  // Browser: attach the banner once the DOM is ready. No-op in non-DOM contexts.
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', run);
    } else {
      run();
    }
  }
})();
