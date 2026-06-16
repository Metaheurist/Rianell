#!/usr/bin/env node
/** Legacy Phase 2 one-shot — do not run without review. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
const subdirs = ['build', 'i18n', 'verify', 'ci', 'audit', 'wiki', 'models'];

for (const sub of subdirs) {
  const dir = path.join(scriptsDir, sub);
  if (!fs.existsSync(dir)) continue;
  for (const name of fs.readdirSync(dir)) {
    if (!name.endsWith('.mjs')) continue;
    const fp = path.join(dir, name);
    let s = fs.readFileSync(fp, 'utf8');
    let changed = false;
    const replacements = [
      ["path.join(__dirname, '..')", "path.join(__dirname, '../..')"],
      ["path.join(__dirname, \"..\")", "path.join(__dirname, '../..')"],
      ["path.join(path.dirname(fileURLToPath(import.meta.url)), '..')", "path.join(path.dirname(fileURLToPath(import.meta.url)), '../..')"],
      ["path.join(path.dirname(fileURLToPath(import.meta.url)), \"..\")", "path.join(path.dirname(fileURLToPath(import.meta.url)), '../..')"],
      ["path.join(__dirname, '..', 'apps", "path.join(__dirname, '../..', 'apps"],
      ["path.join(__dirname, '..', \"apps", "path.join(__dirname, '../..', \"apps"],
      ["path.join(__dirname, '..', 'packages", "path.join(__dirname, '../..', 'packages"],
      ["path.join(__dirname, '..', 'docs", "path.join(__dirname, '../..', 'docs"],
      ["path.join(__dirname, '..', 'i18n-packs", "path.join(__dirname, '../..', 'i18n-packs"],
    ];
    for (const [from, to] of replacements) {
      if (s.includes(from)) {
        s = s.split(from).join(to);
        changed = true;
      }
    }
    // Fix triple-wrong: if we already had ../.. and got ../../../.. skip - check for projectRoot
    if (changed) {
      fs.writeFileSync(fp, s, 'utf8');
      console.log('fixed root path:', sub + '/' + name);
    }
  }
}
