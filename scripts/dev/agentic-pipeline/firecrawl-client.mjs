/**
 * Minimal Firecrawl REST client (search + scrape). Uses key from firecrawl-config.
 */
import { getFirecrawlApiKey, getFirecrawlApiUrl } from './firecrawl-config.mjs';

async function firecrawlFetch(pathname, body, { timeoutMs = 60000 } = {}) {
  const { key } = getFirecrawlApiKey();
  if (!key) {
    throw new Error('FIRECRAWL_API_KEY missing — set in Settings or security/.env');
  }
  const base = getFirecrawlApiUrl();
  const url = `${base}${pathname.startsWith('/') ? pathname : `/${pathname}`}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch {
    throw new Error(`Firecrawl non-JSON ${res.status}: ${text.slice(0, 200)}`);
  }
  if (!res.ok || json.success === false) {
    const msg = json.error || json.message || text.slice(0, 200);
    throw new Error(`Firecrawl ${res.status}: ${msg}`);
  }
  return json;
}

/**
 * @param {string} query
 * @param {{ limit?: number, scrape?: boolean }} [opts]
 */
export async function firecrawlSearch(query, opts = {}) {
  const limit = Math.min(Math.max(Number(opts.limit) || 5, 1), 10);
  const body = {
    query: String(query || '').slice(0, 500),
    limit,
  };
  if (opts.scrape) {
    body.scrapeOptions = { formats: ['markdown'] };
  }
  const json = await firecrawlFetch('/v1/search', body, { timeoutMs: 90000 });
  const data = Array.isArray(json.data) ? json.data : [];
  return data.map((row) => ({
    title: row.title || row.metadata?.title || '',
    url: row.url || row.metadata?.sourceURL || '',
    description: row.description || row.metadata?.description || '',
    markdown: typeof row.markdown === 'string' ? row.markdown.slice(0, 6000) : '',
  })).filter((r) => r.url);
}

/**
 * @param {string} pageUrl
 */
export async function firecrawlScrape(pageUrl) {
  const json = await firecrawlFetch('/v1/scrape', {
    url: String(pageUrl || '').slice(0, 2000),
    formats: ['markdown'],
    onlyMainContent: true,
  }, { timeoutMs: 90000 });
  const d = json.data || json;
  return {
    url: d.metadata?.sourceURL || pageUrl,
    title: d.metadata?.title || '',
    markdown: String(d.markdown || '').slice(0, 12000),
  };
}

/**
 * Search + optional follow-up scrape of top hits missing markdown.
 */
export async function researchWeb(queries, opts = {}) {
  const qList = (Array.isArray(queries) ? queries : [queries])
    .map((q) => String(q || '').trim())
    .filter(Boolean)
    .slice(0, opts.maxQueries || 4);
  const perQuery = opts.limitPerQuery || 4;
  const scrapeTop = opts.scrapeTop ?? 2;
  const seen = new Set();
  const sources = [];
  const errors = [];

  for (const q of qList) {
    try {
      const hits = await firecrawlSearch(q, { limit: perQuery, scrape: false });
      let scraped = 0;
      for (const hit of hits) {
        if (seen.has(hit.url)) continue;
        seen.add(hit.url);
        let markdown = hit.markdown || '';
        if (!markdown && scraped < scrapeTop) {
          try {
            const page = await firecrawlScrape(hit.url);
            markdown = page.markdown;
            scraped += 1;
          } catch (err) {
            errors.push({ url: hit.url, error: String(err?.message || err) });
          }
        }
        sources.push({
          query: q,
          title: hit.title,
          url: hit.url,
          description: hit.description,
          excerpt: (markdown || hit.description || '').slice(0, 2500),
        });
      }
    } catch (err) {
      errors.push({ query: q, error: String(err?.message || err) });
    }
  }

  return {
    queriedAt: new Date().toISOString(),
    queries: qList,
    sources,
    errors,
  };
}

export function formatResearchContext(bundle) {
  const lines = [
    '## Web research (Firecrawl)',
    `Queried at: ${bundle.queriedAt}`,
    `Queries: ${(bundle.queries || []).join(' | ') || '(none)'}`,
    '',
  ];
  for (const [i, s] of (bundle.sources || []).entries()) {
    lines.push(`### Source ${i + 1}: ${s.title || s.url}`);
    lines.push(`URL: ${s.url}`);
    if (s.query) lines.push(`Matched query: ${s.query}`);
    if (s.description) lines.push(s.description);
    if (s.excerpt) {
      lines.push('');
      lines.push(s.excerpt.slice(0, 1800));
    }
    lines.push('');
  }
  if (bundle.errors?.length) {
    lines.push('### Research errors');
    for (const e of bundle.errors) {
      lines.push(`- ${e.query || e.url || '?'}: ${e.error}`);
    }
  }
  if (!(bundle.sources || []).length) {
    lines.push('_No web sources retrieved. Fact-check against repo context only and say so._');
  }
  return lines.join('\n');
}
