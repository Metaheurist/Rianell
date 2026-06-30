import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  getTeamIds,
  SPACING_TOKENS,
  SURFACE_TOKENS,
  VIBE_TOKENS,
  VIBE_IDS,
} from '@rianell/tokens';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
const outPath = path.join(root, 'apps', 'pwa-webapp', 'css', 'tokens.css');

const teams = getTeamIds();

function vibeBlock(id, tokens) {
  return [
    `body.vibe-${id} {`,
    `  --vibe-ambient-bg: ${tokens.ambientBg === 'none' ? 'none' : tokens.ambientBg};`,
    `  --vibe-particle-color: ${tokens.particleColor};`,
    `  --vibe-motion-multiplier: ${tokens.motionMultiplier};`,
    `  --vibe-particle-mode: ${tokens.particleMode};`,
    '}',
  ].join('\n');
}

function spacingBlock() {
  return Object.entries(SPACING_TOKENS)
    .map(([key, px]) => `  --space-${key}: ${px}px;`)
    .join('\n');
}

function surfaceBlock(mode, tokens) {
  const prefix = mode === 'light' ? 'body.light-mode' : ':root';
  return [
    `${prefix} {`,
    `  --surface-card: ${tokens.card};`,
    `  --surface-card-solid: ${tokens.cardSolid};`,
    `  --surface-glass: ${tokens.glass};`,
    `  --surface-border-muted: ${tokens.borderMuted};`,
    `  --surface-modal-backdrop: ${tokens.modalBackdrop};`,
    '}',
  ].join('\n');
}

const vibeCss = VIBE_IDS.map((id) => vibeBlock(id, VIBE_TOKENS[id])).join('\n\n');

const header = `/**
 * Auto-generated from @rianell/tokens — run: npm run sync:tokens
 * Team IDs: ${teams.join(', ')}
 * Canonical contract: docs/design-token-contract.md
 */
:root {
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --dur-instant: 100ms;
  --dur-fast: 180ms;
  --dur-normal: 280ms;
  --dur-slow: 450ms;
  --color-success: #4caf50;
  --color-danger: #f44336;
  --color-warning: #ff9800;
  --color-info: #2196f3;
  --color-ai-accent: #e91e63;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-full: 999px;
${spacingBlock()}
  --surface-card: ${SURFACE_TOKENS.dark.card};
  --surface-card-solid: ${SURFACE_TOKENS.dark.cardSolid};
  --surface-glass: ${SURFACE_TOKENS.dark.glass};
  --surface-border-muted: ${SURFACE_TOKENS.dark.borderMuted};
  --surface-modal-backdrop: ${SURFACE_TOKENS.dark.modalBackdrop};
  /* Avatar graphics portfolio — search: @rianell/avatar-theme-tokens */
  --avatar-primary: var(--primary-color);
  --avatar-secondary: var(--secondary-color);
  --avatar-glow: var(--oasis-blob-a, var(--primary-color));
  --avatar-dark: var(--bg-secondary);
  --avatar-health-state: 2;
  --vibe-ambient-bg: none;
  --vibe-particle-color: transparent;
  --vibe-motion-multiplier: 1;
  --vibe-particle-mode: drift;
}

body.light-mode {
  --surface-card: ${SURFACE_TOKENS.light.card};
  --surface-card-solid: ${SURFACE_TOKENS.light.cardSolid};
  --surface-glass: ${SURFACE_TOKENS.light.glass};
  --surface-border-muted: ${SURFACE_TOKENS.light.borderMuted};
  --surface-modal-backdrop: ${SURFACE_TOKENS.light.modalBackdrop};
}

${vibeCss}
`;

fs.writeFileSync(outPath, header, 'utf8');
console.log(`Wrote ${outPath}`);
