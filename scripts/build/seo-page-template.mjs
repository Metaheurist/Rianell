/**
 * Pure rendering logic for Rianell's crawlable multilingual SEO pages.
 *
 * Consumed by scripts/build/generate-localized-pages.mjs. Given a page key,
 * a locale, and a resolved content object (English or a translated copy), it
 * returns a full, self-contained HTML document that matches the hand-authored
 * English pages' design, with per-locale <title>/meta/OG, a reciprocal
 * hreflang cluster, RTL handling for ar/he, and localized JSON-LD.
 *
 * No DOM / no I/O here so it can be unit-tested and reused by CI.
 */
import { isRtlLocale, textDirection } from '../../packages/shared/src/i18n/rtl.mjs';

export const BASE_URL = 'https://rianell.com/';
export const OG_CARD = 'https://rianell.com/Icons/og-card.png';

/** Non-English shipped locales that get their own URL tree. */
export const LOCALES = ['de-DE', 'fr-FR', 'es-ES', 'it-IT', 'pl-PL', 'nl-NL', 'pt-BR', 'pt-PT', 'ga', 'ar', 'he'];

/** URL path segment per locale (subdirectory scheme). */
export const SLUG = {
  'de-DE': 'de', 'fr-FR': 'fr', 'es-ES': 'es', 'it-IT': 'it', 'pl-PL': 'pl',
  'nl-NL': 'nl', 'pt-BR': 'pt-br', 'pt-PT': 'pt-pt', ga: 'ga', ar: 'ar', he: 'he',
};

/** <html lang="..."> value per locale. */
export const HTML_LANG = {
  en: 'en', 'de-DE': 'de', 'fr-FR': 'fr', 'es-ES': 'es', 'it-IT': 'it', 'pl-PL': 'pl',
  'nl-NL': 'nl', 'pt-BR': 'pt-BR', 'pt-PT': 'pt-PT', ga: 'ga', ar: 'ar', he: 'he',
};

/** og:locale value per locale. */
export const OG_LOCALE = {
  en: 'en_US', 'de-DE': 'de_DE', 'fr-FR': 'fr_FR', 'es-ES': 'es_ES', 'it-IT': 'it_IT',
  'pl-PL': 'pl_PL', 'nl-NL': 'nl_NL', 'pt-BR': 'pt_BR', 'pt-PT': 'pt_PT', ga: 'ga_IE',
  ar: 'ar_AR', he: 'he_IL',
};

/** hreflang attribute per locale (used inside the reciprocal cluster). */
export const HREFLANG = {
  'de-DE': 'de', 'fr-FR': 'fr', 'es-ES': 'es', 'it-IT': 'it', 'pl-PL': 'pl',
  'nl-NL': 'nl', 'pt-BR': 'pt-BR', 'pt-PT': 'pt-PT', ga: 'ga', ar: 'ar', he: 'he',
};

/** Page keys in deterministic order + their URL slug and output file. */
export const PAGE_ORDER = [
  'home', 'features', 'symptom-tracking', 'mental-health-check',
  'ai-insights', 'community', 'conditions', 'about',
];

export const PAGE_META = {
  home: { slug: '', out: 'index.html', generateEnglish: false },
  features: { slug: 'features/', out: 'features/index.html', generateEnglish: true },
  'symptom-tracking': { slug: 'symptom-tracking/', out: 'symptom-tracking/index.html', generateEnglish: true },
  'mental-health-check': { slug: 'mental-health-check/', out: 'mental-health-check/index.html', generateEnglish: true },
  'ai-insights': { slug: 'ai-insights/', out: 'ai-insights/index.html', generateEnglish: true },
  community: { slug: 'community/', out: 'community/index.html', generateEnglish: true },
  conditions: { slug: 'conditions/', out: 'conditions/index.html', generateEnglish: true },
  about: { slug: 'about.html', out: 'about.html', generateEnglish: true },
};

export const HREFLANG_START = '<!-- hreflang:start -->';
export const HREFLANG_END = '<!-- hreflang:end -->';

