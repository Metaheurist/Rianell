/** Shared repository path constants — migrate to @rianell/build-tools in Phase 10 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ARTIFACTS_DIR = 'artifacts';
export const ARTIFACTS_ANDROID_RNCLI = `${ARTIFACTS_DIR}/RNCLI-Android`;
export const ARTIFACTS_IOS = `${ARTIFACTS_DIR}/iOS`;
export const ARTIFACTS_SERVER = `${ARTIFACTS_DIR}/Server`;
export const ARTIFACTS_ANDROID_LEGACY = `${ARTIFACTS_DIR}/Android`;
export const ARTIFACTS_LEGACY = `${ARTIFACTS_DIR}/Legacy`;

export function repoRootFromMeta(metaUrl) {
  return path.join(path.dirname(fileURLToPath(metaUrl)), '../../..');
}
