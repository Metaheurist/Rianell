const HOST = (process.env.OLLAMA_HOST || 'http://localhost:11434').replace(/\/$/, '');

export async function ollamaTags() {
  const res = await fetch(`${HOST}/api/tags`, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error(`ollama tags ${res.status}`);
  return res.json();
}

export async function ollamaPs() {
  try {
    const res = await fetch(`${HOST}/api/ps`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return { models: [] };
    return res.json();
  } catch {
    return { models: [] };
  }
}

export async function ollamaGenerate({ model, prompt, system, numPredict = 1024, numCtx = 8192 }) {
  const res = await fetch(`${HOST}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt,
      system: system || undefined,
      stream: false,
      options: { num_predict: numPredict, num_ctx: numCtx },
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`ollama generate ${res.status}: ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  return data.response || '';
}

/** Best-effort unload via keep_alive 0 */
export async function ollamaUnload(model) {
  if (!model) return;
  try {
    await fetch(`${HOST}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, keep_alive: 0, prompt: '' }),
    });
  } catch {
    /* ignore */
  }
}

export { HOST as OLLAMA_HOST };
