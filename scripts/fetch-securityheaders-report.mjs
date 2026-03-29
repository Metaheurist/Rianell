#!/usr/bin/env node
/**
 * Writes `security/securityheaders-rianell.com.md` for CI.
 *
 * 1) Tries to fetch the SecurityHeaders.com scan HTML (often **403** from GitHub
 *    Actions IPs — Cloudflare / bot protection).
 * 2) If the scan page is blocked (403), tries **relay fetches** (AllOrigins, corsproxy.io)
 *    so the SecurityHeaders HTML can still be parsed. Browser-only “web proxy” sites
 *    (e.g. Proxyium) are not used — they have no stable API for CI.
 * 3) If still no scan HTML, **fallback**: GET live URL(s) and record **response headers**.
 *
 * Env:
 *   SECURITY_HEADERS_URL — scan page (default securityheaders.com?q=rianell.com…)
 *   SECURITY_HEADERS_HTML_FILE — optional path to pre-fetched HTML (local/debug)
 *   SECURITY_HEADERS_FALLBACK_SITE — first live URL for header snapshot (default https://rianell.com)
 *   SECURITY_HEADERS_LIVE_URLS — optional `;` or `,` separated list; each tried in order with browser-like headers
 *   SECURITY_HEADERS_SCAN_RELAYS — `0`/`false`/`no` to disable relay attempts; otherwise direct, then allorigins, corsproxy.io, codetabs
 *   OUT_LATEST, OUT_RUN, GITHUB_RUN_NUMBER, GITHUB_SHA, GITHUB_RUN_ID
 */
import fs from 'fs';
import path from 'path';

const DEFAULT_URL =
  'https://securityheaders.com/?q=rianell.com&followRedirects=on';

const DEFAULT_FALLBACK_SITE = 'https://rianell.com';

const url = process.env.SECURITY_HEADERS_URL || DEFAULT_URL;
const fallbackSite =
  process.env.SECURITY_HEADERS_FALLBACK_SITE || DEFAULT_FALLBACK_SITE;

const SCAN_PAGE_OK = /Scan results|Security Report/i;

function parseUrlList(primary, raw) {
  const list = [];
  if (primary) list.push(primary.trim());
  if (raw) {
    for (const part of raw.split(/[;,]+/)) {
      const u = part.trim();
      if (u && !list.includes(u)) list.push(u);
    }
  }
  return list.length ? list : [DEFAULT_FALLBACK_SITE];
}

function scanRelaysEnabled() {
  const v = (process.env.SECURITY_HEADERS_SCAN_RELAYS || '1').toLowerCase();
  return v !== '0' && v !== 'false' && v !== 'no' && v !== 'off';
}

const outLatest =
  process.env.OUT_LATEST ||
  path.join(process.cwd(), 'security', 'securityheaders-rianell.com.md');
const outRun = process.env.OUT_RUN || '';