// ---- helpers --------------------------------------------------------------
export function escHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
export function escAttr(s) {
  return escHtml(s).replace(/"/g, '&quot;');
}

/** Absolute URL of a page in a given locale (en = root tree). */
export function pageUrl(pageKey, locale) {
  const slug = PAGE_META[pageKey].slug;
  if (locale === 'en') return BASE_URL + slug;
  return `${BASE_URL}${SLUG[locale]}/${slug}`;
}

/** Root-relative link to a page in a given locale (for in-page nav/links). */
export function pagePath(pageKey, locale) {
  const slug = PAGE_META[pageKey].slug;
  if (locale === 'en') return `/${slug}`;
  return `/${SLUG[locale]}/${slug}`;
}

/** Output path (relative to web root) for a page in a locale. */
export function outPath(pageKey, locale) {
  const out = PAGE_META[pageKey].out;
  if (locale === 'en') return out;
  return `${SLUG[locale]}/${out}`;
}

/** Ordered [hreflang, href] pairs of the reciprocal cluster for a page. */
export function hreflangCluster(pageKey) {
  const enUrl = pageUrl(pageKey, 'en');
  const pairs = [
    ['en', enUrl],
    ['en-GB', enUrl],
    ['en-US', enUrl],
    ['en-AU', enUrl],
  ];
  for (const loc of LOCALES) pairs.push([HREFLANG[loc], pageUrl(pageKey, loc)]);
  pairs.push(['x-default', enUrl]);
  return pairs;
}

/** HTML <link> block for the cluster, wrapped in idempotent markers. */
export function clusterLinksHtml(pageKey, indent = '  ') {
  const lines = [`${indent}${HREFLANG_START}`];
  for (const [hl, href] of hreflangCluster(pageKey)) {
    lines.push(`${indent}<link rel="alternate" hreflang="${escAttr(hl)}" href="${escAttr(href)}" />`);
  }
  lines.push(`${indent}${HREFLANG_END}`);
  return lines.join('\n');
}

function resolveLinkHref(link, locale) {
  if (link.page) return pagePath(link.page, locale);
  return link.href;
}

function jsonLdBlock(graph) {
  const json = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }, null, 2);
  const indented = json.split('\n').map((l) => `  ${l}`).join('\n');
  return `  <script type="application/ld+json">\n${indented}\n  </script>`;
}

const ORG_NODE = {
  '@type': 'Organization',
  '@id': 'https://rianell.com/#organization',
  name: 'Rianell',
  url: 'https://rianell.com/',
  logo: 'https://rianell.com/Icons/Icon-512.png',
  sameAs: ['https://github.com/OnceU/Health-app'],
};

function breadcrumbNode(breadcrumb, locale) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumb.map((b, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: b.name,
      item: pageUrl(b.page, locale),
    })),
  };
}

// ---- CSS (kept in sync with the hand-authored English pages) --------------
const MARKETING_CSS = `    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    :root{--bg:#070807;--fg:#e8eee9;--muted:#9fb0a6;--line:#1e2a24;--accent:#78c06e;--accent2:#2e7d50;--card:#0d130f}
    html{scroll-behavior:smooth}
    body{font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;background:radial-gradient(1200px 600px at 100% -10%,rgba(120,192,110,.08),transparent),var(--bg);color:var(--fg);line-height:1.65}
    a{color:var(--accent);text-decoration:none}a:hover{text-decoration:underline}
    .wrap{max-width:1040px;margin:0 auto;padding:0 20px}
    .skip{position:absolute;left:-999px}.skip:focus{left:16px;top:16px;background:var(--accent);color:#04120b;padding:8px 12px;border-radius:8px;z-index:10}
    header.site{border-bottom:1px solid var(--line);padding:16px 0}
    .bar{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap}
    .brand{display:flex;align-items:center;gap:12px;font-weight:800;font-size:1.15rem;color:var(--fg)}
    .brand img{width:38px;height:38px;border-radius:10px}
    nav.site a{color:var(--muted);font-size:.92rem;margin-left:18px}nav.site a:hover{color:var(--fg)}
    .hero{padding:64px 0 24px}
    .eyebrow{color:var(--accent);font-weight:700;letter-spacing:.04em;text-transform:uppercase;font-size:.8rem}
    h1{font-size:clamp(2rem,5vw,3.2rem);font-weight:800;line-height:1.1;margin:12px 0 16px;letter-spacing:-.02em}
    .lede{font-size:1.15rem;color:var(--muted);max-width:70ch}
    .cta{display:flex;gap:14px;flex-wrap:wrap;margin-top:28px}
    .btn{display:inline-block;padding:13px 22px;border-radius:10px;font-weight:700;font-size:1rem}
    .btn.primary{background:linear-gradient(90deg,var(--accent),var(--accent2));color:#04120b}
    .btn.ghost{border:1px solid var(--line);color:var(--fg)}
    .btn:hover{text-decoration:none;filter:brightness(1.06)}
    .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:18px;margin:28px 0}
    .card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:22px;display:block}
    .card h3{font-size:1.05rem;margin-bottom:8px;color:var(--fg)}
    .card p{color:var(--muted);font-size:.95rem}
    section{padding:26px 0}
    h2{font-size:clamp(1.4rem,3vw,2rem);font-weight:700;margin:8px 0 14px;letter-spacing:-.01em}
    .prose p{color:#cdd8d1;margin-bottom:12px;max-width:72ch}
    .prose ul{color:#cdd8d1;padding-left:22px;margin-bottom:12px}.prose li{margin-bottom:6px}
    .faq details{border:1px solid var(--line);border-radius:12px;padding:14px 16px;margin-bottom:10px;background:var(--card)}
    .faq summary{cursor:pointer;font-weight:650}
    .faq p{color:var(--muted);margin-top:8px}
    .note{font-size:.9rem;color:var(--muted);border-left:3px solid var(--accent2);padding-left:12px;margin:18px 0}
    footer.site{border-top:1px solid var(--line);margin-top:48px;padding:28px 0;color:var(--muted);font-size:.9rem}
    footer.site a{color:var(--muted);margin-right:16px}footer.site a:hover{color:var(--fg)}
    @media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}}`;

