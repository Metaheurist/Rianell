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

/**
 * Stream NDJSON tokens from Ollama /api/generate.
 * @param {{ model: string, prompt: string, system?: string, numPredict?: number, numCtx?: number, onChunk?: (s: string, full: string) => void, signal?: AbortSignal }} opts
 */
export async function ollamaGenerateStream({
  model,
  prompt,
  system,
  numPredict = 1024,
  numCtx = 8192,
  onChunk,
  signal,
}) {
  const res = await fetch(`${HOST}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt,
      system: system || undefined,
      stream: true,
      options: { num_predict: numPredict, num_ctx: numCtx },
    }),
    signal,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`ollama generate ${res.status}: ${body.slice(0, 200)}`);
  }
  if (!res.body) {
    const data = await res.json();
    const text = data.response || '';
    if (onChunk) onChunk(text, text);
    return text;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  let full = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop() || '';
    for (const line of lines) {
      const t = line.trim();
      if (!t) continue;
      let obj;
      try { obj = JSON.parse(t); } catch { continue; }
      const piece = obj.response || '';
      if (piece) {
        full += piece;
        if (onChunk) onChunk(piece, full);
      }
      if (obj.done) return full;
    }
  }
  return full;
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
