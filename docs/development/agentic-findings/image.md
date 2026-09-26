## 2026-08-05 · image (search_replace unusable for docs/icons/icon-sprite-fancy-mint.svg)
- file_write docs/icons/icon-sprite-fancy-mint.svg
- original path: docs/icons/icon-sprite-fancy-mint.svg
2. [file_write] path=docs/icons/icon-sprite-fancy-mint.svg mode=search_replace
   Update the SVG file to include an `aria-label` attribute that corresponds to the alt-text for the icon.
   ```patch
   <<<SEARCH
   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
   =======
   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-label="Icon representing a budget-friendly, mint-green theme">
   >>>REPLACE
   ```
