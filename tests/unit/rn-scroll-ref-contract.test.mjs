import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

const SCROLL_REF_SCREENS = [
  'apps/rn-app/src/components/GoalsModal.tsx',
  'apps/rn-app/src/screens/MoodScreen.tsx',
  'apps/rn-app/src/screens/SettingsScreen.tsx',
];

test('RN carousel ScrollView refs use ComponentRef<typeof ScrollView> (React 19 types)', () => {
  for (const rel of SCROLL_REF_SCREENS) {
    const src = readFileSync(rel, 'utf8');
    assert.match(
      src,
      /useRef<React\.ComponentRef<typeof ScrollView>>\(null\)/,
      `${rel} must use ComponentRef<typeof ScrollView> for horizontal carousel refs`,
    );
    assert.doesNotMatch(
      src,
      /ScrollViewImperativeMethods/,
      `${rel} must not use legacy ScrollViewImperativeMethods ref typing`,
    );
  }
});

test('dependabot.yml ignores incompatible major bumps for Expo 55 / RN 0.83 stack', () => {
  const yml = readFileSync('.github/dependabot.yml', 'utf8');
  assert.match(yml, /dependency-name: "jest"[\s\S]*versions: \[">=30\.0\.0"\]/);
  assert.match(yml, /dependency-name: "@react-native\/babel-preset"[\s\S]*versions: \[">=0\.84\.0"\]/);
  assert.match(yml, /dependency-name: "expo-modules-core"[\s\S]*versions: \[">=56\.0\.0"\]/);
});
