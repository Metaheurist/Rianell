import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getTeamIds, VIBE_TOKENS, VIBE_IDS } from '@rianell/tokens';

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

const vibeCss = VIBE_IDS.map((id) => vibeBlock(id, VIBE_TOKENS[id])).join('\n\n');

const header = `/**
 * Auto-generated from @rianell/tokens — run: npm run sync:tokens
 * Team IDs: ${teams.join(', ')}
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
  --radius-full: 999px;
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

${vibeCss}
`;

fs.writeFileSync(outPath, header, 'utf8');
console.log(`Wrote ${outPath}`);
