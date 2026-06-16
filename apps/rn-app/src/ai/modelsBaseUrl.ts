import {
  buildHuggingFaceModelFileUrl,
  buildModelsManifestUrl,
  MANIFEST_CATALOG_URL,
  resolveHfModelId,
} from '@rianell/llm';

/**
 * Manifest catalog URL (tier file list only — weights fetched from Hugging Face).
 */
export function getManifestCatalogUrl(): string {
  return MANIFEST_CATALOG_URL;
}

/** @deprecated Weights are HF-only; kept for manifest fetch compatibility. */
export function getModelsBaseUrl(): string {
  return 'https://rianell.com/';
}

export function buildHfFileUrl(
  entry: { id: string; sourceRepo?: string; revision?: string },
  filePath: string
): string {
  const modelId = resolveHfModelId(entry);
  return buildHuggingFaceModelFileUrl(modelId, entry.revision || 'main', filePath);
}

export function buildManifestUrl(baseUrl?: string): string {
  return buildModelsManifestUrl(baseUrl || getModelsBaseUrl());
}
