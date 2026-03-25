export function getTeamIds() {
  return ['mint', 'red-black', 'mono', 'rainbow'];
}

const TEAM_TOKENS = {
  mint: {
    dark: {
      color: {
        accent: '#7bdf8c',
        background: '#070807',
        text: '#e8eeec',
      },
    },
    light: {
      color: {
        accent: '#2e7d32',
        background: 'linear-gradient(135deg, #a8e6cf 0%, #c8e6c9 25%, #e8f5e8 75%, #f1f8e9 100%)',
        text: '#1b5e20',
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
    },
    light: {
      color: {
        accent: '#9d0f18',
        background: 'linear-gradient(135deg, #ffe7ea 0%, #ffd0d6 30%, #fff5f6 100%)',
        text: '#3a0a0f',
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
    },
    light: {
      color: {
        accent: '#151515',
        background: 'linear-gradient(135deg, #ffffff 0%, #f3f3f3 50%, #e9e9e9 100%)',
        text: '#151515',
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
    },
    light: {
      color: {
        accent: '#4d75ff',
        background: 'linear-gradient(135deg, #fff1fb 0%, #fff7df 40%, #ecf3ff 100%)',
        text: '#1a1d2a',
      },
    },
  },
};

function applyColorblindOverride(tokens, colorblindMode) {
  if (!colorblindMode || colorblindMode === 'none') return tokens;
  const m = String(colorblindMode);
  const t = JSON.parse(JSON.stringify(tokens));
  // Prefer hues that remain distinguishable for common red/green deficiencies.
  if (m === 'deuteranopia' || m === 'protanopia') {
    t.color.accent = '#4d75ff';
  } else if (m === 'tritanopia') {
    t.color.accent = '#ff4fa0';
  } else if (m === 'high-contrast') {
    t.color.accent = '#ffffff';
    t.color.text = '#ffffff';
    t.color.background = '#000000';
  }
  return t;
}

export function getTokens({ team, mode, colorblindMode } = {}) {
  const t = TEAM_TOKENS[team] ? team : 'mint';
  const m = mode === 'light' || mode === 'dark' ? mode : 'dark';
  return applyColorblindOverride(TEAM_TOKENS[t][m], colorblindMode);
}

