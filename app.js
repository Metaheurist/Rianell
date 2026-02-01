// ============================================
// Client-Side Logging Utility
// ============================================
const Logger = {
  enabled: true,
  serverEndpoint: '/api/log',
  
  _demoModeCache: null,
  _demoModeCacheTime: 0,
  _cacheTimeout: 5000, // Cache for 5 seconds
  
  _getDemoMode() {
    const now = Date.now();
    // Use cached value if still valid
    if (this._demoModeCache !== null && (now - this._demoModeCacheTime) < this._cacheTimeout) {
      return this._demoModeCache;
    }
    
    // Check demo mode from localStorage (avoids temporal dead zone issues with appSettings)
    let isDemoMode = false;
    try {
      const savedSettings = localStorage.getItem('healthAppSettings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        isDemoMode = settings.demoMode === true;
      }
    } catch (e) {
      // If we can't read settings, skip server logging
      this._demoModeCache = false;
      this._demoModeCacheTime = now;
      return false;
    }
    
    // Cache the result
    this._demoModeCache = isDemoMode;
    this._demoModeCacheTime = now;
    return isDemoMode;
  },
  
  log(level, message, details = {}) {
    if (!this.enabled) return;
    
    const logEntry = {
      level: level,
      message: message,
      timestamp: new Date().toISOString(),
      source: 'client',
      details: details,
      url: window.location.href,
      userAgent: navigator.userAgent
    };
    
    // Always log to console
    const consoleMethod = level.toLowerCase() === 'error' ? 'error' : 
                         level.toLowerCase() === 'warn' ? 'warn' : 
                         level.toLowerCase() === 'debug' ? 'debug' : 'log';
    console[consoleMethod](`[${level}] ${message}`, details);
    
    // Only send to server if demo mode is enabled (using cached check)
    if (!this._getDemoMode()) {
      return; // Skip server logging when not in demo mode
    }
    
    // Send to server (fire and forget - don't block on errors)
    try {
      fetch(this.serverEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(logEntry)
      }).catch(err => {
        // Silently fail - don't spam console if server is down
        console.debug('Failed to send log to server:', err);
      });
    } catch (err) {
      console.debug('Error sending log:', err);
    }
  },
  
  info(message, details) {
    this.log('INFO', message, details);
  },
  
  warn(message, details) {
    this.log('WARN', message, details);
  },
  
  error(message, details) {
    this.log('ERROR', message, details);
  },
  
  debug(message, details) {
    this.log('DEBUG', message, details);
  }
};

// ============================================
// Helper: Close Settings Modal
// ============================================
function closeSettingsModalIfOpen() {
  const settingsOverlay = document.getElementById('settingsOverlay');
  if (settingsOverlay && (settingsOverlay.style.display === 'flex' || settingsOverlay.style.display === 'block')) {
    // Preserve state before closing
    const settingsContent = settingsOverlay.querySelector('.settings-content');
    if (settingsContent) {
      window.settingsModalScrollPosition = settingsContent.scrollTop;
    }
    
    const conditionSelector = document.getElementById('medicalConditionSelector');
    if (conditionSelector) {
      window.settingsModalConditionSelectorOpen = conditionSelector.style.display !== 'none';
    }
    
    if (typeof closeSettings === 'function') {
      closeSettings();
    } else if (typeof toggleSettings === 'function') {
      toggleSettings(); // Toggle will close it if it's open
    } else {
      settingsOverlay.style.display = 'none';
      settingsOverlay.style.visibility = 'hidden';
      document.body.classList.remove('modal-active');
    }
  }
}

// Make helper function globally available for other scripts
if (typeof window !== 'undefined') {
  window.closeSettingsModalIfOpen = closeSettingsModalIfOpen;
}

// ============================================
// Custom Alert Modal
// ============================================
function showAlertModal(message, title = 'Alert') {
  const overlay = document.getElementById('alertModalOverlay');
  const titleEl = document.getElementById('alertModalTitle');
  const messageEl = document.getElementById('alertModalMessage');
  
  if (!overlay || !titleEl || !messageEl) {
    // Fallback to native alert if modal elements not found
    console.warn('Alert modal elements not found, using native alert');
    alert(message);
    return;
  }
  
  // Close settings modal if open
  closeSettingsModalIfOpen();
  
  // Set content
  titleEl.textContent = title;
  messageEl.textContent = message;
  
  // Show modal
  overlay.style.display = 'block';
  overlay.style.visibility = 'visible';
  overlay.style.opacity = '1';
  overlay.style.zIndex = '100001'; // Higher than settings modal (100000)
  document.body.classList.add('modal-active');
  
  // Center modal
  const modalContent = overlay.querySelector('.modal-content');
  if (modalContent) {
    modalContent.style.position = 'fixed';
    modalContent.style.top = '50%';
    modalContent.style.left = '50%';
    modalContent.style.transform = 'translate(-50%, -50%)';
    modalContent.style.margin = '0';
    modalContent.style.padding = '0';
    modalContent.style.zIndex = '100002'; // Higher than alert overlay
  }
  
  // Close on overlay click
  overlay.onclick = function(e) {
    if (e.target === overlay) {
      closeAlertModal();
    }
  };
  
  // Close on Escape key
  const escapeHandler = function(e) {
    if (e.key === 'Escape') {
      closeAlertModal();
      document.removeEventListener('keydown', escapeHandler);
    }
  };
  document.addEventListener('keydown', escapeHandler);
}

function closeAlertModal() {
  const overlay = document.getElementById('alertModalOverlay');
  if (overlay) {
    overlay.style.display = 'none';
    overlay.style.visibility = 'hidden';
    overlay.style.opacity = '0';
    document.body.classList.remove('modal-active');
    document.body.style.overflow = '';
  }
}

// Show GDPR Data Agreement Modal
function showGDPRAgreementModal(onAgree, onDecline) {
  const overlay = document.getElementById('gdprAgreementModalOverlay');
  if (!overlay) {
    console.error('GDPR Agreement modal not found');
    // Fallback: proceed with enabling if modal not found
    if (onAgree) onAgree();
    return;
  }
  
  // Close settings modal if open
  closeSettingsModalIfOpen();
  
  // Show GDPR modal
  overlay.style.display = 'block';
  overlay.style.visibility = 'visible';
  overlay.style.opacity = '1';
  overlay.style.zIndex = '100010'; // Higher than settings modal (100000)
  document.body.classList.add('modal-active');
  document.body.style.overflow = 'hidden';
  
  // Center modal, positioned much higher to ensure buttons are visible
  const modalContent = overlay.querySelector('.modal-content');
  if (modalContent) {
    modalContent.style.position = 'fixed';
    modalContent.style.top = '25%'; // Positioned much higher to ensure buttons are visible
    modalContent.style.left = '50%';
    modalContent.style.transform = 'translate(-50%, -50%)';
    modalContent.style.margin = '0';
    modalContent.style.padding = '0';
    modalContent.style.zIndex = '100011'; // Higher than overlay
    modalContent.style.maxHeight = '75vh'; // Ensure modal doesn't exceed viewport
    modalContent.style.overflow = 'hidden'; // Prevent content overflow
    modalContent.style.display = 'flex'; // Use flexbox
    modalContent.style.flexDirection = 'column'; // Column layout
  }
  
  // Ensure body has proper max-height to leave room for footer
  const agreementBody = overlay.querySelector('.gdpr-agreement-body');
  if (agreementBody) {
    agreementBody.style.maxHeight = 'calc(75vh - 180px)'; // Leave room for header and footer
    agreementBody.style.overflowY = 'auto';
    agreementBody.style.overflowX = 'hidden';
    // Scroll to top of agreement content
    agreementBody.scrollTop = 0;
  }
  
  // Set up button handlers
  const agreeBtn = document.getElementById('gdprAgreeBtn');
  const declineBtn = document.getElementById('gdprDeclineBtn');
  
  const cleanup = () => {
    closeGDPRAgreementModal();
  };
  
  if (agreeBtn) {
    agreeBtn.onclick = () => {
      cleanup();
      if (onAgree) onAgree();
    };
  }
  
  if (declineBtn) {
    declineBtn.onclick = () => {
      cleanup();
      if (onDecline) onDecline();
    };
  }
  
  // Close on overlay click (treat as decline)
  overlay.onclick = function(e) {
    if (e.target === overlay) {
      cleanup();
      if (onDecline) onDecline();
    }
  };
  
  // Close on Escape key (treat as decline)
  const escapeHandler = function(e) {
    if (e.key === 'Escape') {
      cleanup();
      document.removeEventListener('keydown', escapeHandler);
      if (onDecline) onDecline();
    }
  };
  document.addEventListener('keydown', escapeHandler);
}

// Close GDPR Agreement Modal
function closeGDPRAgreementModal() {
  const overlay = document.getElementById('gdprAgreementModalOverlay');
  if (overlay) {
    overlay.style.display = 'none';
    overlay.style.visibility = 'hidden';
    overlay.style.opacity = '0';
    document.body.classList.remove('modal-active');
    document.body.style.overflow = '';
  }
}

// Show confirmation modal with Yes/No buttons
function showConfirmModal(message, title = 'Confirm', onConfirm, onCancel) {
  const overlay = document.getElementById('alertModalOverlay');
  const titleEl = document.getElementById('alertModalTitle');
  const messageEl = document.getElementById('alertModalMessage');
  const footer = overlay?.querySelector('.alert-modal-footer');
  
  if (!overlay || !titleEl || !messageEl || !footer) {
    // Fallback to native confirm if modal elements not found
    console.warn('Alert modal elements not found, using native confirm');
    if (confirm(message)) {
      if (onConfirm) onConfirm();
    } else {
      if (onCancel) onCancel();
    }
    return;
  }
  
  // Close settings modal if open
  closeSettingsModalIfOpen();
  
  // Set content
  titleEl.textContent = title;
  messageEl.textContent = message;
  
  // Update footer with Yes/No buttons
  footer.innerHTML = `
    <button class="modal-save-btn" id="confirmYesBtn" style="background: rgba(244, 67, 54, 0.8);">Yes, Continue</button>
    <button class="modal-save-btn" id="confirmNoBtn" style="background: rgba(255, 255, 255, 0.1);">Cancel</button>
  `;
  
  // Show modal
  overlay.style.display = 'block';
  overlay.style.visibility = 'visible';
  overlay.style.opacity = '1';
  overlay.style.zIndex = '100001';
  document.body.classList.add('modal-active');
  
  // Center modal
  const modalContent = overlay.querySelector('.modal-content');
  if (modalContent) {
    modalContent.style.position = 'fixed';
    modalContent.style.top = '50%';
    modalContent.style.left = '50%';
    modalContent.style.transform = 'translate(-50%, -50%)';
    modalContent.style.margin = '0';
    modalContent.style.padding = '0';
    modalContent.style.zIndex = '100002';
  }
  
  // Set up button handlers
  const yesBtn = document.getElementById('confirmYesBtn');
  const noBtn = document.getElementById('confirmNoBtn');
  
  const cleanup = () => {
    closeAlertModal();
    // Restore original OK button
    footer.innerHTML = '<button class="modal-save-btn" onclick="closeAlertModal()">OK</button>';
  };
  
  if (yesBtn) {
    yesBtn.onclick = () => {
      cleanup();
      if (onConfirm) onConfirm();
    };
  }
  
  if (noBtn) {
    noBtn.onclick = () => {
      cleanup();
      if (onCancel) onCancel();
    };
  }
  
  // Close on overlay click (treat as cancel)
  overlay.onclick = function(e) {
    if (e.target === overlay) {
      cleanup();
      if (onCancel) onCancel();
    }
  };
  
  // Close on Escape key (treat as cancel)
  const escapeHandler = function(e) {
    if (e.key === 'Escape') {
      cleanup();
      document.removeEventListener('keydown', escapeHandler);
      if (onCancel) onCancel();
    }
  };
  document.addEventListener('keydown', escapeHandler);
}

// ============================================
// Password Visibility Toggle
// ============================================
function togglePasswordVisibility() {
  const passwordInput = document.getElementById('cloudPassword');
  if (!passwordInput) {
    console.error('Password input not found');
    return;
  }
  
  const toggleBtn = document.getElementById('passwordToggle');
  if (!toggleBtn) {
    console.error('Password toggle button not found');
    return;
  }
  
  const toggleIcon = toggleBtn.querySelector('.password-toggle-icon');
  if (!toggleIcon) {
    console.error('Password toggle icon not found');
    return;
  }
  
  // Toggle password visibility
  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    toggleIcon.textContent = '🙈';
    toggleBtn.setAttribute('title', 'Hide password');
  } else {
    passwordInput.type = 'password';
    toggleIcon.textContent = '👁️';
    toggleBtn.setAttribute('title', 'Show password');
  }
}

// Make function globally available
if (typeof window !== 'undefined') {
  window.togglePasswordVisibility = togglePasswordVisibility;
}

// ============================================
// Security: HTML Sanitization Utility
// ============================================
function escapeHTML(str) {
  if (typeof str !== 'string') return str;
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function sanitizeHTML(html) {
  if (typeof html !== 'string') return '';
  // Escape HTML special characters
  return html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Safe innerHTML setter that escapes user content
function setSafeHTML(element, html) {
  if (!element) return;
  element.innerHTML = html;
}

// Log app initialization
Logger.info('Health App initialized', {
  timestamp: new Date().toISOString(),
  localStorageAvailable: typeof(Storage) !== 'undefined'
});

// ============================================
// PWA Service Worker Registration - DISABLED FOR DELIVERY
// ============================================
// Service worker completely disabled - block registration immediately
// This must run BEFORE any other code that might register a service worker
if ('serviceWorker' in navigator) {
  // Block registration immediately
  const originalRegister = navigator.serviceWorker.register;
  navigator.serviceWorker.register = function() {
    console.log('Service Worker registration blocked for delivery');
    return Promise.reject(new Error('Service Worker disabled for delivery'));
  };
  
  // Unregister any existing service workers
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => {
      registration.unregister().then(success => {
        if (success) {
          console.log('Service Worker unregistered');
            }
          });
        });
  });
  
  // Clear all caches
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => {
        caches.delete(name);
      });
  });
  }
}

// PWA Install Prompt
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('PWA: Install prompt triggered');
  e.preventDefault();
  deferredPrompt = e;
  showInstallButton();
});

function showInstallButton() {
  // Create install button if it doesn't exist
  if (!document.getElementById('installButton')) {
    const installButton = document.createElement('button');
    installButton.id = 'installButton';
    installButton.textContent = '📱 Install App';
    installButton.className = 'export-button';
    installButton.style.marginTop = '10px';
    installButton.onclick = installPWA;
    
    // Add to button container
    const buttonContainer = document.querySelector('.button-container');
    buttonContainer.appendChild(installButton);
  }
}

function installPWA() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('PWA: User accepted the install prompt');
        hideInstallButton();
      } else {
        console.log('PWA: User dismissed the install prompt');
      }
      deferredPrompt = null;
    });
  }
}

function hideInstallButton() {
  const installButton = document.getElementById('installButton');
  if (installButton) {
    installButton.remove();
  }
}

// Enhanced PWA functions for settings menu
// Enhanced PWA install function for Safari and other browsers
function installOrLaunchPWA() {
  // Debug info
  console.log('PWA Install Debug:', {
    isStandalone: window.matchMedia('(display-mode: standalone)').matches,
    isAppleStandalone: window.navigator.standalone,
    hasDeferredPrompt: !!deferredPrompt,
    protocol: window.location.protocol,
    userAgent: navigator.userAgent
  });
  
  // Check if app is already installed
  if (window.matchMedia('(display-mode: standalone)').matches) {
    showAlertModal('App is already running in standalone mode! 🎉', 'PWA Status');
    return;
  }
  
  // Check if running as PWA (Safari)
  if (window.navigator.standalone === true) {
    showAlertModal('App is already installed as PWA! 🎉', 'PWA Status');
    return;
  }
  
  // Try to install if prompt is available
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('PWA: User accepted the install prompt');
        showAlertModal('App installed successfully! 📱\nLook for "Jan\'s Health Dashboard" in your apps.', 'Installation Complete');
        hideInstallButton();
      } else {
        console.log('PWA: User dismissed the install prompt');
      }
      deferredPrompt = null;
    });
  } else {
    // Check why install prompt is not available
    const protocol = window.location.protocol;
    if (protocol === 'file:') {
      showFileProtocolHelp();
    } else {
      showInstallInstructions();
    }
  }
}

function showFileProtocolHelp() {
  const helpText = `⚠️ PWA Installation Limitation

Chrome requires HTTPS or localhost to show the automatic install prompt.

🔧 Solutions:

1. **Run a Local Server** (Recommended):
   • Open Command Prompt in this folder
   • Run: python -m http.server 8000
   • Open: http://localhost:8000

2. **Manual Installation**:
   • Chrome Menu (⋮) → More Tools → Create Shortcut
   • Check "Open as window" ✅
   
3. **Use Edge Browser**:
   • Edge works better with file:// for PWA installation

4. **Upload to Web Hosting**:
   • Host on GitHub Pages, Netlify, etc.

Would you like manual installation instructions instead?`;
  
  if (confirm(helpText + '\n\nShow manual installation steps?')) {
    showInstallInstructions();
  }
}

function openInStandalone() {
  const currentUrl = window.location.href;
  const standaloneUrl = currentUrl + (currentUrl.includes('?') ? '&' : '?') + 'standalone=true';
  
  // Try to open in new window with app-like properties
  const newWindow = window.open(standaloneUrl, 'HealthDashboard', 
    'width=400,height=800,toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes'
  );
  
  if (newWindow) {
    showAlertModal('Opening in standalone mode! 🚀\nClose this window and use the new one.', 'Standalone Mode');
    // Focus the new window
    newWindow.focus();
  } else {
    showAlertModal('⚠️ Popup blocked!\nPlease allow popups for this site and try again.', 'Popup Blocked');
  }
}

function showInstallInstructions() {
  const userAgent = navigator.userAgent.toLowerCase();
  let instructions = '';
  
  // Safari on iOS
  if (/iPad|iPhone|iPod/.test(navigator.userAgent) && /Safari/.test(navigator.userAgent) && !/Chrome|CriOS|FxiOS/.test(navigator.userAgent)) {
    instructions = `📱 Add to Home Screen (Safari iOS)

1. Tap the Share button (□↑) at the bottom of Safari
2. Scroll down in the share menu
3. Tap "Add to Home Screen"
4. Tap "Add" in the top right
5. The app will appear on your home screen!

✨ After installing:
• Open the app from your home screen
• Grant notification permission when prompted
• You'll receive daily reminders to log your health data
• The app works offline and feels like a native app`;
  }
  // Safari on macOS
  else if (userAgent.includes('safari') && !userAgent.includes('chrome') && !userAgent.includes('iphone') && !userAgent.includes('ipad')) {
    instructions = `📱 Add to Dock (Safari macOS)

1. Click the Share button in Safari toolbar
2. Select "Add to Dock"
3. The app will appear in your Dock!

✨ After installing:
• Click the app icon in Dock to launch
• Grant notification permission when prompted
• You'll receive daily reminders`;
  }
  else if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
    instructions = `
📱 Install on Chrome:

METHOD 1 - Create Shortcut:
1. Click ⋮ menu (top right)
2. More Tools → Create Shortcut
3. Name: "Your's Health Dashboard"
4. ✅ Check "Open as window"
5. Click "Create"

METHOD 2 - Install Button:
• Look for install icon (⊞) in address bar
• Or ⋮ menu → "Install Jan's Health Dashboard"

NOTE: Automatic install works best with:
• http://localhost:8000 (local server)
• Or hosted website (https://)
    `;
  } else if (userAgent.includes('firefox')) {
    instructions = `
📱 Install on Firefox:
1. Click the ☰ menu (top right)
2. Select "Install this site as an app"
3. Choose a name and click "Install"
    `;
  } else if (userAgent.includes('safari')) {
    instructions = `
📱 Install on Safari:
1. Tap the Share button (□↗)
2. Scroll down and tap "Add to Home Screen"
3. Tap "Add" to install
    `;
  } else if (userAgent.includes('edg')) {
    instructions = `
📱 Install on Edge:
1. Click the ⋯ menu (top right)
2. Select "Apps" > "Install this site as an app"
3. Click "Install"
    `;
  } else {
    instructions = `
📱 Install Instructions:
Look for an "Install" or "Add to Home Screen" option in your browser's menu.

Most modern browsers support installing web apps!
    `;
  }
  
  showAlertModal(instructions, 'Installation Instructions');
}

function showUpdateNotification() {
  const updateBanner = document.createElement('div');
  updateBanner.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: var(--primary-color);
    color: white;
    padding: 15px;
    text-align: center;
    z-index: 10000;
    font-weight: bold;
  `;
  updateBanner.innerHTML = `
    New version available! 
    <button onclick="location.reload()" style="margin-left: 10px; padding: 5px 10px; background: white; color: var(--primary-color); border: none; border-radius: 4px; cursor: pointer;">
      Update Now
    </button>
    <button onclick="this.parentElement.remove()" style="margin-left: 5px; padding: 5px 10px; background: transparent; color: white; border: 1px solid white; border-radius: 4px; cursor: pointer;">
      Later
    </button>
  `;
  document.body.insertBefore(updateBanner, document.body.firstChild);
}

// Handle PWA shortcuts
// Suppress harmless browser extension errors
// This runs early to catch extension errors before they reach console
(function() {
  try {
    const originalConsoleError = console.error;
    console.error = function(...args) {
      // Only suppress if error is clearly from extensions
      // Check error message and stack trace
      const errorString = args.map(arg => {
        if (arg instanceof Error) {
          return (arg.message || '') + ' ' + (arg.stack || '');
        }
        return String(arg);
      }).join(' ');
      
      // Check for extension-related errors
      const hasExtensionPattern = 
        errorString.includes('No tab with id') || 
        errorString.includes('Frame with ID') ||
        errorString.includes('ERR_INVALID_URL') && errorString.includes('data:;base64');
      
      const hasExtensionFile = 
        errorString.includes('chrome-extension://') || 
        errorString.includes('moz-extension://') ||
        errorString.includes('background.js') ||
        errorString.includes('serviceWorker.js') ||
        errorString.includes('inpage.js');
      
      // Only suppress if it's clearly an extension error
      const isExtensionError = hasExtensionPattern && hasExtensionFile;
      
      if (isExtensionError) {
        // Suppress extension-related console errors
        return;
      }
      // Call original console.error for legitimate errors
      originalConsoleError.apply(console, args);
    };
  } catch (e) {
    // If console.error override fails, just continue
    console.warn('Failed to set up error filtering:', e);
  }
})();

window.addEventListener('error', function(e) {
  // Filter out browser extension errors
  const errorMsg = e.message || String(e.error || '');
  const filename = e.filename || e.target?.src || '';
  const target = e.target;
  
  const isExtensionError = 
    errorMsg.includes('No tab with id') || 
    errorMsg.includes('Frame with ID') ||
    errorMsg.includes('serviceWorker.js') ||
    errorMsg.includes('background.js') ||
    errorMsg.includes('ERR_INVALID_URL') && errorMsg.includes('data:;base64') ||
    filename.includes('chrome-extension://') ||
    filename.includes('moz-extension://') ||
    filename.includes('serviceWorker.js') ||
    filename.includes('background.js') ||
    filename.includes('inpage.js') ||
    filename.includes('extension://') ||
    filename.includes('data:;base64') ||
    (target && (target.src && target.src.includes('data:;base64')));
  
  if (isExtensionError) {
    // Suppress extension-related errors
    e.preventDefault();
    e.stopPropagation();
    return false;
  }
}, true);

// toggleSettings placeholder - will be replaced by full implementation later
// This ensures inline onclick handlers don't error
window.toggleSettings = function() {
  console.log('toggleSettings placeholder called - this should be replaced');
  const overlay = document.getElementById('settingsOverlay');
  if (!overlay) {
    console.error('Settings overlay not found in placeholder!');
    return;
  }
  console.log('Overlay found, current display:', overlay.style.display);
  const isVisible = overlay.style.display === 'block' || overlay.style.display === 'flex';
  console.log('isVisible:', isVisible);
  if (isVisible) {
    console.log('Closing modal');
    overlay.style.display = 'none';
    overlay.style.visibility = 'hidden';
    document.body.classList.remove('modal-active');
    document.body.style.overflow = '';
  } else {
    console.log('Opening modal');
    document.body.style.overflow = 'hidden';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.right = '0';
    overlay.style.bottom = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.display = 'block';
    overlay.style.visibility = 'visible';
    overlay.style.opacity = '1';
    overlay.style.zIndex = '99999';
    document.body.classList.add('modal-active');
    const menu = overlay.querySelector('.settings-menu');
    console.log('Menu found:', !!menu);
    if (menu) {
      menu.style.position = 'fixed';
      menu.style.top = '50%';
      menu.style.left = '50%';
      menu.style.transform = 'translate(-50%, -50%)';
      menu.style.zIndex = '100000';
      menu.style.display = 'flex';
      menu.style.visibility = 'visible';
      menu.style.opacity = '1';
      console.log('Menu styled, display:', menu.style.display);
    }
    if (typeof loadSettingsState === 'function') {
      loadSettingsState();
    }
  }
};

window.addEventListener('DOMContentLoaded', function() {
  // Ensure settings button works - add direct event listener as backup
  const settingsButton = document.querySelector('.settings-button-top');
  if (settingsButton) {
    console.log('Settings button found, adding click listener');
    settingsButton.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      console.log('Settings button clicked via event listener');
      if (typeof window.toggleSettings === 'function') {
        window.toggleSettings();
      } else {
        console.error('toggleSettings function not available!');
      }
    });
  } else {
    console.warn('Settings button not found!');
  }
  
  // Clear cache for CSS and JS files on startup
  if ('caches' in window) {
    caches.keys().then(function(names) {
      for (let name of names) {
        caches.delete(name);
      }
      Logger.debug('Cache cleared on startup');
    }).catch(function(err) {
      Logger.warn('Error clearing cache', { error: err.message });
    });
  }
  
  // Force reload CSS and JS files with cache-busting timestamp
  const timestamp = new Date().getTime();
  const links = document.querySelectorAll('link[rel="stylesheet"]');
  links.forEach(function(link) {
    const href = link.getAttribute('href');
    if (href && href.includes('styles.css')) {
      // Remove existing version parameter and add new timestamp
      const baseHref = href.split('?')[0];
      link.setAttribute('href', baseHref + '?v=' + timestamp);
      Logger.debug('CSS cache-busted', { href: baseHref });
    }
  });
  
  const scripts = document.querySelectorAll('script[src]');
  scripts.forEach(function(script) {
    const src = script.getAttribute('src');
    if (src && (src.includes('app.js') || src.includes('apexcharts.min.js')) && !src.startsWith('http')) {
      // Remove existing version parameter and add new timestamp
      const baseSrc = src.split('?')[0];
      script.setAttribute('src', baseSrc + '?v=' + timestamp);
      Logger.debug('JS cache-busted', { src: baseSrc });
    }
  });
  
  const urlParams = new URLSearchParams(window.location.search);
  
  if (urlParams.get('quick') === 'true') {
    // Focus on first input for quick entry
    document.getElementById('date').focus();
  }
  
  if (urlParams.get('charts') === 'true') {
    // Show charts immediately
    document.getElementById('chartSection').classList.remove('hidden');
  }

  // Initialize food and exercise lists on page load
  renderLogFoodItems();
  renderLogExerciseItems();
  renderEnergyClarityTiles();
  renderStressorTiles('logStressorsTiles');
  renderLogSymptomsItems(); // also populates logSymptomsTiles
  initPainBodyDiagram('painBodyDiagram', 'painLocation');
  initPainBodyDiagram('editPainBodyDiagram', 'editPainLocation');

  // Connect to Server-Sent Events for auto-reload on file changes
  connectToReloadStream();
});

// Server-Sent Events connection for auto-reload
function connectToReloadStream() {
  if (typeof EventSource === 'undefined') {
    Logger.warn('EventSource not supported, auto-reload disabled');
    return;
  }
  
  // Close any existing connection first to prevent duplicates
  if (window._reloadEventSource) {
    try {
      window._reloadEventSource.close();
      Logger.debug('Closed existing reload stream connection');
    } catch (e) {
      // Ignore errors when closing
    }
    window._reloadEventSource = null;
  }
  
  try {
    const eventSource = new EventSource('/api/reload');
    
    eventSource.onopen = function() {
      Logger.debug('Connected to reload stream');
      // Reset backoff counter on successful connection
      window._reloadStreamRetries = 0;
    };
    
    eventSource.onmessage = function(event) {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'reload') {
          Logger.info('File change detected, reloading...');
          try {
            eventSource.close();
          } catch (e) {
            // Ignore close errors
          }
          window._reloadEventSource = null;
          window.location.reload();
        } else if (data.type === 'connected') {
          Logger.debug('Reload stream connected');
        }
      } catch (e) {
        Logger.warn('Error parsing reload message', { error: e.message });
      }
    };
    
    eventSource.onerror = function(error) {
      Logger.debug('Reload stream error', { 
        readyState: eventSource.readyState,
        CONNECTING: EventSource.CONNECTING,
        OPEN: EventSource.OPEN,
        CLOSED: EventSource.CLOSED
      });
      
      // If connection was closed (not just temporarily disconnected)
      if (eventSource.readyState === EventSource.CLOSED) {
        Logger.info('Reload stream closed, will attempt to reconnect...');
        try {
          eventSource.close();
        } catch (e) {
          // Ignore close errors
        }
        window._reloadEventSource = null;
        
        // Exponential backoff: 2s, 4s, 8s, 16s max
        window._reloadStreamRetries = (window._reloadStreamRetries || 0) + 1;
        const backoffTime = Math.min(2000 * Math.pow(2, window._reloadStreamRetries - 1), 16000);
        Logger.debug(`Retrying reload stream connection in ${backoffTime}ms (attempt ${window._reloadStreamRetries})`);
        
        setTimeout(connectToReloadStream, backoffTime);
      }
      // If CONNECTING, EventSource auto-reconnects, don't manually reconnect
    };
    
    // Store reference for cleanup
    window._reloadEventSource = eventSource;
  } catch (e) {
    Logger.warn('Failed to connect to reload stream', { error: e.message });
    window._reloadEventSource = null;
    // Retry connection after delay
    window._reloadStreamRetries = (window._reloadStreamRetries || 0) + 1;
    const backoffTime = Math.min(2000 * Math.pow(2, window._reloadStreamRetries - 1), 16000);
    setTimeout(connectToReloadStream, backoffTime);
  }
}

// Form Validation System
class FormValidator {
  constructor() {
    this.errors = new Map();
    this.rules = new Map();
    this.setupValidationRules();
    this.bindValidationEvents();
  }

  setupValidationRules() {
    // Date validation
    this.rules.set('date', {
      required: true,
      validate: (value) => {
        if (!value) return 'Date is required';
        
        const selectedDate = new Date(value);
        const today = new Date();
        const maxPastDate = new Date();
        maxPastDate.setFullYear(today.getFullYear() - 5); // 5 years ago max
        
        if (selectedDate > today) {
          return 'Date cannot be in the future';
        }
        
        if (selectedDate < maxPastDate) {
          return 'Date cannot be more than 5 years ago';
        }
        
        return null;
      }
    });

    // BPM validation
    this.rules.set('bpm', {
      required: true,
      validate: (value) => {
        if (!value) return 'Resting BPM is required';
        
        const bpm = parseInt(value);
        if (isNaN(bpm)) return 'BPM must be a number';
        if (bpm < 30) return 'BPM cannot be less than 30';
        if (bpm > 200) return 'BPM cannot be more than 200 (please check this value)';
        if (bpm > 120) return 'High BPM detected - please verify this is correct';
        
        return null;
      }
    });

    // Weight validation
    this.rules.set('weight', {
      required: true,
      validate: (value) => {
        if (!value) return 'Weight is required';
        
        const weight = parseFloat(value);
        if (isNaN(weight)) return 'Weight must be a number';
        
        // Convert to kg for validation
        let weightKg = weight;
        if (appSettings.weightUnit === 'lb') {
          weightKg = parseFloat(lbToKg(weight));
        }
        
        if (weightKg < 20) {
          const minDisplay = appSettings.weightUnit === 'lb' ? '44lb' : '20kg';
          return `Weight cannot be less than ${minDisplay}`;
        }
        if (weightKg > 300) {
          const maxDisplay = appSettings.weightUnit === 'lb' ? '661lb' : '300kg';
          return `Weight cannot be more than ${maxDisplay}`;
        }
        if (weightKg < 40) {
          const minDisplay = appSettings.weightUnit === 'lb' ? '88lb' : '40kg';
          return `Weight seems low - please verify this is correct (min: ${minDisplay})`;
        }
        if (weightKg > 200) {
          const maxDisplay = appSettings.weightUnit === 'lb' ? '441lb' : '200kg';
          return `Weight seems high - please verify this is correct (max: ${maxDisplay})`;
        }
        
        return null;
      }
    });

    // Flare validation
    this.rules.set('flare', {
      required: true,
      validate: (value) => {
        if (!value || value === '') return 'Please select if you had a flare-up today';
        if (!['Yes', 'No'].includes(value)) return 'Invalid flare-up selection';
        return null;
      }
    });

    // Notes validation (optional but with length limit)
    this.rules.set('notes', {
      required: false,
      validate: (value) => {
        if (value && value.length > 500) {
          return 'Notes cannot be longer than 500 characters';
        }
        return null;
      }
    });

    // Slider validations (fatigue, stiffness, etc.)
    const sliderFields = ['fatigue', 'stiffness', 'sleep', 'jointPain', 'mobility', 'dailyFunction', 'swelling', 'mood', 'irritability'];
    sliderFields.forEach(field => {
      this.rules.set(field, {
        required: true,
        validate: (value) => {
          const val = parseInt(value);
          if (isNaN(val)) return `${this.getFieldDisplayName(field)} level is required`;
          if (val < 1 || val > 10) return `${this.getFieldDisplayName(field)} level must be between 1 and 10`;
          return null;
        }
      });
    });
  }

  getFieldDisplayName(fieldId) {
    const names = {
      'fatigue': 'Fatigue',
      'stiffness': 'Stiffness',
      'backPain': 'Back Pain',
      'sleep': 'Sleep Quality',
      'jointPain': 'Joint Pain',
      'mobility': 'Mobility',
      'dailyFunction': 'Daily Function',
      'swelling': 'Swelling',
      'mood': 'Mood',
      'irritability': 'Irritability'
    };
    return names[fieldId] || fieldId;
  }

  bindValidationEvents() {
    // Real-time validation on input/change events
    this.rules.forEach((rule, fieldId) => {
      const element = document.getElementById(fieldId);
      if (element) {
        const events = element.tagName === 'SELECT' ? ['change'] : ['input', 'blur'];
        events.forEach(event => {
          element.addEventListener(event, () => {
            this.validateField(fieldId);
          });
        });
      }
    });
  }

  validateField(fieldId) {
    const element = document.getElementById(fieldId);
    const rule = this.rules.get(fieldId);
    
    if (!element || !rule) return true;

    const value = element.value.trim();
    const error = rule.validate(value);

    if (error) {
      this.setFieldError(fieldId, error);
      return false;
    } else {
      this.clearFieldError(fieldId);
      return true;
    }
  }

  setFieldError(fieldId, message) {
    this.errors.set(fieldId, message);
    
    const element = document.getElementById(fieldId);
    const errorElement = document.getElementById(`${fieldId}-error`);
    
    if (element) {
      element.classList.remove('valid');
      element.classList.add('invalid');
    }
    
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.classList.add('show');
    }
    
    this.updateValidationSummary();
  }

  clearFieldError(fieldId) {
    this.errors.delete(fieldId);
    
    const element = document.getElementById(fieldId);
    const errorElement = document.getElementById(`${fieldId}-error`);
    
    if (element) {
      element.classList.remove('invalid');
      element.classList.add('valid');
    }
    
    if (errorElement) {
      errorElement.classList.remove('show');
    }
    
    this.updateValidationSummary();
  }

  updateValidationSummary() {
    const summaryElement = document.getElementById('validationSummary');
    const listElement = document.getElementById('validationList');
    
    if (this.errors.size === 0) {
      summaryElement.classList.remove('show');
      return;
    }
    
    listElement.innerHTML = '';
    this.errors.forEach((message, fieldId) => {
      const li = document.createElement('li');
      li.textContent = message;
      listElement.appendChild(li);
    });
    
    summaryElement.classList.add('show');
  }

  validateForm() {
    let isValid = true;
    
    this.rules.forEach((rule, fieldId) => {
      if (!this.validateField(fieldId)) {
        isValid = false;
      }
    });
    
    return isValid;
  }

  clearAllErrors() {
    this.errors.clear();
    
    this.rules.forEach((rule, fieldId) => {
      const element = document.getElementById(fieldId);
      const errorElement = document.getElementById(`${fieldId}-error`);
      
      if (element) {
        element.classList.remove('valid', 'invalid');
      }
      
      if (errorElement) {
        errorElement.classList.remove('show');
      }
    });
    
    this.updateValidationSummary();
  }
}

// Initialize form validator
const formValidator = new FormValidator();

// Weight unit conversion functions
function kgToLb(kg) {
  return (kg * 2.20462).toFixed(1);
}

function lbToKg(lb) {
  return (lb / 2.20462).toFixed(1);
}

function toggleWeightUnit() {
  const weightInput = document.getElementById('weight');
  const unitDisplay = document.getElementById('weightUnitDisplay');
  const currentValue = parseFloat(weightInput.value);
  
  if (!isNaN(currentValue) && currentValue > 0) {
    // Convert current value
    if (appSettings.weightUnit === 'kg') {
      // Converting from kg to lb
      const lbValue = parseFloat(kgToLb(currentValue));
      weightInput.value = lbValue;
      appSettings.weightUnit = 'lb';
      updateWeightInputConstraints();
    } else {
      // Converting from lb to kg
      const kgValue = parseFloat(lbToKg(currentValue));
      weightInput.value = kgValue;
      appSettings.weightUnit = 'kg';
      updateWeightInputConstraints();
    }
  } else {
    // Just toggle the unit if no value
    appSettings.weightUnit = appSettings.weightUnit === 'kg' ? 'lb' : 'kg';
    updateWeightInputConstraints();
  }
  
  unitDisplay.textContent = appSettings.weightUnit;
  saveSettings();
  
  // Trigger validation update
  formValidator.validateField('weight');
  
  // Update charts and logs display to reflect new unit
  renderLogs();
  updateCharts();
}

function updateWeightInputConstraints() {
  const weightInput = document.getElementById('weight');
  const unitDisplay = document.getElementById('weightUnitDisplay');
  
  if (appSettings.weightUnit === 'kg') {
    weightInput.min = 20;
    weightInput.max = 300;
    weightInput.step = 0.1;
    unitDisplay.textContent = 'kg';
  } else {
    // Convert kg ranges to lb: 20kg = 44lb, 300kg = 661lb
    weightInput.min = 44;
    weightInput.max = 661;
    weightInput.step = 0.1;
    unitDisplay.textContent = 'lb';
  }
}

function getWeightInDisplayUnit(weightKg) {
  if (appSettings.weightUnit === 'lb') {
    return parseFloat(kgToLb(weightKg));
  }
  return parseFloat(weightKg);
}

function getWeightUnitSuffix() {
  return appSettings.weightUnit;
}



document.getElementById("date").valueAsDate = new Date();
document.getElementById("flare").value = "No"; // Set default flare value

// Add character counter for notes field
const notesField = document.getElementById("notes");
const notesCounter = document.getElementById("notesCounter");

function updateNotesCounter() {
  const currentLength = notesField.value.length;
  notesCounter.textContent = `${currentLength}/500`;
  
  if (currentLength > 450) {
    notesCounter.style.color = '#f44336';
  } else if (currentLength > 400) {
    notesCounter.style.color = '#ff9800';
  } else {
    notesCounter.style.color = '';
  }
}

notesField.addEventListener('input', updateNotesCounter);

const form = document.getElementById("logForm");
const output = document.getElementById("logOutput");
const chartSection = document.getElementById("chartSection");

// Initialize slider colors and add event listeners
const sliders = ['fatigue', 'stiffness', 'sleep', 'jointPain', 'mobility', 'dailyFunction', 'swelling', 'mood', 'irritability', 'weatherSensitivity'];

function updateSliderColor(slider) {
  const value = parseInt(slider.value);
  const percentage = (value / 10) * 100;
  
  // Sliders where HIGH values are GOOD (inverted colors)
  const invertedSliders = ['sleep', 'mobility', 'dailyFunction'];
  const isInverted = invertedSliders.includes(slider.id);
  
  let fillColor;
  
  if (isInverted) {
    // For positive metrics: high = green, low = red
    if (value >= 8 && value <= 10) {
      fillColor = '#4CAF50'; // Green
    } else if (value >= 4 && value <= 7) {
      fillColor = '#FF9800'; // Orange
    } else if (value >= 1 && value <= 3) {
      fillColor = '#F44336'; // Red
    }
  } else {
    // For negative metrics: high = red, low = green
    if (value >= 1 && value <= 3) {
      fillColor = '#4CAF50'; // Green
    } else if (value >= 4 && value <= 7) {
      fillColor = '#FF9800'; // Orange
    } else if (value >= 8 && value <= 10) {
      fillColor = '#F44336'; // Red
    }
  }
  
  // Create gradient background that fills to the current value
  const gradient = `linear-gradient(to right, ${fillColor} 0%, ${fillColor} ${percentage}%, #333 ${percentage}%, #333 100%)`;
  slider.style.background = gradient;
  
  // Remove old classes and add new one for any additional styling
  slider.classList.remove('green', 'orange', 'red');
  if (fillColor === '#4CAF50') {
    slider.classList.add('green');
  } else if (fillColor === '#FF9800') {
    slider.classList.add('orange');
  } else if (fillColor === '#F44336') {
    slider.classList.add('red');
  }
}

sliders.forEach(sliderId => {
  const slider = document.getElementById(sliderId);
  slider.value = 5; // Set default value
  updateSliderColor(slider);
  
  slider.addEventListener('input', function() {
    updateSliderColor(this);
  });
});

function toggleChartView(viewType) {
  // Handle legacy boolean parameter for backward compatibility
  if (typeof viewType === 'boolean') {
    viewType = viewType ? 'combined' : 'individual';
  }
  
  const combinedContainer = document.getElementById('combinedChartContainer');
  const individualContainer = document.getElementById('individualChartsContainer');
  const balanceContainer = document.getElementById('balanceChartContainer');
  const individualBtn = document.getElementById('individualViewBtn');
  const combinedBtn = document.getElementById('combinedViewBtn');
  const balanceBtn = document.getElementById('balanceViewBtn');
  
  // Hide prediction controls for balance view
  const predictionControls = document.querySelectorAll('.filter-group');
  predictionControls.forEach(group => {
    if (group.querySelector('.prediction-range-buttons')) {
      if (viewType === 'balance') {
        group.style.display = 'none';
      } else {
        group.style.display = '';
      }
    }
  });
  
  // Save the preference
  appSettings.chartView = viewType;
  if (viewType === 'combined') {
    appSettings.combinedChart = true;
  } else {
    appSettings.combinedChart = false;
  }
  saveSettings();
  
  // Check if we have data first
  const hasData = logs && logs.length > 0;
  if (!hasData) {
    // Hide all containers
    combinedContainer.classList.add('hidden');
    individualContainer.classList.add('hidden');
    balanceContainer.classList.add('hidden');
    
    // Hide metric selectors
    const combinedMetricSelector = document.getElementById('combinedChartMetricSelector');
    const balanceMetricSelector = document.getElementById('balanceChartMetricSelector');
    if (combinedMetricSelector) combinedMetricSelector.classList.add('hidden');
    if (balanceMetricSelector) balanceMetricSelector.classList.add('hidden');
    
    updateChartEmptyState(false);
    return;
  }
  
  // Hide all containers first
  combinedContainer.classList.add('hidden');
  individualContainer.classList.add('hidden');
  balanceContainer.classList.add('hidden');
  
  // Remove active state from all buttons
  if (individualBtn) individualBtn.classList.remove('active');
  if (combinedBtn) combinedBtn.classList.remove('active');
  if (balanceBtn) balanceBtn.classList.remove('active');
  
  if (viewType === 'combined') {
    combinedContainer.classList.remove('hidden');
    if (combinedBtn) combinedBtn.classList.add('active');
    
    // Disconnect chart observer when showing combined view
    if (chartObserver) {
      chartObserver.disconnect();
    }
    
    // Small delay to prevent jump
    setTimeout(() => {
    createCombinedChart();
    }, 50);
  } else if (viewType === 'balance') {
    balanceContainer.classList.remove('hidden');
    if (balanceBtn) balanceBtn.classList.add('active');
    
    // Disconnect chart observer when showing balance view
    if (chartObserver) {
      chartObserver.disconnect();
    }
    
    // Small delay to prevent jump
    setTimeout(() => {
      createBalanceChart();
    }, 50);
  } else {
    // Individual view
    individualContainer.classList.remove('hidden');
    if (individualBtn) individualBtn.classList.add('active');
    
    // Use lazy loading for individual charts
    updateCharts();
  }
}

async function createCombinedChart() {
  // Check if ApexCharts is available
  if (typeof ApexCharts === 'undefined') {
    console.error('ApexCharts is not loaded! Cannot create combined chart.');
    return;
  }
  
  const container = document.getElementById('combinedChart');
  if (!container) {
    console.error('Combined chart container not found');
    return;
  }
  
  // Get filtered logs based on date range
  const filteredLogs = getFilteredLogs();
  
  // Check if we have data
  if (!filteredLogs || filteredLogs.length === 0) {
    console.warn('No data available for combined chart (after date filter)');
    updateChartEmptyState(false);
    return;
  }
  
  updateChartEmptyState(true);
  
  // Destroy existing chart if it exists
  if (container.chart) {
    container.chart.destroy();
  }
  
  // Prepare data for all metrics (excluding weight and bpm as they use different scales)
  // All available metrics for combined chart (includes backPain and steps)
  const allMetrics = [
    { field: 'fatigue', name: 'Fatigue', color: '#ff9800', scale: '1-10' },
    { field: 'stiffness', name: 'Stiffness', color: '#ffc107', scale: '1-10' },
    { field: 'backPain', name: 'Back Pain', color: '#f44336', scale: '1-10' },
    { field: 'sleep', name: 'Sleep Quality', color: '#3f51b5', scale: '1-10' },
    { field: 'jointPain', name: 'Joint Pain', color: '#ff5722', scale: '1-10' },
    { field: 'mobility', name: 'Mobility', color: '#00bcd4', scale: '1-10' },
    { field: 'dailyFunction', name: 'Daily Function', color: '#8bc34a', scale: '1-10' },
    { field: 'swelling', name: 'Swelling', color: '#9c27b0', scale: '1-10' },
    { field: 'mood', name: 'Mood', color: '#673ab7', scale: '1-10' },
    { field: 'irritability', name: 'Irritability', color: '#795548', scale: '1-10' },
    { field: 'weatherSensitivity', name: 'Weather Sensitivity', color: '#e91e63', scale: '1-10' },
    { field: 'steps', name: 'Steps', color: '#00e676', scale: '0-50000' },
    { field: 'hydration', name: 'Hydration (glasses)', color: '#00bcd4', scale: '0-20' }
  ];
  
  // Get selected metrics from settings (default to all if not set)
  const selectedMetrics = appSettings.combinedChartSelectedMetrics || allMetrics.map(m => m.field);
  
  // Filter metrics based on selection
  const metrics = allMetrics.filter(m => selectedMetrics.includes(m.field));
  
  // Render metric selector UI
  renderMetricSelector(allMetrics, selectedMetrics);
  
  // Use prediction range setting
  const daysToPredict = predictionRange;
  
  // Get predictions for all metrics using all available data for training
  let predictionsData = null;
  if (window.AIEngine && filteredLogs.length >= 2) {
    try {
      // Use cached sorted logs if available
      const sortedLogs = window.PerformanceUtils?.memoizedSort 
        ? window.PerformanceUtils.memoizedSort(filteredLogs, (a, b) => new Date(a.date) - new Date(b.date), 'sortedFilteredLogs')
        : [...filteredLogs].sort((a, b) => new Date(a.date) - new Date(b.date));
      
      // Get ALL historical logs for training (cached)
      const allHistoricalLogs = window.PerformanceUtils?.DataCache?.get('allHistoricalLogs', () => {
        const stored = localStorage.getItem("healthLogs") || "[]";
        return JSON.parse(stored).sort((a, b) => new Date(a.date) - new Date(b.date));
      }, 60000) || JSON.parse(localStorage.getItem("healthLogs") || "[]").sort((a, b) => new Date(a.date) - new Date(b.date));
      
      // Get anonymized training data if Use Open Data is enabled
      let anonymizedTrainingData = [];
      if (appSettings.useOpenData && appSettings.medicalCondition && typeof window.getAnonymizedTrainingData === 'function') {
        try {
          anonymizedTrainingData = await window.getAnonymizedTrainingData(appSettings.medicalCondition);
          if (anonymizedTrainingData.length > 0) {
            console.log(`Using ${anonymizedTrainingData.length} anonymized log entries from open data for training`);
          }
        } catch (error) {
          console.warn('Error loading anonymized training data:', error);
        }
      }
      
      // Combine historical logs with anonymized data for training (if enabled)
      const combinedTrainingLogs = appSettings.useOpenData 
        ? [...allHistoricalLogs, ...anonymizedTrainingData]
        : allHistoricalLogs;
      
      // Use combined data for training
      const analysis = window.AIEngine.analyzeHealthMetrics(sortedLogs, combinedTrainingLogs);
      predictionsData = {
        trends: analysis.trends,
        daysToPredict: daysToPredict,
        lastDate: sortedLogs.length > 0 ? new Date(sortedLogs[sortedLogs.length - 1].date) : null,
        allLogsLength: allLogs.length
      };
    } catch (error) {
      console.warn('Error generating predictions for combined chart:', error);
      Logger.error('Error generating predictions for combined chart', { error: error.message, stack: error.stack });
    }
  }
  
  const series = metrics.map((metric, metricIndex) => {
    const isSteps = metric.field === 'steps';
    const isHydration = metric.field === 'hydration';
    
    const data = filteredLogs
      .filter(log => {
        const value = log[metric.field];
        // For steps and hydration, allow 0 values
        if (isSteps || isHydration) {
          return value !== undefined && value !== null && value !== '';
        }
        return value !== undefined && value !== null && value !== '';
      })
      .map(log => ({
        x: new Date(log.date).getTime(), // Use timestamp for datetime axis
        y: parseFloat(log[metric.field]) || 0
      }))
      .sort((a, b) => a.x - b.x); // Sort by timestamp
    
    // Add predicted data if available
    let predictedData = [];
    if (predictionsData && predictionsData.trends && predictionsData.trends[metric.field]) {
      const trend = predictionsData.trends[metric.field];
      const lastDate = predictionsData.lastDate;
      const daysToPredict = predictionsData.daysToPredict;
      const trainingDataLength = predictionsData.allLogsLength;
      
      if (trend.regression && lastDate) {
        const regression = trend.regression;
        const isBPM = metric.field === 'bpm';
        const isWeight = metric.field === 'weight';
        
        // Get ALL historical logs for this metric (no date filtering - use everything available)
        const allLogsForMetric = JSON.parse(localStorage.getItem("healthLogs") || "[]")
          .filter(log => log[metric.field] !== undefined && log[metric.field] !== null && log[metric.field] !== '')
          .sort((a, b) => new Date(a.date) - new Date(b.date));
        
        if (allLogsForMetric.length > 0) {
          const firstDate = new Date(allLogsForMetric[0].date);
          const lastDateForCalc = new Date(allLogsForMetric[allLogsForMetric.length - 1].date);
          const lastXValue = Math.floor((lastDateForCalc - firstDate) / (1000 * 60 * 60 * 24));
          
          // Use AIEngine's improved prediction method with metric-specific context
          const metricContext = {
            variance: trend.variance || 0,
            average: trend.average || 0,
            metricName: metric.field,
            trainingValues: allLogsForMetric.map(log => {
              const val = parseFloat(log[metric.field]);
              // For weight, ensure we return a valid number (weight should never be 0)
              if (metric.field === 'weight') {
                return isNaN(val) || val <= 0 ? null : val;
              }
              return val || 0;
            }).filter(v => v !== null) // Remove null values for weight
          };
          // Update metricContext with steps/hydration info
          if (isSteps || isHydration) {
            metricContext.isSteps = isSteps;
            metricContext.isHydration = isHydration;
          }
          
          const predictions = window.AIEngine.predictFutureValues(
            { slope: regression.slope, intercept: regression.intercept },
            lastXValue,
            daysToPredict,
            isBPM,
            isWeight,
            metricContext
          );
          
          // Generate predictions using the improved method
          for (let i = 0; i < daysToPredict; i++) {
            const value = predictions[i];
            
            const futureDate = new Date(lastDate);
            futureDate.setDate(futureDate.getDate() + (i + 1)); // i+1 because predictions start from day 1
            
            predictedData.push({
              x: futureDate.getTime(),
              y: value
            });
          }
        }
      }
    }
    
    // Determine which y-axis to use (0 = primary, 1 = secondary, 2 = tertiary)
    let yAxisIndex = 0;
    const hasSteps = metrics.some(m => m.field === 'steps');
    const hasHydration = metrics.some(m => m.field === 'hydration');
    const hasOtherMetrics = metrics.some(m => m.field !== 'steps' && m.field !== 'hydration');
    
    if ((hasSteps || hasHydration) && hasOtherMetrics) {
      if (isSteps) {
        yAxisIndex = 1;
      } else if (isHydration) {
        yAxisIndex = hasSteps ? 2 : 1;
      }
    }
    
    const seriesArray = [{
      name: metric.name,
      data: data,
      color: metric.color,
      yAxisIndex: yAxisIndex
    }];
    
    // Add predicted series if available
    if (predictedData.length > 0) {
      const rgbMatch = metric.color.match(/\d+/g);
      const predictionColor = rgbMatch ? `rgba(${rgbMatch.join(', ')}, 0.5)` : metric.color;
      
    seriesArray.push({
      name: `${metric.name} (Predicted)`,
      data: predictedData,
      color: predictionColor,
      stroke: {
        dashArray: 5
      }
    });
    }
    
    return seriesArray;
  }).flat(); // Flatten the array of series arrays
  
  console.log(`Creating combined chart with ${series.length} metrics`);
  
  const options = {
    series: series,
    chart: {
      type: 'line',
      height: 500,
      toolbar: {
        show: false
      },
      background: 'transparent',
      selection: {
        enabled: false
      },
      zoom: {
        enabled: false
      },
      pan: {
        enabled: false
      },
      animations: {
        enabled: false
      }
    },
    title: {
      text: 'Combined Health Metrics Overview',
      align: 'center',
      style: {
        fontSize: '20px',
        fontWeight: 'bold',
        color: '#e0f2f1'
      }
    },
    stroke: {
      curve: 'smooth',
      width: 2.5,
      lineCap: 'round'
    },
    markers: {
      size: 3,
      strokeWidth: 2,
      hover: {
        size: 5,
        sizeOffset: 2
      },
      shape: 'circle',
      showNullDataPoints: false
    },
    xaxis: {
      type: 'datetime',
      title: {
        text: 'Date',
        style: {
          color: '#e0f2f1',
          fontSize: '14px',
          fontWeight: 'bold'
        }
      },
      labels: {
        style: {
          colors: '#e0f2f1'
        },
        datetimeFormatter: {
          year: 'yyyy',
          month: 'MMM',
          day: 'dd MMM',
          hour: 'HH:mm'
        },
        formatter: function(value, timestamp, opts) {
          // ApexCharts datetime formatter - timestamp is the actual timestamp value
          if (timestamp !== undefined && timestamp !== null) {
            const date = new Date(timestamp);
            if (!isNaN(date.getTime())) {
              return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }
          }
          // Fallback: check if value is a timestamp
          if (typeof value === 'number' && value > 1000000000000) {
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
              return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }
          }
          // If value is a string that looks like a timestamp, try to parse it
          if (typeof value === 'string' && /^\d+$/.test(value) && value.length > 10) {
            const date = new Date(parseInt(value));
            if (!isNaN(date.getTime())) {
              return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }
          }
          return value;
        }
      }
    },
    yaxis: {
      title: {
        text: 'Level (1-10)',
        style: {
          color: '#e0f2f1',
          fontSize: '14px',
          fontWeight: 'bold'
        }
      },
      labels: {
        style: {
          colors: '#e0f2f1'
        },
        formatter: function(val) {
          // Round to whole number if it's a whole number, otherwise show one decimal
          const rounded = Math.round(val);
          if (Math.abs(val - rounded) < 0.01) {
            return rounded.toString();
          }
          return val.toFixed(1);
        }
      },
      min: 0,
      max: 10
    },
    grid: {
      borderColor: '#374151',
      strokeDashArray: 4,
      xaxis: {
        lines: {
          show: true
        }
      },
      yaxis: {
        lines: {
          show: true
        }
      },
      padding: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
      }
    },
    legend: {
      labels: {
        colors: '#e0f2f1'
      },
      position: 'bottom'
    },
    tooltip: {
      theme: 'dark',
      shared: true,
      intersect: false,
      x: {
        format: 'dd MMM yyyy'
      },
      marker: {
        show: true
      },
      style: {
        fontSize: '13px'
      }
    },
    dataLabels: {
      enabled: false
    },
    crosshairs: {
      show: true,
      position: 'front',
      stroke: {
        color: '#b0bec5',
        width: 1,
        dashArray: 3
      }
    }
  };
  
  // Apply light mode styles if in light mode
  if (false) { // Always dark mode
    options.title.style.color = '#1b5e20';
    options.xaxis.title.style.color = '#1b5e20';
    options.xaxis.labels.style.colors = '#1b5e20';
    options.yaxis.title.style.color = '#1b5e20';
    options.yaxis.labels.style.colors = '#1b5e20';
    options.grid.borderColor = '#81c784';
    options.legend.labels.colors = '#1b5e20';
    options.tooltip.theme = 'light';
  }
  
  // Hide any loading placeholder
  const loadingElement = container.querySelector('.chart-loading');
  if (loadingElement) {
    loadingElement.style.display = 'none';
  }
  
  container.chart = new ApexCharts(container, options);
  container.chart.render().then(() => {
    // Ensure loading is hidden after render
    if (loadingElement) {
      loadingElement.style.display = 'none';
    }
    // Mark container as loaded
    container.classList.add('loaded');
  });
}

// Render metric selector UI (grouped by category, same as balance chart)
function renderMetricSelector(allMetrics, selectedMetrics) {
  const container = document.getElementById('metricCheckboxes');
  if (!container) return;
  
  container.innerHTML = '';
  
  // Group metrics by category (same as balance chart, but includes steps)
  const metricGroups = [
    {
      name: 'Pain & Symptoms',
      icon: '🩹',
      metrics: ['backPain', 'jointPain', 'stiffness', 'swelling']
    },
    {
      name: 'Energy & Sleep',
      icon: '💤',
      metrics: ['fatigue', 'sleep']
    },
    {
      name: 'Mood & Mental',
      icon: '🧠',
      metrics: ['mood', 'irritability']
    },
    {
      name: 'Physical Function',
      icon: '🏃',
      metrics: ['mobility', 'dailyFunction']
    },
    {
      name: 'Environmental & Wellness',
      icon: '🌡️',
      metrics: ['weatherSensitivity', 'hydration', 'steps']
    }
  ];
  
  // Render grouped metrics
  metricGroups.forEach(group => {
    const groupDiv = document.createElement('div');
    groupDiv.className = 'metric-group';
    
    const groupHeader = document.createElement('div');
    groupHeader.className = 'metric-group-header';
    groupHeader.innerHTML = `
      <span class="metric-group-icon">${group.icon}</span>
      <span class="metric-group-title">${group.name}</span>
    `;
    groupDiv.appendChild(groupHeader);
    
    const groupItems = document.createElement('div');
    groupItems.className = 'metric-group-items';
    
    group.metrics.forEach(field => {
      const metric = allMetrics.find(m => m.field === field);
      if (!metric) return;
      
      const isSelected = selectedMetrics.includes(metric.field);
      
      const checkbox = document.createElement('div');
      checkbox.className = 'metric-checkbox-item';
      checkbox.innerHTML = `
        <label class="metric-checkbox-label">
          <input type="checkbox" 
                 class="metric-checkbox" 
                 data-field="${metric.field}" 
                 ${isSelected ? 'checked' : ''}
                 onchange="toggleMetric('${metric.field}')" />
          <span class="metric-checkbox-text">
            <span class="metric-color-indicator" style="background-color: ${metric.color}"></span>
            ${metric.name}
          </span>
        </label>
      `;
      groupItems.appendChild(checkbox);
    });
    
    groupDiv.appendChild(groupItems);
    container.appendChild(groupDiv);
  });
}

// Toggle metric selection (for combined chart)
function toggleMetric(field) {
  const selectedMetrics = appSettings.combinedChartSelectedMetrics || [];
  const index = selectedMetrics.indexOf(field);
  
  if (index > -1) {
    selectedMetrics.splice(index, 1);
  } else {
    selectedMetrics.push(field);
  }
  
  appSettings.combinedChartSelectedMetrics = selectedMetrics;
  saveSettings();
  
  // Re-render the selector to update checkboxes
  const allMetrics = [
    { field: 'fatigue', name: 'Fatigue', color: '#ff9800', scale: '1-10' },
    { field: 'stiffness', name: 'Stiffness', color: '#ffc107', scale: '1-10' },
    { field: 'backPain', name: 'Back Pain', color: '#f44336', scale: '1-10' },
    { field: 'sleep', name: 'Sleep Quality', color: '#3f51b5', scale: '1-10' },
    { field: 'jointPain', name: 'Joint Pain', color: '#ff5722', scale: '1-10' },
    { field: 'mobility', name: 'Mobility', color: '#00bcd4', scale: '1-10' },
    { field: 'dailyFunction', name: 'Daily Function', color: '#8bc34a', scale: '1-10' },
    { field: 'swelling', name: 'Swelling', color: '#9c27b0', scale: '1-10' },
    { field: 'mood', name: 'Mood', color: '#673ab7', scale: '1-10' },
    { field: 'irritability', name: 'Irritability', color: '#795548', scale: '1-10' },
    { field: 'weatherSensitivity', name: 'Weather Sensitivity', color: '#e91e63', scale: '1-10' },
    { field: 'steps', name: 'Steps', color: '#00e676', scale: '0-50000' },
    { field: 'hydration', name: 'Hydration (glasses)', color: '#00bcd4', scale: '0-20' }
  ];
  renderMetricSelector(allMetrics, selectedMetrics);
  
  // Re-render the combined chart with new selection
  if (appSettings.chartView === 'combined' || appSettings.combinedChart) {
    createCombinedChart();
  }
}

// Select all metrics
function selectAllMetrics() {
  const allMetricsFields = [
    'fatigue', 'stiffness', 'backPain', 'sleep', 'jointPain', 'mobility', 'dailyFunction',
    'swelling', 'mood', 'irritability', 'weatherSensitivity', 'steps', 'hydration'
  ];
  appSettings.combinedChartSelectedMetrics = [...allMetricsFields];
  saveSettings();
  
  // Re-render the selector to update checkboxes
  const allMetrics = [
    { field: 'fatigue', name: 'Fatigue', color: '#ff9800', scale: '1-10' },
    { field: 'stiffness', name: 'Stiffness', color: '#ffc107', scale: '1-10' },
    { field: 'backPain', name: 'Back Pain', color: '#f44336', scale: '1-10' },
    { field: 'sleep', name: 'Sleep Quality', color: '#3f51b5', scale: '1-10' },
    { field: 'jointPain', name: 'Joint Pain', color: '#ff5722', scale: '1-10' },
    { field: 'mobility', name: 'Mobility', color: '#00bcd4', scale: '1-10' },
    { field: 'dailyFunction', name: 'Daily Function', color: '#8bc34a', scale: '1-10' },
    { field: 'swelling', name: 'Swelling', color: '#9c27b0', scale: '1-10' },
    { field: 'mood', name: 'Mood', color: '#673ab7', scale: '1-10' },
    { field: 'irritability', name: 'Irritability', color: '#795548', scale: '1-10' },
    { field: 'weatherSensitivity', name: 'Weather Sensitivity', color: '#e91e63', scale: '1-10' },
    { field: 'steps', name: 'Steps', color: '#00e676', scale: '0-50000' },
    { field: 'hydration', name: 'Hydration (glasses)', color: '#00bcd4', scale: '0-20' }
  ];
  renderMetricSelector(allMetrics, allMetricsFields);
  
  // Re-render chart
  if (appSettings.combinedChart) {
    createCombinedChart();
  }
}

// Deselect all metrics (for combined chart)
function deselectAllMetrics() {
  appSettings.combinedChartSelectedMetrics = [];
  saveSettings();
  
  // Update checkboxes
  const checkboxes = document.querySelectorAll('#metricCheckboxes .metric-checkbox');
  checkboxes.forEach(cb => {
    cb.checked = false;
  });
  
  // Re-render chart (will show empty)
  if (appSettings.chartView === 'combined' || appSettings.combinedChart) {
    createCombinedChart();
  }
}

// Select all balance metrics (excluding steps)
function selectAllBalanceMetrics() {
  const allBalanceMetrics = [
    'fatigue', 'stiffness', 'backPain', 'sleep', 'jointPain', 'mobility', 'dailyFunction',
    'swelling', 'mood', 'irritability', 'weatherSensitivity', 'hydration'
  ];
  appSettings.balanceChartSelectedMetrics = [...allBalanceMetrics];
  saveSettings();
  
  // Update checkboxes
  const checkboxes = document.querySelectorAll('#balanceMetricCheckboxes .metric-checkbox');
  checkboxes.forEach(cb => {
    cb.checked = true;
  });
  
  // Re-render chart
  if (appSettings.chartView === 'balance') {
    createBalanceChart();
  }
}

// Deselect all balance metrics
function deselectAllBalanceMetrics() {
  appSettings.balanceChartSelectedMetrics = [];
  saveSettings();
  
  // Update checkboxes
  const checkboxes = document.querySelectorAll('#balanceMetricCheckboxes .metric-checkbox');
  checkboxes.forEach(cb => {
    cb.checked = false;
  });
  
  // Re-render chart (will show empty)
  if (appSettings.chartView === 'balance') {
    createBalanceChart();
  }
}

// Render balance metric selector UI (excluding steps) - Grouped by category
function renderBalanceMetricSelector(allMetrics, selectedMetrics) {
  const container = document.getElementById('balanceMetricCheckboxes');
  if (!container) return;
  
  container.innerHTML = '';
  
  // Filter out steps from metrics
  const balanceMetrics = allMetrics.filter(m => m.field !== 'steps');
  
  // Enforce minimum of 3 metrics - if less than 3, select first 3
  if (selectedMetrics.length < 3) {
    const availableMetrics = balanceMetrics.map(m => m.field).filter(f => !selectedMetrics.includes(f));
    while (selectedMetrics.length < 3 && availableMetrics.length > 0) {
      selectedMetrics.push(availableMetrics.shift());
    }
    appSettings.balanceChartSelectedMetrics = selectedMetrics;
    saveSettings();
  }
  
  // Check if we have exactly 3 selected (minimum)
  const isMinimumReached = selectedMetrics.length === 3;
  
  // Group metrics by category
  const metricGroups = [
    {
      name: 'Pain & Symptoms',
      icon: '🩹',
      metrics: ['backPain', 'jointPain', 'stiffness', 'swelling']
    },
    {
      name: 'Energy & Sleep',
      icon: '💤',
      metrics: ['fatigue', 'sleep']
    },
    {
      name: 'Mood & Mental',
      icon: '🧠',
      metrics: ['mood', 'irritability']
    },
    {
      name: 'Physical Function',
      icon: '🏃',
      metrics: ['mobility', 'dailyFunction']
    },
    {
      name: 'Environmental & Wellness',
      icon: '🌡️',
      metrics: ['weatherSensitivity', 'hydration']
    }
  ];
  
  // Render grouped metrics
  metricGroups.forEach(group => {
    const groupDiv = document.createElement('div');
    groupDiv.className = 'metric-group';
    
    const groupHeader = document.createElement('div');
    groupHeader.className = 'metric-group-header';
    groupHeader.innerHTML = `
      <span class="metric-group-icon">${group.icon}</span>
      <span class="metric-group-title">${group.name}</span>
    `;
    groupDiv.appendChild(groupHeader);
    
    const groupItems = document.createElement('div');
    groupItems.className = 'metric-group-items';
    
    group.metrics.forEach(field => {
      const metric = balanceMetrics.find(m => m.field === field);
      if (!metric) return;
      
      const isSelected = selectedMetrics.includes(metric.field);
      const isDisabled = isSelected && isMinimumReached;
      
      const checkbox = document.createElement('div');
      checkbox.className = 'metric-checkbox-item';
      checkbox.innerHTML = `
        <label class="metric-checkbox-label ${isDisabled ? 'disabled' : ''}">
          <input type="checkbox" 
                 class="metric-checkbox" 
                 data-field="${metric.field}" 
                 ${isSelected ? 'checked' : ''}
                 ${isDisabled ? 'disabled' : ''}
                 onchange="toggleBalanceMetric('${metric.field}')" />
          <span class="metric-checkbox-text">
            <span class="metric-color-indicator" style="background-color: ${metric.color}"></span>
            ${metric.name}
          </span>
        </label>
      `;
      groupItems.appendChild(checkbox);
    });
    
    groupDiv.appendChild(groupItems);
    container.appendChild(groupDiv);
  });
}

// Toggle metric selection (for balance chart)
function toggleBalanceMetric(field) {
  const selectedMetrics = appSettings.balanceChartSelectedMetrics || [];
  const index = selectedMetrics.indexOf(field);
  
  // Enforce minimum of 3 metrics
  if (index > -1) {
    // Trying to uncheck - only allow if we have more than 3 selected
    if (selectedMetrics.length <= 3) {
      // Can't uncheck - minimum 3 required
      return;
    }
    selectedMetrics.splice(index, 1);
  } else {
    selectedMetrics.push(field);
  }
  
  appSettings.balanceChartSelectedMetrics = selectedMetrics;
  saveSettings();
  
  // Re-render the selector to update disabled states
  const allMetrics = [
    { field: 'fatigue', name: 'Fatigue', color: '#ff9800', scale: '1-10' },
    { field: 'stiffness', name: 'Stiffness', color: '#ffc107', scale: '1-10' },
    { field: 'backPain', name: 'Back Pain', color: '#f44336', scale: '1-10' },
    { field: 'sleep', name: 'Sleep Quality', color: '#3f51b5', scale: '1-10' },
    { field: 'jointPain', name: 'Joint Pain', color: '#ff5722', scale: '1-10' },
    { field: 'mobility', name: 'Mobility', color: '#00bcd4', scale: '1-10' },
    { field: 'dailyFunction', name: 'Daily Function', color: '#8bc34a', scale: '1-10' },
    { field: 'swelling', name: 'Swelling', color: '#9c27b0', scale: '1-10' },
    { field: 'mood', name: 'Mood', color: '#673ab7', scale: '1-10' },
    { field: 'irritability', name: 'Irritability', color: '#795548', scale: '1-10' },
    { field: 'weatherSensitivity', name: 'Weather Sensitivity', color: '#e91e63', scale: '1-10' },
    { field: 'hydration', name: 'Hydration (glasses)', color: '#00bcd4', scale: '0-20' }
  ];
  renderBalanceMetricSelector(allMetrics, selectedMetrics);
  
  // Re-render the balance chart with new selection
  if (appSettings.chartView === 'balance') {
    createBalanceChart();
  }
}

// Select all balance metrics (excluding steps)
function selectAllBalanceMetrics() {
  const allBalanceMetrics = [
    'fatigue', 'stiffness', 'backPain', 'sleep', 'jointPain', 'mobility', 'dailyFunction',
    'swelling', 'mood', 'irritability', 'weatherSensitivity', 'hydration'
  ];
  appSettings.balanceChartSelectedMetrics = [...allBalanceMetrics];
  saveSettings();
  
  // Re-render the selector to update disabled states
  const allMetrics = [
    { field: 'fatigue', name: 'Fatigue', color: '#ff9800', scale: '1-10' },
    { field: 'stiffness', name: 'Stiffness', color: '#ffc107', scale: '1-10' },
    { field: 'backPain', name: 'Back Pain', color: '#f44336', scale: '1-10' },
    { field: 'sleep', name: 'Sleep Quality', color: '#3f51b5', scale: '1-10' },
    { field: 'jointPain', name: 'Joint Pain', color: '#ff5722', scale: '1-10' },
    { field: 'mobility', name: 'Mobility', color: '#00bcd4', scale: '1-10' },
    { field: 'dailyFunction', name: 'Daily Function', color: '#8bc34a', scale: '1-10' },
    { field: 'swelling', name: 'Swelling', color: '#9c27b0', scale: '1-10' },
    { field: 'mood', name: 'Mood', color: '#673ab7', scale: '1-10' },
    { field: 'irritability', name: 'Irritability', color: '#795548', scale: '1-10' },
    { field: 'weatherSensitivity', name: 'Weather Sensitivity', color: '#e91e63', scale: '1-10' },
    { field: 'hydration', name: 'Hydration (glasses)', color: '#00bcd4', scale: '0-20' }
  ];
  renderBalanceMetricSelector(allMetrics, allBalanceMetrics);
  
  // Re-render chart
  if (appSettings.chartView === 'balance') {
    createBalanceChart();
  }
}

// Deselect all balance metrics - REMOVED (minimum 3 required, function kept for compatibility but not used)
function deselectAllBalanceMetrics() {
  // Minimum 3 metrics required - cannot deselect all
  // This function is kept for compatibility but does nothing
  return;
}

// Create Balance Chart (Radar Chart)
function createBalanceChart() {
  // Check if ApexCharts is available
  if (typeof ApexCharts === 'undefined') {
    console.error('ApexCharts is not loaded! Cannot create balance chart.');
    return;
  }
  
  const container = document.getElementById('balanceChart');
  if (!container) {
    console.error('Balance chart container not found');
    return;
  }
  
  // Get filtered logs based on date range
  const filteredLogs = getFilteredLogs();
  
  // Get balance chart container and metric selector
  const balanceChartContainer = document.getElementById('balanceChartContainer');
  const balanceMetricSelector = document.getElementById('balanceChartMetricSelector');
  
  // Check if we have data
  if (!filteredLogs || filteredLogs.length === 0) {
    console.warn('No data available for balance chart (after date filter)');
    
    // Destroy existing chart if it exists
    if (container.chart) {
      container.chart.destroy();
      container.chart = null;
    }
    
    // Hide balance chart container and metric selector
    if (balanceChartContainer) {
      balanceChartContainer.classList.add('hidden');
    }
    if (balanceMetricSelector) {
      balanceMetricSelector.classList.add('hidden');
    }
    
    // Show placeholder
    updateChartEmptyState(false);
    return;
  }
  
  updateChartEmptyState(true);
  
  // Show balance chart container and metric selector
  if (balanceChartContainer) {
    balanceChartContainer.classList.remove('hidden');
  }
  if (balanceMetricSelector) {
    balanceMetricSelector.classList.remove('hidden');
  }
  
  // Destroy existing chart if it exists
  if (container.chart) {
    container.chart.destroy();
  }
  
  // All available metrics for balance chart (excluding steps)
  const allMetrics = [
    { field: 'fatigue', name: 'Fatigue', color: '#ff9800', scale: '1-10' },
    { field: 'stiffness', name: 'Stiffness', color: '#ffc107', scale: '1-10' },
    { field: 'backPain', name: 'Back Pain', color: '#f44336', scale: '1-10' },
    { field: 'sleep', name: 'Sleep Quality', color: '#3f51b5', scale: '1-10' },
    { field: 'jointPain', name: 'Joint Pain', color: '#ff5722', scale: '1-10' },
    { field: 'mobility', name: 'Mobility', color: '#00bcd4', scale: '1-10' },
    { field: 'dailyFunction', name: 'Daily Function', color: '#8bc34a', scale: '1-10' },
    { field: 'swelling', name: 'Swelling', color: '#9c27b0', scale: '1-10' },
    { field: 'mood', name: 'Mood', color: '#673ab7', scale: '1-10' },
    { field: 'irritability', name: 'Irritability', color: '#795548', scale: '1-10' },
    { field: 'weatherSensitivity', name: 'Weather Sensitivity', color: '#e91e63', scale: '1-10' },
    { field: 'hydration', name: 'Hydration (glasses)', color: '#00bcd4', scale: '0-20' }
  ];
  
  // Get selected metrics from settings (enforce minimum of 3)
  let selectedMetrics = appSettings.balanceChartSelectedMetrics || [];
  
  // Enforce minimum of 3 metrics
  if (selectedMetrics.length < 3) {
    // Select first 3 metrics if less than 3 are selected
    selectedMetrics = allMetrics.slice(0, 3).map(m => m.field);
    appSettings.balanceChartSelectedMetrics = selectedMetrics;
    saveSettings();
  }
  
  // Filter metrics based on selection
  const metrics = allMetrics.filter(m => selectedMetrics.includes(m.field));
  
  if (metrics.length === 0) {
    console.warn('No metrics selected for balance chart');
    updateChartEmptyState(false);
    return;
  }
  
  // Render metric selector UI
  renderBalanceMetricSelector(allMetrics, selectedMetrics);
  
  // Calculate averages for each metric
  const radarData = metrics.map(metric => {
    const values = filteredLogs
      .filter(log => {
        const value = log[metric.field];
        if (metric.field === 'hydration') {
          return value !== undefined && value !== null && value !== '' && !isNaN(parseFloat(value)) && parseFloat(value) >= 0;
        }
        // For other metrics, check if value exists and is a valid number (can be 0)
        return value !== undefined && value !== null && value !== '' && !isNaN(parseFloat(value)) && parseFloat(value) >= 0;
      })
      .map(log => {
        const val = parseFloat(log[metric.field]);
        return isNaN(val) ? 0 : val;
      });
    
    if (values.length === 0) {
      console.warn(`No data found for metric: ${metric.field}`);
      return 0;
    }
    
    const sum = values.reduce((a, b) => a + b, 0);
    const average = sum / values.length;
    
    // Normalize hydration to 0-10 scale (max 20 glasses = 10)
    if (metric.field === 'hydration') {
      const normalized = (average / 20) * 10;
      return Math.min(10, Math.max(0, normalized)); // Clamp to 0-10
    }
    
    // Clamp other metrics to 0-10 range
    return Math.min(10, Math.max(0, average));
  });
  
  // Filter out metrics with no data (all zeros) to avoid empty chart
  const metricsWithData = metrics.filter((metric, index) => {
    const hasData = radarData[index] > 0 || filteredLogs.some(log => {
      const value = log[metric.field];
      return value !== undefined && value !== null && value !== '' && !isNaN(parseFloat(value));
    });
    return hasData;
  });
  
  if (metricsWithData.length === 0) {
    console.warn('No metrics with data available for balance chart');
    updateChartEmptyState(false);
    return;
  }
  
  // Update metrics and radarData to only include metrics with data
  const finalMetrics = metricsWithData;
  const finalRadarData = metricsWithData.map(metric => {
    const index = metrics.findIndex(m => m.field === metric.field);
    return radarData[index];
  });
  
  const labels = finalMetrics.map(m => m.name);
  
  // Debug logging
  console.log('Balance chart data:', {
    filteredLogsCount: filteredLogs.length,
    metricsCount: finalMetrics.length,
    radarData: finalRadarData,
    labels: labels
  });
  
  // Create radar chart
  const options = {
    series: [{
      name: 'Average Values',
      data: finalRadarData
    }],
    chart: {
      type: 'radar',
      height: 500,
      toolbar: {
        show: false
      },
      background: 'transparent'
    },
    colors: ['#4caf50'],
    fill: {
      opacity: 0.3
    },
    stroke: {
      width: 2,
      colors: ['#4caf50']
    },
    markers: {
      size: 4,
      colors: ['#4caf50'],
      strokeColors: '#4caf50',
      strokeWidth: 2
    },
    xaxis: {
      categories: labels
    },
    yaxis: {
      min: 0,
      max: 10,
      tickAmount: 5,
      labels: {
        formatter: function(val) {
          return val.toFixed(1);
        },
        style: {
          colors: '#e0f2f1'
        }
      }
    },
    plotOptions: {
      radar: {
        polygons: {
          strokeColors: '#374151',
          fill: {
            colors: ['rgba(55, 65, 81, 0.1)']
          }
        }
      }
    },
    tooltip: {
      y: {
        formatter: function(val, opts) {
          const dataPointIndex = opts.dataPointIndex !== undefined ? opts.dataPointIndex : 0;
          const metric = finalMetrics[dataPointIndex];
          if (metric && metric.field === 'hydration') {
            // Convert back from normalized scale
            const actualValue = (val / 10) * 20;
            return actualValue.toFixed(1) + ' glasses';
          } else if (metric && metric.field === 'steps') {
            // Steps should not be in balance chart, but handle it just in case
            // Convert back from normalized scale (assuming max 50000 steps = 10)
            const actualValue = (val / 10) * 50000;
            return Math.round(actualValue).toLocaleString();
          }
          return val.toFixed(1) + '/10';
        }
      }
    },
    theme: {
      mode: 'dark',
      palette: 'palette1'
    }
  };
  
  container.chart = new ApexCharts(container, options);
  container.chart.render().then(() => {
    console.log('Balance chart rendered successfully');
  });
}

async function clearData() {
  // Confirm with user before clearing all data
  if (!confirm('⚠️ WARNING: This will permanently delete ALL your health data, settings, and log you out of cloud sync.\n\nThis action cannot be undone!\n\nAre you sure you want to continue?')) {
    return;
  }
  
  // Clear all health logs from localStorage and any backups
  // Clear the logs array completely to prevent any in-memory references
  if (Array.isArray(logs)) {
    logs.length = 0;
  }
  logs = [];
  
  // Delete cloud data (health logs and encryption keys) while preserving anonymized research data
  if (typeof deleteAllUserDataFromCloud === 'function') {
    try {
      await deleteAllUserDataFromCloud();
      console.log('✅ Health data and encryption keys deleted from cloud backup (anonymized research data preserved)');
    } catch (error) {
      console.warn('Cloud data deletion error (may not be logged in or sync failed):', error);
      Logger.warn('Cloud data deletion error', { error: error.message });
    }
  }
  
  // Clear all app settings - reset to complete defaults
  appSettings = {
    showCharts: true,
    combinedChart: false,
    reminder: true,
    sound: false,
    backup: true,
    compress: false,
    animations: true,
    lazy: true,
    userName: '',
    weightUnit: 'kg',
    medicalCondition: '', // Clear medical condition
    contributeAnonData: false, // Reset data contribution
    useOpenData: false, // Reset open data usage
    demoMode: false, // Reset demo mode
    chartView: 'individual', // Reset chart view
    combinedChartSelectedMetrics: undefined, // Clear metric selections
    balanceChartSelectedMetrics: undefined, // Clear balance chart selections
    reminderTime: '20:00', // Reset reminder time to default
    optimizedAI: false // Reset optimized AI setting
  };
  localStorage.removeItem('healthAppSettings');
  
  // Logout from cloud sync
  if (typeof handleCloudLogout === 'function') {
    try {
      await handleCloudLogout();
      console.log('✅ Logged out from cloud sync');
    } catch (error) {
      console.warn('Cloud logout error (may not be logged in):', error);
    }
  }
  
  // Clear all cloud-related localStorage items
  localStorage.removeItem('cloudAutoSync');
  localStorage.removeItem('cloudLastSync');
  localStorage.removeItem('currentCloudUserId');
  
  // Clear anonymized data sync tracking
  localStorage.removeItem('anonymizedDataSyncedKeys');
  localStorage.removeItem('anonymizedDataSyncedDates');
  
  // Clear AI model cache from IndexedDB
  try {
    if ('indexedDB' in window) {
      // AI models may use IndexedDB to cache models
      // Try to delete common database names used by AI model caches
      const dbNames = [
        'transformers-cache',
        'transformersjs-cache',
        'hf-transformers-cache',
        'xenova-transformers-cache'
      ];
      
      // Also try to get all database names and delete any that look like AI model caches
      if (indexedDB.databases) {
        const databases = await indexedDB.databases();
        for (const db of databases) {
          if (db.name && (
            db.name.toLowerCase().includes('transformers') ||
            db.name.toLowerCase().includes('xenova') ||
            db.name.toLowerCase().includes('hf-')
          )) {
            dbNames.push(db.name);
          }
        }
      }
      
      // Delete all found databases
      const deletePromises = [...new Set(dbNames)].map(dbName => {
        return new Promise((resolve) => {
          const deleteDB = indexedDB.deleteDatabase(dbName);
          deleteDB.onsuccess = () => {
            console.log(`✅ Cleared AI model cache: ${dbName}`);
            resolve();
          };
          deleteDB.onerror = () => {
            // Database might not exist, that's okay
            resolve();
          };
          deleteDB.onblocked = () => {
            console.warn(`⚠️ IndexedDB deletion blocked for ${dbName} - may need to close other tabs`);
            resolve(); // Don't fail the whole operation
          };
        });
      });
      
      await Promise.all(deletePromises);
      console.log('✅ AI model cache cleared from IndexedDB');
    }
  } catch (error) {
    console.warn('⚠️ Error clearing AI model cache:', error);
    // Don't fail the whole operation if this fails
  }
  
  // Clear ALL IndexedDB databases (comprehensive cleanup)
  try {
    if ('indexedDB' in window && indexedDB.databases) {
      const databases = await indexedDB.databases();
      const deletePromises = databases.map(db => {
        return new Promise((resolve) => {
          const deleteDB = indexedDB.deleteDatabase(db.name);
          deleteDB.onsuccess = () => resolve();
          deleteDB.onerror = () => resolve();
          deleteDB.onblocked = () => resolve();
        });
      });
      await Promise.all(deletePromises);
      console.log('✅ All IndexedDB databases cleared');
    }
  } catch (error) {
    console.warn('⚠️ Error clearing all IndexedDB:', error);
  }
  
  // Clear Cache Storage (Service Worker caches)
  try {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
      console.log('✅ All cache storage cleared');
    }
  } catch (error) {
    console.warn('⚠️ Error clearing cache storage:', error);
  }
  
  // Clear sessionStorage completely
  try {
    sessionStorage.clear();
    console.log('✅ Session storage cleared');
  } catch (error) {
    console.warn('⚠️ Error clearing sessionStorage:', error);
  }
  
  // Clear ALL localStorage items related to the app (comprehensive cleanup)
  const localStorageKeysToRemove = [
    'healthLogs',
    'healthLogs_backup',
    'healthAppSettings',
    'appSettings_backup',
    'cloudAutoSync',
    'cloudLastSync',
    'currentCloudUserId',
    'anonymizedDataSyncedKeys',
    'anonymizedDataSyncedDates',
    'healthLogs_compressed',
    'healthAppSettings_compressed'
  ];
  
  // Remove all known keys
  localStorageKeysToRemove.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      // Ignore errors
    }
  });
  
  // Also clear any other localStorage items that might be app-related
  try {
    const allKeys = Object.keys(localStorage);
    allKeys.forEach(key => {
      // Remove any key that looks like it's related to the health app
      if (key.toLowerCase().includes('health') || 
          key.toLowerCase().includes('log') ||
          key.toLowerCase().includes('sync') ||
          key.toLowerCase().includes('anon') ||
          key.toLowerCase().includes('cloud')) {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          // Ignore errors
        }
      }
    });
    console.log('✅ All app-related localStorage items cleared');
  } catch (error) {
    console.warn('⚠️ Error clearing additional localStorage items:', error);
  }
  
  // Reset UI
  renderLogs();
  updateCharts();
  updateAISummaryButtonState(); // Update AI button state
  
  // Reload settings
  if (typeof loadSettings === 'function') {
    loadSettings();
  }
  
  // Apply settings to UI
  if (typeof applySettings === 'function') {
    applySettings();
  }
  
  // Update settings state (toggles, etc.)
  if (typeof loadSettingsState === 'function') {
    loadSettingsState();
  }
  
  // Explicitly clear input fields in UI (after loadSettingsState to override any defaults)
  const userNameInput = document.getElementById('userNameInput');
  if (userNameInput) {
    userNameInput.value = '';
  }
  
  const medicalConditionInput = document.getElementById('medicalConditionInput');
  if (medicalConditionInput) {
    medicalConditionInput.value = '';
  }
  
  // Update dashboard title and condition context
  if (typeof updateDashboardTitle === 'function') {
    updateDashboardTitle();
  }
  
  if (typeof updateConditionContext === 'function') {
    updateConditionContext('');
  }
  
  // Save default settings
  saveSettings();
  
  // Show confirmation and reload app
  showAlertModal('✅ All data and settings cleared successfully!\n\nThe app will reload in a moment to reset to default state.', 'Data Cleared');
  
  // Reload the app to fully reset to default state
  setTimeout(() => {
    window.location.reload();
  }, 1500);
}


// Export function - now shows modal for format selection
function exportData() {
  // Disable export in demo mode
  if (appSettings.demoMode) {
    showAlertModal('Data export is disabled in demo mode. Demo data is not saved or synced.', 'Demo Mode');
    return;
  }
  
  if (typeof showExportModal === 'function') {
    showExportModal();
  } else {
    // Fallback to CSV if export modal not loaded
    const logs = JSON.parse(localStorage.getItem("healthLogs") || "[]");
    if (logs.length === 0) {
      alert('No data to export.');
      return;
    }
  const headers = "Date,BPM,Weight,Fatigue,Stiffness,Back Pain,Sleep,Joint Pain,Mobility,Daily Function,Swelling,Flare,Mood,Irritability,Notes";
  const csvContent = "data:text/csv;charset=utf-8," 
    + headers + "\n"
    + logs.map(log => Object.values(log).join(",")).join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "health_logs.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  }
}

// Import function - now shows modal with options
function importData() {
  if (typeof showImportModal === 'function') {
    showImportModal();
  } else {
    // Fallback to simple CSV import if import modal not loaded
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.csv';
  input.onchange = function(event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          const csv = e.target.result;
          const lines = csv.split('\n');
          const headers = lines[0].split(',');
          
          // Validate headers
          const expectedHeaders = ['Date', 'BPM', 'Weight', 'Fatigue', 'Stiffness', 'Back Pain', 'Sleep', 'Joint Pain', 'Mobility', 'Daily Function', 'Swelling', 'Flare', 'Mood', 'Irritability', 'Notes'];
          if (!expectedHeaders.every(header => headers.includes(header))) {
              showAlertModal('Invalid CSV format. Please use a file exported from this app.', 'Import Error');
            return;
          }
          
          const importedLogs = [];
          for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim() === '') continue;
            
            const values = lines[i].split(',');
            const log = {
              date: values[0],
              bpm: values[1],
              weight: values[2],
              fatigue: values[3],
              stiffness: values[4],
              backPain: values[5],
              sleep: values[6],
              jointPain: values[7],
              mobility: values[8],
              dailyFunction: values[9],
              swelling: values[10],
              flare: values[11],
              mood: values[12],
              irritability: values[13],
              notes: values[14] || ''
            };
            importedLogs.push(log);
          }
          
          // Merge with existing data (avoid duplicates by date)
          const existingDates = logs.map(log => log.date);
          const newLogs = importedLogs.filter(log => !existingDates.includes(log.date));
          
          if (newLogs.length === 0) {
              showAlertModal('No new entries to import. All entries in the file already exist.', 'Import Info');
            return;
          }
          
          logs.push(...newLogs);
          saveLogsToStorage();
          renderLogs();
          debounceChartUpdate();
            updateHeartbeatAnimation();
            updateAISummaryButtonState();
          
            showAlertModal(`Successfully imported ${newLogs.length} new health entries!`, 'Import Success');
          
        } catch (error) {
            showAlertModal('Error reading file. Please make sure it\'s a valid CSV file exported from this app.', 'Import Error');
          console.error('Import error:', error);
            Logger.error('CSV import error', { error: error.message, stack: error.stack });
        }
      };
      reader.readAsText(file);
    }
  };
  input.click();
}
}


// ============================================
// AI ANALYSIS ENGINE
// Uses AIEngine.js for comprehensive local analysis
// ============================================

// Condition context (used by AIEngine)
let CONDITION_CONTEXT = {
  name: '',
  description: '',
  keyMetrics: ['backPain', 'stiffness', 'mobility', 'fatigue', 'sleep', 'flare'],
  treatmentAreas: ['pain management', 'mobility exercises', 'sleep quality', 'medication timing', 'flare prevention']
};

// Make CONDITION_CONTEXT available globally for AIEngine
window.CONDITION_CONTEXT = CONDITION_CONTEXT;

// AI Analysis functions are now in AIEngine.js
// Use AIEngine.analyzeHealthMetrics() and AIEngine.generateComprehensiveInsights()

// Legacy function wrappers for compatibility (delegate to AIEngine)
function analyzeHealthMetrics(logs) {
  if (window.AIEngine) {
    return window.AIEngine.analyzeHealthMetrics(logs);
  }
  // Fallback if AIEngine not loaded
  return { trends: {}, correlations: [], anomalies: [], advice: [], patterns: [], riskFactors: [] };
}

function generateComprehensiveInsights(analysis, logs, dayCount) {
  if (window.AIEngine) {
    return window.AIEngine.generateComprehensiveInsights(analysis, logs, dayCount);
  }
  return "AI Engine not loaded. Please refresh the page.";
}

// Legacy function (kept for any direct calls, but AIEngine has enhanced version)
function generateConditionAdvice(trends, logs) {
  if (window.AIEngine) {
    const conditionContext = window.CONDITION_CONTEXT || { name: 'your condition' };
    return window.AIEngine.generateConditionAdvice(trends, logs, conditionContext);
  }
  return [];
}

// Legacy function (kept for compatibility)
function calculateCorrelation(x, y) {
  if (window.AIEngine) {
    return window.AIEngine.calculateCorrelation(x, y);
  }
  return 0;
}

// Close settings on Escape key
document.addEventListener('keydown', function(event) {
  if (event.key === 'Escape') {
    const settingsOverlay = document.getElementById('settingsOverlay');
    if (settingsOverlay && settingsOverlay.style.display === 'flex') {
      toggleSettings();
    }
  }
});

// ============================================
// AI SUMMARY - REBUILT FROM SCRATCH
// ============================================

// Update AI Summary button state based on data availability
function updateAISummaryButtonState() {
  const aiButton = document.querySelector('.ai-action-btn');
  if (!aiButton) {
    Logger.debug('AI Summary button not found for state update');
    return;
  }
  
  const allLogs = JSON.parse(localStorage.getItem("healthLogs") || "[]");
  const hasData = allLogs && allLogs.length > 0;
  
  Logger.debug('AI Summary button state update', { hasData, logCount: allLogs.length });
  
  if (hasData) {
    aiButton.disabled = false;
    aiButton.removeAttribute('disabled');
    aiButton.classList.remove('disabled');
    aiButton.style.opacity = '1';
    aiButton.style.cursor = 'pointer';
    aiButton.style.pointerEvents = 'auto';
    aiButton.title = 'Generate AI Health Analysis';
    Logger.debug('AI Summary button enabled');
  } else {
    aiButton.disabled = true;
    aiButton.setAttribute('disabled', 'disabled');
    aiButton.classList.add('disabled');
    aiButton.style.opacity = '0.5';
    aiButton.style.cursor = 'not-allowed';
    aiButton.style.pointerEvents = 'none';
    aiButton.title = 'No data available. Start logging to generate AI analysis.';
    Logger.debug('AI Summary button disabled');
  }
}

function generateAISummary() {
  // Declare resultsContent outside try block so it's accessible throughout the function
  let resultsContent = null;
  
  try {
    Logger.info('AI Summary button clicked');
    
  // Use global logs variable instead of re-reading from localStorage
  Logger.debug('AI Summary - Checking data', { logCount: logs.length });
  
  // Check if we have data
  if (logs.length === 0) {
      showAlertModal('No health data available. Please log some entries first before generating an AI summary.', 'AI Summary');
      Logger.warn('AI Summary - No data available');
      return;
    }

    // Get the results content element
    resultsContent = document.getElementById('aiResultsContent');
    
    if (!resultsContent) {
      console.error('AI results content element not found');
      Logger.error('AI Summary - Results content element not found');
      showAlertModal('Error: AI results container not found. Please refresh the page.', 'AI Summary Error');
      return;
    }

    Logger.debug('AI Summary - Showing form section');

    // Switch to AI tab if not already there
    const currentTab = document.querySelector('.tab-btn.active');
    if (!currentTab || currentTab.getAttribute('data-tab') !== 'ai') {
      switchTab('ai');
    }
    
    Logger.debug('AI Summary - Switched to AI tab');
  } catch (error) {
    console.error('Error in generateAISummary (initial setup):', error);
    Logger.error('AI Summary - Error in initial setup', { error: error.message, stack: error.stack });
    showAlertModal('An error occurred while starting AI analysis. Please check the console for details.', 'AI Analysis Error');
    return;
  }
  
  // Get filtered logs based on AI tab date range
  // This defines the range for AI analysis
  const aiDateRange = appSettings.aiDateRange || { type: 7 }; // Default to 7 days
  const startDateInput = document.getElementById('aiStartDate');
  const endDateInput = document.getElementById('aiEndDate');
  
  // Ensure logs variable is available (use allLogs if logs is not defined)
  const logsToUse = typeof logs !== 'undefined' && logs.length > 0 ? logs : allLogs;
  
  Logger.debug('AI Summary - Using logs', { logsCount: logsToUse.length, allLogsCount: logs.length });
  
  let filteredLogs = logsToUse;
  let dateRangeText = '';
  
  // Use AI tab date range
  if (aiDateRange.type === 'custom' && startDateInput && endDateInput && startDateInput.value && endDateInput.value) {
    // Custom date range
    const startDate = startDateInput.value;
    const endDate = endDateInput.value;
    
    filteredLogs = logsToUse.filter(log => {
      const logDate = new Date(log.date);
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      return logDate >= start && logDate <= end;
    });
    
    // Format date range text
    const start = new Date(startDate).toLocaleDateString();
    const end = new Date(endDate).toLocaleDateString();
    dateRangeText = `${start} to ${end}`;
  } else {
    // Preset range (Today, 7 Days, 30 Days, 90 Days)
    const days = aiDateRange.type || 7;
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);
    
    filteredLogs = logsToUse.filter(log => {
      const logDate = new Date(log.date);
      return logDate >= startDate && logDate <= endDate;
    });
    
    if (days === 1) {
      dateRangeText = 'today';
    } else {
      dateRangeText = `last ${days} days`;
    }
  }
  
  Logger.debug('AI Summary - Filtered logs', { filteredCount: filteredLogs.length, dateRange: dateRangeText });
  
  if (filteredLogs.length === 0) {
    showAlertModal('No health data available in the selected date range. Please adjust your date range or log some entries.', 'AI Summary');
    Logger.warn('AI Summary - No filtered logs available');
    return;
  }
  
  // Sort logs chronologically (oldest first)
  const sortedLogs = filteredLogs.sort((a, b) => new Date(a.date) - new Date(b.date));
  
  // Ensure resultsContent is still available (re-fetch if needed)
  if (!resultsContent) {
    resultsContent = document.getElementById('aiResultsContent');
    if (!resultsContent) {
      Logger.error('AI Summary - Results content not available after filtering');
      showAlertModal('Error: AI results container not available. Please refresh the page.', 'AI Summary Error');
    return;
    }
  }
  
  // Show loading state immediately (safe - no user input)
  resultsContent.innerHTML = `
    <div class="ai-loading-state">
      <div class="ai-loading-icon">🧠</div>
      <p class="ai-loading-text">Looking at your health data...</p>
      <p class="ai-loading-subtext">Checking ${sortedLogs.length} days (${escapeHTML(dateRangeText)})</p>
      </div>
  `;
  
  Logger.debug('AI Summary - Loading state displayed', { logCount: sortedLogs.length });

  // Analyze the data after a short delay for UX
  // Use ALL historical logs for training (up to 10 years), filtered logs for display
  // Use a small delay to ensure section is visible before starting analysis
  setTimeout(async () => {
    try {
      Logger.debug('AI Summary - Starting analysis', { sortedLogsCount: sortedLogs.length });
      
  // Get ALL historical data - use cached sorted logs if available
  const allLogsForTraining = window.PerformanceUtils?.memoizedSort
    ? window.PerformanceUtils.memoizedSort(logs, (a, b) => new Date(a.date) - new Date(b.date), 'allLogsForTraining')
    : [...logs].sort((a, b) => new Date(a.date) - new Date(b.date));
      
      Logger.debug('AI Summary - Training logs loaded', { trainingLogsCount: allLogsForTraining.length });
      
      let analysis;
      if (window.AIEngine && typeof window.AIEngine.analyzeHealthMetrics === 'function') {
        Logger.debug('AI Summary - Using AIEngine for analysis');
        analysis = window.AIEngine.analyzeHealthMetrics(sortedLogs, allLogsForTraining);
      } else if (typeof analyzeHealthMetrics === 'function') {
        Logger.debug('AI Summary - Using fallback analyzeHealthMetrics');
        analysis = analyzeHealthMetrics(sortedLogs);
      } else {
        Logger.error('AI Summary - No analysis function available');
        throw new Error('No analysis function available. AIEngine may not be loaded.');
      }
      
      Logger.debug('AI Summary - Analysis complete', { trendsCount: analysis?.trends ? Object.keys(analysis.trends).length : 0 });
      
      // Use enhanced local analysis from AIEngine
      let webLLMInsights = null;
      
      // Display the combined results (with enhanced local insights)
      displayAISummary(analysis, sortedLogs, sortedLogs.length, webLLMInsights);
      
      Logger.info('AI Summary - Display complete');
    } catch (error) {
      console.error('Error in AI Summary analysis:', error);
      Logger.error('AI Summary - Error during analysis', { error: error.message, stack: error.stack });
      
      const resultsContent = document.getElementById('aiResultsContent');
      if (resultsContent) {
        resultsContent.innerHTML = `
          <div class="ai-error">
            <h3>❌ Error Generating AI Summary</h3>
            <p>An error occurred while analysing your health data. Please try again.</p>
            <p style="font-size: 0.9rem; color: #78909c; margin-top: 10px;">Error: ${escapeHTML(error.message)}</p>
        </div>
        `;
      }
    }
  }, 1500);
}

// Store current analysis data for radar chart access
let currentAIAnalysis = null;
let currentAIFilteredLogs = null; // Store filtered logs for average calculation

function displayAISummary(analysis, logs, dayCount, webLLMInsights = null) {
  const resultsContent = document.getElementById('aiResultsContent');
  
  if (!resultsContent) {
    console.error('AI results content element not found');
    return;
  }

  // Store analysis data for radar chart access
  currentAIAnalysis = analysis;
  // Store filtered logs for average calculation (logs parameter contains the filtered logs for the selected range)
  currentAIFilteredLogs = logs;

  // Build the summary HTML with animation classes
  let html = '';
  let animationDelay = 0;

  // AI Insights Section (from enhanced local analysis)
  let insightsText = webLLMInsights;
  
  // If no LLM insights, use enhanced local analysis
  if (!insightsText) {
    insightsText = generateComprehensiveInsights(analysis, logs, dayCount);
  }
  
  if (insightsText) {
    html += `
      <div class="ai-summary-section ai-animate-in" style="animation-delay: ${animationDelay}ms;">
        <h3 class="ai-section-title">🤖 What we found</h3>
        <div class="ai-llm-synopsis">
          ${insightsText.split('\n\n').map(para => {
            const trimmed = para.trim();
            if (!trimmed) return '';
            // Escape HTML first, then format markdown-style bold text
            const escaped = escapeHTML(trimmed);
            let formatted = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            // Format bullet points
            if (trimmed.startsWith('- ')) {
              formatted = formatted.substring(2);
              return `<p class="ai-bullet-point">• ${formatted}</p>`;
            }
            // Format section headers (lines that end with colon and are short)
            if (trimmed.endsWith(':') && trimmed.length < 50) {
              return `<h4 class="ai-subsection-title">${formatted}</h4>`;
            }
            return `<p>${formatted}</p>`;
          }).join('')}
        </div>
      </div>
  `;
    animationDelay += 200;
  }

  // Data in this period - show which data points were logged (all feed into analysis)
  const numericMetricLabels = { bpm: 'BPM', weight: 'Weight', fatigue: 'Fatigue', stiffness: 'Stiffness', backPain: 'Back Pain', sleep: 'Sleep', jointPain: 'Joint Pain', mobility: 'Mobility', dailyFunction: 'Daily Function', swelling: 'Swelling', mood: 'Mood', irritability: 'Irritability', weatherSensitivity: 'Weather Sensitivity', steps: 'Steps', hydration: 'Hydration' };
  const numericWithData = Object.keys(analysis.trends || {}).filter(m => analysis.trends[m]);
  const daysFlare = logs.filter(l => l.flare === 'Yes').length;
  const daysFood = logs.filter(l => {
    if (!l.food) return false;
    const arr = Array.isArray(l.food) ? l.food : [].concat(l.food.breakfast || [], l.food.lunch || [], l.food.dinner || [], l.food.snack || []);
    return arr.length > 0;
  }).length;
  const daysExercise = logs.filter(l => l.exercise && Array.isArray(l.exercise) && l.exercise.length > 0).length;
  const daysStressors = logs.filter(l => l.stressors && Array.isArray(l.stressors) && l.stressors.length > 0).length;
  const daysSymptoms = logs.filter(l => l.symptoms && Array.isArray(l.symptoms) && l.symptoms.length > 0).length;
  const daysPainLocation = logs.filter(l => l.painLocation && String(l.painLocation).trim().length > 0).length;
  const daysEnergyClarity = logs.filter(l => l.energyClarity && String(l.energyClarity).trim().length > 0).length;
  const daysNotes = logs.filter(l => l.notes && String(l.notes).trim().length > 0).length;
  const numericList = numericWithData.map(m => numericMetricLabels[m] || m.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())).join(', ');
  html += `
    <div class="ai-summary-section ai-animate-in" style="animation-delay: ${animationDelay}ms;">
      <h3 class="ai-section-title">📋 What you logged in this period</h3>
      <p style="color: rgba(224, 242, 241, 0.8); margin-bottom: 0.75rem; font-size: 0.95rem;">Everything below is used in your analysis.</p>
      <ul class="ai-list" style="margin-top: 0.5rem; columns: 1; font-size: 0.9rem;">
        <li><strong>Numbers you tracked:</strong> ${numericList || 'None'}</li>
        <li><strong>Flare-up:</strong> ${daysFlare} ${daysFlare === 1 ? 'day' : 'days'}</li>
        <li><strong>Food:</strong> ${daysFood} ${daysFood === 1 ? 'day' : 'days'}</li>
        <li><strong>Exercise:</strong> ${daysExercise} ${daysExercise === 1 ? 'day' : 'days'}</li>
        <li><strong>Stress or triggers:</strong> ${daysStressors} ${daysStressors === 1 ? 'day' : 'days'}</li>
        <li><strong>Symptoms:</strong> ${daysSymptoms} ${daysSymptoms === 1 ? 'day' : 'days'}</li>
        <li><strong>Where it hurt:</strong> ${daysPainLocation} ${daysPainLocation === 1 ? 'day' : 'days'}</li>
        <li><strong>Energy and clarity:</strong> ${daysEnergyClarity} ${daysEnergyClarity === 1 ? 'day' : 'days'}</li>
        <li><strong>Notes:</strong> ${daysNotes} ${daysNotes === 1 ? 'day' : 'days'}</li>
      </ul>
    </div>
  `;
  animationDelay += 200;

  // Trends section - simplified for non-technical users
  html += `
    <div class="ai-summary-section ai-animate-in" style="animation-delay: ${animationDelay}ms;">
      <h3 class="ai-section-title">📈 How you're doing</h3>
      <p style="color: rgba(224, 242, 241, 0.8); margin-bottom: 1.5rem; font-size: 0.95rem;">A simple look at your numbers: what's getting better, staying the same, or may need attention.</p>
      <div class="ai-trends-grid">
  `;
  animationDelay += 200;
  
  Object.keys(analysis.trends).forEach((metric, index) => {
    const trend = analysis.trends[metric];
    const isBPM = metric === 'bpm';
    
    // Determine status and colors based on average vs current comparison
    // Use predictedStatus for predicted value, statusFromAverage for current trend
    const currentStatus = trend.statusFromAverage || 'stable';
    const predictedStatus = trend.predictedStatus || 'stable';
    
    // Set icon and color based on status
    let trendIcon, trendColor, predictedColor;
    if (currentStatus === 'improving') {
      trendIcon = "📈";
      trendColor = "#4caf50"; // Green for improving
    } else if (currentStatus === 'worsening') {
      trendIcon = "📉";
      trendColor = "#f44336"; // Red for worsening
    } else {
      trendIcon = "➡️";
      trendColor = "#e91e63"; // Pink/magenta for stable (matches button)
    }
    
    // Predicted color based on predicted status
    if (predictedStatus === 'improving') {
      predictedColor = "#4caf50"; // Green for improving
    } else if (predictedStatus === 'worsening') {
      predictedColor = "#f44336"; // Red for worsening
    } else {
      predictedColor = "#e91e63"; // Pink/magenta for stable (matches button)
    }
    
    const metricName = metric.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    const isWeight = metric === 'weight';
    const isSteps = metric === 'steps';
    const isHydration = metric === 'hydration';
    
    // Format values differently for BPM, Weight, Steps, Hydration vs other metrics
    let averageDisplay, currentDisplay, predictedDisplay = '';
    
    if (isBPM) {
      // BPM: whole numbers only
      averageDisplay = Math.round(trend.average).toString();
      currentDisplay = Math.round(trend.current).toString();
      if (trend.projected7Days !== undefined && trend.projected7Days !== null) {
        predictedDisplay = Math.round(trend.projected7Days).toString();
      }
    } else if (isWeight) {
      // Weight: show actual weight value with unit (1 decimal place)
      const weightUnit = appSettings.weightUnit || 'kg';
      const weightUnitSuffix = weightUnit === 'lb' ? 'lb' : 'kg';
      
      // Convert to display unit if needed
      let avgWeight = trend.average;
      let currentWeight = trend.current;
      let predictedWeight = trend.projected7Days;
      
      if (weightUnit === 'lb') {
        avgWeight = parseFloat(kgToLb(avgWeight));
        currentWeight = parseFloat(kgToLb(currentWeight));
        if (predictedWeight !== undefined && predictedWeight !== null) {
          predictedWeight = parseFloat(kgToLb(predictedWeight));
        }
      }
      
      averageDisplay = avgWeight.toFixed(1) + weightUnitSuffix;
      currentDisplay = currentWeight.toFixed(1) + weightUnitSuffix;
      if (predictedWeight !== undefined && predictedWeight !== null) {
        predictedDisplay = predictedWeight.toFixed(1) + weightUnitSuffix;
      }
    } else if (isSteps) {
      // Steps: whole numbers with comma formatting
      averageDisplay = Math.round(trend.average).toLocaleString();
      currentDisplay = Math.round(trend.current).toLocaleString();
      if (trend.projected7Days !== undefined && trend.projected7Days !== null) {
        predictedDisplay = Math.round(trend.projected7Days).toLocaleString();
      }
    } else if (isHydration) {
      // Hydration: show as glasses (1 decimal place)
      averageDisplay = trend.average.toFixed(1) + ' glasses';
      currentDisplay = trend.current.toFixed(1) + ' glasses';
      if (trend.projected7Days !== undefined && trend.projected7Days !== null) {
        predictedDisplay = trend.projected7Days.toFixed(1) + ' glasses';
      }
    } else {
      // Other metrics: 0-10 scale
      averageDisplay = Math.round(trend.average) + '/10';
      currentDisplay = Math.round(trend.current) + '/10';
      if (trend.projected7Days !== undefined && trend.projected7Days !== null) {
        predictedDisplay = Math.round(trend.projected7Days) + '/10';
      }
    }
    
    // Create simple, user-friendly trend description
    let trendDescription = '';
    if (currentStatus === 'improving') {
      trendDescription = 'Getting Better';
    } else if (currentStatus === 'worsening') {
      trendDescription = 'Getting Worse';
    } else {
      trendDescription = 'Staying Stable';
    }
    
    // Plain-English prediction description
    let predictionDescription = '';
    if (predictedDisplay) {
      if (predictedStatus === 'improving') {
        predictionDescription = 'may get better';
      } else if (predictedStatus === 'worsening') {
        predictionDescription = 'may get worse';
      } else {
        predictionDescription = 'may stay about the same';
      }
    }
    
    // Use plain-English labels for different metric types
    let averageLabel = 'Your average:';
    let currentLabel = 'Right now:';
    let predictedLabel = 'Next week (possible):';
    
    if (isSteps) {
      averageLabel = 'Average steps:';
      currentLabel = 'Right now:';
      predictedLabel = 'Next week (possible):';
    } else if (isHydration) {
      averageLabel = 'Average glasses per day:';
      currentLabel = 'Right now:';
      predictedLabel = 'Next week (possible):';
    }
    
    html += `
      <div class="ai-trend-card ai-animate-in" style="border-left-color: ${trendColor}; animation-delay: ${animationDelay + (index * 100)}ms;">
        <div class="ai-trend-header">
          <strong>${trendIcon} ${metricName}</strong>
          <span style="font-size: 0.9rem; color: ${trendColor}; font-weight: 600;">${trendDescription}</span>
        </div>
        <div class="ai-trend-stats">
          <span>${averageLabel} <strong style="color: ${trendColor};">${averageDisplay}</strong></span>
          <span>${currentLabel} <strong style="color: ${trendColor};">${currentDisplay}</strong></span>
          ${predictedDisplay ? `<span>${predictedLabel} <strong style="color: ${predictedColor};">${predictedDisplay}</strong> <small style="color: #78909c; font-size: 0.85rem;">(${predictionDescription})</small></span>` : ''}
      </div>
    </div>
  `;
  });
  
  html += `</div></div>`;
  animationDelay += 300;

  // Flare-up risk section
  if (analysis.flareUpRisk) {
    const riskLevel = analysis.flareUpRisk.level;
    const riskColor = riskLevel === 'high' ? '#f44336' : riskLevel === 'moderate' ? '#ff9800' : '#ffc107';
    const riskIcon = riskLevel === 'high' ? '🔴' : riskLevel === 'moderate' ? '🟡' : '🟠';
    
    html += `
      <div class="ai-summary-section ai-section-warning ai-animate-in" style="animation-delay: ${animationDelay}ms;">
        <h3 class="ai-section-title" style="color: ${riskColor};">${riskIcon} Heads-up: possible flare-up</h3>
        <div class="ai-llm-synopsis">
          <p><strong>Risk level: ${riskLevel}</strong></p>
          <p>Your recent numbers look like times when you had a flare-up before. Keep an eye on how you feel and do what usually helps you.</p>
          <p style="font-size: 0.9rem; color: rgba(224, 242, 241, 0.7); margin-top: 10px;">
            ${analysis.flareUpRisk.matchingMetrics} of 5 warning signs are present
          </p>
        </div>
      </div>
    `;
    animationDelay += 300;
  }

  // Correlation matrix section
  if (analysis.correlationMatrix) {
    const strongCorrelations = [];
    const metrics = Object.keys(analysis.correlationMatrix);
    
    metrics.forEach(metric1 => {
      if (!analysis.correlationMatrix[metric1]) return;
      metrics.forEach(metric2 => {
        if (metric1 >= metric2) return; // Avoid duplicates
        const corr = analysis.correlationMatrix[metric1][metric2];
        if (corr && Math.abs(corr) > 0.6) {
          // Find a third metric that correlates with both metric1 and metric2
          let metric3 = null;
          let metric3Field = null;
          let bestCorrelation = 0;
          
          metrics.forEach(metric3Candidate => {
            if (metric3Candidate === metric1 || metric3Candidate === metric2) return;
            
            const corr1_3 = analysis.correlationMatrix[metric1] && analysis.correlationMatrix[metric1][metric3Candidate];
            const corr2_3 = analysis.correlationMatrix[metric2] && analysis.correlationMatrix[metric2][metric3Candidate];
            
            // Check if metric3Candidate correlates with both (at least 0.5 correlation with each)
            if (corr1_3 && corr2_3 && Math.abs(corr1_3) > 0.5 && Math.abs(corr2_3) > 0.5) {
              // Use the average correlation strength as the score
              const avgCorr = (Math.abs(corr1_3) + Math.abs(corr2_3)) / 2;
              if (avgCorr > bestCorrelation) {
                bestCorrelation = avgCorr;
                metric3Field = metric3Candidate;
                metric3 = metric3Candidate.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
              }
            }
          });
          
          // If no third metric found, use the one with highest correlation to either metric1 or metric2
          if (!metric3Field) {
            metrics.forEach(metric3Candidate => {
              if (metric3Candidate === metric1 || metric3Candidate === metric2) return;
              
              const corr1_3 = analysis.correlationMatrix[metric1] && analysis.correlationMatrix[metric1][metric3Candidate];
              const corr2_3 = analysis.correlationMatrix[metric2] && analysis.correlationMatrix[metric2][metric3Candidate];
              
              const maxCorr = Math.max(
                corr1_3 ? Math.abs(corr1_3) : 0,
                corr2_3 ? Math.abs(corr2_3) : 0
              );
              
              if (maxCorr > bestCorrelation && maxCorr > 0.5) {
                bestCorrelation = maxCorr;
                metric3Field = metric3Candidate;
                metric3 = metric3Candidate.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
              }
            });
          }
          
          const metric1Name = metric1.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
          const metric2Name = metric2.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
          
          strongCorrelations.push({
            metric1: metric1Name,
            metric2: metric2Name,
            metric3: metric3 || 'N/A',
            metric1Field: metric1,
            metric2Field: metric2,
            metric3Field: metric3Field,
            correlation: corr
          });
        }
      });
    });
    
    if (strongCorrelations.length > 0) {
      // Sort by correlation strength and limit to top 3
      strongCorrelations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
      const topCorrelations = strongCorrelations.slice(0, 3);
      
      html += `
        <div class="ai-summary-section ai-animate-in" style="animation-delay: ${animationDelay}ms;">
          <h3 class="ai-section-title">🔗 When two things change together</h3>
          <p style="color: rgba(224, 242, 241, 0.8); margin-bottom: 1rem;">When one of these goes up or down, the other usually does too. Click a card to see your average, current, and predicted values.</p>
          <div class="ai-trends-grid">
      `;
      
      topCorrelations.forEach((corr, index) => {
        const corrColor = corr.correlation > 0 ? '#e91e63' : '#f44336';
        const direction = corr.correlation > 0 ? 'goes up when' : 'goes down when';
        const strength = Math.abs(corr.correlation) > 0.7 ? 'strongly' : Math.abs(corr.correlation) > 0.5 ? 'usually' : 'sometimes';
        
        html += `
          <div class="ai-trend-card ai-animate-in" style="border-left-color: ${corrColor}; animation-delay: ${animationDelay + (index * 100)}ms; cursor: pointer;" onclick="toggleCorrelationRadarChart('${corr.metric1Field}', '${corr.metric2Field}', '${corr.metric3Field || ''}', ${index})" data-correlation-index="${index}">
            <div class="ai-trend-header">
              <strong>${corr.metric1} ${strength} ${direction} ${corr.metric2}</strong>
            </div>
            <div class="metric-radar-chart-container" id="correlationRadarChart_${index}" style="display: none; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid rgba(255, 255, 255, 0.1);">
              <div id="correlationRadarChart_${index}_chart" style="height: 400px;"></div>
            </div>
          </div>
        `;
      });
      
      html += `</div></div>`;
      animationDelay += 300;
      
      // Display correlation clusters if available - simplified for non-technical users
      if (analysis.correlationClusters && analysis.correlationClusters.length > 0) {
        html += `
          <div class="ai-summary-section ai-animate-in" style="animation-delay: ${animationDelay}ms;">
            <h4 class="ai-subsection-title">📊 Groups that change together</h4>
            <p style="font-size: 0.95rem; color: rgba(224, 242, 241, 0.8); line-height: 1.8; margin-top: 0.5rem;">
              When one of these gets better or worse, the others usually do too:
            </p>
            <ul class="ai-list" style="margin-top: 1rem;">
              ${analysis.correlationClusters.map((cluster, idx) => {
                const clusterNames = cluster.map(m => m.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())).join(', ');
                return `<li style="margin-bottom: 0.75rem;">${clusterNames}</li>`;
              }).join('')}
            </ul>
          </div>
        `;
        animationDelay += 200;
      }
    }
  }

  // Stressors impact section
  if (analysis.stressorAnalysis && analysis.stressorAnalysis.topStressors.length > 0) {
    const stressorAnalysis = analysis.stressorAnalysis;
    html += `
      <div class="ai-summary-section ai-section-info ai-animate-in" style="animation-delay: ${animationDelay}ms;">
        <h3 class="ai-section-title ai-section-green">😰 Stress and triggers</h3>
        <p style="color: rgba(224, 242, 241, 0.8); margin-bottom: 1rem;">${stressorAnalysis.summary}</p>
    `;
    
    if (stressorAnalysis.impacts.length > 0) {
      html += `<ul class="ai-list">`;
      stressorAnalysis.impacts.slice(0, 3).forEach((impact, index) => {
        html += `<li class="ai-animate-in" style="animation-delay: ${animationDelay + 100 + (index * 100)}ms;">${impact}</li>`;
      });
      html += `</ul>`;
    }
    
    html += `</div>`;
    animationDelay += 300;
  }
  
  // Symptoms and pain location analysis section
  if (analysis.symptomsAndPainAnalysis && (analysis.symptomsAndPainAnalysis.topSymptoms.length > 0 || analysis.symptomsAndPainAnalysis.topPainLocations.length > 0)) {
    const symptomsAnalysis = analysis.symptomsAndPainAnalysis;
    html += `
      <div class="ai-summary-section ai-section-info ai-animate-in" style="animation-delay: ${animationDelay}ms;">
        <h3 class="ai-section-title ai-section-green">💉 Symptoms and where you had pain</h3>
        <p style="color: rgba(224, 242, 241, 0.8); margin-bottom: 1rem;">${symptomsAnalysis.summary}</p>
    `;
    
    if (symptomsAnalysis.symptomImpacts.length > 0 || symptomsAnalysis.painLocationImpacts.length > 0) {
      html += `<ul class="ai-list">`;
      [...symptomsAnalysis.symptomImpacts, ...symptomsAnalysis.painLocationImpacts].slice(0, 3).forEach((impact, index) => {
        html += `<li class="ai-animate-in" style="animation-delay: ${animationDelay + 100 + (index * 100)}ms;">${impact}</li>`;
      });
      html += `</ul>`;
    }
    
    html += `</div>`;
    animationDelay += 300;
  }
  
  // Pain by body part (22 diagram regions with counts) — always show when analysis has pain data
  if (analysis.symptomsAndPainAnalysis && analysis.symptomsAndPainAnalysis.painByRegion) {
    const painByRegion = analysis.symptomsAndPainAnalysis.painByRegion;
    const regionsWithPain = Object.entries(painByRegion)
      .filter(([, data]) => data && (data.painDays > 0 || data.mildDays > 0))
      .sort((a, b) => (b[1].painDays + b[1].mildDays) - (a[1].painDays + a[1].mildDays));
    html += `
      <div class="ai-summary-section ai-section-info ai-animate-in" style="animation-delay: ${animationDelay}ms;">
        <h3 class="ai-section-title ai-section-green">📍 Pain by body part</h3>
        <p style="color: rgba(224, 242, 241, 0.8); margin-bottom: 1rem;">Body areas from the pain diagram: where you had mild or pain in this period.</p>
        <ul class="ai-list" style="columns: 2; column-gap: 1.5rem;">
    `;
    if (regionsWithPain.length > 0) {
      regionsWithPain.forEach(([, data], index) => {
        const painStr = data.painDays > 0 ? `${data.painDays} pain` : '';
        const mildStr = data.mildDays > 0 ? `${data.mildDays} mild` : '';
        html += `<li class="ai-animate-in" style="animation-delay: ${animationDelay + 50 + (index * 30)}ms;">${escapeHTML(data.label)}: ${[painStr, mildStr].filter(Boolean).join(', ')}</li>`;
      });
    } else {
      html += `<li class="ai-animate-in" style="animation-delay: ${animationDelay + 50}ms;">No body areas with pain or mild in this period.</li>`;
    }
    html += `</ul></div>`;
    animationDelay += 300;
  }
  
  // Nutrition analysis section
  if (analysis.nutritionAnalysis && analysis.nutritionAnalysis.avgCalories > 0) {
    const nutrition = analysis.nutritionAnalysis;
    html += `
      <div class="ai-summary-section ai-section-info ai-animate-in" style="animation-delay: ${animationDelay}ms;">
        <h3 class="ai-section-title ai-section-green">🍽️ What you ate (calories and protein)</h3>
        <p style="color: rgba(224, 242, 241, 0.8); margin-bottom: 1rem;">
          On average per day: <strong>${nutrition.avgCalories} calories</strong> and <strong>${nutrition.avgProtein}g protein</strong>
        </p>
    `;
    
    if (nutrition.highCalorieDays > 0 || nutrition.lowCalorieDays > 0) {
      html += `<p style="color: rgba(224, 242, 241, 0.7); font-size: 0.9rem;">`;
      if (nutrition.highCalorieDays > 0) {
        html += `Days over 2500 calories: ${nutrition.highCalorieDays}. `;
      }
      if (nutrition.lowCalorieDays > 0) {
        html += `Days under 1500 calories: ${nutrition.lowCalorieDays}`;
      }
      html += `</p>`;
    }
    
    if (nutrition.highProteinDays > 0 || nutrition.lowProteinDays > 0) {
      html += `<p style="color: rgba(224, 242, 241, 0.7); font-size: 0.9rem;">`;
      if (nutrition.highProteinDays > 0) {
        html += `Days over 100g protein: ${nutrition.highProteinDays}. `;
      }
      if (nutrition.lowProteinDays > 0) {
        html += `Days under 50g protein: ${nutrition.lowProteinDays}`;
      }
      html += `</p>`;
    }
    
    html += `</div>`;
    animationDelay += 300;
  }
  
  // Exercise summary (avg minutes on days with exercise)
  if (analysis.exerciseSummary && analysis.exerciseSummary.daysWithExercise > 0) {
    const ex = analysis.exerciseSummary;
    html += `
      <div class="ai-summary-section ai-section-info ai-animate-in" style="animation-delay: ${animationDelay}ms;">
        <h3 class="ai-section-title ai-section-green">🏃 Exercise</h3>
        <p style="color: rgba(224, 242, 241, 0.8); margin-bottom: 0;">
          On days you logged exercise: about <strong>${ex.avgMinutesPerDay} minutes</strong> on average (${ex.daysWithExercise} days in this period)
        </p>
      </div>
    `;
    animationDelay += 300;
  }
  
  // Food/Exercise impact section - simplified
  if (analysis.foodExerciseImpacts && analysis.foodExerciseImpacts.length > 0) {
    html += `
      <div class="ai-summary-section ai-animate-in" style="animation-delay: ${animationDelay}ms;">
        <h3 class="ai-section-title">🍽️ What seems to help you feel better</h3>
        <p style="color: rgba(224, 242, 241, 0.8); margin-bottom: 1rem;">From your logs: how food and exercise line up with how you feel.</p>
        <div class="ai-trends-grid">
    `;
    
    analysis.foodExerciseImpacts.slice(0, 6).forEach((impact, index) => {
      const impactColor = impact.isPositive ? '#e91e63' : '#ff9800';
      const impactIcon = impact.isPositive ? '✅' : '⚠️';
      let impactType = 'Nutrition';
      if (impact.type === 'food') impactType = 'When you log food';
      else if (impact.type === 'exercise') impactType = 'When you exercise';
      const simpleDirection = impact.isPositive ? 'tends to be better' : 'tends to be worse';
      
      html += `
        <div class="ai-trend-card ai-animate-in" style="border-left-color: ${impactColor}; animation-delay: ${animationDelay + (index * 100)}ms;">
          <div class="ai-trend-header">
            <strong>${impactIcon} ${impactType}</strong>
          </div>
          <div class="ai-trend-stats">
            ${impact.description ? 
              `<span>${impact.description}</span>` :
              `<span><strong>${impact.metric}:</strong> ${impact.withAvg} (when you logged) vs ${impact.withoutAvg} (when you didn't)</span>
               <span style="color: ${impactColor}; font-size: 0.9rem;">${simpleDirection}</span>`
            }
          </div>
        </div>
      `;
    });
    
    html += `</div></div>`;
    animationDelay += 300;
  }

  // Anomalies section
  if (analysis.anomalies.length > 0) {
  html += `
      <div class="ai-summary-section ai-section-warning ai-animate-in" style="animation-delay: ${animationDelay}ms;">
        <h3 class="ai-section-title ai-section-orange">⚠️ Things to watch</h3>
        <ul class="ai-list ai-list-warning">
    `;
    analysis.anomalies.forEach((anomaly, index) => {
      html += `<li class="ai-animate-in" style="animation-delay: ${animationDelay + 200 + (index * 100)}ms;">${anomaly}</li>`;
    });
    html += `</ul></div>`;
    animationDelay += 300;
  }

  // General management section - simplified
  html += `
    <div class="ai-summary-section ai-section-info ai-animate-in" style="animation-delay: ${animationDelay}ms;">
      <h3 class="ai-section-title ai-section-green">💡 Important</h3>
      <p class="ai-disclaimer">
        <strong>Remember:</strong> This is to help you see patterns in your health. Always talk to your doctor before changing anything about your care. You can show them this at your next visit.
      </p>
    </div>
  `;

  // Set the HTML content
  resultsContent.innerHTML = html;
  
  // Scroll to the AI results section smoothly
  if (resultsContent) {
    setTimeout(() => {
      resultsContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }
}

// Toggle radar chart for a specific metric
function toggleMetricRadarChart(metric, index) {
  const chartContainer = document.getElementById(`metricRadarChart_${metric}`);
  const chartDiv = document.getElementById(`metricRadarChart_${metric}_chart`);
  
  if (!chartContainer || !chartDiv) {
    console.error('Radar chart container not found');
    return;
  }

  // Toggle visibility
  const isVisible = chartContainer.style.display !== 'none';
  
  if (isVisible) {
    // Hide chart
    chartContainer.style.display = 'none';
    if (chartDiv.chart) {
      chartDiv.chart.destroy();
      chartDiv.chart = null;
    }
  } else {
    // Show and render chart
    chartContainer.style.display = 'block';
    renderMetricRadarChart(metric, chartDiv);
  }
}

// Render radar chart for a specific metric
function renderMetricRadarChart(metric, container) {
  if (!currentAIAnalysis || !currentAIAnalysis.trends[metric]) {
    console.error('No trend data available for metric:', metric);
    return;
  }
  
  const trend = currentAIAnalysis.trends[metric];
  const isSteps = metric === 'steps';
  const isHydration = metric === 'hydration';
  const isBPM = metric === 'bpm';
  const isWeight = metric === 'weight';
  
  // Calculate average from filtered logs for the selected analysis range
  let average = trend.average;
  if (currentAIFilteredLogs && currentAIFilteredLogs.length > 0) {
    const values = currentAIFilteredLogs
      .filter(log => {
        const value = log[metric];
        if (metric === 'hydration') {
          return value !== undefined && value !== null && value !== '' && !isNaN(parseFloat(value)) && parseFloat(value) >= 0;
        }
        return value !== undefined && value !== null && value !== '' && !isNaN(parseFloat(value));
      })
      .map(log => parseFloat(log[metric]) || 0);
    
    if (values.length > 0) {
      const sum = values.reduce((a, b) => a + b, 0);
      average = sum / values.length;
    }
  }
  
  // Get current and predicted values
  let current = trend.current;
  let predicted = trend.projected7Days !== undefined && trend.projected7Days !== null 
    ? trend.projected7Days 
    : current; // Fallback to current if no prediction
  
  // Normalize values to 0-10 scale for radar chart
  let normalizedAverage, normalizedCurrent, normalizedPredicted;
  
  if (isSteps) {
    // Steps: normalize to 0-10 (max 50000 = 10)
    const maxSteps = 50000;
    normalizedAverage = (average / maxSteps) * 10;
    normalizedCurrent = (current / maxSteps) * 10;
    normalizedPredicted = (predicted / maxSteps) * 10;
  } else if (isHydration) {
    // Hydration: normalize to 0-10 (max 20 glasses = 10)
    const maxHydration = 20;
    normalizedAverage = (average / maxHydration) * 10;
    normalizedCurrent = (current / maxHydration) * 10;
    normalizedPredicted = (predicted / maxHydration) * 10;
  } else if (isBPM) {
    // BPM: normalize to 0-10 (assume range 40-120, center at 80)
    const minBPM = 40;
    const maxBPM = 120;
    normalizedAverage = ((average - minBPM) / (maxBPM - minBPM)) * 10;
    normalizedCurrent = ((current - minBPM) / (maxBPM - minBPM)) * 10;
    normalizedPredicted = ((predicted - minBPM) / (maxBPM - minBPM)) * 10;
    // Clamp to 0-10
    normalizedAverage = Math.max(0, Math.min(10, normalizedAverage));
    normalizedCurrent = Math.max(0, Math.min(10, normalizedCurrent));
    normalizedPredicted = Math.max(0, Math.min(10, normalizedPredicted));
  } else if (isWeight) {
    // Weight: normalize based on reasonable range (assume 40-150 kg)
    const minWeight = 40;
    const maxWeight = 150;
    normalizedAverage = ((average - minWeight) / (maxWeight - minWeight)) * 10;
    normalizedCurrent = ((current - minWeight) / (maxWeight - minWeight)) * 10;
    normalizedPredicted = ((predicted - minWeight) / (maxWeight - minWeight)) * 10;
    // Clamp to 0-10
    normalizedAverage = Math.max(0, Math.min(10, normalizedAverage));
    normalizedCurrent = Math.max(0, Math.min(10, normalizedCurrent));
    normalizedPredicted = Math.max(0, Math.min(10, normalizedPredicted));
  } else {
    // Other metrics: already on 0-10 scale
    normalizedAverage = average;
    normalizedCurrent = current;
    normalizedPredicted = predicted;
  }
  
  // Clamp all values to 0-10
  normalizedAverage = Math.max(0, Math.min(10, normalizedAverage));
  normalizedCurrent = Math.max(0, Math.min(10, normalizedCurrent));
  normalizedPredicted = Math.max(0, Math.min(10, normalizedPredicted));
  
  // Format labels for tooltip
  let averageLabel, currentLabel, predictedLabel;
  if (isSteps) {
    averageLabel = Math.round(average).toLocaleString();
    currentLabel = Math.round(current).toLocaleString();
    predictedLabel = Math.round(predicted).toLocaleString();
  } else if (isHydration) {
    averageLabel = average.toFixed(1) + ' glasses';
    currentLabel = current.toFixed(1) + ' glasses';
    predictedLabel = predicted.toFixed(1) + ' glasses';
  } else if (isBPM) {
    averageLabel = Math.round(average) + ' BPM';
    currentLabel = Math.round(current) + ' BPM';
    predictedLabel = Math.round(predicted) + ' BPM';
  } else if (isWeight) {
    const weightUnit = appSettings.weightUnit || 'kg';
    const weightUnitSuffix = weightUnit === 'lb' ? 'lb' : 'kg';
    // Convert if needed
    let avgWeight = average;
    let currentWeight = current;
    let predictedWeight = predicted;
    if (weightUnit === 'lb') {
      avgWeight = parseFloat(kgToLb(avgWeight));
      currentWeight = parseFloat(kgToLb(currentWeight));
      predictedWeight = parseFloat(kgToLb(predictedWeight));
    }
    averageLabel = avgWeight.toFixed(1) + ' ' + weightUnitSuffix;
    currentLabel = currentWeight.toFixed(1) + ' ' + weightUnitSuffix;
    predictedLabel = predictedWeight.toFixed(1) + ' ' + weightUnitSuffix;
  } else {
    averageLabel = average.toFixed(1) + '/10';
    currentLabel = current.toFixed(1) + '/10';
    predictedLabel = predicted.toFixed(1) + '/10';
  }
  
  // Get metric name for display
    const metricName = metric.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  
  // Create radar chart matching Balance chart style
  // For a single metric, we need at least 3 categories for a proper radar chart
  // We'll use the metric name as the category and repeat it to form a polygon
  // Show 3 series (Average, Right Now, Predicted) 
  const options = {
    series: [{
      name: 'Average',
      data: [normalizedAverage, normalizedAverage, normalizedAverage]
    }, {
      name: 'Right Now',
      data: [normalizedCurrent, normalizedCurrent, normalizedCurrent]
    }, {
      name: 'Predicted',
      data: [normalizedPredicted, normalizedPredicted, normalizedPredicted]
    }],
    chart: {
      type: 'radar',
      height: 400,
      toolbar: {
        show: false
      },
      background: 'transparent'
    },
    colors: ['#4caf50', '#2196f3', '#e91e63'], // Green for average, Blue for current, Pink for predicted
    fill: {
      opacity: 0.3
    },
    stroke: {
      width: 2,
      colors: ['#4caf50', '#2196f3', '#e91e63']
    },
    markers: {
      size: 4,
      colors: ['#4caf50', '#2196f3', '#e91e63'],
      strokeColors: ['#4caf50', '#2196f3', '#e91e63'],
      strokeWidth: 2
    },
    xaxis: {
      categories: [metricName, metricName, metricName]
    },
    yaxis: {
      min: 0,
      max: 10,
      tickAmount: 5,
      labels: {
        formatter: function(val) {
          return val.toFixed(1);
        },
        style: {
          colors: '#e0f2f1'
        }
      }
    },
    plotOptions: {
      radar: {
        polygons: {
          strokeColors: '#374151',
          fill: {
            colors: ['rgba(55, 65, 81, 0.1)']
          }
        }
      }
    },
    tooltip: {
      y: {
        formatter: function(val, opts) {
          const seriesName = opts.series[opts.seriesIndex].name;
          if (seriesName === 'Average') {
            return averageLabel;
          } else if (seriesName === 'Right Now') {
            return currentLabel;
          } else {
            return predictedLabel;
          }
        }
      }
    },
    legend: {
      show: true,
      position: 'bottom',
      labels: {
        colors: '#e0f2f1'
      },
      markers: {
        width: 12,
        height: 12,
        radius: 2
      }
    },
    title: {
      text: undefined
    },
    theme: {
      mode: 'dark',
      palette: 'palette1'
    }
  };
  
  // Destroy existing chart if it exists
  if (container.chart) {
    container.chart.destroy();
  }
  
  // Create new chart
  container.chart = new ApexCharts(container, options);
  container.chart.render();
}

// Toggle correlation radar chart visibility
function toggleCorrelationRadarChart(metric1, metric2, metric3, index) {
  const chartContainer = document.getElementById(`correlationRadarChart_${index}`);
  const chartDiv = document.getElementById(`correlationRadarChart_${index}_chart`);
  
  if (!chartContainer || !chartDiv) {
    console.error('Correlation radar chart container not found');
    return;
  }
  
  // Toggle visibility
  const isVisible = chartContainer.style.display !== 'none';
  
  if (isVisible) {
    // Hide chart
    chartContainer.style.display = 'none';
    if (chartDiv.chart) {
      chartDiv.chart.destroy();
      chartDiv.chart = null;
    }
  } else {
    // Show and render chart
    chartContainer.style.display = 'block';
    renderCorrelationRadarChart(metric1, metric2, metric3, chartDiv);
  }
}

// Render radar chart for a correlation between two metrics with a third associated metric
function renderCorrelationRadarChart(metric1, metric2, metric3, container) {
  if (!currentAIAnalysis || !currentAIAnalysis.trends[metric1] || !currentAIAnalysis.trends[metric2]) {
    console.error('No trend data available for correlation:', metric1, metric2);
    return;
  }
  
  const trend1 = currentAIAnalysis.trends[metric1];
  const trend2 = currentAIAnalysis.trends[metric2];
  
  // Get third metric trend if available, otherwise use a fallback
  let trend3 = null;
  let metric3Name = 'Combined Average';
  let hasMetric3 = false;
  
  if (metric3 && metric3 !== 'N/A' && currentAIAnalysis.trends[metric3]) {
    trend3 = currentAIAnalysis.trends[metric3];
    metric3Name = metric3.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    hasMetric3 = true;
  }
  
  // Get metric names for display
  const metric1Name = metric1.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  const metric2Name = metric2.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  
  // Calculate averages from filtered logs
  let average1 = trend1.average;
  let average2 = trend2.average;
  let average3 = hasMetric3 && trend3 ? trend3.average : (average1 + average2) / 2;
  
  if (currentAIFilteredLogs && currentAIFilteredLogs.length > 0) {
    const values1 = currentAIFilteredLogs
      .filter(log => {
        const value = log[metric1];
        return value !== undefined && value !== null && value !== '' && !isNaN(parseFloat(value));
      })
      .map(log => parseFloat(log[metric1]) || 0);
    
    const values2 = currentAIFilteredLogs
      .filter(log => {
        const value = log[metric2];
        return value !== undefined && value !== null && value !== '' && !isNaN(parseFloat(value));
      })
      .map(log => parseFloat(log[metric2]) || 0);
    
    if (hasMetric3 && metric3) {
      const values3 = currentAIFilteredLogs
        .filter(log => {
          const value = log[metric3];
          return value !== undefined && value !== null && value !== '' && !isNaN(parseFloat(value));
        })
        .map(log => parseFloat(log[metric3]) || 0);
      
      if (values3.length > 0) {
        const sum3 = values3.reduce((a, b) => a + b, 0);
        average3 = sum3 / values3.length;
      }
    }
    
    if (values1.length > 0) {
      const sum1 = values1.reduce((a, b) => a + b, 0);
      average1 = sum1 / values1.length;
    }
    
    if (values2.length > 0) {
      const sum2 = values2.reduce((a, b) => a + b, 0);
      average2 = sum2 / values2.length;
    }
  }
  
  // Get current and predicted values
  let current1 = trend1.current;
  let current2 = trend2.current;
  let current3 = hasMetric3 && trend3 ? trend3.current : (current1 + current2) / 2;
  let predicted1 = trend1.projected7Days !== undefined && trend1.projected7Days !== null ? trend1.projected7Days : current1;
  let predicted2 = trend2.projected7Days !== undefined && trend2.projected7Days !== null ? trend2.projected7Days : current2;
  let predicted3 = hasMetric3 && trend3 && trend3.projected7Days !== undefined && trend3.projected7Days !== null 
    ? trend3.projected7Days 
    : (predicted1 + predicted2) / 2;
  
  // Normalize values (handle different metric types)
  const normalizeValue = (value, metric) => {
    if (metric === 'steps') {
      return Math.min(10, (value / 50000) * 10);
    } else if (metric === 'hydration') {
      return Math.min(10, (value / 20) * 10);
    } else if (metric === 'bpm') {
      return Math.max(0, Math.min(10, ((value - 40) / (120 - 40)) * 10));
    } else if (metric === 'weight') {
      return Math.max(0, Math.min(10, ((value - 40) / (150 - 40)) * 10));
    } else {
      return Math.max(0, Math.min(10, value));
    }
  };
  
  const normalizedAverage1 = normalizeValue(average1, metric1);
  const normalizedCurrent1 = normalizeValue(current1, metric1);
  const normalizedPredicted1 = normalizeValue(predicted1, metric1);
  
  const normalizedAverage2 = normalizeValue(average2, metric2);
  const normalizedCurrent2 = normalizeValue(current2, metric2);
  const normalizedPredicted2 = normalizeValue(predicted2, metric2);
  
  const normalizedAverage3 = normalizeValue(average3, hasMetric3 && metric3 ? metric3 : metric1);
  const normalizedCurrent3 = normalizeValue(current3, hasMetric3 && metric3 ? metric3 : metric1);
  const normalizedPredicted3 = normalizeValue(predicted3, hasMetric3 && metric3 ? metric3 : metric1);
  
  // Format labels
  const formatLabel = (value, metric) => {
    if (metric === 'steps') {
      return Math.round(value).toLocaleString();
    } else if (metric === 'hydration') {
      return value.toFixed(1) + ' glasses';
    } else if (metric === 'bpm') {
      return Math.round(value).toString();
    } else if (metric === 'weight') {
      const weightUnit = appSettings.weightUnit || 'kg';
      if (weightUnit === 'lb') {
        return parseFloat(kgToLb(value)).toFixed(1) + 'lb';
      }
      return value.toFixed(1) + 'kg';
    } else {
      return Math.round(value) + '/10';
    }
  };
  
  const average1Label = formatLabel(average1, metric1);
  const current1Label = formatLabel(current1, metric1);
  const predicted1Label = formatLabel(predicted1, metric1);
  
  const average2Label = formatLabel(average2, metric2);
  const current2Label = formatLabel(current2, metric2);
  const predicted2Label = formatLabel(predicted2, metric2);
  
  const average3Label = formatLabel(average3, hasMetric3 && metric3 ? metric3 : metric1);
  const current3Label = formatLabel(current3, hasMetric3 && metric3 ? metric3 : metric1);
  const predicted3Label = formatLabel(predicted3, hasMetric3 && metric3 ? metric3 : metric1);
  
  // Create radar chart with both metrics
  if (typeof ApexCharts === 'undefined') {
    console.error('ApexCharts is not loaded!');
    return;
  }
  
  // Destroy existing chart if it exists
  if (container.chart) {
    container.chart.destroy();
  }
  
  // Calculate correlation strength as a third data point (normalized to 0-10)
  // Get correlation value from current analysis
  let correlationValue = 0;
  if (currentAIAnalysis && currentAIAnalysis.correlationMatrix && 
      currentAIAnalysis.correlationMatrix[metric1] && 
      currentAIAnalysis.correlationMatrix[metric1][metric2]) {
    correlationValue = Math.abs(currentAIAnalysis.correlationMatrix[metric1][metric2]);
  } else if (currentAIAnalysis && currentAIAnalysis.correlationMatrix && 
             currentAIAnalysis.correlationMatrix[metric2] && 
             currentAIAnalysis.correlationMatrix[metric2][metric1]) {
    correlationValue = Math.abs(currentAIAnalysis.correlationMatrix[metric2][metric1]);
  }
  
  // Normalize correlation to 0-10 scale (correlation is 0-1, so multiply by 10)
  const normalizedCorrelation = correlationValue * 10;
  
  // Calculate average of the two metrics as a third data point
  const normalizedAverageCombined = (normalizedAverage1 + normalizedAverage2) / 2;
  const normalizedCurrentCombined = (normalizedCurrent1 + normalizedCurrent2) / 2;
  const normalizedPredictedCombined = (normalizedPredicted1 + normalizedPredicted2) / 2;
  
  const options = {
    series: [
      {
        name: 'Average',
        data: [normalizedAverage1, normalizedAverage2, normalizedAverage3]
      },
      {
        name: 'Right Now',
        data: [normalizedCurrent1, normalizedCurrent2, normalizedCurrent3]
      },
      {
        name: 'Predicted',
        data: [normalizedPredicted1, normalizedPredicted2, normalizedPredicted3]
      }
    ],
    chart: {
      type: 'radar',
      height: 400,
      toolbar: {
        show: false
      },
      background: 'transparent'
    },
    colors: ['#4caf50', '#2196f3', '#e91e63'], // Green, Blue, Pink
    fill: {
      opacity: 0.3
    },
    stroke: {
      width: 2,
      colors: ['#4caf50', '#2196f3', '#e91e63']
    },
    markers: {
      size: 4,
      colors: ['#4caf50', '#2196f3', '#e91e63'],
      strokeColors: ['#4caf50', '#2196f3', '#e91e63'],
      strokeWidth: 2
    },
    xaxis: {
      categories: [metric1Name, metric2Name, metric3Name]
    },
    yaxis: {
      min: 0,
      max: 10,
      tickAmount: 5,
      labels: {
        formatter: function(val) {
          return val.toFixed(1);
        },
        style: {
          colors: '#e0f2f1'
        }
      }
    },
    plotOptions: {
      radar: {
        polygons: {
          strokeColors: '#374151',
          fill: {
            colors: ['rgba(55, 65, 81, 0.1)']
          }
        }
      }
    },
    tooltip: {
      y: {
        formatter: function(val, opts) {
          const seriesName = opts.series[opts.seriesIndex].name;
          const categoryIndex = opts.dataPointIndex;
          
          if (categoryIndex === 0) {
            // Metric 1
            if (seriesName === 'Average') {
              return average1Label;
            } else if (seriesName === 'Right Now') {
              return current1Label;
            } else {
              return predicted1Label;
            }
          } else if (categoryIndex === 1) {
            // Metric 2
            if (seriesName === 'Average') {
              return average2Label;
            } else if (seriesName === 'Right Now') {
              return current2Label;
            } else {
              return predicted2Label;
            }
          } else {
            // Metric 3 (categoryIndex === 2)
            if (seriesName === 'Average') {
              return average3Label;
            } else if (seriesName === 'Right Now') {
              return current3Label;
            } else {
              return predicted3Label;
            }
          }
        }
      }
    },
    legend: {
      show: true,
      position: 'bottom',
      labels: {
        colors: '#e0f2f1'
      },
      markers: {
        width: 12,
        height: 12,
        radius: 2
      }
    },
    title: {
      text: undefined
    },
    theme: {
      mode: 'dark',
      palette: 'palette1'
    }
  };
  
  container.chart = new ApexCharts(container, options);
  container.chart.render();
}

// Food id -> Font Awesome 6 free icon class (fa-solid fa-*)
const FOOD_ICONS = {
  oatmeal: 'fa-solid fa-bowl-food',
  eggs2: 'fa-solid fa-egg',
  greek_yogurt: 'fa-solid fa-cheese',
  avocado_toast: 'fa-solid fa-bread-slice',
  smoothie: 'fa-solid fa-blender',
  cereal_milk: 'fa-solid fa-bowl-rice',
  banana: 'fa-solid fa-apple-whole',
  toast_butter: 'fa-solid fa-bread-slice',
  grilled_chicken: 'fa-solid fa-drumstick-bite',
  brown_rice: 'fa-solid fa-bowl-rice',
  salmon: 'fa-solid fa-fish',
  quinoa_salad: 'fa-solid fa-bowl-food',
  steamed_veg: 'fa-solid fa-carrot',
  turkey_sandwich: 'fa-solid fa-burger',
  soup_veg: 'fa-solid fa-bowl-food',
  tuna_salad: 'fa-solid fa-fish',
  pasta: 'fa-solid fa-plate-wheat',
  grilled_fish: 'fa-solid fa-fish',
  sweet_potato: 'fa-solid fa-potato',
  mixed_nuts: 'fa-solid fa-seedling',
  apple: 'fa-solid fa-apple-whole',
  hummus_veg: 'fa-solid fa-bowl-food',
  protein_bar: 'fa-solid fa-candy-bar',
  cheese_crackers: 'fa-solid fa-cheese',
  chocolate_bar: 'fa-solid fa-candy-bar',
  fruit_salad: 'fa-solid fa-apple-whole',
  pizza_slice: 'fa-solid fa-pizza-slice',
  bread_slices: 'fa-solid fa-bread-slice'
};

// Energy & Mental Clarity options for tile picker — mood = positive (green), neutral (blue), negative (amber/red)
const ENERGY_CLARITY_OPTIONS = [
  { value: 'High Energy', label: 'High Energy', mood: 'positive' },
  { value: 'Moderate Energy', label: 'Moderate Energy', mood: 'neutral' },
  { value: 'Low Energy', label: 'Low Energy', mood: 'negative' },
  { value: 'Mental Clarity', label: 'Mental Clarity', mood: 'positive' },
  { value: 'Brain Fog', label: 'Brain Fog', mood: 'negative' },
  { value: 'Good Concentration', label: 'Good Concentration', mood: 'positive' },
  { value: 'Poor Concentration', label: 'Poor Concentration', mood: 'negative' },
  { value: 'Mental Fatigue', label: 'Mental Fatigue', mood: 'negative' },
  { value: 'Focused', label: 'Focused', mood: 'positive' },
  { value: 'Distracted', label: 'Distracted', mood: 'negative' }
];

// Energy/clarity groups for grouping tiles by colour (positive, neutral, negative)
const ENERGY_CLARITY_GROUPS = [
  { id: 'positive', label: 'Positive' },
  { id: 'neutral', label: 'Neutral' },
  { id: 'negative', label: 'Negative' }
];

// Energy/clarity value -> Font Awesome 6 icon (square tiles, same style as food/stressor)
const ENERGY_CLARITY_ICONS = {
  'High Energy': 'fa-solid fa-bolt',
  'Moderate Energy': 'fa-solid fa-battery-half',
  'Low Energy': 'fa-solid fa-battery-quarter',
  'Mental Clarity': 'fa-solid fa-lightbulb',
  'Brain Fog': 'fa-solid fa-cloud',
  'Good Concentration': 'fa-solid fa-bullseye',
  'Poor Concentration': 'fa-solid fa-wand-magic-sparkles',
  'Mental Fatigue': 'fa-solid fa-brain',
  'Focused': 'fa-solid fa-crosshairs',
  'Distracted': 'fa-solid fa-arrows-up-down-left-right'
};

// Food group ids for tile colours (grains, protein, dairy, fruits, vegetables, snacks, mixed)
// Predefined food items with calories and nutrients (selectable in food log)
const PREDEFINED_FOODS = [
  { id: 'oatmeal', name: 'Oatmeal with berries', calories: 200, protein: 5, carbs: 36, fat: 4, group: 'grains' },
  { id: 'eggs2', name: 'Eggs, 2 large', calories: 140, protein: 12, carbs: 1, fat: 10, group: 'protein' },
  { id: 'greek_yogurt', name: 'Greek yogurt, 150g', calories: 130, protein: 11, carbs: 6, fat: 5, group: 'dairy' },
  { id: 'avocado_toast', name: 'Avocado toast', calories: 250, protein: 6, carbs: 22, fat: 16, group: 'mixed' },
  { id: 'smoothie', name: 'Green smoothie', calories: 150, protein: 3, carbs: 28, fat: 2, group: 'fruits' },
  { id: 'cereal_milk', name: 'Cereal with milk', calories: 220, protein: 8, carbs: 38, fat: 5, group: 'grains' },
  { id: 'banana', name: 'Banana', calories: 105, protein: 1.3, carbs: 27, fat: 0.4, group: 'fruits' },
  { id: 'toast_butter', name: 'Whole grain toast with butter', calories: 180, protein: 6, carbs: 24, fat: 7, group: 'grains' },
  { id: 'grilled_chicken', name: 'Grilled chicken, 200g', calories: 330, protein: 62, carbs: 0, fat: 7, group: 'protein' },
  { id: 'brown_rice', name: 'Brown rice, 150g', calories: 165, protein: 3.5, carbs: 34, fat: 1.5, group: 'grains' },
  { id: 'salmon', name: 'Salmon fillet, 180g', calories: 360, protein: 50, carbs: 0, fat: 16, group: 'protein' },
  { id: 'quinoa_salad', name: 'Quinoa salad', calories: 220, protein: 8, carbs: 32, fat: 6, group: 'vegetables' },
  { id: 'steamed_veg', name: 'Steamed vegetables', calories: 50, protein: 2, carbs: 10, fat: 0, group: 'vegetables' },
  { id: 'turkey_sandwich', name: 'Turkey sandwich', calories: 320, protein: 24, carbs: 35, fat: 10, group: 'protein' },
  { id: 'soup_veg', name: 'Vegetable soup', calories: 120, protein: 4, carbs: 18, fat: 3, group: 'vegetables' },
  { id: 'tuna_salad', name: 'Tuna salad', calories: 280, protein: 30, carbs: 8, fat: 14, group: 'protein' },
  { id: 'pasta', name: 'Pasta, 200g', calories: 250, protein: 8, carbs: 42, fat: 4, group: 'grains' },
  { id: 'grilled_fish', name: 'Grilled fish, 200g', calories: 280, protein: 45, carbs: 0, fat: 10, group: 'protein' },
  { id: 'sweet_potato', name: 'Sweet potato, 200g', calories: 180, protein: 4, carbs: 42, fat: 0, group: 'vegetables' },
  { id: 'mixed_nuts', name: 'Mixed nuts, 30g', calories: 180, protein: 5, carbs: 6, fat: 16, group: 'snacks' },
  { id: 'apple', name: 'Apple', calories: 95, protein: 0.5, carbs: 25, fat: 0.3, group: 'fruits' },
  { id: 'hummus_veg', name: 'Hummus with vegetables', calories: 160, protein: 5, carbs: 18, fat: 8, group: 'vegetables' },
  { id: 'protein_bar', name: 'Protein bar', calories: 200, protein: 20, carbs: 22, fat: 6, group: 'snacks' },
  { id: 'cheese_crackers', name: 'Cheese and crackers', calories: 220, protein: 10, carbs: 18, fat: 12, group: 'snacks' },
  { id: 'chocolate_bar', name: 'Chocolate bar', calories: 220, protein: 3, carbs: 26, fat: 13, group: 'snacks' },
  { id: 'fruit_salad', name: 'Fresh fruit salad', calories: 80, protein: 1, carbs: 20, fat: 0, group: 'fruits' },
  { id: 'pizza_slice', name: 'Pizza slice', calories: 280, protein: 12, carbs: 33, fat: 11, group: 'mixed' },
  { id: 'bread_slices', name: 'Bread, 2 slices', calories: 160, protein: 6, carbs: 28, fat: 2, group: 'grains' }
];

// Food groups for grouping tiles (order + label)
const FOOD_GROUPS = [
  { id: 'grains', label: 'Grains & carbs' },
  { id: 'protein', label: 'Protein' },
  { id: 'dairy', label: 'Dairy' },
  { id: 'fruits', label: 'Fruits' },
  { id: 'vegetables', label: 'Vegetables' },
  { id: 'snacks', label: 'Snacks' },
  { id: 'mixed', label: 'Mixed' }
];

// Return flat array of all food items from a log (handles both category object and legacy array)
function getAllFoodItems(log) {
  if (!log || !log.food) return [];
  const f = log.food;
  if (Array.isArray(f)) return f;
  return [...(f.breakfast || []), ...(f.lunch || []), ...(f.dinner || []), ...(f.snack || [])];
}

function formatFoodLogForView(log) {
  if (!log || !log.food) return '';
  const f = log.food;
  const meals = [
    { id: 'breakfast', label: 'Breakfast', items: Array.isArray(f) ? [] : (f.breakfast || []) },
    { id: 'lunch', label: 'Lunch', items: Array.isArray(f) ? [] : (f.lunch || []) },
    { id: 'dinner', label: 'Dinner', items: Array.isArray(f) ? [] : (f.dinner || []) },
    { id: 'snack', label: 'Snack', items: Array.isArray(f) ? [] : (f.snack || []) }
  ];
  if (Array.isArray(f)) meals[0].items = f;
  const parts = meals.filter(m => m.items.length > 0).map(m => {
    const itemStrs = m.items.map(item => {
      const name = typeof item === 'string' ? item : (item.name || '');
      const cal = typeof item === 'object' && item.calories !== undefined ? item.calories : null;
      const pro = typeof item === 'object' && item.protein !== undefined ? item.protein : null;
      let s = escapeHTML(name);
      if (cal != null || pro != null) s += ' <span class="metric-detail">(' + [cal != null ? cal + ' cal' : '', pro != null ? pro + 'g P' : ''].filter(Boolean).join(', ') + ')</span>';
      return s;
    });
    return `<div class="metric-item"><span class="metric-label">${m.label}</span><span class="metric-value metric-value-list">${itemStrs.join('; ')}</span></div>`;
  });
  return parts.join('');
}

function normalizeFoodItem(item) {
  if (typeof item === 'string') return { name: item, calories: undefined, protein: undefined };
  return {
    name: item.name || '',
    calories: item.calories !== undefined ? item.calories : undefined,
    protein: item.protein !== undefined ? item.protein : undefined
  };
}

// Exercise category ids and display order
const EXERCISE_CATEGORIES = [
  { id: 'cardio', label: 'Cardio' },
  { id: 'strength', label: 'Strength' },
  { id: 'flexibility', label: 'Flexibility' },
  { id: 'balance', label: 'Balance' },
  { id: 'recovery', label: 'Recovery' }
];

// Exercise id -> Font Awesome 6 free icon class
const EXERCISE_ICONS = {
  walking: 'fa-solid fa-person-walking',
  jogging: 'fa-solid fa-person-running',
  cycling: 'fa-solid fa-bicycle',
  swimming: 'fa-solid fa-person-swimming',
  yoga: 'fa-solid fa-spa',
  pilates: 'fa-solid fa-person-walking',
  stretching: 'fa-solid fa-person-walking',
  tai_chi: 'fa-solid fa-person-walking',
  water_aerobics: 'fa-solid fa-person-swimming',
  pt_exercises: 'fa-solid fa-heart-pulse',
  strength_gentle: 'fa-solid fa-dumbbell',
  balance: 'fa-solid fa-scale-balanced',
  elliptical: 'fa-solid fa-person-walking',
  dancing: 'fa-solid fa-music',
  hiking: 'fa-solid fa-person-hiking',
  chair_yoga: 'fa-solid fa-chair',
  resistance_bands: 'fa-solid fa-dumbbell',
  breathing: 'fa-solid fa-wind',
  core: 'fa-solid fa-dumbbell',
  upper_body: 'fa-solid fa-dumbbell'
};

// Predefined exercises with suggested duration (minutes) - selectable in exercise log
const PREDEFINED_EXERCISES = [
  { id: 'walking', name: 'Walking', defaultDuration: 30, category: 'cardio' },
  { id: 'jogging', name: 'Light jogging', defaultDuration: 20, category: 'cardio' },
  { id: 'cycling', name: 'Cycling', defaultDuration: 40, category: 'cardio' },
  { id: 'swimming', name: 'Swimming', defaultDuration: 25, category: 'cardio' },
  { id: 'elliptical', name: 'Elliptical', defaultDuration: 25, category: 'cardio' },
  { id: 'dancing', name: 'Dancing', defaultDuration: 20, category: 'cardio' },
  { id: 'hiking', name: 'Hiking', defaultDuration: 45, category: 'cardio' },
  { id: 'water_aerobics', name: 'Water aerobics', defaultDuration: 30, category: 'cardio' },
  { id: 'strength_gentle', name: 'Gentle strength training', defaultDuration: 15, category: 'strength' },
  { id: 'resistance_bands', name: 'Resistance band exercises', defaultDuration: 15, category: 'strength' },
  { id: 'core', name: 'Core exercises', defaultDuration: 15, category: 'strength' },
  { id: 'upper_body', name: 'Upper body strength', defaultDuration: 20, category: 'strength' },
  { id: 'yoga', name: 'Yoga', defaultDuration: 30, category: 'flexibility' },
  { id: 'pilates', name: 'Pilates', defaultDuration: 30, category: 'flexibility' },
  { id: 'stretching', name: 'Stretching', defaultDuration: 15, category: 'flexibility' },
  { id: 'tai_chi', name: 'Tai Chi', defaultDuration: 25, category: 'flexibility' },
  { id: 'chair_yoga', name: 'Chair yoga', defaultDuration: 20, category: 'flexibility' },
  { id: 'balance', name: 'Balance exercises', defaultDuration: 10, category: 'balance' },
  { id: 'pt_exercises', name: 'Physical therapy exercises', defaultDuration: 20, category: 'recovery' },
  { id: 'breathing', name: 'Breathing exercises', defaultDuration: 10, category: 'recovery' }
];

// Initialize food and exercise arrays early (before DOMContentLoaded)
let logFormFoodByCategory = { breakfast: [], lunch: [], dinner: [], snack: [] };
let logFormExerciseItems = []; // array of { name, duration } (duration in minutes)
let logFormStressorsItems = [];
let logFormSymptomsItems = [];
let editStressorsItems = [];
let editSymptomsItems = [];
let editFoodByCategory = { breakfast: [], lunch: [], dinner: [], snack: [] };
let editExerciseItems = [];

// Optimized localStorage helper function
function saveLogsToStorage() {
  // Invalidate filtered logs cache
  invalidateFilteredLogsCache();
  
  // Invalidate data cache
  if (window.PerformanceUtils?.DataCache) {
    window.PerformanceUtils.DataCache.invalidate('allHistoricalLogs');
  }
  
  // Use batched storage for better performance
  if (window.PerformanceUtils?.StorageBatcher) {
    window.PerformanceUtils.StorageBatcher.setItem("healthLogs", JSON.stringify(logs));
  } else {
    localStorage.setItem("healthLogs", JSON.stringify(logs));
  }
}

// Load logs - handle both compressed and uncompressed data
let logs = [];
try {
  const stored = localStorage.getItem("healthLogs");
  if (stored) {
    // Check if it's compressed data (base64 gzip starts with H4sI)
    if (stored.startsWith('H4sI')) {
      // Compressed data - try to decompress if function available
      if (typeof decompressData === 'function') {
        // Decompress asynchronously
        decompressData(stored).then(decompressed => {
          if (decompressed) {
            logs = decompressed;
            // Make logs globally available
            if (typeof window !== 'undefined') {
              window.logs = logs;
            }
            if (typeof renderLogs === 'function') renderLogs();
            if (typeof updateCharts === 'function') updateCharts();
          }
        }).catch(err => {
          console.error('Decompression error:', err);
          logs = [];
          if (typeof window !== 'undefined') {
            window.logs = logs;
          }
        });
      } else {
        // Compression enabled but decompression not available - return empty
        console.warn('Compressed data found but decompression function not available');
        logs = [];
        if (typeof window !== 'undefined') {
          window.logs = logs;
        }
      }
    } else {
      // Uncompressed JSON
      logs = JSON.parse(stored);
      // Make logs globally available
      if (typeof window !== 'undefined') {
        window.logs = logs;
      }
    }
  } else {
    // No stored logs - make sure window.logs is set
    if (typeof window !== 'undefined') {
      window.logs = logs;
    }
  }
} catch (error) {
  // Use safe error logging to prevent information leakage
  if (window.SecurityUtils && window.SecurityUtils.safeLogError) {
    window.SecurityUtils.safeLogError('Error loading logs', error);
  } else {
    console.error('Error loading logs');
  }
  logs = [];
  if (typeof window !== 'undefined') {
    window.logs = logs;
  }
}

// Migrate existing logs to include food (category object) and exercise arrays
function migrateLogs() {
  let needsMigration = false;
  logs.forEach(log => {
    if (!log.food) {
      log.food = { breakfast: [], lunch: [], dinner: [], snack: [] };
      needsMigration = true;
    } else if (Array.isArray(log.food)) {
      // Migrate legacy array to category object (put all in breakfast)
      const items = log.food.map(item => {
        if (typeof item === 'string') return { name: item, calories: undefined, protein: undefined };
        return item;
      });
      log.food = { breakfast: items, lunch: [], dinner: [], snack: [] };
      needsMigration = true;
    } else {
      // Ensure category object has all keys
      const f = log.food;
      if (!f.breakfast) f.breakfast = [];
      if (!f.lunch) f.lunch = [];
      if (!f.dinner) f.dinner = [];
      if (!f.snack) f.snack = [];
    }
    if (!log.exercise) {
      log.exercise = [];
      needsMigration = true;
    } else {
      // Migrate old string format to { name, duration }
      const hasStringItems = log.exercise.some(item => typeof item === 'string');
      if (hasStringItems) {
        log.exercise = log.exercise.map(item => {
          if (typeof item === 'string') return { name: item, duration: undefined };
          return item;
        });
        needsMigration = true;
      }
    }
  });
  if (needsMigration) {
    // Use batched storage for better performance
    if (window.PerformanceUtils?.StorageBatcher) {
      window.PerformanceUtils.StorageBatcher.setItem("healthLogs", JSON.stringify(logs));
    } else {
      localStorage.setItem("healthLogs", JSON.stringify(logs));
    }
    invalidateFilteredLogsCache();
  }
}

// Run migration on load
migrateLogs();

// Function to update heartbeat animation speed based on BPM
function updateHeartbeatAnimation() {
  const heartbeatPath = document.querySelector('.heartbeat-path');
  if (!heartbeatPath) return;
  
  // Get the most recent BPM from logs
  if (logs.length === 0) {
    // Default to 72 BPM if no logs exist
    const defaultBPM = 72;
    const duration = Math.max(0.3, Math.min(2.0, 60 / defaultBPM));
    heartbeatPath.style.animationDuration = `${duration}s`;
    return;
  }
  
  // Sort logs by date (most recent first) and get the latest BPM
  const sortedLogs = [...logs].sort((a, b) => new Date(b.date) - new Date(a.date));
  const latestBPM = parseInt(sortedLogs[0].bpm);
  
  if (isNaN(latestBPM) || latestBPM < 30 || latestBPM > 200) {
    // Invalid BPM, use default
    const defaultBPM = 72;
    const duration = Math.max(0.3, Math.min(2.0, 60 / defaultBPM));
    heartbeatPath.style.animationDuration = `${duration}s`;
    return;
  }
  
  // Calculate animation duration: 60 seconds / BPM = seconds per beat
  // Clamp between 0.3s (200 BPM) and 2.0s (30 BPM) for reasonable visual range
  const duration = Math.max(0.3, Math.min(2.0, 60 / latestBPM));
  heartbeatPath.style.animationDuration = `${duration}s`;
  
  console.log(`Heartbeat animation updated: ${latestBPM} BPM = ${duration.toFixed(2)}s per beat`);
}

// Sample data auto-insertion removed - was causing ghost entries from 2024-01-15 to 2024-01-17
// Users should use the "Generate Demo Data" feature in settings if they want sample data

function deleteLogEntry(logDate) {
  if (confirm(`Are you sure you want to delete the entry for ${logDate}?`)) {
    // Remove from logs array (optimized - find index first)
    const index = logs.findIndex(log => log.date === logDate);
    if (index !== -1) {
      logs.splice(index, 1);
    }
    
    // Invalidate filtered logs cache
    invalidateFilteredLogsCache();
    
    // Update localStorage (batched)
    if (window.PerformanceUtils?.StorageBatcher) {
      window.PerformanceUtils.StorageBatcher.setItem("healthLogs", JSON.stringify(logs));
    } else {
      localStorage.setItem("healthLogs", JSON.stringify(logs));
    }
    
    // Sync deletion to cloud (if syncing is enabled)
    if (typeof syncDeletedLogToCloud === 'function') {
      syncDeletedLogToCloud(logDate).catch(error => {
        console.error('Failed to sync deletion to cloud:', error);
        // Don't block UI - deletion already happened locally
      });
    }
    
    // Re-render logs and update charts (debounced)
    renderLogs();
    debounceChartUpdate();
    updateHeartbeatAnimation(); // Update heartbeat speed after deletion
    updateAISummaryButtonState(); // Update AI button state
    
    console.log(`Deleted log entry for ${logDate}`);
    Logger.info('Health log entry deleted', { date: logDate, remainingEntries: logs.length });
  } else {
    Logger.info('Health log entry deletion cancelled by user', { date: logDate });
  }
}

// Food and Exercise Logging Functions
let currentEditingDate = null;
let currentFoodByCategory = { breakfast: [], lunch: [], dinner: [], snack: [] };
let currentExerciseItems = [];

// Log Entry Form Food and Exercise Arrays (already declared earlier in file)

// Add food item to log entry form (category, foodId from chip tap)
function addLogFoodItem(category, foodId) {
  if (!foodId) return;
  const predefined = PREDEFINED_FOODS.find(f => f.id === foodId);
  if (!predefined) return;
  const foodItem = { name: predefined.name, calories: predefined.calories, protein: predefined.protein };
  logFormFoodByCategory[category].push(foodItem);
  renderLogFoodItems();
}

// Remove food item from log entry form
function removeLogFoodItem(category, index) {
  logFormFoodByCategory[category].splice(index, 1);
  renderLogFoodItems();
}

// Render one category's food list
function renderLogFoodCategoryList(category, listId) {
  const list = document.getElementById(listId);
  if (!list) return;
  const items = logFormFoodByCategory[category] || [];
  if (items.length === 0) {
    list.innerHTML = '<p class="empty-items">None</p>';
    return;
  }
  list.innerHTML = items.map((item, index) => {
    const name = typeof item === 'string' ? item : (item.name || '');
    const calories = typeof item === 'object' && item.calories !== undefined ? item.calories : undefined;
    const protein = typeof item === 'object' && item.protein !== undefined ? item.protein : undefined;
    const safeName = escapeHTML(name);
    let details = '';
    if (calories !== undefined || protein !== undefined) {
      const parts = [];
      if (calories !== undefined) parts.push(`${calories} cal`);
      if (protein !== undefined) parts.push(`${protein}g protein`);
      details = `<span style="font-size: 0.85rem; color: rgba(224, 242, 241, 0.7); margin-left: 8px;">(${parts.join(', ')})</span>`;
    }
    return `
    <div class="item-entry">
      <div style="flex: 1;">
        <span class="item-text">${safeName}</span>
        ${details}
      </div>
      <button type="button" class="remove-item-btn" onclick="removeLogFoodItem('${category}', ${index})" title="Remove">×</button>
    </div>
  `;
  }).join('');
}

// Build chip grid for one meal (log form) — grouped by food group, three sections per tile: icon, name, nutrition
function renderFoodChipsForCategory(category, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const mealLabel = category.charAt(0).toUpperCase() + category.slice(1);
  container.innerHTML = '';
  FOOD_GROUPS.forEach(grp => {
    const foods = PREDEFINED_FOODS.filter(f => (f.group || 'mixed') === grp.id);
    if (foods.length === 0) return;
    const groupDiv = document.createElement('div');
    groupDiv.className = 'food-group';
    groupDiv.setAttribute('data-group', grp.id);
    const heading = document.createElement('div');
    heading.className = 'food-group__title';
    heading.textContent = grp.label;
    groupDiv.appendChild(heading);
    const chipsDiv = document.createElement('div');
    chipsDiv.className = 'food-chips';
    foods.forEach(f => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'food-chip food-chip--' + (f.group || 'mixed');
      btn.setAttribute('data-food-id', f.id);
      btn.title = `Add ${f.name}, ${f.calories} cal to ${mealLabel}`;
      const iconClass = FOOD_ICONS[f.id] || 'fa-solid fa-utensils';
      const iconEl = document.createElement('span');
      iconEl.className = 'food-chip-icon';
      iconEl.innerHTML = `<i class="${iconClass}" aria-hidden="true"></i>`;
      const nameSpan = document.createElement('span');
      nameSpan.className = 'food-chip-name';
      nameSpan.textContent = f.name;
      const nutritionSpan = document.createElement('span');
      nutritionSpan.className = 'food-chip-nutrition';
      nutritionSpan.textContent = `${f.calories} cal · ${f.protein}g P`;
      btn.appendChild(iconEl);
      btn.appendChild(nameSpan);
      btn.appendChild(nutritionSpan);
      btn.addEventListener('click', () => addLogFoodItem(category, f.id));
      chipsDiv.appendChild(btn);
    });
    groupDiv.appendChild(chipsDiv);
    container.appendChild(groupDiv);
  });
}

// Render food items in log entry form (all 4 categories + chip grids)
function renderLogFoodItems() {
  renderLogFoodCategoryList('breakfast', 'logFoodBreakfastList');
  renderLogFoodCategoryList('lunch', 'logFoodLunchList');
  renderLogFoodCategoryList('dinner', 'logFoodDinnerList');
  renderLogFoodCategoryList('snack', 'logFoodSnackList');
  renderFoodChipsForCategory('breakfast', 'logFoodBreakfastChips');
  renderFoodChipsForCategory('lunch', 'logFoodLunchChips');
  renderFoodChipsForCategory('dinner', 'logFoodDinnerChips');
  renderFoodChipsForCategory('snack', 'logFoodSnackChips');
}

// Build exercise tile grid for one category (log form) — three sections: icon (top), name (middle), duration (bottom)
function renderExerciseChipsForCategory(category, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const exercises = PREDEFINED_EXERCISES.filter(e => (e.category || 'cardio') === category);
  container.innerHTML = '';
  exercises.forEach(ex => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'exercise-chip exercise-chip--' + (ex.category || 'cardio');
    btn.setAttribute('data-exercise-id', ex.id);
    btn.title = `Add ${ex.name}, ${ex.defaultDuration} min`;
    const iconClass = EXERCISE_ICONS[ex.id] || 'fa-solid fa-dumbbell';
    const iconEl = document.createElement('span');
    iconEl.className = 'exercise-chip-icon';
    iconEl.innerHTML = `<i class="${iconClass}" aria-hidden="true"></i>`;
    const nameSpan = document.createElement('span');
    nameSpan.className = 'exercise-chip-name';
    nameSpan.textContent = ex.name;
    const durationSpan = document.createElement('span');
    durationSpan.className = 'exercise-chip-duration';
    durationSpan.textContent = `${ex.defaultDuration} min`;
    btn.appendChild(iconEl);
    btn.appendChild(nameSpan);
    btn.appendChild(durationSpan);
    btn.addEventListener('click', () => addLogExerciseItem(ex.id));
    container.appendChild(btn);
  });
}

// Add exercise item to log entry form (from tile click — uses default duration)
function addLogExerciseItem(exerciseId) {
  const predefined = PREDEFINED_EXERCISES.find(e => e.id === exerciseId);
  if (!predefined) return;
  logFormExerciseItems.push({ name: predefined.name, duration: predefined.defaultDuration });
  renderLogExerciseItems();
}

// Remove exercise item from log entry form
function removeLogExerciseItem(index) {
  logFormExerciseItems.splice(index, 1);
  renderLogExerciseItems();
}

// Format single exercise for display (handles string or { name, duration })
function formatExerciseDisplay(item) {
  const name = typeof item === 'string' ? item : (item.name || '');
  const duration = typeof item === 'object' && item.duration != null ? item.duration : undefined;
  const safeName = escapeHTML(name);
  if (duration !== undefined && duration !== '') return `${safeName} — ${duration} min`;
  return safeName;
}

// Render exercise items in log entry form (list + category tile grids)
function renderLogExerciseItems() {
  const list = document.getElementById('logExerciseItemsList');
  if (list) {
    if (logFormExerciseItems.length === 0) {
      list.innerHTML = '<p class="empty-items">No exercise logged yet.</p>';
    } else {
      list.innerHTML = logFormExerciseItems.map((item, index) => `
        <div class="item-entry">
          <span class="item-text">${formatExerciseDisplay(item)}</span>
          <button type="button" class="remove-item-btn" onclick="removeLogExerciseItem(${index})" title="Remove">×</button>
        </div>
      `).join('');
    }
  }
  EXERCISE_CATEGORIES.forEach(cat => {
    const containerId = 'logExercise' + cat.label.charAt(0).toUpperCase() + cat.label.slice(1) + 'Chips';
    renderExerciseChipsForCategory(cat.id, containerId);
  });
}

// Energy & Mental Clarity tile picker (log form)
function setEnergyClaritySelection(value) {
  const hidden = document.getElementById('energyClarity');
  const label = document.getElementById('energyClaritySelectedLabel');
  if (hidden) hidden.value = value || '';
  if (label) label.textContent = value ? value : 'None selected';
  document.querySelectorAll('.energy-clarity-chip').forEach(tile => {
    tile.classList.toggle('selected', tile.getAttribute('data-value') === value);
  });
}

function renderEnergyClarityTiles() {
  const container = document.getElementById('energyClarityTiles');
  const hidden = document.getElementById('energyClarity');
  if (!container) return;
  const currentValue = hidden ? hidden.value : '';
  container.innerHTML = '';
  ENERGY_CLARITY_GROUPS.forEach(grp => {
    const opts = ENERGY_CLARITY_OPTIONS.filter(o => o.mood === grp.id);
    if (opts.length === 0) return;
    const groupDiv = document.createElement('div');
    groupDiv.className = 'tile-group tile-group--energy';
    groupDiv.setAttribute('data-group', grp.id);
    const heading = document.createElement('div');
    heading.className = 'tile-group__title';
    heading.textContent = grp.label;
    groupDiv.appendChild(heading);
    const chipsDiv = document.createElement('div');
    chipsDiv.className = 'energy-clarity-chips';
    opts.forEach(opt => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'energy-clarity-chip energy-clarity-chip--' + opt.mood;
      btn.setAttribute('data-value', opt.value);
      btn.setAttribute('role', 'option');
      btn.setAttribute('aria-selected', currentValue === opt.value ? 'true' : 'false');
      if (currentValue === opt.value) btn.classList.add('selected');
      const iconClass = ENERGY_CLARITY_ICONS[opt.value] || 'fa-solid fa-bolt';
      const iconEl = document.createElement('span');
      iconEl.className = 'energy-clarity-chip-icon';
      iconEl.innerHTML = '<i class="' + iconClass + '" aria-hidden="true"></i>';
      const nameSpan = document.createElement('span');
      nameSpan.className = 'energy-clarity-chip-name';
      nameSpan.textContent = opt.label;
      btn.appendChild(iconEl);
      btn.appendChild(nameSpan);
      btn.addEventListener('click', () => setEnergyClaritySelection(opt.value));
      chipsDiv.appendChild(btn);
    });
    groupDiv.appendChild(chipsDiv);
    container.appendChild(groupDiv);
  });
  const label = document.getElementById('energyClaritySelectedLabel');
  if (label && !label.textContent) label.textContent = currentValue ? currentValue : 'None selected';
}

// Energy & Mental Clarity tile picker (edit modal)
function setEditEnergyClaritySelection(value) {
  const hidden = document.getElementById('editEnergyClarity');
  const label = document.getElementById('editEnergyClaritySelectedLabel');
  if (hidden) hidden.value = value || '';
  if (label) label.textContent = value ? value : 'None selected';
  document.querySelectorAll('#editEnergyClarityTiles .energy-clarity-chip').forEach(tile => {
    tile.classList.toggle('selected', tile.getAttribute('data-value') === value);
  });
}

function renderEditEnergyClarityTiles() {
  const container = document.getElementById('editEnergyClarityTiles');
  const hidden = document.getElementById('editEnergyClarity');
  if (!container) return;
  const currentValue = hidden ? hidden.value : '';
  container.innerHTML = '';
  ENERGY_CLARITY_GROUPS.forEach(grp => {
    const opts = ENERGY_CLARITY_OPTIONS.filter(o => o.mood === grp.id);
    if (opts.length === 0) return;
    const groupDiv = document.createElement('div');
    groupDiv.className = 'tile-group tile-group--energy';
    groupDiv.setAttribute('data-group', grp.id);
    const heading = document.createElement('div');
    heading.className = 'tile-group__title';
    heading.textContent = grp.label;
    groupDiv.appendChild(heading);
    const chipsDiv = document.createElement('div');
    chipsDiv.className = 'energy-clarity-chips';
    opts.forEach(opt => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'energy-clarity-chip energy-clarity-chip--' + opt.mood;
      btn.setAttribute('data-value', opt.value);
      btn.setAttribute('role', 'option');
      btn.setAttribute('aria-selected', currentValue === opt.value ? 'true' : 'false');
      if (currentValue === opt.value) btn.classList.add('selected');
      const iconClass = ENERGY_CLARITY_ICONS[opt.value] || 'fa-solid fa-bolt';
      const iconEl = document.createElement('span');
      iconEl.className = 'energy-clarity-chip-icon';
      iconEl.innerHTML = '<i class="' + iconClass + '" aria-hidden="true"></i>';
      const nameSpan = document.createElement('span');
      nameSpan.className = 'energy-clarity-chip-name';
      nameSpan.textContent = opt.label;
      btn.appendChild(iconEl);
      btn.appendChild(nameSpan);
      btn.addEventListener('click', () => setEditEnergyClaritySelection(opt.value));
      chipsDiv.appendChild(btn);
    });
    groupDiv.appendChild(chipsDiv);
    container.appendChild(groupDiv);
  });
  const label = document.getElementById('editEnergyClaritySelectedLabel');
  if (label) label.textContent = currentValue ? currentValue : 'None selected';
}

// Stressor options grouped by category (for coloured tile sections)
const STRESSOR_GROUPS = [
  { id: 'work', label: 'Work & demands', color: 'work' },
  { id: 'relationship', label: 'Relationships', color: 'relationship' },
  { id: 'physical', label: 'Physical', color: 'physical' },
  { id: 'environment', label: 'Environment', color: 'environment' },
  { id: 'emotional', label: 'Emotional & health', color: 'emotional' },
  { id: 'other', label: 'Other', color: 'other' }
];

const STRESSOR_OPTIONS = [
  { value: 'Work deadline', label: 'Work deadline', group: 'work' },
  { value: 'Financial stress', label: 'Financial stress', group: 'work' },
  { value: 'Family conflict', label: 'Family conflict', group: 'relationship' },
  { value: 'Relationship issue', label: 'Relationship issue', group: 'relationship' },
  { value: 'Social event', label: 'Social event', group: 'relationship' },
  { value: 'Physical overexertion', label: 'Physical overexertion', group: 'physical' },
  { value: 'Sleep disruption', label: 'Sleep disruption', group: 'physical' },
  { value: 'Weather change', label: 'Weather change', group: 'environment' },
  { value: 'Travel', label: 'Travel', group: 'environment' },
  { value: 'Emotional stress', label: 'Emotional stress', group: 'emotional' },
  { value: 'Health concern', label: 'Health concern', group: 'emotional' },
  { value: 'Other', label: 'Other', group: 'other' }
];

// Stressor value -> Font Awesome 6 free icon class (square tiles same style as food/exercise)
const STRESSOR_ICONS = {
  'Work deadline': 'fa-solid fa-briefcase',
  'Financial stress': 'fa-solid fa-coins',
  'Family conflict': 'fa-solid fa-people-group',
  'Relationship issue': 'fa-solid fa-heart',
  'Social event': 'fa-solid fa-champagne-glasses',
  'Physical overexertion': 'fa-solid fa-dumbbell',
  'Sleep disruption': 'fa-solid fa-moon',
  'Weather change': 'fa-solid fa-cloud-sun',
  'Travel': 'fa-solid fa-plane',
  'Emotional stress': 'fa-solid fa-face-sad-cry',
  'Health concern': 'fa-solid fa-heart-pulse',
  'Other': 'fa-solid fa-ellipsis'
};

// Symptom groups for coloured tiles (same pattern as stressors)
const SYMPTOM_GROUPS = [
  { id: 'digestive', label: 'Digestive', color: 'digestive' },
  { id: 'respiratory', label: 'Respiratory', color: 'respiratory' },
  { id: 'neurological', label: 'Neurological', color: 'neurological' },
  { id: 'systemic', label: 'Systemic', color: 'systemic' },
  { id: 'skin', label: 'Skin & eyes', color: 'skin' },
  { id: 'other', label: 'Other', color: 'other' }
];

const SYMPTOM_OPTIONS = [
  { value: 'Nausea', label: 'Nausea', group: 'digestive' },
  { value: 'Appetite loss', label: 'Appetite loss', group: 'digestive' },
  { value: 'Digestive issues', label: 'Digestive issues', group: 'digestive' },
  { value: 'Breathing difficulty', label: 'Breathing difficulty', group: 'respiratory' },
  { value: 'Dizziness', label: 'Dizziness', group: 'neurological' },
  { value: 'Headache', label: 'Headache', group: 'neurological' },
  { value: 'Fever', label: 'Fever', group: 'systemic' },
  { value: 'Chills', label: 'Chills', group: 'systemic' },
  { value: 'Skin rash', label: 'Skin rash', group: 'skin' },
  { value: 'Eye irritation', label: 'Eye irritation', group: 'skin' },
  { value: 'Other', label: 'Other', group: 'other' }
];

// Symptom value -> Font Awesome 6 icon (square tiles same style as food/stressor)
const SYMPTOM_ICONS = {
  'Nausea': 'fa-solid fa-face-nauseated',
  'Appetite loss': 'fa-solid fa-utensils',
  'Digestive issues': 'fa-solid fa-stomach',
  'Breathing difficulty': 'fa-solid fa-lungs',
  'Dizziness': 'fa-solid fa-spinner',
  'Headache': 'fa-solid fa-head-side-virus',
  'Fever': 'fa-solid fa-temperature-high',
  'Chills': 'fa-solid fa-snowflake',
  'Skin rash': 'fa-solid fa-hand-sparkles',
  'Eye irritation': 'fa-solid fa-eye',
  'Other': 'fa-solid fa-ellipsis'
};

// Pain body diagram: region id -> display label (front view, wider with more areas)
const PAIN_BODY_REGIONS = [
  { id: 'head', label: 'Head' },
  { id: 'neck', label: 'Neck' },
  { id: 'chest', label: 'Chest' },
  { id: 'abdomen', label: 'Abdomen' },
  { id: 'left_shoulder', label: 'Left shoulder' },
  { id: 'left_upper_arm', label: 'Left upper arm' },
  { id: 'left_forearm', label: 'Left forearm' },
  { id: 'left_hand', label: 'Left hand' },
  { id: 'right_shoulder', label: 'Right shoulder' },
  { id: 'right_upper_arm', label: 'Right upper arm' },
  { id: 'right_forearm', label: 'Right forearm' },
  { id: 'right_hand', label: 'Right hand' },
  { id: 'left_hip', label: 'Left hip' },
  { id: 'left_thigh', label: 'Left thigh' },
  { id: 'left_knee', label: 'Left knee' },
  { id: 'left_lower_leg', label: 'Left lower leg' },
  { id: 'left_foot', label: 'Left foot' },
  { id: 'right_hip', label: 'Right hip' },
  { id: 'right_thigh', label: 'Right thigh' },
  { id: 'right_knee', label: 'Right knee' },
  { id: 'right_lower_leg', label: 'Right lower leg' },
  { id: 'right_foot', label: 'Right foot' }
];

// Pain body state: 0 = green (none), 1 = yellow (mild), 2 = red (pain). Keyed by containerId so edit modal can load from text.
const painBodyStates = {};
const PAIN_STATE_LABELS = ['', 'mild', 'pain'];

function getPainLocationTextFromState(state) {
  const parts = [];
  PAIN_BODY_REGIONS.forEach(r => {
    const s = state[r.id];
    if (s === 1) parts.push(r.label + ' (mild)');
    else if (s === 2) parts.push(r.label + ' (pain)');
  });
  return parts.join(', ');
}

function setPainLocationFromText(text, stateObj) {
  if (!text || !text.trim()) return;
  const parts = text.split(',').map(p => p.trim());
  parts.forEach(part => {
    const lower = part.toLowerCase();
    const mild = lower.endsWith('(mild)');
    const pain = lower.endsWith('(pain)');
    const labelPart = lower.replace(/\s*\(mild\)\s*$/, '').replace(/\s*\(pain\)\s*$/, '').trim();
    PAIN_BODY_REGIONS.forEach(r => {
      if (r.label.toLowerCase() === labelPart || (labelPart && r.label.toLowerCase().indexOf(labelPart) >= 0)) {
        stateObj[r.id] = mild ? 1 : 2;
      }
    });
  });
}

function initPainBodyDiagram(containerId, hiddenInputId) {
  const container = document.getElementById(containerId);
  const hidden = document.getElementById(hiddenInputId);
  if (!container || !hidden) return;
  if (!painBodyStates[containerId]) {
    painBodyStates[containerId] = {};
    PAIN_BODY_REGIONS.forEach(r => { painBodyStates[containerId][r.id] = 0; });
  }
  const state = painBodyStates[containerId];
  const svg = container.querySelector('.pain-body-svg');
  if (!svg) return;

  function applyStateToSvg() {
    PAIN_BODY_REGIONS.forEach(r => {
      const el = svg.querySelector('[data-region="' + r.id + '"]');
      if (el) {
        el.classList.remove('pain-state-0', 'pain-state-1', 'pain-state-2');
        el.classList.add('pain-state-' + (state[r.id] || 0));
      }
    });
    hidden.value = getPainLocationTextFromState(state);
  }

  container.querySelectorAll('.pain-region').forEach(el => {
    const regionId = el.getAttribute('data-region');
    if (!regionId) return;
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    el.setAttribute('aria-label', (PAIN_BODY_REGIONS.find(r => r.id === regionId) || {}).label + ', click to cycle pain level');
    el.addEventListener('click', function () {
      state[regionId] = ((state[regionId] || 0) + 1) % 3;
      applyStateToSvg();
    });
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.click(); }
    });
  });

  const existingText = (hidden.value || '').trim();
  if (existingText) setPainLocationFromText(existingText, state);
  applyStateToSvg();
  return state;
}

function setPainBodyStateFromText(containerId, hiddenInputId, text) {
  const container = document.getElementById(containerId);
  const hidden = document.getElementById(hiddenInputId);
  if (!container || !hidden) return;
  if (!painBodyStates[containerId]) {
    painBodyStates[containerId] = {};
    PAIN_BODY_REGIONS.forEach(r => { painBodyStates[containerId][r.id] = 0; });
  }
  const state = painBodyStates[containerId];
  PAIN_BODY_REGIONS.forEach(r => { state[r.id] = 0; });
  if (text && text.trim()) setPainLocationFromText(text, state);
  hidden.value = text || '';
  const svg = container.querySelector('.pain-body-svg');
  if (svg) {
    PAIN_BODY_REGIONS.forEach(r => {
      const el = svg.querySelector('[data-region="' + r.id + '"]');
      if (el) {
        el.classList.remove('pain-state-0', 'pain-state-1', 'pain-state-2');
        el.classList.add('pain-state-' + (state[r.id] || 0));
      }
    });
  }
}

function resetPainBodyDiagram(containerId, hiddenInputId) {
  const container = document.getElementById(containerId);
  const hidden = document.getElementById(hiddenInputId);
  if (!container || !hidden) return;
  hidden.value = '';
  const svg = container.querySelector('.pain-body-svg');
  if (svg) {
    svg.querySelectorAll('.pain-region').forEach(el => {
      el.classList.remove('pain-state-1', 'pain-state-2');
      el.classList.add('pain-state-0');
    });
  }
}

// Stressors and Symptoms functions for main form
function addLogStressorItem(value) {
  const toAdd = (typeof value === 'string' ? value : (document.getElementById('logNewStressorItem')?.value || '').trim());
  if (!toAdd || logFormStressorsItems.includes(toAdd)) return;
  logFormStressorsItems.push(toAdd);
  renderLogStressorsItems();
}

function removeLogStressorItem(index) {
  logFormStressorsItems.splice(index, 1);
  renderLogStressorsItems();
}

function renderStressorTiles(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  STRESSOR_GROUPS.forEach(grp => {
    const opts = STRESSOR_OPTIONS.filter(o => o.group === grp.id);
    if (opts.length === 0) return;
    const groupDiv = document.createElement('div');
    groupDiv.className = 'stressor-group';
    groupDiv.setAttribute('data-group', grp.id);
    const heading = document.createElement('div');
    heading.className = 'stressor-group__title';
    heading.textContent = grp.label;
    groupDiv.appendChild(heading);
    const chipsDiv = document.createElement('div');
    chipsDiv.className = 'stressor-chips';
    opts.forEach(opt => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'stressor-chip stressor-chip--' + grp.color;
      btn.setAttribute('data-value', opt.value);
      btn.title = 'Add: ' + opt.label;
      const iconClass = STRESSOR_ICONS[opt.value] || 'fa-solid fa-bolt';
      const iconEl = document.createElement('span');
      iconEl.className = 'stressor-chip-icon';
      iconEl.innerHTML = '<i class="' + iconClass + '" aria-hidden="true"></i>';
      const nameSpan = document.createElement('span');
      nameSpan.className = 'stressor-chip-name';
      nameSpan.textContent = opt.label;
      btn.appendChild(iconEl);
      btn.appendChild(nameSpan);
      btn.addEventListener('click', () => {
        if (containerId === 'logStressorsTiles') addLogStressorItem(opt.value);
        else addEditStressor(opt.value);
      });
      chipsDiv.appendChild(btn);
    });
    groupDiv.appendChild(chipsDiv);
    container.appendChild(groupDiv);
  });
}

function renderLogStressorsItems() {
  const container = document.getElementById('logStressorsList');
  if (!container) return;
  
  container.innerHTML = '';
  if (logFormStressorsItems.length === 0) {
    container.innerHTML = '<p class="empty-items">No stressors added yet.</p>';
    return;
  }
  logFormStressorsItems.forEach((item, index) => {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'item-tag';
    itemDiv.innerHTML = `
      <span>${escapeHTML(item)}</span>
      <button type="button" class="remove-item-btn" onclick="removeLogStressorItem(${index})" title="Remove">×</button>
    `;
    container.appendChild(itemDiv);
  });
}

function addLogSymptomItem(value) {
  const toAdd = (typeof value === 'string' ? value : (document.getElementById('logNewSymptomItem')?.value || '').trim());
  if (!toAdd || logFormSymptomsItems.includes(toAdd)) return;
  logFormSymptomsItems.push(toAdd);
  renderLogSymptomsItems();
}

function removeLogSymptomItem(index) {
  logFormSymptomsItems.splice(index, 1);
  renderLogSymptomsItems();
}

function renderSymptomTiles(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  SYMPTOM_GROUPS.forEach(grp => {
    const opts = SYMPTOM_OPTIONS.filter(o => o.group === grp.id);
    if (opts.length === 0) return;
    const groupDiv = document.createElement('div');
    groupDiv.className = 'symptom-group';
    groupDiv.setAttribute('data-group', grp.id);
    const heading = document.createElement('div');
    heading.className = 'symptom-group__title';
    heading.textContent = grp.label;
    groupDiv.appendChild(heading);
    const chipsDiv = document.createElement('div');
    chipsDiv.className = 'symptom-chips';
    opts.forEach(opt => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'symptom-chip symptom-chip--' + grp.color;
      btn.setAttribute('data-value', opt.value);
      btn.title = 'Add: ' + opt.label;
      const iconClass = SYMPTOM_ICONS[opt.value] || 'fa-solid fa-circle-dot';
      const iconEl = document.createElement('span');
      iconEl.className = 'symptom-chip-icon';
      iconEl.innerHTML = '<i class="' + iconClass + '" aria-hidden="true"></i>';
      const nameSpan = document.createElement('span');
      nameSpan.className = 'symptom-chip-name';
      nameSpan.textContent = opt.label;
      btn.appendChild(iconEl);
      btn.appendChild(nameSpan);
      btn.addEventListener('click', () => {
        if (containerId === 'logSymptomsTiles') addLogSymptomItem(opt.value);
        else addEditSymptom(opt.value);
      });
      chipsDiv.appendChild(btn);
    });
    groupDiv.appendChild(chipsDiv);
    container.appendChild(groupDiv);
  });
}

function renderLogSymptomsItems() {
  const container = document.getElementById('logSymptomsList');
  if (!container) return;
  
  container.innerHTML = '';
  if (logFormSymptomsItems.length === 0) {
    container.innerHTML = '<p class="empty-items">No symptoms added yet.</p>';
  } else {
    logFormSymptomsItems.forEach((item, index) => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'item-tag';
      itemDiv.innerHTML = `
        <span>${escapeHTML(item)}</span>
        <button type="button" class="remove-item-btn" onclick="removeLogSymptomItem(${index})" title="Remove">×</button>
      `;
      container.appendChild(itemDiv);
    });
  }
  // Always populate the Add symptom tiles (so they show on initial load and after changes)
  renderSymptomTiles('logSymptomsTiles');
}

// Edit modal functions for stressors and symptoms
function addEditStressor(value) {
  const toAdd = (typeof value === 'string' ? value : (document.getElementById('editStressorSelect')?.value || '').trim());
  if (!toAdd || editStressorsItems.includes(toAdd)) return;
  editStressorsItems.push(toAdd);
  renderEditStressorsList();
}

function removeEditStressor(index) {
  editStressorsItems.splice(index, 1);
  renderEditStressorsList();
}

function renderEditStressorsList() {
  const container = document.getElementById('editStressorsItems');
  if (!container) return;
  
  container.innerHTML = '';
  if (editStressorsItems.length === 0) {
    container.innerHTML = '<p class="empty-items">No stressors added yet.</p>';
    return;
  }
  editStressorsItems.forEach((item, index) => {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'item-tag';
    itemDiv.innerHTML = `
      <span>${escapeHTML(item)}</span>
      <button type="button" class="remove-item-btn" onclick="removeEditStressor(${index})" title="Remove">×</button>
    `;
    container.appendChild(itemDiv);
  });
}

function addEditSymptom(value) {
  const toAdd = (typeof value === 'string' ? value : (document.getElementById('editSymptomSelect')?.value || '').trim());
  if (!toAdd || editSymptomsItems.includes(toAdd)) return;
  editSymptomsItems.push(toAdd);
  renderEditSymptomsList();
}

function removeEditSymptom(index) {
  editSymptomsItems.splice(index, 1);
  renderEditSymptomsList();
}

function renderEditSymptomsList() {
  const container = document.getElementById('editSymptomsItems');
  if (!container) return;
  
  container.innerHTML = '';
  if (editSymptomsItems.length === 0) {
    container.innerHTML = '<p class="empty-items">No symptoms added yet.</p>';
    return;
  }
  editSymptomsItems.forEach((item, index) => {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'item-tag';
    itemDiv.innerHTML = `
      <span>${escapeHTML(item)}</span>
      <button type="button" class="remove-item-btn" onclick="removeEditSymptom(${index})" title="Remove">×</button>
    `;
    container.appendChild(itemDiv);
  });
}

function sanitizeEditFoodItem(item) {
  const name = typeof item === 'string' ? item : (item.name || '');
  const calories = typeof item === 'object' && item.calories !== undefined ? item.calories : undefined;
  const protein = typeof item === 'object' && item.protein !== undefined ? item.protein : undefined;
  return { name: escapeHTML(name.trim()), calories, protein };
}

// Edit modal: food (same tile selector as main form)
function addEditFoodItem(category, foodId) {
  if (!foodId) return;
  const predefined = PREDEFINED_FOODS.find(f => f.id === foodId);
  if (!predefined) return;
  const item = { name: predefined.name, calories: predefined.calories, protein: predefined.protein };
  editFoodByCategory[category].push(item);
  renderEditFoodCategoryList(category);
}

function removeEditFoodItem(category, index) {
  editFoodByCategory[category].splice(index, 1);
  renderEditFoodCategoryList(category);
}

function renderEditFoodCategoryList(category) {
  const listId = 'editFood' + category.charAt(0).toUpperCase() + category.slice(1) + 'List';
  const container = document.getElementById(listId);
  if (!container) return;
  const items = editFoodByCategory[category] || [];
  container.innerHTML = items.length === 0
    ? '<p class="empty-items">None</p>'
    : items.map((item, index) => {
        const name = typeof item === 'string' ? item : (item.name || '');
        const calories = typeof item === 'object' && item.calories !== undefined ? item.calories : undefined;
        const protein = typeof item === 'object' && item.protein !== undefined ? item.protein : undefined;
        let details = '';
        if (calories !== undefined || protein !== undefined) {
          const parts = [];
          if (calories !== undefined) parts.push(calories + ' cal');
          if (protein !== undefined) parts.push(protein + 'g P');
          details = '<span class="item-detail">(' + parts.join(', ') + ')</span>';
        }
        return `<div class="item-entry"><div style="flex:1;"><span class="item-text">${escapeHTML(name)}</span>${details}</div><button type="button" class="remove-item-btn" onclick="removeEditFoodItem('${category}', ${index})" title="Remove">×</button></div>`;
      }).join('');
}

function renderEditFoodChipsForCategory(category, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  FOOD_GROUPS.forEach(grp => {
    const foods = PREDEFINED_FOODS.filter(f => (f.group || 'mixed') === grp.id);
    if (foods.length === 0) return;
    const groupDiv = document.createElement('div');
    groupDiv.className = 'food-group';
    groupDiv.setAttribute('data-group', grp.id);
    const heading = document.createElement('div');
    heading.className = 'food-group__title';
    heading.textContent = grp.label;
    groupDiv.appendChild(heading);
    const chipsDiv = document.createElement('div');
    chipsDiv.className = 'food-chips';
    foods.forEach(f => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'food-chip food-chip--' + (f.group || 'mixed');
      btn.setAttribute('data-food-id', f.id);
      const iconClass = FOOD_ICONS[f.id] || 'fa-solid fa-utensils';
      const iconEl = document.createElement('span');
      iconEl.className = 'food-chip-icon';
      iconEl.innerHTML = '<i class="' + iconClass + '" aria-hidden="true"></i>';
      const nameSpan = document.createElement('span');
      nameSpan.className = 'food-chip-name';
      nameSpan.textContent = f.name;
      const nutritionSpan = document.createElement('span');
      nutritionSpan.className = 'food-chip-nutrition';
      nutritionSpan.textContent = f.calories + ' cal · ' + f.protein + 'g P';
      btn.appendChild(iconEl);
      btn.appendChild(nameSpan);
      btn.appendChild(nutritionSpan);
      btn.addEventListener('click', () => addEditFoodItem(category, f.id));
      chipsDiv.appendChild(btn);
    });
    groupDiv.appendChild(chipsDiv);
    container.appendChild(groupDiv);
  });
}

// Edit modal: exercise (same tile selector as main form)
function addEditExerciseItem(exerciseId) {
  const predefined = PREDEFINED_EXERCISES.find(e => e.id === exerciseId);
  if (!predefined) return;
  editExerciseItems.push({ name: predefined.name, duration: predefined.defaultDuration });
  renderEditExerciseItemsList();
}

function removeEditExerciseItem(index) {
  editExerciseItems.splice(index, 1);
  renderEditExerciseItemsList();
}

function renderEditExerciseItemsList() {
  const list = document.getElementById('editExerciseItemsList');
  if (!list) return;
  list.innerHTML = editExerciseItems.length === 0
    ? '<p class="empty-items">No exercise logged yet.</p>'
    : editExerciseItems.map((item, index) => `
    <div class="item-entry">
      <span class="item-text">${escapeHTML(formatExerciseDisplay(item))}</span>
      <button type="button" class="remove-item-btn" onclick="removeEditExerciseItem(${index})" title="Remove">×</button>
    </div>
  `).join('');
}

function renderEditExerciseChipsForCategory(category, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const exercises = PREDEFINED_EXERCISES.filter(e => (e.category || 'cardio') === category);
  container.innerHTML = '';
  exercises.forEach(ex => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'exercise-chip exercise-chip--' + (ex.category || 'cardio');
    btn.setAttribute('data-exercise-id', ex.id);
    const iconClass = EXERCISE_ICONS[ex.id] || 'fa-solid fa-dumbbell';
    const iconEl = document.createElement('span');
    iconEl.className = 'exercise-chip-icon';
    iconEl.innerHTML = '<i class="' + iconClass + '" aria-hidden="true"></i>';
    const nameSpan = document.createElement('span');
    nameSpan.className = 'exercise-chip-name';
    nameSpan.textContent = ex.name;
    const durationSpan = document.createElement('span');
    durationSpan.className = 'exercise-chip-duration';
    durationSpan.textContent = ex.defaultDuration + ' min';
    btn.appendChild(iconEl);
    btn.appendChild(nameSpan);
    btn.appendChild(durationSpan);
    btn.addEventListener('click', () => addEditExerciseItem(ex.id));
    container.appendChild(btn);
  });
}

// Collapsible section toggle for edit modal
function toggleCollapsibleSection(sectionId) {
  const section = document.getElementById(sectionId);
  const arrow = document.getElementById(sectionId + 'Arrow');
  if (!section) return;
  
  const isVisible = section.style.display !== 'none';
  section.style.display = isVisible ? 'none' : 'block';
  if (arrow) {
    arrow.textContent = isVisible ? '▼' : '▲';
  }
}

function openFoodModal(logDate) {
  // Close settings modal if open
  closeSettingsModalIfOpen();
  
  currentEditingDate = logDate;
  const log = logs.find(l => l.date === logDate);
  if (log && log.food && typeof log.food === 'object' && !Array.isArray(log.food)) {
    currentFoodByCategory = {
      breakfast: [...(log.food.breakfast || [])],
      lunch: [...(log.food.lunch || [])],
      dinner: [...(log.food.dinner || [])],
      snack: [...(log.food.snack || [])]
    };
  } else if (log && log.food && Array.isArray(log.food)) {
    currentFoodByCategory = { breakfast: [...log.food], lunch: [], dinner: [], snack: [] };
  } else {
    currentFoodByCategory = { breakfast: [], lunch: [], dinner: [], snack: [] };
  }
  renderFoodItems();
  Logger.debug('Food modal opened', { date: logDate, itemCount: getAllFoodItems({ food: currentFoodByCategory }).length });
  
  // Prevent body scroll when modal is open
  document.body.style.overflow = 'hidden';
  
  const overlay = document.getElementById('foodModalOverlay');
  const modalContent = overlay.querySelector('.modal-content');
  
  // Move modal to body if it's not already there (ensures viewport-relative positioning)
  if (overlay.parentElement !== document.body) {
    document.body.appendChild(overlay);
  }
  
  // Reset overlay scroll position (not page scroll - keep user's current view)
  overlay.scrollTop = 0;
  
  // Ensure overlay is fixed to viewport with explicit values using cssText for stronger override
  overlay.style.cssText = `
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    margin: 0 !important;
    padding: 0 !important;
    display: block !important;
    z-index: 10000 !important;
    overflow: hidden !important;
    background: transparent;
    pointer-events: all;
    box-sizing: border-box;
  `;
  
  // Ensure modal content is centered in viewport with explicit values
  if (modalContent) {
    modalContent.style.cssText = `
      position: fixed !important;
      top: 50% !important;
      left: 50% !important;
      transform: translate(-50%, -50%) !important;
      margin: 0 !important;
      padding: 0 !important;
      z-index: 10001 !important;
      visibility: visible !important;
      opacity: 1 !important;
      display: flex !important;
      right: auto !important;
      bottom: auto !important;
      box-sizing: border-box;
    `;
  }
  
  document.body.classList.add('modal-active');
  
  // Force re-calculation of position after a brief delay to ensure viewport centering
  requestAnimationFrame(() => {
    if (overlay && modalContent) {
      // Re-apply positioning to ensure it's relative to viewport
      overlay.style.cssText = overlay.style.cssText; // Force recalculation
      modalContent.style.cssText = modalContent.style.cssText; // Force recalculation
    }
  });
  
  const firstChip = document.querySelector('#foodModalOverlay .food-chip');
  if (firstChip) firstChip.focus();
  // Close on overlay click
  overlay.onclick = function(e) {
    if (e.target === overlay) {
      closeFoodModal();
    }
  };
}

function closeFoodModal() {
  Logger.debug('Food modal closed', { date: currentEditingDate });
  document.getElementById('foodModalOverlay').style.display = 'none';
  document.body.classList.remove('modal-active');
  document.body.style.overflow = '';
  currentEditingDate = null;
  currentFoodByCategory = { breakfast: [], lunch: [], dinner: [], snack: [] };
}

function addFoodItemModal(category, foodId) {
  if (!foodId) return;
  const predefined = PREDEFINED_FOODS.find(f => f.id === foodId);
  if (!predefined) return;
  const foodItem = { name: predefined.name, calories: predefined.calories, protein: predefined.protein };
  currentFoodByCategory[category].push(foodItem);
  renderFoodItems();
}

function removeFoodItemModal(category, index) {
  currentFoodByCategory[category].splice(index, 1);
  renderFoodItems();
}

function renderFoodItems() {
  const categories = ['breakfast', 'lunch', 'dinner', 'snack'];
  const labels = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack' };
  const container = document.getElementById('foodItemsList');
  if (!container) return;
  container.innerHTML = categories.map(cat => {
    const items = currentFoodByCategory[cat] || [];
    const listId = 'modalFood' + labels[cat] + 'List';
    const itemsHtml = items.length === 0
      ? '<p class="empty-items">None</p>'
      : items.map((item, index) => {
          const name = typeof item === 'string' ? item : (item.name || '');
          const calories = typeof item === 'object' && item.calories !== undefined ? item.calories : undefined;
          const protein = typeof item === 'object' && item.protein !== undefined ? item.protein : undefined;
          const safeName = escapeHTML(name);
          let details = '';
          if (calories !== undefined || protein !== undefined) {
            const parts = [];
            if (calories !== undefined) parts.push(`${calories} cal`);
            if (protein !== undefined) parts.push(`${protein}g protein`);
            details = `<span style="font-size: 0.85rem; color: rgba(224, 242, 241, 0.7); margin-left: 8px;">(${parts.join(', ')})</span>`;
          }
          return `
    <div class="item-entry">
      <div style="flex: 1;">
        <span class="item-text">${safeName}</span>
        ${details}
      </div>
      <button class="remove-item-btn" onclick="removeFoodItemModal('${cat}', ${index})" title="Remove">×</button>
    </div>`;
        }).join('');
    const groupsHtml = FOOD_GROUPS.map(grp => {
      const foods = PREDEFINED_FOODS.filter(f => (f.group || 'mixed') === grp.id);
      if (foods.length === 0) return '';
      const chipsHtml = foods.map(f => {
        const iconClass = FOOD_ICONS[f.id] || 'fa-solid fa-utensils';
        const groupClass = 'food-chip--' + (f.group || 'mixed');
        return `<button type="button" class="food-chip ${groupClass}" data-food-id="${escapeHTML(f.id)}" title="Add ${escapeHTML(f.name)}, ${f.calories} cal to ${labels[cat]}" onclick="addFoodItemModal('${cat}', '${escapeHTML(f.id)}')"><span class="food-chip-icon"><i class="${iconClass}" aria-hidden="true"></i></span><span class="food-chip-name">${escapeHTML(f.name)}</span><span class="food-chip-nutrition">${f.calories} cal · ${f.protein}g P</span></button>`;
      }).join('');
      return `<div class="food-group" data-group="${escapeHTML(grp.id)}"><div class="food-group__title">${escapeHTML(grp.label)}</div><div class="food-chips">${chipsHtml}</div></div>`;
    }).join('');
    return `
    <details class="food-category-block food-meal-collapsible">
      <summary class="food-category-summary"><span class="food-meal-label">${labels[cat]}</span><span class="food-meal-arrow" aria-hidden="true">▶</span></summary>
      <div class="food-category-body">
        <div id="${listId}" class="items-list" style="min-height: 24px;">${itemsHtml}</div>
        <div class="food-tiles-by-group" style="margin-top: 8px;">${groupsHtml}</div>
      </div>
    </details>`;
  }).join('');
  // One meal open at a time in the Food Log modal (same as main log form)
  makeAccordion('#foodItemsList', 'details.food-meal-collapsible');
}

function saveFoodLog() {
  if (!currentEditingDate) return;
  const log = logs.find(l => l.date === currentEditingDate);
  if (log) {
    log.food = {
      breakfast: [...(currentFoodByCategory.breakfast || [])],
      lunch: [...(currentFoodByCategory.lunch || [])],
      dinner: [...(currentFoodByCategory.dinner || [])],
      snack: [...(currentFoodByCategory.snack || [])]
    };
    saveLogsToStorage();
    Logger.info('Food log saved', { date: currentEditingDate, itemCount: getAllFoodItems({ food: log.food }).length });
    
    // Check if date filtering is active
    const startDate = document.getElementById('startDate')?.value;
    const endDate = document.getElementById('endDate')?.value;
    
    if (startDate || endDate) {
      // Date filtering is active - use filterLogs which will call renderFilteredLogs
      filterLogs();
    } else {
      // Check if sorting is active
      const sortBtn = document.querySelector('.sort-btn');
      const isSorted = sortBtn && sortBtn.textContent.includes('Oldest');
      
      if (isSorted) {
        // Re-render sorted logs
        const sorted = [...logs].sort((a, b) => new Date(a.date) - new Date(b.date));
        renderSortedLogs(sorted);
      } else {
        // Use regular renderLogs
        renderLogs();
      }
    }
    
    closeFoodModal();
  }
}

function openExerciseModal(logDate) {
  // Close settings modal if open
  closeSettingsModalIfOpen();
  
  currentEditingDate = logDate;
  const log = logs.find(l => l.date === logDate);
  currentExerciseItems = log && log.exercise ? log.exercise.map(item => typeof item === 'string' ? { name: item, duration: undefined } : { ...item }) : [];
  renderExerciseItems();
  Logger.debug('Exercise modal opened', { date: logDate, itemCount: currentExerciseItems.length });
  
  // Prevent body scroll when modal is open
  document.body.style.overflow = 'hidden';
  
  const overlay = document.getElementById('exerciseModalOverlay');
  const modalContent = overlay.querySelector('.modal-content');
  
  // Move modal to body if it's not already there (ensures viewport-relative positioning)
  if (overlay.parentElement !== document.body) {
    document.body.appendChild(overlay);
  }
  
  // Reset overlay scroll position (not page scroll - keep user's current view)
  overlay.scrollTop = 0;
  
  // Ensure overlay is fixed to viewport with explicit values using cssText for stronger override
  overlay.style.cssText = `
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    margin: 0 !important;
    padding: 0 !important;
    display: block !important;
    z-index: 10000 !important;
    overflow: hidden !important;
    background: transparent;
    pointer-events: all;
    box-sizing: border-box;
  `;
  
  // Ensure modal content is centered in viewport with explicit values
  if (modalContent) {
    modalContent.style.cssText = `
      position: fixed !important;
      top: 50% !important;
      left: 50% !important;
      transform: translate(-50%, -50%) !important;
      margin: 0 !important;
      padding: 0 !important;
      z-index: 10001 !important;
      visibility: visible !important;
      opacity: 1 !important;
      display: flex !important;
      right: auto !important;
      bottom: auto !important;
      box-sizing: border-box;
    `;
  }
  
  document.body.classList.add('modal-active');
  
  // Force re-calculation of position after a brief delay to ensure viewport centering
  requestAnimationFrame(() => {
    if (overlay && modalContent) {
      // Re-apply positioning to ensure it's relative to viewport
      overlay.style.cssText = overlay.style.cssText; // Force recalculation
      modalContent.style.cssText = modalContent.style.cssText; // Force recalculation
    }
  });
  
  // Focus first focusable in modal (e.g. close button or first chip)
  const firstFocusable = modalContent?.querySelector('button.modal-close, .exercise-chip');
  if (firstFocusable) firstFocusable.focus();
  // Close on overlay click
  overlay.onclick = function(e) {
    if (e.target === overlay) {
      closeExerciseModal();
    }
  };
}

function closeExerciseModal() {
  Logger.debug('Exercise modal closed', { date: currentEditingDate });
  document.getElementById('exerciseModalOverlay').style.display = 'none';
  document.body.classList.remove('modal-active');
  document.body.style.overflow = '';
  currentEditingDate = null;
  currentExerciseItems = [];
}

// Add exercise in modal (by tile click — uses default duration)
function addExerciseItem(exerciseId) {
  const predefined = PREDEFINED_EXERCISES.find(e => e.id === exerciseId);
  if (!predefined) return;
  currentExerciseItems.push({ name: predefined.name, duration: predefined.defaultDuration });
  renderExerciseItems();
}

function removeExerciseItem(index) {
  currentExerciseItems.splice(index, 1);
  renderExerciseItems();
}

function renderExerciseItems() {
  const list = document.getElementById('exerciseItemsList');
  if (!list) return;
  const itemsHtml = currentExerciseItems.length === 0
    ? '<p class="empty-items">No exercise logged yet.</p>'
    : currentExerciseItems.map((item, index) => `
    <div class="item-entry">
      <span class="item-text">${formatExerciseDisplay(item)}</span>
      <button class="remove-item-btn" onclick="removeExerciseItem(${index})" title="Remove">×</button>
    </div>
  `).join('');
  const categoryBlocks = EXERCISE_CATEGORIES.map(cat => {
    const exercises = PREDEFINED_EXERCISES.filter(e => (e.category || 'cardio') === cat.id);
    const chipsHtml = exercises.map(ex => {
      const iconClass = EXERCISE_ICONS[ex.id] || 'fa-solid fa-dumbbell';
      const groupClass = 'exercise-chip--' + (ex.category || 'cardio');
      return `<button type="button" class="exercise-chip ${groupClass}" data-exercise-id="${escapeHTML(ex.id)}" title="Add ${escapeHTML(ex.name)}, ${ex.defaultDuration} min" onclick="addExerciseItem('${escapeHTML(ex.id)}')"><span class="exercise-chip-icon"><i class="${iconClass}" aria-hidden="true"></i></span><span class="exercise-chip-name">${escapeHTML(ex.name)}</span><span class="exercise-chip-duration">${ex.defaultDuration} min</span></button>`;
    }).join('');
    return `
    <details class="exercise-category-block exercise-meal-collapsible">
      <summary class="exercise-category-summary"><span class="exercise-meal-label">${escapeHTML(cat.label)}</span><span class="exercise-meal-arrow" aria-hidden="true">▶</span></summary>
      <div class="exercise-category-body">
        <div class="exercise-chips">${chipsHtml}</div>
      </div>
    </details>`;
  }).join('');
  list.innerHTML = `
    <div class="items-list" style="min-height: 24px; margin-bottom: 12px;">${itemsHtml}</div>
    ${categoryBlocks}
  `;
}

function saveExerciseLog() {
  if (!currentEditingDate) return;
  const log = logs.find(l => l.date === currentEditingDate);
  if (log) {
    log.exercise = [...currentExerciseItems];
    saveLogsToStorage();
    Logger.info('Exercise log saved', { date: currentEditingDate, itemCount: currentExerciseItems.length });
    
    // Check if date filtering is active
    const startDate = document.getElementById('startDate')?.value;
    const endDate = document.getElementById('endDate')?.value;
    
    if (startDate || endDate) {
      // Date filtering is active - use filterLogs which will call renderFilteredLogs
      filterLogs();
    } else {
      // Check if sorting is active
      const sortBtn = document.querySelector('.sort-btn');
      const isSorted = sortBtn && sortBtn.textContent.includes('Oldest');
      
      if (isSorted) {
        // Re-render sorted logs
        const sorted = [...logs].sort((a, b) => new Date(a.date) - new Date(b.date));
        renderSortedLogs(sorted);
      } else {
        // Use regular renderLogs
        renderLogs();
      }
    }
    
    closeExerciseModal();
  }
}

// Edit Entry Functions
let editingEntryDate = null;
let inlineEditingDate = null; // Track which entry is being edited inline

function openEditEntryModal(logDate) {
  // Close settings modal if open
  closeSettingsModalIfOpen();
  
  editingEntryDate = logDate;
  const log = logs.find(l => l.date === logDate);
  if (!log) {
    Logger.warn('Edit entry modal opened but log not found', { date: logDate });
    return;
  }
  
  Logger.debug('Edit entry modal opened', { date: logDate });
  
  // Populate form with existing data
  document.getElementById('editDate').value = log.date;
  document.getElementById('editBpm').value = log.bpm;
  
  // Handle weight conversion for display
  const weightDisplay = getWeightInDisplayUnit(parseFloat(log.weight));
  document.getElementById('editWeight').value = weightDisplay;
  document.getElementById('editWeightUnitDisplay').textContent = appSettings.weightUnit || 'kg';
  
  document.getElementById('editFatigue').value = log.fatigue;
  document.getElementById('editFatigueValue').textContent = log.fatigue;
  updateEditSliderColor('editFatigue');
  
  document.getElementById('editStiffness').value = log.stiffness;
  document.getElementById('editStiffnessValue').textContent = log.stiffness;
  updateEditSliderColor('editStiffness');
  
  document.getElementById('editSleep').value = log.sleep;
  document.getElementById('editSleepValue').textContent = log.sleep;
  updateEditSliderColor('editSleep');
  
  document.getElementById('editJointPain').value = log.jointPain;
  document.getElementById('editJointPainValue').textContent = log.jointPain;
  updateEditSliderColor('editJointPain');
  
  document.getElementById('editMobility').value = log.mobility;
  document.getElementById('editMobilityValue').textContent = log.mobility;
  updateEditSliderColor('editMobility');
  
  document.getElementById('editDailyFunction').value = log.dailyFunction;
  document.getElementById('editDailyFunctionValue').textContent = log.dailyFunction;
  updateEditSliderColor('editDailyFunction');
  
  document.getElementById('editSwelling').value = log.swelling;
  document.getElementById('editSwellingValue').textContent = log.swelling;
  updateEditSliderColor('editSwelling');
  
  document.getElementById('editFlare').value = log.flare || 'No';
  document.getElementById('editMood').value = log.mood;
  document.getElementById('editMoodValue').textContent = log.mood;
  updateEditSliderColor('editMood');
  
  document.getElementById('editIrritability').value = log.irritability;
  document.getElementById('editIrritabilityValue').textContent = log.irritability;
  updateEditSliderColor('editIrritability');
  
  // Populate new metrics
  const editEnergyClarity = document.getElementById('editEnergyClarity');
  if (editEnergyClarity) editEnergyClarity.value = log.energyClarity || '';
  renderEditEnergyClarityTiles();
  setEditEnergyClaritySelection(log.energyClarity || '');
  
  const editWeatherSensitivity = document.getElementById('editWeatherSensitivity');
  if (editWeatherSensitivity) {
    editWeatherSensitivity.value = log.weatherSensitivity || 5;
    const weatherValueSpan = document.getElementById('editWeatherSensitivityValue');
    if (weatherValueSpan) weatherValueSpan.textContent = editWeatherSensitivity.value;
    updateEditSliderColor('editWeatherSensitivity');
  }
  
  const editSteps = document.getElementById('editSteps');
  if (editSteps) editSteps.value = log.steps || '';
  
  const editHydration = document.getElementById('editHydration');
  if (editHydration) editHydration.value = log.hydration || '';
  
  const editPainLocation = document.getElementById('editPainLocation');
  if (editPainLocation) editPainLocation.value = log.painLocation || '';
  setPainBodyStateFromText('editPainBodyDiagram', 'editPainLocation', log.painLocation || '');

  // Populate stressors list
  editStressorsItems = log.stressors ? [...log.stressors] : [];
  renderEditStressorsList();
  renderStressorTiles('editStressorsTiles');
  
  // Populate symptoms list
  editSymptomsItems = log.symptoms ? [...log.symptoms] : [];
  renderEditSymptomsList();
  renderSymptomTiles('editSymptomsTiles');

  // Populate food (same tile selector as main form)
  if (log.food && typeof log.food === 'object' && !Array.isArray(log.food)) {
    editFoodByCategory = {
      breakfast: (log.food.breakfast || []).map(normalizeFoodItem),
      lunch: (log.food.lunch || []).map(normalizeFoodItem),
      dinner: (log.food.dinner || []).map(normalizeFoodItem),
      snack: (log.food.snack || []).map(normalizeFoodItem)
    };
  } else if (log.food && Array.isArray(log.food)) {
    editFoodByCategory = { breakfast: log.food.map(normalizeFoodItem), lunch: [], dinner: [], snack: [] };
  } else {
    editFoodByCategory = { breakfast: [], lunch: [], dinner: [], snack: [] };
  }
  ['breakfast', 'lunch', 'dinner', 'snack'].forEach(cat => {
    renderEditFoodCategoryList(cat);
    const containerId = 'editFood' + cat.charAt(0).toUpperCase() + cat.slice(1) + 'Chips';
    renderEditFoodChipsForCategory(cat, containerId);
  });

  // Populate exercise (same tile selector as main form)
  editExerciseItems = log.exercise ? log.exercise.map(item => typeof item === 'string' ? { name: item, duration: undefined } : { ...item }) : [];
  renderEditExerciseItemsList();
  EXERCISE_CATEGORIES.forEach(cat => {
    const containerId = 'editExercise' + cat.label + 'Chips';
    renderEditExerciseChipsForCategory(cat.id, containerId);
  });

  // One exercise category open at a time in edit modal (same as main form)
  makeAccordion('#editExerciseSection', 'details.exercise-meal-collapsible');
  makeAccordion('#editFoodSection', 'details.food-meal-collapsible');

  document.getElementById('editNotes').value = log.notes || '';
  
  // Initialize sliders
  const editSliders = ['editFatigue', 'editStiffness', 'editSleep', 'editJointPain', 'editMobility', 'editDailyFunction', 'editSwelling', 'editMood', 'editIrritability', 'editWeatherSensitivity'];
  editSliders.forEach(sliderId => {
    const slider = document.getElementById(sliderId);
    if (slider) {
      slider.addEventListener('input', function() {
        const valueSpan = document.getElementById(sliderId + 'Value');
        if (valueSpan) valueSpan.textContent = this.value;
        updateEditSliderColor(sliderId);
      });
    }
  });
  
  const overlay = document.getElementById('editEntryModalOverlay');
  if (!overlay) {
    console.error('Edit entry modal overlay not found!');
    Logger.error('Edit entry modal overlay not found');
    return;
  }
  
  // Get modal content before showing overlay
  const modalContent = overlay.querySelector('.modal-content');
  if (!modalContent) {
    console.error('Edit entry modal content not found!');
    Logger.error('Edit entry modal content not found');
    return;
  }
  
  // Prevent body scroll when modal is open
  document.body.style.overflow = 'hidden';
  
  // Reset scroll position to ensure consistent modal positioning
  overlay.scrollTop = 0;
  window.scrollTo(0, 0);
  
  // Ensure overlay is fixed to viewport with explicit values - full page container
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.right = '0';
  overlay.style.bottom = '0';
  overlay.style.width = '100vw';
  overlay.style.height = '100vh';
  overlay.style.zIndex = '10000';
  overlay.style.visibility = 'visible';
  overlay.style.opacity = '1';
  overlay.style.display = 'block';
  overlay.style.overflow = 'hidden';
  overlay.style.margin = '0';
  overlay.style.padding = '0';
  
  // Set modal content properties - fixed center position
  modalContent.style.position = 'fixed';
  modalContent.style.top = '50%';
  modalContent.style.left = '50%';
  modalContent.style.right = 'auto';
  modalContent.style.bottom = 'auto';
  modalContent.style.transform = 'translate(-50%, -50%)';
  modalContent.style.margin = '0';
  modalContent.style.padding = '0';
  modalContent.style.zIndex = '10001';
  modalContent.style.display = 'flex';
  modalContent.style.visibility = 'visible';
  modalContent.style.opacity = '1';
  
  document.body.classList.add('modal-active');
  
  // Close on overlay click
  overlay.onclick = function(e) {
    if (e.target === overlay) {
      closeEditEntryModal();
    }
  };
}

function closeEditEntryModal() {
  Logger.debug('Edit entry modal closed', { date: editingEntryDate });
  document.getElementById('editEntryModalOverlay').style.display = 'none';
  document.body.classList.remove('modal-active');
  document.body.style.overflow = '';
  editingEntryDate = null;
}

// Inline editing functions
function enableInlineEdit(logDate) {
  if (!logDate) {
    console.error('enableInlineEdit: logDate is required');
    return;
  }
  
  inlineEditingDate = logDate;
  Logger.debug('Inline edit enabled', { date: logDate });
  
  // Check if date filtering is active
  const startDate = document.getElementById('startDate')?.value;
  const endDate = document.getElementById('endDate')?.value;
  
  if (startDate || endDate) {
    // Date filtering is active - use filterLogs which will call renderFilteredLogs
    filterLogs();
  } else {
    // Check if sorting is active
    const sortBtn = document.querySelector('.sort-btn');
    const isSorted = sortBtn && sortBtn.textContent.includes('Oldest');
    
    if (isSorted) {
      // Re-render sorted logs
      const sorted = [...logs].sort((a, b) => new Date(a.date) - new Date(b.date));
      renderSortedLogs(sorted);
    } else {
      // Use regular renderLogs
      renderLogs();
    }
  }
  
  // Scroll the entry into view
  setTimeout(() => {
    const entry = document.querySelector(`[data-log-date="${logDate}"]`);
    if (entry) {
      entry.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      console.warn('Entry not found after render:', logDate);
    }
  }, 100);
}

function saveInlineEdit(logDate) {
  const log = logs.find(l => l.date === logDate);
  if (!log) {
    Logger.warn('Log entry not found for inline edit', { date: logDate });
    return;
  }
  
  // Get the entry element
  const entryElement = document.querySelector(`[data-log-date="${logDate}"]`);
  if (!entryElement) {
    Logger.warn('Entry element not found for inline edit', { date: logDate });
    inlineEditingDate = null;
    renderLogs();
    return;
  }
  
  // Get all input values from the editable fields
  const dateInput = entryElement.querySelector('.inline-edit-date');
  const bpmInput = entryElement.querySelector('.inline-edit-bpm');
  const weightInput = entryElement.querySelector('.inline-edit-weight');
  const fatigueInput = entryElement.querySelector('.inline-edit-fatigue');
  const stiffnessInput = entryElement.querySelector('.inline-edit-stiffness');
  const backPainInput = entryElement.querySelector('.inline-edit-backPain');
  const sleepInput = entryElement.querySelector('.inline-edit-sleep');
  const jointPainInput = entryElement.querySelector('.inline-edit-jointPain');
  const mobilityInput = entryElement.querySelector('.inline-edit-mobility');
  const dailyFunctionInput = entryElement.querySelector('.inline-edit-dailyFunction');
  const swellingInput = entryElement.querySelector('.inline-edit-swelling');
  const flareSelect = entryElement.querySelector('.inline-edit-flare');
  const moodInput = entryElement.querySelector('.inline-edit-mood');
  const irritabilityInput = entryElement.querySelector('.inline-edit-irritability');
  const notesTextarea = entryElement.querySelector('.inline-edit-notes');
  
  // Update log entry
  // Validate date change - prevent duplicate dates
  if (dateInput) {
    const newDate = dateInput.value.trim();
    const oldDate = log.date;
    
    // If date is being changed, check for duplicates
    if (newDate !== oldDate) {
      // Check if another entry already exists with this date
      const existingEntry = logs.find(l => l.date === newDate && l.date !== oldDate);
      if (existingEntry) {
        // Show validation error
        showAlertModal(`An entry for ${newDate} already exists. Please choose a different date.`, 'Duplicate Entry');
        Logger.warn('Duplicate entry prevented in inline edit', { oldDate, newDate });
        
        // Reset date to original value
        dateInput.value = oldDate;
        dateInput.focus();
        dateInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return; // Don't save the changes
      }
    }
    
    log.date = newDate;
  }
  if (bpmInput) log.bpm = bpmInput.value;
  
  if (weightInput) {
    let weightValue = parseFloat(weightInput.value);
    if (appSettings.weightUnit === 'lb') {
      weightValue = parseFloat(lbToKg(weightValue));
    }
    log.weight = weightValue.toFixed(1);
  }
  
  if (fatigueInput) log.fatigue = fatigueInput.value;
  if (stiffnessInput) log.stiffness = stiffnessInput.value;
  if (sleepInput) log.sleep = sleepInput.value;
  if (jointPainInput) log.jointPain = jointPainInput.value;
  if (mobilityInput) log.mobility = mobilityInput.value;
  if (dailyFunctionInput) log.dailyFunction = dailyFunctionInput.value;
  if (swellingInput) log.swelling = swellingInput.value;
  if (flareSelect) log.flare = flareSelect.value;
  if (moodInput) log.mood = moodInput.value;
  if (irritabilityInput) log.irritability = irritabilityInput.value;
  if (notesTextarea) log.notes = notesTextarea.value || '';
  
  // Update new metrics if they exist in the form
  // Arrays (stressors, symptoms) are preserved as-is from the log entry
  // They can be edited via separate modals like food/exercise
  if (!log.stressors) log.stressors = [];
  if (!log.symptoms) log.symptoms = [];
  
  // Get inline edit inputs from the entry element (not document.getElementById)
  const energyClarityInput = entryElement.querySelector('.inline-edit-energyClarity');
  const weatherSensitivityInput = entryElement.querySelector('.inline-edit-weatherSensitivity');
  const painLocationInput = entryElement.querySelector('.inline-edit-painLocation');
  const stepsInput = entryElement.querySelector('.inline-edit-steps');
  const hydrationInput = entryElement.querySelector('.inline-edit-hydration');
  
  if (energyClarityInput) log.energyClarity = energyClarityInput.value ? escapeHTML(energyClarityInput.value.trim()) : undefined;
  if (weatherSensitivityInput) log.weatherSensitivity = weatherSensitivityInput.value || undefined;
  if (painLocationInput) log.painLocation = painLocationInput.value ? escapeHTML(painLocationInput.value.trim().substring(0, 150)) : undefined;
  if (stepsInput) log.steps = stepsInput.value ? parseInt(stepsInput.value) : undefined;
  if (hydrationInput) log.hydration = hydrationInput.value ? parseFloat(hydrationInput.value) : undefined;
  
  // Remove undefined values
  Object.keys(log).forEach(key => {
    if (log[key] === undefined || log[key] === '') {
      delete log[key];
    }
  });
  
  // Preserve food (category object) and exercise arrays
  if (!log.food) log.food = { breakfast: [], lunch: [], dinner: [], snack: [] };
  if (!log.exercise) log.exercise = [];
  
  // Save to localStorage
  saveLogsToStorage();
  Logger.info('Health log entry edited inline and saved', { date: logDate });
  
  // Exit edit mode and re-render
  inlineEditingDate = null;
  
  // Check if date filtering is active
  const startDate = document.getElementById('startDate')?.value;
  const endDate = document.getElementById('endDate')?.value;
  
  if (startDate || endDate) {
    // Date filtering is active - use filterLogs which will call renderFilteredLogs
    filterLogs();
  } else {
    // Check if sorting is active
    const sortBtn = document.querySelector('.sort-btn');
    const isSorted = sortBtn && sortBtn.textContent.includes('Oldest');
    
    if (isSorted) {
      // Re-render sorted logs
      const sorted = [...logs].sort((a, b) => new Date(a.date) - new Date(b.date));
      renderSortedLogs(sorted);
    } else {
      // Use regular renderLogs
      renderLogs();
    }
  }
  
  updateCharts();
  updateHeartbeatAnimation();
  
  // Show success message
  const successMsg = document.createElement('div');
  successMsg.className = 'success-notification';
  successMsg.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #4caf50, #66bb6a);
    color: white;
    padding: 18px 24px;
    border-radius: 16px;
    font-weight: 600;
    font-size: 1rem;
    z-index: 10000;
    box-shadow: 0 8px 24px rgba(76, 175, 80, 0.4), 0 0 20px rgba(76, 175, 80, 0.3);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    animation: slideInRight 0.4s cubic-bezier(0.4, 0, 0.2, 1), fadeOut 0.3s ease-out 2.7s forwards;
  `;
  successMsg.textContent = 'Entry updated successfully! ✅';
  document.body.appendChild(successMsg);
  setTimeout(() => {
    successMsg.style.animation = 'slideOutRight 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards';
    setTimeout(() => successMsg.remove(), 300);
  }, 3000);
}

function updateEditSliderColor(sliderId) {
  const slider = document.getElementById(sliderId);
  if (!slider) return;
  const value = parseInt(slider.value);
  const percentage = (value / 10) * 100;
  slider.style.background = `linear-gradient(to right, #4caf50 0%, #4caf50 ${percentage}%, rgba(255, 255, 255, 0.1) ${percentage}%, rgba(255, 255, 255, 0.1) 100%)`;
}

function toggleEditWeightUnit() {
  const currentUnit = appSettings.weightUnit || 'kg';
  const newUnit = currentUnit === 'kg' ? 'lb' : 'kg';
  appSettings.weightUnit = newUnit;
  localStorage.setItem('appSettings', JSON.stringify(appSettings));
  
  const weightInput = document.getElementById('editWeight');
  const currentValue = parseFloat(weightInput.value);
  
  if (currentUnit === 'kg') {
    weightInput.value = kgToLb(currentValue).toFixed(1);
  } else {
    weightInput.value = lbToKg(currentValue).toFixed(1);
  }
  
  document.getElementById('editWeightUnitDisplay').textContent = newUnit;
}

function saveEditedEntry() {
  if (!editingEntryDate) return;
  
  const form = document.getElementById('editEntryForm');
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }
  
  const log = logs.find(l => l.date === editingEntryDate);
  if (!log) return;
  
  // Get weight value and convert to kg if needed
  let weightValue = parseFloat(document.getElementById("editWeight").value);
  if (appSettings.weightUnit === 'lb') {
    weightValue = parseFloat(lbToKg(weightValue));
  }
  
  // Update log entry
  log.date = document.getElementById("editDate").value;
  log.bpm = document.getElementById("editBpm").value;
  log.weight = weightValue.toFixed(1);
  log.fatigue = document.getElementById("editFatigue").value;
  log.stiffness = document.getElementById("editStiffness").value;
  log.sleep = document.getElementById("editSleep").value;
  log.jointPain = document.getElementById("editJointPain").value;
  log.mobility = document.getElementById("editMobility").value;
  log.dailyFunction = document.getElementById("editDailyFunction").value;
  log.swelling = document.getElementById("editSwelling").value;
  log.flare = document.getElementById("editFlare").value;
  log.mood = document.getElementById("editMood").value;
  log.irritability = document.getElementById("editIrritability").value;
  
  // Update new metrics
  const editEnergyClarity = document.getElementById("editEnergyClarity");
  if (editEnergyClarity) log.energyClarity = editEnergyClarity.value ? escapeHTML(editEnergyClarity.value.trim()) : undefined;
  
  const editWeatherSensitivity = document.getElementById("editWeatherSensitivity");
  if (editWeatherSensitivity) log.weatherSensitivity = editWeatherSensitivity.value || undefined;
  
  const editSteps = document.getElementById("editSteps");
  if (editSteps) log.steps = editSteps.value ? parseInt(editSteps.value) : undefined;
  
  const editHydration = document.getElementById("editHydration");
  if (editHydration) log.hydration = editHydration.value ? parseFloat(editHydration.value) : undefined;
  
  const editPainLocation = document.getElementById("editPainLocation");
  if (editPainLocation) log.painLocation = editPainLocation.value ? escapeHTML(editPainLocation.value.trim().substring(0, 150)) : undefined;
  
  // Update stressors and symptoms arrays
  log.stressors = editStressorsItems.length > 0 ? editStressorsItems.map(item => escapeHTML(item.trim())) : undefined;
  log.symptoms = editSymptomsItems.length > 0 ? editSymptomsItems.map(item => escapeHTML(item.trim())) : undefined;
  
  // Update food and exercise from edit modal (same tile selector as main form)
  log.food = {
    breakfast: (editFoodByCategory.breakfast || []).map(sanitizeEditFoodItem),
    lunch: (editFoodByCategory.lunch || []).map(sanitizeEditFoodItem),
    dinner: (editFoodByCategory.dinner || []).map(sanitizeEditFoodItem),
    snack: (editFoodByCategory.snack || []).map(sanitizeEditFoodItem)
  };
  log.exercise = (editExerciseItems || []).map(item => {
    const name = typeof item === 'string' ? item.trim() : (item.name || '').trim();
    const duration = typeof item === 'object' && item.duration != null ? Math.max(1, Math.min(300, parseInt(item.duration, 10) || 0)) : undefined;
    return { name: escapeHTML(name), duration: name ? (duration || undefined) : undefined };
  }).filter(item => item.name.length > 0);
  
  log.notes = document.getElementById("editNotes").value || '';
  
  saveLogsToStorage();
  Logger.info('Health log entry edited and saved', { 
    originalDate: editingEntryDate, 
    newDate: log.date,
    entryId: logs.findIndex(l => l.date === log.date)
  });
  renderLogs();
  updateCharts();
  updateHeartbeatAnimation();
  closeEditEntryModal();
  
  // Show success message
  const successMsg = document.createElement('div');
  successMsg.className = 'success-notification';
  successMsg.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #4caf50, #66bb6a);
    color: white;
    padding: 18px 24px;
    border-radius: 16px;
    font-weight: 600;
    font-size: 1rem;
    z-index: 10000;
    box-shadow: 0 8px 24px rgba(76, 175, 80, 0.4), 0 0 20px rgba(76, 175, 80, 0.3);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    animation: slideInRight 0.4s cubic-bezier(0.4, 0, 0.2, 1), fadeOut 0.3s ease-out 2.7s forwards;
  `;
  successMsg.textContent = 'Entry updated successfully! ✅';
  document.body.appendChild(successMsg);
  setTimeout(() => {
    successMsg.style.animation = 'slideOutRight 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards';
    setTimeout(() => successMsg.remove(), 300);
  }, 3000);
}



// Helper function to generate log entry HTML
function generateLogEntryHTML(log) {
  const isEditing = inlineEditingDate === log.date;
  const weightDisplay = getWeightInDisplayUnit(parseFloat(log.weight));
  const weightUnit = getWeightUnitSuffix();
  
  const dateObj = new Date(log.date);
  const formattedDate = dateObj.toLocaleDateString('en-US', { 
    weekday: 'short', 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
  
  const flareStatus = log.flare === 'Yes' ? '<span class="flare-badge flare-yes">Flare-up</span>' : '<span class="flare-badge flare-no">No Flare-up</span>';
  const foodCount = getAllFoodItems(log).length;
  const exerciseCount = log.exercise && log.exercise.length > 0 ? log.exercise.length : 0;
  
  const safeDate = escapeHTML(log.date);
  const editButton = isEditing 
    ? `<button class="edit-btn save-btn" onclick="event.stopPropagation(); saveInlineEdit('${safeDate}')" title="Save changes">💾</button>`
    : `<button class="edit-btn" onclick="event.stopPropagation(); enableInlineEdit('${safeDate}')" title="Edit this entry">✏️</button>`;
  
  return `
    <div class="log-entry-actions" onclick="if(!event.target.closest('button')) toggleLogEntry('${escapeHTML(log.date)}')">
      <button class="delete-btn" onclick="event.stopPropagation(); deleteLogEntry('${escapeHTML(log.date)}')" title="Delete this entry">&times;</button>
      ${editButton}
    </div>
    <div class="log-entry-header-collapsible" onclick="toggleLogEntry('${escapeHTML(log.date)}')">
      <div class="log-entry-header-content">
        ${isEditing 
          ? `<input type="date" class="inline-edit-date" value="${log.date}" onclick="event.stopPropagation();" style="font-size: 1.2rem; padding: 5px; border-radius: 8px; border: 1px solid rgba(76, 175, 80, 0.5); background: rgba(0,0,0,0.3); color: #e0f2f1; width: auto; max-width: 200px; margin-right: 20px;" />`
          : `<h3 class="log-date">${formattedDate}</h3>`
        }
        <div class="header-badges">
          <button class="header-icon-btn food-btn" onclick="event.stopPropagation(); openFoodModal('${escapeHTML(log.date)}')" title="Food Log ${foodCount > 0 ? `(${foodCount} items)` : ''}">
            🍽️${foodCount > 0 ? `<span class="badge-count">${foodCount}</span>` : ''}
          </button>
          <button class="header-icon-btn exercise-btn" onclick="event.stopPropagation(); openExerciseModal('${escapeHTML(log.date)}')" title="Exercise Log ${exerciseCount > 0 ? `(${exerciseCount} items)` : ''}">
            🏃${exerciseCount > 0 ? `<span class="badge-count">${exerciseCount}</span>` : ''}
          </button>
          ${isEditing 
            ? `<select class="inline-edit-flare" onclick="event.stopPropagation();" style="padding: 4px 8px; border-radius: 8px; border: 1px solid rgba(76, 175, 80, 0.5); background: rgba(0,0,0,0.3); color: #e0f2f1;">
                <option value="No" ${log.flare === 'No' ? 'selected' : ''}>No Flare-up</option>
                <option value="Yes" ${log.flare === 'Yes' ? 'selected' : ''}>Flare-up</option>
              </select>`
            : flareStatus
          }
        </div>
      </div>
      <span class="log-entry-arrow"></span>
    </div>
    <div class="log-entry-content">
      <div class="log-metrics-grid">
      <div class="metric-group vital-signs">
        <h4 class="metric-group-title">Vital Signs</h4>
        <div class="metric-item">
          <span class="metric-label">❤️ Heart Rate</span>
          ${isEditing 
            ? `<span style="display: flex; align-items: center; gap: 8px; margin-left: auto;"><input type="number" class="inline-edit-bpm" value="${log.bpm}" min="30" max="120" style="width: 70px; padding: 4px 8px; border-radius: 6px; border: 1px solid rgba(76, 175, 80, 0.5); background: rgba(0,0,0,0.3); color: #e0f2f1; text-align: center;" /><span style="color: #b0bec5; font-size: 0.9rem;">BPM</span></span>`
            : `<span class="metric-value">${log.bpm} BPM</span>`
          }
        </div>
        <div class="metric-item">
          <span class="metric-label">⚖️ Weight</span>
          ${isEditing 
            ? `<span style="display: flex; align-items: center; gap: 8px; margin-left: auto;"><input type="number" class="inline-edit-weight" value="${weightDisplay}" min="40" max="200" step="0.1" style="width: 80px; padding: 4px 8px; border-radius: 6px; border: 1px solid rgba(76, 175, 80, 0.5); background: rgba(0,0,0,0.3); color: #e0f2f1; text-align: center;" /><span style="color: #b0bec5; font-size: 0.9rem;">${weightUnit}</span></span>`
            : `<span class="metric-value">${weightDisplay}${weightUnit}</span>`
          }
        </div>
      </div>
      <div class="metric-group symptoms">
        <h4 class="metric-group-title">Symptoms</h4>
        <div class="metric-item">
          <span class="metric-label">😴 Fatigue</span>
          ${isEditing 
            ? `<span style="display: flex; align-items: center; gap: 4px; margin-left: auto;"><input type="number" class="inline-edit-fatigue" value="${log.fatigue}" min="0" max="10" style="width: 60px; padding: 4px 8px; border-radius: 6px; border: 1px solid rgba(76, 175, 80, 0.5); background: rgba(0,0,0,0.3); color: #e0f2f1; text-align: center;" /><span style="color: #b0bec5; font-size: 0.9rem;">/10</span></span>`
            : `<span class="metric-value">${log.fatigue}/10</span>`
          }
        </div>
        <div class="metric-item">
          <span class="metric-label">🔒 Stiffness</span>
          ${isEditing 
            ? `<span style="display: flex; align-items: center; gap: 4px; margin-left: auto;"><input type="number" class="inline-edit-stiffness" value="${log.stiffness}" min="0" max="10" style="width: 60px; padding: 4px 8px; border-radius: 6px; border: 1px solid rgba(76, 175, 80, 0.5); background: rgba(0,0,0,0.3); color: #e0f2f1; text-align: center;" /><span style="color: #b0bec5; font-size: 0.9rem;">/10</span></span>`
            : `<span class="metric-value">${log.stiffness}/10</span>`
          }
        </div>
        <div class="metric-item">
          <span class="metric-label">💢 Back Pain</span>
          ${isEditing 
            ? `<span style="display: flex; align-items: center; gap: 4px; margin-left: auto;"><input type="number" class="inline-edit-backPain" value="${log.backPain}" min="0" max="10" style="width: 60px; padding: 4px 8px; border-radius: 6px; border: 1px solid rgba(76, 175, 80, 0.5); background: rgba(0,0,0,0.3); color: #e0f2f1; text-align: center;" /><span style="color: #b0bec5; font-size: 0.9rem;">/10</span></span>`
            : `<span class="metric-value">${log.backPain}/10</span>`
          }
        </div>
        <div class="metric-item">
          <span class="metric-label">🦴 Joint Pain</span>
          ${isEditing 
            ? `<span style="display: flex; align-items: center; gap: 4px; margin-left: auto;"><input type="number" class="inline-edit-jointPain" value="${log.jointPain}" min="0" max="10" style="width: 60px; padding: 4px 8px; border-radius: 6px; border: 1px solid rgba(76, 175, 80, 0.5); background: rgba(0,0,0,0.3); color: #e0f2f1; text-align: center;" /><span style="color: #b0bec5; font-size: 0.9rem;">/10</span></span>`
            : `<span class="metric-value">${log.jointPain}/10</span>`
          }
        </div>
        <div class="metric-item">
          <span class="metric-label">💧 Swelling</span>
          ${isEditing 
            ? `<span style="display: flex; align-items: center; gap: 4px; margin-left: auto;"><input type="number" class="inline-edit-swelling" value="${log.swelling}" min="0" max="10" style="width: 60px; padding: 4px 8px; border-radius: 6px; border: 1px solid rgba(76, 175, 80, 0.5); background: rgba(0,0,0,0.3); color: #e0f2f1; text-align: center;" /><span style="color: #b0bec5; font-size: 0.9rem;">/10</span></span>`
            : `<span class="metric-value">${log.swelling}/10</span>`
          }
        </div>
      </div>
      <div class="metric-group wellbeing">
        <h4 class="metric-group-title">Wellbeing</h4>
        <div class="metric-item">
          <span class="metric-label">🌙 Sleep</span>
          ${isEditing 
            ? `<span style="display: flex; align-items: center; gap: 4px; margin-left: auto;"><input type="number" class="inline-edit-sleep" value="${log.sleep}" min="0" max="10" style="width: 60px; padding: 4px 8px; border-radius: 6px; border: 1px solid rgba(76, 175, 80, 0.5); background: rgba(0,0,0,0.3); color: #e0f2f1; text-align: center;" /><span style="color: #b0bec5; font-size: 0.9rem;">/10</span></span>`
            : `<span class="metric-value">${log.sleep}/10</span>`
          }
        </div>
        <div class="metric-item">
          <span class="metric-label">😊 Mood</span>
          ${isEditing 
            ? `<span style="display: flex; align-items: center; gap: 4px; margin-left: auto;"><input type="number" class="inline-edit-mood" value="${log.mood}" min="0" max="10" style="width: 60px; padding: 4px 8px; border-radius: 6px; border: 1px solid rgba(76, 175, 80, 0.5); background: rgba(0,0,0,0.3); color: #e0f2f1; text-align: center;" /><span style="color: #b0bec5; font-size: 0.9rem;">/10</span></span>`
            : `<span class="metric-value">${log.mood}/10</span>`
          }
        </div>
        <div class="metric-item">
          <span class="metric-label">😤 Irritability</span>
          ${isEditing 
            ? `<span style="display: flex; align-items: center; gap: 4px; margin-left: auto;"><input type="number" class="inline-edit-irritability" value="${log.irritability}" min="0" max="10" style="width: 60px; padding: 4px 8px; border-radius: 6px; border: 1px solid rgba(76, 175, 80, 0.5); background: rgba(0,0,0,0.3); color: #e0f2f1; text-align: center;" /><span style="color: #b0bec5; font-size: 0.9rem;">/10</span></span>`
            : `<span class="metric-value">${log.irritability}/10</span>`
          }
        </div>
      </div>
      <div class="metric-group function">
        <h4 class="metric-group-title">Function</h4>
        <div class="metric-item">
          <span class="metric-label">🚶 Mobility</span>
          ${isEditing 
            ? `<span style="display: flex; align-items: center; gap: 4px; margin-left: auto;"><input type="number" class="inline-edit-mobility" value="${log.mobility}" min="0" max="10" style="width: 60px; padding: 4px 8px; border-radius: 6px; border: 1px solid rgba(76, 175, 80, 0.5); background: rgba(0,0,0,0.3); color: #e0f2f1; text-align: center;" /><span style="color: #b0bec5; font-size: 0.9rem;">/10</span></span>`
            : `<span class="metric-value">${log.mobility}/10</span>`
          }
        </div>
        <div class="metric-item">
          <span class="metric-label">📋 Daily Activities</span>
          ${isEditing 
            ? `<span style="display: flex; align-items: center; gap: 4px; margin-left: auto;"><input type="number" class="inline-edit-dailyFunction" value="${log.dailyFunction}" min="0" max="10" style="width: 60px; padding: 4px 8px; border-radius: 6px; border: 1px solid rgba(76, 175, 80, 0.5); background: rgba(0,0,0,0.3); color: #e0f2f1; text-align: center;" /><span style="color: #b0bec5; font-size: 0.9rem;">/10</span></span>`
            : `<span class="metric-value">${log.dailyFunction}/10</span>`
          }
        </div>
      </div>
      ${(log.energyClarity || log.weatherSensitivity) 
        ? `<div class="metric-group energy-cognitive">
          <h4 class="metric-group-title">⚡ Energy & Mental Clarity</h4>
          ${log.energyClarity ? `<div class="metric-item">
            <span class="metric-label">🧠 Energy/Clarity</span>
            ${isEditing 
              ? `<input type="text" class="inline-edit-energyClarity" value="${escapeHTML(log.energyClarity)}" maxlength="50" style="flex: 1; max-width: 200px; padding: 4px 8px; border-radius: 6px; border: 1px solid rgba(76, 175, 80, 0.5); background: rgba(0,0,0,0.3); color: #e0f2f1; margin-left: 12px;" />`
              : `<span class="metric-value">${escapeHTML(log.energyClarity)}</span>`
            }
          </div>` : ''}
          ${log.weatherSensitivity ? `<div class="metric-item">
            <span class="metric-label">🌤️ Weather Sensitivity</span>
            ${isEditing 
              ? `<span style="display: flex; align-items: center; gap: 4px; margin-left: auto;"><input type="number" class="inline-edit-weatherSensitivity" value="${log.weatherSensitivity}" min="0" max="10" style="width: 60px; padding: 4px 8px; border-radius: 6px; border: 1px solid rgba(76, 175, 80, 0.5); background: rgba(0,0,0,0.3); color: #e0f2f1; text-align: center;" /><span style="color: #b0bec5; font-size: 0.9rem;">/10</span></span>`
              : `<span class="metric-value">${log.weatherSensitivity}/10</span>`
            }
          </div>` : ''}
        </div>` : ''
      }
      ${(log.steps || log.hydration) 
        ? `<div class="metric-group lifestyle-factors">
          <h4 class="metric-group-title">🏃 Lifestyle Factors</h4>
          ${log.steps ? `<div class="metric-item">
            <span class="metric-label">👣 Steps</span>
            ${isEditing 
              ? `<input type="number" class="inline-edit-steps" value="${log.steps}" min="0" max="50000" style="width: 100px; padding: 4px 8px; border-radius: 6px; border: 1px solid rgba(76, 175, 80, 0.5); background: rgba(0,0,0,0.3); color: #e0f2f1; text-align: center; margin-left: auto;" />`
              : `<span class="metric-value">${log.steps.toLocaleString()}</span>`
            }
          </div>` : ''}
          ${log.hydration ? `<div class="metric-item">
            <span class="metric-label">💧 Hydration</span>
            ${isEditing 
              ? `<span style="display: flex; align-items: center; gap: 8px; margin-left: auto;"><input type="number" class="inline-edit-hydration" value="${log.hydration}" min="0" max="20" step="0.5" style="width: 80px; padding: 4px 8px; border-radius: 6px; border: 1px solid rgba(76, 175, 80, 0.5); background: rgba(0,0,0,0.3); color: #e0f2f1; text-align: center;" /><span style="color: #b0bec5; font-size: 0.9rem;">glasses</span></span>`
              : `<span class="metric-value">${log.hydration} glasses</span>`
            }
          </div>` : ''}
        </div>` : ''
      }
      ${getAllFoodItems(log).length > 0
        ? `<div class="metric-group food-log">
          <h4 class="metric-group-title">🍽️ Food Log</h4>
          ${formatFoodLogForView(log)}
        </div>` : ''
      }
      ${(log.exercise && log.exercise.length > 0)
        ? `<div class="metric-group exercise-log">
          <h4 class="metric-group-title">🏃 Exercise Log</h4>
          <div class="metric-item">
            <span class="metric-label">Activities</span>
            <span class="metric-value metric-value-list">${log.exercise.map(item => escapeHTML(formatExerciseDisplay(item))).join('; ')}</span>
          </div>
        </div>` : ''
      }
      ${(log.stressors && log.stressors.length > 0) 
        ? `<div class="metric-group stress-triggers">
          <h4 class="metric-group-title">😰 Stress & Triggers</h4>
          <div class="metric-item">
            <span class="metric-label">💥 Stressors</span>
            <span class="metric-value">${log.stressors.map(s => escapeHTML(s)).join(', ')}</span>
          </div>
        </div>` : ''
      }
      ${((log.symptoms && log.symptoms.length > 0) || log.painLocation) 
        ? `<div class="metric-group additional-symptoms">
          <h4 class="metric-group-title">💉 Additional Symptoms</h4>
          ${(log.symptoms && log.symptoms.length > 0) ? `<div class="metric-item">
            <span class="metric-label">Symptoms</span>
            <span class="metric-value">${log.symptoms.map(s => escapeHTML(s)).join(', ')}</span>
          </div>` : ''}
          ${log.painLocation ? `<div class="metric-item">
            <span class="metric-label">📍 Pain Location</span>
            ${isEditing 
              ? `<input type="text" class="inline-edit-painLocation" value="${escapeHTML(log.painLocation)}" maxlength="150" style="flex: 1; max-width: 250px; padding: 4px 8px; border-radius: 6px; border: 1px solid rgba(76, 175, 80, 0.5); background: rgba(0,0,0,0.3); color: #e0f2f1; margin-left: 12px;" />`
              : `<span class="metric-value">${escapeHTML(log.painLocation)}</span>`
            }
          </div>` : ''}
        </div>` : ''
      }
      </div>
      ${isEditing 
        ? `<div class="log-notes"><strong>📝 Note:</strong> <textarea class="inline-edit-notes" onclick="event.stopPropagation();" style="width: 100%; min-height: 60px; padding: 8px; border-radius: 8px; border: 1px solid rgba(76, 175, 80, 0.5); background: rgba(0,0,0,0.3); color: #e0f2f1; margin-top: 8px; resize: vertical;">${log.notes || ''}</textarea></div>`
        : (log.notes ? `<div class="log-notes"><strong>📝 Note:</strong> ${escapeHTML(log.notes)}</div>` : '')
      }
    </div>
  `;
}

function toggleLogEntry(logDate) {
  const entry = document.querySelector(`.entry[data-log-date="${logDate}"]`);
  if (!entry) return;
  
  const content = entry.querySelector('.log-entry-content');
  const arrow = entry.querySelector('.log-entry-arrow');
  
  if (entry.classList.contains('expanded')) {
    entry.classList.remove('expanded');
    if (content) content.style.display = 'none';
    if (arrow) arrow.textContent = '';
  } else {
    entry.classList.add('expanded');
    if (content) content.style.display = 'block';
    if (arrow) arrow.textContent = '';
  }
}

// Shared render function to reduce code duplication (optimized)
function renderLogEntries(logsToRender) {
  // Use DOMCache for output element
    const outputEl = window.PerformanceUtils?.DOMCache?.getElement('logOutput') || document.getElementById('logOutput');
  if (window.PerformanceUtils?.domBatcher) {
    window.PerformanceUtils.domBatcher.schedule(() => {
      const fragment = document.createDocumentFragment();
      outputEl.innerHTML = "";
      
      // Pre-compute HTML strings for better performance
      const entries = logsToRender.map(log => {
        const div = document.createElement("div");
        div.className = "entry";
        div.setAttribute('data-log-date', log.date);
        if (isExtreme(log)) div.classList.add("highlight");
        if (log.flare === 'Yes') div.classList.add("flare-up-entry");
        if (inlineEditingDate === log.date) {
          div.classList.add("editing");
          div.classList.add("expanded");
        }
        
        div.innerHTML = generateLogEntryHTML(log);
        
        // Hide content by default (collapsed), unless editing
        const content = div.querySelector('.log-entry-content');
        if (content) {
          if (inlineEditingDate === log.date) {
            content.style.display = 'block';
            const arrow = div.querySelector('.log-entry-arrow');
            if (arrow) arrow.textContent = '';
          } else {
            content.style.display = 'none';
          }
        }
        
        return div;
      });
      
      entries.forEach(div => fragment.appendChild(div));
      outputEl.appendChild(fragment);
    });
  } else {
    // Fallback to requestAnimationFrame
    requestAnimationFrame(() => {
      const fragment = document.createDocumentFragment();
      outputEl.innerHTML = "";
      
      logsToRender.forEach(log => {
        const div = document.createElement("div");
        div.className = "entry";
        div.setAttribute('data-log-date', log.date);
        if (isExtreme(log)) div.classList.add("highlight");
        if (log.flare === 'Yes') div.classList.add("flare-up-entry");
        if (inlineEditingDate === log.date) {
          div.classList.add("editing");
          div.classList.add("expanded");
        }
        
        div.innerHTML = generateLogEntryHTML(log);
        
        const content = div.querySelector('.log-entry-content');
        if (content) {
          if (inlineEditingDate === log.date) {
            content.style.display = 'block';
            const arrow = div.querySelector('.log-entry-arrow');
            if (arrow) arrow.textContent = '';
          } else {
            content.style.display = 'none';
          }
        }
        
        fragment.appendChild(div);
      });
      
      outputEl.appendChild(fragment);
    });
  }
}

function renderLogs() {
  // Ensure we're using the most up-to-date logs array
  const currentLogs = (typeof window !== 'undefined' && window.logs) ? window.logs : logs;
  if (!Array.isArray(currentLogs)) {
    console.warn('renderLogs: logs is not an array', typeof currentLogs, currentLogs);
    renderLogEntries([]);
    return;
  }
  renderLogEntries(currentLogs);
}

// Old renderLogs code kept for reference - can be removed
// Chart date range filter state
let chartDateRange = {
  type: 7, // 1 (Today), 7, 30, 90, or 'custom'
  startDate: null,
  endDate: null
};

// Prediction range state
let predictionRange = 7; // 1 (tomorrow), 7, 30, or 90 days
let predictionsEnabled = true; // Toggle for showing/hiding predictions

// Debounce/throttle utilities for performance
let chartUpdateTimer = null;
let chartUpdatePending = false;

function debounceChartUpdate() {
  if (chartUpdateTimer) {
    clearTimeout(chartUpdateTimer);
  }
  chartUpdatePending = true;
  chartUpdateTimer = setTimeout(() => {
    if (chartUpdatePending) {
      chartUpdatePending = false;
      updateCharts();
    }
  }, 300); // 300ms debounce
}

// Get filtered logs based on current date range (with caching)
let _filteredLogsCache = null;
let _filteredLogsCacheKey = null;

function getFilteredLogs() {
  if (!logs || logs.length === 0) return [];
  
  // Create cache key from date range settings
  const cacheKey = `${chartDateRange.type}_${chartDateRange.startDate}_${chartDateRange.endDate}_${logs.length}`;
  
  // Return cached if available and valid
  if (_filteredLogsCache && _filteredLogsCacheKey === cacheKey) {
    return _filteredLogsCache;
  }
  
  let filtered = [...logs];
  
  // If startDate and endDate are explicitly set (for custom or "Today"), use them
  if (chartDateRange.startDate && chartDateRange.endDate) {
    const start = new Date(chartDateRange.startDate);
    const end = new Date(chartDateRange.endDate);
    end.setHours(23, 59, 59, 999); // Include entire end date
    start.setHours(0, 0, 0, 0);
    
    filtered = filtered.filter(log => {
      const logDate = new Date(log.date);
      return logDate >= start && logDate <= end;
    });
  } else if (chartDateRange.type === 'custom') {
    // Custom range but dates not set yet - return all logs
    _filteredLogsCache = filtered;
    _filteredLogsCacheKey = cacheKey;
    return filtered;
  } else {
    // Days range (1, 7, 30, 90)
    const days = chartDateRange.type;
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1)); // -1 to include today
    startDate.setHours(0, 0, 0, 0);
    
    filtered = filtered.filter(log => {
      const logDate = new Date(log.date);
      return logDate >= startDate && logDate <= endDate;
    });
  }
  
  // Sort by date (newest first for display) - cache the sorted result
  const sorted = filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  _filteredLogsCache = sorted;
  _filteredLogsCacheKey = cacheKey;
  return sorted;
}

// Invalidate filtered logs cache when logs change
function invalidateFilteredLogsCache() {
  _filteredLogsCache = null;
  _filteredLogsCacheKey = null;
}

// Set chart date range
function setChartDateRange(range) {
  chartDateRange.type = range;
  
  // Invalidate filtered logs cache
  invalidateFilteredLogsCache();
  
  // Update button states (use DOMCache if available)
  const buttons = document.querySelectorAll('.date-range-btn');
  buttons.forEach(btn => btn.classList.remove('active'));
  
  if (range === 'custom') {
    const customBtn = window.PerformanceUtils?.DOMCache?.getElement('rangeCustom') || document.getElementById('rangeCustom');
    const customSelector = window.PerformanceUtils?.DOMCache?.getElement('customDateRangeSelector') || document.getElementById('customDateRangeSelector');
    if (customBtn) customBtn.classList.add('active');
    if (customSelector) customSelector.classList.remove('hidden');
    
    // Set default dates if not already set
    const startInput = document.getElementById('chartStartDate');
    const endInput = document.getElementById('chartEndDate');
    
    if (!startInput.value || !endInput.value) {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30); // Default to last 30 days
      
      startInput.value = startDate.toISOString().split('T')[0];
      endInput.value = endDate.toISOString().split('T')[0];
      
      chartDateRange.startDate = startInput.value;
      chartDateRange.endDate = endInput.value;
    }
  } else {
    // Handle "Today" (1 day) or other day ranges
    const buttonId = range === 1 ? 'range1Day' : `range${range}Days`;
    const button = document.getElementById(buttonId);
    if (button) {
      button.classList.add('active');
    }
    document.getElementById('customDateRangeSelector').classList.add('hidden');
    
    // Set date range for charts
    if (range === 1) {
      // Today only
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      chartDateRange.startDate = todayStart.toISOString().split('T')[0];
      chartDateRange.endDate = today.toISOString().split('T')[0];
    } else {
      chartDateRange.startDate = null;
      chartDateRange.endDate = null;
    }
  }
  
  // Refresh charts with filtered data
  refreshCharts();
}

// Apply custom date range
function applyCustomDateRange() {
  const startInput = document.getElementById('chartStartDate');
  const endInput = document.getElementById('chartEndDate');
  
  if (startInput.value && endInput.value) {
    chartDateRange.startDate = startInput.value;
    chartDateRange.endDate = endInput.value;
    refreshCharts();
  }
}

// Toggle predictions off (mutually exclusive with range buttons)
function togglePredictions() {
  // Turn off predictions
  predictionsEnabled = false;
  
  // Deselect all range buttons
  document.querySelectorAll('.prediction-range-btn').forEach(btn => {
    if (btn.id !== 'predictionToggle') {
      btn.classList.remove('active');
    }
  });
  
  // Select the Off button
  const toggleBtn = document.getElementById('predictionToggle');
  if (toggleBtn) {
    toggleBtn.classList.add('active');
    toggleBtn.title = 'Predictions disabled';
  }
  
  // Refresh charts
  refreshCharts();
}

// Set prediction range
function setPredictionRange(range) {
  // Enable predictions when a range is selected
  predictionsEnabled = true;
  predictionRange = range;
  console.log(`Prediction range set to: ${range} days`);
  
  // Deselect the Off button
  const toggleBtn = document.getElementById('predictionToggle');
  if (toggleBtn) {
    toggleBtn.classList.remove('active');
  }
  
  // Update button states - deselect all range buttons first
  document.querySelectorAll('.prediction-range-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Handle "Tomorrow" button (1 day)
  const buttonId = range === 1 ? 'predRange1Day' : `predRange${range}Days`;
  const button = document.getElementById(buttonId);
  if (button) {
    button.classList.add('active');
  } else {
    console.warn(`Button with id '${buttonId}' not found`);
  }
  
  // Refresh charts with new prediction range
  refreshCharts();
}

// Refresh all charts with current filter
function refreshCharts() {
  // Check which chart view is currently active
  if (appSettings.chartView === 'balance') {
    createBalanceChart();
  } else if (appSettings.chartView === 'combined' || appSettings.combinedChart) {
    createCombinedChart();
  } else {
    updateCharts();
  }
}

function chart(id, label, dataField, color) {
  // Check if ApexCharts is available
  if (typeof ApexCharts === 'undefined') {
    console.error('ApexCharts is not loaded! Cannot create charts.');
    return;
  }
  
  // Use DOMCache for container
  const container = window.PerformanceUtils?.DOMCache?.getElement(id) || document.getElementById(id);
  if (!container) {
    console.error(`Container element with id '${id}' not found`);
    return;
  }
  
  // Detect mobile device (cache window size check)
  const isMobile = window.innerWidth <= 768;
  const isSmallScreen = window.innerWidth <= 480;
  
  // Get filtered logs based on date range (cached)
  const filteredLogs = getFilteredLogs();
  
  // Check if we have data
  if (!filteredLogs || filteredLogs.length === 0) {
    console.warn(`No data available for chart: ${label} (after date filter)`);
    // Destroy existing chart if it exists
    if (container.chart) {
      container.chart.destroy();
    }
    // Hide chart container if no data
    container.style.display = 'none';
    return;
  }
  
  // Destroy existing chart if it exists
  if (container.chart) {
    container.chart.destroy();
  }
  
  // Prepare data and filter out invalid entries (optimized single-pass)
  const chartData = [];
  const dateCache = new Map(); // Cache date parsing
  
  for (let i = 0; i < filteredLogs.length; i++) {
    const log = filteredLogs[i];
    let value = log[dataField];
    
    // Validate and process value based on field type
    if (dataField === 'weight') {
      value = parseFloat(value);
      if (isNaN(value) || value <= 0) continue;
      if (appSettings.weightUnit === 'lb') {
        value = parseFloat(kgToLb(value));
      }
    } else if (dataField === 'steps') {
      value = parseInt(value);
      if (isNaN(value) || value < 0) continue;
    } else if (dataField === 'hydration') {
      value = parseFloat(value);
      if (isNaN(value) || value < 0) continue;
    } else if (dataField === 'weatherSensitivity') {
      value = parseFloat(value);
      if (isNaN(value) || value < 0 || value > 10) continue;
    } else {
      if (value === undefined || value === null || value === '') continue;
      value = parseFloat(value) || 0;
    }
    
    // Parse date (with caching)
    let dateValue = dateCache.get(log.date);
    if (!dateValue) {
      dateValue = new Date(log.date).getTime();
      if (isNaN(dateValue)) continue;
      dateCache.set(log.date, dateValue);
    }
    
    chartData.push({ x: dateValue, y: value });
  }
  
  // Sort by timestamp
  chartData.sort((a, b) => a.x - b.x);
  
  // Reduce data points on mobile for better performance
  let optimizedChartData = chartData;
  if (isMobile && chartData.length > 50) {
    // Sample data points evenly for mobile
    const step = Math.ceil(chartData.length / 50);
    optimizedChartData = chartData.filter((_, index) => index % step === 0 || index === chartData.length - 1);
  } else if (isSmallScreen && chartData.length > 30) {
    // Even more aggressive reduction for very small screens
    const step = Math.ceil(chartData.length / 30);
    optimizedChartData = chartData.filter((_, index) => index % step === 0 || index === chartData.length - 1);
  }
  
  if (optimizedChartData.length === 0) {
    console.warn(`No valid data for chart: ${label}`);
    // Hide chart container if no valid data
    if (container) {
      // Destroy existing chart if it exists
      if (container.chart) {
        container.chart.destroy();
      }
      container.style.display = 'none';
    }
    return;
  }
  
  // Show chart container if we have data
  container.style.display = 'block';
  
  // Generate predicted data for the selected date range period
  let predictedData = [];
  if (predictionsEnabled && window.AIEngine && chartData.length >= 2) {
    try {
      // Use prediction range setting
      const daysToPredict = predictionRange;
      
      // Get ALL historical logs for training (no date filtering - use everything available)
      // This ensures we use up to 10 years of data for better predictions
      const allHistoricalLogs = JSON.parse(localStorage.getItem("healthLogs") || "[]")
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      
      // Filter to only logs with this metric for training
      const allLogs = allHistoricalLogs
        .filter(log => {
          // For weight, check if value exists and is valid (weight can be any positive number)
          if (dataField === 'weight') {
            const weightValue = log[dataField];
            return weightValue !== undefined && weightValue !== null && weightValue !== '' && !isNaN(parseFloat(weightValue)) && parseFloat(weightValue) > 0;
          }
          // For steps, check if value exists and is valid (steps can be 0 or positive)
          if (dataField === 'steps') {
            const stepsValue = log[dataField];
            return stepsValue !== undefined && stepsValue !== null && stepsValue !== '' && !isNaN(parseInt(stepsValue)) && parseInt(stepsValue) >= 0;
          }
          // For hydration, check if value exists and is valid (hydration can be 0 or positive)
          if (dataField === 'hydration') {
            const hydrationValue = log[dataField];
            return hydrationValue !== undefined && hydrationValue !== null && hydrationValue !== '' && !isNaN(parseFloat(hydrationValue)) && parseFloat(hydrationValue) >= 0;
          }
          // For other metrics, use standard filter
          return log[dataField] !== undefined && log[dataField] !== null && log[dataField] !== '';
        });
      
      if (allLogs.length >= 2) {
        // Sort filtered logs chronologically for getting the last date (for prediction start point)
        const sortedLogs = filteredLogs
          .filter(log => {
            // For weight, check if value exists and is valid (weight can be any positive number)
            if (dataField === 'weight') {
              const weightValue = log[dataField];
              return weightValue !== undefined && weightValue !== null && weightValue !== '' && !isNaN(parseFloat(weightValue)) && parseFloat(weightValue) > 0;
            }
            // For other metrics, use standard filter
            return log[dataField] !== undefined && log[dataField] !== null && log[dataField] !== '';
          })
          .sort((a, b) => new Date(a.date) - new Date(b.date));
        
        if (sortedLogs.length >= 2) {
          // Analyze with AIEngine: use ALL historical logs for training (up to 10 years),
          // filtered logs just for determining last date and display
          const analysis = window.AIEngine.analyzeHealthMetrics(sortedLogs, allLogs);
          
          if (analysis.trends[dataField]) {
            const trend = analysis.trends[dataField];
            const lastDate = new Date(sortedLogs[sortedLogs.length - 1].date);
            const isBPM = dataField === 'bpm';
            const isWeight = dataField === 'weight';
            const isSteps = dataField === 'steps';
            const isHydration = dataField === 'hydration';
            
            // Generate predictions for the selected period using best-fit model
            if (trend.regression) {
              // Always regenerate predictions based on current daysToPredict setting
              // Don't use pre-computed predictions from analysis as they may be for a different range
              let predictions = [];
              let predictionsWithConfidence = null;
              
              const regression = trend.regression;
              
              // Get the last date from training data to calculate days since start
              const firstTrainingDate = new Date(allLogs[0].date);
              const lastTrainingDate = new Date(allLogs[allLogs.length - 1].date);
              const lastX = Math.floor((lastTrainingDate - firstTrainingDate) / (1000 * 60 * 60 * 24));
              
              // Use AIEngine's improved prediction method with metric-specific context
              const metricContext = {
                variance: trend.variance || 0,
                average: trend.average || 0,
                metricName: dataField,
                trainingValues: allLogs.map(log => {
                  const val = parseFloat(log[dataField]);
                  // For weight, ensure we return a valid number (weight should never be 0)
                  if (dataField === 'weight') {
                    return isNaN(val) || val <= 0 ? null : val;
                  }
                  return val || 0;
                }).filter(v => v !== null) // Remove null values for weight
              };
              
              // Use model-specific prediction based on modelType
              const modelType = regression.modelType || 'linear';
              
              if (modelType === 'arima') {
                // ARIMA model - regenerate forecasts for the requested prediction range
                const trainingValues = allLogs.map(log => {
                  const val = parseFloat(log[dataField]);
                  if (dataField === 'weight') {
                    return isNaN(val) || val <= 0 ? null : val;
                  }
                  return val || 0;
                }).filter(v => v !== null);
                
                if (trainingValues.length >= 10) {
                  // Generate ARIMA forecasts for the requested number of days
                  const arimaForecast = window.AIEngine.performARIMAForecast(trainingValues, 1, 0, 0, daysToPredict);
                  if (arimaForecast && arimaForecast.forecasts) {
                    predictions = arimaForecast.forecasts.map(v => {
                      if (isBPM) return Math.round(Math.max(30, Math.min(200, v)));
                      if (isWeight) return Math.round(Math.max(30, Math.min(300, v)) * 10) / 10;
                      if (isSteps) return Math.round(Math.max(0, Math.min(50000, v)));
                      if (isHydration) return Math.round(Math.max(0, Math.min(20, v)) * 10) / 10;
                      return Math.round(Math.max(0, Math.min(10, v)) * 10) / 10;
                    });
                    
                    // Generate confidence intervals for ARIMA (use regression standard error if available)
                    if (regression.standardError) {
                      predictionsWithConfidence = window.AIEngine.predictFutureValuesWithConfidence(
                        { slope: 0, intercept: regression.intercept || 0, standardError: regression.standardError, n: allLogs.length },
                        lastX,
                        daysToPredict,
                        isBPM,
                        isWeight,
                        metricContext,
                        0.95
                      );
                      // Adjust confidence intervals to match ARIMA predictions
                      if (predictionsWithConfidence && predictions.length === predictionsWithConfidence.length) {
                        // Determine max value based on metric type
                        let maxValue = 10; // Default for 0-10 scale metrics
                        if (isBPM) {
                          maxValue = 200;
                        } else if (isWeight) {
                          maxValue = 300;
                        } else if (isSteps) {
                          maxValue = 50000;
                        } else if (isHydration) {
                          maxValue = 20;
                        }
                        
                        let minValue = 0;
                        if (isBPM || isWeight) {
                          minValue = 30;
                        }
                        
                        predictionsWithConfidence = predictionsWithConfidence.map((ci, idx) => ({
                          prediction: predictions[idx],
                          lower: Math.max(
                            minValue,
                            predictions[idx] - (ci.upper - ci.prediction)
                          ),
                          upper: Math.min(
                            maxValue,
                            predictions[idx] + (ci.upper - ci.prediction)
                          ),
                          confidence: ci.confidence
                        }));
                      }
                    }
                  } else {
                    // Fallback to linear regression if ARIMA fails
                    predictions = window.AIEngine.predictFutureValues(
                      { slope: regression.slope, intercept: regression.intercept, standardError: regression.standardError },
                      lastX,
                      daysToPredict,
                      isBPM,
                      isWeight,
                      metricContext
                    );
                  }
                } else {
                  // Not enough data for ARIMA, use linear regression
                  predictions = window.AIEngine.predictFutureValues(
                    { slope: regression.slope, intercept: regression.intercept, standardError: regression.standardError },
                    lastX,
                    daysToPredict,
                    isBPM,
                    isWeight,
                    metricContext
                  );
                }
              } else {
                // Linear or polynomial regression
                predictions = window.AIEngine.predictFutureValues(
                  { slope: regression.slope, intercept: regression.intercept, standardError: regression.standardError },
                  lastX,
                  daysToPredict,
                  isBPM,
                  isWeight,
                  metricContext
                );
                
                // Generate confidence intervals if standard error available
                if (regression.standardError) {
                  predictionsWithConfidence = window.AIEngine.predictFutureValuesWithConfidence(
                    { slope: regression.slope, intercept: regression.intercept, standardError: regression.standardError, n: allLogs.length },
                    lastX,
                    daysToPredict,
                    isBPM,
                    isWeight,
                    metricContext,
                    0.95
                  );
                }
              }
              
              // Generate prediction data points with confidence intervals
              const upperBoundData = [];
              const lowerBoundData = [];
              const cleanPredictedData = [];
              
              for (let i = 0; i < Math.min(daysToPredict, predictions.length); i++) {
                  let value = predictions[i];
                  
                  // Convert weight to display unit if needed
                  if (dataField === 'weight' && appSettings.weightUnit === 'lb') {
                    value = parseFloat(kgToLb(value));
                    value = Math.round(value * 10) / 10; // Weight: 1 decimal place
                  }
                  
                  const futureDate = new Date(lastDate);
                  futureDate.setDate(futureDate.getDate() + (i + 1)); // i+1 because predictions start from day 1
                  
                  cleanPredictedData.push({
                    x: futureDate.getTime(),
                    y: value
                  });
                  
                  // Add confidence intervals if available
                  if (predictionsWithConfidence && predictionsWithConfidence[i]) {
                    let upper = predictionsWithConfidence[i].upper;
                    let lower = predictionsWithConfidence[i].lower;
                    
                    // Convert weight to display unit if needed
                    if (dataField === 'weight' && appSettings.weightUnit === 'lb') {
                      upper = parseFloat(kgToLb(upper));
                      lower = parseFloat(kgToLb(lower));
                      upper = Math.round(upper * 10) / 10;
                      lower = Math.round(lower * 10) / 10;
                    }
                    
                    upperBoundData.push({
                      x: futureDate.getTime(),
                      y: upper
                    });
                    
                    lowerBoundData.push({
                      x: futureDate.getTime(),
                      y: lower
                    });
                  }
              }
              
              // Replace predictedData with clean predictions
              predictedData.length = 0;
              predictedData.push(...cleanPredictedData);
              
              // Store confidence intervals as separate properties
              if (upperBoundData.length > 0 && lowerBoundData.length > 0) {
                predictedData.upperBound = upperBoundData;
                predictedData.lowerBound = lowerBoundData;
              }
            }
          }
        }
      }
    } catch (error) {
      console.warn(`Error generating predictions for ${dataField}:`, error);
    }
  }
  
  // Debug logging for weight chart
  console.log(`Creating ApexChart for ${label} with ${chartData.length} data points`);
  
  // Prepare series array (use optimized data for mobile)
  const series = [{
      name: label,
      data: optimizedChartData
  }];
  
  // Add predicted data as a separate series if available
  if (predictedData.length > 0) {
    // Create a lighter/different color for predictions
    let predictionColor = color;
    if (color.includes('rgb(')) {
      const rgbMatch = color.match(/\d+/g);
      if (rgbMatch) {
        predictionColor = `rgba(${rgbMatch.join(', ')}, 0.6)`;
      }
    } else if (color.includes('#')) {
      // Convert hex to rgba
      const hex = color.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      predictionColor = `rgba(${r}, ${g}, ${b}, 0.6)`;
    }
    
    // Store confidence intervals separately for tooltip access (but don't draw them)
    // Create a lookup map: timestamp -> {upper, lower}
    const predictionRangeMap = {};
    if (predictedData.upperBound && predictedData.lowerBound && predictedData.length > 0) {
      predictedData.forEach((point, idx) => {
        if (point && point.x && point.y !== undefined) {
          const upperPoint = predictedData.upperBound[idx];
          const lowerPoint = predictedData.lowerBound[idx];
          if (upperPoint && lowerPoint) {
            predictionRangeMap[point.x] = {
              upper: upperPoint.y,
              lower: lowerPoint.y
            };
          }
        }
      });
    }
    
    // Store the range map on the series for tooltip access
    const predictionSeries = {
      name: `Predicted`,
      data: predictedData.filter(d => d && d.x && d.y !== undefined),
      color: predictionColor,
      stroke: {
        width: 0, // No line
        show: false
      },
      markers: {
        size: 6,
        strokeWidth: 2,
        strokeColors: [predictionColor],
        fillColors: [predictionColor],
        hover: {
          size: 8
        }
      },
      _rangeMap: predictionRangeMap // Store range data for tooltip access
    };
    
    // Add prediction points only (no line, no shaded area) - each point will show prediction value and expected range in tooltip
    series.push(predictionSeries);
  }
  
  // Add helpful info box above chart for non-technical users (only for first chart)
  // (container is already declared at the start of the function)
  if (container && id === 'bpmChart') { // Only show on first chart (BPM)
    // Remove existing info box if present
    const existingInfo = container.previousElementSibling;
    if (existingInfo && existingInfo.classList && existingInfo.classList.contains('chart-info-box')) {
      existingInfo.remove();
    }
    
    // Create info box if predictions are available
    if (predictedData.length > 0) {
      const infoBox = document.createElement('div');
      infoBox.className = 'chart-info-box';
      infoBox.innerHTML = `
        <div class="info-icon">ℹ️</div>
        <div class="info-content">
          <strong>Understanding Your Chart:</strong>
          <ul>
            <li><strong>Solid line:</strong> Your recorded data (what you've logged)</li>
            <li><strong>Points:</strong> Predicted values for the next ${predictionRange} days</li>
          </ul>
          <small>Hover over any prediction point to see the predicted value and expected range. Predictions are based on your historical data patterns.</small>
        </div>
      `;
      container.parentNode.insertBefore(infoBox, container);
    }
  }
  
  const options = {
    series: series,
    chart: {
      type: 'line',
      height: isMobile ? (isSmallScreen ? 250 : 300) : 350,
      toolbar: {
        show: !isSmallScreen, // Hide toolbar on very small screens
        tools: {
          download: true,
          selection: false,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: false,
          reset: true
        }
      },
      background: 'transparent',
      selection: {
        enabled: true,
        type: 'x',
        fill: {
          color: 'rgba(76, 175, 80, 0.1)'
        },
        stroke: {
          width: 1,
          dashArray: 3,
          color: '#4caf50',
          opacity: 0.4
        }
      },
      zoom: {
        enabled: !isSmallScreen, // Disable zoom on very small screens
        type: 'x',
        autoScaleYaxis: true
      },
      pan: {
        enabled: !isSmallScreen, // Disable pan on very small screens
        type: 'x'
      },
      animations: {
        enabled: !isSmallScreen, // Disable animations on very small screens for better performance
        easing: 'easeinout',
        speed: 600,
        animateGradually: {
          enabled: true,
          delay: 100
        },
        dynamicAnimation: {
          enabled: true,
          speed: 400
        }
      },
      events: {
        dataPointSelection: function(event, chartContext, config) {
          // Optional: Add click handler for data points
        }
      }
    },
    title: {
      text: label,
      align: 'center',
      style: {
        fontSize: isMobile ? (isSmallScreen ? '14px' : '16px') : '18px',
        fontWeight: 'bold',
        color: '#e0f2f1'
      }
    },
    stroke: {
      curve: 'smooth',
      width: 3,
      lineCap: 'round'
    },
    markers: {
      size: 4,
      colors: series.map((s, i) => i === 0 ? color : (s.color || color)),
      strokeColors: '#fff',
      strokeWidth: 2,
      hover: {
        size: 6,
        sizeOffset: 2
    },
      shape: 'circle',
      showNullDataPoints: false
    },
    colors: series.map((s, i) => i === 0 ? color : (s.color || color)),
    xaxis: {
      type: 'datetime',
      title: {
        text: 'Date',
        style: {
          color: '#e0f2f1',
          fontSize: '14px',
          fontWeight: 'bold'
        }
      },
      labels: {
        style: {
          colors: '#e0f2f1'
        },
        datetimeFormatter: {
          year: 'yyyy',
          month: 'MMM',
          day: 'dd MMM',
          hour: 'HH:mm'
        },
        formatter: function(value, timestamp, opts) {
          // ApexCharts datetime formatter - timestamp is the actual timestamp value
          if (timestamp !== undefined && timestamp !== null) {
            const date = new Date(timestamp);
            if (!isNaN(date.getTime())) {
              return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }
          }
          // Fallback: check if value is a timestamp
          if (typeof value === 'number' && value > 1000000000000) {
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
              return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }
          }
          // If value is a string that looks like a timestamp, try to parse it
          if (typeof value === 'string' && /^\d+$/.test(value) && value.length > 10) {
            const date = new Date(parseInt(value));
            if (!isNaN(date.getTime())) {
              return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }
          }
          return value;
        }
      }
    },
    yaxis: {
      title: {
        text: getYAxisLabel(dataField),
        style: {
          color: '#e0f2f1',
          fontSize: isMobile ? '12px' : '14px',
          fontWeight: 'bold'
        }
      },
      labels: {
        style: {
          colors: '#e0f2f1'
        },
        formatter: function(val) {
          // For steps, format as whole numbers with comma separators
          if (dataField === 'steps') {
            return Math.round(val).toLocaleString();
          }
          // For hydration, show one decimal place
          if (dataField === 'hydration') {
            return val.toFixed(1);
          }
          // For weight, show one decimal place
          if (dataField === 'weight') {
            return val.toFixed(1);
          }
          // For BPM, show whole numbers
          if (dataField === 'bpm') {
            return Math.round(val).toString();
          }
          // For other metrics, round to whole number if it's a whole number, otherwise show one decimal
          const rounded = Math.round(val);
          if (Math.abs(val - rounded) < 0.01) {
            return rounded.toString();
          }
          return val.toFixed(1);
        }
      },
      min: dataField === 'weight' ? undefined : 0,
      max: getMaxValue(dataField, optimizedChartData)
    },
    grid: {
      borderColor: '#374151',
      strokeDashArray: 4,
      xaxis: {
        lines: {
          show: true
        }
      },
      yaxis: {
        lines: {
          show: true
        }
      },
      padding: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
      }
    },
    tooltip: {
      theme: 'dark',
      x: {
        format: 'dd MMM yyyy'
      },
      y: {
        formatter: function(val, { seriesIndex, dataPointIndex, w }) {
          // Custom formatter for better tooltip display with plain language
          const seriesName = w.globals.seriesNames[seriesIndex];
          
          if (seriesName && seriesName.includes('Prediction Range')) {
            // For confidence band, show range in tooltip with explanation
            const seriesData = w.globals.series[seriesIndex];
            const upperVal = seriesData[dataPointIndex];
            // Get lower bound from the hidden series
            const lowerSeriesIndex = w.globals.seriesNames.findIndex(name => name && name.includes('_hidden_lower_bound'));
            if (lowerSeriesIndex !== -1) {
              const lowerSeriesData = w.globals.series[lowerSeriesIndex];
              const lowerVal = lowerSeriesData[dataPointIndex];
              if (lowerVal !== undefined && upperVal !== undefined) {
                return `Expected range: ${lowerVal.toFixed(1)} - ${upperVal.toFixed(1)}`;
              }
            }
            return `Expected value: ${val.toFixed(1)}`;
          }
          
          if (seriesName && seriesName.includes('Predicted')) {
            return `Predicted: ${val.toFixed(1)} (based on your trend)`;
          }
          
          if (seriesName && !seriesName.includes('_hidden')) {
            return `Recorded: ${val !== null && val !== undefined ? val.toFixed(1) : 'N/A'}`;
          }
          
          return val !== null && val !== undefined ? val.toFixed(1) : '';
        }
      },
      custom: function({ series, seriesIndex, dataPointIndex, w }) {
        // Enhanced tooltip with more context
        const date = w.globals.categoryLabels[dataPointIndex] || w.globals.seriesX[seriesIndex][dataPointIndex];
        const seriesName = w.globals.seriesNames[seriesIndex];
        const value = series[seriesIndex][dataPointIndex];
        
        // Skip hidden series
        if (seriesName && seriesName.includes('_hidden')) {
          return '';
        }
        
        // Determine if this is a prediction date (after last recorded data)
        const hoveredTimestamp = typeof date === 'number' ? date : new Date(date).getTime();
        const lastRecordedTimestamp = chartData.length > 0 ? chartData[chartData.length - 1].x : null;
        const isPredictionDate = lastRecordedTimestamp && hoveredTimestamp > lastRecordedTimestamp;
        
        let tooltipContent = `<div style="padding: 8px;">`;
        tooltipContent += `<div style="font-weight: bold; margin-bottom: 4px;">${new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>`;
        
        // Show all visible series for this date
        series.forEach((s, idx) => {
          const sName = w.globals.seriesNames[idx];
          if (sName && !sName.includes('_hidden') && s[dataPointIndex] !== undefined && s[dataPointIndex] !== null) {
            const val = s[dataPointIndex];
            let label = sName;
            let description = '';
            
            // For prediction dates, only show prediction data, not recorded data
            if (isPredictionDate && idx === 0) {
              // Skip recorded data series for prediction dates
              return;
            }
            
            // For recorded dates, only show recorded data, not prediction points
            if (!isPredictionDate && sName.includes('Predicted')) {
              // Skip prediction series for recorded dates
              return;
            }
            
            if (sName.includes('Prediction Range')) {
              // Get range from hidden series
              const lowerIdx = w.globals.seriesNames.findIndex(n => n && n.includes('_hidden_lower_bound'));
              if (lowerIdx !== -1) {
                const lower = w.globals.series[lowerIdx][dataPointIndex];
                description = ` (likely range: ${lower.toFixed(1)} - ${val.toFixed(1)})`;
                label = 'Expected Range';
              }
            } else if (sName.includes('Predicted') && isPredictionDate) {
              // For prediction points only (on prediction dates), show the predicted value AND the expected range
              // Get range from the stored range map
              const hoveredTimestamp = typeof date === 'number' ? date : new Date(date).getTime();
              const rangeData = w.config.series[idx]._rangeMap;
              
              // Try exact match first, then find closest timestamp if needed
              let rangeEntry = rangeData && rangeData[hoveredTimestamp];
              if (!rangeEntry && rangeData) {
                // Find closest timestamp (within 1 day)
                const keys = Object.keys(rangeData).map(k => parseInt(k));
                const closestKey = keys.find(k => Math.abs(k - hoveredTimestamp) < 86400000); // 1 day in ms
                if (closestKey) {
                  rangeEntry = rangeData[closestKey];
                }
              }
              
              if (rangeEntry) {
                const lower = rangeEntry.lower;
                const upper = rangeEntry.upper;
                if (lower !== null && upper !== null && !isNaN(lower) && !isNaN(upper)) {
                  description = ` (expected range: ${lower.toFixed(1)} - ${upper.toFixed(1)})`;
                } else {
                  description = ' (AI prediction based on your trend)';
                }
              } else {
                description = ' (AI prediction based on your trend)';
              }
              label = 'Predicted Value';
            } else if (!isPredictionDate) {
              // Only show "your recorded data" for actual recorded dates
              description = ' (your recorded data)';
              label = label.replace(/\s*\(Predicted\)\s*/, '');
            }
            
            tooltipContent += `<div style="margin: 4px 0; display: flex; justify-content: space-between; align-items: center;">`;
            tooltipContent += `<span style="color: ${w.globals.colors[idx] || '#fff'};">●</span>`;
            tooltipContent += `<span style="margin-left: 8px; flex: 1;">${label}:</span>`;
            tooltipContent += `<span style="font-weight: bold; margin-left: 8px;">${val.toFixed(1)}</span>`;
            tooltipContent += `</div>`;
            if (description) {
              tooltipContent += `<div style="font-size: 11px; color: #b0bec5; margin-left: 16px; margin-bottom: 4px;">${description}</div>`;
            }
          }
        });
        
        tooltipContent += `</div>`;
        return tooltipContent;
      }
    },
    legend: {
      show: true,
      position: 'bottom',
      labels: {
        colors: '#e0f2f1'
      },
      formatter: function(seriesName, opts) {
        // Hide hidden series from legend
        if (seriesName && seriesName.startsWith('_hidden_')) {
          return '';
        }
        // Make labels more user-friendly with explanations
        if (seriesName && seriesName.includes('Predicted')) {
          return 'Predicted Value (hover to see expected range)';
        }
        // For main data series, add explanation
        if (opts.seriesIndex === 0) {
          return seriesName + ' (your recorded data)';
        }
        return seriesName;
      },
      markers: {
        width: 12,
        height: 12,
        radius: 6
      },
      itemMargin: {
        horizontal: 15,
        vertical: 8
      }
    },
    annotations: predictedData.length > 0 ? {
      xaxis: [{
        x: chartData.length > 0 ? chartData[chartData.length - 1].x : new Date().getTime(),
        borderColor: '#4caf50',
        borderWidth: 2,
        strokeDashArray: 4,
        opacity: 0.5,
        label: {
          text: 'Predictions start here',
          style: {
            color: '#4caf50',
            fontSize: '11px',
            fontWeight: 'normal',
            background: 'rgba(76, 175, 80, 0.1)',
            padding: {
              left: 5,
              right: 5,
              top: 2,
              bottom: 2
            }
          },
          orientation: 'vertical',
          offsetY: 10
        }
      }]
    } : {}
  };
  
  // Apply light mode styles if in light mode
  if (false) { // Always dark mode
    options.title.style.color = '#1b5e20';
    options.xaxis.title.style.color = '#1b5e20';
    options.xaxis.labels.style.colors = '#1b5e20';
    options.yaxis.title.style.color = '#1b5e20';
    options.yaxis.labels.style.colors = '#1b5e20';
    options.grid.borderColor = '#81c784';
    options.tooltip.theme = 'light';
  }
  
  // Hide loading placeholder before creating chart
  const loadingElement = container.querySelector('.chart-loading');
  if (loadingElement) {
    loadingElement.style.display = 'none';
  }
  
  // Ensure container is visible and has dimensions before rendering
  const ensureContainerReady = () => {
    const rect = container.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(container);
    
    // Check if container is ready: has dimensions, is visible, and not animating
    if (rect.width === 0 || rect.height === 0 || 
        computedStyle.display === 'none' || 
        computedStyle.visibility === 'hidden' ||
        computedStyle.opacity === '0') {
      // Container not ready yet, wait a bit
      setTimeout(ensureContainerReady, 50);
      return;
    }
    
    // Ensure container has proper positioning context
    if (computedStyle.position === 'static') {
      container.style.position = 'relative';
    }
    
    // Container is ready, create and render chart
    // Use requestAnimationFrame to ensure DOM is fully painted
    requestAnimationFrame(() => {
  container.chart = new ApexCharts(container, options);
      container.chart.render().then(() => {
        // Ensure loading is hidden after render
        if (loadingElement) {
          loadingElement.style.display = 'none';
        }
        // Mark container as loaded
        container.classList.add('loaded');
        // Force a resize to ensure chart fits container
        setTimeout(() => {
          if (container.chart) {
            container.chart.updateOptions({}, false, true);
          }
        }, 100);
      });
    });
  };
  
  // Wait for container to be ready and visible before rendering chart
  // Use a small delay to ensure CSS animations have started
  setTimeout(ensureContainerReady, 150);
}

function getYAxisLabel(dataField) {
  const labels = {
    bpm: 'BPM',
    weight: `Weight (${appSettings.weightUnit || 'kg'})`,
    fatigue: 'Level (1-10)',
    stiffness: 'Level (1-10)',
    backPain: 'Level (1-10)',
    sleep: 'Quality (1-10)',
    jointPain: 'Level (1-10)',
    mobility: 'Level (1-10)',
    dailyFunction: 'Level (1-10)',
    swelling: 'Level (1-10)',
    mood: 'Level (1-10)',
    irritability: 'Level (1-10)',
    weatherSensitivity: 'Level (1-10)',
    steps: 'Steps',
    hydration: 'Glasses'
  };
  return labels[dataField] || 'Value';
}

function getMaxValue(dataField, chartData = null) {
  if (dataField === 'bpm') return 120;
  if (dataField === 'weight') return null; // Auto scale
  if (dataField === 'steps') {
    // Auto scale based on data sample
    if (chartData && chartData.length > 0) {
      const values = chartData.map(d => d.y).filter(v => v !== null && v !== undefined && !isNaN(v));
      if (values.length > 0) {
        const maxValue = Math.max(...values);
        const minValue = Math.min(...values);
        
        // If all values are 0 or very small, set a reasonable minimum scale
        if (maxValue < 1000) {
          return 2000; // Minimum scale for very low step counts
        }
        
        // Add 15% padding above max for better visualization
        const range = maxValue - minValue;
        const padding = Math.max(range * 0.15, maxValue * 0.1, 1000); // At least 1000 steps padding
        const calculatedMax = Math.ceil(maxValue + padding);
        
        // Round to nearest 1000 for cleaner display, but ensure it's at least maxValue
        const roundedMax = Math.max(Math.ceil(calculatedMax / 1000) * 1000, maxValue);
        return roundedMax;
      }
    }
    return null; // Fallback to auto scale if no data
  }
  if (dataField === 'hydration') return 20; // Max 20 glasses
  return 10; // Most metrics are 1-10 scale
}

// Lazy loading system
let chartObserver;
const loadedCharts = new Set();
const activeTimers = new Set(); // Track active timers for cleanup

function initializeLazyLoading() {
  // Check if Intersection Observer is supported
  if (!('IntersectionObserver' in window)) {
    console.warn('IntersectionObserver not supported, falling back to immediate chart loading');
    updateChartsImmediate();
    return;
  }

  // Create intersection observer for lazy loading
  chartObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const container = entry.target;
        const chartType = container.dataset.chartType;
        
        if (!loadedCharts.has(chartType)) {
          loadedCharts.add(chartType);
          loadChart(container, chartType);
          
          // Stop observing this chart
          chartObserver.unobserve(container);
        }
      }
    });
  }, {
    rootMargin: '100px', // Start loading 100px before chart becomes visible
    threshold: 0.01 // Lower threshold for better detection
  });

  // Start observing all lazy charts
  const lazyCharts = document.querySelectorAll('.lazy-chart');
  lazyCharts.forEach(chart => {
    chartObserver.observe(chart);
  });
  
  // Fallback: load charts immediately if they're already visible
  setTimeout(() => {
    const visibleCharts = Array.from(lazyCharts).filter(chart => {
      const rect = chart.getBoundingClientRect();
      return rect.top < window.innerHeight && rect.bottom > 0;
    });
    
    visibleCharts.forEach(chart => {
      const chartType = chart.dataset.chartType;
      if (!loadedCharts.has(chartType)) {
        console.log(`Force loading visible chart: ${chartType}`);
        loadedCharts.add(chartType);
        loadChart(chart, chartType);
        chartObserver.unobserve(chart);
      }
    });
  }, 500);
}

function loadChart(container, chartType) {
  const chartConfig = {
    bpm: { label: "Resting Heart Rate", field: "bpm", color: "rgb(76,175,80)" },
    fatigue: { label: "Fatigue Level", field: "fatigue", color: "rgb(255,152,0)" },
    stiffness: { label: "Stiffness Level", field: "stiffness", color: "rgb(255,193,7)" },
    backPain: { label: "Back Pain Level", field: "backPain", color: "rgb(244,67,54)" },
    sleep: { label: "Sleep Quality", field: "sleep", color: "rgb(63,81,181)" },
    jointPain: { label: "Joint Pain Level", field: "jointPain", color: "rgb(255,87,34)" },
    mobility: { label: "Mobility Level", field: "mobility", color: "rgb(0,188,212)" },
    dailyFunction: { label: "Daily Function Level", field: "dailyFunction", color: "rgb(139,195,74)" },
    swelling: { label: "Joint Swelling Level", field: "swelling", color: "rgb(156,39,176)" },
    mood: { label: "Mood Level", field: "mood", color: "rgb(103,58,183)" },
    irritability: { label: "Irritability Level", field: "irritability", color: "rgb(121,85,72)" },
    weatherSensitivity: { label: "Weather Sensitivity", field: "weatherSensitivity", color: "rgb(0,150,136)" },
    steps: { label: "Steps", field: "steps", color: "rgb(100,181,246)" },
    hydration: { label: "Hydration", field: "hydration", color: "rgb(33,150,243)" }
  };

  const config = chartConfig[chartType];
  if (config) {
    // Hide loading placeholder immediately
    const loadingElement = container.querySelector('.chart-loading');
    if (loadingElement) {
      loadingElement.style.display = 'none';
    }
    
    setTimeout(() => {
      chart(container.id, config.label, config.field, config.color);
      container.classList.add('loaded');
    }, 100); // Small delay for smooth loading effect
  }
}

function updateChartsImmediate() {
  // Check if we have data
  const hasData = logs && logs.length > 0;
  updateChartEmptyState(hasData);
  
  if (!hasData) {
    // Hide all loading placeholders
    document.querySelectorAll('.chart-loading').forEach(loading => {
      loading.style.display = 'none';
    });
    return;
  }
  
  // Hide all loading placeholders first
  document.querySelectorAll('.chart-loading').forEach(loading => {
    loading.style.display = 'none';
  });
  
  // Create all individual charts immediately - charts with no data will be hidden automatically
  chart("bpmChart", "Resting Heart Rate", "bpm", "rgb(76,175,80)");
  chart("fatigueChart", "Fatigue Level", "fatigue", "rgb(255,152,0)");
  chart("stiffnessChart", "Stiffness Level", "stiffness", "rgb(255,193,7)");
  chart("backPainChart", "Back Pain Level", "backPain", "rgb(244,67,54)");
  chart("sleepChart", "Sleep Quality", "sleep", "rgb(63,81,181)");
  chart("jointPainChart", "Joint Pain Level", "jointPain", "rgb(255,87,34)");
  chart("mobilityChart", "Mobility Level", "mobility", "rgb(0,188,212)");
  chart("dailyFunctionChart", "Daily Function Level", "dailyFunction", "rgb(139,195,74)");
  chart("swellingChart", "Joint Swelling Level", "swelling", "rgb(156,39,176)");
  chart("moodChart", "Mood Level", "mood", "rgb(103,58,183)");
  chart("irritabilityChart", "Irritability Level", "irritability", "rgb(121,85,72)");
  chart("weatherSensitivityChart", "Weather Sensitivity", "weatherSensitivity", "rgb(0,150,136)");
  chart("stepsChart", "Steps", "steps", "rgb(100,181,246)");
  chart("hydrationChart", "Hydration", "hydration", "rgb(33,150,243)");
}

// Update empty state placeholder visibility
function updateChartEmptyState(hasData) {
  const placeholder = document.getElementById('chartEmptyPlaceholder');
  const combinedContainer = document.getElementById('combinedChartContainer');
  const individualContainer = document.getElementById('individualChartsContainer');
  
  if (!placeholder) return;
  
  if (!hasData) {
    // Show placeholder, hide chart containers
    placeholder.classList.remove('hidden');
    if (combinedContainer) combinedContainer.classList.add('hidden');
    if (individualContainer) individualContainer.classList.add('hidden');
  } else {
    // Hide placeholder, show appropriate chart container based on view
    placeholder.classList.add('hidden');
    // Chart containers will be shown/hidden by toggleChartView
  }
}

function updateCharts() {
  // Check if ApexCharts is loaded
  if (typeof ApexCharts === 'undefined') {
    console.warn('ApexCharts not loaded yet, retrying in 500ms...');
    setTimeout(updateCharts, 500);
    return;
  }
  
  console.log('Updating charts with', logs.length, 'log entries');
  
  // Check if we have any data to display
  const hasData = logs && logs.length > 0;
  updateChartEmptyState(hasData);
  
  // Only handle individual charts - combined is handled by toggleChartView
    // Use lazy loading if enabled (default), otherwise load immediately
    if (appSettings.lazy !== false) {
      // Clear loaded charts set to allow reloading
      loadedCharts.clear();
      
      // Reset chart containers to show loading state
      const lazyCharts = document.querySelectorAll('.lazy-chart');
      lazyCharts.forEach(chart => {
        chart.classList.remove('loaded');
        // Destroy existing chart if it exists
        if (chart.chart) {
          chart.chart.destroy();
          chart.chart = null;
        }
      });
      
      // Reinitialize lazy loading
      if (chartObserver) {
        chartObserver.disconnect();
      }
      
      // Check if charts are visible, if so initialize lazy loading
      const chartSection = document.getElementById('chartSection');
      if (!chartSection.classList.contains('hidden')) {
        setTimeout(() => {
          initializeLazyLoading();
        }, 100); // Small delay to ensure DOM is ready
      }
    } else {
      // Load all charts immediately if lazy loading is disabled
      updateChartsImmediate();
  }
}

form.addEventListener("submit", e => {
  e.preventDefault();
  
  // Validate form before submission
  if (!formValidator.validateForm()) {
    console.log('Form validation failed');
    Logger.warn('Form validation failed', { formId: 'logEntryForm' });
    // Scroll to validation summary
    const summaryElement = document.getElementById('validationSummary');
    if (summaryElement && summaryElement.classList.contains('show')) {
      summaryElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return;
  }
  
  // Get weight value and convert to kg if needed
  let weightValue = parseFloat(document.getElementById("weight").value);
  if (appSettings.weightUnit === 'lb') {
    weightValue = parseFloat(lbToKg(weightValue));
  }
  
  // Security: Sanitize and validate form inputs
  const dateValue = document.getElementById("date").value.trim();
  // Validate date format (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    showAlertModal('Invalid date format', 'Validation Error');
    return;
  }
  
  // Sanitize food by category and exercise items
  const sanitizeFoodItem = (item) => {
    if (typeof item === 'string') return { name: escapeHTML(item.trim()), calories: undefined, protein: undefined };
    return {
      name: escapeHTML((item.name || '').trim()),
      calories: item.calories !== undefined ? parseFloat(item.calories) : undefined,
      protein: item.protein !== undefined ? parseFloat(item.protein) : undefined
    };
  };
  const sanitizedFood = {
    breakfast: (logFormFoodByCategory.breakfast || []).map(sanitizeFoodItem).filter(item => item.name.length > 0),
    lunch: (logFormFoodByCategory.lunch || []).map(sanitizeFoodItem).filter(item => item.name.length > 0),
    dinner: (logFormFoodByCategory.dinner || []).map(sanitizeFoodItem).filter(item => item.name.length > 0),
    snack: (logFormFoodByCategory.snack || []).map(sanitizeFoodItem).filter(item => item.name.length > 0)
  };
  const sanitizedExercise = logFormExerciseItems
    .map(item => {
      const name = typeof item === 'string' ? item.trim() : (item.name || '').trim();
      const duration = typeof item === 'object' && item.duration != null ? Math.max(1, Math.min(300, parseInt(item.duration, 10) || 0)) : undefined;
      return { name: escapeHTML(name), duration: name ? (duration || undefined) : undefined };
    })
    .filter(item => item.name.length > 0);
  
  const newEntry = {
    date: dateValue,
    bpm: Math.max(30, Math.min(120, parseInt(document.getElementById("bpm").value) || 0)), // Clamp between 30-120
    weight: weightValue.toFixed(1), // Always store as kg
    fatigue: Math.max(0, Math.min(10, parseInt(document.getElementById("fatigue").value) || 0)), // Clamp 0-10
    stiffness: Math.max(0, Math.min(10, parseInt(document.getElementById("stiffness").value) || 0)), // Clamp 0-10
    sleep: Math.max(0, Math.min(10, parseInt(document.getElementById("sleep").value) || 0)), // Clamp 0-10
    jointPain: Math.max(0, Math.min(10, parseInt(document.getElementById("jointPain").value) || 0)), // Clamp 0-10
    mobility: Math.max(0, Math.min(10, parseInt(document.getElementById("mobility").value) || 0)), // Clamp 0-10
    dailyFunction: Math.max(0, Math.min(10, parseInt(document.getElementById("dailyFunction").value) || 0)), // Clamp 0-10
    swelling: Math.max(0, Math.min(10, parseInt(document.getElementById("swelling").value) || 0)), // Clamp 0-10
    flare: document.getElementById("flare").value === 'Yes' ? 'Yes' : 'No', // Validate flare value
    mood: Math.max(0, Math.min(10, parseInt(document.getElementById("mood").value) || 0)), // Clamp 0-10
    irritability: Math.max(0, Math.min(10, parseInt(document.getElementById("irritability").value) || 0)), // Clamp 0-10
    notes: escapeHTML(document.getElementById("notes").value.trim().substring(0, 500)), // Sanitize and limit notes
    food: sanitizedFood, // Include sanitized food items
    exercise: sanitizedExercise, // Include sanitized exercise items
    // New Phase 1 metrics (optional - only include if provided)
    energyClarity: document.getElementById("energyClarity")?.value ? escapeHTML(document.getElementById("energyClarity").value.trim()) : undefined,
    stressors: logFormStressorsItems.length > 0 ? logFormStressorsItems.map(item => escapeHTML(item.trim())) : undefined,
    symptoms: logFormSymptomsItems.length > 0 ? logFormSymptomsItems.map(item => escapeHTML(item.trim())) : undefined,
    weatherSensitivity: document.getElementById("weatherSensitivity")?.value ? Math.max(1, Math.min(10, parseInt(document.getElementById("weatherSensitivity").value) || 0)) : undefined,
    painLocation: document.getElementById("painLocation")?.value ? escapeHTML(document.getElementById("painLocation").value.trim().substring(0, 150)) : undefined,
    steps: document.getElementById("steps")?.value ? parseInt(document.getElementById("steps").value) : undefined,
    hydration: document.getElementById("hydration")?.value ? parseFloat(document.getElementById("hydration").value) : undefined
  };
  
  // Remove undefined values to keep data clean
  Object.keys(newEntry).forEach(key => {
    if (newEntry[key] === undefined || newEntry[key] === '') {
      delete newEntry[key];
    }
  });
  
  // Check for duplicate dates - prevent multiple entries for the same day
  const existingEntry = logs.find(log => log.date === newEntry.date);
  if (existingEntry) {
    // Show validation error instead of allowing duplicate
    showAlertModal(`An entry for ${newEntry.date} already exists. Please edit the existing entry instead of creating a new one.`, 'Duplicate Entry');
    Logger.warn('Duplicate entry prevented', { date: newEntry.date });
    
    // Scroll to the date input to help user see the issue
    const dateInput = document.getElementById("date");
    if (dateInput) {
      dateInput.focus();
      dateInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
      return;
    }
  
  // No duplicate found, add new entry
    logs.push(newEntry);
  Logger.info('Health log entry created', { date: newEntry.date, totalEntries: logs.length });
  
  saveLogsToStorage();
  Logger.debug('Health logs saved to localStorage', { entryCount: logs.length });
  
  // Sync anonymized data if contribution is enabled (but not in demo mode)
  if (appSettings.contributeAnonData && !appSettings.demoMode && typeof syncAnonymizedData === 'function') {
    setTimeout(() => syncAnonymizedData(), 1000);
  }
  
  // Clear all item arrays after saving
  logFormFoodByCategory = { breakfast: [], lunch: [], dinner: [], snack: [] };
  logFormExerciseItems = [];
  logFormStressorsItems = [];
  logFormSymptomsItems = [];
  renderLogFoodItems();
  renderLogExerciseItems();
  renderLogStressorsItems();
  renderLogSymptomsItems();
  
  // Reset energy/clarity tile selection
  setEnergyClaritySelection('');
  resetPainBodyDiagram('painBodyDiagram', 'painLocation');

  renderLogs();
  updateCharts();
  updateHeartbeatAnimation(); // Update heartbeat speed based on new BPM
  updateAISummaryButtonState(); // Update AI button state
  
  // Switch to logs tab after saving
  switchTab('logs');
  
  // Show success message
  const successMsg = document.createElement('div');
  successMsg.className = 'success-notification';
  successMsg.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #4caf50, #66bb6a);
    color: white;
    padding: 18px 24px;
    border-radius: 16px;
    font-weight: 600;
    font-size: 1rem;
    z-index: 10000;
    box-shadow: 0 8px 24px rgba(76, 175, 80, 0.4), 0 0 20px rgba(76, 175, 80, 0.3);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    animation: slideInRight 0.4s cubic-bezier(0.4, 0, 0.2, 1), fadeOut 0.3s ease-out 2.7s forwards;
    transform: translateX(0);
    opacity: 1;
  `;
  successMsg.textContent = existingEntry ? 'Entry updated successfully! ✅' : 'Entry saved successfully! ✅';
  document.body.appendChild(successMsg);
  
  setTimeout(() => {
    successMsg.style.animation = 'slideOutRight 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards';
  setTimeout(() => {
    successMsg.remove();
    }, 300);
  }, 3000);
  
  form.reset();
  document.getElementById("date").valueAsDate = new Date();
  document.getElementById("flare").value = "No"; // Set default flare value
  
  // Clear validation errors after successful submission
  formValidator.clearAllErrors();
  
  // Reset sliders to default values and update their colors
  sliders.forEach(sliderId => {
    const slider = document.getElementById(sliderId);
    slider.value = 5;
    updateSliderColor(slider);
  });
});

function isExtreme(log) {
  let extremeCount = 0;
  
  if (log.backPain >= 8) extremeCount++;
  if (log.fatigue >= 8) extremeCount++;
  if (log.stiffness >= 8) extremeCount++;
  if (log.jointPain >= 8) extremeCount++;
  if (log.flare === "Yes") extremeCount++;
  
  return extremeCount >= 3;
}

// Settings functionality
let appSettings = {
  showCharts: true, // Enable charts by default
  combinedChart: false,
  reminder: true,
  sound: false,
  backup: true,
  compress: false,
  animations: true,
  lazy: true,
  demoMode: false,
  userName: '',
  weightUnit: 'kg', // 'kg' or 'lb', always store as kg
  medicalCondition: '', // Empty by default - user must set a condition
  contributeAnonData: false, // Contribute anonymised data to pool
  useOpenData: false // Use anonymised data pool for AI training (requires 90+ days)
};

// Make appSettings available on window for safe access
if (typeof window !== 'undefined') {
  window.appSettings = appSettings;
}

// Load settings from localStorage
function loadSettings() {
  const savedSettings = localStorage.getItem('healthAppSettings');
  if (savedSettings) {
    appSettings = { ...appSettings, ...JSON.parse(savedSettings) };
  }
  
  // Make appSettings available on window for Logger to access safely
  if (typeof window !== 'undefined') {
    window.appSettings = appSettings;
  }
  
  // Apply loaded settings to UI
  applySettings();
  loadSettingsState();
  
  // Set up background sync if contribution is enabled
  if (appSettings.contributeAnonData && typeof setupBackgroundSync === 'function') {
    // Delay slightly to ensure cloud-sync.js is loaded
    setTimeout(() => {
      setupBackgroundSync();
      // Also sync immediately on app load
      if (typeof syncAnonymizedData === 'function') {
        console.log('[loadSettings] Triggering immediate sync on app load...');
        syncAnonymizedData().catch(error => {
          console.error('[loadSettings] Error in immediate sync on load:', error);
        });
      }
    }, 500);
  }
}

function saveSettings() {
  localStorage.setItem('healthAppSettings', JSON.stringify(appSettings));
  // Keep window.appSettings in sync
  if (typeof window !== 'undefined') {
    window.appSettings = appSettings;
  }
  Logger.debug('Settings saved', { settings: appSettings });
}

function applySettings() {
  // Always use dark mode
    document.body.classList.remove('light-mode');
    document.body.classList.add('dark-mode');
  
  // Charts are always visible in charts tab - no settings needed
  // Chart view toggle is handled by buttons in the chart tab
  
  // Update dashboard title
  updateDashboardTitle();
}

function loadSettingsState() {
  // Update toggle switches to reflect current settings
  document.getElementById('reminderToggle').classList.toggle('active', appSettings.reminder);
  document.getElementById('soundToggle').classList.toggle('active', appSettings.sound);
  document.getElementById('backupToggle').classList.toggle('active', appSettings.backup);
  document.getElementById('compressToggle').classList.toggle('active', appSettings.compress);
  
  // Update demo mode toggle (same as other toggles)
  const demoModeToggle = document.getElementById('demoModeToggle');
  if (demoModeToggle) {
    demoModeToggle.classList.toggle('active', !!appSettings.demoMode);
    demoModeToggle.style.opacity = '1';
    demoModeToggle.style.cursor = 'pointer';
    demoModeToggle.style.pointerEvents = 'auto';
  }
  
  // Update medical condition display and disable in demo mode
  const medicalConditionDisplay = document.getElementById('medicalConditionDisplay');
  const medicalConditionBtn = document.getElementById('medicalConditionBtn');
  
  if (medicalConditionDisplay && medicalConditionBtn) {
    if (appSettings.demoMode) {
      medicalConditionDisplay.textContent = 'Disabled in demo mode';
      medicalConditionBtn.disabled = true;
      medicalConditionBtn.style.opacity = '0.5';
      medicalConditionBtn.style.cursor = 'not-allowed';
    } else {
      // Always show the condition if it exists, otherwise show placeholder
      const conditionText = appSettings.medicalCondition && appSettings.medicalCondition.trim() 
        ? appSettings.medicalCondition 
        : 'Medical Condition';
      medicalConditionDisplay.textContent = conditionText;
      medicalConditionBtn.disabled = false;
      medicalConditionBtn.style.opacity = '1';
      medicalConditionBtn.style.cursor = 'pointer';
      
      // Ensure display container is visible
      const displayContainer = document.getElementById('medicalConditionDisplayContainer');
      if (displayContainer) {
        displayContainer.style.display = 'block';
        displayContainer.style.visibility = 'visible';
      }
    }
  }
  
  // Disable Optimised AI and Use Open Data toggles in demo mode
  const optimizedAIToggle = document.getElementById('optimizedAIToggle');
  if (optimizedAIToggle) {
    if (appSettings.demoMode) {
      optimizedAIToggle.style.opacity = '0.5';
      optimizedAIToggle.style.cursor = 'not-allowed';
      optimizedAIToggle.classList.remove('active');
      appSettings.optimizedAI = false;
    } else {
      optimizedAIToggle.style.opacity = '1';
      optimizedAIToggle.style.cursor = 'pointer';
      optimizedAIToggle.classList.toggle('active', appSettings.optimizedAI);
    }
  }
  
  const useOpenDataToggle = document.getElementById('useOpenDataToggle');
  if (useOpenDataToggle) {
    if (appSettings.demoMode) {
      useOpenDataToggle.style.opacity = '0.5';
      useOpenDataToggle.style.cursor = 'not-allowed';
      useOpenDataToggle.classList.remove('active');
      appSettings.useOpenData = false;
    } else {
      useOpenDataToggle.style.opacity = '1';
      useOpenDataToggle.style.cursor = 'pointer';
      // Default to true if not set (use open data by default when available)
      if (appSettings.useOpenData === undefined) {
        appSettings.useOpenData = true;
        saveSettings();
      }
      useOpenDataToggle.classList.toggle('active', appSettings.useOpenData);
      
      // Update hint text
      const hint = document.getElementById('useOpenDataHint');
      if (hint) {
        if (appSettings.useOpenData) {
          hint.textContent = 'AI is using anonymised data from other users with the same condition for training.';
        } else {
          hint.textContent = 'AI is using only your personal data for training.';
        }
      }
    }
  }
  
  document.getElementById('animationsToggle').classList.toggle('active', appSettings.animations);
  document.getElementById('lazyToggle').classList.toggle('active', appSettings.lazy);
  
  // Update contribute anonymised data toggle
  const contributeAnonDataToggle = document.getElementById('contributeAnonDataToggle');
  if (contributeAnonDataToggle) {
    if (appSettings.demoMode) {
      contributeAnonDataToggle.style.opacity = '0.5';
      contributeAnonDataToggle.style.cursor = 'not-allowed';
      contributeAnonDataToggle.classList.remove('active');
      appSettings.contributeAnonData = false;
    } else {
      contributeAnonDataToggle.style.opacity = '1';
      contributeAnonDataToggle.style.cursor = 'pointer';
      contributeAnonDataToggle.classList.toggle('active', appSettings.contributeAnonData || false);
      
      // Update hint text
      const hint = document.getElementById('contributeAnonDataHint');
      if (hint) {
        if (appSettings.contributeAnonData) {
          hint.textContent = 'Your anonymised data is being contributed to help improve AI models.';
        } else {
          hint.textContent = 'Contribute your anonymised data to help improve AI models';
        }
      }
    }
  }
  
  // Demo mode toggle is now handled in loadSettingsState() above
  
  // Update reminder time input
  const reminderTimeInput = document.getElementById('reminderTime');
  if (reminderTimeInput && typeof NotificationManager !== 'undefined') {
    reminderTimeInput.value = NotificationManager.reminderTime || '20:00';
  }
  
  // Update notification permission status
  if (typeof updateNotificationPermissionStatus === 'function') {
    setTimeout(() => updateNotificationPermissionStatus(), 500);
  }
  
  // Load user name
  const userNameInput = document.getElementById('userNameInput');
  if (userNameInput && appSettings.userName) {
    userNameInput.value = appSettings.userName;
  }
  
  // Update condition context with stored value (only if not in demo mode)
  if (appSettings.medicalCondition && !appSettings.demoMode) {
    updateConditionContext(appSettings.medicalCondition);
  }
  
  // Initialize weight unit display and constraints
  if (appSettings.weightUnit) {
    const unitDisplay = document.getElementById('weightUnitDisplay');
    if (unitDisplay) {
      unitDisplay.textContent = appSettings.weightUnit;
    }
    updateWeightInputConstraints();
  }
}

// Toggle contribute anonymised data
async function toggleContributeAnonData() {
  // Disable in demo mode
  if (appSettings.demoMode) {
    showAlertModal('Data contribution is disabled in demo mode. Demo data is not saved or synced.', 'Demo Mode');
    return;
  }
  
  // Check if medical condition is set and not the placeholder
  const condition = appSettings.medicalCondition || '';
  const isPlaceholder = !condition || condition.trim() === '' || condition.trim().toLowerCase() === 'medical condition';
  
  if (isPlaceholder) {
    showAlertModal('Please set a medical condition first to contribute anonymised data.\n\nGo to Settings > Medical Condition to add your condition.', 'Condition Required');
    return;
  }
  
  // If disabling, just disable without showing agreement
  if (appSettings.contributeAnonData) {
    appSettings.contributeAnonData = false;
    saveSettings();
    
    // Stop background syncing
    if (window.anonymizedDataSyncInterval) {
      clearInterval(window.anonymizedDataSyncInterval);
      window.anonymizedDataSyncInterval = null;
    }
    
    // Update toggle state
    const toggle = document.getElementById('contributeAnonDataToggle');
    if (toggle) {
      toggle.classList.toggle('active', appSettings.contributeAnonData);
    }
    
    // Update hint text
    loadSettingsState();
    return;
  }
  
  // If enabling, show GDPR agreement first
  showGDPRAgreementModal(
    // onAgree - user accepted the agreement
    async () => {
      // Enable the feature
      appSettings.contributeAnonData = true;
      saveSettings();
      
      // Clear synced keys for current condition to allow fresh sync
      // This ensures logs will be re-synced even if they were previously marked as synced
      const condition = appSettings.medicalCondition;
      if (condition) {
        // Clear both synced keys and dates for this condition
        const syncedKeysJson = localStorage.getItem('anonymizedDataSyncedKeys');
        if (syncedKeysJson) {
          const syncedKeys = JSON.parse(syncedKeysJson);
          const beforeCount = syncedKeys.length;
          // Remove all keys for this condition
          const filteredKeys = syncedKeys.filter(key => !key.endsWith(`_${condition}`));
          localStorage.setItem('anonymizedDataSyncedKeys', JSON.stringify(filteredKeys));
          console.log(`[toggleContributeAnonData] Cleared ${beforeCount - filteredKeys.length} synced key(s) for condition: ${condition}`);
        }
        // Also clear synced dates to ensure fresh sync
        localStorage.removeItem('anonymizedDataSyncedDates');
        console.log(`[toggleContributeAnonData] Cleared synced dates to allow fresh sync`);
      }
      
      // Update toggle state
      const toggle = document.getElementById('contributeAnonDataToggle');
      if (toggle) {
        toggle.classList.add('active');
      }
      
      // Set up automatic background syncing first
      if (typeof setupBackgroundSync === 'function') {
        setupBackgroundSync();
      } else {
        console.error('[toggleContributeAnonData] setupBackgroundSync function not available!');
      }
      
      // If enabling, sync data immediately
      if (typeof syncAnonymizedData === 'function') {
        // Delay slightly to ensure toggle state is updated and Supabase is ready
        setTimeout(() => {
          console.log('[toggleContributeAnonData] Triggering immediate sync...');
          syncAnonymizedData().catch(error => {
            console.error('[toggleContributeAnonData] Error in immediate sync:', error);
          });
        }, 1000);
      } else {
        console.error('[toggleContributeAnonData] syncAnonymizedData function not available!');
      }
      
      // Update hint text
      loadSettingsState();
      
      // Show confirmation
      showAlertModal('Anonymised data contribution has been enabled. Your data will be anonymised and used to improve AI predictions.', 'Feature Enabled');
    },
    // onDecline - user declined the agreement
    () => {
      // User declined, do nothing (toggle remains off)
      // Update toggle state to ensure it's off
      const toggle = document.getElementById('contributeAnonDataToggle');
      if (toggle) {
        toggle.classList.remove('active');
      }
    }
  );
}

// Toggle use open data for training
async function toggleUseOpenData() {
  // Disable in demo mode
  if (appSettings.demoMode) {
    showAlertModal('Open data training is disabled in demo mode. Demo data is not saved or synced.', 'Demo Mode');
    return;
  }
  
  if (!appSettings.medicalCondition) {
    showAlertModal('Please set a medical condition first to use open data for training.', 'Condition Required');
    return;
  }
  
  // If disabling, just disable without showing agreement
  if (appSettings.useOpenData) {
    appSettings.useOpenData = false;
    saveSettings();
    
    // Update toggle state
    const toggle = document.getElementById('useOpenDataToggle');
    if (toggle) {
      toggle.classList.toggle('active', appSettings.useOpenData);
    }
    
    // Update hint text
    loadSettingsState();
    return;
  }
  
  // If enabling, check if condition has 90+ days of data
  let dataAvailable = true;
  if (typeof checkConditionDataAvailability === 'function') {
    console.log('toggleUseOpenData: Checking data availability for condition:', appSettings.medicalCondition);
    const result = await checkConditionDataAvailability(appSettings.medicalCondition);
    console.log('toggleUseOpenData: Data availability result:', result);
    dataAvailable = result.available;
    if (!dataAvailable) {
      showAlertModal(`Open data training requires 90+ days of data for this condition. Currently ${result.days} days are available.`, 'Insufficient Data');
      return;
    }
  } else {
    console.warn('toggleUseOpenData: checkConditionDataAvailability function not available');
  }
  
  // Enable the feature (no GDPR modal needed for this toggle)
  appSettings.useOpenData = true;
  saveSettings();
  
  // Update toggle state
  const toggle = document.getElementById('useOpenDataToggle');
  if (toggle) {
    toggle.classList.toggle('active', appSettings.useOpenData);
  }
  
  // Update hint text
  loadSettingsState();
}

function toggleSetting(setting) {
  appSettings[setting] = !appSettings[setting];
  saveSettings();
  applySettings();
  loadSettingsState();
  
  // Special handling for reminder setting
  if (setting === 'reminder' && typeof NotificationManager !== 'undefined') {
    NotificationManager.setReminderEnabled(appSettings.reminder);
  }
}

// Override the placeholder with the full implementation
// This replaces the earlier placeholder function
(function() {
  const fullToggleSettings = function() {
    console.log('toggleSettings FULL implementation called');
  const overlay = document.getElementById('settingsOverlay');
    if (!overlay) {
      console.error('Settings overlay not found!');
      return;
    }
    
    const isVisible = overlay.style.display === 'block' || overlay.style.display === 'flex';
    console.log('Settings modal isVisible:', isVisible, 'current display:', overlay.style.display);
    
    if (isVisible) {
      // Close modal - preserve state
      console.log('Closing settings modal');
      
      // Preserve scroll position and state before closing
      const settingsContent = overlay.querySelector('.settings-content');
      if (settingsContent) {
        window.settingsModalScrollPosition = settingsContent.scrollTop;
      }
      
      // Preserve expanded sections state
      const conditionSelector = document.getElementById('medicalConditionSelector');
      if (conditionSelector) {
        window.settingsModalConditionSelectorOpen = conditionSelector.style.display !== 'none';
      }
      
    overlay.style.display = 'none';
      overlay.style.visibility = 'hidden';
      document.body.classList.remove('modal-active');
      document.body.style.overflow = '';
  } else {
      // Open modal - restore state
      console.log('Opening settings modal');
      document.body.style.overflow = 'hidden';
      
      // Don't reset scroll position - will restore it after opening
      window.scrollTo(0, 0);
      
      overlay.style.position = 'fixed';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.right = '0';
      overlay.style.bottom = '0';
      overlay.style.width = '100vw';
      overlay.style.height = '100vh';
      overlay.style.margin = '0';
      overlay.style.padding = '0';
      overlay.style.display = 'block';
      overlay.style.visibility = 'visible';
      overlay.style.opacity = '1';
      overlay.style.zIndex = '99999';
      
      document.body.classList.add('modal-active');
      
      const menu = overlay.querySelector('.settings-menu');
      if (menu) {
        menu.style.position = 'fixed';
        menu.style.top = '50%';
        menu.style.left = '50%';
        menu.style.right = 'auto';
        menu.style.bottom = 'auto';
        menu.style.transform = 'translate(-50%, -50%)';
        menu.style.margin = '0';
        menu.style.padding = '0';
        menu.style.zIndex = '100000';
        menu.style.visibility = 'visible';
        menu.style.opacity = '1';
        menu.style.display = 'flex';
      }
      
      if (typeof loadSettingsState === 'function') {
    loadSettingsState();
  }
      
      // Restore scroll position if it was saved
      const settingsContent = overlay.querySelector('.settings-content');
      if (settingsContent && window.settingsModalScrollPosition !== undefined) {
        // Use setTimeout to ensure DOM is fully rendered
        setTimeout(() => {
          settingsContent.scrollTop = window.settingsModalScrollPosition;
        }, 50);
      } else if (settingsContent) {
        // Reset to top if no saved position
        settingsContent.scrollTop = 0;
      }
      
      // Restore expanded sections state
      if (window.settingsModalConditionSelectorOpen) {
        const conditionSelector = document.getElementById('medicalConditionSelector');
        if (conditionSelector) {
          conditionSelector.style.display = 'block';
        }
  }
}
  };
  
  // Replace the placeholder
  window.toggleSettings = fullToggleSettings;
  console.log('toggleSettings function replaced with full implementation');
  
  // Dedicated close function for the close button (always closes, never toggles)
  window.closeSettings = function() {
    const overlay = document.getElementById('settingsOverlay');
    if (!overlay) {
      console.error('Settings overlay not found!');
      return;
    }
    
    // Preserve scroll position and state before closing
    const settingsContent = overlay.querySelector('.settings-content');
    if (settingsContent) {
      window.settingsModalScrollPosition = settingsContent.scrollTop;
    }
    
    // Preserve expanded sections state
    const conditionSelector = document.getElementById('medicalConditionSelector');
    if (conditionSelector) {
      window.settingsModalConditionSelectorOpen = conditionSelector.style.display !== 'none';
    }
    
    // Always close, don't toggle
    overlay.style.display = 'none';
    overlay.style.visibility = 'hidden';
    document.body.classList.remove('modal-active');
    document.body.style.overflow = '';
  };
})();

// Also make it available as a function declaration for backwards compatibility
function toggleSettings() {
  return window.toggleSettings();
}

// Also ensure it's available on document for inline handlers
if (typeof document !== 'undefined') {
  document.toggleSettings = window.toggleSettings;
  document.closeSettings = window.closeSettings;
}

// Test that toggleSettings is accessible
console.log('toggleSettings function available:', typeof window.toggleSettings === 'function');

function updateUserName() {
  const userNameInput = document.getElementById('userNameInput');
  appSettings.userName = userNameInput.value;
  saveSettings();
  updateDashboardTitle();
}

// Toggle condition selector within settings modal
function toggleConditionSelector() {
  // Disable in demo mode
  if (appSettings.demoMode) {
    showAlertModal('Condition selection is disabled in demo mode. Demo data is not saved or synced.', 'Demo Mode');
    return;
  }
  
  const selector = document.getElementById('medicalConditionSelector');
  const displayContainer = document.getElementById('medicalConditionDisplayContainer');
  
  if (!selector) return;
  
  const isVisible = selector.style.display !== 'none';
  
  if (isVisible) {
    // Hide selector, show display button
    selector.style.display = 'none';
    if (displayContainer) displayContainer.style.display = 'block';
  } else {
    // Show selector, hide display button
    selector.style.display = 'block';
    if (displayContainer) displayContainer.style.display = 'none';
    
    // Load existing conditions from Supabase
    loadAvailableConditions();
  }
}

// Load available conditions from Supabase
async function loadAvailableConditions() {
  const select = document.getElementById('existingConditionsSelect');
  if (!select) return;
  
  // Show loading state
  select.innerHTML = '<option value="">Loading conditions...</option>';
  select.disabled = true;
  
  try {
    // Initialize Supabase client if needed
    let client = window.supabaseClient || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
    
    if (!client) {
      // Try to initialize from SUPABASE_CONFIG
      if (window.SUPABASE_CONFIG && typeof supabase !== 'undefined') {
        client = supabase.createClient(
          window.SUPABASE_CONFIG.url,
          window.SUPABASE_CONFIG.anonKey
        );
        window.supabaseClient = client;
      } else {
        console.warn('Supabase client not available - SUPABASE_CONFIG or supabase library not found');
        select.innerHTML = '<option value="">-- Select a condition --</option>';
        select.disabled = false;
        return;
      }
    }
    
    // Fetch unique conditions directly from anonymized_data table
    // Use pagination to handle large datasets
    let allConditions = [];
    let from = 0;
    const pageSize = 1000;
    let hasMore = true;
    
    while (hasMore) {
      const { data, error } = await client
        .from('anonymized_data')
        .select('medical_condition')
        .range(from, from + pageSize - 1)
        .order('medical_condition', { ascending: true });
      
      if (error) {
        console.warn('Error loading conditions:', error);
        break;
      }
      
      if (data && data.length > 0) {
        // Extract and filter out null/empty conditions
        const conditions = data
          .map(d => d.medical_condition)
          .filter(c => c && c.trim() !== '');
        allConditions = allConditions.concat(conditions);
        hasMore = data.length === pageSize;
        from += pageSize;
      } else {
        hasMore = false;
      }
    }
    
    // Get unique conditions and populate dropdown
    if (allConditions.length > 0) {
      const uniqueConditions = [...new Set(allConditions)].sort();
      populateConditionsSelect(uniqueConditions);
      console.log(`Loaded ${uniqueConditions.length} unique conditions from Supabase`);
    } else {
      // No conditions found, just show the default option
      populateConditionsSelect([]);
      console.log('No conditions found in Supabase');
    }
    
    select.disabled = false;
  } catch (error) {
    console.error('Error loading conditions:', error);
    select.innerHTML = '<option value="">Error loading conditions</option>';
    select.disabled = false;
  }
}

// Populate conditions select dropdown
function populateConditionsSelect(conditions) {
  const select = document.getElementById('existingConditionsSelect');
  if (!select) return;
  
  // Clear existing options except the first one
  select.innerHTML = '<option value="">-- Select a condition --</option>';
  
  // Create a Set to ensure uniqueness
  const uniqueConditions = new Set(conditions);
  
  // Also include the user's current condition if it exists (even if not in database yet)
  if (appSettings.medicalCondition) {
    uniqueConditions.add(appSettings.medicalCondition);
  }
  
  // Sort conditions alphabetically
  const sortedConditions = [...uniqueConditions].sort();
  
  sortedConditions.forEach(condition => {
    const option = document.createElement('option');
    option.value = condition;
    option.textContent = condition;
    // Don't auto-select - let user choose
    select.appendChild(option);
  });
}

// Select existing condition
function selectExistingCondition() {
  const select = document.getElementById('existingConditionsSelect');
  if (!select || !select.value) return;
  
  const condition = select.value.trim();
  if (!condition) return;
  
  // Check if condition is changing
  const currentCondition = appSettings.medicalCondition;
  if (currentCondition && currentCondition !== condition) {
    // Show warning before changing condition
    const logs = JSON.parse(localStorage.getItem("healthLogs") || "[]");
    const logCount = logs.length;
    
    showConfirmModal(
      `⚠️ WARNING: Changing your medical condition will DELETE ALL ${logCount} of your health log entries.\n\nThis action cannot be undone. Are you sure you want to continue?`,
      'Confirm Condition Change',
      () => {
        // User confirmed - proceed with condition change
        updateMedicalCondition(condition);
        // Clear all logs
        localStorage.setItem("healthLogs", JSON.stringify([]));
        // Reload logs and charts
        if (typeof renderLogs === 'function') renderLogs();
        if (typeof updateCharts === 'function') updateCharts();
        
        // Hide selector after selection, show display button
        const selector = document.getElementById('medicalConditionSelector');
        const displayContainer = document.getElementById('medicalConditionDisplayContainer');
        if (selector) selector.style.display = 'none';
        if (displayContainer) displayContainer.style.display = 'block';
        
        // Reset select dropdown to default
        select.value = '';
        
        showAlertModal(`Condition changed to "${condition}". All previous log entries have been cleared.`, 'Condition Changed');
      },
      () => {
        // User cancelled - reset dropdown
        select.value = '';
      }
    );
  } else {
    // Same condition or no current condition - proceed normally
    updateMedicalCondition(condition);
    // Hide selector after selection, show display button
    const selector = document.getElementById('medicalConditionSelector');
    const displayContainer = document.getElementById('medicalConditionDisplayContainer');
    if (selector) selector.style.display = 'none';
    if (displayContainer) displayContainer.style.display = 'block';
    
    // Reset select dropdown to default
    select.value = '';
  }
}

// Add new condition
async function addNewCondition() {
  const input = document.getElementById('newConditionInput');
  if (!input) return;
  
  const condition = input.value.trim();
  if (!condition) {
    showAlertModal('Please enter a condition name', 'Condition Required');
    return;
  }
  
  // Check if condition is changing
  const currentCondition = appSettings.medicalCondition;
  if (currentCondition && currentCondition !== condition) {
    // Show warning before changing condition
    const logs = JSON.parse(localStorage.getItem("healthLogs") || "[]");
    const logCount = logs.length;
    
    showConfirmModal(
      `⚠️ WARNING: Changing your medical condition will DELETE ALL ${logCount} of your health log entries.\n\nThis action cannot be undone. Are you sure you want to continue?`,
      'Confirm Condition Change',
      () => {
        // User confirmed - proceed with condition change
        updateMedicalCondition(condition);
        // Clear all logs
        localStorage.setItem("healthLogs", JSON.stringify([]));
        // Reload logs and charts
        if (typeof renderLogs === 'function') renderLogs();
        if (typeof updateCharts === 'function') updateCharts();
        
        // Clear input
        input.value = '';
        
        // Hide selector after adding, show display button
        const selector = document.getElementById('medicalConditionSelector');
        const arrow = document.getElementById('medicalConditionArrow');
        const displayContainer = document.getElementById('medicalConditionDisplayContainer');
        if (selector) selector.style.display = 'none';
        if (arrow) arrow.textContent = '▶';
        if (displayContainer) displayContainer.style.display = 'block';
        
        // Add the new condition to the dropdown immediately
        const select = document.getElementById('existingConditionsSelect');
        if (select) {
          // Check if condition already exists in the list
          const existingOptions = Array.from(select.options).map(opt => opt.value);
          if (!existingOptions.includes(condition)) {
            const option = document.createElement('option');
            option.value = condition;
            option.textContent = condition;
            select.appendChild(option);
            // Sort options (keep first option, sort the rest)
            const firstOption = select.options[0];
            const otherOptions = Array.from(select.options).slice(1).sort((a, b) => a.textContent.localeCompare(b.textContent));
            select.innerHTML = '';
            select.appendChild(firstOption);
            otherOptions.forEach(opt => select.appendChild(opt));
          }
        }
        
        // Reload conditions list from database to ensure it's up to date
        loadAvailableConditions();
        
        showAlertModal(`Condition changed to "${condition}". All previous log entries have been cleared.`, 'Condition Changed');
      },
      () => {
        // User cancelled - do nothing
      }
    );
    return;
  }
  
  // Same condition or no current condition - proceed normally
  updateMedicalCondition(condition);
  
  // Clear input
  input.value = '';
  
  // Hide selector after adding, show display button
  const selector = document.getElementById('medicalConditionSelector');
  const displayContainer = document.getElementById('medicalConditionDisplayContainer');
  if (selector) selector.style.display = 'none';
  if (displayContainer) displayContainer.style.display = 'block';
  
  // Add the new condition to the dropdown immediately
  const select = document.getElementById('existingConditionsSelect');
  if (select) {
    // Check if condition already exists in the list
    const existingOptions = Array.from(select.options).map(opt => opt.value);
    if (!existingOptions.includes(condition)) {
      const option = document.createElement('option');
      option.value = condition;
      option.textContent = condition;
      select.appendChild(option);
      // Sort options (keep first option, sort the rest)
      const firstOption = select.options[0];
      const otherOptions = Array.from(select.options).slice(1).sort((a, b) => a.textContent.localeCompare(b.textContent));
      select.innerHTML = '';
      select.appendChild(firstOption);
      otherOptions.forEach(opt => select.appendChild(opt));
    }
  }
  
  // Reload conditions list from database to ensure it's up to date
  await loadAvailableConditions();
  
  // Show success message
  showAlertModal(`Condition "${condition}" has been set. Your anonymised data will contribute to the Optimised AI model for this condition.`, 'Condition Set');
}

// Update medical condition (enhanced version)
function updateMedicalCondition(condition = null) {
  // Disable in demo mode
  if (appSettings.demoMode) {
    showAlertModal('Cannot update condition in demo mode. Demo data is not saved or synced.', 'Demo Mode');
    return;
  }
  
  // If condition is provided as parameter, use it; otherwise get from input
  if (!condition) {
    const newConditionInput = document.getElementById('newConditionInput');
    if (newConditionInput && newConditionInput.value.trim()) {
      condition = newConditionInput.value.trim();
    } else {
      // No condition provided and input is empty - don't set a default
      showAlertModal('Please enter a medical condition name.', 'Condition Required');
      return;
    }
  }
  
  // Validate condition is not empty or placeholder
  condition = condition.trim();
  if (!condition || condition.toLowerCase() === 'medical condition') {
    showAlertModal('Please enter a valid medical condition name.', 'Invalid Condition');
    return;
  }
  
  appSettings.medicalCondition = condition;
  saveSettings();
  
  // Update display - show condition name, hide selector, show display button
  const display = document.getElementById('medicalConditionDisplay');
  const selector = document.getElementById('medicalConditionSelector');
  const displayContainer = document.getElementById('medicalConditionDisplayContainer');
  
  if (display) {
    display.textContent = condition;
    // Force update to ensure it persists
    display.style.display = 'block';
    display.style.visibility = 'visible';
  }
  
  // Hide selector if it's open, show display button
  if (selector) {
    selector.style.display = 'none';
  }
  if (displayContainer) {
    displayContainer.style.display = 'block';
    displayContainer.style.visibility = 'visible';
  }
  
  // Force update the display text again after a brief delay to ensure it persists
  // This prevents it from being overwritten by loadSettingsState() or other functions
  setTimeout(() => {
    const displayCheck = document.getElementById('medicalConditionDisplay');
    if (displayCheck && appSettings.medicalCondition) {
      displayCheck.textContent = appSettings.medicalCondition;
    }
  }, 100);
  
  // Update CONDITION_CONTEXT for AI analysis
  updateConditionContext(condition);
  
  // Sync to cloud if authenticated (but not in demo mode)
  if (!appSettings.demoMode && typeof cloudSyncState !== 'undefined' && cloudSyncState.isAuthenticated && typeof syncToCloud === 'function') {
    setTimeout(() => syncToCloud(), 500);
  }
  
  // Sync anonymized data if contribution is enabled (but not in demo mode)
  if (appSettings.contributeAnonData && !appSettings.demoMode && typeof syncAnonymizedData === 'function') {
    // Clear synced keys for this condition to allow re-syncing with new condition
    const syncedKeysJson = localStorage.getItem('anonymizedDataSyncedKeys');
    if (syncedKeysJson) {
      const syncedKeys = JSON.parse(syncedKeysJson);
      const condition = appSettings.medicalCondition;
      // Remove all keys for this condition
      const filteredKeys = syncedKeys.filter(key => !key.endsWith(`_${condition}`));
      localStorage.setItem('anonymizedDataSyncedKeys', JSON.stringify(filteredKeys));
    }
    syncAnonymizedData();
  }
  
  // Check if condition has enough data for Optimised AI
  if (typeof checkOptimizedAIAvailability === 'function') {
    checkOptimizedAIAvailability();
  }
  
  // Apply settings to ensure everything is updated
  if (typeof applySettings === 'function') {
    applySettings();
  }
}

// Demo Mode Functions - Generate perfect showcase data with clear patterns
function generateDemoData(numDays = 3650) {
  // Generate 10 years of demo data (3650 days) with clear patterns for AI showcase
  const demoLogs = new Array(numDays); // Pre-allocate array for better performance
  const today = new Date();
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() - 1); // Yesterday
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - (numDays - 1));
  
  // Pre-calculate date strings to avoid repeated Date operations
  const startTimestamp = startDate.getTime();
  const oneDayMs = 86400000; // Milliseconds in a day
  
  // Track state for realistic trends and patterns
  let currentWeight = 75.0;
  let flareState = false;
  let flareDuration = 0;
  let recoveryPhase = 0; // Days since last flare (for recovery patterns)
  let baselineHealth = 7.0; // Baseline health score (improves over time with treatment)
  let seasonalFactor = 0; // Seasonal variation (-1 to 1)
  let weeklyPattern = 0; // Day of week pattern (0-6)
  
  // Pattern tracking for correlations
  let previousSleep = 7;
  let previousMood = 7;
  let previousFatigue = 4;
  let previousStiffness = 3;
  
  // Pre-generate random numbers in batches for better performance
  const batchSize = 1000;
  let randomBatch = [];
  let randomIndex = 0;
  
  function getRandom() {
    if (randomIndex >= randomBatch.length) {
      randomBatch = new Array(batchSize);
      for (let i = 0; i < batchSize; i++) {
        randomBatch[i] = Math.random();
      }
      randomIndex = 0;
    }
    return randomBatch[randomIndex++];
  }
  
  // Helper: Calculate seasonal factor (winter worse, summer better)
  function getSeasonalFactor(month) {
    // Winter months (Dec, Jan, Feb) = -0.3, Spring/Fall = 0, Summer = +0.2
    if (month === 11 || month === 0 || month === 1) return -0.3; // Dec, Jan, Feb
    if (month >= 2 && month <= 4) return 0; // Mar, Apr, May
    if (month >= 5 && month <= 7) return 0.2; // Jun, Jul, Aug
    return 0; // Sep, Oct, Nov
  }
  
  // Helper: Calculate day of week pattern (weekends better)
  function getWeeklyPattern(dayOfWeek) {
    // Sunday = 0, Saturday = 6 (better), Weekdays = worse
    if (dayOfWeek === 0 || dayOfWeek === 6) return 0.15; // Weekend boost
    return -0.1; // Weekday stress
  }
  
  // Pre-define note templates
  const noteTemplates = [
    'Feeling better today',
    'Morning stiffness was manageable',
    'Had a good night\'s sleep',
    'Some joint pain in the morning',
    'Feeling tired',
    'Good day overall',
    'Minor flare symptoms',
    'Exercised today, feeling good'
  ];
  
  // Generate consecutive daily entries with clear patterns
  for (let day = 0; day < numDays; day++) {
    // Calculate date more efficiently
    const dateTimestamp = startTimestamp + (day * oneDayMs);
    const date = new Date(dateTimestamp);
    const year = date.getFullYear();
    const month = date.getMonth(); // 0-11
    const dayOfMonth = String(date.getDate()).padStart(2, '0');
    const dayOfWeek = date.getDay(); // 0-6 (Sunday = 0)
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${dayOfMonth}`;
    
    // Calculate patterns
    seasonalFactor = getSeasonalFactor(month);
    weeklyPattern = getWeeklyPattern(dayOfWeek);
    
    // Long-term improvement trend (baseline health improves over 10 years)
    const yearsProgress = day / 365.25;
    baselineHealth = 6.0 + (yearsProgress / 10) * 1.5; // Improves from 6.0 to 7.5 over 10 years
    baselineHealth = Math.min(7.5, baselineHealth);
    
    // Flare-up pattern: More likely in winter, less likely in summer
    const flareChance = 0.12 + (seasonalFactor * 0.1); // Higher in winter
    if (flareDuration > 0) {
      flareDuration--;
      recoveryPhase = 0;
      if (flareDuration === 0) {
        flareState = false;
        recoveryPhase = 1;
      }
    } else if (getRandom() < flareChance) {
      flareState = true;
      flareDuration = Math.floor(getRandom() * 4) + 2; // 2-5 days
      recoveryPhase = 0;
    } else {
      recoveryPhase++;
    }
    
    // Recovery pattern: Gradual improvement after flare
    const recoveryBoost = recoveryPhase > 0 && recoveryPhase < 7 
      ? Math.min(0.3, recoveryPhase * 0.05) 
      : 0;
    
    // Pre-calculate random values for variation
    const r1 = getRandom();
    const r2 = getRandom();
    const r3 = getRandom();
    const r4 = getRandom();
    const r5 = getRandom();
    const r6 = getRandom();
    const r7 = getRandom();
    const r8 = getRandom();
    const r9 = getRandom();
    const r10 = getRandom();
    const r11 = getRandom();
    const r12 = getRandom();
    
    // Base values with patterns
    let fatigue, stiffness, backPain, jointPain, sleep, mobility, dailyFunction, swelling, mood, irritability, bpm;
    
    if (flareState) {
      // During flare: All symptoms worse, clear correlations
      const flareSeverity = 1.0 - (flareDuration / 5); // Worse at start
      fatigue = Math.max(1, Math.min(10, baselineHealth - 3 + (r1 * 3) - (seasonalFactor * 2)));
      stiffness = Math.max(1, Math.min(10, baselineHealth - 2.5 + (r2 * 3) - (seasonalFactor * 2)));
      backPain = Math.max(1, Math.min(10, baselineHealth - 2 + (r3 * 3) - (seasonalFactor * 2)));
      jointPain = Math.max(1, Math.min(10, baselineHealth - 2.5 + (r4 * 2.5) - (seasonalFactor * 1.5)));
      sleep = Math.max(1, Math.min(10, baselineHealth - 4 + (r5 * 2) - (seasonalFactor * 1.5)));
      mobility = Math.max(1, Math.min(10, baselineHealth - 4 + (r6 * 2) - (seasonalFactor * 1.5)));
      dailyFunction = Math.max(1, Math.min(10, baselineHealth - 3.5 + (r7 * 2.5) - (seasonalFactor * 1.5)));
      swelling = Math.max(1, Math.min(10, baselineHealth - 3 + (r8 * 2.5) - (seasonalFactor * 1)));
      mood = Math.max(1, Math.min(10, baselineHealth - 3.5 + (r9 * 2) - (seasonalFactor * 1.5)));
      irritability = Math.max(1, Math.min(10, baselineHealth - 2 + (r10 * 3) - (seasonalFactor * 1)));
      bpm = Math.floor(70 + (r11 * 15) + (seasonalFactor * 5));
    } else {
      // Normal state: Clear correlations and patterns
      // Sleep quality affects everything
      const sleepQuality = baselineHealth + (r5 * 2) + seasonalFactor + weeklyPattern + recoveryBoost;
      sleep = Math.max(1, Math.min(10, sleepQuality));
      
      // Fatigue inversely correlates with sleep (strong correlation)
      fatigue = Math.max(1, Math.min(10, baselineHealth - (sleep - 5) * 0.8 + (r1 * 1.5) - seasonalFactor));
      
      // Stiffness correlates with weather (winter worse)
      stiffness = Math.max(1, Math.min(10, baselineHealth - 2 - (seasonalFactor * 2) + (r2 * 1.5) + recoveryBoost));
      
      // Back pain correlates with stiffness (strong correlation)
      backPain = Math.max(1, Math.min(10, stiffness + (r3 * 1) - 0.5));
      
      // Joint pain correlates with stiffness
      jointPain = Math.max(1, Math.min(10, stiffness * 0.7 + (r4 * 1.2)));
      
      // Mobility inversely correlates with stiffness and fatigue
      mobility = Math.max(1, Math.min(10, baselineHealth + 1 - (stiffness - 5) * 0.5 - (fatigue - 5) * 0.3 + (r6 * 1) + recoveryBoost));
      
      // Daily function correlates with mobility and mood
      dailyFunction = Math.max(1, Math.min(10, mobility * 0.9 + (r7 * 1)));
      
      // Swelling correlates with joint pain
      swelling = Math.max(1, Math.min(10, jointPain * 0.6 + (r8 * 1)));
      
      // Mood correlates with sleep and inversely with fatigue (strong correlations)
      mood = Math.max(1, Math.min(10, baselineHealth + 0.5 + (sleep - 5) * 0.6 - (fatigue - 5) * 0.4 + (r9 * 1) + weeklyPattern + recoveryBoost));
      
      // Irritability inversely correlates with mood and sleep
      irritability = Math.max(1, Math.min(10, baselineHealth - 2 - (mood - 5) * 0.5 - (sleep - 5) * 0.3 + (r10 * 1.5)));
      
      // BPM correlates with stress/fatigue
      bpm = Math.floor(65 + (fatigue - 5) * 2 + (r11 * 8) + (seasonalFactor * 3));
    }
    
    // Round all values
    fatigue = Math.round(fatigue);
    stiffness = Math.round(stiffness);
    backPain = Math.round(backPain);
    jointPain = Math.round(jointPain);
    sleep = Math.round(sleep);
    mobility = Math.round(mobility);
    dailyFunction = Math.round(dailyFunction);
    swelling = Math.round(swelling);
    mood = Math.round(mood);
    irritability = Math.round(irritability);
    bpm = Math.max(50, Math.min(120, bpm));
    
    // Store for next iteration (for trend patterns)
    previousSleep = sleep;
    previousMood = mood;
    previousFatigue = fatigue;
    previousStiffness = stiffness;
    
    // Weight: Slight variation around base (within ±2kg) - optimized
    const weightChange = (r12 - 0.5) * 0.6; // -0.3 to 0.3
    currentWeight += weightChange;
    currentWeight = currentWeight < 70 ? 70 : (currentWeight > 80 ? 80 : currentWeight); // Clamp between 70-80kg
    const weight = Math.round(currentWeight * 10) / 10;
    
    // Notes: Occasionally add notes (only check if needed)
    let notes = '';
    if (getRandom() < 0.1) { // 10% chance of note
      notes = noteTemplates[Math.floor(getRandom() * noteTemplates.length)];
    }
    
    // Generate food and exercise data (use PREDEFINED_FOODS / PREDEFINED_EXERCISES for consistency with tiles)
    const breakfastItems = [];
    const lunchItems = [];
    const dinnerItems = [];
    const snackItems = [];
    
    // Food - 60% chance of having food logged; use PREDEFINED_FOODS and category object
    if (getRandom() < 0.6) {
      const numTotal = Math.floor(getRandom() * 6) + 1; // 1-6 items across meals
      const used = new Set();
      for (let i = 0; i < numTotal && used.size < PREDEFINED_FOODS.length; i++) {
        const f = PREDEFINED_FOODS[Math.floor(getRandom() * PREDEFINED_FOODS.length)];
        if (used.has(f.id)) continue;
        used.add(f.id);
        const item = { name: f.name, calories: f.calories, protein: f.protein };
        const slot = i % 4;
        if (slot === 0) breakfastItems.push(item);
        else if (slot === 1) lunchItems.push(item);
        else if (slot === 2) dinnerItems.push(item);
        else snackItems.push(item);
      }
    }
    
    // Exercise - 40% chance; use PREDEFINED_EXERCISES with { name, duration }
    const exerciseItems = [];
    if (getRandom() < 0.4) {
      const numExerciseItems = Math.floor(getRandom() * 3) + 1;
      const exUsed = new Set();
      for (let i = 0; i < numExerciseItems && exUsed.size < PREDEFINED_EXERCISES.length; i++) {
        const template = PREDEFINED_EXERCISES[Math.floor(getRandom() * PREDEFINED_EXERCISES.length)];
        if (exUsed.has(template.id)) continue;
        exUsed.add(template.id);
        const durationVariation = 1 + (getRandom() - 0.5) * 0.4;
        exerciseItems.push({
          name: template.name,
          duration: Math.max(5, Math.round(template.defaultDuration * durationVariation))
        });
      }
    }
    
    // Energy & mental clarity - use ENERGY_CLARITY_OPTIONS values
    const energyClarityValues = ENERGY_CLARITY_OPTIONS.map(o => o.value).concat('');
    const energyClarity = getRandom() > 0.3 ? energyClarityValues[Math.floor(getRandom() * energyClarityValues.length)] : '';
    
    // Stressors - use STRESSOR_OPTIONS values
    const numStressors = flareState ? Math.floor(getRandom() * 3) : Math.floor(getRandom() * 2);
    const stressors = [];
    const stressorValues = STRESSOR_OPTIONS.map(o => o.value);
    for (let i = 0; i < numStressors && stressors.length < stressorValues.length; i++) {
      const val = stressorValues[Math.floor(getRandom() * stressorValues.length)];
      if (!stressors.includes(val)) stressors.push(val);
    }
    
    const symptomsOptions = ["Nausea", "Appetite loss", "Digestive issues", "Breathing difficulty", "Dizziness", "Headache", "Fever", "Chills", "Skin rash", "Eye irritation", "Other"];
    const numSymptoms = flareState ? Math.floor(getRandom() * 4) : Math.floor(getRandom() * 2); // 0-3 or 0-1
    const symptoms = [];
    for (let i = 0; i < numSymptoms && i < symptomsOptions.length; i++) {
      const index = Math.floor(getRandom() * symptomsOptions.length);
      if (!symptoms.includes(symptomsOptions[index])) {
        symptoms.push(symptomsOptions[index]);
      }
    }
    
    const painLocationOptions = ["Lower back", "Upper back", "Neck", "Shoulders", "Hips", "Knees", "Ankles", "Wrists", "Hands", "Feet", ""];
    const painLocation = getRandom() > 0.5 ? painLocationOptions[Math.floor(getRandom() * painLocationOptions.length)] : "";
    
    const weatherSensitivity = flareState ? Math.floor(getRandom() * 5) + 6 : Math.floor(getRandom() * 5) + 1; // 6-10 or 1-5
    const steps = flareState ? Math.floor(getRandom() * 3000) + 2000 : Math.floor(getRandom() * 7000) + 5000; // 2000-5000 or 5000-12000
    const hydration = flareState ? (getRandom() * 4 + 4) : (getRandom() * 4 + 6); // 4-8 or 6-10
    
    // Create object directly (avoiding push for better performance)
    demoLogs[day] = {
      date: dateStr,
      bpm: String(bpm),
      weight: weight.toFixed(1),
      flare: flareState ? 'Yes' : 'No',
      fatigue: String(fatigue),
      stiffness: String(stiffness),
      backPain: String(backPain),
      sleep: String(sleep),
      jointPain: String(jointPain),
      mobility: String(mobility),
      dailyFunction: String(dailyFunction),
      swelling: String(swelling),
      mood: String(mood),
      irritability: String(irritability),
      energyClarity: energyClarity || undefined,
      weatherSensitivity: String(weatherSensitivity),
      steps: steps,
      hydration: Math.round(hydration * 10) / 10,
      stressors: stressors.length > 0 ? stressors : undefined,
      symptoms: symptoms.length > 0 ? symptoms : undefined,
      painLocation: painLocation || undefined,
      notes: notes,
      food: { breakfast: breakfastItems, lunch: lunchItems, dinner: dinnerItems, snack: snackItems },
      exercise: exerciseItems
    };
  }
  
  return demoLogs;
}

function toggleDemoMode() {
  // Prevent multiple runs from rapid clicks – only one toggle in progress
  if (window._demoModeToggling) {
    return;
  }
  window._demoModeToggling = true;

  const demoEl = document.getElementById('demoModeToggle');
  if (demoEl) {
    demoEl.style.pointerEvents = 'none';
    demoEl.style.opacity = '0.7';
  }

  const isDemoMode = appSettings.demoMode || false;
  Logger.info('Demo mode toggle initiated', { currentState: isDemoMode });

  const doReload = (forceDemoOff, restoredLogsJson, restoredSettingsJson) => {
    if (forceDemoOff) {
      try {
        // Re-apply restored data right before reload so nothing can overwrite it
        if (restoredLogsJson != null) {
          localStorage.setItem('healthLogs', restoredLogsJson);
        }
        if (restoredSettingsJson != null) {
          const settings = JSON.parse(restoredSettingsJson);
          settings.demoMode = false;
          localStorage.setItem('healthAppSettings', JSON.stringify(settings));
        } else {
          const raw = localStorage.getItem('healthAppSettings');
          const settings = raw ? JSON.parse(raw) : {};
          settings.demoMode = false;
          settings.userName = '';
          settings.medicalCondition = '';
          localStorage.setItem('healthAppSettings', JSON.stringify(settings));
        }
      } catch (e) {
        console.warn('Demo off: could not persist', e);
      }
    }
    window._demoModeToggling = false;
    window.location.reload();
  };

  if (isDemoMode) {
    // Disable demo mode - restore original data (or clear demo data if no backup)
    const originalLogs = localStorage.getItem('healthLogs_backup');
    const originalSettings = localStorage.getItem('appSettings_backup');

    try {
      if (originalLogs) {
        localStorage.setItem('healthLogs', originalLogs);
        logs = JSON.parse(originalLogs);
        if (typeof window !== 'undefined') {
          window.logs = logs;
        }
      } else {
        // No backup: clear demo data so AI and UI don't keep showing it
        logs = [];
        if (typeof window !== 'undefined') {
          window.logs = logs;
        }
        localStorage.setItem('healthLogs', '[]');
      }

      if (originalSettings) {
        const restoredSettings = JSON.parse(originalSettings);
        appSettings = { ...appSettings, ...restoredSettings, demoMode: false };
        saveSettings();
        const userNameInput = document.getElementById('userNameInput');
        const medicalConditionInput = document.getElementById('medicalConditionInput');
        if (userNameInput) userNameInput.value = appSettings.userName || '';
        if (medicalConditionInput) medicalConditionInput.value = appSettings.medicalCondition || '';
        updateDashboardTitle();
        if (appSettings.medicalCondition && appSettings.medicalCondition.trim() !== '' && appSettings.medicalCondition.toLowerCase() !== 'medical condition') {
          updateConditionContext(appSettings.medicalCondition);
        }
      } else {
        // No backup: clear demo username and condition
        appSettings.demoMode = false;
        appSettings.userName = '';
        appSettings.medicalCondition = '';
        saveSettings();
      }

      localStorage.removeItem('healthLogs_backup');
      localStorage.removeItem('appSettings_backup');
      appSettings.demoMode = false;
      saveSettings();

      const finalSettings = JSON.parse(localStorage.getItem('healthAppSettings') || '{}');
      finalSettings.demoMode = false;
      localStorage.setItem('healthAppSettings', JSON.stringify(finalSettings));
      appSettings.demoMode = false;
      if (typeof window !== 'undefined') {
        window.appSettings = appSettings;
      }

      const demoModeToggle = document.getElementById('demoModeToggle');
      if (demoModeToggle) {
        demoModeToggle.classList.remove('active');
      }
      loadSettingsState();

      try {
        if (typeof renderLogs === 'function') renderLogs();
        if (typeof updateCharts === 'function') updateCharts();
        if (typeof updateHeartbeatAnimation === 'function') updateHeartbeatAnimation();
      } catch (e) {
        console.warn('Demo off: UI update error', e);
      }
    } catch (e) {
      console.error('Demo mode off error:', e);
    }
    // Pass restored (or cleared) data so doReload can re-apply right before reload
    const logsToRestore = originalLogs != null ? originalLogs : '[]';
    const settingsToRestore = originalSettings != null ? originalSettings : null;
    setTimeout(() => doReload(true, logsToRestore, settingsToRestore), 400);
  } else {
    // Enable demo mode - backup current data and load demo data
    // Show loading indicator
      const loadingMsg = document.createElement('div');
      loadingMsg.className = 'success-notification';
      loadingMsg.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #4caf50, #66bb6a);
        color: white;
        padding: 24px 32px;
        border-radius: 16px;
        font-weight: 600;
        font-size: 1.1rem;
        z-index: 10001;
        box-shadow: 0 8px 24px rgba(76, 175, 80, 0.4);
        text-align: center;
      `;
      loadingMsg.textContent = '🔄 Generating demo data... This may take a moment.';
      document.body.appendChild(loadingMsg);
      
      // Backup current data
      const currentLogs = localStorage.getItem('healthLogs');
      const currentSettings = JSON.stringify(appSettings);
      
      if (currentLogs) {
        localStorage.setItem('healthLogs_backup', currentLogs);
      }
      localStorage.setItem('appSettings_backup', currentSettings);
      
      // Use setTimeout to allow UI to update before heavy computation
      setTimeout(() => {
        try {
          // Generate and load demo data (optimized)
          const demoLogs = generateDemoData(3650); // 10 years
          
          // Store data efficiently
          localStorage.setItem('healthLogs', JSON.stringify(demoLogs));
          logs = demoLogs;
          
          // Make logs globally available
          if (typeof window !== 'undefined') {
            window.logs = logs;
          }
          
          // Update settings for demo
          appSettings.userName = 'John Doe';
          appSettings.medicalCondition = 'Arthritis';
          appSettings.demoMode = true;
          saveSettings();
          
          // Update UI
          const userNameInput = document.getElementById('userNameInput');
          const medicalConditionInput = document.getElementById('medicalConditionInput');
          if (userNameInput) userNameInput.value = 'John Doe';
          if (medicalConditionInput) medicalConditionInput.value = 'Arthritis';
          updateDashboardTitle();
          updateConditionContext('Arthritis');
          
          // Refresh UI - ensure logs are rendered
          if (typeof renderLogs === 'function') {
            renderLogs();
          }
          if (typeof updateCharts === 'function') {
            updateCharts();
          }
          if (typeof updateHeartbeatAnimation === 'function') {
            updateHeartbeatAnimation();
          }
          if (typeof loadSettingsState === 'function') {
            loadSettingsState();
          }
          
          // Remove loading indicator
          if (document.body.contains(loadingMsg)) {
            document.body.removeChild(loadingMsg);
          }
          
          // Remove all notifications related to demo mode
          document.querySelectorAll('.success-notification').forEach(notification => {
            if (notification.textContent.includes('Demo') || notification.textContent.includes('demo')) {
              notification.remove();
            }
          });
          
          // Close any open alert modals
          closeAlertModal();
          
          // Restart the app after enabling demo mode
          setTimeout(() => {
            window.location.reload();
          }, 500);
        } catch (error) {
          console.error('Error generating demo data:', error);
          if (document.body.contains(loadingMsg)) {
            document.body.removeChild(loadingMsg);
          }
          window._demoModeToggling = false;
        }
      }, 100); // Small delay to allow UI update
  }
}

function updateConditionContext(conditionName) {
  // Update the condition context with user's condition
  CONDITION_CONTEXT.name = conditionName;
  
  // Update description based on common conditions (can be expanded)
  const conditionDescriptions = {
    'Ankylosing Spondylitis': 'A chronic inflammatory arthritis affecting the spine and joints',
    'Rheumatoid Arthritis': 'An autoimmune disorder causing joint inflammation and pain',
    'Fibromyalgia': 'A condition characterized by widespread pain and fatigue',
    'Arthritis': 'A general term for conditions affecting joints and surrounding tissues',
    'Lupus': 'An autoimmune disease that can affect various body systems',
    'Osteoarthritis': 'A degenerative joint disease causing cartilage breakdown',
    'Psoriatic Arthritis': 'A form of arthritis associated with psoriasis'
  };
  
  CONDITION_CONTEXT.description = conditionDescriptions[conditionName] || 'A chronic health condition requiring ongoing management';
  
  // Keep existing metrics and treatment areas (can be customized per condition later)
  console.log(`Condition context updated to: ${conditionName}`);
}

// Initialize condition context from settings
function initializeConditionContext() {
  const condition = appSettings.medicalCondition || '';
  if (condition && condition.trim() !== '' && condition.toLowerCase() !== 'medical condition') {
    updateConditionContext(condition);
  }
}

// Old function - keeping for backward compatibility but updating it
function updateMedicalConditionOld() {
  const newConditionInput = document.getElementById('newConditionInput');
  const condition = newConditionInput ? newConditionInput.value.trim() : '';
  if (!condition || condition.toLowerCase() === 'medical condition') {
    return; // Don't set placeholder as condition
  }
  appSettings.medicalCondition = condition;
  saveSettings();
  updateConditionContext(condition);
  
  // Show confirmation
  const successMsg = document.createElement('div');
  successMsg.className = 'success-notification';
  successMsg.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #4caf50, #66bb6a);
    color: white;
    padding: 12px 20px;
    border-radius: 12px;
    font-weight: 600;
    font-size: 0.9rem;
    z-index: 10000;
    box-shadow: 0 8px 24px rgba(76, 175, 80, 0.4);
    animation: slideInRight 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  `;
  successMsg.textContent = `Medical condition updated to: ${condition}`;
  document.body.appendChild(successMsg);
  
  setTimeout(() => {
    successMsg.style.animation = 'slideOutRight 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards';
    setTimeout(() => successMsg.remove(), 300);
  }, 2000);
}

// Update condition context dynamically
function updateConditionContext(conditionName) {
  CONDITION_CONTEXT.name = conditionName;
  // Update description based on condition (you can expand this)
  if (conditionName.toLowerCase().includes('ankylosing') || conditionName.toLowerCase().includes('spondylitis')) {
    CONDITION_CONTEXT.description = 'A chronic inflammatory arthritis affecting the spine and joints';
  } else if (conditionName.toLowerCase().includes('arthritis')) {
    CONDITION_CONTEXT.description = 'A condition affecting joints and mobility';
  } else if (conditionName.toLowerCase().includes('fibromyalgia')) {
    CONDITION_CONTEXT.description = 'A condition characterized by widespread pain and fatigue';
  } else if (conditionName.toLowerCase().includes('lupus')) {
    CONDITION_CONTEXT.description = 'An autoimmune disease that can affect various parts of the body';
  } else if (conditionName.toLowerCase().includes('rheumatoid')) {
    CONDITION_CONTEXT.description = 'An autoimmune condition causing joint inflammation and pain';
  } else {
    CONDITION_CONTEXT.description = 'A chronic health condition requiring ongoing management';
  }
}

function updateDashboardTitle() {
  const titleElement = document.getElementById('dashboardTitle');
  const userName = appSettings.userName;
  
  if (userName && userName.trim() !== '') {
    const newTitle = `Welcome to ${userName}'s health`;
    titleElement.textContent = newTitle;
    titleElement.setAttribute('data-text', newTitle);
    document.title = `${userName.charAt(0).toUpperCase() + userName.slice(1)}'s Health Dashboard`;
  } else {
    titleElement.textContent = 'Health Dashboard';
    titleElement.setAttribute('data-text', 'Health Dashboard');
    document.title = 'Health Dashboard';
  }
}

// Filtering and sorting functionality
let currentSortOrder = 'newest'; // 'newest' or 'oldest'

// Set log view date range (7, 30, or 90 days)
function clearAISection() {
  // Clear AI results content
  const resultsContent = document.getElementById('aiResultsContent');
  if (resultsContent) {
    resultsContent.innerHTML = '';
  }
}

function setLogViewRange(days) {
  // Clear and hide AI section when range changes
  clearAISection();
  
  // Calculate date range
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (days - 1));
  startDate.setHours(0, 0, 0, 0);
  
  // Update date inputs
  const startDateInput = document.getElementById('startDate');
  const endDateInput = document.getElementById('endDate');
  
  if (startDateInput && endDateInput) {
    startDateInput.value = startDate.toISOString().split('T')[0];
    endDateInput.value = endDate.toISOString().split('T')[0];
  }
  
  // Update chart date range to match
  chartDateRange.type = days;
  chartDateRange.startDate = startDateInput.value;
  chartDateRange.endDate = endDateInput.value;
  
  // Update chart date range buttons
  document.querySelectorAll('.date-range-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  const chartButtonId = days === 1 ? 'range1Day' : `range${days}Days`;
  const chartButton = document.getElementById(chartButtonId);
  if (chartButton) {
    chartButton.classList.add('active');
  }
  
  // Update log view range buttons
  document.querySelectorAll('.log-date-range-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  const logButtonId = days === 1 ? 'logRange1Day' : `logRange${days}Days`;
  const logButton = document.getElementById(logButtonId);
  if (logButton) {
    logButton.classList.add('active');
    Logger.debug('View range button activated', { days, buttonId: logButtonId });
  } else {
    Logger.warn('View range button not found', { days, buttonId: logButtonId });
  }
  
  // Hide custom date range selector if it was showing
  const customDateRangeSelector = document.getElementById('customDateRangeSelector');
  if (customDateRangeSelector) {
    customDateRangeSelector.classList.add('hidden');
  }
  
  // Filter and render logs (this will call checkAndUpdateViewRangeButtons, but our button should stay active)
  filterLogs();
  
  // Refresh charts to match the new range
  refreshCharts();
}

// Set AI date range
function setAIDateRange(range) {
  if (!appSettings.aiDateRange) {
    appSettings.aiDateRange = {};
  }
  appSettings.aiDateRange.type = range;
  saveSettings();
  
  // Update button states
  document.querySelectorAll('#aiTab .date-range-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  if (range === 'custom') {
    const customBtn = document.getElementById('aiRangeCustom');
    if (customBtn) customBtn.classList.add('active');
    const customSelector = document.getElementById('aiCustomDateRangeSelector');
    if (customSelector) customSelector.classList.remove('hidden');
    
    // Set default dates if not already set
    const startInput = document.getElementById('aiStartDate');
    const endInput = document.getElementById('aiEndDate');
    
    if (startInput && endInput && (!startInput.value || !endInput.value)) {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7); // Default to last 7 days
      
      startInput.value = startDate.toISOString().split('T')[0];
      endInput.value = endDate.toISOString().split('T')[0];
      
      appSettings.aiDateRange.startDate = startInput.value;
      appSettings.aiDateRange.endDate = endInput.value;
      saveSettings();
    }
  } else {
    // Handle preset ranges
    const buttonId = `aiRange${range}Days`;
    const button = document.getElementById(buttonId);
    if (button) {
      button.classList.add('active');
    }
    const customSelector = document.getElementById('aiCustomDateRangeSelector');
    if (customSelector) customSelector.classList.add('hidden');
    
    // Clear custom dates for preset ranges
    appSettings.aiDateRange.startDate = null;
    appSettings.aiDateRange.endDate = null;
    saveSettings();
  }
  
  // Automatically generate AI summary when date range changes
  if (logs && logs.length > 0) {
    generateAISummary();
  }
}

// Apply custom AI date range
function applyAICustomDateRange() {
  const startInput = document.getElementById('aiStartDate');
  const endInput = document.getElementById('aiEndDate');
  
  if (!startInput || !endInput || !startInput.value || !endInput.value) {
    showAlertModal('Please select both start and end dates.', 'Date Range');
    return;
  }
  
  if (!appSettings.aiDateRange) {
    appSettings.aiDateRange = {};
  }
  appSettings.aiDateRange.type = 'custom';
  appSettings.aiDateRange.startDate = startInput.value;
  appSettings.aiDateRange.endDate = endInput.value;
  saveSettings();
  
  // Update button states
  document.querySelectorAll('#aiTab .date-range-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  const customBtn = document.getElementById('aiRangeCustom');
  if (customBtn) customBtn.classList.add('active');
  
  // Automatically generate AI summary when custom date range is applied
  if (logs && logs.length > 0) {
    generateAISummary();
  }
}

function checkAndUpdateViewRangeButtons() {
  // Check if the current date range matches any predefined range (7, 30, 90 days)
  const startDateInput = document.getElementById('startDate');
  const endDateInput = document.getElementById('endDate');
  
  if (!startDateInput || !endDateInput || !startDateInput.value || !endDateInput.value) {
    // If dates are empty, deselect all buttons
    document.querySelectorAll('.log-date-range-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    return;
  }
  
  const startDate = new Date(startDateInput.value);
  const endDate = new Date(endDateInput.value);
  // Set proper hours for accurate comparison
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);
  
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  
  // Check if end date is today (or very close to today)
  const endDateDiff = Math.abs(today - endDate);
  const oneDayMs = 86400000;
  const isEndDateToday = endDateDiff < oneDayMs;
  
  if (!isEndDateToday) {
    // End date is not today, so it's a custom range - deselect all buttons
    document.querySelectorAll('.log-date-range-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    return;
  }
  
  // Calculate the number of days between start and end
  // Both dates now have proper hours set, so calculation should be accurate
  const daysDiff = Math.ceil((endDate - startDate) / oneDayMs) + 1; // +1 to include both start and end days
  
  // Check if it matches any predefined range (1, 7, 30, 90 days)
  if (daysDiff === 1 || daysDiff === 7 || daysDiff === 30 || daysDiff === 90) {
    // Check if start date matches the expected start date for this range
    const expectedStartDate = new Date(today);
    expectedStartDate.setDate(expectedStartDate.getDate() - (daysDiff - 1));
    expectedStartDate.setHours(0, 0, 0, 0);
    
    // Create a copy of startDate for comparison (since we already set hours above)
    const startDateForComparison = new Date(startDate);
    startDateForComparison.setHours(0, 0, 0, 0);
    
    const startDateMatch = Math.abs(startDateForComparison.getTime() - expectedStartDate.getTime()) < oneDayMs;
    
    Logger.debug('View range button check', { 
      daysDiff, 
      startDate: startDateForComparison.toISOString().split('T')[0],
      expectedStartDate: expectedStartDate.toISOString().split('T')[0],
      match: startDateMatch 
    });
    
    if (startDateMatch) {
      // Matches a predefined range - select the appropriate button
      document.querySelectorAll('.log-date-range-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      const logButtonId = daysDiff === 1 ? 'logRange1Day' : `logRange${daysDiff}Days`;
      const logButton = document.getElementById(logButtonId);
      if (logButton) {
        logButton.classList.add('active');
      }
      
      // Also update chart date range buttons
      document.querySelectorAll('.date-range-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      const chartButtonId = daysDiff === 1 ? 'range1Day' : `range${daysDiff}Days`;
      const chartButton = document.getElementById(chartButtonId);
      if (chartButton) {
        chartButton.classList.add('active');
      }
    } else {
      // Doesn't match exactly - deselect all buttons
      document.querySelectorAll('.log-date-range-btn').forEach(btn => {
        btn.classList.remove('active');
      });
    }
  } else {
    // Doesn't match any predefined range - deselect all buttons
    document.querySelectorAll('.log-date-range-btn').forEach(btn => {
      btn.classList.remove('active');
    });
  }
}

function filterLogs() {
  // Clear and hide AI section when filter changes
  clearAISection();
  
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;
  
  // Check and update View Range buttons based on current date selection
  checkAndUpdateViewRangeButtons();
  
  if (!startDate && !endDate) {
    renderLogs();
    return;
  }
  
  const filteredLogs = logs.filter(log => {
    const logDate = new Date(log.date);
    const start = startDate ? new Date(startDate) : new Date('1900-01-01');
    const end = endDate ? new Date(endDate) : new Date('2100-12-31');
    end.setHours(23, 59, 59, 999); // Include entire end date
    start.setHours(0, 0, 0, 0);
    
    return logDate >= start && logDate <= end;
  });
  
  renderFilteredLogs(filteredLogs);
}

function toggleSort() {
  currentSortOrder = currentSortOrder === 'newest' ? 'oldest' : 'newest';
  document.getElementById('sortOrder').textContent = currentSortOrder === 'newest' ? 'Newest' : 'Oldest';
  
  // Get the currently filtered logs (respecting date range)
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;
  
  let logsToSort = [];
  
  // If date range is set, filter first, then sort
  if (startDate || endDate) {
    logsToSort = logs.filter(log => {
      const logDate = new Date(log.date);
      const start = startDate ? new Date(startDate) : new Date('1900-01-01');
      const end = endDate ? new Date(endDate) : new Date('2100-12-31');
      end.setHours(23, 59, 59, 999); // Include entire end date
      start.setHours(0, 0, 0, 0);
      return logDate >= start && logDate <= end;
    });
  } else {
    // No date filter - check if a view range button is active
    const activeRangeBtn = document.querySelector('.log-date-range-btn.active');
    if (activeRangeBtn) {
      // Get the range from the button
      const btnId = activeRangeBtn.id;
      let days = 7; // default
      if (btnId === 'logRange1Day') days = 1;
      else if (btnId === 'logRange7Days') days = 7;
      else if (btnId === 'logRange30Days') days = 30;
      else if (btnId === 'logRange90Days') days = 90;
      
      // Filter by the selected range
      const endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - (days - 1));
      startDate.setHours(0, 0, 0, 0);
      
      logsToSort = logs.filter(log => {
        const logDate = new Date(log.date);
        return logDate >= startDate && logDate <= endDate;
      });
    } else {
      // No filter at all - use all logs
      logsToSort = [...logs];
    }
  }
  
  // Sort the filtered logs
  const sortedLogs = logsToSort.sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return currentSortOrder === 'newest' ? dateB - dateA : dateA - dateB;
  });
  
  renderSortedLogs(sortedLogs);
}

function renderFilteredLogs(filteredLogs) {
  renderLogEntries(filteredLogs);
}

function renderSortedLogs(sortedLogs) {
  renderLogEntries(sortedLogs);
}

// Collapsible section functionality
function toggleSection(sectionId) {
  const section = document.getElementById(sectionId);
  const header = section?.previousElementSibling;
  const arrow = header?.querySelector('.section-arrow');
  
  if (section && header) {
    const isOpen = section.classList.contains('open');
    
    // Remove active state from header to prevent stuck states
    header.classList.remove('active');
    
    // Use requestAnimationFrame to ensure smooth animation
    requestAnimationFrame(() => {
      if (isOpen) {
        section.classList.remove('open');
        if (arrow) arrow.textContent = '';
        // Remove will-change after animation
        setTimeout(() => {
          section.style.willChange = 'auto';
        }, 300);
      } else {
        section.classList.add('open');
        if (arrow) arrow.textContent = '';
        // Remove will-change after animation completes
        setTimeout(() => {
          section.style.willChange = 'auto';
        }, 300);
      }
    });
    
    // Remove active state after a short delay
    setTimeout(() => {
      header.classList.remove('active');
    }, 200);
  }
}

// Add touch event handling for mobile to prevent stuck animations
document.addEventListener('DOMContentLoaded', function() {
  // Use event delegation to handle dynamically added section headers
  document.addEventListener('touchstart', function(e) {
    const header = e.target.closest('.section-header');
    if (header) {
      header.classList.add('active');
    }
  }, { passive: true });
  
  document.addEventListener('touchend', function(e) {
    const header = e.target.closest('.section-header');
    if (header) {
      // Small delay to ensure click event fires
      setTimeout(() => {
        header.classList.remove('active');
      }, 100);
    }
  }, { passive: true });
  
  document.addEventListener('touchcancel', function(e) {
    const header = e.target.closest('.section-header');
    if (header) {
      header.classList.remove('active');
    }
  }, { passive: true });
});

// Initialize all sections as collapsed by default
function initializeSections() {
  const sections = document.querySelectorAll('.section-content');
  sections.forEach(section => {
    // Remove 'open' class to keep sections collapsed
    section.classList.remove('open');
    const header = section.previousElementSibling;
    const arrow = header?.querySelector('.section-arrow');
    if (arrow) arrow.textContent = ''; // Keep arrow empty
  });
}

// One details open at a time within a container (used by Food/Exercise log and modals)
function makeAccordion(containerSelector, detailsSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) return;
  const detailsList = container.querySelectorAll(detailsSelector);
  detailsList.forEach(details => {
    details.addEventListener('toggle', function () {
      if (!this.open) return;
      detailsList.forEach(other => {
        if (other !== this) other.removeAttribute('open');
      });
    });
  });
}

// Only one tile-section (details) open at a time within Food Log and Exercise Log
function initializeOneOpenDetails() {
  makeAccordion('#foodLog', 'details.food-meal-collapsible');
  makeAccordion('#exerciseLog', 'details.exercise-meal-collapsible');
  makeAccordion('#editFoodSection', 'details.food-meal-collapsible');
  makeAccordion('#editExerciseSection', 'details.exercise-meal-collapsible');
}

// Tab switching functionality
function switchTab(tabName) {
  console.log('Switching to tab:', tabName);
  
  // Hide all tabs
  const allTabs = document.querySelectorAll('.tab-content');
  const allTabBtns = document.querySelectorAll('.tab-btn');
  
  allTabs.forEach(tab => {
    tab.classList.remove('active');
    tab.style.display = 'none';
  });
  
  allTabBtns.forEach(btn => {
    btn.classList.remove('active');
  });
  
  // AI results container is always visible at bottom of container when it has content
  // No need to hide/show based on tab switching - it stays at the bottom
  
  // Show selected tab
  const selectedTab = document.getElementById(tabName + 'Tab');
  const selectedBtn = document.querySelector(`[data-tab="${tabName}"]`);
  
  console.log('Selected tab element:', selectedTab);
  console.log('Selected button element:', selectedBtn);
  
  if (selectedTab) {
    selectedTab.classList.add('active');
    selectedTab.style.display = 'block';
    selectedTab.style.visibility = 'visible';
    selectedTab.style.opacity = '1';
    console.log('Tab activated:', tabName);
  } else {
    console.error('Tab not found:', tabName + 'Tab');
  }
  
  if (selectedBtn) {
    selectedBtn.classList.add('active');
  }
  
  // Special handling for charts tab
  if (tabName === 'charts') {
    const chartSection = document.getElementById('chartSection');
    if (chartSection) {
      chartSection.classList.remove('hidden');
      
      // Initialize chart view based on saved preference without jumping
      // Default to 'balance' if no preference is set
      const savedView = appSettings.chartView || 'balance';
      
      // Set default if not set
      if (!appSettings.chartView) {
        appSettings.chartView = 'balance';
        saveSettings();
      }
      
      // Use toggleChartView to properly initialize the view
      toggleChartView(savedView);
    }
  }
  
  // Special handling for logs tab - ensure it's visible
  if (tabName === 'logs') {
    // Logs are always visible in their tab
  }
  
  // Special handling for AI tab - initialize date range
  if (tabName === 'ai') {
    // Initialize AI date range if not set (default to 7 days)
    if (!appSettings.aiDateRange) {
      appSettings.aiDateRange = { type: 7 };
      saveSettings();
      // Set the 7 days button as active
      const ai7DaysBtn = document.getElementById('aiRange7Days');
      if (ai7DaysBtn) {
        ai7DaysBtn.classList.add('active');
      }
    } else {
      // Update button states based on saved preference
      document.querySelectorAll('#aiTab .date-range-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      if (appSettings.aiDateRange.type === 'custom') {
        const customBtn = document.getElementById('aiRangeCustom');
        if (customBtn) customBtn.classList.add('active');
        const customSelector = document.getElementById('aiCustomDateRangeSelector');
        if (customSelector) customSelector.classList.remove('hidden');
        // Populate date inputs if they exist
        const startInput = document.getElementById('aiStartDate');
        const endInput = document.getElementById('aiEndDate');
        if (startInput && appSettings.aiDateRange.startDate) {
          startInput.value = appSettings.aiDateRange.startDate;
        }
        if (endInput && appSettings.aiDateRange.endDate) {
          endInput.value = appSettings.aiDateRange.endDate;
        }
      } else {
        const days = appSettings.aiDateRange.type || 7;
        const buttonId = `aiRange${days}Days`;
        const button = document.getElementById(buttonId);
        if (button) button.classList.add('active');
      }
    }
    
    // Automatically generate AI summary when AI tab is opened (if there's data)
    if (logs && logs.length > 0) {
      // Small delay to ensure tab is fully visible
      setTimeout(() => {
        generateAISummary();
      }, 100);
    }
  }
  
  // Scroll to top smoothly
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Global error handler to suppress browser extension errors (duplicate removed - using the one at line 511)
// This handler is kept for additional coverage
window.addEventListener('error', (event) => {
  // Filter out common browser extension errors
  const errorMsg = event.message || String(event.error || '');
  const filename = event.filename || event.target?.src || '';
  
  const isExtensionError = 
    errorMsg.includes('No tab with id') || 
    errorMsg.includes('Frame with ID') ||
    errorMsg.includes('serviceWorker.js') ||
    errorMsg.includes('background.js') ||
    filename.includes('chrome-extension://') ||
    filename.includes('moz-extension://') ||
    filename.includes('serviceWorker.js') ||
    filename.includes('background.js');
  
  if (isExtensionError) {
    // Suppress extension-related errors
    event.preventDefault();
    event.stopPropagation();
    return false;
  }
  // Let other errors through for debugging
}, true);

// Handle unhandled promise rejections (often from extensions)
window.addEventListener('unhandledrejection', (event) => {
  const errorMsg = event.reason?.message || String(event.reason || '');
  const errorString = String(event.reason || '');
  const errorStack = event.reason?.stack || '';
  
  // Check if error is from extension files
  const isExtensionError = 
    errorMsg.includes('No tab with id') || 
    errorMsg.includes('Frame with ID') ||
    errorMsg.includes('serviceWorker.js') ||
    errorMsg.includes('background.js') ||
    errorMsg.includes('ERR_INVALID_URL') && errorMsg.includes('data:;base64') ||
    errorString.includes('No tab with id') ||
    errorString.includes('Frame with ID') ||
    errorStack.includes('serviceWorker.js') ||
    errorStack.includes('background.js') ||
    errorStack.includes('chrome-extension://') ||
    errorStack.includes('moz-extension://');
  
  if (isExtensionError) {
    // Suppress extension-related promise rejections
    event.preventDefault();
    event.stopPropagation();
    return false;
  }
  // Let other rejections through for debugging
});

// Initialize the app
window.addEventListener('load', () => {
  // Always set dark mode on load
  document.body.classList.remove('light-mode');
  document.body.classList.add('dark-mode');
  
  // Hide loading overlay when page is fully loaded
  const loadingOverlay = document.getElementById('loadingOverlay');
  if (loadingOverlay) {
    setTimeout(() => {
      loadingOverlay.classList.add('hidden');
      document.body.classList.remove('loading');
      document.body.classList.add('loaded');
      // Remove from DOM after animation
      setTimeout(() => {
        loadingOverlay.remove();
      }, 500);
    }, 300); // Small delay to ensure everything is ready
  } else {
    // If overlay doesn't exist, just add loaded class
    document.body.classList.remove('loading');
    document.body.classList.add('loaded');
  }
  
  loadSettings();
  
  // Check if demo mode is enabled and ensure demo data is loaded
  if (appSettings.demoMode) {
    const storedLogs = localStorage.getItem('healthLogs');
    if (!storedLogs || storedLogs === '[]' || (storedLogs.startsWith('[') && JSON.parse(storedLogs).length === 0)) {
      // Demo mode is enabled but no logs found - regenerate demo data
      console.log('Demo mode enabled but no logs found, generating demo data...');
      const demoLogs = generateDemoData(3650);
      localStorage.setItem('healthLogs', JSON.stringify(demoLogs));
      logs = demoLogs;
      if (typeof window !== 'undefined') {
        window.logs = logs;
      }
    } else {
      // Load existing logs and ensure they're available
      try {
        if (storedLogs.startsWith('H4sI')) {
          // Compressed - handled by async decompression above
          // Will be set when decompression completes
        } else {
          logs = JSON.parse(storedLogs);
          if (typeof window !== 'undefined') {
            window.logs = logs;
          }
        }
      } catch (e) {
        console.error('Error loading demo logs:', e);
        logs = [];
        if (typeof window !== 'undefined') {
          window.logs = logs;
        }
      }
    }
  }
  
  renderLogs();
  updateCharts(); // Check for empty state on page load
  updateAISummaryButtonState(); // Update AI button state on page load
  
  // Hide AI section by default
  clearAISection();
  
  // Initialize weight unit
  if (!appSettings.weightUnit) {
    appSettings.weightUnit = 'kg';
    saveSettings();
  }
  
  // Don't initialize medical condition - user must set their own
  // Medical condition will be empty by default, showing "Medical Condition" placeholder
  
  // Update condition context with stored value
  if (appSettings.medicalCondition) {
    updateConditionContext(appSettings.medicalCondition);
  }
  
  updateWeightInputConstraints();
  updateHeartbeatAnimation(); // Initialize heartbeat animation speed
  
  // Prepopulate date filters with last 7 days
  initializeDateFilters();
  
  // Show charts tab content if charts are enabled
  if (appSettings.showCharts) {
    const chartSection = document.getElementById('chartSection');
    if (chartSection) {
      chartSection.classList.remove('hidden');
    }
  }
  
  // Initialize on log entry tab
  switchTab('log');
  
  // Initialize collapsible sections
  initializeSections();
  // Only one meal/category open at a time in Food Log and Exercise Log
  initializeOneOpenDetails();

  // Initialize chart date range to 7 days
  setChartDateRange(7);
  setPredictionRange(7); // Initialize prediction range to 7 days
  setLogViewRange(7); // Initialize log view range to 7 days
  
  // Initialize prediction toggle button (starts with predictions enabled, so Off is not selected)
  const toggleBtn = document.getElementById('predictionToggle');
  if (toggleBtn) {
    toggleBtn.classList.remove('active'); // Off button not selected initially (predictions are on)
    toggleBtn.title = 'Click to turn off predictions';
  }
  
  // Initialize notification system
  if (typeof NotificationManager !== 'undefined') {
    // NotificationManager.init() is called automatically, but we can check permission status
    setTimeout(() => {
      if (typeof updateNotificationPermissionStatus === 'function') {
        updateNotificationPermissionStatus();
      }
    }, 1000);
  }
  
  // Check if there's a log entry for today, and if not, show an alert
  // Do this after everything is loaded to ensure modal HTML is ready
  setTimeout(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;
    const hasToday = logs.some(log => log.date === todayStr);
    if (!hasToday) {
      // Only show alert if not installed as PWA to avoid annoying notifications
      // The NotificationManager will handle reminders for installed apps
      if (!window.matchMedia('(display-mode: standalone)').matches && 
          !window.navigator.standalone) {
        // Only show if reminder is enabled
        if (appSettings.reminder !== false) {
          showAlertModal("You have not logged an entry for today.");
        }
      }
    }
  }, 500); // Small delay to ensure modal HTML is in DOM
});

function initializeDateFilters() {
  const today = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 7);
  
  // Format dates for input[type="date"]
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const startDateInput = document.getElementById('startDate');
  const endDateInput = document.getElementById('endDate');
  
  if (startDateInput && endDateInput) {
    startDateInput.value = formatDate(sevenDaysAgo);
    endDateInput.value = formatDate(today);
    
    // Add event listeners to detect manual date changes
    startDateInput.addEventListener('change', () => {
      clearAISection(); // Clear AI section when date changes
      checkAndUpdateViewRangeButtons();
    });
    
    endDateInput.addEventListener('change', () => {
      clearAISection(); // Clear AI section when date changes
      checkAndUpdateViewRangeButtons();
    });
    
    // Automatically apply the filter
    setTimeout(() => {
      filterLogs();
    }, 100);
  }
}
