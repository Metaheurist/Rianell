## 2026-08-05 · perf (search_replace unusable for apps/pwa-webapp/index.html)
- file_write apps/pwa-webapp/index.html
- original path: apps/pwa-webapp/index.html
2. [file_write] path=apps/pwa-webapp/index.html mode=search_replace
   Based on modern PWA best practices regarding "App Shell Architecture" (Source 4), add a note or structured comment to the entry point highlighting where critical CSS/JS is loaded versus lazy-loaded, serving as a starting point for bundle-split triage.
   ```patch
   <<<SEARCH
   <body>
       <div id="root"></div>
       <script type="module" src="/app.eb167c83ec91.min.js"></script>
   </body>
