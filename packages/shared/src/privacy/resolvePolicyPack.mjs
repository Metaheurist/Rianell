import { POLICY_PACK_V1 } from './policyPackData.mjs';

let cachedPack = null;

export function loadPolicyPackFromDisk() {
  return getPolicyPack();
}

/** Browser bundle embeds pack at build time via policyPackData.mjs */
export function setPolicyPack(pack) {
  cachedPack = pack;
}

export function getPolicyPack() {
  if (cachedPack) return cachedPack;
  cachedPack = POLICY_PACK_V1;
  return cachedPack;
}

export function resolvePolicyPack(regionId, pack = getPolicyPack()) {
  const id = pack?.regions?.[regionId] ? regionId : 'other';
  const region = pack.regions[id];
  return {
    policyPackId: pack.policyPackId ?? pack.version ?? 'v1.0.0',
    regionId: id,
    label: region.label,
    requiredDataResidency: region.requiredDataResidency ?? 'default',
    policyDocuments: region.policyDocuments ?? [],
    features: region.features ?? {},
  };
}
