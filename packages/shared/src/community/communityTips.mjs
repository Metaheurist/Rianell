/** Plan 23 CM1 — anonymous community tips (no user_id). */

export const COMMUNITY_TIP_CATEGORIES = ['trigger', 'treatment', 'lifestyle', 'general'];
export const TIP_MAX_LENGTH = 500;
export const TIP_MIN_UPVOTES_VISIBLE = 20;

export function validateTipSubmission({ content, conditionTag, category }) {
  const errors = [];
  if (!conditionTag || typeof conditionTag !== 'string') errors.push('condition_required');
  if (!COMMUNITY_TIP_CATEGORIES.includes(category)) errors.push('invalid_category');
  const text = typeof content === 'string' ? content.trim() : '';
  if (!text) errors.push('content_required');
  if (text.length > TIP_MAX_LENGTH) errors.push('content_too_long');
  return { ok: errors.length === 0, errors, content: text };
}

export function formatCommunityTip(tip) {
  if (!tip || typeof tip !== 'object') return null;
  return {
    id: tip.id,
    conditionTag: tip.condition_tag || tip.conditionTag,
    category: tip.category,
    content: tip.content,
    upvotes: typeof tip.upvotes === 'number' ? tip.upvotes : 0,
    showUpvotes: (tip.upvotes || 0) >= TIP_MIN_UPVOTES_VISIBLE,
    approved: tip.approved === true,
  };
}
