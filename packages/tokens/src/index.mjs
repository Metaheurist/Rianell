export function getTeamIds() {
  return ['mint', 'red-black', 'mono', 'rainbow'];
}

/** Semantic UI colors — mirror apps/pwa-webapp/styles.css :root tokens. */
const SEMANTIC_COLORS = {
  success: '#4caf50',
  danger: '#f44336',
  warning: '#ff9800',
  info: '#2196f3',
  aiAccent: '#e91e63',
  statusImproving: '#4caf50',
  statusStable: '#2196f3',
  statusDeclining: '#f44336',
};

/** Boot / loading overlay palette — keep web index.html critical CSS in sync (search: @rianell/loader-tokens). */
/** Recovery overlay/button layout — keep web index.html + styles.css in sync (search: @rianell/recovery-tokens). */
export const RECOVERY_TOKENS = {
  btnPaddingY: '0.45rem',
  btnPaddingX: '0.875rem',
  btnGap: '0.375rem',
  btnFontSize: '0.8125rem',
  iconSize: '0.9375rem',
  btnRadius: '999px',
  btnText: '#ffffff',
  btnIcon: '#ffffff',
};

// ─── OASIS TOKENS — UI Oasis Overhaul v2.1.0 ──────────────────────────────
// search: @rianell/oasis-tokens
export const OASIS_TOKENS = {
  motion: {
    easeOasis: 'cubic-bezier(0.45, 0, 0.55, 1)',
    breathDurationMs: 6000,
    glowDurationMs: 3200,
    neuralTraceDurationMs: 2400,
    particleDurationMs: 900,
    magnetSnapDurationMs: 180,
  },
  ambient: {
    mint: {
      blob1: '#1a5c3a',
      blob2: '#0d3d2e',
      blob3: '#2e7a5a',
      glow: '#7bdf8c',
    },
    'red-black': {
      blob1: '#6b1a2e',
      blob2: '#3d0d1a',
      blob3: '#a0294a',
      glow: '#ff8d98',
    },
    mono: {
      blob1: '#1e1e1e',
      blob2: '#2d2d2d',
      blob3: '#3a3a3a',
      glow: '#d0d0d0',
    },
    rainbow: {
      blob1: '#1a1550',
      blob2: '#2a0d40',
      blob3: '#3d1f6b',
      glow: '#ff4fa0',
    },
  },
  statusGlow: {
    improving: 'drop-shadow(0 0 8px #4caf50)',
    stable: 'drop-shadow(0 0 6px #2196f3)',
    declining: 'none',
  },
};
// ─── END OASIS TOKENS ───────────────────────────────────────────────────────

/** User vibe preference IDs (ambient + avatar animation personality). search: @rianell/vibe-tokens */
export const VIBE_IDS = ['calm', 'energy', 'nature', 'clinical', 'dark'];

export const VIBE_TOKENS = {
  calm: {
    ambientBg: 'radial-gradient(ellipse 120% 80% at 50% 0%, rgba(26, 92, 58, 0.35) 0%, transparent 55%)',
    particleColor: 'rgba(125, 223, 140, 0.35)',
    motionMultiplier: 0.5,
    particleMode: 'drift',
  },
  energy: {
    ambientBg: 'radial-gradient(ellipse 100% 70% at 50% 20%, rgba(123, 223, 140, 0.28) 0%, transparent 50%)',
    particleColor: 'rgba(123, 223, 140, 0.55)',
    motionMultiplier: 1.5,
    particleMode: 'spark',
  },
  nature: {
    ambientBg: 'radial-gradient(ellipse 110% 75% at 40% 10%, rgba(46, 122, 90, 0.32) 0%, transparent 52%)',
    particleColor: 'rgba(154, 232, 164, 0.4)',
    motionMultiplier: 1,
    particleMode: 'sway',
  },
  clinical: {
    ambientBg: 'none',
    particleColor: 'transparent',
    motionMultiplier: 0,
    particleMode: 'none',
  },
  dark: {
    ambientBg: 'radial-gradient(ellipse 90% 60% at 50% 100%, rgba(61, 31, 107, 0.25) 0%, transparent 55%)',
    particleColor: 'rgba(255, 79, 160, 0.35)',
    motionMultiplier: 0.85,
    particleMode: 'ember',
  },
};

