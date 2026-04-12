/**
 * Content-hash main bundle + stylesheet filenames so deploys/PWA always fetch fresh assets.
 * Writes asset-manifest.json next to the PWA root; patches index.html when requested (--site).
 */
import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';

/** @param {Buffer} buf @param {number} [len=12] */
export function contentHash(buf, len = 12) {
  return createHash('sha256').update(buf).digest('hex').slice(0, len);
}

export function removeOldFingerprintedBundles(siteDir) {
  if (!fs.existsSync(siteDir)) return;
  for (const name of fs.readdirSync(siteDir)) {
    if (/^app\.[0-9a-f]+\.min\.js$/i.test(name)) {
      fs.unlinkSync(path.join(siteDir, name));
    }
  }
}

export function removeOldFingerprintedStyles(siteDir) {
  if (!fs.existsSync(siteDir)) return;
  for (const name of fs.readdirSync(siteDir)) {
    if (/^styles\.[0-9a-f]+\.css$/i.test(name)) {
      fs.unlinkSync(path.join(siteDir, name));
    }
  }
}

/**
 * app.min.js → app.<hash>.min.js (deletes app.min.js)
 * @returns {string} published filename e.g. app.abc.min.js
 */
export function fingerprintAppJs(siteDir) {
  const appMin = path.join(siteDir, 'app.min.js');
  if (!fs.existsSync(appMin)) {
    throw new Error(`[fingerprint] ${appMin} missing`);
  }
  const buf = fs.readFileSync(appMin);
  const hash = contentHash(buf);
  const name = `app.${hash}.min.js`;
  fs.writeFileSync(path.join(siteDir, name), buf);
  fs.unlinkSync(appMin);
  return name;
}

/**
 * styles.css → styles.<hash>.css (deletes styles.css)
 * @returns {string} published filename
 */
export function fingerprintStylesheet(siteDir) {
  const cssPath = path.join(siteDir, 'styles.css');
  if (!fs.existsSync(cssPath)) return null;
  const buf = fs.readFileSync(cssPath);
  const hash = contentHash(buf);
  const name = `styles.${hash}.css`;
  fs.writeFileSync(path.join(siteDir, name), buf);
  fs.unlinkSync(cssPath);
  return name;
}

/**
 * @param {string} html
 * @param {{ mainJs: string, mainCss?: string | null }} manifest
 */
export function applyBundleNamesToHtml(html, manifest) {
  const { mainJs, mainCss } = manifest;
  html = html.replace(/src="app\.js(\?[^"]*)?"/g, `src="${mainJs}"`);
  html = html.replace(/href="app\.js(\?[^"]*)?"/g, `href="${mainJs}"`);
  html = html.replace(/src="app\.min\.js(\?[^"]*)?"/g, `src="${mainJs}"`);
  html = html.replace(/href="app\.min\.js(\?[^"]*)?"/g, `href="${mainJs}"`);
  if (mainCss) {
    /* Inline onerror retry must keep a cache-bust query after the hashed filename */
    html = html.replace(
      /s\.href='styles\.css\?v=\d+&amp;r='\s*\+\s*Date\.now\(\)/g,
      `s.href='${mainCss}?r='+Date.now()`
    );
    html = html.replace(/href="styles\.css(\?[^"]*)?"/g, `href="${mainCss}"`);
    html = html.replace(/href='styles\.css(\?[^']*)?'/g, `href='${mainCss}'`);
  }
  return html;
}

/**
 * @param {string} htmlPath
 * @param {{ mainJs: string, mainCss?: string | null }} manifest
 */
export function patchIndexHtml(htmlPath, manifest) {
  let html = fs.readFileSync(htmlPath, 'utf8');
  html = applyBundleNamesToHtml(html, manifest);
  fs.writeFileSync(htmlPath, html);
}

/**
 * @param {string} siteDir
 * @param {{ mainJs: string, mainCss?: string | null }} manifest
 */
export function writeAssetManifest(siteDir, manifest) {
  const out = { mainJs: manifest.mainJs };
  if (manifest.mainCss) out.mainCss = manifest.mainCss;
  fs.writeFileSync(path.join(siteDir, 'asset-manifest.json'), JSON.stringify(out, null, 2) + '\n');
}
