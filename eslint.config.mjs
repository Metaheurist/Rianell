// Scoped lint: files split out of app.js or added since the 2026-10 refit. Widen the
// file lists as legacy files are cleaned up rather than linting everything at once.
import js from '@eslint/js';
import globals from 'globals';

const PWA = 'apps/pwa-webapp';

const sharedRules = {
  'no-empty': ['error', { allowEmptyCatch: true }],
  'no-unused-vars': ['error', { args: 'after-used', caughtErrors: 'none', ignoreRestSiblings: true, varsIgnorePattern: '^_', argsIgnorePattern: '^_' }],
};

export default [
  {
    files: [`${PWA}/modules/app/**/*.js`],
    languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: globals.browser },
    rules: { ...js.configs.recommended.rules, ...sharedRules },
  },
  {
    files: [
      `${PWA}/modules/boot-guard.js`,
      `${PWA}/modules/llm-worker-client.js`,
      `${PWA}/summary-llm.js`,
      `${PWA}/ui-feedback.js`,
    ],
    languageOptions: { ecmaVersion: 2022, sourceType: 'script', globals: globals.browser },
    rules: { ...js.configs.recommended.rules, ...sharedRules },
  },
  {
    files: [`${PWA}/workers/llm-worker.js`],
    languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: globals.worker },
    rules: { ...js.configs.recommended.rules, ...sharedRules },
  },
  {
    files: [`${PWA}/sw.js`],
    languageOptions: { ecmaVersion: 2022, sourceType: 'script', globals: globals.serviceworker },
    rules: { ...js.configs.recommended.rules, ...sharedRules },
  },
  {
    files: [
      'eslint.config.mjs',
      'scripts/lib/app-source.mjs',
      'scripts/models/benchmark-llm-shortlist.mjs',
      'tests/unit/pwa/helpers/**/*.mjs',
    ],
    languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: globals.node },
    rules: { ...js.configs.recommended.rules, ...sharedRules },
  },
  {
    // page.evaluate() callbacks run in the browser.
    files: ['scripts/models/benchmark-llm-shortlist.mjs'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
];
