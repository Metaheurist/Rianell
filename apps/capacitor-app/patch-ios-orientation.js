#!/usr/bin/env node
/**
 * CI/local: lock Capacitor iOS app to portrait by trimming UISupportedInterfaceOrientations in Info.plist.
 * Run after `npx cap sync ios` when ios/App exists.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const plistPath = path.join(__dirname, 'ios', 'App', 'App', 'Info.plist');

const PORTRAIT_ONLY = `<key>UISupportedInterfaceOrientations</key>
	<array>
		<string>UIInterfaceOrientationPortrait</string>
	</array>`;

const PORTRAIT_IPAD = `<key>UISupportedInterfaceOrientations~ipad</key>
	<array>
		<string>UIInterfaceOrientationPortrait</string>
	</array>`;

function patchPlist(filePath) {
  if (!fs.existsSync(filePath)) return false;
  let c = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  if (/<key>UISupportedInterfaceOrientations<\/key>\s*<array>[\s\S]*?<\/array>/.test(c)) {
    c = c.replace(/<key>UISupportedInterfaceOrientations<\/key>\s*<array>[\s\S]*?<\/array>/, PORTRAIT_ONLY);
    changed = true;
  }
  if (/<key>UISupportedInterfaceOrientations~ipad<\/key>\s*<array>[\s\S]*?<\/array>/.test(c)) {
    c = c.replace(/<key>UISupportedInterfaceOrientations~ipad<\/key>\s*<array>[\s\S]*?<\/array>/, PORTRAIT_IPAD);
    changed = true;
  }
  if (changed) fs.writeFileSync(filePath, c);
  return changed;
}

const ok = patchPlist(plistPath);
console.log(ok ? 'iOS Info.plist: portrait-only orientations applied.' : (fs.existsSync(plistPath) ? 'iOS Info.plist: no orientation block changed.' : 'iOS Info.plist: skipped (path missing).'));
process.exit(0);
