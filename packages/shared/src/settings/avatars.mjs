/** Preset profile avatars — abstract inclusive entities (graphics portfolio). */
export const PROFILE_AVATAR_IDS = [
  'voidorb', 'tidewarden', 'leafcircuit', 'prismcore', 'moonthread',
  'emberveil', 'riftecho', 'stonebloom', 'glasswave', 'ashspiral',
  'coralnode', 'starlace', 'mistveil', 'thornloop', 'sunwarden',
  'duskmantle', 'ironbloom', 'vortexseed', 'lumenshard', 'driftmoss',
];

/** Prefix for procedurally generated companions (`gen:<seed>`). */
export const GENERATED_AVATAR_PREFIX = 'gen:';

/** Word parts for deterministic random companion names. */
export const AVATAR_NAME_PREFIXES = [
  'Sun', 'Moon', 'Star', 'Iron', 'Glass', 'Mist', 'Dusk', 'Dawn', 'Stone', 'Leaf',
  'Coral', 'Ash', 'Ember', 'Tide', 'Storm', 'Cloud', 'Frost', 'Wild', 'Velvet', 'Bright',
  'Quiet', 'Swift', 'Gentle', 'Bold', 'Pale', 'Deep', 'Soft', 'Kind', 'Calm', 'Warm',
];

export const AVATAR_NAME_SUFFIXES = [
  'Warden', 'Mantle', 'Bloom', 'Shard', 'Orb', 'Thread', 'Veil', 'Echo', 'Spiral', 'Node',
  'Lace', 'Loop', 'Seed', 'Moss', 'Wave', 'Core', 'Guard', 'Spark', 'Drift', 'Glimmer',
  'Hollow', 'Grove', 'Haven', 'Pulse', 'Wisp', 'Crown', 'Root', 'Gleam', 'Shade', 'Trail',
];

/** Legacy icon IDs → nearest new avatar for cloud restore. */
const LEGACY_AVATAR_MAP = {
  leaf: 'leafcircuit',
  heart: 'voidorb',
  star: 'starlace',
  sun: 'sunwarden',
  pulse: 'riftecho',
  shield: 'stonebloom',
};

export const USER_VIBE_IDS = ['calm', 'energy', 'nature', 'clinical', 'dark'];

/** @param {string} seed */
export function hashAvatarSeed(seed) {
  const s = String(seed || '');
  let h = 1779033703 ^ s.length;
  for (let i = 0; i < s.length; i += 1) {
    h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

/** @param {number} seedNum */
export function createMulberry32(seedNum) {
  let a = seedNum >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** @returns {string} */
export function createRandomAvatarSeed() {
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint32Array(2);
    crypto.getRandomValues(bytes);
    return bytes[0].toString(36) + bytes[1].toString(36);
  }
  return String(Date.now()) + Math.random().toString(36).slice(2, 8);
}

/** @param {unknown} value */
export function isGeneratedProfileAvatar(value) {
  return typeof value === 'string'
    && value.startsWith(GENERATED_AVATAR_PREFIX)
    && value.length > GENERATED_AVATAR_PREFIX.length;
}

/** @param {unknown} value @returns {string | null} */
export function parseGeneratedAvatarSeed(value) {
  if (!isGeneratedProfileAvatar(value)) return null;
  return value.slice(GENERATED_AVATAR_PREFIX.length);
}

/** @param {unknown} seed */
export function buildGeneratedProfileAvatarId(seed) {
  const s = typeof seed === 'string' ? seed.trim() : String(seed || '');
  return s ? `${GENERATED_AVATAR_PREFIX}${s}` : '';
}

/** @param {unknown} seed */
export function generateAvatarNameFromSeed(seed) {
  const rng = createMulberry32(hashAvatarSeed(seed));
  const prefix = AVATAR_NAME_PREFIXES[Math.floor(rng() * AVATAR_NAME_PREFIXES.length)];
  const suffix = AVATAR_NAME_SUFFIXES[Math.floor(rng() * AVATAR_NAME_SUFFIXES.length)];
  return `${prefix} ${suffix}`;
}

/** @param {string} seed */
export function generatedAvatarIconSlug(seed) {
  return String(seed || '').replace(/[^a-zA-Z0-9_-]/g, '') || '0';
}

export function normalizeProfileAvatar(value) {
  const id = typeof value === 'string' ? value.trim() : '';
  if (isGeneratedProfileAvatar(id)) return id;
  if (PROFILE_AVATAR_IDS.includes(id)) return id;
  if (LEGACY_AVATAR_MAP[id]) return LEGACY_AVATAR_MAP[id];
  return 'voidorb';
}

export function normalizeUserVibe(value) {
  const v = typeof value === 'string' ? value.trim() : '';
  return USER_VIBE_IDS.includes(v) ? v : 'calm';
}

export function normalizeDisplayNameTheme(value) {
  const allowed = ['mint', 'coral', 'sky', 'violet', 'gold'];
  const v = typeof value === 'string' ? value.trim() : '';
  return allowed.includes(v) ? v : 'mint';
}