function stripTags(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) =>
      String.fromCharCode(parseInt(h, 16))
    )
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function anchorToMd(html) {
  return html.replace(
    /<a\s+[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi,
    (_, href, inner) => {
      const text = stripTags(inner).replace(/\s+/g, ' ').trim();
      return `[${text}](${href})`;
    }
  );
}

function cellToMd(cellHtml) {
  let s = anchorToMd(cellHtml);
  s = s.replace(/<[^>]+>/g, '');
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

function tableToMd(tableHtml) {
  const rows = [];
  const trs = tableHtml.match(/<tr[\s\S]*?<\/tr>/gi) || [];
  for (const tr of trs) {
    const cells = tr.match(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi) || [];
    const cols = cells.map((c) => {
      const m = c.match(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/i);
      return m ? cellToMd(m[1]) : '';
    });
    if (cols.length) rows.push(cols);
  }
  if (!rows.length) return '';
  const width = Math.max(...rows.map((r) => r.length));
  const pad = (row) => {
    const copy = row.slice();
    while (copy.length < width) copy.push('');
    return copy;
  };
  const lines = [];
  lines.push('| ' + pad(rows[0]).join(' | ') + ' |');
  lines.push('| ' + pad(rows[0]).map(() => '---').join(' | ') + ' |');
  for (let i = 1; i < rows.length; i++) {
    lines.push('| ' + pad(rows[i]).join(' | ') + ' |');
  }
  return lines.join('\n') + '\n\n';
}

function extractTitle(html) {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? stripTags(m[1]) : 'Security Headers scan';
}

function extractMainTablesAndHeadings(html) {
  let slice = html;
  const marker = /Scan results for/i.exec(html);
  if (marker) slice = html.slice(marker.index);

  const parts = [];
  const headingRe = /<h([1-3])[^>]*>([\s\S]*?)<\/h\1>/gi;
  const tableRe = /<table[^>]*>([\s\S]*?)<\/table>/gi;

  const headPositions = [];
  let hm;
  while ((hm = headingRe.exec(slice)) !== null) {
    headPositions.push({
      type: 'h',
      level: Number(hm[1]),
      html: hm[2],
      index: hm.index,
    });
  }
  const tablePositions = [];
  let tm;
  while ((tm = tableRe.exec(slice)) !== null) {
    tablePositions.push({ type: 't', html: tm[0], index: tm.index });
  }
  const merged = [...headPositions, ...tablePositions].sort(
    (a, b) => a.index - b.index
  );

  for (const item of merged) {
    if (item.type === 'h') {
      const text = stripTags(item.html);
      if (text && text.length < 200) {
        const hashes = '#'.repeat(Math.min(item.level + 1, 4));
        parts.push(`${hashes} ${text}\n\n`);
      }
    } else {
      const md = tableToMd(item.html);
      if (md) parts.push(md);
    }
  }

  let body = parts.join('');
  if (body.length < 80) {
    parts.length = 0;
    let t;
    const tr = /<table[^>]*>([\s\S]*?)<\/table>/gi;
    while ((t = tr.exec(html)) !== null) {
      const md = tableToMd(t[0]);
      if (md) parts.push(md);
    }
    body = `# ${extractTitle(html)}\n\n${parts.join('')}`;
  }
  return body;
}

const BROWSER_UA =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

function scanPageLooksValid(text) {
  return (
    text &&
    text.length > 500 &&
    SCAN_PAGE_OK.test(text) &&
    !/Attention Required|Cloudflare|Just a moment/i.test(text.slice(0, 2500))
  );
}

async function fetchSecurityHeadersScanPageDirect() {
  const res = await fetch(url, {
    headers: {
      'User-Agent': BROWSER_UA,
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-GB,en;q=0.9',
      Referer: 'https://securityheaders.com/',
      'Sec-Ch-Ua':
        '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Linux"',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'cross-site',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
    },
    redirect: 'follow',
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, text, relay: 'direct' };
}

/** AllOrigins JSON API — returns target body (good when direct scan is 403). */
async function fetchHtmlViaAllOrigins(targetUrl) {
  const relay = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;
  const res = await fetch(relay, {
    headers: { 'User-Agent': BROWSER_UA, Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`allorigins HTTP ${res.status}`);
  const j = await res.json();
  if (!j || typeof j.contents !== 'string')
    throw new Error('allorigins: empty contents');
  return j.contents;
}

/** Public CORS proxy — fallback for scan HTML. */
async function fetchHtmlViaCorsProxyIo(targetUrl) {
  const relay = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
  const res = await fetch(relay, {
    headers: {
      'User-Agent': BROWSER_UA,
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-GB,en;q=0.9',
    },
    redirect: 'follow',
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`corsproxy.io HTTP ${res.status}`);
  return text;
}

/** Codetabs GET proxy — another body relay if others fail or rate-limit. */
async function fetchHtmlViaCodetabs(targetUrl) {
  const relay = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`;
  const res = await fetch(relay, {
    headers: {
      'User-Agent': BROWSER_UA,
      Accept: 'text/html,application/xhtml+xml,*/*;q=0.8',
    },
    redirect: 'follow',
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`codetabs HTTP ${res.status}`);
  return text;
}

async function fetchSecurityHeadersScanPage() {
  const attempts = [['direct', () => fetchSecurityHeadersScanPageDirect()]];

  if (scanRelaysEnabled()) {
    attempts.push([
      'allorigins',
      async () => {
        const text = await fetchHtmlViaAllOrigins(url);
        return {
          ok: true,
          status: 200,
          text,
          relay: 'allorigins',
        };
      },
    ]);
    attempts.push([
      'corsproxy.io',
      async () => {
        const text = await fetchHtmlViaCorsProxyIo(url);
        return {
          ok: true,
          status: 200,
          text,
          relay: 'corsproxy.io',
        };
      },
    ]);
    attempts.push([
      'codetabs',
      async () => {
        const text = await fetchHtmlViaCodetabs(url);
        return {
          ok: true,
          status: 200,
          text,
          relay: 'codetabs',
        };
      },
    ]);
  }

  let last = null;
  for (const [name, fn] of attempts) {
    try {
      const r = await fn();
      last = r;
      if (scanPageLooksValid(r.text)) {
        console.log('securityheaders scan HTML ok via', r.relay || name, 'length', r.text.length);
        return r;
      }
      console.warn(
        'scan relay',
        r.relay || name,
        'not usable:',
        r.status,
        'body',
        r.text ? r.text.length : 0
      );
    } catch (e) {
      console.warn('scan relay', name, 'error:', e && e.message ? e.message : e);
    }
  }
  if (last) return last;
  return { ok: false, status: 0, text: '', relay: 'none' };
}

function headersMarkdownTable(headers) {
  const entries = [];
  headers.forEach((value, key) => entries.push([key, String(value)]));
  entries.sort((a, b) => a[0].localeCompare(b[0]));
  const esc = (s) => String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ');
  let out = '| Header | Value |\n| --- | --- |\n';
  for (const [k, v] of entries) {
    out += `| ${esc(k)} | ${esc(v)} |\n`;
  }
  return out + '\n';
}

async function fetchLiveSiteHeadersOnce(siteUrl) {
  const res = await fetch(siteUrl, {
    method: 'GET',
    redirect: 'follow',
    headers: {
      'User-Agent': BROWSER_UA,
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-GB,en;q=0.9',
      'Sec-Ch-Ua':
        '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Linux"',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
    },
  });
  const text = await res.text();
  return {
    ok: res.ok,
    status: res.status,
    finalUrl: res.url,
    headers: res.headers,
    bodySampleLen: text.length,
  };
}

/** Try several URLs (e.g. apex + www); prefer first 2xx, else first response with headers. */
async function fetchLiveSiteHeadersChain(urls) {
  let fallback = null;
  for (const siteUrl of urls) {
    try {
      const live = await fetchLiveSiteHeadersOnce(siteUrl);
      if (live.ok) return { ...live, triedUrl: siteUrl };
      if (!fallback) fallback = { ...live, triedUrl: siteUrl };
    } catch (e) {
      console.warn('live fetch', siteUrl, e && e.message ? e.message : e);
    }
  }
  if (fallback) return fallback;
  throw new Error('All live URL fetches failed');
}

async function loadHtmlFromFile() {
  const fromFile = process.env.SECURITY_HEADERS_HTML_FILE;
  if (!fromFile) return null;
  if (!fs.existsSync(fromFile)) return null;
  const html = fs.readFileSync(fromFile, 'utf8');
  console.log('Using HTML from', fromFile, `(${html.length} bytes)`);
  return html;
}

async function main() {
  const run = process.env.GITHUB_RUN_NUMBER || 'local';
  const sha = (process.env.GITHUB_SHA || 'local').slice(0, 7);
  const runId = process.env.GITHUB_RUN_ID || '';

  let html = await loadHtmlFromFile();
  let remoteStatus = null;
  let remoteScanBlocked = false;
  let scanRelay = '';

  if (!html) {
    console.log('Fetching securityheaders.com scan page…');
    const r = await fetchSecurityHeadersScanPage();
    remoteStatus = r.status;
    scanRelay = r.relay || '';
    if (r.text && scanPageLooksValid(r.text)) {
      html = r.text;
      remoteScanBlocked = false;
      console.log(
        'remote scan HTML ok via',
        scanRelay || 'unknown',
        'length',
        html.length
      );
    } else {
      remoteScanBlocked = true;
      console.warn(
        'securityheaders.com scan not usable:',
        r.status,
        'body length',
        r.text ? r.text.length : 0
      );
    }
  }

  let md = `---\n`;
  md += `source: securityheaders.com\n`;
  md += `scan_url: ${JSON.stringify(url)}\n`;
  md += `generated_utc: ${new Date().toISOString()}\n`;
  md += `github_run_number: ${run}\n`;
  md += `github_sha: ${sha}\n`;
  if (runId) md += `github_run_id: ${runId}\n`;
  if (remoteStatus != null) md += `securityheaders_http_status: ${remoteStatus}\n`;
  if (scanRelay && scanRelay !== 'none')
    md += `securityheaders_scan_relay: ${scanRelay}\n`;
  if (remoteScanBlocked) md += `securityheaders_scan: blocked_or_unavailable\n`;
  md += `---\n\n`;

  if (html && !remoteScanBlocked) {
    const title = extractTitle(html);
    const summary = extractMainTablesAndHeadings(html);
    md += `# ${title}\n\n`;
    md += `**Fetched:** ${url}\n`;
    if (scanRelay && scanRelay !== 'direct') {
      md += `  \n**Scan HTML relay:** \`${scanRelay}\` (third party retrieved the scan page HTML for parsing.)\n`;
    }
    md += `\n`;
    md += summary;
    if (md.length < 200) {
      md += `\n\n---\n\n*Fallback: minimal parse. Raw length ${html.length} bytes.*\n`;
    }
  } else {
    md += `# Security headers report (CI)\n\n`;
    if (remoteScanBlocked) {
      md += `The **[securityheaders.com](https://securityheaders.com/)** scan page was not usable after **direct** fetch and optional **relay** attempts (\`allorigins\`, \`corsproxy.io\`). Datacenter IPs are often blocked. Browser-only proxy homepages (e.g. Proxyium) are not used — they have no stable API for CI.\n\n`;
      md += `Below: **response headers** from the live site URL(s) (\`SECURITY_HEADERS_LIVE_URLS\` / \`SECURITY_HEADERS_FALLBACK_SITE\`), fetched with a **browser-like** User-Agent. **HTTP 403** may still include useful \`Content-Security-Policy\`, \`Strict-Transport-Security\`, etc., when Cloudflare serves a challenge page.\n\n`;
    }
    md += `## Live site response headers\n\n`;
    const liveUrls = parseUrlList(
      fallbackSite,
      process.env.SECURITY_HEADERS_LIVE_URLS
    );
    md += `**URLs tried (in order):** ${liveUrls.map((u) => `\`${u}\``).join(', ')}\n\n`;
    try {
      const live = await fetchLiveSiteHeadersChain(liveUrls);
      md += `**Chosen URL:** ${live.triedUrl}  \n`;
      md += `**HTTP status:** ${live.status}  \n`;
      md += `**Final URL:** ${live.finalUrl}  \n`;
      md += `**Response body length (bytes):** ${live.bodySampleLen}\n\n`;
      md += headersMarkdownTable(live.headers);
    } catch (e) {
      md += `*Failed to fetch live site: ${e && e.message ? e.message : String(e)}*\n`;
    }
  }

  fs.mkdirSync(path.dirname(outLatest), { recursive: true });
  fs.writeFileSync(outLatest, md, 'utf8');
  console.log('Wrote', outLatest, `(${md.length} chars)`);

  if (outRun) {
    fs.mkdirSync(path.dirname(outRun), { recursive: true });
    fs.writeFileSync(outRun, md, 'utf8');
    console.log('Wrote', outRun);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
