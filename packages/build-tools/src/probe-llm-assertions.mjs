export function isHuggingFaceModelsRequest(url) {
  const u = String(url || '');
  return (
    u.includes('https://huggingface.co/') ||
    /https:\/\/[^/]+\.hf\.co\//i.test(u) ||
    /https:\/\/[^/]*xethub\.hf\.co\//i.test(u)
  );
}

export function isSupabaseLlmModelsRequest(url) {
  return /\/storage\/v1\/object\/public\/llm-models\//i.test(String(url || ''));
}

