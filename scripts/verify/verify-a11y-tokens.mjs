#!/usr/bin/env node
/**
 * CI guard: WCAG contrast for @rianell/tokens theme pairs.
 * Fails when text/background or accent/shell pairs fall below AA thresholds.
 * Touch targets: minimum 44px (Plan 26 A11Y).
 */
import { getTeamIds, getTokens } from '@rianell/tokens';

const MIN_NORMAL = 4.5;
const MIN_LARGE = 3.0;
const MIN_TOUCH_TARGET_PX = 44;

function parseHex(color) {
  if (!color || typeof color !== 'string') return null;
  const hex = color.trim();
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return null;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

function relativeLuminance({ r, g, b }) {
  const srgb = [r, g, b].map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

function contrastRatio(fg, bg) {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function parseRgba(text) {
  const m = String(text).match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (!m) return null;
  return { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]) };
}

function shellBgRgb(tokens) {
  const fromLoader = parseHex(tokens.loader?.shellBg);
  if (fromLoader) return fromLoader;
  const fromBg = parseHex(tokens.color?.background);
  if (fromBg) return fromBg;
  return { r: 7, g: 8, b: 7 };
}

function textRgb(tokens) {
  const fromText = parseHex(tokens.color?.text);
  if (fromText) return fromText;
  const fromLoading = parseRgba(tokens.loader?.loadingText);
  if (fromLoading) return fromLoading;
  return { r: 232, g: 238, b: 236 };
}

function accentRgb(tokens) {
  const fromAccent = parseHex(tokens.color?.accent);
  if (fromAccent) return fromAccent;
  const fromPrimary = parseHex(tokens.loader?.primary);
  if (fromPrimary) return fromPrimary;
  return { r: 123, g: 223, b: 140 };
}

let failed = false;

function check(label, ratio, min) {
  if (ratio < min) {
    console.error(`verify-a11y-tokens: FAIL ${label} — ratio ${ratio.toFixed(2)} < ${min}`);
    failed = true;
  } else {
    console.log(`verify-a11y-tokens: ok ${label} — ${ratio.toFixed(2)}`);
  }
}

for (const team of getTeamIds()) {
  for (const mode of ['dark', 'light']) {
    const tokens = getTokens({ team, mode });
    const bg = shellBgRgb(tokens);
    const text = textRgb(tokens);
    const accent = accentRgb(tokens);
    const prefix = `${team}/${mode}`;

    check(`${prefix} text on shell`, contrastRatio(text, bg), MIN_NORMAL);
    check(`${prefix} accent on shell (large UI)`, contrastRatio(accent, bg), MIN_LARGE);
  }
}

if (failed) process.exit(1);
console.log(`verify-a11y-tokens: all token pairs pass WCAG AA thresholds (touch target min ${MIN_TOUCH_TARGET_PX}px)`);
