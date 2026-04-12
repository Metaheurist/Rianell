#!/usr/bin/env node
/**
 * Regenerates docs/dependencies.md from package manifests, requirements.txt,
 * root package.json engines/overrides, and CDN URLs in apps/pwa-webapp/index.html.
 *
 * Usage: node scripts/generate-dependencies-doc.mjs
 * Writes: docs/dependencies.md (repo root relative to cwd)
 */
import fs from 'fs';
import path from 'path';

const root = process.cwd();

function readJson(rel) {
  const p = path.join(root, rel);
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function readText(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

function depTable(deps) {
  if (!deps || typeof deps !== 'object') return '';
  const keys = Object.keys(deps).sort((a, b) => a.localeCompare(b));
  const rows = keys.map((k) => `| \`${k}\` | ${deps[k]} |`);
  return ['| Package | Version |', '|---------|---------|', ...rows].join('\n');
}

function flattenOverrideKeys(ov, prefix = '') {
  if (ov === null || typeof ov !== 'object' || Array.isArray(ov)) {
    return [];
  }
  const out = [];
  for (const k of Object.keys(ov).sort()) {
    const v = ov[k];
    const key = prefix ? `${prefix} → ${k}` : k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      out.push(...flattenOverrideKeys(v, key));
    } else {
      out.push(key);
    }
  }
  return out;
}

function parseRequirements(rel) {
  const text = readText(rel);
  const lines = [];
  for (const line of text.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    lines.push(t);
  }
  return lines;
}

/** Map requirement line -> { name, constraint } */
function splitRequirement(line) {
  const m = line.match(/^([a-zA-Z0-9_\-\[\]]+)(.*)$/);
  if (!m) return { name: line, constraint: '' };
  return { name: m[1], constraint: m[2].trim() };
}

const PYTHON_ROLES = {
  supabase: 'Supabase client',
  watchdog: 'File watching / auto-reload (recommended)',
  'python-dotenv': '`.env` loading',
  cryptography: 'Encryption for anonymised data',
  'psycopg[binary]': 'PostgreSQL driver (optional path for direct SQL)',
  'psycopg2-binary': 'Alternate PostgreSQL driver',
};

function requirementsTable(lines) {
  const rows = ['| Package | Constraint | Role |', '|---------|------------|------|'];
  for (const line of lines) {
    const { name, constraint } = splitRequirement(line);
    const role = PYTHON_ROLES[name] || '—';
    rows.push(`| \`${name}\` | ${constraint || '—'} | ${role} |`);
  }
  return rows.join('\n');
}

function extractCdnUrl(html, re) {
  const m = html.match(re);
  return m ? m[0] : '—';
}

const pkgRoot = readJson('package.json');
const pkgRn = readJson('apps/rn-app/package.json');
const pkgCap = readJson('apps/capacitor-app/package.json');
const pkgBench = readJson('benchmarks/package.json');

const nvmrc = fs.existsSync(path.join(root, '.nvmrc'))
  ? readText('.nvmrc').trim()
  : '24.14.1';
const enginesNode = pkgRoot.engines?.node ?? '>=24.14.1';

const indexHtml = readText('apps/pwa-webapp/index.html');
const cdnSupabase = extractCdnUrl(
  indexHtml,
  /https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js@[^"'>\s]+/,
);
const cdnUaParser = extractCdnUrl(
  indexHtml,
  /https:\/\/cdn\.jsdelivr\.net\/npm\/ua-parser-js@[^"'>\s]+/,
);
const cdnFa = extractCdnUrl(
  indexHtml,
  /https:\/\/cdn\.jsdelivr\.net\/npm\/@fortawesome\/fontawesome-free@[^"'>\s]+/,
);

const overrideKeys = flattenOverrideKeys(pkgRoot.overrides || {});
const overridesNote =
  overrideKeys.length > 0
    ? `**\`overrides\`** — ${overrideKeys.length} pin(s): ${overrideKeys.map((k) => `\`${k}\``).join(', ')}. See the full \`overrides\` block in [\`package.json\`](../package.json).`
    : `**\`overrides\`** — (none).`;

const reqLines = parseRequirements('requirements.txt');

const out = `# Dependencies (full manifest by build)

This page lists **where dependencies are declared** for the Rianell monorepo: **npm workspaces** (single lockfile), **Python** for the desktop server, **runtime/CDN** assets for the static PWA, and **CI-only** tooling used to produce binaries and reports.

**Runtime expectations:** Node **${enginesNode}** ([\`package.json\`](../package.json) \`engines\`; [\`.nvmrc\`](../.nvmrc) pins **${nvmrc}** for local tooling). **Python 3.8+** for the server ([\`requirements.txt\`](../requirements.txt)).

**Build mapping (see main [README](../README.md)):** Web/PWA (GitHub Pages), React Native (Expo) CLI bundles for Android/iOS, Python server EXE (PyInstaller + optional PyArmor in CI), legacy Capacitor shell (npm manifests still present; CI no longer ships those artifacts by default).

## Authoritative sources

| Kind | Path |
|------|------|
| npm lockfile (all workspaces) | [\`package-lock.json\`](../package-lock.json) |
| Root workspace + overrides | [\`package.json\`](../package.json) |
| React Native (Expo) | [\`apps/rn-app/package.json\`](../apps/rn-app/package.json) |
| Legacy Capacitor shell | [\`apps/capacitor-app/package.json\`](../apps/capacitor-app/package.json) |
| Shared libraries | [\`packages/shared/package.json\`](../packages/shared/package.json), [\`packages/tokens/package.json\`](../packages/tokens/package.json) |
| Benchmarks | [\`benchmarks/package.json\`](../benchmarks/package.json) |
| Python server | [\`requirements.txt\`](../requirements.txt) |

The PWA under \`apps/pwa-webapp/\` has **no** \`package.json\`; it is bundled with **esbuild** from the root devDependencies via [\`apps/pwa-webapp/build-site.mjs\`](../apps/pwa-webapp/build-site.mjs).

---

## Root workspace ([\`package.json\`](../package.json))

**\`devDependencies\`**

${depTable(pkgRoot.devDependencies)}

${overridesNote}

**Workspaces:** \`apps/*\`, \`packages/*\`, \`benchmarks\`.

---

## Web / PWA (\`apps/pwa-webapp/\`)

### Build-time (Node, from root)

Uses root **esbuild**, Babel packages (\`@babel/generator\`, \`@babel/parser\`, \`@babel/traverse\`, \`@babel/types\`), **sharp**, and **@capacitor/cli** for scripts (\`build:web\`, icons, Capacitor-related automation). No separate npm manifest.

### Runtime — vendored / local

- **ApexCharts** — [\`apps/pwa-webapp/apexcharts.min.js\`](../apps/pwa-webapp/apexcharts.min.js) (loaded via [\`performance-utils.js\`](../apps/pwa-webapp/performance-utils.js) \`ensureApexChartsLoaded()\`, not from a CDN).

### Runtime — pinned CDNs (see [\`apps/pwa-webapp/index.html\`](../apps/pwa-webapp/index.html))

| Asset | Pinned reference |
|-------|------------------|
| Supabase JS (UMD) | \`${cdnSupabase}\` |
| ua-parser-js | \`${cdnUaParser}\` |
| Font Awesome (CSS) | \`${cdnFa}\` (deferred loader in page) |
| Google Fonts | Plus Jakarta Sans via \`fonts.googleapis.com\` / \`fonts.gstatic.com\` |

CSP and additional script hosts (e.g. ML/PayPal-related \`connect-src\` entries) are described in the same \`index.html\` meta **Content-Security-Policy** and related comments.

---

## React Native / Expo ([\`apps/rn-app/package.json\`](../apps/rn-app/package.json))

**\`dependencies\`**

${depTable(pkgRn.dependencies)}

**\`devDependencies\`**

${depTable(pkgRn.devDependencies)}

---

## Legacy Capacitor shell ([\`apps/capacitor-app/package.json\`](../apps/capacitor-app/package.json))

**\`dependencies\`**

${depTable(pkgCap.dependencies)}

**\`devDependencies\`**

${depTable(pkgCap.devDependencies)}

---

## Workspace libraries

[\`packages/shared/package.json\`](../packages/shared/package.json) and [\`packages/tokens/package.json\`](../packages/tokens/package.json) declare **no npm \`dependencies\`** (local ESM/CJS exports only).

---

## Benchmarks ([\`benchmarks/package.json\`](../benchmarks/package.json))

Workspace **\`@rianell/benchmark-runner\`**.

**\`devDependencies\`**

${depTable(pkgBench.devDependencies)}

---

## Python server ([\`requirements.txt\`](../requirements.txt))

${requirementsTable(reqLines)}

Install: \`pip install -r requirements.txt\` (Python **3.8+** per file header).

---

## CI and packaging-only (not in \`requirements.txt\`)

These are installed or invoked in workflows **to build or test**; they are not necessarily application imports.

### [\`.github/workflows/ci.yml\`](../.github/workflows/ci.yml) (representative)

| Tool / command | Role |
|----------------|------|
| \`npm install --no-save @rollup/rollup-linux-x64-gnu\` | Linux native Rollup binding for Expo/RN bundle steps on Ubuntu |
| \`npx playwright install chromium --with-deps\` | Browser for web benchmarks / automation |
| \`npx expo export\` / \`npx expo prebuild\` | React Native production bundles and native project prep |
| \`pip install pyinstaller\` | Build Windows server \`.exe\` |
| \`pip install pyarmor\` | Optional obfuscation step for server sources in CI (see workflow) |

### [\`.github/workflows/expo-native-build.yml\`](../.github/workflows/expo-native-build.yml)

| Tool | Role |
|------|------|
| \`npm install -g eas-cli\` | EAS CLI when that workflow runs |

### [\`.github/workflows/security-audit.yml\`](../.github/workflows/security-audit.yml) (reusable **only** — called from \`ci.yml\`; no separate \`on: push\` to avoid duplicate runs)

| Tool | Role |
|------|------|
| Gitleaks (pinned release binary) | Secret scan |
| \`npm audit --audit-level=high --omit=dev\` | npm advisory DB (production dependency tree; devDependency-only chains may still show in a local full \`npm audit\`) |
| OSV-Scanner (pinned binary) | [OSV.dev](https://osv.dev/) lockfile scan for \`package-lock.json\` and \`requirements.txt\` |
| \`pip-audit\` | PyPI vulnerability scan |

---

## Maintaining this doc

This file is **generated** by [\`scripts/generate-dependencies-doc.mjs\`](../scripts/generate-dependencies-doc.mjs). **CI** runs the generator on every workflow; pushes to **main** / **master** may commit updates automatically. On **pull requests**, CI fails if the committed file does not match the generator output — run \`node scripts/generate-dependencies-doc.mjs\` locally and commit \`docs/dependencies.md\` with manifest changes.
`;

const target = path.join(root, 'docs', 'dependencies.md');
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, out, 'utf8');
console.log('Wrote', path.relative(root, target));
