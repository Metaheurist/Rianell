#!/usr/bin/env node
import { loadCatalog, runAllOrder } from './catalog.mjs';

const catalog = loadCatalog();
const summary = {
  schemaVersion: catalog.schemaVersion,
  runAllOrder: runAllOrder(catalog),
  packs: Object.fromEntries(
    Object.entries(catalog.packs).map(([id, p]) => [id, {
      recommended: p.recommended,
      allowed: p.allowed,
      estVramGb: p.estVramGb,
    }]),
  ),
};
console.log(JSON.stringify(summary, null, 2));
