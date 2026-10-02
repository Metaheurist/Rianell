/**
 * PWA app source as text: app.js plus the ES modules extracted from it
 * (apps/pwa-webapp/modules/app/*.js). Source-scanning tests and verify/i18n scripts
 * read through here so moving code between those files does not break them.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export const APP_ENTRY = 'apps/pwa-webapp/app.js';
export const APP_MODULE_DIR = 'apps/pwa-webapp/modules/app';

/** Repo-relative paths (forward slashes): app.js first, then extracted modules sorted by name. */
export function appSourceFiles(root = REPO_ROOT) {
  const dir = path.join(root, APP_MODULE_DIR);
  const modules = fs.existsSync(dir)
    ? fs.readdirSync(dir).filter((f) => f.endsWith('.js')).sort().map((f) => `${APP_MODULE_DIR}/${f}`)
    : [];
  return [APP_ENTRY, ...modules];
}

/** Combined source text of app.js and its extracted modules. */
export function readAppSource(root = REPO_ROOT) {
  return appSourceFiles(root)
    .map((rel) => fs.readFileSync(path.join(root, rel), 'utf8'))
    .join('\n');
}
