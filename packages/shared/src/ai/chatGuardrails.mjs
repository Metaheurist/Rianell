/**
 * Deterministic, model-agnostic guardrails for the on-device "Ask Rianell" chat.
 *
 * The chat runs entirely on-device (Qwen2.5 via Transformers.js / WebLLM),
 * so there is no provider-side moderation and prompt instructions alone can be
 * jailbroken. These checks run in plain code before and after inference, so they
 * cannot be bypassed by prompt injection:
 *   1. NSFW/explicit content is blocked on both the user message and the model reply.
 *   2. Off-topic messages (nothing about the user's own health/wellbeing data) are
 *      redirected before any model call happens.
 *
 * Enforcement is intentionally independent of the LLM output — the model never
 * gets a chance to "argue" its way past these gates.
 */

/**
 * Explicit / NSFW content across shipped locales (en, de, es, fr, it, nl, pl, pt).
 * Kept deliberately broad on high-signal sexual/pornographic terms plus common
 * jailbreak framings ("write an erotic story", "roleplay as ...", "pretend you are").
 * Matching is case-insensitive and Unicode-aware.
 */
export const NSFW_RE =
  /\b(?:n[s\s]*f[s\s]*w|porn\w*|hardcore|x[\s-]?rated|xxx|erotica?|erotic|eroti(?:k|que|co|smo|sch)\w*|sexual|sexually|sexo|sexe|sesso|seks|sexting|dirty\s*talk|nude|nudes|nudity|naked|desnud[oa]|nackt|nu(?:e|es)|blowjob|handjob|cum(?:shot|ming)?|orgasm|masturbat(?:e|ion|ing)|fuck(?:ing|ed)?|f[\*u]ck|dick|penis|pene|vagina|vulva|clit(?:oris)?|boobs?|breasts?|tits?|nipples?|anal|anus|butt[\s-]?plug|dildo|fetish|fetichis|bdsm|bondage|hentai|incest|bestiality|zoophil|rape|raping|molest|pedophil|paedophil|child\s*porn|cp\b|lolic?on|shota|onlyfans|camgirl|escort\s*service|prostitut|whore|slut|milf|gangbang|threesome|deepthroat|creampie|coom)\b/iu;

/**
 * Framing that tries to steer the assistant into explicit output regardless of topic.
 * Combined with NSFW_RE so "write me a steamy sex scene" or "roleplay as my lover"
 * is caught even when a single explicit token is obfuscated.
 */
const NSFW_INTENT_RE =
  /\b(?:(?:write|tell|generate|make|create|describe|roleplay|role[\s-]?play|act\s+as|pretend\s+you|imagine\s+you)\b[\s\S]{0,40}\b(?:sex|sexual|erotic|erotica|steamy|naughty|kinky|nsfw|adult|explicit|lewd|dirty\s+talk|intimate\s+scene|smut))|(?:\b(?:steamy|explicit|erotic|sexual|kinky|naughty)\b[\s\S]{0,20}\b(?:story|scene|fanfic|fantasy|roleplay))/iu;

/**
 * Broad wellness / health-log lexicon. A message is considered in-scope when it
 * references any of these concepts. English-primary; a compact multilingual core
 * is included so non-English health questions are not over-blocked, and callers
 * may pass additional locale keywords via `scopeKeywords`.
 */
export const HEALTH_SCOPE_RE =
  /\b(?:health|healthy|wellbeing|well[\s-]?being|wellness|symptom|symptoms|pain|ache|aches|aching|hurt|sore|flare|flares|flare[\s-]?up|fatigue|tired|tiredness|exhaust|energy|energ|sleep|slept|insomnia|rest|rested|nap|mood|moods|feeling|feelings|emotion|emotional|anxious|anxiety|stress|stressed|stressor|depress|mental|mind|calm|steps|walk|walking|exercise|workout|activ|movement|move|hydrat|water|drink|drinking|diet|food|eat|eating|meal|meals|nutrition|weight|bmi|medication|medicine|meds|dose|dosage|pill|treatment|therapy|therap|flareday|swelling|stiffness|mobility|joint|joints|heart|bpm|pulse|blood\s*pressure|vitals?|cycle|period|menstru|hormone|breath|breathing|log|logs|logged|logging|track|tracked|tracking|entry|entries|journal|diary|pattern|patterns|trend|trends|correlat|average|my\s+(?:data|logs?|health|sleep|mood|energy|symptoms?|week|day|days|entries|numbers?)|good\s+days?|bad\s+days?|goal|goals|habit|habits|recovery|recover|wearable|fitbit|apple\s*health)\b/iu;

function normalize(text) {
  return String(text == null ? '' : text)
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * True when text contains explicit / NSFW content or clear intent to elicit it.
 * Used for BOTH the user message and the model reply.
 * @param {string} text
 * @returns {boolean}
 */
export function isNsfwText(text) {
  const t = normalize(text);
  if (!t) return false;
  return NSFW_RE.test(t) || NSFW_INTENT_RE.test(t);
}

/**
 * True when a message references the user's own health / wellbeing data.
 * @param {string} message
 * @param {string[]} [scopeKeywords] optional locale-specific extra keywords
 * @returns {boolean}
 */
export function isHealthInScope(message, scopeKeywords) {
  const t = normalize(message);
  if (!t) return false;
  if (HEALTH_SCOPE_RE.test(t)) return true;
  if (Array.isArray(scopeKeywords) && scopeKeywords.length) {
    return scopeKeywords.some((kw) => {
      const k = normalize(kw);
      return k && t.includes(k);
    });
  }
  return false;
}

/**
 * Classify a user message for the health chat gate.
 * NSFW is checked first (so an off-topic NSFW request is reported as NSFW), then
 * health-scope. A message with no health-scope signal is treated as off-topic.
 *
 * @param {string} message
 * @param {{ locale?: string, scopeKeywords?: string[] }} [options]
 * @returns {{ allowed: boolean, category: 'ok' | 'nsfw' | 'offtopic' }}
 */
export function classifyHealthChatMessage(message, options = {}) {
  const { scopeKeywords } = options || {};
  const raw = String(message == null ? '' : message).trim();
  if (!raw) return { allowed: false, category: 'offtopic' };
  if (isNsfwText(raw)) return { allowed: false, category: 'nsfw' };
  if (!isHealthInScope(raw, scopeKeywords)) {
    return { allowed: false, category: 'offtopic' };
  }
  return { allowed: true, category: 'ok' };
}

/**
 * Defense-in-depth output gate for the model runner. Returns the canned blocked
 * message when the reply trips the NSFW filter, otherwise the reply unchanged.
 * @param {string} reply
 * @param {string} blockedMessage
 * @returns {string}
 */
export function enforceHealthChatReply(reply, blockedMessage) {
  if (isNsfwText(reply)) return blockedMessage || '';
  return reply;
}
