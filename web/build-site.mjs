/**
 * Minify web/app.js → web/app.min.js for deploy (parse/transfer size).
 * Run from repo root: node web/build-site.mjs
 */
import * as esbuild from 'esbuild';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

await esbuild.build({
  entryPoints: [path.join(root, 'web', 'app.js')],
  outfile: path.join(root, 'web', 'app.min.js'),
  minify: true,
  legalComments: 'none',
  logLevel: 'info'
});

console.log('Wrote web/app.min.js');
