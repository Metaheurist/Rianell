#!/usr/bin/env node
/**
 * Patches Android project for compatibility:
 * - Gradle: minSdk 22, targetSdk 34, compileSdk 36 (compileSdk 36 required by androidx deps); versionCode/versionName from BUILD_VERSION env
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
const gradlePropsPath = path.join(androidDir, 'gradle.properties');
const proguardRulesPath = path.join(androidDir, 'app', 'proguard-rules.pro');

const buildVersion = parseInt(process.env.BUILD_VERSION || process.env.GITHUB_RUN_NUMBER || '1', 10) || 1;

/** R8 + resource shrinking for release APK/AAB (smaller install size). Safe with Capacitor when rules below are present. */
const PROGUARD_CAPACITOR_MARKER =
  '# Rianell: Capacitor / WebView (patched by patch-android-sdk.js — do not remove)';
const PROGUARD_CAPACITOR_RULES = `
${PROGUARD_CAPACITOR_MARKER}
-keep class com.getcapacitor.** { *; }
-keep class org.apache.cordova.** { *; }
-keepclassmembers class * extends com.getcapacitor.Plugin {
  @com.getcapacitor.PluginMethod public <methods>;
}
-dontwarn com.google.android.play.core.**
-dontwarn org.apache.cordova.**
`.trimStart();

function ensureReleaseR8(appBuildPath) {
  if (!fs.existsSync(appBuildPath)) return false;
  let c = fs.readFileSync(appBuildPath, 'utf8');
  let changed = false;
  if (/release\s*\{[\s\S]*?minifyEnabled\s+false/s.test(c)) {
    c = c.replace(/(release\s*\{[\s\S]*?\n\s*minifyEnabled\s+)false/, '$1true');
    changed = true;
  }
  if (/release\s*\{[\s\S]*?shrinkResources\s+false/s.test(c)) {
    c = c.replace(/(release\s*\{[\s\S]*?\n\s*shrinkResources\s+)false/, '$1true');
    changed = true;
  } else if (/release\s*\{[\s\S]*?minifyEnabled\s+true/s.test(c) && !/release\s*\{[\s\S]*?shrinkResources/.test(c)) {
    c = c.replace(/(release\s*\{[\s\S]*?\n\s*minifyEnabled\s+true)/, '$1\n            shrinkResources true');
    changed = true;
  }
  if (changed) fs.writeFileSync(appBuildPath, c);
  return changed;
}

function ensureProguardCapacitorRules(proguardPath) {
  if (!fs.existsSync(proguardPath)) return false;
  let c = fs.readFileSync(proguardPath, 'utf8');
  if (c.includes(PROGUARD_CAPACITOR_MARKER)) return false;
  const sep = c.endsWith('\n') ? '' : '\n';
  fs.writeFileSync(proguardPath, c + sep + '\n' + PROGUARD_CAPACITOR_RULES + '\n');
  return true;
}

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
    [/compileSdk\s*=\s*\d+/g, 'compileSdk = 36'],
    [/compileSdkVersion\s*=\s*\d+/g, 'compileSdkVersion = 36'],
  ]) || patched;
}
if (fs.existsSync(appBuildPath)) {
  patched = patch(appBuildPath, [
    [/minSdkVersion\s+\d+/g, 'minSdkVersion 22'],
    [/targetSdkVersion\s+\d+/g, 'targetSdkVersion 34'],
    [/compileSdkVersion\s+\d+/g, 'compileSdkVersion 36'],
    [/versionCode\s+\d+/g, `versionCode ${buildVersion}`],
    [/versionName\s+"[^"]*"/g, `versionName "${buildVersion}"`],
  ]) || patched;
}
if (ensureManifestPermissions(manifestPath)) {
  patched = true;
}

/** Faster Gradle (CI/local); does not change APK runtime behaviour. */
function ensureGradleDaemonAndCache() {
  if (!fs.existsSync(gradlePropsPath)) return false;
  let c = fs.readFileSync(gradlePropsPath, 'utf8');
  const add = [];
  if (!/org\.gradle\.parallel\s*=/.test(c)) add.push('org.gradle.parallel=true');
  if (!/org\.gradle\.caching\s*=/.test(c)) add.push('org.gradle.caching=true');
  if (!/org\.gradle\.jvmargs\s*=/.test(c)) {
    add.push('org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8');
  }
  if (!add.length) return false;
  const sep = c.endsWith('\n') ? '' : '\n';
  fs.writeFileSync(gradlePropsPath, c + sep + add.join('\n') + '\n');
  return true;
}

if (ensureGradleDaemonAndCache()) {
  patched = true;
}

if (ensureReleaseR8(appBuildPath)) {
  patched = true;
}
if (ensureProguardCapacitorRules(proguardRulesPath)) {
  patched = true;
}

console.log(patched ? 'Android SDK and notification permissions patched.' : 'No Android files to patch.');
console.log('Build version:', buildVersion);
process.exit(0);
