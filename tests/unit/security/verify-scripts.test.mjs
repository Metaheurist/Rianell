import { execSync } from 'child_process';
import { test } from 'node:test';

test('verify-privacy-docs passes', () => {
  execSync('node scripts/verify/verify-privacy-docs.mjs', { stdio: 'pipe' });
});

test('verify-csp-connect-src passes', () => {
  execSync('node scripts/verify/verify-csp-connect-src.mjs', { stdio: 'pipe' });
});

test('verify-sri-integrity passes', () => {
  execSync('node scripts/verify/verify-sri-integrity.mjs', { stdio: 'pipe' });
});

test('verify-no-service-role-in-clients passes', () => {
  execSync('node scripts/verify/verify-no-service-role-in-clients.mjs', { stdio: 'pipe' });
});

test('verify-no-model-weights-in-git passes', () => {
  execSync('node scripts/models/verify-no-model-weights-in-git.mjs', { stdio: 'pipe' });
});

test('doc-links strict passes', () => {
  execSync('node scripts/verify/doc-links.mjs --strict', { stdio: 'pipe' });
});