const MARKETING_RTL_CSS = `
    [dir=rtl] nav.site a{margin-left:0;margin-right:18px}
    [dir=rtl] footer.site a{margin-right:0;margin-left:16px}
    [dir=rtl] .prose ul{padding-left:0;padding-right:22px}
    [dir=rtl] .note{border-left:0;border-right:3px solid var(--accent2);padding-left:0;padding-right:12px}
    [dir=rtl] .skip:focus{left:auto;right:16px}`;

const ABOUT_CSS = `    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: #0f1117;
      color: #e2e8f0;
      line-height: 1.7;
      padding: 2rem 1rem 4rem;
    }
    .container { max-width: 760px; margin: 0 auto; }
    a { color: #60a5fa; }
    header { margin-bottom: 2.5rem; padding-bottom: 1.5rem; border-bottom: 1px solid #2d3748; display: flex; align-items: center; gap: 1.25rem; }
    header img { width: 64px; height: 64px; border-radius: 14px; }
    header h1 { font-size: 2rem; font-weight: 700; }
    header p { color: #94a3b8; font-size: 0.95rem; margin-top: 0.15rem; }
    h2 { font-size: 1.1rem; font-weight: 600; margin: 2rem 0 0.5rem; color: #f1f5f9; }
    p { color: #cbd5e1; margin-bottom: 0.75rem; }
    ul { color: #cbd5e1; padding-left: 1.5rem; margin-bottom: 0.75rem; }
    li { margin-bottom: 0.35rem; }
    .cta { display: inline-block; margin-top: 1.5rem; background: #2e7d50; color: #fff; padding: 0.65rem 1.5rem; border-radius: 8px; text-decoration: none; font-weight: 600; }
    .links { margin-top: 2.5rem; padding-top: 1.5rem; border-top: 1px solid #2d3748; display: flex; gap: 1.5rem; flex-wrap: wrap; font-size: 0.9rem; }`;

const ABOUT_RTL_CSS = `
    [dir=rtl] ul { padding-left: 0; padding-right: 1.5rem; }`;

// ---- head -----------------------------------------------------------------
function renderHead({ pageKey, locale, content, css, rtlCss, jsonLd }) {
  const lang = HTML_LANG[locale] || 'en';
  const rtl = isRtlLocale(locale);
  const htmlOpen = rtl ? `<html lang="${escAttr(lang)}" dir="rtl">` : `<html lang="${escAttr(lang)}">`;
  const canonical = pageUrl(pageKey, locale);
  const styleBody = css + (rtl && rtlCss ? rtlCss : '');
  return `<!DOCTYPE html>
${htmlOpen}
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escHtml(content.title)}</title>
  <meta name="description" content="${escAttr(content.description)}" />
  <link rel="canonical" href="${escAttr(canonical)}" />
${clusterLinksHtml(pageKey)}
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Rianell" />
  <meta property="og:locale" content="${escAttr(OG_LOCALE[locale] || 'en_US')}" />
  <meta property="og:title" content="${escAttr(content.ogTitle)}" />
  <meta property="og:description" content="${escAttr(content.ogDescription)}" />
  <meta property="og:url" content="${escAttr(canonical)}" />
  <meta property="og:image" content="${OG_CARD}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="${escAttr(content._ogImageAlt)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escAttr(content.twTitle)}" />
  <meta name="twitter:description" content="${escAttr(content.twDescription)}" />
  <meta name="twitter:image" content="${OG_CARD}" />
${jsonLd}
  <style>
${styleBody}
  </style>
</head>`;
}

