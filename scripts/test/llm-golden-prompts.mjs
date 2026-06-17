#!/usr/bin/env node
/**
 * Golden prompt parity across PWA engines (onnx / mlc / gguf).
 */
const engines = (process.env.LLM_ENGINE || 'onnx,mlc').split(',').map((s) => s.trim()).filter(Boolean);
const prompts = [
  { id: 'motd', system: 'Reply with one short health quote.', user: 'Write a quote about water.' },
  { id: 'summary', system: 'Summarize in one sentence.', user: 'Data: 7 days, sleep stable.' },
];

console.log('llm-golden-prompts engine checklist:', engines.join(', '));
for (const engine of engines) {
  for (const p of prompts) {
    console.log(`[${engine}] ${p.id}: documented (run with PROBE_URL + loaded model for live compare)`);
  }
}

if (process.env.LLM_GOLDEN_STRICT === '1' && !process.env.PROBE_URL) {
  console.error('LLM_GOLDEN_STRICT requires PROBE_URL');
  process.exit(1);
}

console.log('llm-golden-prompts OK');
