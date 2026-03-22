/**
 * Helpers + optional esbuild onLoad plugin for function-trace instrumentation.
 */
import fs from 'fs';
import path from 'path';
import { transformSource } from './instrument-functions.mjs';
import { shouldExcludeFile } from './trace-excludes.mjs';

/**
 * @param {string} absPath
 * @param {string} webRoot absolute path to web/
 * @returns {string|undefined} transformed source, or undefined to copy file as-is
 */
export function transformFileIfNeeded(absPath, webRoot) {
  if (shouldExcludeFile(absPath, webRoot)) return undefined;
  const code = fs.readFileSync(absPath, 'utf8');
  const rel = path.relative(webRoot, absPath).replace(/\\/g, '/');
  return transformSource(code, { moduleId: rel || path.basename(absPath) });
}

/**
 * esbuild plugin: transform JS under webRoot only.
 * @param {{ webRoot: string }} opts
 */
export function functionTraceEsbuildPlugin(opts) {
  const webRoot = path.resolve(opts.webRoot);

  return {
    name: 'rianell-function-trace',
    setup(build) {
      build.onLoad({ filter: /\.js$/ }, async (args) => {
        const rel = path.relative(webRoot, args.path);
        if (rel.startsWith('..') || path.isAbsolute(rel)) return null;
        if (shouldExcludeFile(args.path, webRoot)) return null;
        const code = fs.readFileSync(args.path, 'utf8');
        const moduleId = rel.replace(/\\/g, '/');
        return {
          contents: transformSource(code, { moduleId }),
          loader: 'js',
        };
      });
    },
  };
}
