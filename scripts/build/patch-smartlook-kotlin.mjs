#!/usr/bin/env node
/**
 * react-native-smartlook-analytics 2.1.21 passes nullable commandId/args to a
 * delegate that expects non-null types under Kotlin 2 / RN 0.83 new architecture.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
const relPaths = [
  'node_modules/react-native-smartlook-analytics/android/src/turbo/SmartlookSensitivityViewManager.kt',
  'apps/rn-app/node_modules/react-native-smartlook-analytics/android/src/turbo/SmartlookSensitivityViewManager.kt',
];

const oldBlock = `    override fun receiveCommand(
      view: SmartlookSensitiveView,
      commandId: String?,
      args: ReadableArray?
    ) {
        delegate.receiveCommand(view, commandId, args)
    }`;

const newBlock = `    override fun receiveCommand(
      view: SmartlookSensitiveView,
      commandId: String?,
      args: ReadableArray?
    ) {
        if (commandId == null || args == null) return
        delegate.receiveCommand(view, commandId, args)
    }`;

let patchedAny = false;

for (const rel of relPaths) {
  const filePath = path.join(root, rel);
  if (!fs.existsSync(filePath)) continue;

  const content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('if (commandId == null || args == null) return')) {
    console.log('patch-smartlook-kotlin: already patched', rel);
    patchedAny = true;
    continue;
  }
  if (!content.includes(oldBlock)) {
    console.error('patch-smartlook-kotlin: expected receiveCommand block not found in', rel);
    process.exit(1);
  }

  fs.writeFileSync(filePath, content.replace(oldBlock, newBlock));
  console.log('patch-smartlook-kotlin: patched', rel);
  patchedAny = true;
}

if (!patchedAny) {
  console.log('patch-smartlook-kotlin: react-native-smartlook-analytics not installed; skip');
}
