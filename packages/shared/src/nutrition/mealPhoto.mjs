/** Plan 17 NU5 — meal photo attachment helpers (category: food). */

export const MEAL_PHOTO_CATEGORY = 'food';
export const MEAL_PHOTO_BUCKET = 'health-photos';

/** Build storage metadata tag for food wizard photos. */
export function buildMealPhotoMetadata(extra = {}) {
  return {
    category: MEAL_PHOTO_CATEGORY,
    ...extra,
  };
}

/** Accept attribute for PWA file input capture. */
export const MEAL_PHOTO_ACCEPT = 'image/*';

/** Whether a photo attachment is a meal/food photo. */
export function isMealPhoto(attachment) {
  if (!attachment || typeof attachment !== 'object') return false;
  return attachment.category === MEAL_PHOTO_CATEGORY || attachment.tag === MEAL_PHOTO_CATEGORY;
}
