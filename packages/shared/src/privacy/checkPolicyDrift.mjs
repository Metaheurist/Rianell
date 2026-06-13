import { getPolicyPack } from './resolvePolicyPack.mjs';

/**
 * Compare embedded pack version with hosted manifest.
 * Returns { drift: boolean, requiresReconsent?: boolean, remoteVersion?: string }
 */
export async function checkPolicyDrift(localAckVersion, fetchImpl = globalThis.fetch) {
  const embedded = getPolicyPack().policyPackId ?? getPolicyPack().version ?? '1.0.0';
  const local = localAckVersion || embedded;
  try {
    const url =
      typeof window !== 'undefined' && window.POLICY_MANIFEST_URL
        ? window.POLICY_MANIFEST_URL
        : '/policy-manifest.json';
    const res = await fetchImpl(url, { cache: 'no-store' });
    if (!res.ok) return { drift: false, embedded };
    const remote = await res.json();
    const remoteVersion = remote.version || remote.policyPackId;
    if (!remoteVersion) return { drift: false, embedded };
    const drift = remoteVersion !== local;
    return {
      drift,
      requiresReconsent: drift && remote.requiresReconsent === true,
      remoteVersion,
      embedded,
      changelog: remote.changelog || '',
      affectedRegions: remote.affectedRegions || [],
    };
  } catch {
    return { drift: false, embedded };
  }
}

export function checkPolicyDriftSync(localAckVersion) {
  const embedded = getPolicyPack().policyPackId ?? '1.0.0';
  return { drift: false, embedded, local: localAckVersion || embedded };
}
