export function isHuggingFaceModelsRequest(url) {
  let parsed;
  try {
    parsed = new URL(String(url || ''));
  } catch {
    return false;
  }
  if (parsed.protocol !== 'https:') return false;
  const host = parsed.hostname.toLowerCase();
  return host === 'huggingface.co' || host.endsWith('.hf.co');
}

export function isSupabaseLlmModelsRequest(url) {
  return /\/storage\/v1\/object\/public\/llm-models\//i.test(String(url || ''));
}

