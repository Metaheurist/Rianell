#!/usr/bin/env node
import { ollamaGenerate, ollamaUnload, ollamaPs } from './ollama-client.mjs';

const modelArg = process.argv.find((a) => a.startsWith('--model='));
const model = modelArg ? modelArg.slice('--model='.length) : '';
const load = process.argv.includes('--load');
const unload = process.argv.includes('--unload');

try {
  if (unload) {
    await ollamaUnload(model);
    console.log(JSON.stringify({ action: 'unload', model, ok: true }));
    process.exit(0);
  }
  if (load) {
    if (!model) throw new Error('model required');
    await ollamaGenerate({ model, prompt: 'ok', numPredict: 1, numCtx: 512 });
    const ps = await ollamaPs();
    console.log(JSON.stringify({ action: 'load', model, ok: true, ps }));
    process.exit(0);
  }
  console.log(JSON.stringify({ ok: false, error: 'use --load or --unload with --model=' }));
  process.exit(1);
} catch (e) {
  console.log(JSON.stringify({ ok: false, error: String(e.message || e) }));
  process.exit(1);
}
