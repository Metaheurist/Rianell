import path from 'node:path';

/** Root folder for all canonical i18n JSON packs (locale, prompt, motd, policy). */
export const I18N_PACKS_DIR = 'i18n-packs';

export function repoI18nPacks(root) {
  return path.join(root, I18N_PACKS_DIR);
}

export function canonicalLocalePacksDir(root) {
  return path.join(repoI18nPacks(root), 'locale-packs', 'v1');
}

export function canonicalPromptPacksDir(root) {
  return path.join(repoI18nPacks(root), 'prompt-packs', 'v1');
}

export function canonicalMotdPacksDir(root) {
  return path.join(repoI18nPacks(root), 'motd-packs', 'v1');
}

export function canonicalPolicyPackPath(root) {
  return path.join(repoI18nPacks(root), 'policy-packs', 'v1.json');
}

/** Relative URL segment for PWA fetch (no leading slash). */
export const PWA_LOCALE_PACKS_URL = `${I18N_PACKS_DIR}/locale-packs/v1`;
export const PWA_PROMPT_PACKS_URL = `${I18N_PACKS_DIR}/prompt-packs/v1`;
export const PWA_MOTD_PACKS_URL = `${I18N_PACKS_DIR}/motd-packs/v1`;
