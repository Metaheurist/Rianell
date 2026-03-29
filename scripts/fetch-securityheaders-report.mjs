#!/usr/bin/env node
/**
 * Fetches https://securityheaders.com/?q=... and writes Markdown under security/.
 * Used by CI after GitHub Pages deploy. Env:
 *   SECURITY_HEADERS_URL — full scan URL (default: rianell.com with followRedirects)
 *   SECURITY_HEADERS_HTML_FILE — if set, read HTML from this path instead of fetch (e.g. curl output in CI)
 *   OUT_LATEST — default security/securityheaders-rianell.com.md
 *   OUT_RUN — optional second file (e.g. per-run archive)
 *   GITHUB_RUN_NUMBER, GITHUB_SHA, GITHUB_RUN_ID — optional frontmatter
 */
import fs from 'fs';
import path from 'path';

const DEFAULT_URL =
  'https://securityheaders.com/?q=rianell.com&followRedirects=on';

const url = process.env.SECURITY_HEADERS_URL || DEFAULT_URL;
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
  /** Prefer content after "Scan results" banner; fallback: body tables */
  let slice = html;
  const marker = /Scan results for/i.exec(html);
  if (marker) slice = html.slice(marker.index);

  const parts = [];
  const headingRe = /<h([1-3])[^>]*>([\s\S]*?)<\/h\1>/gi;
  const tableRe = /<table[^>]*>([\s\S]*?)<\/table>/gi;

  let last = 0;
  const chunks = [];
  let hm;
  const headPositions = [];
  while ((hm = headingRe.exec(slice)) !== null) {
    headPositions.push({
      type: 'h',
      level: Number(hm[1]),
      html: hm[2],
      index: hm.index,
    });
  }
  let tm;
  const tablePositions = [];
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

  /** Footer noise: drop lines that are only navigation */
  let body = parts.join('');
  if (body.length < 80) {
    /** Fallback: all tables from full page */
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

async function loadHtml() {
  const fromFile = process.env.SECURITY_HEADERS_HTML_FILE;
  if (fromFile) {
    const html = fs.readFileSync(fromFile, 'utf8');
    console.log('Using HTML from', fromFile, `(${html.length} bytes)`);
    return html;
  }
  const ua =
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
  const res = await fetch(url, {
    headers: {
      'User-Agent': ua,
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-GB,en;q=0.9',
      Referer: 'https://securityheaders.com/',
    },
    redirect: 'follow',
  });
  if (!res.ok) {
    console.error('fetch failed:', res.status, res.statusText);
    process.exit(1);
  }
  return res.text();
}

async function main() {
  const html = await loadHtml();

  const title = extractTitle(html);
  const summary = extractMainTablesAndHeadings(html);

  const run = process.env.GITHUB_RUN_NUMBER || 'local';
  const sha = (process.env.GITHUB_SHA || 'local').slice(0, 7);
  const runId = process.env.GITHUB_RUN_ID || '';

  let md = `---\n`;
  md += `source: securityheaders.com\n`;
  md += `scan_url: ${JSON.stringify(url)}\n`;
  md += `generated_utc: ${new Date().toISOString()}\n`;
  md += `github_run_number: ${run}\n`;
  md += `github_sha: ${sha}\n`;
  if (runId) md += `github_run_id: ${runId}\n`;
  md += `---\n\n`;
  md += `# ${title}\n\n`;
  md += `**Fetched:** ${url}\n\n`;
  md += summary;

  if (md.length < 200) {
    md += `\n\n---\n\n*Fallback: minimal parse. Raw length ${html.length} bytes.*\n`;
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
