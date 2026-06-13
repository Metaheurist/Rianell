import { POLICY_SUMMARIES } from './policy-summaries.mjs';
import { resolvePolicyPack } from './resolvePolicyPack.mjs';

export function getPolicyDocumentsForRegion(regionId, pack) {
  const resolved = resolvePolicyPack(regionId, pack);
  return (resolved.policyDocuments || [])
    .map((docId) => POLICY_SUMMARIES[docId])
    .filter(Boolean);
}
