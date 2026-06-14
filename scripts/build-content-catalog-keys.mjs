#!/usr/bin/env node
/**
 * Extract food/exercise/stressor/symptom/energy/body catalogs from app.js into en-GB locale keys (content.*).
 * Run: node scripts/build-content-catalog-keys.mjs && node scripts/generate-locale-overrides.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { canonicalLocalePacksDir } from '../packages/shared/src/i18n/packPaths.mjs';

const root = process.cwd();
const appJs = fs.readFileSync(path.join(root, 'apps/pwa-webapp/app.js'), 'utf8');
const enPath = path.join(canonicalLocalePacksDir(root), 'en-GB.json');
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const strings = { ...(en.strings || {}) };

function parseArray(name) {
  const re = new RegExp(`const ${name} = \\[([\\s\\S]*?)\\];`);
  const m = appJs.match(re);
  if (!m) return [];
  const block = m[1];
  const items = [];
  const entryRe = /\{\s*id:\s*'([^']+)'[^}]*label:\s*'([^']+)'/g;
  let em;
  while ((em = entryRe.exec(block)) !== null) {
    items.push({ id: em[1], label: em[2] });
  }
  const valueRe = /\{\s*value:\s*'([^']+)',\s*label:\s*'([^']+)'/g;
  while ((em = valueRe.exec(block)) !== null) {
    items.push({ id: em[1], label: em[2] });
  }
  const foodRe = /\{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)'/g;
  while ((em = foodRe.exec(block)) !== null) {
    items.push({ id: em[1], label: em[2] });
  }
  return items;
}

const sections = [
  ['FOOD_GROUPS', 'content.foodGroup'],
  ['EXERCISE_CATEGORIES', 'content.exerciseCategory'],
  ['ENERGY_CLARITY_GROUPS', 'content.energyGroup'],
  ['STRESSOR_GROUPS', 'content.stressorGroup'],
  ['SYMPTOM_GROUPS', 'content.symptomGroup'],
  ['PREDEFINED_FOODS', 'content.food'],
  ['PREDEFINED_EXERCISES', 'content.exercise'],
  ['ENERGY_CLARITY_OPTIONS', 'content.energy'],
  ['STRESSOR_OPTIONS', 'content.stressor'],
  ['SYMPTOM_OPTIONS', 'content.symptom'],
  ['PAIN_BODY_REGIONS', 'content.bodyRegion'],
];

const meals = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack' };
for (const [meal, label] of Object.entries(meals)) {
  strings[`content.meal.${meal}`] = label;
}

let added = 0;
for (const [arrName, prefix] of sections) {
  for (const { id, label } of parseArray(arrName)) {
    const key = `${prefix}.${id.replace(/[^a-zA-Z0-9_]/g, '_')}`;
    if (!strings[key]) added++;
    strings[key] = label;
  }
}

en.strings = strings;
fs.writeFileSync(enPath, `${JSON.stringify(en, null, 2)}\n`, 'utf8');
console.log(`build-content-catalog-keys: en-GB updated (${added} new content.* keys)`);