/** Avatar fill slots resolved per global theme team. search: @rianell/avatar-theme-tokens */
export const AVATAR_THEME_TOKENS = {
  mint: { primary: 'var(--primary-color)', secondary: 'var(--secondary-color)', glow: '#7bdf8c', dark: 'var(--bg-secondary)' },
  'red-black': { primary: 'var(--primary-color)', secondary: 'var(--secondary-color)', glow: '#ff8d98', dark: 'var(--bg-secondary)' },
  mono: { primary: 'var(--primary-color)', secondary: 'var(--secondary-color)', glow: '#d0d0d0', dark: 'var(--bg-secondary)' },
  rainbow: { primary: 'var(--primary-color)', secondary: 'var(--secondary-color)', glow: '#ff4fa0', dark: 'var(--bg-secondary)' },
};

export function getVibeIds() {
  return VIBE_IDS.slice();
}

export function normalizeUserVibe(value) {
  const v = typeof value === 'string' ? value.trim() : '';
  return VIBE_IDS.includes(v) ? v : 'calm';
}

export function resolveAvatarThemeTokens(team) {
  return AVATAR_THEME_TOKENS[team] || AVATAR_THEME_TOKENS.mint;
}

const TEAM_TOKENS = {
  mint: {
    dark: {
      color: {
        accent: '#7bdf8c',
        background: '#070807',
        text: '#e8eeec',
      },
      loader: {
        primary: '#7bdf8c',
        bright: '#d6ffdd',
        mid: '#9ae8a4',
        deep: '#52b85f',
        shellBg: '#070807',
        shellTop: '#050606',
        shellMid: '#070807',
        shellBot: '#030403',
        loadingText: 'rgba(224, 242, 241, 0.92)',
      },
    },
    light: {
      color: {
        accent: '#2e7d32',
        background:
          'linear-gradient(135deg, #a8e6cf 0%, #c8e6c9 25%, #e8f5e8 75%, #f1f8e9 100%)',
        text: '#1b5e20',
      },
      loader: {
        primary: '#2e7d32',
        bright: '#c8e6c9',
        mid: '#66bb6a',
        deep: '#1b5e20',
        shellBg: '#e8f5e9',
        shellTop: '#f1f8f4',
        shellMid: '#e8f5e9',
        shellBot: '#dceee0',
        loadingText: 'rgba(27, 94, 32, 0.92)',
      },
    },
  },
  'red-black': {
    dark: {
      color: {
        accent: '#ff4d5a',
        background: '#070807',
        text: '#e8eeec',
      },
      loader: {
        primary: '#ff4d5a',
        bright: '#ffd7dc',
        mid: '#ff8d98',
        deep: '#a31624',
        shellBg: '#070807',
        shellTop: '#060506',
        shellMid: '#070807',
        shellBot: '#040304',
        loadingText: 'rgba(255, 228, 230, 0.92)',
      },
    },
    light: {
      color: {
        accent: '#9d0f18',
        background: 'linear-gradient(135deg, #ffe7ea 0%, #ffd0d6 30%, #fff5f6 100%)',
        text: '#3a0a0f',
      },
      loader: {
        primary: '#9d0f18',
        bright: '#ffc9ce',
        mid: '#c62828',
        deep: '#5c0a12',
        shellBg: '#fff5f6',
        shellTop: '#ffffff',
        shellMid: '#fff0f2',
        shellBot: '#ffe4e8',
        loadingText: 'rgba(58, 10, 15, 0.9)',
      },
    },
  },
  mono: {
    dark: {
      color: {
        accent: '#f2f2f2',
        background: '#070807',
        text: '#e8eeec',
      },
      loader: {
        primary: '#f1f1f1',
        bright: '#ffffff',
        mid: '#d0d0d0',
        deep: '#7f7f7f',
        shellBg: '#070807',
        shellTop: '#040404',
        shellMid: '#080808',
        shellBot: '#030303',
        loadingText: 'rgba(232, 238, 236, 0.92)',
      },
    },
    light: {
      color: {
        accent: '#151515',
        background: 'linear-gradient(135deg, #ffffff 0%, #f3f3f3 50%, #e9e9e9 100%)',
        text: '#151515',
      },
      loader: {
        primary: '#151515',
        bright: '#f5f5f5',
        mid: '#9e9e9e',
        deep: '#424242',
        shellBg: '#f3f3f3',
        shellTop: '#ffffff',
        shellMid: '#f3f3f3',
        shellBot: '#e0e0e0',
        loadingText: 'rgba(21, 21, 21, 0.9)',
      },
    },
  },
  rainbow: {
    dark: {
      color: {
        accent: '#ff4fa0',
        background: '#070807',
        text: '#e8eeec',
      },
      loader: {
        primary: '#ff4fa0',
        bright: '#ffe0f2',
        mid: '#ffd54f',
        deep: '#4d75ff',
        shellBg: '#070807',
        shellTop: '#050608',
        shellMid: '#070807',
        shellBot: '#040510',
        loadingText: 'rgba(232, 240, 255, 0.92)',
      },
    },
    light: {
      color: {
        accent: '#4d75ff',
        background: 'linear-gradient(135deg, #fff1fb 0%, #fff7df 40%, #ecf3ff 100%)',
        text: '#1a1d2a',
      },
      loader: {
        primary: '#4d75ff',
        bright: '#e8eeff',
        mid: '#7c4dff',
        deep: '#3949ab',
        shellBg: '#f5f7ff',
        shellTop: '#ffffff',
        shellMid: '#f0f4ff',
        shellBot: '#e3e9ff',
        loadingText: 'rgba(26, 29, 42, 0.9)',
      },
    },
  },
};

