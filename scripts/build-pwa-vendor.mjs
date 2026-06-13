import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'apps', 'pwa-webapp', 'vendor');
fs.mkdirSync(outDir, { recursive: true });

async function bundleIife(entry, globalName, outfile) {
  await esbuild.build({
    entryPoints: [entry],
    outfile,
    bundle: true,
    format: 'iife',
    globalName,
    platform: 'browser',
    target: ['es2020'],
  });
}

await bundleIife(
  path.join(root, 'packages', 'shared', 'src', 'index.mjs'),
  'RianellShared',
  path.join(outDir, 'rianell-shared.js')
);
await bundleIife(
  path.join(root, 'packages', 'ai-engine', 'src', 'index.mjs'),
  'RianellAIEngine',
  path.join(outDir, 'rianell-ai-engine.js')
);

console.log('Built PWA vendor bundles in apps/pwa-webapp/vendor/');
