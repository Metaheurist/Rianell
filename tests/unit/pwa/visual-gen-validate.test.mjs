import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

function stripFences(text) {
  let t = String(text || '').trim();
  t = t.replace(/^```(?:svg|xml|html|css|javascript|js)?\s*/i, '');
  t = t.replace(/\s*```$/i, '');
  return t.trim();
}

function countTopLevelGraphics(text) {
  const svg = (text.match(/<svg\b/gi) || []).length;
  const symbol = (text.match(/<symbol\b/gi) || []).length;
  const kf = (text.match(/@keyframes\b/gi) || []).length;
  if (kf > 0) return kf;
  return Math.max(svg, symbol, /<(?:g|path|circle|rect)\b/i.test(text) ? 1 : 0);
}

function validateOutput(entry, raw) {
  const text = stripFences(raw);
  if (!text || text.length < 8) return { ok: false, reason: 'empty' };
  if (/<script[\s>]/i.test(text) || /\bon\w+\s*=/i.test(text)) {
    return { ok: false, reason: 'script/handler forbidden' };
  }
  const tops = countTopLevelGraphics(text);
  if (tops > 1) return { ok: false, reason: `multi-unit response (${tops})` };
  if (entry.promptMode === 'single-anim') {
    return { ok: true, text };
  }
  const hasShape = /<(?:svg|symbol|g|path|circle|rect|ellipse|polygon|line|polyline)\b/i.test(text);
  if (!hasShape) return { ok: false, reason: 'no svg shapes' };
  return { ok: true, text };
}

describe('visual-gen validators', () => {
  it('accepts a single SVG fragment', () => {
    const r = validateOutput(
      { promptMode: 'single-svg' },
      '<g><path d="M12 4v16" stroke="currentColor" fill="none"/></g>'
    );
    assert.equal(r.ok, true);
  });

  it('rejects multi-svg batches', () => {
    const r = validateOutput(
      { promptMode: 'single-svg' },
      '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/></svg>\n<svg viewBox="0 0 24 24"><rect width="10" height="10"/></svg>'
    );
    assert.equal(r.ok, false);
    assert.match(r.reason, /multi-unit/);
  });

  it('rejects script tags', () => {
    const r = validateOutput(
      { promptMode: 'single-svg' },
      '<g><script>alert(1)</script><circle cx="1" cy="1" r="1"/></g>'
    );
    assert.equal(r.ok, false);
  });

  it('strips markdown fences', () => {
    const r = validateOutput(
      { promptMode: 'single-svg' },
      '```svg\n<path d="M1 1"/>\n```'
    );
    assert.equal(r.ok, true);
    assert.ok(!r.text.includes('```'));
  });
});
