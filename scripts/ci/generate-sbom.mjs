#!/usr/bin/env node
/** Plan 21 SEC10 — generate CycloneDX SBOM from package-lock.json. */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outArg = process.argv.indexOf('-o');
const outPath = outArg >= 0 ? process.argv[outArg + 1] : path.join(root, 'audit-history', 'sbom-latest.json');

const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const lock = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8'));

const components = [];
const packages = lock.packages || {};
for (const [name, meta] of Object.entries(packages)) {
  if (!meta.version || name === '') continue;
  const pkgName = name.replace(/^node_modules\//, '');
  components.push({
    type: 'library',
    name: pkgName,
    version: meta.version,
  });
}

const sbom = {
  bomFormat: 'CycloneDX',
  specVersion: '1.5',
  version: 1,
  metadata: {
    component: { type: 'application', name: pkg.name, version: pkg.version },
    timestamp: new Date().toISOString(),
  },
  components: components.sort((a, b) => a.name.localeCompare(b.name)),
};

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(sbom, null, 2));
console.log(`SBOM written: ${outPath} (${components.length} components)`);
