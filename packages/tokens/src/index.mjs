export function getTeamIds() {
  return ['mint', 'red-black', 'mono', 'rainbow'];
}

/** Boot / loading overlay palette — keep web index.html critical CSS in sync (search: @rianell/loader-tokens). */
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

export function getTokens({ team, mode, colorblindMode } = {}) {
  const t = TEAM_TOKENS[team] ? team : 'mint';
  const m = mode === 'light' || mode === 'dark' ? mode : 'dark';
  return applyColorblindOverride(TEAM_TOKENS[t][m], colorblindMode);
}
