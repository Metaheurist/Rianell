import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getTeamIds } from '@rianell/tokens';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
const outPath = path.join(root, 'apps', 'pwa-webapp', 'css', 'tokens.css');

const teams = getTeamIds();
const header = `/**
 * Auto-generated from @rianell/tokens — run: node scripts/build/sync-tokens-to-pwa.mjs
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
}
`;

fs.writeFileSync(outPath, header, 'utf8');
console.log(`Wrote ${outPath}`);
