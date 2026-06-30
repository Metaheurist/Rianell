import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { getTokens } from '@rianell/tokens';
import type { AppearanceMode, Preferences } from '../storage/preferences';

type Theme = {
  team: string;
  mode: 'light' | 'dark';
  tokens: ReturnType<typeof getTokens>;
  color: ReturnType<typeof getTokens>['color'];
  motion?: ReturnType<typeof getTokens>['motion'];
  radius?: ReturnType<typeof getTokens>['radius'];
  spacing?: ReturnType<typeof getTokens>['spacing'];
  surface?: ReturnType<typeof getTokens>['surface'];
  textScale: number;
  font: (size: number) => number;
};

const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({ prefs, children }: { prefs: Preferences; children: React.ReactNode }) {
  const system = useColorScheme() === 'light' ? 'light' : 'dark';
  const mode = resolveMode(prefs.appearanceMode, system);
  const value = useMemo(() => {
    const tokens = getTokens({ team: prefs.team, mode, colorblindMode: prefs.accessibility?.colorblindMode });
    const textScaleRaw = prefs.accessibility?.textScale ?? 1;
    const textScale = Number.isFinite(textScaleRaw) ? Math.min(2, Math.max(0.75, Number(textScaleRaw))) : 1;
    return {
      team: prefs.team,
      mode,
      tokens,
      color: tokens.color,
      motion: tokens.motion,
      radius: tokens.radius,
      spacing: tokens.spacing,
      surface: tokens.surface,
      textScale,
      font: (size: number) => size * textScale,
    };
  }, [prefs.team, mode, prefs.accessibility?.textScale, prefs.accessibility?.colorblindMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

function resolveMode(appearanceMode: AppearanceMode, system: 'light' | 'dark'): 'light' | 'dark' {
  if (appearanceMode === 'light' || appearanceMode === 'dark') return appearanceMode;
  return system;
}

export function useTheme() {
  const t = useContext(ThemeContext);
  if (!t) throw new Error('ThemeProvider missing');
  return t;
}

