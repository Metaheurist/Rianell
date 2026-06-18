import { POLICY_SUMMARIES } from './policy-summaries.mjs';
import { getPolicyBodyParagraphs } from './policyBodies.mjs';
import { resolvePolicyPack } from './resolvePolicyPack.mjs';

export function getPolicyDocumentsForRegion(regionId, pack) {
  const resolved = resolvePolicyPack(regionId, pack);
  return (resolved.policyDocuments || [])
    .map((docId) => {
      const summary = POLICY_SUMMARIES[docId];
      if (!summary) return null;
      return { ...summary, body: getPolicyBodyParagraphs(docId) };
    })
    .filter(Boolean);
}
