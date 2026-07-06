/** Plan Visual Upgrade P4 — lazy-loaded WebGL chunk marker. */
export async function lazyLoadWebGL() {
  if (typeof window === 'undefined') return null;
  if (window.RianellWebGL) return window.RianellWebGL;
  try {
    await new Promise(function (resolve, reject) {
      var existing = document.querySelector('script[data-rianell-webgl]');
      if (existing) {
        existing.addEventListener('load', resolve, { once: true });
        existing.addEventListener('error', reject, { once: true });
        if (window.RianellWebGL) resolve();
        return;
      }
      var s = document.createElement('script');
      s.src = 'modules/webgl-scene.js';
      s.defer = true;
      s.setAttribute('data-rianell-webgl', '1');
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
    return window.RianellWebGL || null;
  } catch (e) {
    return null;
  }
}

export default lazyLoadWebGL;
