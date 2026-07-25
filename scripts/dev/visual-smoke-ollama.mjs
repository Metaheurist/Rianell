#!/usr/bin/env node
/** Smoke-test one Ollama SVG generate against qwen3.6:35b (Qwen3.6-35B-A3B). */
import { Agent, setGlobalDispatcher } from 'undici';

setGlobalDispatcher(new Agent({
  headersTimeout: 30 * 60 * 1000,
  bodyTimeout: 30 * 60 * 1000,
  connectTimeout: 60 * 1000,
}));

const HOST = (process.env.OLLAMA_HOST || 'http://localhost:11434').replace(/\/$/, '');
const MODEL = process.env.OLLAMA_MODEL || 'qwen3.6:35b';

const prompt = [
  '/no_think',
  'Return ONLY this SVG markup with no markdown fences:',
  '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor"/></svg>',
].join('\n');

const t0 = Date.now();
const res = await fetch(`${HOST}/api/generate`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: MODEL,
    prompt,
    stream: false,
    keep_alive: '60m',
    options: { num_predict: 256, temperature: 0.2, num_ctx: 4096 },
  }),
});
if (!res.ok) {
  console.error(`[visual-smoke] HTTP ${res.status}`);
  process.exit(1);
}
const data = await res.json();
const text = String(data.response || '').trim() || String(data.thinking || '').trim();
const ms = Date.now() - t0;
console.log(`[visual-smoke] OK model=${MODEL} ms=${ms} chars=${text.length}`);
console.log(text.slice(0, 240));
if (!/<svg[\s>]|<circle[\s>]/.test(text)) {
  console.error('[visual-smoke] response missing SVG');
  process.exit(1);
}