function applyColorblindOverride(tokens, colorblindMode) {
  if (!colorblindMode || colorblindMode === 'none') return tokens;
  const m = String(colorblindMode);
  const t = JSON.parse(JSON.stringify(tokens));
  if (m === 'deuteranopia' || m === 'protanopia') {
    t.color.accent = '#4d75ff';
    if (t.loader) {
      t.loader.primary = '#4d75ff';
      t.loader.mid = '#7c9cff';
      t.loader.deep = '#3949ab';
    }
  } else if (m === 'tritanopia') {
    t.color.accent = '#ff4fa0';
    if (t.loader) {
      t.loader.primary = '#ff4fa0';
      t.loader.mid = '#ff8db3';
      t.loader.deep = '#c2185b';
    }
  } else if (m === 'high-contrast') {
    t.color.accent = '#ffffff';
    t.color.text = '#ffffff';
    t.color.background = '#000000';
    if (t.loader) {
      t.loader.primary = '#ffffff';
      t.loader.bright = '#ffffff';
      t.loader.mid = '#cccccc';
      t.loader.deep = '#888888';
      t.loader.shellBg = '#000000';
      t.loader.shellTop = '#000000';
      t.loader.shellMid = '#000000';
      t.loader.shellBot = '#000000';
      t.loader.loadingText = 'rgba(255, 255, 255, 0.95)';
    }
  }
  return t;
}

function withSemanticColors(tokens) {
  return {
    ...tokens,
    color: {
      ...tokens.color,
      ...SEMANTIC_COLORS,
    },
    motion: {
      easeSpring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      easeOutExpo: 'cubic-bezier(0.16, 1, 0.3, 1)',
      durInstant: 100,
      durFast: 180,
      durNormal: 280,
      durSlow: 450,
    },
    radius: { sm: 8, md: 12, lg: 16, xl: 24, full: 999 },
  };
}

export function getTokens({ team, mode, colorblindMode } = {}) {
  const t = TEAM_TOKENS[team] ? team : 'mint';
  const m = mode === 'light' || mode === 'dark' ? mode : 'dark';
  return applyColorblindOverride(withSemanticColors(TEAM_TOKENS[t][m]), colorblindMode);
}
