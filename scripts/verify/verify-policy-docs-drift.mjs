   #!/usr/bin/env node
   /**
    * verify-policy-docs-drift.mjs
    * Ensures key privacy implementation files are referenced in the ROPA/Privacy wiki.
    * Prevents drift between `packages/shared/src/privacy` and `wiki/Privacy-and-Your-Data.md`.
    */
   
   import { readFileSync, existsSync } from 'fs';
   import { join, dirname } from 'path';
   import { fileURLToPath } from 'url';
   
   const __dirname = dirname(fileURLToPath(import.meta.url));
   const repoRoot = join(__dirname, '..'); // Assumes scripts/ is at root level or one up
   
   const PRIVACY_DOCS_PATH = join(repoRoot, 'wiki', 'Privacy-and-Your-Data.md');
   const PRIVACY_SRC_DIR = join(repoRoot, 'packages', 'shared', 'src', 'privacy');
   
   // Files that must be referenced in the privacy doc if they exist and contain logic
   const CRITICAL_FILES = [
     'consentGate.mjs',
     'localOnlyMode.mjs', 
     'anonPoolFieldManifest.mjs',
     'encryptedExport.mjs'
   ];
   
   console.log('Starting policy-docs drift check...');
   
   let hasError = false;
   
   // 1. Check if the doc exists
   if (!existsSync(PRIVACY_DOCS_PATH)) {
     console.error(`FAIL: Privacy doc not found at ${PRIVACY_DOCS_PATH}`);
     process.exit(1);
   }
   
   const docContent = readFileSync(PRIVACY_DOCS_PATH, 'utf8');
   
   // 2. Check if the src dir exists and iterate files
   if (!existsSync(PRIVACY_SRC_DIR)) {
     console.error(`WARN: Privacy source dir not found at ${PRIVACY_SRC_DIR}`);
     process.exit(0); // Not an error, just skip
   }
   
   for (const file of CRITICAL_FILES) {
     const filePath = join(PRIVACY_SRC_DIR, file);
     if (existsSync(filePath)) {
       // Check if the filename is mentioned in the doc (as a reference to implementation)
       if (!docContent.includes(file)) {
         console.error(`FAIL: ${file} exists in code but is not referenced in ${PRIVACY_DOCS_PATH}`);
         hasError = true;
       } else {
         console.log(`OK: ${file} is referenced.`);
       }
     }
   }
   
   if (hasError) {
     console.error('Drift detected: Update privacy docs to reference new/changed local privacy modules.');
     process.exit(1);
   } else {
     console.log('verify-policy-docs-drift: All critical privacy files are referenced in docs.');
     process.exit(0);
   }