// ---- marketing body -------------------------------------------------------
function renderCtas(ctas, locale, indent) {
  if (!ctas || !ctas.length) return '';
  const inner = ctas
    .map((c) => `${indent}  <a class="btn ${c.style === 'ghost' ? 'ghost' : 'primary'}" href="${escAttr(resolveLinkHref(c, locale))}">${escHtml(c.label)}</a>`)
    .join('\n');
  return `${indent}<div class="cta">\n${inner}\n${indent}</div>`;
}

function renderCard(card, locale) {
  const inner = `<h3>${escHtml(card.h3)}</h3><p>${escHtml(card.p)}</p>`;
  if (card.page) return `          <a class="card" href="${escAttr(pagePath(card.page, locale))}">${inner}</a>`;
  return `          <div class="card">${inner}</div>`;
}

function renderSection(section, locale) {
  if (section.kind === 'grid') {
    const open = section.ariaLabel
      ? `      <section aria-label="${escAttr(section.ariaLabel)}">`
      : '      <section>';
    const heading = section.h2 ? `\n        <h2>${escHtml(section.h2)}</h2>` : '';
    const cards = section.cards.map((c) => renderCard(c, locale)).join('\n');
    const ctas = section.ctas ? `\n${renderCtas(section.ctas, locale, '        ')}` : '';
    return `${open}${heading}\n        <div class="grid">\n${cards}\n        </div>${ctas}\n      </section>`;
  }
  if (section.kind === 'prose') {
    const paras = (section.paragraphs || []).map((p) => `        <p>${escHtml(p)}</p>`).join('\n');
    const list = section.list
      ? `\n        <ul>\n${section.list.map((li) => `          <li>${escHtml(li)}</li>`).join('\n')}\n        </ul>`
      : '';
    const note = section.note ? `\n        <p class="note">${escHtml(section.note)}</p>` : '';
    const ctas = section.ctas ? `\n${renderCtas(section.ctas, locale, '        ')}` : '';
    return `      <section class="prose">\n        <h2>${escHtml(section.h2)}</h2>\n${paras}${list}${note}${ctas}\n      </section>`;
  }
  if (section.kind === 'faq') {
    const items = section.items
      .map((it) => `        <details><summary>${escHtml(it.summary)}</summary><p>${escHtml(it.body)}</p></details>`)
      .join('\n');
    const ctas = section.ctas ? `\n${renderCtas(section.ctas, locale, '        ')}` : '';
    return `      <section class="faq">\n        <h2>${escHtml(section.h2)}</h2>\n${items}${ctas}\n      </section>`;
  }
  return '';
}

