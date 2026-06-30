import {
  ON_ACCENT,
  SPACING_TOKENS,
  isLightGradientBackground,
  resolveScreenBackground as resolveScreenBg,
  type getTokens,
} from '@rianell/tokens';

type Tokens = ReturnType<typeof getTokens>;

export type ThemeSlice = {
  mode: 'light' | 'dark';
  tokens: Tokens;
  color: Tokens['color'];
  radius?: Tokens['radius'];
  spacing?: Tokens['spacing'];
  surface?: Tokens['surface'];
};

export function isLightSurface(theme: ThemeSlice): boolean {
  return theme.mode === 'light' || isLightGradientBackground(theme.tokens.color.background);
}

export function resolveScreenBackground(theme: ThemeSlice): string {
  return resolveScreenBg(theme.tokens.color, theme.mode);
}

export function surfaceCard(theme: ThemeSlice): string {
  return theme.surface?.card ?? (isLightSurface(theme) ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.18)');
}

export function surfaceCardSolid(theme: ThemeSlice): string {
  return theme.surface?.cardSolid ?? (isLightSurface(theme) ? '#ffffff' : 'rgba(22,24,26,0.88)');
}

export function surfaceGlass(theme: ThemeSlice): string {
  return theme.surface?.glass ?? (isLightSurface(theme) ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.08)');
}

export function surfaceBorderMuted(theme: ThemeSlice): string {
  return theme.surface?.borderMuted ?? (isLightSurface(theme) ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.12)');
}

export function onAccentText(): string {
  return ON_ACCENT;
}

export function dangerAlpha(theme: ThemeSlice, alpha = 0.35): string {
  const hex = theme.color.danger?.replace('#', '') ?? 'f44336';
  if (hex.length !== 6) return `rgba(244, 67, 54, ${alpha})`;
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function accentAlpha(theme: ThemeSlice, alphaHex: string): string {
  return `${theme.color.accent}${alphaHex}`;
}

export { SPACING_TOKENS };
