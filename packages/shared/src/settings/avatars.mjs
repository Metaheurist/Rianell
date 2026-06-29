/** Preset profile avatars — abstract inclusive entities (graphics portfolio). */
export const PROFILE_AVATAR_IDS = [
  'voidorb', 'tidewarden', 'leafcircuit', 'prismcore', 'moonthread',
  'emberveil', 'riftecho', 'stonebloom', 'glasswave', 'ashspiral',
  'coralnode', 'starlace', 'mistveil', 'thornloop', 'sunwarden',
  'duskmantle', 'ironbloom', 'vortexseed', 'lumenshard', 'driftmoss',
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

export function normalizeProfileAvatar(value) {
  const id = typeof value === 'string' ? value.trim() : '';
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
