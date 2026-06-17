#!/usr/bin/env node
/**
 * Gradle 9 removed org.gradle.util.VersionNumber; onnxruntime-react-native still
 * references it for RN < 0.71 (dead branch on RN 0.83). Strip the block so
 * assembleDebug can configure the :onnxruntime-react-native project.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
const gradlePath = path.join(root, 'node_modules/onnxruntime-react-native/android/build.gradle');

if (!fs.existsSync(gradlePath)) {
  console.log('patch-onnxruntime-gradle: onnxruntime-react-native not installed; skip');
  process.exit(0);
}

let content = fs.readFileSync(gradlePath, 'utf8');
if (!content.includes('VersionNumber.parse')) {
  console.log('patch-onnxruntime-gradle: already patched');
  process.exit(0);
}

const patched = content.replace(
  /\r?\n\s*if \(VersionNumber\.parse\(REACT_NATIVE_VERSION\) < VersionNumber\.parse\("0\.71"\)\) \{[\s\S]*?\r?\n\s*\}/,
  '\n\n  // Gradle 9 removed VersionNumber; RN >= 0.71 no longer needs fbjni extractLibs.',
);

if (patched === content) {
  console.error('patch-onnxruntime-gradle: expected VersionNumber block not found');
  process.exit(1);
}

fs.writeFileSync(gradlePath, patched);
console.log('patch-onnxruntime-gradle: patched', path.relative(root, gradlePath));
