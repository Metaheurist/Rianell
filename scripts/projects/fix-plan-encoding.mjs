#!/usr/bin/env node
/** Fix mojibake in Projects plan.md files from Windows-1252 misread UTF-8 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const projects = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../Projects');
const replacements = [
  ['\u00e2\u0080\u0094', '\u2014'], // em dash
  ['\u00e2\u0080\u0093', '\u2013'], // en dash
  ['\u00e2\u0098\u0085', '\u2605'], // star
  ['\u00e2\u0086\u0092', '\u2192'], // arrow
];

for (const dir of fs.readdirSync(projects)) {
  const planPath = path.join(projects, dir, 'plan.md');
  if (!fs.existsSync(planPath)) continue;
  let text = fs.readFileSync(planPath, 'utf8');
  let changed = false;
  for (const [from, to] of replacements) {
    if (text.includes(from)) {
      text = text.split(from).join(to);
      changed = true;
    }
  }
  if (changed) {
    fs.writeFileSync(planPath, text, 'utf8');
    console.log('fixed:', planPath);
  }
}