function renderMarketing({ pageKey, locale, content, site }) {
  const graph = [{
    '@type': content.jsonldType || 'WebPage',
    '@id': `${pageUrl(pageKey, locale)}#page`,
    name: content.jsonldName,
    url: pageUrl(pageKey, locale),
    description: content.jsonldDescription,
    inLanguage: HTML_LANG[locale] || 'en',
    isPartOf: { '@id': 'https://rianell.com/#website' },
  }, ORG_NODE];
  if (content.breadcrumb) graph.push(breadcrumbNode(content.breadcrumb, locale));
  if (content.faqSchema) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: content.faqSchema.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    });
  }

  const head = renderHead({
    pageKey, locale, content, css: MARKETING_CSS, rtlCss: MARKETING_RTL_CSS, jsonLd: jsonLdBlock(graph),
  });

  const nav = site.nav
    .map((n) => `      <a href="${escAttr(pagePath(n.page, locale))}">${escHtml(n.label)}</a>`)
    .join('\n');
  const footerLinks = site.footer.links
    .map((l) => `      <a href="${escAttr(resolveLinkHref(l, locale))}">${escHtml(l.label)}</a>`)
    .join('\n');

  const heroNote = content.hero.note ? `\n        <p class="note">${escHtml(content.hero.note)}</p>` : '';
  const sections = content.sections.map((s) => renderSection(s, locale)).join('\n\n');
  const homePath = pagePath('home', locale);

  const body = `<body>
  <a class="skip" href="#main">${escHtml(site.skipToContent)}</a>
  <header class="site"><div class="wrap bar">
    <a class="brand" href="${escAttr(homePath)}"><img src="/Icons/Icon-128.png" alt="${escAttr(site.logoAlt)}" onerror="this.style.display='none'" />${escHtml(site.brand)}</a>
    <nav class="site" aria-label="${escAttr(site.primaryNavLabel)}">
${nav}
    </nav>
  </div></header>

  <main id="main">
    <div class="wrap">
      <div class="hero">
        <p class="eyebrow">${escHtml(content.hero.eyebrow)}</p>
        <h1>${escHtml(content.hero.h1)}</h1>
        <p class="lede">${escHtml(content.hero.lede)}</p>
${renderCtas(content.hero.ctas, locale, '        ')}${heroNote}
      </div>

${sections}
    </div>
  </main>

  <footer class="site"><div class="wrap">
    <p style="margin-bottom:10px">
${footerLinks}
    </p>
    <p>${escHtml(site.footer.tagline)} <a href="${escAttr(homePath)}">${escHtml(site.openApp)} →</a></p>
  </div></footer>
  <script defer src="/lang-suggest.js"></script>
</body>
</html>
`;
  return `${head}\n${body}`;
}

// ---- about body -----------------------------------------------------------
function renderAbout({ pageKey, locale, content, site }) {
  const graph = [{
    '@type': 'AboutPage',
    '@id': `${pageUrl(pageKey, locale)}#page`,
    name: content.jsonldName,
    url: pageUrl(pageKey, locale),
    description: content.jsonldDescription,
    inLanguage: HTML_LANG[locale] || 'en',
    isPartOf: { '@id': 'https://rianell.com/#website' },
    about: { '@id': 'https://rianell.com/#organization' },
  }, ORG_NODE];
  if (content.breadcrumb) graph.push(breadcrumbNode(content.breadcrumb, locale));

  const head = renderHead({
    pageKey, locale, content, css: ABOUT_CSS, rtlCss: ABOUT_RTL_CSS, jsonLd: jsonLdBlock(graph),
  });

  const blocks = content.blocks.map((b) => {
    const list = b.list
      ? `    <ul>\n${b.list.map((li) => `      <li>${escHtml(li)}</li>`).join('\n')}\n    </ul>`
      : '';
    const paras = (b.paragraphs || []).map((p) => `    <p>${escHtml(p)}</p>`).join('\n');
    return `    <h2>${escHtml(b.h2)}</h2>\n${b.list ? list : paras}`;
  }).join('\n\n');

  const homePath = pagePath('home', locale);
  const body = `<body>
  <div class="container">
    <header>
      <img src="/Icons/Icon-128.png" alt="${escAttr(site.logoAlt)}" onerror="this.style.display='none'" />
      <div>
        <h1>${escHtml(site.brand)}</h1>
        <p>${escHtml(content.tagline)}</p>
      </div>
    </header>

    <p>${escHtml(content.intro)}</p>

${blocks}

    <a class="cta" href="${escAttr(homePath)}">${escHtml(site.openApp)} →</a>

    <div class="links">
      <a href="/privacy.html">${escHtml(content.aboutLinks.privacy)}</a>
      <a href="/tos.html">${escHtml(content.aboutLinks.tos)}</a>
      <a href="https://github.com/OnceU/Health-app" target="_blank" rel="noopener">${escHtml(content.aboutLinks.github)}</a>
    </div>
  </div>
  <script defer src="/lang-suggest.js"></script>
</body>
</html>
`;
  return `${head}\n${body}`;
}

/**
 * Render a full HTML document for a page.
 * @param {object} args
 * @param {string} args.pageKey  one of PAGE_ORDER
 * @param {string} args.locale   'en' or a value in LOCALES
 * @param {object} args.content  resolved page content (title/description/hero/sections/...)
 * @param {object} args.site     resolved site chrome (nav/footer/brand/...)
 */
export function renderPage({ pageKey, locale, content, site }) {
  const type = content.type || 'marketing';
  const enriched = { ...content, _ogImageAlt: site.ogImageAlt };
  if (type === 'about') return renderAbout({ pageKey, locale, content: enriched, site });
  return renderMarketing({ pageKey, locale, content: enriched, site });
}
