/**
 * Shared TranslateGemma / Ollama translation helpers.
 *
 * Extracted from scripts/i18n/ollama-translate-gaps.mjs so both the locale-pack
 * gap filler and the SEO-page translator (scripts/i18n/translate-seo-pages.mjs)
 * use the exact same prompt, placeholder/glossary protection, output cleaning
 * and validation logic. No behavior change versus the original inline helpers.
 */
import { protectGlossary, restoreGlossary } from '@rianell/build-tools/i18n-glossary';

export const PLACEHOLDER_RE = /\{[^}]+\}/g;
export const HTML_RE = /<\/?[a-z][\s\S]*?>/i;
export const AR_RE = /[\u0600-\u06FF\u0750-\u077F]/;
export const HE_RE = /[\u0590-\u05FF]/;

// Locales where a Latin-script English fragment indicates a bad ("Frankenstein") translation.
export const FRAGMENT_CHECK = new Set([
  'pt-BR', 'fr-FR', 'de-DE', 'es-ES', 'it-IT', 'nl-NL', 'pl-PL', 'pt-PT', 'ga', 'ar', 'he',
]);
export const ENG_FRAG = /\b(the|and|Entry|Log|Save|Exercise|Install|optional|return to|with the|your|this|from|for|to|add|notes|data|export|disabled)\b/i;

/** Language metadata for the TranslateGemma prompt, keyed by BCP-47 locale id. */
export const LOCALE_TO_TG = {
  'pt-BR': { name: 'Portuguese', code: 'pt-BR' },
  'pt-PT': { name: 'Portuguese', code: 'pt-PT' },
  'fr-FR': { name: 'French', code: 'fr' },
  'de-DE': { name: 'German', code: 'de' },
  'es-ES': { name: 'Spanish', code: 'es' },
  'it-IT': { name: 'Italian', code: 'it' },
  'nl-NL': { name: 'Dutch', code: 'nl' },
  'pl-PL': { name: 'Polish', code: 'pl' },
  ga: { name: 'Irish', code: 'ga' },
  ar: { name: 'Arabic', code: 'ar' },
  he: { name: 'Hebrew', code: 'he' },
};

export function placeholderMultiset(text) {
  const list = (text.match(PLACEHOLDER_RE) || []).slice().sort();
  return list.join('\u0001');
}

/** Mask {curly} placeholders so the model cannot translate the token names. */
export function protectPlaceholders(text) {
  const map = [];
  const out = text.replace(PLACEHOLDER_RE, (m) => {
    const ph = `__PH${map.length}__`;
    map.push({ ph, val: m });
    return ph;
  });
  return { text: out, map };
}

export function restorePlaceholders(text, map) {
  let out = text;
  for (const { ph, val } of map) out = out.split(ph).join(val);
  return out;
}

export function stripWrappingQuotes(src, out) {
  const pairs = [['"', '"'], ["'", "'"], ['`', '`'], ['«', '»'], ['“', '”']];
  let s = out.trim();
  for (const [open, close] of pairs) {
    if (s.length >= 2 && s.startsWith(open) && s.endsWith(close) && !(src.startsWith(open) && src.endsWith(close))) {
      s = s.slice(open.length, s.length - close.length).trim();
      break;
    }
  }
  return s;
}

/**
 * TranslateGemma often returns several options for a short/ambiguous UI label
 * (e.g. "Nourriture / Alimentation"). For UI microcopy we keep the first option —
 * but only when the English source has no such separator.
 */
export function pickFirstAlternative(src, out) {
  const sep = /\s[/;|]\s/;
  if (sep.test(out) && !sep.test(src)) {
    const first = out.split(sep)[0].trim();
    if (first) return first;
  }
  return out;
}

/** Drop a trailing sentence punctuation the model added when the source had none. */
export function stripAddedTrailingPunct(src, out) {
  const s = src.trim();
  const o = out.trim();
  if (!/[.!?…]$/.test(s) && /[.!?]+$/.test(o)) {
    return o.replace(/\s*[.!?]+$/, '').trim();
  }
  return o;
}

