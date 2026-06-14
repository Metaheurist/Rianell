#!/usr/bin/env node
/**
 * Add data-i18n / data-i18n-placeholder / data-i18n-aria to index.html
 * when element text matches an en-GB catalog value (exact match).
 */
import fs from 'node:fs';
import path from 'node:path';
import { canonicalLocalePacksDir } from '../packages/shared/src/i18n/packPaths.mjs';

const root = process.cwd();
const htmlPath = path.join(root, 'apps', 'pwa-webapp', 'index.html');
const pack = JSON.parse(fs.readFileSync(path.join(canonicalLocalePacksDir(root), 'en-GB.json'), 'utf8'));

const textToKey = new Map();
for (const [key, value] of Object.entries(pack.strings || {})) {
  if (typeof value === 'string' && value.length >= 2 && !value.includes('\n')) {
    textToKey.set(value.trim(), key);
  }
}

const lines = fs.readFileSync(htmlPath, 'utf8').split('\n');
let applied = 0;

const tagRe = /<(\w+)([^>]*)>([^<]{2,200})<\/\1>/;
const skipTags = new Set(['script', 'style', 'svg', 'use', 'path', 'defs', 'filter', 'ellipse', 'circle']);

for (let i = 0; i < lines.length; i++) {
  let line = lines[i];
  if (line.includes('data-i18n=') && !line.match(/<(input|textarea)/)) {
    // may still need placeholder
  }

  const m = line.match(tagRe);
  if (m) {
    const [, tag, attrs, inner] = m;
    if (skipTags.has(tag)) continue;
    const text = inner.trim();
    const key = textToKey.get(text);
    if (key && !attrs.includes('data-i18n=')) {
      const newAttrs = attrs.trim() ? `${attrs.trim()} data-i18n="${key}"` : ` data-i18n="${key}"`;
      line = line.replace(`<${tag}${attrs}>`, `<${tag} ${newAttrs}>`);
      applied++;
    }
  }

  for (const [text, key] of textToKey) {
    if (text.includes('"')) continue;
    if (line.includes(`placeholder="${text}"`) && !line.includes('data-i18n-placeholder=')) {
      line = line.replace(`placeholder="${text}"`, `placeholder="${text}" data-i18n-placeholder="${key}"`);
      applied++;
    }
    if (line.includes(`aria-label="${text}"`) && !line.includes('data-i18n-aria=')) {
      line = line.replace(`aria-label="${text}"`, `aria-label="${text}" data-i18n-aria="${key}"`);
      applied++;
    }
    if (line.includes(`title="${text}"`) && !line.includes('data-i18n-title=')) {
      line = line.replace(`title="${text}"`, `title="${text}" data-i18n-title="${key}"`);
      applied++;
    }
  }

  lines[i] = line;
}

fs.writeFileSync(htmlPath, lines.join('\n'), 'utf8');
console.log(`apply-html-i18n: applied ${applied} attribute(s) to index.html`);
