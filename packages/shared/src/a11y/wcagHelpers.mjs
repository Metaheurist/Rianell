/** Plan 26 — WCAG 2.2 helpers for focus, motion, and contrast checks. */

export const WCAG_BODY_TEXT_MIN_CONTRAST = 4.5;
export const WCAG_LARGE_TEXT_MIN_CONTRAST = 3;
export const WCAG_UI_COMPONENT_MIN_CONTRAST = 3;
export const MIN_TOUCH_TARGET_PX = 44;
export const PRIMARY_ACTION_MIN_HEIGHT_PX = 64;

export function prefersReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function getMotionDurationMs(normalMs, reducedMs = 100) {
  return prefersReducedMotion() ? reducedMs : normalMs;
}

export function getBrainFogFontScale(enabled) {
  return enabled ? 1.2 : 1;
}

export function buildFocusScrollMargin(bottomNavPx = 80) {
  return { scrollMarginBottom: `${bottomNavPx}px` };
}

export function isAllowedAppearanceMode(mode) {
  return ['system', 'dark', 'light', 'warm-dark'].includes(mode);
}

export function contrastRatioPasses(ratio, isLargeText = false) {
  const min = isLargeText ? WCAG_LARGE_TEXT_MIN_CONTRAST : WCAG_BODY_TEXT_MIN_CONTRAST;
  return ratio >= min;
}
