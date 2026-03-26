/**
 * Resolves public latest.json manifests under App build on rianell.com (same as web Settings refreshBuildDownloadLinks).
 */
export const DEFAULT_APP_BUILD_SITE_ORIGIN = 'https://rianell.com';

export type BuildChannel = 'androidLegacy' | 'androidRnCli' | 'ios';

const CHANNEL_PREFIX: Record<BuildChannel, string> = {
  androidLegacy: 'App build/Android/',
  androidRnCli: 'App build/RNCLI-Android/',
  ios: 'App build/iOS/',
};

export function manifestUrlForChannel(channel: BuildChannel): string {
  return `${DEFAULT_APP_BUILD_SITE_ORIGIN}/${encodeURI(`${CHANNEL_PREFIX[channel]}latest.json`)}`;
}

export type LatestManifest = {
  version?: number;
  file?: string;
  /** When set (iOS), web prefers this over constructing from `file`. */
  installUrl?: string;
  simulatorFile?: string;
};

export function artifactUrlFromManifest(channel: BuildChannel, manifest: LatestManifest): string | null {
  if (channel === 'ios' && manifest.installUrl) return manifest.installUrl;
  if (!manifest.file) return null;
  return `${DEFAULT_APP_BUILD_SITE_ORIGIN}/${encodeURI(`${CHANNEL_PREFIX[channel]}${manifest.file}`)}`;
}

export async function fetchLatestManifest(channel: BuildChannel): Promise<LatestManifest | null> {
  const url = manifestUrlForChannel(channel);
  try {
    const r = await fetch(url, { cache: 'no-store' });
    if (!r.ok) return null;
    return (await r.json()) as LatestManifest;
  } catch {
    return null;
  }
}

export async function resolveArtifactUrl(
  channel: BuildChannel
): Promise<{ url: string; version?: number } | null> {
  const manifest = await fetchLatestManifest(channel);
  if (!manifest) return null;
  const url = artifactUrlFromManifest(channel, manifest);
  if (!url) return null;
  return { url, version: manifest.version };
}
