#!/usr/bin/env node
/**
 * Patches Android project for compatibility:
 * - Gradle: minSdk 22, targetSdk 34 (broad device support); versionCode/versionName from BUILD_VERSION env
 * - AndroidManifest: notification permissions for Android 12+ (exact alarms) and 13+ (POST_NOTIFICATIONS)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const androidDir = path.join(__dirname, 'android');
const varsPath = path.join(androidDir, 'variables.gradle');
const appBuildPath = path.join(androidDir, 'app', 'build.gradle');
const manifestPath = path.join(androidDir, 'app', 'src', 'main', 'AndroidManifest.xml');

const buildVersion = parseInt(process.env.BUILD_VERSION || process.env.GITHUB_RUN_NUMBER || '1', 10) || 1;

function patch(filePath, replacements) {
  if (!fs.existsSync(filePath)) return false;
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  for (const [pattern, replacement] of replacements) {
    const regex = new RegExp(pattern, 'g');
    if (regex.test(content)) {
      content = content.replace(regex, replacement);
      changed = true;
    }
  }
  if (changed) fs.writeFileSync(filePath, content);
  return changed;
}

function ensureManifestPermissions(manifestPath) {
  if (!fs.existsSync(manifestPath)) return false;
  let content = fs.readFileSync(manifestPath, 'utf8');
  const hasPost = /POST_NOTIFICATIONS/.test(content);
  const hasExact = /SCHEDULE_EXACT_ALARM/.test(content);
  if (hasPost && hasExact) return false;
  const toAdd = [];
  if (!hasPost) toAdd.push('<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />');
  if (!hasExact) toAdd.push('<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />');
  const insert = toAdd.map(p => `    ${p}`).join('\n') + '\n';
  const insertPoint = content.indexOf('<application');
  if (insertPoint === -1) return false;
  content = content.slice(0, insertPoint) + insert + content.slice(insertPoint);
  fs.writeFileSync(manifestPath, content);
  return true;
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
    [/versionCode\s+\d+/g, `versionCode ${buildVersion}`],
    [/versionName\s+"[^"]*"/g, `versionName "${buildVersion}"`],
  ]) || patched;
}
if (ensureManifestPermissions(manifestPath)) {
  patched = true;
}
console.log(patched ? 'Android SDK and notification permissions patched.' : 'No Android files to patch.');
console.log('Build version:', buildVersion);
process.exit(0);
