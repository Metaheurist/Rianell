/** Preset profile avatars (Plan 03 S6). */
export const PROFILE_AVATAR_IDS = ['leaf', 'heart', 'star', 'sun', 'pulse', 'shield'];

export function normalizeProfileAvatar(value) {
  const id = typeof value === 'string' ? value.trim() : '';
  return PROFILE_AVATAR_IDS.includes(id) ? id : 'leaf';
}

export function normalizeDisplayNameTheme(value) {
  const allowed = ['mint', 'coral', 'sky', 'violet', 'gold'];
  const v = typeof value === 'string' ? value.trim() : '';
  return allowed.includes(v) ? v : 'mint';
}
