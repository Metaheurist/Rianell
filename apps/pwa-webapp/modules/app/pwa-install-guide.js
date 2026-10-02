/**
 * PWA install guidance: per-platform install guide modal and file:// help.
 * Extracted from app.js. app.js re-publishes any window.* bindings at their original
 * positions; this module must not import app.js (it is loaded as app.js?v=N).
 */

function showFileProtocolHelp() {
  const helpText = `PWA Installation Limitation

Chrome requires HTTPS or localhost to show the automatic install prompt.

🔧 Solutions:

1. **Run a Local Server** (Recommended):
   • Open Command Prompt in this folder
   • Run: python -m http.server 8000
   • Open: http://localhost:8000

2. **Manual Installation**:
   • Chrome Menu (⋮) → More Tools → Create Shortcut
   • Check "Open as window"
   
3. **Use Edge Browser**:
   • Edge works better with file:// for PWA installation

4. **Upload to Web Hosting**:
   • Host on GitHub Pages, Netlify, etc.

Would you like manual installation instructions instead?`;
  
  if (confirm(helpText + '\n\nShow manual installation steps?')) {
    showInstallInstructions();
  }
}

function detectPWAInstallPlatform() {
  var ua = navigator.userAgent;
  var uaLower = ua.toLowerCase();
  if (/iPad|iPhone|iPod/.test(ua) && /Safari/.test(ua) && !/Chrome|CriOS|FxiOS/.test(ua)) return 'ios-safari';
  if (uaLower.includes('safari') && !uaLower.includes('chrome') && !uaLower.includes('iphone') && !uaLower.includes('ipad')) return 'macos-safari';
  if (uaLower.includes('chrome') && !uaLower.includes('edg')) return 'chrome';
  if (uaLower.includes('firefox')) return 'firefox';
  if (uaLower.includes('edg')) return 'edge';
  if (uaLower.includes('safari')) return 'ios-safari';
  return 'default';
}

var PWA_GUIDE_CONTENT = {
  'ios-safari': {
    title: 'Add to Home Screen (Safari iOS)',
    illus: '<svg class="pwa-guide-illus" viewBox="0 0 120 80" width="120" height="80" aria-hidden="true"><rect x="36" y="8" width="48" height="64" rx="8" fill="none" stroke="currentColor" stroke-width="2"/><rect x="40" y="58" width="40" height="4" rx="2" fill="currentColor" opacity="0.3"/><rect x="48" y="44" width="24" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M60 38v-6M56 34l4-4 4 4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    steps: [
      'Tap the Share button at the bottom of Safari',
      'Scroll down and tap "Add to Home Screen"',
      'Tap "Add" in the top right',
      'Open Rianell from your home screen'
    ]
  },
  'macos-safari': {
    title: 'Add to Dock (Safari macOS)',
    illus: '<svg class="pwa-guide-illus" viewBox="0 0 120 80" width="120" height="80" aria-hidden="true"><rect x="8" y="16" width="104" height="48" rx="6" fill="none" stroke="currentColor" stroke-width="2"/><rect x="8" y="16" width="104" height="12" rx="6" fill="currentColor" opacity="0.15"/><circle cx="100" cy="22" r="5" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    steps: [
      'Click the Share button in the Safari toolbar',
      'Select "Add to Dock"',
      'Launch Rianell from your Dock'
    ]
  },
  chrome: {
    title: 'Install on Chrome',
    illus: '<svg class="pwa-guide-illus" viewBox="0 0 120 80" width="120" height="80" aria-hidden="true"><rect x="8" y="12" width="104" height="56" rx="6" fill="none" stroke="currentColor" stroke-width="2"/><rect x="16" y="28" width="72" height="8" rx="4" fill="none" stroke="currentColor" stroke-width="1.5"/><rect x="92" y="26" width="12" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    steps: [
      'Look for the install icon in the address bar, or',
      'Open the menu (top right) → "Install Rianell"',
      'Alternatively: More Tools → Create Shortcut → check "Open as window"'
    ]
  },
  edge: {
    title: 'Install on Edge',
    illus: '<svg class="pwa-guide-illus" viewBox="0 0 120 80" width="120" height="80" aria-hidden="true"><rect x="8" y="12" width="104" height="56" rx="6" fill="none" stroke="currentColor" stroke-width="2"/><rect x="16" y="28" width="72" height="8" rx="4" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="98" cy="32" r="6" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    steps: [
      'Click the menu (⋯) in the top right',
      'Select Apps → "Install this site as an app"',
      'Click Install'
    ]
  },
  firefox: {
    title: 'Install on Firefox',
    illus: '<svg class="pwa-guide-illus" viewBox="0 0 120 80" width="120" height="80" aria-hidden="true"><rect x="8" y="12" width="104" height="56" rx="6" fill="none" stroke="currentColor" stroke-width="2"/><rect x="88" y="20" width="16" height="40" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M92 32h8M92 38h8M92 44h8" stroke="currentColor" stroke-width="1.5"/></svg>',
    steps: [
      'Click the menu (☰) in the top right',
      'Select "Install this site as an app"',
      'Choose a name and click Install'
    ]
  },
  default: {
    title: 'Install Rianell',
    illus: '<svg class="pwa-guide-illus" viewBox="0 0 120 80" width="120" height="80" aria-hidden="true"><rect x="20" y="16" width="80" height="48" rx="8" fill="none" stroke="currentColor" stroke-width="2"/><path d="M60 28v16M52 44h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    steps: [
      'Look for "Install" or "Add to Home Screen" in your browser menu',
      'Most modern browsers support installing web apps'
    ]
  }
};

function openPWAGuideModal(platform) {
  var overlay = document.getElementById('pwaGuideModal');
  var body = document.getElementById('pwaGuideBody');
  var titleEl = document.getElementById('pwaGuideTitle');
  if (!overlay || !body) return;
  var content = PWA_GUIDE_CONTENT[platform] || PWA_GUIDE_CONTENT.default;
  if (titleEl) titleEl.textContent = content.title;
  var stepsHtml = content.steps.map(function(step, i) {
    return '<div class="pwa-step"><span class="pwa-step__num">' + (i + 1) + '</span><p class="pwa-step__text">' + step + '</p></div>';
  }).join('');
  body.innerHTML = content.illus + stepsHtml;
  overlay.style.display = 'block';
}

function closePWAGuideModal() {
  var overlay = document.getElementById('pwaGuideModal');
  if (overlay) overlay.style.display = 'none';
}

function showInstallInstructions() {
  openPWAGuideModal(detectPWAInstallPlatform());
}

export { showFileProtocolHelp, openPWAGuideModal, closePWAGuideModal, showInstallInstructions };
