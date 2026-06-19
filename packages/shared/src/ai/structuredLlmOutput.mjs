/** N5 — parse and validate `{ insights[], actions[], confidence }` from LLM text. */
export function parseStructuredLlmOutput(raw) {
  if (!raw || typeof raw !== 'string') return null;
  let parsed;
  try {
    const trimmed = raw.trim();
    const match = trimmed.match(/\{[\s\S]*\}/);
    const jsonStr = match ? match[0] : trimmed;
    parsed = JSON.parse(jsonStr);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;

  const insights = Array.isArray(parsed.insights)
    ? parsed.insights
        .filter((x) => typeof x === 'string')
        .map((x) => x.trim())
        .filter(Boolean)
        .slice(0, 8)
    : [];
  const actions = Array.isArray(parsed.actions)
    ? parsed.actions
        .filter((x) => typeof x === 'string')
        .map((x) => x.trim())
        .filter(Boolean)
        .slice(0, 6)
    : [];
  let confidence = parsed.confidence;
  if (typeof confidence === 'string') confidence = parseFloat(confidence);
  if (!Number.isFinite(confidence)) confidence = insights.length ? 0.65 : 0.45;
  confidence = Math.max(0, Math.min(1, confidence));

  if (!insights.length && !actions.length) return null;
  return { insights, actions, confidence };
}

export function formatStructuredLlmOutput(structured) {
  if (!structured) return '';
  const lines = [];
  if (structured.insights?.length) {
    lines.push('Insights:');
    structured.insights.forEach((line) => lines.push(`• ${line}`));
  }
  if (structured.actions?.length) {
    lines.push('Actions:');
    structured.actions.forEach((line) => lines.push(`• ${line}`));
  }
  if (structured.confidence != null) {
    lines.push(`Confidence: ${Math.round(structured.confidence * 100)}%`);
  }
  return lines.join('\n');
}
