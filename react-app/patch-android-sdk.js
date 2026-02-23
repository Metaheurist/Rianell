#!/usr/bin/env node
/**
 * Patches Android Gradle files for broad compatibility:
 * - minSdk 22 (Android 5.1, Capacitor 6 minimum; broad device support)
 * - targetSdk 34 (Android 14, newest stable)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const androidDir = path.join(__dirname, 'android');
const varsPath = path.join(androidDir, 'variables.gradle');
const appBuildPath = path.join(androidDir, 'app', 'build.gradle');

function patch(path, replacements) {
  if (!fs.existsSync(path)) return false;
  let content = fs.readFileSync(path, 'utf8');
  let changed = false;
  for (const [pattern, replacement] of replacements) {
    const regex = new RegExp(pattern, 'g');
    if (regex.test(content)) {
      content = content.replace(regex, replacement);
      changed = true;
    }
  }
  if (changed) fs.writeFileSync(path, content);
  return changed;
}

let patched = false;
if (fs.existsSync(varsPath)) {
  patched = patch(varsPath, [
    [/minSdk\s*=\s*\d+/g, 'minSdk = 22'],
    [/minSdkVersion\s*=\s*\d+/g, 'minSdkVersion = 22'],
    [/targetSdk\s*=\s*\d+/g, 'targetSdk = 34'],
    [/targetSdkVersion\s*=\s*\d+/g, 'targetSdkVersion = 34'],
    [/compileSdk\s*=\s*\d+/g, 'compileSdk = 34'],
    [/compileSdkVersion\s*=\s*\d+/g, 'compileSdkVersion = 34'],
  ]) || patched;
}
if (fs.existsSync(appBuildPath)) {
  patched = patch(appBuildPath, [
    [/minSdkVersion\s+\d+/g, 'minSdkVersion 22'],
    [/targetSdkVersion\s+\d+/g, 'targetSdkVersion 34'],
    [/compileSdkVersion\s+\d+/g, 'compileSdkVersion 34'],
  ]) || patched;
}
console.log(patched ? 'Android SDK versions patched (min 22, target 34).' : 'No Gradle files to patch.');
process.exit(0);