export function cleanOutput(src, raw) {
  let s = String(raw || '').trim();
  if (!/\n/.test(src) && /\n/.test(s)) {
    s = s.split('\n').map((l) => l.trim()).filter(Boolean)[0] || s;
  }
  s = s.replace(/^(translation|traducción|traduction|übersetzung|tradução|traduzione|vertaling|tłumaczenie|aistriúchán)\s*[:：]\s*/i, '');
  s = stripWrappingQuotes(src, s);
  s = pickFirstAlternative(src, s);
  s = stripAddedTrailingPunct(src, s);
  return s.trim();
}

export function buildPrompt(src, meta) {
  const { name, code } = meta;
  return (
    `You are a professional English (en) to ${name} (${code}) translator. ` +
    `Your goal is to accurately convey the meaning and nuances of the original English text ` +
    `while adhering to ${name} grammar, vocabulary, and cultural sensitivities.\n` +
    `Produce only the ${name} translation, without any additional explanations or commentary. ` +
    `Please translate the following English text into ${name}:\n\n\n` +
    `${src}\n`
  );
}

export async function ollamaGenerate({ host, model, prompt }) {
  const res = await fetch(`${host}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      keep_alive: '30m',
      options: { temperature: 0, num_predict: 512 },
    }),
  });
  if (!res.ok) throw new Error(`Ollama HTTP ${res.status}: ${await res.text().catch(() => '')}`);
  const data = await res.json();
  if (typeof data?.response !== 'string') throw new Error('Ollama: no response field');
  return data.response;
}

/** Validate a candidate translation. Returns {ok, reason}. */
export function validate(locale, src, candidate) {
  if (!candidate || !candidate.trim()) return { ok: false, reason: 'empty' };
  if (candidate.trim() === src.trim()) return { ok: false, reason: 'identical-to-en' };
  if (placeholderMultiset(candidate) !== placeholderMultiset(src)) return { ok: false, reason: 'placeholder-mismatch' };
  if (HTML_RE.test(candidate)) return { ok: false, reason: 'html' };
  const letters = candidate.replace(PLACEHOLDER_RE, ' ');
  if (locale === 'ar' && !AR_RE.test(letters)) return { ok: false, reason: 'not-arabic-script' };
  if (locale === 'he' && !HE_RE.test(letters)) return { ok: false, reason: 'not-hebrew-script' };
  return { ok: true, reason: '' };
}

/** Soft mixed-language signal (retry once, but do not hard-reject). */
export function hasEnglishFragment(locale, candidate) {
  if (!FRAGMENT_CHECK.has(locale)) return false;
  return ENG_FRAG.test(candidate);
}

/**
 * Translate one English string into `locale`, protecting glossary terms and
 * {placeholders}, cleaning and validating output. Retries once on soft signals.
 * @returns {Promise<{value: string|null, status: 'ok'|'kept-soft'|'failed', reason: string}>}
 */
export async function translateOne(locale, meta, src, { host, model }) {
  const { text: gText, placeholders: gloss } = protectGlossary(src);
  const { text: maskedSrc, map: phMap } = protectPlaceholders(gText);
  let best = null;
  let lastReason = 'unknown';
  for (let attempt = 0; attempt < 2; attempt += 1) {
    let raw;
    try {
      raw = await ollamaGenerate({ host, model, prompt: buildPrompt(maskedSrc, meta) });
    } catch (err) {
      if (attempt === 1) throw err;
      await new Promise((r) => setTimeout(r, 500));
      continue;
    }
    let candidate = cleanOutput(src, raw);
    const lostGloss = gloss.some((p) => !candidate.includes(p.ph));
    const lostPh = phMap.some((p) => !candidate.includes(p.ph));
    candidate = restorePlaceholders(candidate, phMap);
    candidate = restoreGlossary(candidate, gloss);
    const check = validate(locale, src, candidate);
    if (check.ok && !hasEnglishFragment(locale, candidate) && !lostGloss && !lostPh) {
      return { value: candidate, status: 'ok', reason: '' };
    }
    lastReason = lostPh
      ? 'placeholder-lost'
      : lostGloss
        ? 'glossary-lost'
        : !check.ok
          ? check.reason
          : 'english-fragment';
    if (check.ok && !lostPh && !lostGloss && !best) best = candidate;
  }
  if (best) return { value: best, status: 'kept-soft', reason: lastReason };
  return { value: null, status: 'failed', reason: lastReason };
}
