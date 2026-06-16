/**
 * Build download URL helpers (Phase 17).
 * Bundled into app.js by build-site.mjs; imported as ES module in dev.
 */

export function getBuildBaseUrls() {
  const pathName = window.location.pathname || '/';
  const base = pathName.substring(0, pathName.lastIndexOf('/') + 1);
  const baseUrl = window.location.origin + (base.startsWith('/') ? base : '/' + base);
  return {
    androidRnCli: baseUrl + encodeURI('artifacts/RNCLI-Android/'),
    ios: baseUrl + encodeURI('artifacts/iOS/'),
  };
}

/** Skip latest.json fetch on local dev; set sessionStorage.forceAppBuildManifest = '1' to test locally. */
export function shouldFetchAppBuildManifests() {
  try {
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('forceAppBuildManifest') === '1') {
      return true;
    }
  } catch (e) {}
  const h =
    window.location && window.location.hostname
      ? String(window.location.hostname).toLowerCase()
      : '';
  if (h === 'localhost' || h === '127.0.0.1' || h === '[::1]') return false;
  return true;
}
