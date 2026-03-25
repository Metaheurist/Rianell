// ============================================
// Static host detection (no /api on this origin: skip reload stream and server logging)
// Only localhost / 127.0.0.1 run the Python dev server with /api/reload and /api/log.
// Production (e.g. rianell.com) must be treated as static so we do not GET /api/reload (404).
// ============================================
function isStaticHost() {
  try {
    const h = (typeof window !== 'undefined' && window.location && window.location.hostname) ? window.location.hostname.toLowerCase() : '';
    if (!h) return true;
    if (h === 'localhost' || h === '127.0.0.1' || h === '[::1]') return false;
    return true;
  } catch (e) {
    return true;
  }
}

/** True when UI runs in the Capacitor shell (APK / iOS): top-level WebView or legacy iframe inside React shell (web preview). */
function isRianellNativeApp() {
  try {
    var c = window.Capacitor;
    if (c && typeof c.isNativePlatform === 'function' && c.isNativePlatform()) return true;
    if (window.__rianellCapacitorNative) return true;
    if (window.parent && window.parent !== window && window.parent.__rianellCapacitorNative) return true;
  } catch (e) {}
  return false;
}
window.isRianellNativeApp = isRianellNativeApp;

/* First-paint: sync work here stays small (host detection, storage migration); charts/ML/export load via PerformanceUtils lazy loaders. */

/**
 * Mobile web / PWA: request portrait where Screen Orientation API allows (often needs user gesture).
 * Native Android/iOS shells use manifest / Info.plist; skip here to avoid redundant work.
 */
function tryLockPortraitOrientationMobile() {
  try {
    if (typeof isRianellNativeApp === 'function' && isRianellNativeApp()) return;
    if (typeof window === 'undefined' || typeof screen === 'undefined') return;
    var narrow = false;
    try {
      narrow = window.matchMedia('(max-width: 1024px)').matches;
    } catch (e) {}
    var ua = (typeof navigator !== 'undefined' && navigator.userAgent) ? navigator.userAgent : '';
    var mobileUa = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    if (!narrow && !mobileUa) return;
    var o = screen.orientation;
    if (!o || typeof o.lock !== 'function') return;
    var lock = function () {
      try {
        o.lock('portrait').catch(function () {});
      } catch (e) {}
    };
    lock();
    var once = function () {
      lock();
      document.removeEventListener('touchstart', once, true);
      document.removeEventListener('click', once, true);
    };
    document.addEventListener('touchstart', once, true);
    document.addEventListener('click', once, true);
  } catch (e) {}
}

// One-time localStorage migration (healthApp* → rianell*) for existing users
(function migrateLegacyHealthAppStorageKeys() {
  try {
    if (typeof localStorage === 'undefined') return;
    var pairs = [
      ['healthAppSettings_compressed', 'rianellSettings_compressed'],
      ['healthAppPredictionState', 'rianellPredictionState'],
      ['healthAppInstallModalAfterTutorialSeen', 'rianellInstallModalAfterTutorialSeen'],
      ['healthAppFrequentOptions', 'rianellFrequentOptions'],
      ['healthAppEnableStaticSW', 'rianellEnableStaticSW'],
      ['healthAppPerfLongTasks', 'rianellPerfLongTasks'],
      ['healthAppTutorialSeen', 'rianellTutorialSeen'],
      ['healthAppCookieConsent', 'rianellCookieConsent'],
      ['healthAppGoals', 'rianellGoals'],
      ['healthAppSettings', 'rianellSettings'],
      ['healthAppDebug', 'rianellDebug'],
      ['healthAppLocalEncryptionKeyHex', 'rianellLocalEncryptionKeyHex']
    ];
    pairs.forEach(function (p) {
      var oldK = p[0];
      var newK = p[1];
      if (localStorage.getItem(newK) != null) return;
      var v = localStorage.getItem(oldK);
      if (v != null) {
        localStorage.setItem(newK, v);
        localStorage.removeItem(oldK);
      }
    });
  } catch (e) {}
})();

// Optional verbose debug (localStorage.rianellDebug === 'true' or ?debug=1)
try {
  window.rianellDebug = (typeof localStorage !== 'undefined' && localStorage.getItem('rianellDebug') === 'true') ||
    (typeof URLSearchParams !== 'undefined' && window.location && new URLSearchParams(window.location.search).get('debug') === '1');
  window.healthAppDebug = window.rianellDebug; // deprecated alias
} catch (e) {
  window.rianellDebug = false;
  window.healthAppDebug = false;
}

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
      const savedSettings = localStorage.getItem('rianellSettings');
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
    
    // Only send to server if demo mode is enabled and we're not on a static host (no /api)
    if (!this._getDemoMode() || isStaticHost()) {
      return; // Skip server logging when not in demo mode or on GitHub Pages etc.
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

const bugReportConsoleBuffer = [];
const BUG_REPORT_CONSOLE_LIMIT = 120;
var bugReportConsoleCaptureInstalled = false;

function stringifyConsoleArg(arg) {
  if (typeof arg === 'string') return arg;
  if (arg instanceof Error) return (arg.stack || (arg.name + ': ' + arg.message));
  try {
    return JSON.stringify(arg);
  } catch (e) {
    return String(arg);
  }
}

function captureBugReportConsoleEvent(level, args) {
  try {
    bugReportConsoleBuffer.push({
      timestamp: new Date().toISOString(),
      level: level,
      message: Array.prototype.map.call(args || [], stringifyConsoleArg).join(' ')
    });
    if (bugReportConsoleBuffer.length > BUG_REPORT_CONSOLE_LIMIT) {
      bugReportConsoleBuffer.splice(0, bugReportConsoleBuffer.length - BUG_REPORT_CONSOLE_LIMIT);
    }
  } catch (e) {}
}

function installBugReportConsoleCapture() {
  if (bugReportConsoleCaptureInstalled || typeof console === 'undefined') return;
  ['log', 'info', 'warn', 'error'].forEach(function(method) {
    if (typeof console[method] !== 'function') return;
    var original = console[method].bind(console);
    console[method] = function() {
      captureBugReportConsoleEvent(method.toUpperCase(), arguments);
      original.apply(console, arguments);
    };
  });
  bugReportConsoleCaptureInstalled = true;
}
installBugReportConsoleCapture();

function getBugReportConsoleOutput() {
  var lines = bugReportConsoleBuffer.map(function(entry) {
    return '[' + entry.timestamp + '] [' + entry.level + '] ' + entry.message;
  });
  return lines.join('\n');
}

// ============================================
// Helper: Close Settings Modal
// ============================================
function closeSettingsModalIfOpen() {
  const settingsOverlay = document.getElementById('settingsOverlay');
  if (!settingsOverlay) return;
  const isOpen = settingsOverlay.classList.contains('settings-overlay--open') || settingsOverlay.style.display === 'flex' || settingsOverlay.style.display === 'block';
  if (!isOpen) return;
  if (typeof captureSettingsModalCarouselState === 'function') captureSettingsModalCarouselState(settingsOverlay);
  else {
    const settingsContent = settingsOverlay.querySelector('.settings-content');
    if (settingsContent) window.settingsModalScrollPosition = settingsContent.scrollTop;
  }
  const conditionSelector = document.getElementById('medicalConditionSelector');
  if (conditionSelector) window.settingsModalConditionSelectorOpen = conditionSelector.style.display !== 'none';
  if (typeof closeSettings === 'function') {
    closeSettings();
  } else if (typeof toggleSettings === 'function') {
    toggleSettings();
  } else {
    if (typeof settingsOverlaySetOpen === 'function') settingsOverlaySetOpen(settingsOverlay, false);
    else {
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
// Voice input (speech-to-text) for text fields
// ============================================
var _voiceInputObserver = null;
var _voiceInputActive = null;
var _voiceInputSupported = false;
var _voiceInputPermissionState = 'unknown';

function isVoiceInputEligibleField(el) {
  if (!el || el.disabled || el.readOnly) return false;
  if (el.dataset && el.dataset.noVoiceInput === 'true') return false;
  if (el.tagName === 'TEXTAREA') return true;
  if (el.tagName !== 'INPUT') return false;
  var t = (el.type || 'text').toLowerCase();
  if (t === 'password') return false;
  return t === 'text' || t === 'search' || t === 'email' || t === 'url' || t === 'tel';
}

function ensureVoiceInputButton(field) {
  if (!isVoiceInputEligibleField(field)) return;
  if (field.closest('.voice-input-host')) return;

  var host = document.createElement('span');
  host.className = 'voice-input-host';
  field.parentNode.insertBefore(host, field);
  host.appendChild(field);

  var btn = document.createElement('span');
  btn.className = 'voice-input-btn';
  btn.setAttribute('role', 'button');
  btn.setAttribute('tabindex', '0');
  btn.setAttribute('aria-label', 'Use voice input');
  btn.setAttribute('title', _voiceInputSupported ? 'Voice input' : 'Voice input not supported in this browser');
  btn.innerHTML = '<span class="voice-input-btn__icon" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false" aria-hidden="true"><path fill="currentColor" d="M12 14a3 3 0 0 0 3-3V7a3 3 0 0 0-6 0v4a3 3 0 0 0 3 3Zm5-3a1 1 0 1 0-2 0 3 3 0 0 1-6 0 1 1 0 1 0-2 0 5.01 5.01 0 0 0 4 4.9V19H9a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2h-2v-3.1A5.01 5.01 0 0 0 17 11Z"/></svg></span>';
  if (!_voiceInputSupported) {
    btn.classList.add('voice-input-btn--disabled');
    btn.setAttribute('aria-disabled', 'true');
    btn.setAttribute('tabindex', '-1');
  }
  btn.addEventListener('click', function() {
    if (!_voiceInputSupported) return;
    toggleVoiceInputForField(field, btn);
  });
  btn.addEventListener('keydown', function(e) {
    if (!_voiceInputSupported) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleVoiceInputForField(field, btn);
    }
  });
  host.appendChild(btn);
}

function setFieldValueFromVoice(field, text) {
  var base = String(field.dataset.voiceBaseValue || '');
  var next = (base ? (base + ' ') : '') + text.trim();
  field.value = next.trim();
  field.dispatchEvent(new Event('input', { bubbles: true }));
}

function clearVoiceActiveState() {
  if (!_voiceInputActive) return;
  if (_voiceInputActive.button) _voiceInputActive.button.classList.remove('voice-input-btn--active');
  if (_voiceInputActive.field) _voiceInputActive.field.classList.remove('voice-input-target--active');
  _voiceInputActive = null;
}

async function ensureVoiceInputPermission() {
  try {
    // Capacitor/community speech plugins (if present) should handle native permission prompts.
    var cap = (typeof window !== 'undefined' && window.Capacitor && window.Capacitor.Plugins) ? window.Capacitor.Plugins : null;
    var speechPlugin = cap && cap.SpeechRecognition ? cap.SpeechRecognition : null;
    if (speechPlugin) {
      try {
        if (typeof speechPlugin.checkPermissions === 'function') {
          var perms = await speechPlugin.checkPermissions();
          if (perms && (perms.speechRecognition === 'granted' || perms.microphone === 'granted')) {
            _voiceInputPermissionState = 'granted';
            return true;
          }
          if (typeof speechPlugin.requestPermissions === 'function') {
            var requested = await speechPlugin.requestPermissions();
            var granted = requested && (
              requested.speechRecognition === 'granted' ||
              requested.microphone === 'granted'
            );
            _voiceInputPermissionState = granted ? 'granted' : 'denied';
            if (granted) return true;
          }
        } else if (typeof speechPlugin.hasPermission === 'function') {
          var hasPerm = await speechPlugin.hasPermission();
          if (hasPerm === true || (hasPerm && hasPerm.value === true)) {
            _voiceInputPermissionState = 'granted';
            return true;
          }
          if (typeof speechPlugin.requestPermission === 'function') {
            var reqPerm = await speechPlugin.requestPermission();
            var ok = reqPerm === true || (reqPerm && reqPerm.value === true);
            _voiceInputPermissionState = ok ? 'granted' : 'denied';
            if (ok) return true;
          }
        }
      } catch (e) {}
    }

    if (typeof navigator === 'undefined') return false;
    var mediaDevices = navigator.mediaDevices;
    if (!mediaDevices || typeof mediaDevices.getUserMedia !== 'function') {
      // Some engines expose SpeechRecognition without mediaDevices API.
      return true;
    }

    // Fast-path via Permissions API when available
    try {
      if (navigator.permissions && typeof navigator.permissions.query === 'function') {
        var p = await navigator.permissions.query({ name: 'microphone' });
        if (p && p.state === 'granted') {
          _voiceInputPermissionState = 'granted';
          return true;
        }
        if (p && p.state === 'denied') {
          _voiceInputPermissionState = 'denied';
          return false;
        }
      }
    } catch (e) {}

    // Request permission on user gesture.
    var stream = await mediaDevices.getUserMedia({ audio: true });
    try {
      if (stream && stream.getTracks) {
        stream.getTracks().forEach(function(track) { try { track.stop(); } catch (e) {} });
      }
    } catch (e) {}
    _voiceInputPermissionState = 'granted';
    return true;
  } catch (e) {
    _voiceInputPermissionState = 'denied';
    return false;
  }
}

function showVoiceInputPermissionHelp() {
  if (typeof showAlertModal === 'function') {
    showAlertModal('Microphone permission is required for voice input. Please allow microphone access in your browser/app settings and try again.', 'Voice Input');
  }
}

async function toggleVoiceInputForField(field, button) {
  var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    if (typeof showAlertModal === 'function') {
      showAlertModal('Speech-to-text is not supported on this platform/webview yet.', 'Voice Input');
    }
    return;
  }

  if (_voiceInputActive && _voiceInputActive.field === field) {
    try { _voiceInputActive.recognition.stop(); } catch (e) {}
    clearVoiceActiveState();
    return;
  }
  if (_voiceInputActive && _voiceInputActive.recognition) {
    try { _voiceInputActive.recognition.stop(); } catch (e) {}
    clearVoiceActiveState();
  }

  if (button) {
    button.setAttribute('aria-busy', 'true');
    button.style.pointerEvents = 'none';
  }
  var hasPermission = await ensureVoiceInputPermission();
  if (button) {
    button.removeAttribute('aria-busy');
    button.style.pointerEvents = '';
  }
  if (!hasPermission) {
    showVoiceInputPermissionHelp();
    return;
  }

  var recognition = new SpeechRecognition();
  recognition.lang = (navigator.language || 'en-GB');
  recognition.interimResults = true;
  recognition.continuous = false;
  recognition.maxAlternatives = 1;

  field.dataset.voiceBaseValue = (field.value || '').trim();
  var finalText = '';

  recognition.onresult = function(event) {
    var interimText = '';
    for (var i = event.resultIndex; i < event.results.length; i++) {
      var chunk = String(event.results[i][0].transcript || '').trim();
      if (!chunk) continue;
      if (event.results[i].isFinal) finalText += (finalText ? ' ' : '') + chunk;
      else interimText += (interimText ? ' ' : '') + chunk;
    }
    var merged = (finalText + (interimText ? (' ' + interimText) : '')).trim();
    if (merged) setFieldValueFromVoice(field, merged);
  };

  recognition.onerror = function(event) {
    var err = event && event.error ? String(event.error) : '';
    if (err === 'not-allowed' || err === 'service-not-allowed') {
      _voiceInputPermissionState = 'denied';
      showVoiceInputPermissionHelp();
    } else if (err === 'audio-capture' && typeof showAlertModal === 'function') {
      showAlertModal('No microphone detected. Connect a microphone and try again.', 'Voice Input');
    }
    clearVoiceActiveState();
  };
  recognition.onend = function() {
    clearVoiceActiveState();
  };

  _voiceInputActive = { field: field, button: button, recognition: recognition };
  button.classList.add('voice-input-btn--active');
  field.classList.add('voice-input-target--active');
  try {
    recognition.start();
  } catch (e) {
    clearVoiceActiveState();
  }
}

function enhanceVoiceInputFields(scope) {
  var root = scope || document;
  if (!root || !root.querySelectorAll) return;
  root.querySelectorAll('input, textarea').forEach(function(field) {
    ensureVoiceInputButton(field);
  });
}

function initVoiceInputControls() {
  if (typeof document === 'undefined') return;
  var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  _voiceInputSupported = !!SpeechRecognition;
  enhanceVoiceInputFields(document);
  if (_voiceInputObserver) return;
  _voiceInputObserver = new MutationObserver(function(mutations) {
    mutations.forEach(function(m) {
      m.addedNodes.forEach(function(node) {
        if (!node || node.nodeType !== 1) return;
        if (node.matches && (node.matches('input') || node.matches('textarea'))) {
          ensureVoiceInputButton(node);
        } else {
          enhanceVoiceInputFields(node);
        }
      });
    });
  });
  _voiceInputObserver.observe(document.body, { childList: true, subtree: true });
}

// ============================================
// Custom Alert Modal
// ============================================
function showAlertModal(message, title = 'Alert', onClose) {
  const overlay = document.getElementById('alertModalOverlay');
  const titleEl = document.getElementById('alertModalTitle');
  const messageEl = document.getElementById('alertModalMessage');
  
  if (!overlay || !titleEl || !messageEl) {
    // Fallback to native alert if modal elements not found
    Logger.warn('Alert modal elements not found, using native alert');
    alert(message);
    if (typeof onClose === 'function') onClose();
    return;
  }
  
  // Close settings modal if open
  closeSettingsModalIfOpen();
  
  // Set content
  titleEl.textContent = title;
  messageEl.textContent = message;
  
  // OK button: optional callback then close
  const okBtn = overlay.querySelector('.modal-save-btn');
  if (okBtn) {
    okBtn.onclick = function() {
      if (typeof onClose === 'function') onClose();
      closeAlertModal();
    };
  }
  
  // Show modal
  overlay.style.display = 'block';
  overlay.style.visibility = 'visible';
  overlay.style.opacity = '1';
  overlay.style.zIndex = '100001'; // Higher than settings modal (100000)
  document.body.classList.add('modal-active');
  
  // Centre modal
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
      if (typeof onClose === 'function') onClose();
      closeAlertModal();
    }
  };
  
  // Close on Escape key
  const escapeHandler = function(e) {
    if (e.key === 'Escape') {
      if (typeof onClose === 'function') onClose();
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

// Run a critical-path task with high scheduler priority when available (Chrome); else defer once. Returns a Promise that resolves with fn()'s return value (flattens if fn returns a Promise).
function runCriticalTask(fn) {
  var run = function () { return fn(); };
  var p;
  if (typeof globalThis !== 'undefined' && globalThis.scheduler && typeof globalThis.scheduler.postTask === 'function') {
    p = globalThis.scheduler.postTask(run, { priority: 'user-blocking' }).catch(function () { return run(); });
  } else {
    p = new Promise(function (resolve) { setTimeout(function () { resolve(run()); }, 0); });
  }
  return p.then(function (x) { return (x && typeof x.then === 'function') ? x : Promise.resolve(x); });
}

// ============================================
// Performance benchmark modal
// ============================================
let _perfBenchmarkEscapeHandler = null;

/** Expandable benchmark details (test bars, CPU/GPU stability, profile JSON): show only on desktop-width viewports. */
function isBenchmarkDetailsDesktopViewport() {
  try {
    if (typeof window.matchMedia === 'undefined') return true;
    return window.matchMedia('(min-width: 1024px)').matches;
  } catch (e) {
    return true;
  }
}

function closePerfBenchmarkModal() {
  if (_perfBenchmarkEscapeHandler) {
    document.removeEventListener('keydown', _perfBenchmarkEscapeHandler);
    _perfBenchmarkEscapeHandler = null;
  }
  const overlay = document.getElementById('perfBenchmarkOverlay');
  if (overlay) {
    overlay.style.display = 'none';
    overlay.style.visibility = 'hidden';
    overlay.style.opacity = '0';
    overlay.style.removeProperty('z-index');
    document.body.classList.remove('modal-active');
    document.body.style.overflow = '';
  }
}

function openPerfBenchmarkModal(options) {
  const overlay = document.getElementById('perfBenchmarkOverlay');
  const titleEl = document.getElementById('perfBenchmarkTitle');
  const summaryEl = document.getElementById('perfBenchmarkSummary');
  const barsEl = document.getElementById('perfBenchmarkBars');
  const sparkEl = document.getElementById('perfBenchmarkSparkline');
  const statsEl = document.getElementById('perfBenchmarkStats');
  const profileEl = document.getElementById('perfBenchmarkProfile');
  const continueBtn = document.getElementById('perfBenchmarkContinueBtn');
  const closeBtn = overlay ? overlay.querySelector('.modal-close') : null;
  if (!overlay || !summaryEl || !barsEl || !profileEl || !continueBtn) {
    if (typeof Logger !== 'undefined' && Logger.warn) {
      Logger.warn('Performance benchmark modal: missing DOM nodes');
    }
    return false;
  }

  const mode = options && options.mode ? options.mode : 'view';
  const result = options && options.result ? options.result : null;

  // Close settings modal if open
  closeSettingsModalIfOpen();

  if (titleEl) titleEl.textContent = mode === 'firstRun' ? 'Performance & AI benchmark' : 'Performance & AI benchmark (last run)';

  const platformType = result && result.platformType ? result.platformType : 'unknown';
  const tier = result && typeof result.tier === 'number' ? result.tier : null;
  const score = result && typeof result.score === 'number' ? result.score : null;
  const totalMs = result && typeof result.totalMs === 'number' ? result.totalMs : null;
  const repeats = result && typeof result.repeats === 'number' ? result.repeats : null;
  const deviceClass = (typeof window !== 'undefined' && window.DeviceBenchmark && typeof window.DeviceBenchmark.getLegacyDeviceClass === 'function' && tier != null)
    ? window.DeviceBenchmark.getLegacyDeviceClass(tier)
    : 'medium';

  const env = result && result.env ? result.env : {};
  const full = (tier != null && typeof window !== 'undefined' && window.DeviceBenchmark && typeof window.DeviceBenchmark.getFullProfile === 'function')
    ? window.DeviceBenchmark.getFullProfile(platformType, tier, { saveData: !!env.saveData, prefersReducedMotion: !!env.prefersReducedMotion })
    : null;
  const llmSize = (full && full.llmModelSize) ? full.llmModelSize : (deviceClass === 'low' ? 'tier1' : deviceClass === 'high' ? 'tier5' : 'tier3');
  const llmDisplay = (llmSize && String(llmSize).indexOf('tier') === 0) ? 'Tier ' + String(llmSize).replace('tier', '') : llmSize;

  summaryEl.textContent = tier == null
    ? 'No benchmark result found.'
    : `Device: ${platformType} · Tier: ${tier} · Class: ${deviceClass} · Recommended AI model: ${llmDisplay}`;

  const aiLineEl = document.getElementById('perfBenchmarkAiLine');
  if (aiLineEl) aiLineEl.textContent = tier != null ? (llmDisplay ? `This device can run up to ${llmDisplay}.` : '') : '';

  const gpuLineEl = document.getElementById('perfBenchmarkGpuLine');
  if (gpuLineEl) {
    var gpu = result && result.gpu ? result.gpu : null;
    if (gpu && gpu.available && gpu.backend && gpu.backend !== 'none') {
      gpuLineEl.textContent = 'GPU: ' + (gpu.backend === 'webgpu' ? 'WebGPU' : gpu.backend === 'webgl' ? 'WebGL' : gpu.backend) + ' available, used for AI.';
    } else {
      gpuLineEl.textContent = tier != null ? 'GPU: Not available (using CPU for AI).' : '';
    }
  }

  // Bars: per-test medianMs (smaller is better → longer bar)
  barsEl.innerHTML = '';
  const tests = result && Array.isArray(result.tests) ? result.tests : [];
  if (tests.length) {
    const msVals = tests.map(t => (typeof t.medianMs === 'number' ? t.medianMs : (typeof t.meanMs === 'number' ? t.meanMs : 0))).filter(v => v > 0);
    const minMs = msVals.length ? Math.min.apply(null, msVals) : 0;
    const maxMs = msVals.length ? Math.max.apply(null, msVals) : 0;
    tests.forEach(t => {
      const ms = (typeof t.medianMs === 'number' && t.medianMs > 0) ? t.medianMs : (typeof t.meanMs === 'number' ? t.meanMs : 0);
      const denom = (maxMs - minMs) || 1;
      const norm = ms > 0 ? (1 - ((ms - minMs) / denom)) : 0;
      const widthPct = Math.max(6, Math.min(100, Math.round(norm * 100)));

      const row = document.createElement('div');
      row.className = 'perf-benchmark-bar-row';
      row.innerHTML = `
        <div class="perf-benchmark-bar-label" title="${t.label || t.id}">${t.label || t.id}</div>
        <div class="perf-benchmark-bar-track"><div class="perf-benchmark-bar-fill" style="width:${widthPct}%;"></div></div>
        <div class="perf-benchmark-bar-value">${ms ? ms.toFixed(1) + 'ms' : '-'}</div>
      `;
      barsEl.appendChild(row);
    });
  } else {
    const empty = document.createElement('div');
    empty.style.opacity = '0.8';
    empty.textContent = 'No per-test breakdown available (older cached result). Clear benchmark cache in God mode (` key) and reload to run a full benchmark.';
    barsEl.appendChild(empty);
  }

  // Stats + sparkline (CPU msPer200k samples)
  if (statsEl) statsEl.innerHTML = '';
  const cpu = result && result.cpu ? result.cpu : null;
  const cpuSamples = cpu && Array.isArray(cpu.msPer200kSamples) ? cpu.msPer200kSamples : [];
  if (statsEl && tier != null) {
    // Use cached env but fill missing fields from current device (so old cache still shows live OS/cores/etc.)
    const env = result && result.env ? Object.assign({}, result.env) : {};
    const dm = (typeof window !== 'undefined' && window.DeviceModule && window.DeviceModule.platform) ? window.DeviceModule.platform : null;
    const nav = typeof navigator !== 'undefined' ? navigator : {};
    if (env.cores == null) env.cores = (dm && dm.cores != null) ? dm.cores : (typeof nav.hardwareConcurrency === 'number' ? nav.hardwareConcurrency : null);
    if (env.deviceMemory == null && dm && dm.deviceMemory != null) env.deviceMemory = dm.deviceMemory;
    if (!env.estimatedMemoryBucket && dm && dm.estimatedMemoryBucket) env.estimatedMemoryBucket = dm.estimatedMemoryBucket;
    if (!env.osName && dm && dm.osName) env.osName = dm.osName;
    if (!env.osVersion && dm && dm.osVersion) env.osVersion = dm.osVersion;
    if (!env.deviceType && dm && dm.deviceType) env.deviceType = dm.deviceType;
    if (!env.deviceVendor && dm && dm.deviceVendor) env.deviceVendor = dm.deviceVendor;
    if (!env.deviceModel && dm && dm.deviceModel) env.deviceModel = dm.deviceModel;
    if (!env.cpuArchitecture && dm && dm.cpuArchitecture) env.cpuArchitecture = dm.cpuArchitecture;
    const osDisplay = (env.osName && env.osVersion) ? `${env.osName} ${env.osVersion}` : (env.osName || env.osVersion || '-');
    const deviceDisplay = [env.deviceVendor, env.deviceModel].filter(Boolean).join(' ') || (env.deviceType || '-');
    const memoryDisplay = env.deviceMemory != null ? String(env.deviceMemory) + ' GB' : (env.estimatedMemoryBucket ? `estimated: ${env.estimatedMemoryBucket}` : '-');
    const kv = [
      ['Class', deviceClass],
      ['Repeats', repeats != null ? String(repeats) : '-'],
      ['Cores', env.cores != null ? String(env.cores) : '-'],
      ['Memory', memoryDisplay],
      ['OS', osDisplay],
      ['Device', deviceDisplay],
      ['CPU', env.cpuArchitecture || '-']
    ];
    kv.forEach(pair => {
      const div = document.createElement('div');
      div.innerHTML = `<span>${pair[0]}</span><span>${pair[1]}</span>`;
      statsEl.appendChild(div);
    });
  }

  if (sparkEl && sparkEl.getContext) {
    const ctx = sparkEl.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, sparkEl.width, sparkEl.height);
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fillRect(0, 0, sparkEl.width, sparkEl.height);
      ctx.strokeStyle = 'rgba(76,175,80,0.95)';
      ctx.lineWidth = 2;

      if (cpuSamples && cpuSamples.length >= 2) {
        const pad = 10;
        const w = sparkEl.width - pad * 2;
        const h = sparkEl.height - pad * 2;
        const minV = Math.min.apply(null, cpuSamples);
        const maxV = Math.max.apply(null, cpuSamples);
        const denom = (maxV - minV) || 1;
        ctx.beginPath();
        for (let i = 0; i < cpuSamples.length; i++) {
          const x = pad + (i / (cpuSamples.length - 1)) * w;
          const y = pad + (1 - ((cpuSamples[i] - minV) / denom)) * h;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.fillStyle = 'rgba(76,175,80,0.18)';
        ctx.lineTo(pad + w, pad + h);
        ctx.lineTo(pad, pad + h);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillStyle = 'rgba(224,242,241,0.7)';
        ctx.font = '14px system-ui, -apple-system, Segoe UI, Roboto, Arial';
        ctx.fillText('No stability samples', 14, 26);
      }
    }
  }

  const gpuSparkEl = document.getElementById('perfBenchmarkGpuSparkline');
  const gpuStatsEl = document.getElementById('perfBenchmarkGpuStats');
  const gpuSamples = result && result.gpu && Array.isArray(result.gpu.scoreSamples) ? result.gpu.scoreSamples : [];
  const gpuAvailable = result && result.gpu && result.gpu.available && result.gpu.backend && result.gpu.backend !== 'none';
  if (gpuStatsEl) {
    gpuStatsEl.innerHTML = '';
    if (gpuAvailable) {
      const backendLabel = result.gpu.backend === 'webgpu' ? 'WebGPU' : result.gpu.backend === 'webgl' ? 'WebGL' : result.gpu.backend;
      const meanMs = gpuSamples.length ? (gpuSamples.reduce((a, b) => a + b, 0) / gpuSamples.length).toFixed(2) : '-';
      const kv = [
        ['Backend', backendLabel],
        ['Samples', gpuSamples.length ? String(gpuSamples.length) : '0'],
        ['Mean', meanMs !== '-' ? meanMs + ' ms' : '-']
      ];
      kv.forEach(pair => {
        const div = document.createElement('div');
        div.innerHTML = `<span>${pair[0]}</span><span>${pair[1]}</span>`;
        gpuStatsEl.appendChild(div);
      });
      if (gpuSamples.length === 0) {
        const hint = document.createElement('div');
        hint.className = 'perf-benchmark-gpu-hint';
        hint.style.cssText = 'margin-top:6px;font-size:0.8rem;opacity:0.85;';
        hint.textContent = 'Clear benchmark cache (God mode `) and reload to see stability graph.';
        gpuStatsEl.appendChild(hint);
      }
    } else {
      const div = document.createElement('div');
      div.innerHTML = '<span>GPU</span><span>Not available</span>';
      gpuStatsEl.appendChild(div);
    }
  }
  if (gpuSparkEl && gpuSparkEl.getContext) {
    const ctx = gpuSparkEl.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, gpuSparkEl.width, gpuSparkEl.height);
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fillRect(0, 0, gpuSparkEl.width, gpuSparkEl.height);
      ctx.strokeStyle = 'rgba(76,175,80,0.95)';
      ctx.lineWidth = 2;
      if (gpuSamples.length >= 2) {
        const pad = 10;
        const w = gpuSparkEl.width - pad * 2;
        const h = gpuSparkEl.height - pad * 2;
        const minV = Math.min.apply(null, gpuSamples);
        const maxV = Math.max.apply(null, gpuSamples);
        const denom = (maxV - minV) || 1;
        ctx.beginPath();
        for (let i = 0; i < gpuSamples.length; i++) {
          const x = pad + (i / (gpuSamples.length - 1)) * w;
          const y = pad + (1 - ((gpuSamples[i] - minV) / denom)) * h;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.fillStyle = 'rgba(76,175,80,0.18)';
        ctx.lineTo(pad + w, pad + h);
        ctx.lineTo(pad, pad + h);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillStyle = 'rgba(224,242,241,0.7)';
        ctx.font = '14px system-ui, -apple-system, Segoe UI, Roboto, Arial';
        const msg = !gpuAvailable ? 'GPU not available' : gpuSamples.length === 0 ? 'No stability samples (clear cache & reload for graph)' : 'No GPU stability samples';
        ctx.fillText(msg, 14, 26);
      }
    }
  }

  // Profile summary (key settings) – use full profile already computed above when available
  let profileSummary = null;
  try {
    if (full && tier != null) {
      profileSummary = {
        deviceClass: full.deviceClass,
        chartMaxPoints: full.chartMaxPoints,
        maxChartPoints: full.maxChartPoints,
        chartAnimation: full.chartAnimation,
        enableChartPreload: full.enableChartPreload,
        chartPreloadDelayMs: full.chartPreloadDelayMs,
        enableAIPreload: full.enableAIPreload,
        aiPreloadDelayMs: full.aiPreloadDelayMs,
        useWorkers: full.useWorkers,
        demoDataDays: full.demoDataDays,
        loadTimeoutMs: full.loadTimeoutMs,
        llmModelSize: full.llmModelSize,
        storageBatchDelayMs: full.storageBatchDelayMs,
        lazyChartStaggerMs: full.lazyChartStaggerMs,
        domCacheTtlMs: full.domCacheTtlMs
      };
    }
  } catch (e) {}
  profileEl.textContent = profileSummary ? JSON.stringify(profileSummary, null, 2) : 'Profile not available.';

  // Buttons and close behavior
  if (continueBtn) {
    continueBtn.textContent = mode === 'firstRun' ? 'Continue' : 'Close';
    continueBtn.onclick = function () {
      if (mode === 'firstRun' && result && typeof window !== 'undefined' && window.DeviceBenchmark && typeof window.DeviceBenchmark.saveBenchmarkResult === 'function') {
        window.DeviceBenchmark.saveBenchmarkResult(result);
      }
      closePerfBenchmarkModal();
      if (options && typeof options.onContinue === 'function') options.onContinue();
    };
  }
  if (closeBtn) closeBtn.style.display = (mode === 'firstRun') ? 'none' : '';

  overlay.onclick = function (e) {
    if (e.target !== overlay) return;
    if (mode !== 'firstRun') closePerfBenchmarkModal();
  };
  _perfBenchmarkEscapeHandler = function (e) {
    if (e.key === 'Escape') {
      if (mode !== 'firstRun') closePerfBenchmarkModal();
      document.removeEventListener('keydown', _perfBenchmarkEscapeHandler);
      _perfBenchmarkEscapeHandler = null;
    }
  };
  document.addEventListener('keydown', _perfBenchmarkEscapeHandler);

  /* Above #loadingOverlay (z-index 99999) so first-run benchmark is never stuck behind it */
  overlay.style.zIndex = '100000';
  overlay.style.display = 'block';
  overlay.style.visibility = 'visible';
  overlay.style.opacity = '1';
  document.body.classList.add('modal-active');
  document.body.style.overflow = 'hidden';
  return true;
}

function openBenchmarkDetails() {
  if (!isBenchmarkDetailsDesktopViewport()) {
    showAlertModal('Detailed benchmark results are only available on desktop (wider screen).', 'Performance');
    return;
  }
  const cached = (typeof window !== 'undefined' && window.DeviceBenchmark && typeof window.DeviceBenchmark.getCachedResult === 'function')
    ? window.DeviceBenchmark.getCachedResult()
    : null;
  if (!cached) {
    showAlertModal('No cached benchmark found. Run the benchmark by reloading the app (or clear the cache first).', 'Performance');
    return;
  }
  openPerfBenchmarkModal({ mode: 'view', result: cached });
}

// ============================================
// Share modal and share actions
// ============================================
let _shareModalEscapeHandler = null;

function closeShareModal() {
  if (_shareModalEscapeHandler) {
    document.removeEventListener('keydown', _shareModalEscapeHandler);
    _shareModalEscapeHandler = null;
  }
  const overlay = document.getElementById('shareModalOverlay');
  if (overlay) {
    overlay.style.display = 'none';
    overlay.style.visibility = 'hidden';
    overlay.style.opacity = '0';
    document.body.classList.remove('modal-active');
    document.body.style.overflow = '';
  }
}

function openShareModal(options) {
  const overlay = document.getElementById('shareModalOverlay');
  const titleEl = document.getElementById('shareModalTitle');
  const bodyEl = document.getElementById('shareModalBody');
  const footerEl = document.getElementById('shareModalFooter');
  if (!overlay || !bodyEl || !footerEl) return;

  const mode = options.mode || 'log';
  const payload = options.payload || {};

  if (titleEl) titleEl.textContent = options.title || 'Share';

  bodyEl.innerHTML = options.bodyHTML != null ? options.bodyHTML : '';
  footerEl.innerHTML = '';

  const addBtn = (label, onClick, primary = false, icon = null) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'share-modal-btn' + (primary ? ' share-modal-btn-primary' : '');
    if (icon) {
      const span = document.createElement('span');
      span.className = 'share-modal-btn-icon';
      span.innerHTML = icon;
      btn.appendChild(span);
    }
    const textSpan = document.createElement('span');
    textSpan.className = 'share-modal-btn-label';
    textSpan.textContent = label;
    btn.appendChild(textSpan);
    btn.onclick = () => { if (onClick) onClick(); };
    footerEl.appendChild(btn);
  };

  if (mode === 'log') {
    if (payload.emailHref) addBtn('Email', () => { window.location.href = payload.emailHref; }, true, '<i class="fa-solid fa-envelope" aria-hidden="true"></i>');
    if (payload.whatsappHref) addBtn('WhatsApp', () => { window.open(payload.whatsappHref, '_blank', 'noopener,noreferrer'); }, true, '<i class="fa-brands fa-whatsapp" aria-hidden="true"></i>');
    if (payload.downloadCSV) addBtn('Download CSV', payload.downloadCSV, true, '<i class="fa-solid fa-file-csv" aria-hidden="true"></i>');
  } else if (mode === 'chart') {
    if (payload.saveImage) addBtn('Save image', payload.saveImage, true, '<i class="fa-solid fa-file-image" aria-hidden="true"></i>');
    if (payload.shareToWhatsApp) addBtn('WhatsApp', payload.shareToWhatsApp, true, '<i class="fa-brands fa-whatsapp" aria-hidden="true"></i>');
  } else if (mode === 'ai') {
    if (payload.copyText) {
      addBtn('Copy', () => {
        navigator.clipboard.writeText(payload.copyText).then(() => {
          if (typeof showAlertModal === 'function') showAlertModal('Copied to clipboard. You can paste into email or any app.', 'Copied');
        }).catch(() => {
          if (typeof showAlertModal === 'function') showAlertModal('Could not copy. Use Email or WhatsApp instead.', 'Copy failed');
        });
      }, true, '<i class="fa-solid fa-copy" aria-hidden="true"></i>');
      if (payload.copyMarkdown) {
        addBtn('Copy as Markdown', () => {
          navigator.clipboard.writeText(payload.copyMarkdown).then(() => {
            if (typeof showAlertModal === 'function') showAlertModal('Markdown version copied to clipboard.', 'Copied');
          }).catch(() => {});
        }, false, '<i class="fa-solid fa-code" aria-hidden="true"></i>');
      }
    }
    if (payload.emailHref) addBtn('Email', () => { window.location.href = payload.emailHref; }, true, '<i class="fa-solid fa-envelope" aria-hidden="true"></i>');
    if (payload.whatsappHref) addBtn('WhatsApp', () => { window.open(payload.whatsappHref, '_blank', 'noopener,noreferrer'); }, true, '<i class="fa-brands fa-whatsapp" aria-hidden="true"></i>');
  }

  overlay.style.display = 'block';
  overlay.style.visibility = 'visible';
  overlay.style.opacity = '1';
  document.body.classList.add('modal-active');
  document.body.style.overflow = 'hidden';

  _shareModalEscapeHandler = function(e) {
    if (e.key === 'Escape') {
      closeShareModal();
      document.removeEventListener('keydown', _shareModalEscapeHandler);
      _shareModalEscapeHandler = null;
    }
  };
  document.addEventListener('keydown', _shareModalEscapeHandler);
  overlay.onclick = function(e) {
    if (e.target === overlay) closeShareModal();
  };
}

// Medical synopsis wording for email/WhatsApp shares (for care team or doctor)
var EMAIL_SYNOPSIS_INTRO = 'Health summary - for your care team or doctor.';
var EMAIL_ANALYSIS_INTRO = 'Health analysis summary - for discussion with your care team or doctor.';
var EMAIL_SYNOPSIS_FOOTER = 'Discuss with your doctor. This is not a substitute for professional medical advice.';

// Format a single log entry as plain text for email body (readable sections)
function formatLogEntryAsText(log) {
  if (!log) return '';
  const weightDisplay = typeof getWeightInDisplayUnit === 'function' ? getWeightInDisplayUnit(parseFloat(log.weight)) : log.weight;
  const weightUnit = typeof getWeightUnitSuffix === 'function' ? getWeightUnitSuffix() : 'kg';
  const sep = '\n';
  const lines = [
    'HEALTH LOG ENTRY',
    'Date: ' + (log.date || ''),
    '────────────────────────────────',
    '',
    'VITAL SIGNS',
    '  Heart rate: ' + (log.bpm || '-') + ' BPM',
    '  Weight: ' + (weightDisplay != null && weightDisplay !== '' ? weightDisplay : '-') + ' ' + (weightUnit || ''),
    '',
    'SYMPTOMS (1–10)',
    '  Fatigue: ' + (log.fatigue ?? '-'),
    '  Stiffness: ' + (log.stiffness ?? '-'),
    '  Back pain: ' + (log.backPain ?? '-'),
    '  Joint pain: ' + (log.jointPain ?? '-'),
    '  Swelling: ' + (log.swelling ?? '-'),
    '',
    'WELLBEING (1–10)',
    '  Sleep: ' + (log.sleep ?? '-'),
    '  Mood: ' + (log.mood ?? '-'),
    '  Irritability: ' + (log.irritability ?? '-'),
    '',
    'FUNCTION (1–10)',
    '  Mobility: ' + (log.mobility ?? '-'),
    '  Daily activities: ' + (log.dailyFunction ?? '-'),
    '',
    'FLARE',
    '  ' + (log.flare || '-')
  ];
  const foodItems = typeof getAllFoodItems === 'function' ? getAllFoodItems(log) : [];
  if (foodItems.length > 0) {
    lines.push('');
    lines.push('FOOD');
    foodItems.forEach(f => {
      lines.push('  • ' + (f.name || f) + (f.amount ? ' - ' + f.amount : ''));
    });
  }
  if (log.exercise && log.exercise.length > 0) {
    lines.push('');
    lines.push('EXERCISE');
    log.exercise.forEach(e => {
      const name = e.name || e;
      const dur = e.duration ? ' - ' + e.duration + ' min' : '';
      lines.push('  • ' + name + dur);
    });
  }
  if (log.notes && String(log.notes).trim()) {
    lines.push('');
    lines.push('NOTES');
    lines.push('  ' + String(log.notes).trim().replace(/\n/g, '\n  '));
  }
  return lines.join(sep);
}

// Single-row CSV for one log (same headers as exportToCSV)
function formatLogEntryAsCSV(log) {
  if (!log) return '';
  const headers = "Date,BPM,Weight,Fatigue,Stiffness,Back Pain,Sleep,Joint Pain,Mobility,Daily Function,Swelling,Flare,Mood,Irritability,Notes";
  const row = [
    log.date || '',
    log.bpm || '',
    log.weight || '',
    log.fatigue || '',
    log.stiffness || '',
    log.backPain || '',
    log.sleep || '',
    log.jointPain || '',
    log.mobility || '',
    log.dailyFunction || '',
    log.swelling || '',
    log.flare || '',
    log.mood || '',
    log.irritability || '',
    (log.notes || '').replace(/,/g, ';')
  ].join(',');
  return headers + "\n" + row;
}

// Get logs currently in View Logs range (same logic as filterLogs / toggleSort)
function getLogsInCurrentViewRange() {
  if (!logs || logs.length === 0) return [];
  const startDateInput = document.getElementById('startDate');
  const endDateInput = document.getElementById('endDate');
  const startDate = startDateInput && startDateInput.value ? startDateInput.value : null;
  const endDate = endDateInput && endDateInput.value ? endDateInput.value : null;

  if (startDate || endDate) {
    const start = startDate ? new Date(startDate) : new Date('1900-01-01');
    const end = endDate ? new Date(endDate) : new Date('2100-12-31');
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return logs.filter(log => {
      const logDate = new Date(log.date);
      return logDate >= start && logDate <= end;
    });
  }

  const activeRangeBtn = document.querySelector('.log-date-range-btn.active');
  if (activeRangeBtn) {
    const btnId = activeRangeBtn.id;
    let days = 7;
    if (btnId === 'logRange1Day') days = 1;
    else if (btnId === 'logRange7Days') days = 7;
    else if (btnId === 'logRange30Days') days = 30;
    else if (btnId === 'logRange90Days') days = 90;
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date();
    start.setDate(start.getDate() - (days - 1));
    start.setHours(0, 0, 0, 0);
    return logs.filter(log => {
      const logDate = new Date(log.date);
      return logDate >= start && logDate <= end;
    });
  }

  return [...logs];
}

function openShareModalForLog(logDate) {
  const log = (typeof logs !== 'undefined' && logs) ? logs.find(l => l.date === logDate) : null;
  if (!log) {
    if (typeof showAlertModal === 'function') showAlertModal('Entry not found.', 'Share');
    return;
  }
  const entryText = formatLogEntryAsText(log);
  const body = EMAIL_SYNOPSIS_INTRO + '\n\n' + entryText + '\n\n' + EMAIL_SYNOPSIS_FOOTER;
  const subject = 'Health summary – ' + (log.date || '');
  const emailHref = 'mailto:?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  const whatsappHref = 'https://wa.me/?text=' + encodeURIComponent(subject + '\n\n' + body);

  const csvContent = formatLogEntryAsCSV(log);
  const downloadCSV = () => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'health_entry_' + (log.date || '') + '.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const dateLabel = new Date(log.date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
  openShareModal({
    mode: 'log',
    title: 'Share log entry',
    bodyHTML: '<p class="share-preview-text">Share entry for ' + escapeHTML(dateLabel) + ' by email, WhatsApp, or download as CSV.</p>',
    payload: { emailHref, whatsappHref, downloadCSV }
  });
}

function openShareModalForLogsInRange() {
  const rangeLogs = getLogsInCurrentViewRange();
  if (!rangeLogs || rangeLogs.length === 0) {
    if (typeof showAlertModal === 'function') showAlertModal('No entries in the selected range to share.', 'Share');
    return;
  }

  const startDateInput = document.getElementById('startDate');
  const endDateInput = document.getElementById('endDate');
  const startVal = startDateInput && startDateInput.value ? startDateInput.value : '';
  const endVal = endDateInput && endDateInput.value ? endDateInput.value : '';
  const rangeLabel = startVal && endVal ? (startVal === endVal ? startVal : startVal + ' to ' + endVal) : (rangeLogs.length + ' entries');
  const subject = 'Health summary – ' + rangeLabel;
  const header = EMAIL_SYNOPSIS_INTRO + '\n\nPeriod: ' + rangeLabel + '\nNumber of entries: ' + rangeLogs.length + '\n\n';
  const textParts = rangeLogs.map(log => formatLogEntryAsText(log));
  const divider = '\n\n════════════════════════════════════════\n\n';
  const contentWithFooter = header + textParts.join(divider) + '\n\n' + EMAIL_SYNOPSIS_FOOTER;
  const maxBodyLen = 1500;
  let body = contentWithFooter;
  if (body.length > maxBodyLen) {
    const truncateHint = '\n\n[... See attached CSV for full data.]\n\n' + EMAIL_SYNOPSIS_FOOTER;
    body = contentWithFooter.substring(0, maxBodyLen - truncateHint.length) + truncateHint;
  }
  const emailHref = 'mailto:?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);

  const downloadCSV = () => {
    if (typeof exportToCSV === 'function') {
      exportToCSV(rangeLogs);
    } else {
      const headers = "Date,BPM,Weight,Fatigue,Stiffness,Back Pain,Sleep,Joint Pain,Mobility,Daily Function,Swelling,Flare,Mood,Irritability,Notes";
      const rows = rangeLogs.map(log => formatLogEntryAsCSV(log).split('\n')[1]).join("\n");
      const blob = new Blob([headers + "\n" + rows], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'health_logs_range.csv';
      link.click();
      URL.revokeObjectURL(link.href);
    }
  };

  openShareModal({
    mode: 'log',
    title: 'Share entries in range',
    bodyHTML: '<p class="share-preview-text">Share ' + rangeLogs.length + ' entr' + (rangeLogs.length === 1 ? 'y' : 'ies') + ' in the selected range as email or download as CSV.</p>',
    payload: { emailHref, downloadCSV }
  });
}

function openShareModalForChart(chartId) {
  const container = document.getElementById(chartId);
  const chartInstance = container && container.chart ? container.chart : (typeof ApexCharts !== 'undefined' && ApexCharts.getChartByID ? ApexCharts.getChartByID(chartId) : null);
  if (!chartInstance || typeof chartInstance.dataURI !== 'function') {
    if (typeof showAlertModal === 'function') showAlertModal('Chart not ready. Try again in a moment.', 'Share');
    return;
  }
  chartInstance.dataURI().then(({ imgURI, blob }) => {
    const chartTitle = getChartTitleFromId(chartId);
    const subject = 'Health chart – ' + (chartTitle || chartId);
    const filename = 'health-chart-' + chartId + '-' + (new Date().toISOString().split('T')[0]) + '.png';
    const file = blob ? new File([blob], filename, { type: 'image/png' }) : null;

    const saveImage = () => {
      const a = document.createElement('a');
      a.href = imgURI;
      a.download = filename;
      a.click();
    };

    const shareToWhatsApp = () => {
      if (file && typeof navigator !== 'undefined' && navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({ title: subject, text: subject, files: [file] })
          .then(() => { if (typeof closeShareModal === 'function') closeShareModal(); })
          .catch((err) => {
            if (err.name !== 'AbortError' && typeof showAlertModal === 'function') showAlertModal('Share failed. Try "Save image" then share it in WhatsApp.', 'Share');
          });
        return;
      }
      saveImage();
      const waText = subject + '\n\nChart image saved to your device - attach it in WhatsApp to share.';
      window.open('https://wa.me/?text=' + encodeURIComponent(waText), '_blank', 'noopener,noreferrer');
    };

    openShareModal({
      mode: 'chart',
      title: 'Share chart',
      bodyHTML: '<img src="' + imgURI + '" alt="Chart preview" class="share-chart-preview"/>',
      payload: { shareToWhatsApp, saveImage }
    });
  }).catch(() => {
    if (typeof showAlertModal === 'function') showAlertModal('Could not export chart image.', 'Share');
  });
}

function injectChartShareButton(container, chartId) {
  if (!container || !chartId) return;
  const parent = container.parentElement;
  const isInnerChartInCard = !!(parent && parent.classList && parent.classList.contains('chart-container'));
  const isChartContainerSelf = !!(container.classList && container.classList.contains('chart-container'));

  const mountParent = isInnerChartInCard ? parent : container;
  let btn = mountParent.querySelector('.chart-share-btn');
  if (!btn && isInnerChartInCard) {
    btn = container.querySelector('.chart-share-btn');
  }
  if (!btn) {
    btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'chart-share-btn';
    btn.title = 'Share chart';
    btn.setAttribute('aria-label', 'Share this chart');
    btn.innerHTML = '<i class="fa-solid fa-share" aria-hidden="true"></i>';
  }

  btn.onclick = function(e) {
    e.preventDefault();
    e.stopPropagation();
    openShareModalForChart(chartId);
  };

  if (isInnerChartInCard) {
    parent.insertBefore(btn, container);
  } else if (isChartContainerSelf) {
    const first = container.firstChild;
    if (first !== btn) {
      container.insertBefore(btn, first || null);
    }
  } else if (!container.contains(btn)) {
    container.appendChild(btn);
  }
}

function getChartTitleFromId(chartId) {
  const map = {
    bpmChart: 'Resting Heart Rate',
    fatigueChart: 'Fatigue Level',
    stiffnessChart: 'Stiffness',
    backPainChart: 'Back Pain',
    sleepChart: 'Sleep',
    jointPainChart: 'Joint Pain',
    mobilityChart: 'Mobility',
    dailyFunctionChart: 'Daily Function',
    swellingChart: 'Swelling',
    moodChart: 'Mood',
    irritabilityChart: 'Irritability',
    weatherSensitivityChart: 'Weather Sensitivity',
    stepsChart: 'Steps',
    hydrationChart: 'Hydration',
    combinedChart: 'Combined metrics',
    balanceChart: 'Balance chart'
  };
  return map[chartId] || chartId;
}

// Build shareable AI analysis as plain text from currentAIAnalysis (no emoji, clean format)
function buildAIAnalysisShareText(dateRangeText) {
  var analysis = currentAIAnalysis;
  var logs = currentAIFilteredLogs || [];
  var dayCount = logs.length;
  if (!analysis || !analysis.trends) return '';

  var sep = '\n\n';
  var blockSep = '\n----------------------------------------\n\n';
  var lines = [];

  lines.push('Analysis for ' + (dateRangeText || 'selected period'));
  lines.push('');

  // What we found (insights)
  var insightsText = typeof generateComprehensiveInsights === 'function'
    ? generateComprehensiveInsights(analysis, logs, dayCount)
    : '';
  if (insightsText) {
    var plainInsights = insightsText
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/<[^>]+>/g, '')
      .trim();
    lines.push('WHAT WE FOUND');
    lines.push(plainInsights.split(/\n\n+/).join('\n\n'));
    lines.push('');
  }

  // What you logged (one line)
  var numericWithData = Object.keys(analysis.trends || {}).filter(function(m) { return analysis.trends[m]; });
  var daysFlare = logs.filter(function(l) { return l.flare === 'Yes'; }).length;
  var daysFood = logs.filter(function(l) {
    if (!l.food) return false;
    var arr = Array.isArray(l.food) ? l.food : [].concat(l.food.breakfast || [], l.food.lunch || [], l.food.dinner || [], l.food.snack || []);
    return arr.length > 0;
  }).length;
  var daysExercise = logs.filter(function(l) { return l.exercise && Array.isArray(l.exercise) && l.exercise.length > 0; }).length;
  var daysStressors = logs.filter(function(l) { return l.stressors && Array.isArray(l.stressors) && l.stressors.length > 0; }).length;
  var daysSymptoms = logs.filter(function(l) { return l.symptoms && Array.isArray(l.symptoms) && l.symptoms.length > 0; }).length;
  var daysPainLocation = logs.filter(function(l) { return l.painLocation && String(l.painLocation).trim().length > 0; }).length;
  var daysEnergy = logs.filter(function(l) { return l.energyClarity && String(l.energyClarity).trim().length > 0; }).length;
  var daysNotes = logs.filter(function(l) { return l.notes && String(l.notes).trim().length > 0; }).length;
  var loggedLine = 'Logged: ' + numericWithData.length + ' metrics, ' + daysFlare + ' flare day(s), ' + daysFood + ' food, ' + daysExercise + ' exercise, ' + daysStressors + ' stress, ' + daysSymptoms + ' symptoms, ' + daysPainLocation + ' pain areas, ' + daysEnergy + ' energy, ' + daysNotes + ' notes.';
  lines.push('WHAT YOU LOGGED');
  lines.push(loggedLine);
  lines.push('');

  // How you're doing (each metric one line, no emoji)
  function formatTrendValue(metric, value) {
    if (value === undefined || value === null) return '';
    if (metric === 'bpm') return Math.round(value).toString();
    if (metric === 'weight') {
      var unit = (appSettings && appSettings.weightUnit) || 'kg';
      var v = unit === 'lb' && typeof kgToLb === 'function' ? kgToLb(value) : value;
      return parseFloat(v).toFixed(1) + (unit === 'lb' ? 'lb' : 'kg');
    }
    if (metric === 'steps') return Math.round(value).toLocaleString();
    if (metric === 'hydration') return parseFloat(value).toFixed(1) + ' glasses';
    return Math.round(value) + '/10';
  }
  function trendLabel(status) {
    if (status === 'improving') return 'Getting better';
    if (status === 'worsening') return 'Getting worse';
    return 'Staying stable';
  }
  lines.push("HOW YOU'RE DOING");
  Object.keys(analysis.trends).forEach(function(metric) {
    var trend = analysis.trends[metric];
    var name = metric.replace(/([A-Z])/g, ' $1').replace(/^./, function(s) { return s.toUpperCase(); });
    var status = trend.statusFromAverage || 'stable';
    var avg = formatTrendValue(metric, trend.average);
    var now = formatTrendValue(metric, trend.current);
    var next = trend.projected7Days != null ? formatTrendValue(metric, trend.projected7Days) : '';
    var line = name + ': ' + trendLabel(status) + ' | Avg ' + avg + ' | Now ' + now;
    if (next) line += ' | Next ' + next;
    lines.push(line);
  });
  lines.push('');

  // Possible flare-up
  if (analysis.flareUpRisk) {
    lines.push('POSSIBLE FLARE-UP');
    lines.push(analysis.flareUpRisk.level + ' (' + (analysis.flareUpRisk.matchingMetrics || 0) + '/5 signs). Keep an eye on how you feel.');
    lines.push('');
  }

  // Correlations
  if (analysis.correlationMatrix) {
    var strongCorrelations = [];
    var metrics = Object.keys(analysis.correlationMatrix);
    metrics.forEach(function(metric1) {
      if (!analysis.correlationMatrix[metric1]) return;
      metrics.forEach(function(metric2) {
        if (metric1 >= metric2) return;
        var corr = analysis.correlationMatrix[metric1][metric2];
        if (corr && Math.abs(corr) > 0.6) {
          var m1 = metric1.replace(/([A-Z])/g, ' $1').replace(/^./, function(s) { return s.toUpperCase(); });
          var m2 = metric2.replace(/([A-Z])/g, ' $1').replace(/^./, function(s) { return s.toUpperCase(); });
          var strength = Math.abs(corr) > 0.7 ? 'strongly' : 'usually';
          var dir = corr > 0 ? 'goes up when' : 'goes down when';
          strongCorrelations.push(m1 + ' ' + strength + ' ' + dir + ' ' + m2);
        }
      });
    });
    if (strongCorrelations.length > 0) {
      lines.push('CORRELATIONS');
      strongCorrelations.slice(0, 5).forEach(function(s) { lines.push(s); });
      lines.push('');
    }
    if (analysis.correlationClusters && analysis.correlationClusters.length > 0) {
      lines.push('Groups that change together:');
      analysis.correlationClusters.forEach(function(cluster) {
        lines.push('  ' + cluster.map(function(m) { return m.replace(/([A-Z])/g, ' $1').replace(/^./, function(s) { return s.toUpperCase(); }); }).join(', '));
      });
      lines.push('');
    }
  }

  // Things to watch
  if (analysis.anomalies && analysis.anomalies.length > 0) {
    lines.push('THINGS TO WATCH');
    analysis.anomalies.forEach(function(a) {
      var plain = String(a).replace(/\*\*(.*?)\*\*/g, '$1').replace(/<[^>]+>/g, '');
      lines.push('  ' + plain);
    });
    lines.push('');
  }

  lines.push('IMPORTANT');
  lines.push('For patterns only - talk to your doctor before changing care. You can share this at your next visit. AI data (e.g. prediction weights) is stored on your device and, when signed in, backed up to your cloud account.');

  return EMAIL_ANALYSIS_INTRO + sep + lines.join(sep) + sep + EMAIL_SYNOPSIS_FOOTER;
}

// Strip emoji and replacement chars so shared text renders correctly in email/messaging
function stripEmojiForShare(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/\uFFFD/g, '')
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F900}-\u{1F9FF}]/gu, '')
    .trim();
}

// Format AI analysis plain text for email (legacy: used when structured data not available)
function formatAIAnalysisTextForEmail(rawText) {
  if (!rawText || !rawText.trim()) return '';
  var text = stripEmojiForShare(rawText);
  if (!text) return '';
  var lines = text.split(/\r?\n/);
  var out = [];
  var prevWasBlank = false;
  var sectionMarkers = ['What we found', 'What you logged', "How you're doing", 'Things to watch', 'Correlations', 'Important', 'Possible flare-up'];
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    var trimmed = line.trim();
    var isBlank = trimmed.length === 0;
    if (isBlank) {
      if (!prevWasBlank) out.push('');
      prevWasBlank = true;
      continue;
    }
    prevWasBlank = false;
    var isSectionTitle = sectionMarkers.some(function(m) { return trimmed.indexOf(m) !== -1; }) ||
      (trimmed.length < 50 && /^(Summary|Symptoms|Nutrition|Exercise|Important)/i.test(trimmed));
    if (isSectionTitle && out.length > 0 && out[out.length - 1] !== '') {
      out.push('');
      out.push('----------------------------------------');
      out.push('');
    }
    out.push(trimmed);
  }
  return EMAIL_ANALYSIS_INTRO + '\n\n' + out.join('\n') + '\n\n' + EMAIL_SYNOPSIS_FOOTER;
}

function openShareModalForAIAnalysis() {
  var resultsContent = document.getElementById('aiResultsContent');
  var hasContent = currentAIAnalysis && resultsContent && (resultsContent.innerText && resultsContent.innerText.trim().length > 0 || currentAIAnalysis.trends);
  if (!hasContent) {
    openShareModal({
      mode: 'ai',
      title: 'Share AI analysis',
      bodyHTML: '<p>No analysis to share. Change the date range or log entries first.</p>',
      payload: {}
    });
    return;
  }
  var dateRangeText = '';
  if (resultsContent && resultsContent.innerText) {
    var match = resultsContent.innerText.trim().match(/Analysis for (.+?)(?:\n|$)/);
    if (match) dateRangeText = match[1];
  }
  var formattedBody = (currentAIAnalysis && currentAIAnalysis.trends)
    ? buildAIAnalysisShareText(dateRangeText)
    : formatAIAnalysisTextForEmail(resultsContent.innerText.trim());
  formattedBody = stripEmojiForShare(formattedBody);
  var subject = 'Health analysis summary – ' + (dateRangeText || 'selected period');
  var emailHref = 'mailto:?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(formattedBody);
  var whatsappText = subject + '\n\n' + formattedBody;
  var whatsappHref = 'https://wa.me/?text=' + encodeURIComponent(whatsappText);
  var copyText = formattedBody;
  var copyMarkdown = formattedBody.replace(/^(WHAT WE FOUND|WHAT YOU LOGGED|HOW YOU'RE DOING|CORRELATIONS|THINGS TO WATCH|IMPORTANT|POSSIBLE FLARE-UP|Groups that change together)/gm, '## $1');

  openShareModal({
    mode: 'ai',
    title: 'Share AI analysis',
    bodyHTML: '<p>Copy the summary or send by email or WhatsApp. Plain text only so it pastes correctly everywhere.</p>',
    payload: { emailHref, whatsappHref, copyText: copyText, copyMarkdown: copyMarkdown }
  });
}

// ============================================
// Cookie consent banner and Cookie policy modal
// ============================================
const COOKIE_CONSENT_KEY = 'rianellCookieConsent';

function showCookieBannerIfNeeded() {
  if (localStorage.getItem(COOKIE_CONSENT_KEY)) return;
  const banner = document.getElementById('cookieBanner');
  if (banner) banner.classList.remove('hidden');
}

function hideCookieBanner() {
  const banner = document.getElementById('cookieBanner');
  if (banner) banner.classList.add('hidden');
}

function acceptCookieConsent() {
  try {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
  } catch (e) {
    Logger.warn('Could not save cookie consent', { error: String(e) });
  }
  hideCookieBanner();
  closeCookiePolicyModal();
}

var _cookiePolicyModalEscapeHandler = null;
var _cookiePolicyModalFocusTrap = null;
var _cookiePolicyModalPreviousActiveElement = null;

function openCookiePolicyModal() {
  const overlay = document.getElementById('cookiePolicyOverlay');
  const panel = overlay && overlay.querySelector('.modal-content');
  if (!overlay || !panel) return;
  _cookiePolicyModalPreviousActiveElement = document.activeElement;
  overlay.style.display = 'block';
  overlay.style.visibility = 'visible';
  overlay.style.opacity = '1';
  document.body.classList.add('modal-active');
  document.body.style.overflow = 'hidden';
  overlay.onclick = function(e) {
    if (e.target === overlay) closeCookiePolicyModal();
  };
  _cookiePolicyModalEscapeHandler = function(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      document.removeEventListener('keydown', _cookiePolicyModalEscapeHandler);
      _cookiePolicyModalEscapeHandler = null;
      closeCookiePolicyModal();
    }
  };
  document.addEventListener('keydown', _cookiePolicyModalEscapeHandler);
  var focusables = panel.querySelectorAll('button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  var first = focusables[0];
  var last = focusables[focusables.length - 1];
  if (first) first.focus();
  _cookiePolicyModalFocusTrap = function(e) {
    if (e.key !== 'Tab') return;
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        if (last) last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        if (first) first.focus();
      }
    }
  };
  panel.addEventListener('keydown', _cookiePolicyModalFocusTrap);
}

function closeCookiePolicyModal() {
  if (_cookiePolicyModalEscapeHandler) {
    document.removeEventListener('keydown', _cookiePolicyModalEscapeHandler);
    _cookiePolicyModalEscapeHandler = null;
  }
  const overlay = document.getElementById('cookiePolicyOverlay');
  const panel = overlay && overlay.querySelector('.modal-content');
  if (panel && _cookiePolicyModalFocusTrap) {
    panel.removeEventListener('keydown', _cookiePolicyModalFocusTrap);
    _cookiePolicyModalFocusTrap = null;
  }
  if (overlay) {
    overlay.style.display = 'none';
    overlay.style.visibility = 'hidden';
    overlay.style.opacity = '0';
  }
  document.body.classList.remove('modal-active');
  document.body.style.overflow = '';
  if (_cookiePolicyModalPreviousActiveElement && typeof _cookiePolicyModalPreviousActiveElement.focus === 'function') {
    _cookiePolicyModalPreviousActiveElement.focus();
    _cookiePolicyModalPreviousActiveElement = null;
  }
}

var _donateModalEscapeHandler = null;
var _paypalDonateButtonsInstance = null;
var _donateAmountChipsBound = false;

function _getPayPalClientId() {
  if (typeof window.__PAYPAL_CLIENT_ID__ === 'string' && window.__PAYPAL_CLIENT_ID__.trim()) {
    return window.__PAYPAL_CLIENT_ID__.trim();
  }
  var m = document.querySelector('meta[name="paypal-client-id"]');
  return m && m.getAttribute('content') ? String(m.getAttribute('content')).trim() : '';
}

function _getPayPalCurrency() {
  var m = document.querySelector('meta[name="paypal-currency"]');
  var c = m && m.getAttribute('content') ? String(m.getAttribute('content')).trim() : 'USD';
  return /^[A-Za-z]{3}$/.test(c) ? c.toUpperCase() : 'USD';
}

function _destroyPaypalDonateButtons() {
  if (_paypalDonateButtonsInstance && typeof _paypalDonateButtonsInstance.close === 'function') {
    try {
      _paypalDonateButtonsInstance.close();
    } catch (e) {}
  }
  _paypalDonateButtonsInstance = null;
  var el = document.getElementById('paypalDonateButtonContainer');
  if (el) el.innerHTML = '';
}

function _loadPayPalSdk(clientId, currency) {
  return new Promise(function (resolve, reject) {
    if (window.paypal) return resolve(window.paypal);
    var existing = document.querySelector('script[data-rianell-paypal-sdk]');
    if (existing) {
      if (window.paypal) return resolve(window.paypal);
      existing.addEventListener('load', function () {
        resolve(window.paypal);
      });
      existing.addEventListener('error', reject);
      return;
    }
    var s = document.createElement('script');
    s.src =
      'https://www.paypal.com/sdk/js?client-id=' +
      encodeURIComponent(clientId) +
      '&currency=' +
      encodeURIComponent(currency) +
      '&intent=capture&components=buttons';
    s.async = true;
    s.setAttribute('data-rianell-paypal-sdk', '1');
    s.onload = function () {
      resolve(window.paypal);
    };
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

function _bindDonateAmountChips() {
  if (_donateAmountChipsBound) return;
  var wrap = document.getElementById('donatePaypalSdkWrap');
  if (!wrap) return;
  _donateAmountChipsBound = true;
  wrap.addEventListener('click', function (e) {
    var t = e.target && e.target.closest ? e.target.closest('.donate-amount-chip') : null;
    if (!t) return;
    var a = t.getAttribute('data-amount');
    if (!a) return;
    wrap.querySelectorAll('.donate-amount-chip').forEach(function (c) {
      c.classList.remove('donate-amount-chip--active');
    });
    t.classList.add('donate-amount-chip--active');
    window._rianellDonateAmountUsd = parseFloat(a, 10);
  });
}

function _showDonateThankYou(details) {
  var name =
    details &&
    details.payer &&
    details.payer.name &&
    details.payer.name.given_name
      ? details.payer.name.given_name
      : '';
  var successMsg = document.createElement('div');
  successMsg.className = 'success-notification';
  successMsg.style.cssText =
    'position:fixed;top:20px;right:20px;background:linear-gradient(135deg,#4caf50,#66bb6a);color:#fff;padding:18px 24px;border-radius:16px;font-weight:600;font-size:1rem;z-index:100020;box-shadow:0 8px 24px rgba(76,175,80,0.4);border:1px solid rgba(255,255,255,0.2);animation:slideInRight 0.4s cubic-bezier(0.4,0,0.2,1),fadeOut 0.3s ease-out 2.7s forwards';
  successMsg.textContent = name ? 'Thanks, ' + name + '!' : 'Thank you for your support!';
  document.body.appendChild(successMsg);
  setTimeout(function () {
    successMsg.style.animation = 'slideOutRight 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards';
    setTimeout(function () {
      successMsg.remove();
    }, 300);
  }, 3000);
}

function openDonateModal() {
  const overlay = document.getElementById('donateModalOverlay');
  if (!overlay) return;
  overlay.style.display = 'block';
  overlay.style.visibility = 'visible';
  overlay.style.opacity = '1';
  document.body.classList.add('modal-active');
  document.body.style.overflow = 'hidden';
  overlay.onclick = function (e) {
    if (e.target === overlay) closeDonateModal();
  };
  _donateModalEscapeHandler = function (e) {
    if (e.key === 'Escape') {
      document.removeEventListener('keydown', _donateModalEscapeHandler);
      _donateModalEscapeHandler = null;
      closeDonateModal();
    }
  };
  document.addEventListener('keydown', _donateModalEscapeHandler);
  var closeBtn = overlay.querySelector('#donateModalCloseBtn') || overlay.querySelector('.modal-close');
  var clientId = _getPayPalClientId();
  var loadingEl = document.getElementById('donatePaypalLoading');
  var sdkWrap = document.getElementById('donatePaypalSdkWrap');
  var fallbackEl = document.getElementById('donatePaypalFallback');
  var hintEl = document.getElementById('donatePaypalFallbackHint');

  if (!clientId) {
    _destroyPaypalDonateButtons();
    if (loadingEl) loadingEl.style.display = 'none';
    if (sdkWrap) sdkWrap.style.display = 'none';
    if (fallbackEl) fallbackEl.style.display = '';
    if (hintEl) {
      hintEl.innerHTML =
        'Add your PayPal REST Client ID to the <code>paypal-client-id</code> meta tag (or set <code>window.__PAYPAL_CLIENT_ID__</code>) to enable PayPal, card, Apple Pay, and Google Pay in the app. Until then, use the link below.';
    }
    var primary = fallbackEl && fallbackEl.querySelector('.donate-paypal-btn');
    if (primary && typeof primary.focus === 'function') primary.focus();
    else if (closeBtn && typeof closeBtn.focus === 'function') closeBtn.focus();
    return;
  }

  if (fallbackEl) fallbackEl.style.display = 'none';
  if (sdkWrap) sdkWrap.style.display = 'block';
  if (loadingEl) {
    loadingEl.style.display = 'block';
    loadingEl.textContent = 'Loading payment options…';
  }
  if (hintEl) hintEl.innerHTML = '';

  _bindDonateAmountChips();
  var activeChip = document.querySelector('#donatePaypalSdkWrap .donate-amount-chip--active');
  var initAmt = activeChip && activeChip.getAttribute('data-amount');
  window._rianellDonateAmountUsd = initAmt ? parseFloat(initAmt, 10) : 10;

  _destroyPaypalDonateButtons();
  var curr = _getPayPalCurrency();

  _loadPayPalSdk(clientId, curr)
    .then(function (paypal) {
      if (!document.getElementById('donateModalOverlay')) return;
      var ov = document.getElementById('donateModalOverlay');
      if (ov.style.display === 'none' || ov.style.visibility === 'hidden') return;
      var container = document.getElementById('paypalDonateButtonContainer');
      if (!container || !paypal || !paypal.Buttons) return;

      _paypalDonateButtonsInstance = paypal.Buttons({
        style: {
          layout: 'vertical',
          label: 'donate',
          shape: 'rect',
          color: 'gold'
        },
        createOrder: function (data, actions) {
          var amount = window._rianellDonateAmountUsd;
          if (!isFinite(amount) || amount < 1) amount = 10;
          return actions.order.create({
            purchase_units: [
              {
                amount: {
                  currency_code: curr,
                  value: amount.toFixed(2)
                },
                description: 'Rianell donation'
              }
            ]
          });
        },
        onApprove: function (data, actions) {
          return actions.order.capture().then(function (details) {
            _showDonateThankYou(details);
            closeDonateModal();
          });
        },
        onError: function (err) {
          console.error('PayPal', err);
          var fe = document.getElementById('donatePaypalFallback');
          var he = document.getElementById('donatePaypalFallbackHint');
          var le = document.getElementById('donatePaypalLoading');
          var sw = document.getElementById('donatePaypalSdkWrap');
          if (le) le.style.display = 'none';
          if (sw) sw.style.display = 'none';
          if (fe) fe.style.display = '';
          if (he) {
            he.textContent =
              'Could not start PayPal. Check your connection or try the link below. (Apple Pay / Google Pay also require an eligible PayPal account and domain setup.)';
          }
        }
      });
      return _paypalDonateButtonsInstance.render('#paypalDonateButtonContainer');
    })
    .then(function () {
      var le = document.getElementById('donatePaypalLoading');
      if (le) le.style.display = 'none';
      var chip = document.querySelector('#donatePaypalSdkWrap .donate-amount-chip--active');
      var cb = document.getElementById('donateModalCloseBtn');
      if (chip && typeof chip.focus === 'function') {
        try {
          chip.focus({ preventScroll: true });
        } catch (e) {
          chip.focus();
        }
      } else if (cb && typeof cb.focus === 'function') cb.focus();
    })
    .catch(function (err) {
      console.error('PayPal SDK load failed', err);
      var le = document.getElementById('donatePaypalLoading');
      var sw = document.getElementById('donatePaypalSdkWrap');
      var fe = document.getElementById('donatePaypalFallback');
      var he = document.getElementById('donatePaypalFallbackHint');
      if (le) le.style.display = 'none';
      if (sw) sw.style.display = 'none';
      if (fe) fe.style.display = '';
      if (he) {
        he.textContent =
          'Could not load PayPal. Check Content-Security-Policy allows https://www.paypal.com, or use the link below.';
      }
    });
}

function closeDonateModal() {
  _destroyPaypalDonateButtons();
  if (_donateModalEscapeHandler) {
    document.removeEventListener('keydown', _donateModalEscapeHandler);
    _donateModalEscapeHandler = null;
  }
  const overlay = document.getElementById('donateModalOverlay');
  if (overlay) {
    overlay.onclick = null;
    overlay.style.display = 'none';
    overlay.style.visibility = 'hidden';
    overlay.style.opacity = '0';
  }
  var loadingEl = document.getElementById('donatePaypalLoading');
  if (loadingEl) loadingEl.style.display = 'none';
  var settingsEl = document.getElementById('settingsOverlay');
  var settingsOpen = settingsEl && (
    settingsEl.style.display === 'block' ||
    settingsEl.style.display === 'flex' ||
    settingsEl.classList.contains('settings-overlay--open')
  );
  if (!settingsOpen) {
    document.body.classList.remove('modal-active');
    document.body.style.overflow = '';
  }
}

window.openDonateModal = openDonateModal;
window.closeDonateModal = closeDonateModal;

// ============================================
// Tutorial Modal (new users + backtick ` to reopen)
// ============================================
const TUTORIAL_SLIDE_TITLES = ['Enable AI & Goals?', 'Welcome', 'View & AI', 'Settings & data', 'Data options', 'Goals & targets', "You're all set"];

function getTutorialVisibleIndices() {
  var aiOn = typeof appSettings !== 'undefined' && appSettings.aiEnabled !== false;
  if (aiOn) return [0, 1, 2, 3, 4, 5, 6];
  return [0, 1, 6];
}
var _tutorialSwipeStartX = 0;
var _tutorialSwipeStartY = 0;
var _tutorialSwipeHandlersAttached = false;
var _tutorialKeydownHandler = null;

function _tutorialSwipeStart(e) {
  if (!e.touches || e.touches.length === 0) return;
  _tutorialSwipeStartX = e.touches[0].clientX;
  _tutorialSwipeStartY = e.touches[0].clientY;
}

function _tutorialSwipeEnd(e) {
  if (!e.changedTouches || e.changedTouches.length === 0) return;
  var endX = e.changedTouches[0].clientX;
  var endY = e.changedTouches[0].clientY;
  var deltaX = endX - _tutorialSwipeStartX;
  var deltaY = endY - _tutorialSwipeStartY;
  var minSwipe = 50;
  if (Math.abs(deltaX) < minSwipe) return;
  if (Math.abs(deltaY) > Math.abs(deltaX)) return;
  if (deltaX < 0) tutorialNextSlide();
  else tutorialPrevSlide();
}

function _attachTutorialSwipeListeners() {
  var overlay = document.getElementById('tutorialModalOverlay');
  var body = overlay && overlay.querySelector('.tutorial-modal-body');
  var el = body || overlay;
  if (!el || _tutorialSwipeHandlersAttached) return;
  el.addEventListener('touchstart', _tutorialSwipeStart, { passive: true });
  el.addEventListener('touchend', _tutorialSwipeEnd, { passive: true });
  _tutorialSwipeHandlersAttached = true;
}

function _detachTutorialSwipeListeners() {
  var overlay = document.getElementById('tutorialModalOverlay');
  var body = overlay && overlay.querySelector('.tutorial-modal-body');
  var el = body || overlay;
  if (!el || !_tutorialSwipeHandlersAttached) return;
  el.removeEventListener('touchstart', _tutorialSwipeStart);
  el.removeEventListener('touchend', _tutorialSwipeEnd);
  _tutorialSwipeHandlersAttached = false;
}

function openTutorialModal() {
  const overlay = document.getElementById('tutorialModalOverlay');
  const titleEl = document.getElementById('tutorialModalTitle');
  if (!overlay || !titleEl) return;
  closeSettingsModalIfOpen();
  overlay.style.display = 'block';
  overlay.style.visibility = 'visible';
  overlay.style.opacity = '1';
  document.body.classList.add('modal-active');
  showTutorialSlide(0);
  if (typeof updateTutorialConditionDisplay === 'function') updateTutorialConditionDisplay();
  _attachTutorialSwipeListeners();
  overlay.onclick = function(e) {
    if (e.target === overlay) closeTutorialModal();
  };
  _tutorialKeydownHandler = function(e) {
    if (e.key === 'Escape') {
      closeTutorialModal();
      return;
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      tutorialPrevSlide();
      return;
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      tutorialNextSlide();
      return;
    }
  };
  document.addEventListener('keydown', _tutorialKeydownHandler);
}

function isTutorialTestPage() {
  try {
    var p = window.location.pathname || '';
    return p === '/tutorial' || p === '/tutorial/' || p.endsWith('/tutorial') || p.endsWith('/tutorial/');
  } catch (e) { return false; }
}

function closeTutorialModal() {
  _detachTutorialSwipeListeners();
  if (_tutorialKeydownHandler) {
    document.removeEventListener('keydown', _tutorialKeydownHandler);
    _tutorialKeydownHandler = null;
  }
  const overlay = document.getElementById('tutorialModalOverlay');
  if (overlay) {
    overlay.style.display = 'none';
    overlay.style.visibility = 'hidden';
    overlay.style.opacity = '0';
    document.body.classList.remove('modal-active');
    document.body.style.overflow = '';
  }
  if (!isTutorialTestPage()) {
    try { localStorage.setItem('rianellTutorialSeen', '1'); } catch (err) {}
  }
}

function setTutorialAIChoice(enabled) {
  appSettings.aiEnabled = !!enabled;
  saveSettings();
  applyAIFeatureVisibility();
  loadSettingsState();
  showTutorialSlide(1);
}

function showTutorialSlide(index) {
  const titleEl = document.getElementById('tutorialModalTitle');
  const arrowLeft = document.getElementById('tutorialArrowLeft');
  const arrowRight = document.getElementById('tutorialArrowRight');
  const finishBtn = document.getElementById('tutorialFinishBtn');
  const demoBtn = document.getElementById('tutorialDemoBtn');
  const signupBtn = document.getElementById('tutorialSignupBtn');
  const visible = getTutorialVisibleIndices();
  const pos = visible.indexOf(index);
  const isLast = pos >= 0 && pos === visible.length - 1;
  const isFirst = pos <= 0;
  if (titleEl) titleEl.textContent = TUTORIAL_SLIDE_TITLES[index] || 'Tutorial';
  document.querySelectorAll('.tutorial-slide').forEach(function(el, i) {
    el.classList.toggle('tutorial-slide-active', i === index);
  });
  if (arrowLeft) arrowLeft.style.display = isFirst ? 'none' : 'flex';
  if (arrowRight) {
    if (index === 0) arrowRight.style.display = 'none';
    else arrowRight.style.display = isLast ? 'none' : 'flex';
  }
  if (finishBtn) finishBtn.style.display = isLast ? 'inline-block' : 'none';
  if (signupBtn) signupBtn.style.display = isLast ? 'inline-block' : 'none';
  if (demoBtn) demoBtn.style.display = isLast ? 'inline-block' : 'none';
  if (index === 3 && typeof updateTutorialConditionDisplay === 'function') updateTutorialConditionDisplay();
  if (index === 4 && typeof updateTutorialDataTogglesState === 'function') updateTutorialDataTogglesState();
}

function tutorialNextSlide() {
  var active = document.querySelector('.tutorial-slide.tutorial-slide-active');
  var idx = active ? parseInt(active.dataset.slide, 10) : 0;
  var visible = getTutorialVisibleIndices();
  var pos = visible.indexOf(idx);
  if (pos >= 0 && pos < visible.length - 1) showTutorialSlide(visible[pos + 1]);
}

function tutorialPrevSlide() {
  var active = document.querySelector('.tutorial-slide.tutorial-slide-active');
  var idx = active ? parseInt(active.dataset.slide, 10) : 0;
  var visible = getTutorialVisibleIndices();
  var pos = visible.indexOf(idx);
  if (pos > 0) showTutorialSlide(visible[pos - 1]);
}

function finishTutorial(enableDemo) {
  closeTutorialModal();
  if (enableDemo && typeof appSettings !== 'undefined' && !appSettings.demoMode && typeof toggleDemoMode === 'function') {
    toggleDemoMode();
  }
  maybeShowInstallModalOnce();
}

function maybeShowInstallModalOnce() {
  if (isRianellNativeApp()) return;
  try {
    if (localStorage.getItem('rianellInstallModalAfterTutorialSeen')) return;
    openInstallModal(false);
  } catch (err) {}
}

function getBuildBaseUrls() {
  var path = window.location.pathname || '/';
  var base = path.substring(0, path.lastIndexOf('/') + 1);
  var baseUrl = window.location.origin + (base.startsWith('/') ? base : '/' + base);
  return {
    android: baseUrl + encodeURI('App build/Android/'),
    ios: baseUrl + encodeURI('App build/iOS/')
  };
}

/** Skip latest.json fetch on local dev (avoids 404 noise); set sessionStorage.forceAppBuildManifest = '1' to test locally. */
function shouldFetchAppBuildManifests() {
  try {
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('forceAppBuildManifest') === '1') return true;
  } catch (e) {}
  var h = (window.location && window.location.hostname) ? String(window.location.hostname).toLowerCase() : '';
  if (h === 'localhost' || h === '127.0.0.1' || h === '[::1]') return false;
  return true;
}

function refreshBuildDownloadLinks() {
  var bases = getBuildBaseUrls();
  var androidBase = bases.android;
  var iosBase = bases.ios;
  var isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
  var apkEl = document.getElementById('downloadApkLink');
  var iosEl = document.getElementById('downloadIosLink');
  var apkModal = document.getElementById('installModalApkLink');
  var iosModal = document.getElementById('installModalIosLink');
  var iosLabel = document.getElementById('downloadIosLabel');
  var iosLabelModal = document.getElementById('installModalIosLinkLabel');

  function setAndroid(href, versionText) {
    if (apkEl) {
      apkEl.href = href;
      var v = apkEl.querySelector('.android-version');
      if (v) v.textContent = versionText || '';
    }
    if (apkModal) {
      apkModal.href = href;
      var vM = apkModal.querySelector('.android-version');
      if (vM) vM.textContent = versionText || '';
    }
  }
  function setIos(href, versionText, labelText) {
    if (iosEl) {
      iosEl.href = href;
      var v = iosEl.querySelector('.ios-version');
      if (v) v.textContent = versionText || '';
      if (iosLabel && labelText) iosLabel.textContent = labelText;
    }
    if (iosModal) {
      iosModal.href = href;
      var vM = iosModal.querySelector('.ios-version');
      if (vM) vM.textContent = versionText || '';
      if (iosLabelModal && labelText) iosLabelModal.textContent = labelText;
    }
  }

  setAndroid(androidBase + 'app-debug-beta.apk', '');
  setIos(iosBase + 'Health-Tracker-ios-alpha-latest.zip', '', isIosDevice ? 'Install on iOS' : 'Download iOS build (Xcode project)');

  if (shouldFetchAppBuildManifests()) {
    fetch(androidBase + 'latest.json', { cache: 'no-store' })
      .then(function(r) { return r.ok ? r.json() : null; })
      .then(function(data) {
        if (data && data.file) {
          var href = androidBase + encodeURIComponent(data.file);
          var versionText = (data.version != null) ? '(build ' + data.version + ')' : '';
          setAndroid(href, versionText);
        }
      })
      .catch(function() {});
    fetch(iosBase + 'latest.json', { cache: 'no-store' })
      .then(function(r) { return r.ok ? r.json() : null; })
      .then(function(data) {
        if (data && data.file) {
          var href = data.installUrl || (iosBase + encodeURIComponent(data.file));
          var versionText = (data.version != null) ? '(build ' + data.version + ')' : '';
          var label = data.installUrl && isIosDevice ? 'Install native app (one tap)' : (isIosDevice ? 'Install on iOS' : 'Download iOS build (Xcode project)');
          setIos(href, versionText, label);
        }
      })
      .catch(function() {});
  }
}

window.refreshBuildDownloadLinks = refreshBuildDownloadLinks;

function refreshAppInstallSection() {
  var appSection = document.getElementById('appInstallSection');
  if (isRianellNativeApp()) {
    if (appSection) appSection.style.display = 'none';
    var installWebEarly = document.getElementById('installWebAppOption');
    if (installWebEarly) installWebEarly.style.display = 'none';
    var installIosEarly = document.getElementById('installOnIosDevice');
    if (installIosEarly) installIosEarly.style.display = 'none';
    var androidEarly = document.getElementById('androidDownloadOption');
    var iosEarly = document.getElementById('iosDownloadOption');
    if (androidEarly) androidEarly.style.display = 'none';
    if (iosEarly) iosEarly.style.display = 'none';
    if (typeof hideInstallButton === 'function') hideInstallButton();
    return;
  }
  if (appSection) appSection.style.display = '';
  var platform = (typeof window !== 'undefined' && window.DeviceModule && window.DeviceModule.platform && window.DeviceModule.platform.platform)
    ? window.DeviceModule.platform.platform
    : (/iPad|iPhone|iPod/.test(navigator.userAgent) ? 'ios' : /Android/i.test(navigator.userAgent) ? 'android' : 'desktop');
  var titleEl = document.getElementById('appInstallSectionTitle');
  var installIosDevice = document.getElementById('installOnIosDevice');
  var installWebAppOption = document.getElementById('installWebAppOption');
  var installWebAppLabel = document.getElementById('installWebAppLabel');
  var androidOption = document.getElementById('androidDownloadOption');
  var iosOption = document.getElementById('iosDownloadOption');
  var androidLabel = document.getElementById('downloadAndroidLabel');
  var iosLabel = document.getElementById('downloadIosLabel');

  if (titleEl) {
    if (platform === 'ios' || platform === 'android') titleEl.textContent = 'Install on this device';
    else titleEl.textContent = 'App Installation';
  }
  if (installWebAppLabel) {
    if (platform === 'ios') installWebAppLabel.textContent = 'Add to Home Screen';
    else if (platform === 'android') installWebAppLabel.textContent = 'Add to Home Screen';
    else installWebAppLabel.textContent = 'Install web app';
  }
  if (platform === 'ios') {
    if (installIosDevice) installIosDevice.style.display = '';
    if (installWebAppOption) installWebAppOption.style.display = '';
    if (androidOption) androidOption.style.display = 'none';
    if (iosOption) iosOption.style.display = 'none';
  } else if (platform === 'android') {
    if (installIosDevice) installIosDevice.style.display = 'none';
    if (installWebAppOption) installWebAppOption.style.display = '';
    if (androidOption) { androidOption.style.display = ''; if (androidLabel) androidLabel.textContent = 'Install on Android'; }
    if (iosOption) { iosOption.style.display = ''; if (iosLabel) iosLabel.textContent = 'Download for iOS'; }
  } else {
    if (installIosDevice) installIosDevice.style.display = 'none';
    if (installWebAppOption) installWebAppOption.style.display = '';
    if (androidOption) { androidOption.style.display = ''; if (androidLabel) androidLabel.textContent = 'Download for Android'; }
    if (iosOption) { iosOption.style.display = ''; if (iosLabel) iosLabel.textContent = 'Download for iOS'; }
  }
}

window.refreshAppInstallSection = refreshAppInstallSection;

function openInstallModal(force) {
  if (isRianellNativeApp()) return;
  window._installModalOpenedByTutorial = false;
  if (!force) {
    try {
      if (localStorage.getItem('rianellInstallModalAfterTutorialSeen')) return;
    } catch (e) {}
    window._installModalOpenedByTutorial = true;
  }
  var overlay = document.getElementById('installModalOverlay');
  if (!overlay) return;
  closeSettingsModalIfOpen();
  if (typeof refreshBuildDownloadLinks === 'function') refreshBuildDownloadLinks();
  var apkMain = document.getElementById('downloadApkLink');
  var iosMain = document.getElementById('downloadIosLink');
  var apkModal = document.getElementById('installModalApkLink');
  var iosModal = document.getElementById('installModalIosLink');
  var iosLabelModal = document.getElementById('installModalIosLinkLabel');
  if (apkMain && apkModal) {
    apkModal.href = apkMain.href || 'javascript:void(0)';
    var vMain = apkMain.querySelector('.android-version');
    var vModal = apkModal.querySelector('.android-version');
    if (vMain && vModal) vModal.textContent = vMain.textContent || '';
  }
  if (iosMain && iosModal) {
    iosModal.href = iosMain.href || 'javascript:void(0)';
    var labelMain = document.getElementById('downloadIosLabel');
    if (iosLabelModal && labelMain) iosLabelModal.textContent = labelMain.textContent || 'Install on iOS';
    var vMainIos = iosMain.querySelector('.ios-version');
    var vModalIos = iosModal.querySelector('.ios-version');
    if (vMainIos && vModalIos) vModalIos.textContent = vMainIos.textContent || '';
  }
  var isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
  var block = document.getElementById('installModalIosDevice');
  var label = document.getElementById('installModalIosDeviceLabel');
  if (block) block.style.display = isIosDevice ? '' : 'none';
  if (label) label.textContent = /iPad/.test(navigator.userAgent) ? 'Install on this iPad' : 'Install on this iPhone';
  overlay.style.display = 'block';
  overlay.style.visibility = 'visible';
  overlay.style.opacity = '1';
  document.body.classList.add('modal-active');
  document.body.style.overflow = 'hidden';
  overlay.onclick = function(e) {
    if (e.target === overlay) closeInstallModal();
  };
  window._installModalEscapeHandler = function(e) {
    if (e.key === 'Escape') {
      document.removeEventListener('keydown', window._installModalEscapeHandler);
      window._installModalEscapeHandler = null;
      closeInstallModal();
    }
  };
  document.addEventListener('keydown', window._installModalEscapeHandler);
}

function closeInstallModal() {
  if (window._installModalOpenedByTutorial) {
    try { localStorage.setItem('rianellInstallModalAfterTutorialSeen', '1'); } catch (e) {}
  }
  window._installModalOpenedByTutorial = false;
  if (window._installModalEscapeHandler) {
    document.removeEventListener('keydown', window._installModalEscapeHandler);
    window._installModalEscapeHandler = null;
  }
  var overlay = document.getElementById('installModalOverlay');
  if (overlay) {
    overlay.style.display = 'none';
    overlay.style.visibility = 'hidden';
    overlay.style.opacity = '0';
    document.body.classList.remove('modal-active');
    document.body.style.overflow = '';
  }
}

function openSignupSigninModal() {
  const overlay = document.getElementById('signupSigninModalOverlay');
  if (!overlay) return;
  closeSettingsModalIfOpen();
  overlay.style.display = 'block';
  overlay.style.visibility = 'visible';
  overlay.style.opacity = '1';
  document.body.classList.add('modal-active');
  overlay.onclick = function(e) {
    if (e.target === overlay) closeSignupSigninModal();
  };
  const escapeHandler = function(e) {
    if (e.key === 'Escape') {
      closeSignupSigninModal();
      document.removeEventListener('keydown', escapeHandler);
    }
  };
  document.addEventListener('keydown', escapeHandler);
}

function closeSignupSigninModal() {
  const overlay = document.getElementById('signupSigninModalOverlay');
  if (overlay) {
    overlay.style.display = 'none';
    overlay.style.visibility = 'hidden';
    overlay.style.opacity = '0';
    document.body.classList.remove('modal-active');
    document.body.style.overflow = '';
  }
}

function finishTutorialAndOpenSignup() {
  closeTutorialModal();
  maybeShowInstallModalOnce();
  if (typeof openSignupSigninModal === 'function') {
    openSignupSigninModal();
  }
}

function toggleSignupModalPasswordVisibility() {
  const passwordInput = document.getElementById('signupModalPassword');
  const toggleBtn = document.getElementById('signupModalPasswordToggle');
  const toggleIcon = toggleBtn && toggleBtn.querySelector('.password-toggle-icon');
  if (!passwordInput || !toggleBtn || !toggleIcon) return;
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

var signupModalContext = {
  emailId: 'signupModalEmail',
  passwordId: 'signupModalPassword',
  signUpBtnId: 'signupModalSignUpBtn',
  loginBtnId: 'signupModalLoginBtn',
  onSuccess: function() {
    if (typeof closeSignupSigninModal === 'function') closeSignupSigninModal();
  }
};

function handleCloudSignUpFromModal() {
  if (typeof handleCloudSignUp === 'function') handleCloudSignUp(signupModalContext);
}

function handleCloudLoginFromModal() {
  if (typeof handleCloudLogin === 'function') handleCloudLogin(signupModalContext);
}

// Show tutorial once for new users (after DOM and modals ready)
function maybeShowTutorialOnce() {
  try {
    if (localStorage.getItem('rianellTutorialSeen')) return;
    openTutorialModal();
  } catch (err) {}
}

var DEMO_HASH_ONBOARDING_DONE_KEY = 'rianellDemoHashOnboardingDone';
var DEMO_HASH_PENDING_SESSION_KEY = 'rianellDemoHashPendingOnboarding';

/** Random non-zero goals for the one-time #demo deep-link onboarding (not used by the settings demo toggle). */
function applyRandomDemoGoalsForHashOnboarding() {
  var baseSteps = 3000 + Math.floor(Math.random() * 9000);
  var g = {
    steps: Math.round(baseSteps / 500) * 500,
    hydration: 4 + Math.floor(Math.random() * 9),
    sleep: 5 + Math.floor(Math.random() * 5),
    goodDaysPerWeek: 3 + Math.floor(Math.random() * 5)
  };
  try {
    localStorage.setItem('rianellGoals', JSON.stringify(g));
  } catch (e) {}
  try {
    if (typeof cloudSyncState !== 'undefined' && cloudSyncState.isAuthenticated && typeof syncToCloud === 'function') {
      syncToCloud();
    }
  } catch (e2) {}
  if (typeof updateGoalsProgressBlock === 'function') updateGoalsProgressBlock();
}

/**
 * One-time welcome for visitors who open /#demo (or #Demo): random goals + tutorial once after load.
 * Only when session was marked before enabling demo via the hash link; not when demo is toggled in Settings.
 * Returns true if this path handled tutorial (skip maybeShowTutorialOnce).
 */
function tryDemoHashLinkOnboarding() {
  try {
    if (localStorage.getItem(DEMO_HASH_ONBOARDING_DONE_KEY)) return false;
    if (sessionStorage.getItem(DEMO_HASH_PENDING_SESSION_KEY) !== '1') return false;
    if (typeof appSettings === 'undefined' || !appSettings.demoMode) {
      try { sessionStorage.removeItem(DEMO_HASH_PENDING_SESSION_KEY); } catch (e) {}
      return false;
    }
    sessionStorage.removeItem(DEMO_HASH_PENDING_SESSION_KEY);
    applyRandomDemoGoalsForHashOnboarding();
    localStorage.setItem(DEMO_HASH_ONBOARDING_DONE_KEY, '1');
    if (!localStorage.getItem('rianellTutorialSeen') && typeof openTutorialModal === 'function') {
      openTutorialModal();
      return true;
    }
    return true;
  } catch (err) {
    return false;
  }
}

function setDemoHashPendingOnboardingIfEligible() {
  try {
    if (localStorage.getItem(DEMO_HASH_ONBOARDING_DONE_KEY)) return;
    sessionStorage.setItem(DEMO_HASH_PENDING_SESSION_KEY, '1');
  } catch (e) {}
}

// Backtick ` key opens God mode – test all UI elements
function openModalTestOverlay() {
  const overlay = document.getElementById('modalTestOverlay');
  const container = document.getElementById('godModeSections');
  if (!overlay || !container) return;
  closeSettingsModalIfOpen();
  var today = new Date().toISOString().slice(0, 10);
  var firstLogDate = (typeof logs !== 'undefined' && logs && logs.length) ? logs[0].date : today;

  // All tests stay confined to this modal: trigger UI without closing God mode
  function run(fn) {
    return function() { fn(); };
  }

  var sections = [
    {
      title: 'Tabs',
      items: [
        { label: 'Open log wizard', action: run(function() { openLogWizardFromHome(); }) },
        { label: 'View Logs', action: run(function() { switchTab('logs'); }) },
        { label: 'Charts', action: run(function() { switchTab('charts'); }) },
        { label: 'AI Analysis', action: run(function() { switchTab('ai'); }) }
      ]
    },
    {
      title: 'Modals',
      items: [
        { label: 'Tutorial', action: run(openTutorialModal) },
        { label: 'Settings', action: run(toggleSettings) },
        { label: 'Cookie banner', action: run(function() { var b = document.getElementById('cookieBanner'); if (b) b.classList.remove('hidden'); }) },
        { label: 'Cookie policy', action: run(openCookiePolicyModal) },
        { label: 'Alert (sample)', action: run(function() { showAlertModal('This is a sample alert for testing.', 'Test Alert'); }) },
        { label: 'Food log', action: run(function() { openFoodModal(today); }) },
        { label: 'Exercise log', action: run(function() { openExerciseModal(today); }) },
        { label: 'Edit entry', action: run(function() { if (typeof logs !== 'undefined' && logs && logs.length) openEditEntryModal(firstLogDate); else showAlertModal('No entries to edit. Add a log first.', 'Edit Entry'); }) },
        { label: 'Export', action: run(exportData) },
        { label: 'Import', action: run(importData) },
        { label: 'Sign up / Sign in', action: run(openSignupSigninModal) },
        { label: 'GDPR agreement', action: run(function() { showGDPRAgreementModal(function() { closeGDPRAgreementModal(); }, function() { closeGDPRAgreementModal(); }); }) },
        { label: 'Install modal (post-tutorial)', action: run(function() { openInstallModal(true); }) }
      ]
    },
    {
      title: 'Charts',
      items: [
        { label: 'Balance view', action: run(function() { switchTab('charts'); setTimeout(function() { toggleChartView('balance'); }, 100); }) },
        { label: 'Individual charts', action: run(function() { switchTab('charts'); setTimeout(function() { toggleChartView('individual'); }, 100); }) },
        { label: 'Combined chart', action: run(function() { switchTab('charts'); setTimeout(function() { toggleChartView('combined'); }, 100); }) },
        { label: 'Select all (balance)', action: run(function() { if (typeof selectAllBalanceMetrics === 'function') selectAllBalanceMetrics(); }) },
        { label: 'Deselect all (balance)', action: run(function() { if (typeof deselectAllBalanceMetrics === 'function') deselectAllBalanceMetrics(); }) }
      ]
    },
    {
      title: 'AI range',
      items: [
        { label: '7 days', action: run(function() { switchTab('ai'); setAIDateRange(7); }) },
        { label: '30 days', action: run(function() { switchTab('ai'); setAIDateRange(30); }) },
        { label: '90 days', action: run(function() { switchTab('ai'); setAIDateRange(90); }) }
      ]
    },
    {
      title: 'Log form sections',
      items: [
        { label: 'Open: Basic metrics', action: run(function() { switchTab('log'); setTimeout(function() { toggleSection('basicMetrics'); }, 80); }) },
        { label: 'Open: Symptoms & Pain', action: run(function() { switchTab('log'); setTimeout(function() { toggleSection('symptoms'); }, 80); }) },
        { label: 'Open: Energy & Mental Clarity', action: run(function() { switchTab('log'); setTimeout(function() { toggleSection('energyCognitive'); }, 80); }) },
        { label: 'Open: Food log', action: run(function() { switchTab('log'); setTimeout(function() { toggleSection('foodLog'); }, 80); }) },
        { label: 'Open: Exercise log', action: run(function() { switchTab('log'); setTimeout(function() { toggleSection('exerciseLog'); }, 80); }) }
      ]
    },
    {
      title: 'Developer',
      hint: 'Clears the cached device performance tier. Reload the app to run the benchmark again and see the device-class modal.',
      items: [
        { label: 'Clear performance benchmark cache', action: run(clearBenchmarkCacheAndNotify) },
        { label: 'View last benchmark details', action: run(openBenchmarkDetails), desktopOnly: true }
      ]
    },
    {
      title: 'Other',
      items: [
        { label: 'Focus skip link', action: run(function() { var s = document.querySelector('.skip-link'); if (s) s.focus(); }) }
      ]
    }
  ];

  container.innerHTML = sections.map(function(s) {
    var btns = s.items.map(function(item, i) {
      var extraCls = item.desktopOnly ? ' god-mode-btn--desktop-only' : '';
      return '<button type="button" class="god-mode-btn' + extraCls + '">' + escapeHTML(item.label) + '</button>';
    }).join('');
    var hintHtml = s.hint ? '<p class="god-mode-section-hint">' + escapeHTML(s.hint) + '</p>' : '';
    return '<section class="god-mode-section"><h4 class="god-mode-section-title">' + escapeHTML(s.title) + '</h4><div class="god-mode-btn-group">' + btns + '</div>' + hintHtml + '</section>';
  }).join('');

  sections.forEach(function(s, sIdx) {
    var group = container.querySelectorAll('.god-mode-section')[sIdx];
    if (!group) return;
    var btns = group.querySelectorAll('.god-mode-btn');
    s.items.forEach(function(item, i) {
      if (btns[i]) btns[i].addEventListener('click', item.action);
    });
  });

  (function appendFunctionTraceSection() {
    var sec = document.createElement('section');
    sec.className = 'god-mode-section';
    var h4t = document.createElement('h4');
    h4t.className = 'god-mode-section-title';
    h4t.textContent = 'Function trace';
    var hint = document.createElement('p');
    hint.className = 'god-mode-section-hint';
    hint.textContent = 'Console-only (no network). Requires demo mode. When enabled, logs every instrumented function in the browser console.';
    var label = document.createElement('label');
    label.className = 'god-mode-trace-toggle-row';
    var cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.id = 'godModeFunctionTraceToggle';
    cb.className = 'god-mode-trace-toggle-input';
    try {
      cb.checked = localStorage.getItem('rianellFunctionTrace') === 'true';
    } catch (e) {
      cb.checked = false;
    }
    cb.addEventListener('change', function() {
      try {
        localStorage.setItem('rianellFunctionTrace', cb.checked ? 'true' : 'false');
        if (typeof window.__rianellRefreshFnTraceGate === 'function') window.__rianellRefreshFnTraceGate();
        if (typeof appSettings !== 'undefined' && appSettings.demoMode) {
          console.info('[fn-trace] ' + (cb.checked ? 'enabled' : 'disabled'));
        }
      } catch (err) {}
    });
    var slider = document.createElement('span');
    slider.className = 'god-mode-trace-toggle-switch';
    slider.setAttribute('aria-hidden', 'true');
    var span = document.createElement('span');
    span.className = 'god-mode-trace-toggle-text';
    span.textContent = 'Log all instrumented functions to console (verbose)';
    label.appendChild(cb);
    label.appendChild(slider);
    label.appendChild(span);
    sec.appendChild(h4t);
    sec.appendChild(hint);
    sec.appendChild(label);
    container.appendChild(sec);
  })();

  overlay.style.display = 'block';
  overlay.style.visibility = 'visible';
  overlay.style.opacity = '1';
  document.body.classList.add('modal-active');
  document.body.style.overflow = 'hidden';
  overlay.onclick = function(ev) {
    if (ev.target === overlay) closeModalTestOverlay();
  };
  window._modalTestEscapeHandler = function(ev) {
    if (ev.key === 'Escape') {
      document.removeEventListener('keydown', window._modalTestEscapeHandler);
      window._modalTestEscapeHandler = null;
      closeModalTestOverlay();
    }
  };
  document.addEventListener('keydown', window._modalTestEscapeHandler);
  var firstBtn = container.querySelector('button');
  if (firstBtn) firstBtn.focus();
}

function closeModalTestOverlay() {
  if (window._modalTestEscapeHandler) {
    document.removeEventListener('keydown', window._modalTestEscapeHandler);
    window._modalTestEscapeHandler = null;
  }
  var overlay = document.getElementById('modalTestOverlay');
  if (overlay) {
    overlay.style.display = 'none';
    overlay.style.visibility = 'hidden';
    overlay.style.opacity = '0';
  }
  document.body.classList.remove('modal-active');
  document.body.style.overflow = '';
}

document.addEventListener('keydown', function(e) {
  if (e.key !== '`') return;
  if (typeof appSettings === 'undefined' || !appSettings.demoMode) return;
  var tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
  var isInput = tag === 'input' || tag === 'textarea' || tag === 'select' || (e.target && e.target.isContentEditable);
  if (isInput) return;
  e.preventDefault();
  openModalTestOverlay();
});

// Show GDPR Data Agreement Modal
function showGDPRAgreementModal(onAgree, onDecline) {
  const overlay = document.getElementById('gdprAgreementModalOverlay');
  if (!overlay) {
    Logger.error('GDPR Agreement modal not found');
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
  
  // Centre modal, positioned much higher to ensure buttons are visible
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
    Logger.warn('Alert modal elements not found, using native confirm');
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
    <button class="modal-save-btn modal-danger-btn" id="confirmYesBtn">Yes, Continue</button>
    <button class="modal-save-btn modal-cancel-btn" id="confirmNoBtn">Cancel</button>
  `;
  
  // Show modal
  overlay.style.display = 'block';
  overlay.style.visibility = 'visible';
  overlay.style.opacity = '1';
  overlay.style.zIndex = '100001';
  document.body.classList.add('modal-active');
  
  // Centre modal
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
    Logger.error('Password input not found');
    return;
  }
  
  const toggleBtn = document.getElementById('passwordToggle');
  if (!toggleBtn) {
    Logger.error('Password toggle button not found');
    return;
  }
  
  const toggleIcon = toggleBtn.querySelector('.password-toggle-icon');
  if (!toggleIcon) {
    Logger.error('Password toggle icon not found');
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

// Log app initialization
Logger.info('Rianell initialized', {
  timestamp: new Date().toISOString(),
  localStorageAvailable: typeof(Storage) !== 'undefined'
});

// Startup environment summary for testing
(function() {
  try {
    var demoMode = false;
    var aiEnabled = true;
    if (typeof localStorage !== 'undefined' && localStorage.getItem('rianellSettings')) {
      var parsed = JSON.parse(localStorage.getItem('rianellSettings'));
      demoMode = !!parsed.demoMode;
      aiEnabled = parsed.aiEnabled !== false;
    }
    Logger.info('Environment', {
      isStaticHost: isStaticHost(),
      hostname: typeof window !== 'undefined' && window.location ? window.location.hostname : '',
      demoMode: demoMode,
      aiEnabled: aiEnabled
    });
  } catch (e) {}
})();

// ============================================
// PWA Service Worker - blocked by default; optional static cache (localStorage rianellEnableStaticSW=1 or ?sw=1)
// ============================================
if ('serviceWorker' in navigator) {
  var enableStaticSW = (typeof localStorage !== 'undefined' && localStorage.getItem('rianellEnableStaticSW') === '1') ||
    (typeof location !== 'undefined' && /[?&]sw=1(?:&|$)/.test(location.search));
  if (!enableStaticSW) {
    const originalRegister = navigator.serviceWorker.register;
    navigator.serviceWorker.register = function() {
      Logger.debug('Service Worker registration blocked (enable with rianellEnableStaticSW=1 or ?sw=1)');
      return Promise.reject(new Error('Service Worker disabled'));
    };
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(registration => {
        registration.unregister().then(success => {
          if (success) Logger.debug('Service Worker unregistered');
        });
      });
    });
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => { caches.delete(name); });
      });
    }
  } else {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    });
  }
}

// Reduce memory pressure on mobile: skip heavy work when tab is in background (avoids "can't open page" / crash)
if (typeof document !== 'undefined') {
  function updatePageHidden() {
    window.__pageHidden = document.visibilityState === 'hidden';
  }
  updatePageHidden();
  document.addEventListener('visibilitychange', updatePageHidden);
}

(function initRianellIOWorker() {
  window.RianellIOWorker = {
    parseJson: function (text) {
      return new Promise(function (resolve, reject) {
        var w;
        try {
          w = new Worker('workers/io-worker.js');
        } catch (e) {
          try { resolve(JSON.parse(text)); } catch (e2) { reject(e2); }
          return;
        }
        var id = Math.random().toString(36).slice(2);
        w.onmessage = function (ev) {
          w.terminate();
          var d = ev.data;
          if (d && d.ok) resolve(d.result);
          else reject(new Error(d && d.error ? d.error : 'parse failed'));
        };
        w.onerror = function (err) { try { w.terminate(); } catch (e) {} reject(err); };
        w.postMessage({ type: 'parseJson', text: text, id: id });
      });
    },
    stringifyJson: function (value) {
      return new Promise(function (resolve, reject) {
        var w;
        try {
          w = new Worker('workers/io-worker.js');
        } catch (e) {
          try { resolve(JSON.stringify(value)); } catch (e2) { reject(e2); }
          return;
        }
        var id = Math.random().toString(36).slice(2);
        w.onmessage = function (ev) {
          w.terminate();
          var d = ev.data;
          if (d && d.ok) resolve(d.result);
          else reject(new Error(d && d.error ? d.error : 'stringify failed'));
        };
        w.onerror = function (err) { try { w.terminate(); } catch (e) {} reject(err); };
        w.postMessage({ type: 'stringifyJson', value: value, id: id });
      });
    }
  };
})();

function installPerfLongTaskObserver() {
  if (typeof PerformanceObserver === 'undefined') return;
  if (typeof localStorage === 'undefined') return;
  if (localStorage.getItem('rianellPerfLongTasks') !== '1' && !window.rianellDebug) return;
  try {
    var po = new PerformanceObserver(function (list) {
      var entries = list.getEntries();
      for (var i = 0; i < entries.length; i++) {
        if (window.console && console.warn) console.warn('[longtask]', Math.round(entries[i].duration) + 'ms');
      }
    });
    po.observe({ type: 'longtask', buffered: true });
  } catch (e) {}
}

// PWA Install Prompt
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  if (isRianellNativeApp()) return;
  Logger.debug('PWA: Install prompt triggered');
  e.preventDefault();
  Logger.debug('PWA: install prompt deferred (Chrome may log until user taps Install)');
  deferredPrompt = e;
  showInstallButton();
});

function showInstallButton() {
  if (isRianellNativeApp()) return;
  if (document.getElementById('installButton')) return;
  const installButton = document.createElement('button');
  installButton.id = 'installButton';
  installButton.type = 'button';
  installButton.innerHTML =
    '<span class="data-management-buttons__icon" aria-hidden="true">📱</span><span class="data-management-buttons__label">Install App</span>';
  installButton.className = 'settings-data-btn install-app-btn';
  installButton.onclick = installPWA;
  // Place inside Settings panel only (data-management-buttons or settings-footer), never in header
  const buttonContainer = document.querySelector('.data-management-buttons') ||
    document.querySelector('.settings-footer') ||
    document.body;
  if (buttonContainer) {
    if (buttonContainer.classList && buttonContainer.classList.contains('data-management-buttons')) {
      const cell = document.createElement('div');
      cell.className = 'data-management-buttons__cell';
      cell.id = 'installButtonCell';
      cell.appendChild(installButton);
      buttonContainer.insertBefore(cell, buttonContainer.firstChild);
      var installWebAppOption = document.getElementById('installWebAppOption');
      if (installWebAppOption) installWebAppOption.style.display = 'none';
    } else {
      installButton.style.marginBottom = '10px';
      buttonContainer.appendChild(installButton);
    }
  }
}

function installPWA() {
  if (isRianellNativeApp()) return;
  if (deferredPrompt) {
    try {
      if (navigator.userActivation && !navigator.userActivation.isActive) {
        Logger.warn('PWA: prompt() blocked - missing user activation');
        showInstallInstructions();
        return;
      }
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          Logger.debug('PWA: User accepted the install prompt');
          hideInstallButton();
        } else {
          Logger.debug('PWA: User dismissed the install prompt');
        }
        deferredPrompt = null;
      }).catch((err) => {
        Logger.warn('PWA: install prompt failed', { error: err && err.message ? err.message : String(err) });
      });
    } catch (err) {
      Logger.warn('PWA: install prompt threw', { error: err && err.message ? err.message : String(err) });
      showInstallInstructions();
    }
  }
}

function hideInstallButton() {
  const installButton = document.getElementById('installButton');
  if (installButton) {
    var parent = installButton.parentElement;
    if (parent && parent.id === 'installButtonCell' && parent.classList && parent.classList.contains('data-management-buttons__cell')) {
      parent.remove();
    } else {
      installButton.remove();
    }
  }
  var installWebAppOption = document.getElementById('installWebAppOption');
  if (installWebAppOption && !isRianellNativeApp()) installWebAppOption.style.display = '';
}

// Enhanced PWA functions for settings menu
// Enhanced PWA install function for Safari and other browsers
function installOrLaunchPWA() {
  if (isRianellNativeApp()) return;
  // Debug info
  Logger.debug('PWA Install Debug:', {
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
    try {
      if (navigator.userActivation && !navigator.userActivation.isActive) {
        Logger.warn('PWA: installOrLaunch blocked - missing user activation');
        showInstallInstructions();
        return;
      }
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          Logger.debug('PWA: User accepted the install prompt');
          showAlertModal('App installed successfully! 📱\nLook for "Rianell" in your apps.', 'Installation Complete');
          hideInstallButton();
        } else {
          Logger.debug('PWA: User dismissed the install prompt');
        }
        deferredPrompt = null;
      }).catch((err) => {
        Logger.warn('PWA: installOrLaunch userChoice failed', { error: err && err.message ? err.message : String(err) });
        showInstallInstructions();
      });
    } catch (err) {
      Logger.warn('PWA: installOrLaunch prompt threw', { error: err && err.message ? err.message : String(err) });
      showInstallInstructions();
    }
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
  const newWindow = window.open(standaloneUrl, 'RianellApp', 
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
3. Name: "Rianell"
4. ✅ Check "Open as window"
5. Click "Create"

METHOD 2 - Install Button:
• Look for install icon (⊞) in address bar
• Or ⋮ menu → "Install Rianell"

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
      const isDataBase64Suppress = errorString.includes('ERR_INVALID_URL') && errorString.includes('data:;base64');

      if (isExtensionError) {
        if (isDataBase64Suppress && !window._dataBase64SuppressLogged) {
          window._dataBase64SuppressLogged = true;
          if (typeof Logger !== 'undefined' && Logger.debug) Logger.debug('Suppressed known extension/invalid data URL error');
        }
        return;
      }
      // Call original console.error for legitimate errors
      originalConsoleError.apply(console, args);
    };
  } catch (e) {
    // If console.error override fails, just continue
    Logger.warn('Failed to set up error filtering', { error: e });
  }
})();

window.addEventListener('error', function(e) {
  // Filter out browser extension errors
  const errorMsg = e.message || String(e.error || '');
  const filename = e.filename || e.target?.src || '';
  const target = e.target;
  
  const isDataBase64 = (errorMsg.includes('ERR_INVALID_URL') && errorMsg.includes('data:;base64')) ||
    filename.includes('data:;base64') ||
    (target && target.src && target.src.includes('data:;base64'));
  const isExtensionError = 
    errorMsg.includes('No tab with id') || 
    errorMsg.includes('Frame with ID') ||
    errorMsg.includes('serviceWorker.js') ||
    errorMsg.includes('background.js') ||
    isDataBase64 ||
    filename.includes('chrome-extension://') ||
    filename.includes('moz-extension://') ||
    filename.includes('serviceWorker.js') ||
    filename.includes('background.js') ||
    filename.includes('inpage.js') ||
    filename.includes('extension://');

  if (isExtensionError) {
    if (isDataBase64 && !window._dataBase64SuppressLogged) {
      window._dataBase64SuppressLogged = true;
      if (typeof Logger !== 'undefined' && Logger.debug) Logger.debug('Suppressed known extension/invalid data URL error');
    }
    e.preventDefault();
    e.stopPropagation();
    return false;
  }
}, true);

// toggleSettings placeholder - will be replaced by full implementation later
// This ensures inline onclick handlers don't error
function settingsOverlaySetOpen(overlay, open) {
  if (!overlay) return;
  if (open) {
    document.body.style.overflow = 'hidden';
    overlay.style.display = 'block';
    overlay.style.visibility = 'visible';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.right = '0';
    overlay.style.bottom = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.zIndex = '99999';
    document.body.classList.add('modal-active');
    requestAnimationFrame(function() {
      overlay.classList.add('settings-overlay--open');
    });
    if (typeof loadSettingsState === 'function') loadSettingsState();
  } else {
    overlay.classList.remove('settings-overlay--open');
    var cleaned = false;
    function doCleanup() {
      if (cleaned) return;
      cleaned = true;
      overlay.removeEventListener('transitionend', onEnd);
      if (t) clearTimeout(t);
      overlay.style.display = 'none';
      overlay.style.visibility = 'hidden';
      document.body.classList.remove('modal-active');
      document.body.style.overflow = '';
    }
    var onEnd = function(e) {
      if (e.target !== overlay) return;
      doCleanup();
    };
    overlay.addEventListener('transitionend', onEnd);
    var t = setTimeout(doCleanup, 450);
  }
}
window.toggleSettings = function() {
  const overlay = document.getElementById('settingsOverlay');
  if (!overlay) return;
  const isVisible = overlay.classList.contains('settings-overlay--open') || overlay.style.display === 'block' || overlay.style.display === 'flex';
  if (isVisible) {
    settingsOverlaySetOpen(overlay, false);
  } else {
    if (typeof refreshBuildDownloadLinks === 'function') refreshBuildDownloadLinks();
    settingsOverlaySetOpen(overlay, true);
    const menu = overlay.querySelector('.settings-menu');
    if (menu) {
      menu.style.position = 'fixed';
      menu.style.top = '50%';
      menu.style.left = '50%';
      menu.style.right = 'auto';
      menu.style.bottom = 'auto';
      menu.style.zIndex = '100000';
      menu.style.display = 'flex';
      menu.style.visibility = 'visible';
    }
  }
};

/**
 * Ensure MOTD lives as the first child of #main-content (sticky needs in-flow placement in the scroll pane).
 * Older builds moved it under #appShell for position:fixed — restore so sticky + layout match shipped CSS.
 */
function restoreMotdTitleToMainIfNeeded() {
  var main = document.getElementById('main-content');
  var title = document.querySelector('.title-container');
  if (!main || !title) return;
  if (title.parentNode !== main) {
    main.insertBefore(title, main.firstElementChild);
  } else if (title !== main.firstElementChild) {
    main.insertBefore(title, main.firstElementChild);
  }
}

/**
 * Mobile: MOTD is in-flow (not sticky). Clear any legacy inline padding-top on #main-content.
 */
function syncMobileFixedTitlePadding() {
  var main = document.getElementById('main-content');
  if (!main) return;
  var narrow = false;
  try {
    narrow = window.matchMedia('(max-width: 768px)').matches;
  } catch (e) {}
  if (!narrow) {
    main.style.removeProperty('padding-top');
    return;
  }
  main.style.removeProperty('padding-top');
}

function initMotdScrollBlurForMobile() {
  restoreMotdTitleToMainIfNeeded();
  var titleWrap = document.querySelector('.title-container');
  if (titleWrap) titleWrap.style.removeProperty('--motd-strength');
  syncMobileFixedTitlePadding();
  if (window._mobileTitlePadRO) {
    try {
      window._mobileTitlePadRO.disconnect();
    } catch (e) {}
    window._mobileTitlePadRO = null;
  }
  if (typeof ResizeObserver !== 'undefined' && titleWrap) {
    window._mobileTitlePadRO = new ResizeObserver(function() {
      syncMobileFixedTitlePadding();
    });
    window._mobileTitlePadRO.observe(titleWrap);
  }
  if (!window._mobileTitlePadListenersBound) {
    window._mobileTitlePadListenersBound = true;
    var deb;
    window.addEventListener('resize', function() {
      clearTimeout(deb);
      deb = setTimeout(function() {
        restoreMotdTitleToMainIfNeeded();
        syncMobileFixedTitlePadding();
      }, 100);
    });
    var mql = window.matchMedia('(max-width: 768px)');
    function onNarrowChange() {
      restoreMotdTitleToMainIfNeeded();
      syncMobileFixedTitlePadding();
    }
    if (mql.addEventListener) mql.addEventListener('change', onNarrowChange);
    else if (mql.addListener) mql.addListener(onNarrowChange);
  }
}

window.addEventListener('DOMContentLoaded', function() {
  // Ensure settings button works - add direct event listener as backup
  const settingsButton = document.querySelector('.settings-button-top');
  if (settingsButton) {
    settingsButton.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      if (typeof window.toggleSettings === 'function') {
        window.toggleSettings();
      }
    });
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
  
  /* Cache-bust via static ?v= on link/script tags in index.html — do not rewrite href/src here.
     Changing stylesheet href forces a full CSS reload and a gap where base rules (e.g. mobile bottom nav
     display:none) win until the new sheet loads, which caused nav flicker. */
  
  var backBtn = document.getElementById('logWizardBackBtn');
  var nextBtn = document.getElementById('logWizardNextBtn');
  var skipBtn = document.getElementById('logWizardSkipBtn');
  if (backBtn) backBtn.addEventListener('click', function() { logWizardGoBack(); });
  if (nextBtn) nextBtn.addEventListener('click', function() { logWizardGoNext(); });
  if (skipBtn) skipBtn.addEventListener('click', function() { logWizardSkipCurrentStep(); });
  var logFormEl = document.getElementById('logForm');
  if (logFormEl) {
    logFormEl.addEventListener('input', scheduleLogDraftPersist);
    logFormEl.addEventListener('change', scheduleLogDraftPersist);
  }
  var medTimePickerEl = document.getElementById('medTimePicker');
  if (medTimePickerEl) {
    medTimePickerEl.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (typeof addMedTimeTagFromPicker === 'function') addMedTimeTagFromPicker();
      }
    });
  }
  window.addEventListener('hashchange', function() {
    if (logWizardNavSyncing) return;
    var _h = (typeof location !== 'undefined' && location.hash ? location.hash : '').replace(/^#/, '');
    if (_h.toLowerCase() === 'demo') {
      try {
        history.replaceState(null, '', location.pathname + location.search + '#home');
      } catch (e) { /* ignore */ }
      if (typeof appSettings !== 'undefined' && appSettings.demoMode) {
        location.reload();
        return;
      }
      if (typeof setDemoHashPendingOnboardingIfEligible === 'function') setDemoHashPendingOnboardingIfEligible();
      if (typeof toggleDemoMode === 'function') {
        toggleDemoMode();
      }
      return;
    }
    applyHashRoute();
  });

  window.addEventListener('online', function() {
    flushOfflineQueue();
  });
  if (navigator.onLine) {
    flushOfflineQueue();
  }

  var pageParams = typeof URLSearchParams !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  if (pageParams && pageParams.get('charts') === 'true') {
    var chartSectionEl = document.getElementById('chartSection');
    if (chartSectionEl) chartSectionEl.classList.remove('hidden');
  }

  // Initialize food and exercise lists on page load
  renderLogFoodItems();
  renderLogExerciseItems();
  renderLogMedicationsItems();
  renderEnergyClarityTiles();
  renderStressorTiles('logStressorsTiles');
  renderLogSymptomsItems(); // also populates logSymptomsTiles
  initPainBodyDiagram('painBodyDiagram', 'painLocation');
  initPainBodyDiagram('editPainBodyDiagram', 'editPainLocation');
  initMotdScrollBlurForMobile();
  if (typeof updateGoalsProgressBlock === 'function') updateGoalsProgressBlock();
  ['steps', 'hydration', 'sleep'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', updateGoalsProgressBlock);
      el.addEventListener('change', updateGoalsProgressBlock);
    }
  });

  // Connect to Server-Sent Events for auto-reload on file changes
  connectToReloadStream();
});

// Server-Sent Events connection for auto-reload (dev server only; skip on static hosts)
function connectToReloadStream() {
  // index.html sets true only on loopback; undefined/false elsewhere - never connect on static/CDN without explicit dev flag
  if (typeof window !== 'undefined' && window.__rianellReloadStreamOk !== true) {
    Logger.debug('Reload stream disabled (not dev host)');
    return;
  }
  if (isStaticHost()) {
    Logger.debug('Reload stream disabled (static host)');
    return; // No /api/reload on GitHub Pages, Netlify, etc.
  }
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

        if (typeof window !== 'undefined' && window.__rianellReloadStreamOk !== true) {
          return;
        }
        if (isStaticHost()) {
          return;
        }

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
    if (typeof window !== 'undefined' && window.__rianellReloadStreamOk !== true) {
      return;
    }
    if (isStaticHost()) {
      return;
    }
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

    // BPM validation (optional - Basic Metrics)
    this.rules.set('bpm', {
      required: false,
      validate: (value) => {
        if (!value) return null;
        
        const bpm = parseInt(value);
        if (isNaN(bpm)) return 'BPM must be a number';
        if (bpm < 30) return 'BPM cannot be less than 30';
        if (bpm > 200) return 'BPM cannot be more than 200 (please check this value)';
        if (bpm > 120) return 'High BPM detected - please verify this is correct';
        
        return null;
      }
    });

    // Weight validation (optional - Basic Metrics)
    this.rules.set('weight', {
      required: false,
      validate: (value) => {
        if (!value) return null;
        
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

    // Slider validations (all mandatory: Energy, Symptoms, Stress, Lifestyle)
    const sliderFields = ['fatigue', 'stiffness', 'sleep', 'jointPain', 'mobility', 'dailyFunction', 'swelling', 'mood', 'irritability', 'weatherSensitivity'];
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
      'dailyFunction': 'Daily Activities',
      'swelling': 'Swelling',
      'mood': 'Mood',
      'irritability': 'Irritability',
      'weatherSensitivity': 'Weather Sensitivity'
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

// Suggest note: LLM when available (same pipeline as Summary note), else rule-based (AIEngine.suggestLogNote)
(function() {
  var suggestBtn = document.getElementById('suggestNoteBtn');
  if (!suggestBtn) return;
  suggestBtn.addEventListener('click', async function() {
    if (window.PerformanceUtils && typeof window.PerformanceUtils.ensureAIEngineLoaded === 'function') {
      try {
        await window.PerformanceUtils.ensureAIEngineLoaded();
      } catch (e) {
        return;
      }
    }
    if (!window.AIEngine || typeof window.AIEngine.suggestLogNote !== 'function') return;
    var dateEl = document.getElementById('date');
    var stub = { date: dateEl ? dateEl.value : '' };
    var flareEl = document.getElementById('flare');
    if (flareEl) stub.flare = flareEl.value || 'No';
    ['backPain', 'stiffness', 'fatigue', 'sleep', 'jointPain', 'mobility', 'dailyFunction', 'swelling', 'mood', 'irritability'].forEach(function(m) {
      var el = document.getElementById(m);
      if (el) stub[m] = m === 'weight' ? parseFloat(el.value) : (parseInt(el.value, 10) || 0);
    });
    try {
      var raw = typeof localStorage !== 'undefined' && localStorage.getItem('healthLogs');
      var allLogs = raw ? JSON.parse(raw) : [];
      var sorted = (window.PerformanceUtils && window.PerformanceUtils.memoizedSort)
        ? window.PerformanceUtils.memoizedSort(allLogs, function(a, b) { return new Date(a.date) - new Date(b.date); }, 'suggestNote')
        : allLogs.slice().sort(function(a, b) { return new Date(a.date) - new Date(b.date); });
      var fallback = window.AIEngine.suggestLogNote(stub, { recentLogs: sorted });
      var contextStr = (typeof window.buildSuggestContext === 'function') ? window.buildSuggestContext(stub, sorted) : '';
      var useLLM = (typeof window.generateSuggestNoteWithLLM === 'function' || (window.PerformanceUtils && window.PerformanceUtils.platform && window.PerformanceUtils.platform.deviceClass === 'low')) && contextStr && contextStr.length >= 30;

      function applySuggestion(text) {
        if (text && notesField) {
          var cur = (notesField.value || '').trim();
          notesField.value = cur ? cur + ' ' + text : text;
          updateNotesCounter();
        }
      }

      if (useLLM) {
        var btnLabel = suggestBtn.textContent || suggestBtn.innerText;
        suggestBtn.textContent = 'Generating…';
        suggestBtn.disabled = true;
        if (typeof window.generateSuggestNoteWithLLM !== 'function' && window.PerformanceUtils && window.PerformanceUtils.platform && window.PerformanceUtils.platform.deviceClass === 'low' && typeof window.PerformanceUtils.lazyLoadScript === 'function') {
          try {
            await window.PerformanceUtils.lazyLoadScript('summary-llm.js');
          } catch (e) {}
        }
        if (typeof window.generateSuggestNoteWithLLM === 'function') {
          window.generateSuggestNoteWithLLM(contextStr, fallback || '')
            .then(function(text) {
              applySuggestion(text || fallback);
            })
            .catch(function() {
              applySuggestion(fallback);
            })
            .finally(function() {
              suggestBtn.textContent = btnLabel;
              suggestBtn.disabled = false;
            });
        } else {
          applySuggestion(fallback);
          suggestBtn.textContent = btnLabel;
          suggestBtn.disabled = false;
        }
      } else {
        applySuggestion(fallback);
      }
    } catch (e) {
      if (window.AIEngine && typeof window.AIEngine.suggestLogNote === 'function') {
        var sorted = [];
        try {
          var raw = typeof localStorage !== 'undefined' && localStorage.getItem('healthLogs');
          if (raw) sorted = JSON.parse(raw).sort(function(a, b) { return new Date(a.date) - new Date(b.date); });
        } catch (e2) {}
        applySuggestion(window.AIEngine.suggestLogNote(stub, { recentLogs: sorted }));
      }
    }
  });
})();

const form = document.getElementById("logForm");
const output = document.getElementById("logOutput");
const chartSection = document.getElementById("chartSection");

// Initialize slider colors and add event listeners
const sliders = ['fatigue', 'stiffness', 'sleep', 'jointPain', 'mobility', 'dailyFunction', 'swelling', 'mood', 'irritability', 'weatherSensitivity'];

function updateSliderColor(slider) {
  const value = parseInt(slider.value, 10);
  const percentage = (value / 10) * 100;

  // Sliders where HIGH values are GOOD (inverted colors: low = red, high = green)
  const invertedSliders = ['sleep', 'mobility', 'dailyFunction', 'mood'];
  const isInverted = invertedSliders.includes(slider.id);

  let fillColor;

  if (isInverted) {
    if (value >= 8 && value <= 10) {
      fillColor = '#4CAF50';
    } else if (value >= 4 && value <= 7) {
      fillColor = '#FF9800';
    } else if (value >= 1 && value <= 3) {
      fillColor = '#F44336';
    }
  } else {
    if (value >= 1 && value <= 3) {
      fillColor = '#4CAF50';
    } else if (value >= 4 && value <= 7) {
      fillColor = '#FF9800';
    } else if (value >= 8 && value <= 10) {
      fillColor = '#F44336';
    }
  }

  // Sleek track uses CSS vars (see styles.css); thumb border matches fill
  slider.style.setProperty('--slider-fill-pct', `${percentage}%`);
  slider.style.setProperty('--slider-fill-color', fillColor);

  slider.classList.remove('green', 'orange', 'red');
  if (fillColor === '#4CAF50') {
    slider.classList.add('green');
  } else if (fillColor === '#FF9800') {
    slider.classList.add('orange');
  } else if (fillColor === '#F44336') {
    slider.classList.add('red');
  }

  // Value pill next to label (touch-friendly feedback)
  try {
    const lab = slider.parentElement && slider.parentElement.querySelector(`label[for="${slider.id}"]`);
    if (lab) {
      let badge = lab.querySelector('.slider-value-badge');
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'slider-value-badge';
        badge.setAttribute('aria-hidden', 'true');
        lab.appendChild(badge);
      }
      badge.textContent = String(value);
    }
  } catch (e) { /* ignore */ }
}

sliders.forEach(sliderId => {
  const slider = document.getElementById(sliderId);
  slider.value = 5; // Set default value
  updateSliderColor(slider);
  
  slider.addEventListener('input', function() {
    updateSliderColor(this);
  });
});

/** Which chart layout is active (balance | combined | individual). */
function getCurrentChartView() {
  var v = appSettings.chartView;
  if (v === 'balance' || v === 'combined' || v === 'individual') return v;
  return appSettings.combinedChart ? 'combined' : 'individual';
}

/** Keep chartView and legacy combinedChart flag consistent after load or migration. */
function normalizeChartViewSettings() {
  var v = appSettings.chartView;
  if (v !== 'balance' && v !== 'combined' && v !== 'individual') {
    appSettings.chartView = appSettings.combinedChart ? 'combined' : 'individual';
  }
  appSettings.combinedChart = appSettings.chartView === 'combined';
}

/**
 * Show exactly one of combined / balance / individual chart sections.
 * @param {'balance'|'combined'|'individual'|null} active - null hides all three (no data).
 */
function enforceChartSectionView(active) {
  var c = document.getElementById('combinedChartContainer');
  var b = document.getElementById('balanceChartContainer');
  var i = document.getElementById('individualChartsContainer');
  if (!c || !b || !i) return;
  if (!active) {
    c.classList.add('hidden');
    b.classList.add('hidden');
    i.classList.add('hidden');
    return;
  }
  c.classList.toggle('hidden', active !== 'combined');
  b.classList.toggle('hidden', active !== 'balance');
  i.classList.toggle('hidden', active !== 'individual');
}

var _chartViewSwitchTimeout = null;
function toggleChartView(viewType) {
  // Handle legacy boolean parameter for backward compatibility
  if (typeof viewType === 'boolean') {
    viewType = viewType ? 'combined' : 'individual';
  }
  if (_chartViewSwitchTimeout) {
    clearTimeout(_chartViewSwitchTimeout);
    _chartViewSwitchTimeout = null;
  }
  const individualBtn = document.getElementById('individualViewBtn');
  const combinedBtn = document.getElementById('combinedViewBtn');
  const balanceBtn = document.getElementById('balanceViewBtn');
  
  // Hide prediction controls for balance view or when AI features disabled
  const aiOn = typeof appSettings !== 'undefined' && appSettings.aiEnabled !== false;
  const predictionControls = document.querySelectorAll('.filter-group');
  predictionControls.forEach(group => {
    if (group.querySelector('.prediction-range-buttons')) {
      if (viewType === 'balance' || !aiOn) {
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
    enforceChartSectionView(null);
    
    // Hide metric selectors
    const combinedMetricSelector = document.getElementById('combinedChartMetricSelector');
    const balanceMetricSelector = document.getElementById('balanceChartMetricSelector');
    if (combinedMetricSelector) combinedMetricSelector.classList.add('hidden');
    if (balanceMetricSelector) balanceMetricSelector.classList.add('hidden');
    
    updateChartEmptyState(false);
    return;
  }
  
  enforceChartSectionView(viewType);
  
  // Remove active state from all buttons
  if (individualBtn) individualBtn.classList.remove('active');
  if (combinedBtn) combinedBtn.classList.remove('active');
  if (balanceBtn) balanceBtn.classList.remove('active');
  
  if (viewType === 'combined') {
    if (combinedBtn) combinedBtn.classList.add('active');
    
    // Disconnect chart observer when showing combined view
    if (chartObserver) {
      chartObserver.disconnect();
    }
    
    // Small delay to prevent jump; cancel if user switches view again
    _chartViewSwitchTimeout = setTimeout(() => {
      _chartViewSwitchTimeout = null;
      createCombinedChart();
    }, 50);
  } else if (viewType === 'balance') {
    if (balanceBtn) balanceBtn.classList.add('active');
    
    // Disconnect chart observer when showing balance view
    if (chartObserver) {
      chartObserver.disconnect();
    }
    
    // Small delay to prevent jump; cancel if user switches view again
    _chartViewSwitchTimeout = setTimeout(() => {
      _chartViewSwitchTimeout = null;
      createBalanceChart();
    }, 50);
  } else {
    // Individual view: load all charts immediately so they render with correct dimensions
    // (lazy loading can fail when containers were previously hidden and have zero height)
    if (individualBtn) individualBtn.classList.add('active');
    if (typeof updateChartsImmediate === 'function') {
      void updateChartsImmediate().catch(function () {});
    } else {
      updateCharts();
    }
  }
}

async function createCombinedChart() {
  var _perfT0 = Date.now();
  if (window.rianellDebug && Logger.debug) {
    Logger.debug('createCombinedChart: starting');
  }
  try {
    if (window.PerformanceUtils && typeof window.PerformanceUtils.ensureApexChartsLoaded === 'function') {
      await window.PerformanceUtils.ensureApexChartsLoaded();
    }
  } catch (e) {
    console.error('ApexCharts is not loaded! Cannot create combined chart.', e);
    return;
  }
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
    Logger.debug('Combined chart: no data in date range (empty state)');
    updateChartEmptyState(false);
    return;
  }
  
  updateChartEmptyState(true);
  
  // Full rebuild deferred: may use updateSeries in-place when signature matches (see end of function)
  
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
  
  const deviceOpts = (window.PerformanceUtils && typeof window.PerformanceUtils.getDeviceOpts === 'function')
    ? window.PerformanceUtils.getDeviceOpts() : { maxChartPoints: 200, reduceAnimations: false };
  
  // Use prediction range setting (only when AI features enabled and predictions on)
  const daysToPredict = predictionRange;
  const aiOn = typeof appSettings !== 'undefined' && appSettings.aiEnabled !== false;
  if (aiOn && predictionsEnabled && window.PerformanceUtils && typeof window.PerformanceUtils.ensureAIEngineLoaded === 'function') {
    try {
      await window.PerformanceUtils.ensureAIEngineLoaded();
    } catch (e) { /* chart can render without predictions */ }
  }

  // Get predictions for all metrics (use chart results cache when available)
  let predictionsData = null;
  const viewKey = getChartViewCacheKey(chartDateRange.type, chartDateRange.startDate, chartDateRange.endDate);
  if (aiOn && predictionsEnabled && window.AIEngine && filteredLogs.length >= 2) {
    const cached = getChartResultsCache(viewKey, predictionRange, logs.length);
    if (cached && cached.analysis && cached.analysis.trends) {
      predictionsData = {
        trends: cached.analysis.trends,
        daysToPredict: cached.daysToPredict,
        lastDate: cached.lastDate,
        allLogsLength: cached.allLogsLength
      };
    } else {
      var chartContainerEl = document.getElementById('combinedChartContainer');
      var predictionsLoadingEl = null;
      if (chartContainerEl) {
        predictionsLoadingEl = document.createElement('div');
        predictionsLoadingEl.className = 'chart-predictions-loading-overlay';
        predictionsLoadingEl.setAttribute('aria-live', 'polite');
        predictionsLoadingEl.textContent = 'Calculating predictions…';
        chartContainerEl.appendChild(predictionsLoadingEl);
      }
      try {
        const sortedLogs = window.PerformanceUtils?.memoizedSort
          ? window.PerformanceUtils.memoizedSort(filteredLogs, (a, b) => new Date(a.date) - new Date(b.date), 'sortedFilteredLogs')
          : [...filteredLogs].sort((a, b) => new Date(a.date) - new Date(b.date));
        const allHistoricalLogs = window.PerformanceUtils?.DataCache?.get('allHistoricalLogs', function () {
          return getAllHistoricalLogsSortedSync();
        }, 60000) || getAllHistoricalLogsSortedSync();
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
        let combinedTrainingLogs = appSettings.useOpenData
          ? [...allHistoricalLogs, ...anonymizedTrainingData]
          : allHistoricalLogs;
        // Cap training size so chart predictions stay fast (avoid 90s+ blocks with 3000+ logs)
        var MAX_TRAINING_LOGS_CHARTS = 1200;
        if (combinedTrainingLogs.length > MAX_TRAINING_LOGS_CHARTS) {
          combinedTrainingLogs = combinedTrainingLogs.slice(-MAX_TRAINING_LOGS_CHARTS);
        }
        const analysis = await analyzeHealthMetrics(sortedLogs, combinedTrainingLogs);
        predictionsData = {
          trends: analysis.trends,
          daysToPredict: daysToPredict,
          lastDate: sortedLogs.length > 0 ? new Date(sortedLogs[sortedLogs.length - 1].date) : null,
          allLogsLength: combinedTrainingLogs.length
        };
        setChartResultsCache(viewKey, predictionRange, logs.length, {
          analysis,
          sortedLogs,
          filteredLogs,
          daysToPredict,
          lastDate: predictionsData.lastDate,
          allLogsLength: combinedTrainingLogs.length
        });
      } catch (error) {
        console.warn('Error generating predictions for combined chart:', error);
        Logger.error('Error generating predictions for combined chart', { error: error.message, stack: error.stack });
      } finally {
        if (predictionsLoadingEl && predictionsLoadingEl.parentNode) {
          predictionsLoadingEl.remove();
        }
      }
    }
  }
  if (window.rianellDebug && Logger.debug) {
    Logger.debug('createCombinedChart: ' + (predictionsData ? 'predictionsData set (' + (predictionsData.allLogsLength || 0) + ' training points)' : 'predictions skipped'));
  }

  const series = metrics.map((metric, metricIndex) => {
    const isSteps = metric.field === 'steps';
    const isHydration = metric.field === 'hydration';
    
    let data = filteredLogs
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
    if (data.length > deviceOpts.maxChartPoints) {
      const step = Math.ceil(data.length / deviceOpts.maxChartPoints);
      data = data.filter((_, index) => index % step === 0 || index === data.length - 1);
    }
    
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
        const allLogsForMetric = getAllHistoricalLogsSync()
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
  
  Logger.debug('Creating combined chart', { metrics: series.length });
  
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
        enabled: !deviceOpts.reduceAnimations
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
  
  perfLog('Charts createCombinedChart (sync)', Date.now() - _perfT0, {});
  var combinedChartSig = viewKey + '|' + selectedMetrics.join(',') + '|' + predictionRange + '|' + (predictionsEnabled ? '1' : '0') + '|' + (aiOn ? '1' : '0');
  if (container.chart && container._combinedChartSig === combinedChartSig && typeof container.chart.updateSeries === 'function') {
    try {
      await container.chart.updateSeries(series, true);
      perfLog('Charts createCombinedChart (updateSeries)', Date.now() - _perfT0, {});
      container.classList.add('loaded');
      injectChartShareButton(container, 'combinedChart');
      if (typeof enforceChartSectionView === 'function') {
        enforceChartSectionView(getCurrentChartView());
      }
      return;
    } catch (e) {
      /* fall through to full recreate */
    }
  }
  if (container.chart) {
    try { container.chart.destroy(); } catch (e) { /* ignore */ }
    container.chart = null;
  }
  container._combinedChartSig = combinedChartSig;
  container.chart = new ApexCharts(container, options);
  container.chart.render().then(() => {
    perfLog('Charts createCombinedChart (render)', Date.now() - _perfT0, {});
    // Ensure loading is hidden after render
    if (loadingElement) {
      loadingElement.style.display = 'none';
    }
    // Mark container as loaded
    container.classList.add('loaded');
    injectChartShareButton(container, 'combinedChart');
    if (typeof enforceChartSectionView === 'function') {
      enforceChartSectionView(getCurrentChartView());
    }
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
  updateCombinedSelectAllButton();
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
  if (appSettings.chartView === 'combined') {
    createCombinedChart();
  }
  updateCombinedSelectAllButton();
}

// Toggle between Select All and Deselect All for combined chart (same as balance)
function toggleCombinedSelectAll() {
  const selected = appSettings.combinedChartSelectedMetrics || [];
  const allCombinedMetrics = [
    'fatigue', 'stiffness', 'backPain', 'sleep', 'jointPain', 'mobility', 'dailyFunction',
    'swelling', 'mood', 'irritability', 'weatherSensitivity', 'steps', 'hydration'
  ];
  if (selected.length >= allCombinedMetrics.length) {
    deselectAllMetrics();
  } else {
    selectAllMetrics();
  }
}

// Update combined "Select All" button label and style (green = Select All, red = Deselect All, same as balance)
function updateCombinedSelectAllButton() {
  const btn = document.getElementById('combinedSelectAllBtn');
  if (!btn) return;
  const selected = appSettings.combinedChartSelectedMetrics || [];
  const allCount = 13;
  const allSelected = selected.length >= allCount;
  btn.textContent = allSelected ? 'Deselect All' : 'Select All';
  btn.classList.toggle('metric-select-btn-deselect', allSelected);
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
  if (appSettings.chartView === 'combined') {
    createCombinedChart();
  }
  updateCombinedSelectAllButton();
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
  if (appSettings.chartView === 'combined') {
    createCombinedChart();
  }
  updateCombinedSelectAllButton();
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
  updateBalanceSelectAllButton();
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

// Toggle between Select All and Deselect All for balance chart
function toggleBalanceSelectAll() {
  const selected = appSettings.balanceChartSelectedMetrics || [];
  const allBalanceMetrics = [
    'fatigue', 'stiffness', 'backPain', 'sleep', 'jointPain', 'mobility', 'dailyFunction',
    'swelling', 'mood', 'irritability', 'weatherSensitivity', 'hydration'
  ];
  if (selected.length >= allBalanceMetrics.length) {
    deselectAllBalanceMetrics();
  } else {
    selectAllBalanceMetrics();
  }
}

// Update balance "Select All" button label and style (green = Select All, red = Deselect All)
function updateBalanceSelectAllButton() {
  const btn = document.getElementById('balanceSelectAllBtn');
  if (!btn) return;
  const selected = appSettings.balanceChartSelectedMetrics || [];
  const allCount = 12;
  const allSelected = selected.length >= allCount;
  btn.textContent = allSelected ? 'Deselect All' : 'Select All';
  btn.classList.toggle('metric-select-btn-deselect', allSelected);
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
  updateBalanceSelectAllButton();
}

// Deselect all balance metrics (deselects to minimum 3 via renderBalanceMetricSelector)
function deselectAllBalanceMetrics() {
  appSettings.balanceChartSelectedMetrics = [];
  saveSettings();
  
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
  renderBalanceMetricSelector(allMetrics, []);
  
  if (appSettings.chartView === 'balance') {
    createBalanceChart();
  }
  updateBalanceSelectAllButton();
}

// Create Balance Chart (Radar Chart)
async function createBalanceChart() {
  var _perfT0 = Date.now();
  try {
    if (window.PerformanceUtils && typeof window.PerformanceUtils.ensureApexChartsLoaded === 'function') {
      await window.PerformanceUtils.ensureApexChartsLoaded();
    }
  } catch (e) {
    console.error('ApexCharts is not loaded! Cannot create balance chart.', e);
    return;
  }
  if (typeof ApexCharts === 'undefined') {
    console.error('ApexCharts is not loaded! Cannot create balance chart.');
    return;
  }
  
  const deviceOpts = (window.PerformanceUtils && typeof window.PerformanceUtils.getDeviceOpts === 'function')
    ? window.PerformanceUtils.getDeviceOpts() : { maxChartPoints: 200, reduceAnimations: false };
  
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
    Logger.debug('Balance chart: no data in date range (empty state)');
    
    if (container.chart) {
      try { container.chart.destroy(); } catch (e) { /* ignore */ }
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
  
  if (typeof enforceChartSectionView === 'function') {
    enforceChartSectionView(getCurrentChartView());
  }
  if (balanceMetricSelector) {
    balanceMetricSelector.classList.remove('hidden');
  }
  
  // Destroy deferred until we know updateSeries cannot be used (see end of function)
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
    Logger.debug('No metrics selected for balance chart (empty state)');
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
      Logger.debug('Balance chart: no data found for metric (empty state)', { field: metric.field });
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
    Logger.debug('No metrics with data available for balance chart (empty state)');
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
      background: 'transparent',
      animations: {
        enabled: !deviceOpts.reduceAnimations
      }
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
  
  var balanceChartSig = labels.join('|') + '|' + getChartViewCacheKey(chartDateRange.type, chartDateRange.startDate, chartDateRange.endDate) + '|' + (selectedMetrics && selectedMetrics.join ? selectedMetrics.join(',') : '');
  if (container.chart && container._balanceChartSig === balanceChartSig && typeof container.chart.updateSeries === 'function') {
    try {
      await container.chart.updateSeries([{ name: 'Average Values', data: finalRadarData }], true);
      perfLog('Charts createBalanceChart (updateSeries)', Date.now() - _perfT0, {});
      injectChartShareButton(container, 'balanceChart');
      if (typeof enforceChartSectionView === 'function') {
        enforceChartSectionView(getCurrentChartView());
      }
      return;
    } catch (e) {
      /* full recreate */
    }
  }
  if (container.chart) {
    try { container.chart.destroy(); } catch (e) { /* ignore */ }
    container.chart = null;
  }
  container._balanceChartSig = balanceChartSig;
  container.chart = new ApexCharts(container, options);
  container.chart.render().then(() => {
    perfLog('Charts createBalanceChart', Date.now() - _perfT0, {});
    injectChartShareButton(container, 'balanceChart');
    if (typeof enforceChartSectionView === 'function') {
      enforceChartSectionView(getCurrentChartView());
    }
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
    aiEnabled: true, // Reset AI features to on
    demoMode: false, // Reset demo mode
    chartView: 'individual', // Reset chart view
    combinedChartSelectedMetrics: undefined, // Clear metric selections
    balanceChartSelectedMetrics: undefined, // Clear balance chart selections
    reminderTime: '20:00', // Reset reminder time to default
    optimizedAI: false // Reset optimized AI setting
  };
  localStorage.removeItem('rianellSettings');
  
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
    'rianellSettings',
    'appSettings_backup',
    'rianellGoals',
    'cloudAutoSync',
    'cloudLastSync',
    'currentCloudUserId',
    'anonymizedDataSyncedKeys',
    'anonymizedDataSyncedDates',
    'healthLogs_compressed',
    'rianellSettings_compressed'
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

  var openExportModalOrFallback = function () {
  if (typeof showExportModal === 'function') {
    showExportModal();
  } else {
    // Fallback to CSV if export modal not loaded
    const exportLogs = getAllHistoricalLogsSync();
    if (exportLogs.length === 0) {
      alert('No data to export.');
      return;
    }
  const headers = "Date,BPM,Weight,Fatigue,Stiffness,Back Pain,Sleep,Joint Pain,Mobility,Daily Function,Swelling,Flare,Mood,Irritability,Notes";
  const csvContent = "data:text/csv;charset=utf-8," 
    + headers + "\n"
    + exportLogs.map(log => Object.values(log).join(",")).join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "health_logs.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  }
  };

  if (typeof showExportModal === 'function') {
    openExportModalOrFallback();
    return;
  }
  if (window.PerformanceUtils && typeof window.PerformanceUtils.ensureExportUtilsLoaded === 'function') {
    window.PerformanceUtils.ensureExportUtilsLoaded().then(openExportModalOrFallback).catch(openExportModalOrFallback);
    return;
  }
  openExportModalOrFallback();
}

// Import function - now shows modal with options
function importData() {
  var openImportModalOrFallback = function () {
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
  };

  if (typeof showImportModal === 'function') {
    openImportModalOrFallback();
    return;
  }
  if (window.PerformanceUtils && typeof window.PerformanceUtils.ensureImportUtilsLoaded === 'function') {
    window.PerformanceUtils.ensureImportUtilsLoaded().then(openImportModalOrFallback).catch(openImportModalOrFallback);
    return;
  }
  openImportModalOrFallback();
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
// Supports learning: loads/saves prediction state (blend weights) from localStorage when available
// Returns a Promise (AI can use GPU on desktop when available)
var MAX_ALL_LOGS_ANALYSIS = 1200; // Cap so analysis stays fast; use most recent logs
async function analyzeHealthMetrics(logs, allLogs, options) {
  var _t0 = Date.now();
  if (window.PerformanceUtils && typeof window.PerformanceUtils.ensureAIEngineLoaded === 'function') {
    try {
      await window.PerformanceUtils.ensureAIEngineLoaded();
    } catch (e) { /* keep empty analysis below */ }
  }
  if (!window.AIEngine) {
    perfLog('AI analyzeHealthMetrics (no engine)', Date.now() - _t0, {});
    return { trends: {}, correlations: [], anomalies: [], advice: [], patterns: [], riskFactors: [] };
  }
  var trainingLogs = allLogs;
  if (trainingLogs && trainingLogs.length > MAX_ALL_LOGS_ANALYSIS) {
    trainingLogs = trainingLogs.slice(-MAX_ALL_LOGS_ANALYSIS);
  }
  if (!window._analyzeHealthMetricsPending) window._analyzeHealthMetricsPending = new Map();
  function buildAnalysisDedupeKey(L, T) {
    var n = L && L.length ? L.length : 0;
    var m = T && T.length ? T.length : 0;
    var l0 = n ? String(L[0].date || '') : '';
    var l1 = n ? String(L[n - 1].date || '') : '';
    var t0 = m ? String(T[0].date || '') : '';
    var t1 = m ? String(T[m - 1].date || '') : '';
    return 'a|' + n + '|' + l0 + '|' + l1 + '|' + m + '|' + t0 + '|' + t1;
  }
  var dedupeKey = buildAnalysisDedupeKey(logs, trainingLogs);
  if (window._analyzeHealthMetricsPending.has(dedupeKey)) {
    return window._analyzeHealthMetricsPending.get(dedupeKey);
  }
  async function run() {
    const opts = options || {};
    if (typeof opts.predictionState === 'undefined' && typeof localStorage !== 'undefined') {
      try {
        const s = localStorage.getItem('rianellPredictionState');
        if (s) opts.predictionState = JSON.parse(s);
      } catch (e) { /* ignore */ }
    }
    const result = await window.AIEngine.analyzeHealthMetrics(logs, trainingLogs, opts);
    if (result.predictionStateForSave && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('rianellPredictionState', JSON.stringify(result.predictionStateForSave));
      } catch (e) { /* ignore */ }
    }
    perfLog('AI analyzeHealthMetrics', Date.now() - _t0, { logs: (logs && logs.length) || 0, allLogs: (trainingLogs && trainingLogs.length) || 0 });
    return result;
  }
  var promise = run();
  window._analyzeHealthMetricsPending.set(dedupeKey, promise);
  promise.finally(function () {
    window._analyzeHealthMetricsPending.delete(dedupeKey);
  });
  return promise;
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

// Escape key: close settings if open; on desktop, open settings if no other modal is open
document.addEventListener('keydown', function(event) {
  if (event.key !== 'Escape') return;
  const settingsOverlay = document.getElementById('settingsOverlay');
  if (!settingsOverlay) return;
  const settingsOpen = settingsOverlay.classList.contains('settings-overlay--open') ||
    settingsOverlay.style.display === 'flex' || settingsOverlay.style.display === 'block';
  if (settingsOpen) {
    if (typeof toggleSettings === 'function') toggleSettings();
    return;
  }
  var isDesktop = (typeof window !== 'undefined' && window.DeviceModule && window.DeviceModule.platform && window.DeviceModule.platform.platform === 'desktop') ||
    (typeof navigator !== 'undefined' && !/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
  if (isDesktop && !document.body.classList.contains('modal-active') && typeof toggleSettings === 'function') {
    toggleSettings();
  }
});

// ============================================
// AI SUMMARY - REBUILT FROM SCRATCH
// ============================================

// Console performance metrics (all tasks + AI) with resource usage for bottleneck visibility
function perfLog(taskName, durationMs, data) {
  if (typeof console === 'undefined' || !console.log) return;
  var memStr = '';
  try {
    if (typeof performance !== 'undefined' && performance.memory) {
      var m = performance.memory;
      memStr = ' \u2502 heap ' + (m.usedJSHeapSize / 1048576).toFixed(1) + '/' + (m.totalJSHeapSize / 1048576).toFixed(1) + ' MB (limit ' + (m.jsHeapSizeLimit / 1048576).toFixed(0) + ' MB)';
    }
  } catch (e) {}
  var bottleneck = durationMs > 100 ? ' \u26a0 slow' : '';
  var msg = '[Perf] ' + taskName + ' \u2502 ' + durationMs + 'ms' + bottleneck + memStr;
  if (data != null && typeof data === 'object' && Object.keys(data).length) console.log(msg, data);
  else console.log(msg);
}

// Cache for preloaded AI analysis so opening AI tab is instant when preload has run
window._aiAnalysisCache = null;
// Multi-range cache: key (from getAICacheKey) -> { analysis, sortedLogs, dateRangeText, cacheKey }; only update on data change
window._aiAnalysisCacheMap = Object.create(null);

function getAICacheKey(aiDateRange, logsLength, filteredCount) {
  var deviceTier = (window.PerformanceUtils && window.PerformanceUtils.platform && window.PerformanceUtils.platform.deviceClass)
    ? window.PerformanceUtils.platform.deviceClass
    : 'medium';
  var r = aiDateRange || { type: 7 };
  var base = (r.type || 7) + '_' + (r.startDate || '') + '_' + (r.endDate || '') + '_' + (logsLength || 0) + '_' + (filteredCount || 0);
  return deviceTier + '_' + base;
}

// No-op: AI analysis is display-only and auto-loads from date range (no button).
function updateAISummaryButtonState() {
  Logger.debug('AI Summary - display-only, no button state to update');
}

async function generateAISummary() {
  var _perfT0 = Date.now();
  let resultsContent = document.getElementById('aiResultsContent');
  if (!resultsContent) {
    Logger.error('AI Summary - Results content element not found');
    return;
  }

  Logger.debug('AI Summary - Auto-loading for date range', { logCount: logs.length });

  // No data: show in-place empty state (display-only, no modal)
  if (!logs || logs.length === 0) {
    resultsContent.innerHTML = `
      <div class="ai-loading-state">
        <div class="ai-loading-icon">🧠</div>
        <h3 class="ai-empty-title">No health data yet</h3>
        <p class="ai-empty-desc">Add logs with the + button. Analysis will appear here for your chosen date range.</p>
      </div>
    `;
    Logger.debug('AI Summary: no logs in range (empty state)');
    return;
  }

  try {
    if (window.PerformanceUtils && typeof window.PerformanceUtils.ensureAIEngineLoaded === 'function') {
      await window.PerformanceUtils.ensureAIEngineLoaded();
    }
  } catch (e) {
    Logger.error('AI Summary - AI engine failed to load', e);
    return;
  }

  // Switch to AI tab if not already there (e.g. when opening app and landing on AI)
  const currentTab = document.querySelector('.tab-btn.active');
  if (!currentTab || currentTab.getAttribute('data-tab') !== 'ai') {
    switchTab('ai');
  }

  const aiDateRange = appSettings.aiDateRange || { type: 7 };
  const startDateInput = document.getElementById('aiStartDate');
  const endDateInput = document.getElementById('aiEndDate');
  const logsToUse = typeof logs !== 'undefined' && logs.length > 0 ? logs : allLogs;
  let filteredLogs = logsToUse;
  let dateRangeText = '';

  if (aiDateRange.type === 'custom' && startDateInput && endDateInput && startDateInput.value && endDateInput.value) {
    const startDate = startDateInput.value;
    const endDate = endDateInput.value;
    filteredLogs = logsToUse.filter(log => {
      const logDate = new Date(log.date);
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      return logDate >= start && logDate <= end;
    });
    dateRangeText = `${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`;
  } else {
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
    dateRangeText = days === 1 ? 'today' : `last ${days} days`;
  }

  // No data in range (logs exist but none in window - we already returned if logs were empty)
  if (filteredLogs.length === 0) {
    resultsContent.innerHTML = `
      <div class="ai-loading-state">
        <div class="ai-loading-icon">📅</div>
        <h3 class="ai-empty-title">No data in this range</h3>
        <p class="ai-empty-desc">None of your entries fall in ${escapeHTML(dateRangeText)}. Try another range, or tap <strong>+</strong> to add a log for these dates.</p>
      </div>
    `;
    Logger.debug('AI Summary: no logs in range (empty state)');
    return;
  }

  const sortedLogs = filteredLogs.sort((a, b) => new Date(a.date) - new Date(b.date));
  const cacheKey = getAICacheKey(aiDateRange, logs.length, sortedLogs.length);

  // Use preloaded result if available for this range (single-entry or multi-range map)
  var cached = (window._aiAnalysisCache && window._aiAnalysisCache.cacheKey === cacheKey)
    ? window._aiAnalysisCache
    : (window._aiAnalysisCacheMap && window._aiAnalysisCacheMap[cacheKey]);
  if (cached) {
    window._aiAnalysisCache = cached;
    perfLog('AI generateAISummary (from cache)', Date.now() - _perfT0, { range: cacheKey });
    displayAISummary(cached.analysis, cached.sortedLogs, cached.sortedLogs.length, null, cached.dateRangeText);
    updateSummaryNoteWithLLM(cached.analysis, cached.sortedLogs, cached.sortedLogs.length);
    Logger.info('AI Summary - Display from cache');
    return;
  }

  // Show loading state in results area only (so user sees progress and avoids perceived lag)
  resultsContent.innerHTML = `
    <div class="ai-loading-state">
      <div class="ai-loading-icon">🧠</div>
      <p class="ai-loading-text">Analyzing your health data…</p>
      <p class="ai-loading-subtext">${sortedLogs.length} days (${escapeHTML(dateRangeText)})</p>
    </div>
  `;

  // Allow the loading UI to paint before starting heavy analysis
  await new Promise(function(r) {
    if (typeof requestAnimationFrame !== 'undefined') {
      requestAnimationFrame(function() { setTimeout(r, 0); });
    } else {
      setTimeout(r, 0);
    }
  });

  (async function() {
    try {
      const allLogsForTraining = window.PerformanceUtils?.memoizedSort
        ? window.PerformanceUtils.memoizedSort(logs, (a, b) => new Date(a.date) - new Date(b.date), 'allLogsForTraining')
        : [...logs].sort((a, b) => new Date(a.date) - new Date(b.date));

      let analysis;
      if (window.AIEngine && typeof window.AIEngine.analyzeHealthMetrics === 'function') {
        analysis = await analyzeHealthMetrics(sortedLogs, allLogsForTraining);
      } else if (typeof analyzeHealthMetrics === 'function') {
        analysis = await analyzeHealthMetrics(sortedLogs);
      } else {
        throw new Error('No analysis function available. AIEngine may not be loaded.');
      }

      var entry = { analysis: analysis, sortedLogs: sortedLogs, dateRangeText: dateRangeText, cacheKey: cacheKey };
      window._aiAnalysisCache = entry;
      if (window._aiAnalysisCacheMap) window._aiAnalysisCacheMap[cacheKey] = entry;
      perfLog('AI generateAISummary (computed)', Date.now() - _perfT0, { range: cacheKey, logs: sortedLogs.length });
      displayAISummary(analysis, sortedLogs, sortedLogs.length, null, dateRangeText);
      updateSummaryNoteWithLLM(analysis, sortedLogs, sortedLogs.length);
      Logger.info('AI Summary - Display complete');
    } catch (error) {
      Logger.error('AI Summary - Error during analysis', { error: error.message, stack: error.stack });
      resultsContent = document.getElementById('aiResultsContent');
      if (resultsContent) {
        resultsContent.innerHTML = `
          <div class="ai-error">
            <h3>❌ Error</h3>
            <p>Something went wrong analysing your data for this range.</p>
            <p style="font-size: 0.9rem; color: #78909c; margin-top: 10px;">${escapeHTML(error.message)}</p>
          </div>
        `;
      }
    }
  })();
}

// Returns payload for AI preload (worker or main). Null if preload not applicable.
function getAIPreloadData() {
  var profile = window.PerformanceUtils && window.PerformanceUtils.getOptimizationProfile ? window.PerformanceUtils.getOptimizationProfile() : null;
  if (profile && !profile.enableAIPreload) return null;
  if (typeof appSettings === 'undefined' || appSettings.aiEnabled === false) return null;
  if (!logs || logs.length === 0) return null;
  var aiDateRange = appSettings.aiDateRange || { type: 7 };
  var startDateInput = document.getElementById('aiStartDate');
  var endDateInput = document.getElementById('aiEndDate');
  var logsToUse = logs;
  var filteredLogs = logsToUse;
  var dateRangeText = '';
  if (aiDateRange.type === 'custom' && startDateInput && endDateInput && startDateInput.value && endDateInput.value) {
    var start = new Date(startDateInput.value);
    var end = new Date(endDateInput.value);
    end.setHours(23, 59, 59, 999);
    filteredLogs = logsToUse.filter(function(log) {
      var d = new Date(log.date);
      return d >= start && d <= end;
    });
    dateRangeText = start.toLocaleDateString() + ' to ' + end.toLocaleDateString();
  } else {
    var days = aiDateRange.type || 7;
    var endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    var startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);
    filteredLogs = logsToUse.filter(function(log) {
      var d = new Date(log.date);
      return d >= startDate && d <= endDate;
    });
    dateRangeText = days === 1 ? 'today' : 'last ' + days + ' days';
  }
  if (filteredLogs.length === 0) return null;
  var sortedLogs = filteredLogs.slice().sort(function(a, b) { return new Date(a.date) - new Date(b.date); });
  var cacheKey = getAICacheKey(aiDateRange, logs.length, sortedLogs.length);
  if (window._aiAnalysisCache && window._aiAnalysisCache.cacheKey === cacheKey) return null;
  if (window._aiAnalysisCacheMap && window._aiAnalysisCacheMap[cacheKey]) return null;
  var allLogsForTraining = window.PerformanceUtils && window.PerformanceUtils.memoizedSort
    ? window.PerformanceUtils.memoizedSort(logs, function(a, b) { return new Date(a.date) - new Date(b.date); }, 'allLogsForTraining')
    : logs.slice().sort(function(a, b) { return new Date(a.date) - new Date(b.date); });
  return { sortedLogs: sortedLogs, allLogsForTraining: allLogsForTraining, dateRangeText: dateRangeText, cacheKey: cacheKey };
}

function setAICache(analysis, sortedLogs, dateRangeText, cacheKey) {
  if (analysis == null) return;
  var entry = { analysis: analysis, sortedLogs: sortedLogs || [], dateRangeText: dateRangeText || '', cacheKey: cacheKey || '' };
  window._aiAnalysisCache = entry;
  if (window._aiAnalysisCacheMap) window._aiAnalysisCacheMap[cacheKey || ''] = entry;
  if (window.rianellDebug && Logger.debug) Logger.debug('AI preload: analysis cached');
}

// Run AI analysis in background on main thread and cache result (device-aware).
function preloadAIAnalysisInBackground() {
  var data = getAIPreloadData();
  if (!data) return;
  if (window._aiPreloadInFlight) return;
  var run = function () {
    var analyzeFn = (window.AIEngine && typeof window.AIEngine.analyzeHealthMetrics === 'function')
      ? window.AIEngine.analyzeHealthMetrics
      : (typeof analyzeHealthMetrics === 'function' ? analyzeHealthMetrics : null);
    if (!analyzeFn) return;
    window._aiPreloadInFlight = true;
    analyzeFn(data.sortedLogs, data.allLogsForTraining).then(function(analysis) {
      setAICache(analysis, data.sortedLogs, data.dateRangeText, data.cacheKey);
    }).catch(function() {}).finally(function () {
      window._aiPreloadInFlight = false;
    });
  };
  if (window.PerformanceUtils && typeof window.PerformanceUtils.ensureAIEngineLoaded === 'function') {
    window.PerformanceUtils.ensureAIEngineLoaded().then(run).catch(function () {});
    return;
  }
  run();
}

// Preload AI for the default range (30 days) during loading screen - avoids tripling GPU/CPU work vs 7+30+90 in parallel.
// On low device: same single range after idle yield.
async function preloadAIForAllRanges() {
  var _perfT0 = Date.now();
  var profile = window.PerformanceUtils && window.PerformanceUtils.getOptimizationProfile ? window.PerformanceUtils.getOptimizationProfile() : null;
  if (profile && !profile.enableAIPreload) return Promise.resolve();
  if (typeof appSettings === 'undefined' || appSettings.aiEnabled === false) return Promise.resolve();
  if (!logs || logs.length === 0) return Promise.resolve();
  if (window.PerformanceUtils && typeof window.PerformanceUtils.ensureAIEngineLoaded === 'function') {
    try {
      await window.PerformanceUtils.ensureAIEngineLoaded();
    } catch (e) {
      return Promise.resolve();
    }
  }
  var analyzeFn = (window.AIEngine && typeof window.AIEngine.analyzeHealthMetrics === 'function')
    ? window.AIEngine.analyzeHealthMetrics
    : (typeof analyzeHealthMetrics === 'function' ? analyzeHealthMetrics : null);
  if (!analyzeFn) return Promise.resolve();

  var allLogsForTraining = window.PerformanceUtils && window.PerformanceUtils.memoizedSort
    ? window.PerformanceUtils.memoizedSort(logs, function(a, b) { return new Date(a.date) - new Date(b.date); }, 'allLogsForTraining')
    : logs.slice().sort(function(a, b) { return new Date(a.date) - new Date(b.date); });
  // Cap so preload doesn't block for minutes when user has 3000+ logs
  var MAX_PRELOAD_TRAINING_LOGS = 1200;
  if (allLogsForTraining.length > MAX_PRELOAD_TRAINING_LOGS) {
    allLogsForTraining = allLogsForTraining.slice(-MAX_PRELOAD_TRAINING_LOGS);
  }

  var deviceClass = (profile && profile.deviceClass) ? profile.deviceClass : 'medium';
  var isLow = deviceClass === 'low';

  function runOne(days) {
    var endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    var startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);
    var filteredLogs = logs.filter(function(log) {
      var d = new Date(log.date);
      return d >= startDate && d <= endDate;
    });
    if (filteredLogs.length === 0) return Promise.resolve();
    var sortedLogs = filteredLogs.slice().sort(function(a, b) { return new Date(a.date) - new Date(b.date); });
    var range = { type: days };
    var cacheKey = getAICacheKey(range, logs.length, sortedLogs.length);
    if (window._aiAnalysisCacheMap && window._aiAnalysisCacheMap[cacheKey]) return Promise.resolve();
    var dateRangeText = days === 1 ? 'today' : 'last ' + days + ' days';
    return analyzeFn(sortedLogs, allLogsForTraining).then(function(analysis) {
      setAICache(analysis, sortedLogs, dateRangeText, cacheKey);
    }).catch(function() {});
  }

  function yieldToMain() {
    return new Promise(function(resolve) {
      if (typeof requestIdleCallback !== 'undefined') {
        requestIdleCallback(function() { resolve(); }, { timeout: 50 });
      } else {
        setTimeout(resolve, 0);
      }
    });
  }

  function runAll() {
    if (isLow) {
      return yieldToMain().then(function () { return runOne(30); });
    }
    return runOne(30);
  }

  var start = (deviceClass !== 'low' && typeof requestIdleCallback !== 'undefined')
    ? new Promise(function(resolve) { requestIdleCallback(resolve, { timeout: 500 }); })
    : Promise.resolve();
  return start.then(runAll).then(function() {
    perfLog('AI preloadAIForAllRanges (30d default)', Date.now() - _perfT0, { logsLen: typeof logs !== 'undefined' ? logs.length : 0 });
  });
}

function scheduleAIPreload() {
  if (window.BackgroundLoader && typeof window.BackgroundLoader.scheduleAIPreload === 'function') {
    window.BackgroundLoader.scheduleAIPreload({
      runAIAnalysis: preloadAIAnalysisInBackground,
      getAIPreloadData: getAIPreloadData,
      setAICache: setAICache
    });
  } else {
    var profile = window.PerformanceUtils && window.PerformanceUtils.getOptimizationProfile ? window.PerformanceUtils.getOptimizationProfile() : null;
    if (profile && !profile.enableAIPreload) return;
    var delay = (profile && profile.aiPreloadDelayMs != null) ? profile.aiPreloadDelayMs : 2000;
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(function() { preloadAIAnalysisInBackground(); }, { timeout: delay + 1500 });
    } else {
      setTimeout(preloadAIAnalysisInBackground, delay);
    }
  }
}

// Update the Summary note paragraph with in-browser LLM result when available (runs after displayAISummary).
async function updateSummaryNoteWithLLM(analysis, logs, dayCount) {
  var el = document.getElementById('aiSummaryNoteText');
  if (!el || !analysis) return;
  var fallbackNote = '';
  if (window.AIEngine && typeof window.AIEngine.generateAnalysisNote === 'function') {
    try {
      fallbackNote = window.AIEngine.generateAnalysisNote(analysis, { dayCount: dayCount || (logs && logs.length) || 0, logs: logs || [] });
    } catch (e) {}
  }
  if (!fallbackNote || !fallbackNote.trim()) return;
  var deviceOpts = (window.PerformanceUtils && typeof window.PerformanceUtils.getDeviceOpts === 'function')
    ? window.PerformanceUtils.getDeviceOpts() : { deferAI: false };
  if (deviceOpts.deferAI) {
    el.textContent = fallbackNote.trim();
    return;
  }
  if (typeof window.generateSummaryWithLLM !== 'function') {
    var platform = window.PerformanceUtils && window.PerformanceUtils.platform;
    if (platform && platform.deviceClass === 'low' && typeof window.PerformanceUtils.lazyLoadScript === 'function') {
      try {
        await window.PerformanceUtils.lazyLoadScript('summary-llm.js');
      } catch (e) {}
    }
  }
  if (typeof window.generateSummaryWithLLM !== 'function') return;
  var originalText = el.textContent;
  var fallbackText = fallbackNote.trim() || originalText;
  var reqId = ((window.__aiSummaryNoteReqId || 0) + 1);
  window.__aiSummaryNoteReqId = reqId;
  el.textContent = 'Generating summary…';
  var llmPromise = window.generateSummaryWithLLM(
    analysis,
    { dayCount: dayCount || (logs && logs.length) || 0, logs: logs || [] },
    fallbackNote
  );
  var timeoutMs = 12000;
  var timeoutPromise = new Promise(function(resolve) {
    setTimeout(function() { resolve(null); }, timeoutMs);
  });
  Promise.race([llmPromise, timeoutPromise])
    .then(function (text) {
      if (window.__aiSummaryNoteReqId !== reqId) return;
      var target = document.getElementById('aiSummaryNoteText');
      if (!target) return;
      if (text && text.trim()) {
        target.textContent = text.trim();
      } else {
        target.textContent = fallbackText;
      }
    })
    .catch(function () {
      if (window.__aiSummaryNoteReqId !== reqId) return;
      var target = document.getElementById('aiSummaryNoteText');
      if (target) target.textContent = fallbackText;
    });
}

// Copy AI-generated summary note to clipboard (used by "Copy note" button in AI results)
function copyAIGeneratedNote(btn) {
  var el = btn && btn.previousElementSibling;
  var text = el ? el.textContent : '';
  if (!text) return;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function() {
      if (btn) { btn.textContent = 'Copied!'; setTimeout(function() { btn.textContent = 'Copy note'; }, 2000); }
    }).catch(function() { fallbackCopy(); });
  } else { fallbackCopy(); }
  function fallbackCopy() {
    try {
      var ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      if (btn) { btn.textContent = 'Copied!'; setTimeout(function() { btn.textContent = 'Copy note'; }, 2000); }
    } catch (e) {}
  }
}

// Store current analysis data for radar chart access
let currentAIAnalysis = null;
let currentAIFilteredLogs = null; // Store filtered logs for average calculation

/** Colours for each AI analysis section segment on the desktop portrait timeline */
var AI_TIMELINE_PALETTE = ['#e91e63', '#ab47bc', '#7c4dff', '#29b6f6', '#26a69a', '#66bb6a', '#ffca28', '#ff7043', '#5c6bc0', '#ec407a', '#00bcd4', '#8bc34a'];

/** Desktop shell: document/body scrolls (.app-main-scroll overflow visible). Root snap + wheel hijack trap the page in AI sections. */
function isAIDesktopFreeScrollLayout() {
  try {
    return window.matchMedia('(min-width: 769px)').matches;
  } catch (e) {
    return false;
  }
}

function updateAIScrollSnapClass() {
  var container = document.querySelector('.container.app-main-scroll');
  var rootEl = document.documentElement;
  var aiTab = document.getElementById('aiTab');
  var aiActive = aiTab && aiTab.classList.contains('active');
  var reduceMotion = false;
  try {
    reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (e) {}
  var innerScrolls = !!getAIMainScrollParent();
  var snapOn = aiActive && !reduceMotion;
  var desktopDocScroll = isAIDesktopFreeScrollLayout();
  var useRootSnap = snapOn && !innerScrolls && !desktopDocScroll;
  var aiSectionPagerActive = !!(typeof document !== 'undefined' && document.getElementById('aiMobilePager'));
  var useContainerSnap = snapOn && innerScrolls && !aiSectionPagerActive;
  if (rootEl) {
    rootEl.classList.toggle('ai-root-scroll-snap', useRootSnap);
    rootEl.classList.remove('ai-root-scroll-snap--mobile-pad');
  }
  if (container) {
    container.classList.toggle('ai-scroll-snap-sections', useContainerSnap);
    container.classList.remove('ai-scroll-snap-sections--mobile-pad');
  }
}

function ensureAITimelineGlobalListeners() {
  if (window._aiTimelineListenersBound) return;
  window._aiTimelineListenersBound = true;
  var debounceT;
  window.addEventListener('resize', function() {
    clearTimeout(debounceT);
    debounceT = setTimeout(function() {
      if (document.querySelector('#aiResultsContent .ai-results-timeline-layout')) {
        initAITimelinePortrait();
      } else {
        updateAIScrollSnapClass();
        syncAITimelineActiveFromScroll();
      }
    }, 120);
  });
  var mql = window.matchMedia('(min-width: 900px)');
  function onViewportChange() {
    updateAIScrollSnapClass();
    if (document.querySelector('#aiResultsContent .ai-results-timeline-layout')) {
      initAITimelinePortrait();
    }
  }
  if (mql.addEventListener) mql.addEventListener('change', onViewportChange);
  else if (mql.addListener) mql.addListener(onViewportChange);
  document.addEventListener('keydown', function(e) {
    if (!e || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;
    var ae = document.activeElement;
    if (ae) {
      var tag = ae.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || ae.isContentEditable) return;
    }
    var aiTab = document.getElementById('aiTab');
    if (!aiTab || !aiTab.classList.contains('active')) return;
    if (!document.getElementById('aiMobilePager')) return;
    try {
      if (window.matchMedia('(max-width: 768px)').matches) return;
    } catch (e1) {}
    e.preventDefault();
    if (e.key === 'ArrowLeft') aiMobilePagerNudge(-1);
    else aiMobilePagerNudge(1);
  });
  ensureAISectionWheelSnap();
}

/** .container uses transform (animation/hover) which breaks position:fixed for descendants inside the card */
function purgeAItimelineDetachedOverlays() {
  var rc = document.getElementById('aiResultsContent');
  if (!rc) return;
  ['aiTimelinePortrait', 'aiTimelineMobile'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el && !rc.contains(el)) {
      try {
        el.remove();
      } catch (e) {}
    }
  });
}

function teardownAIMobileSectionPager() {
  clearTimeout(window._aiSlideHeightDebT);
  window._aiSlideHeightDebT = 0;
  if (window._aiSlidePaneResizeObservers) {
    window._aiSlidePaneResizeObservers.forEach(function(ro) {
      try {
        ro.disconnect();
      } catch (e) {}
    });
    window._aiSlidePaneResizeObservers = null;
  }
  var trackEnd = document.getElementById('aiMobilePagerTrack');
  if (trackEnd && window._aiSlideTrackScrollendHandler) {
    try {
      trackEnd.removeEventListener('scrollend', window._aiSlideTrackScrollendHandler);
    } catch (e) {}
    window._aiSlideTrackScrollendHandler = null;
  }
  var pager = document.getElementById('aiMobilePager');
  if (!pager) return;
  var main = document.querySelector('#aiResultsContent .ai-results-timeline-main');
  if (!main) {
    pager.remove();
    return;
  }
  var panes = pager.querySelectorAll('.ai-mobile-pager-pane');
  var insertBefore = pager;
  for (var i = 0; i < panes.length; i++) {
    var sec = panes[i].firstElementChild;
    if (sec) main.insertBefore(sec, insertBefore);
  }
  pager.remove();
  if (window._aiMobilePagerScrollRaf) {
    try {
      cancelAnimationFrame(window._aiMobilePagerScrollRaf);
    } catch (e) {}
    window._aiMobilePagerScrollRaf = 0;
  }
  if (window._aiMobilePagerScrollHandler && window._aiMobilePagerTrackEl) {
    try {
      window._aiMobilePagerTrackEl.removeEventListener('scroll', window._aiMobilePagerScrollHandler);
    } catch (e) {}
    window._aiMobilePagerScrollHandler = null;
    window._aiMobilePagerTrackEl = null;
  }
}

/** Which slide is “active” when panes are not full track width (mobile peek). */
function aiMobilePagerGetActiveIndexFromScroll(track) {
  if (!track) return 0;
  var panes = track.querySelectorAll('.ai-mobile-pager-pane');
  var n = panes.length;
  if (n === 0) return 0;
  var cw = track.clientWidth;
  if (cw < 4) return 0;
  var scrollLeft = track.scrollLeft;
  var center = scrollLeft + cw * 0.5;
  var bestIdx = 0;
  var bestDist = Infinity;
  for (var i = 0; i < n; i++) {
    var pane = panes[i];
    var pl = pane.offsetLeft;
    var pw = pane.offsetWidth;
    var paneCenter = pl + pw * 0.5;
    var d = Math.abs(paneCenter - center);
    if (d < bestDist) {
      bestDist = d;
      bestIdx = i;
    }
  }
  return bestIdx;
}

function aiMobilePagerScrollToIndex(idx) {
  var track = document.getElementById('aiMobilePagerTrack');
  if (!track) return;
  var panes = track.querySelectorAll('.ai-mobile-pager-pane');
  var n = panes.length;
  if (n === 0) return;
  var i = Math.max(0, Math.min(n - 1, idx));
  var pane = panes[i];
  if (!pane) return;
  var left = pane.offsetLeft;
  var behavior = 'smooth';
  try {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) behavior = 'auto';
  } catch (e) {}
  track.scrollTo({ left: left, behavior: behavior });
  if (behavior === 'auto') {
    requestAnimationFrame(function() {
      syncAISlideTrackHeightToActivePane();
    });
  } else {
    setTimeout(function() {
      syncAISlideTrackHeightToActivePane();
    }, 380);
  }
}

function aiMobilePagerNudge(delta) {
  var track = document.getElementById('aiMobilePagerTrack');
  if (!track) return;
  if (track.clientWidth < 4) return;
  var idx = aiMobilePagerGetActiveIndexFromScroll(track);
  aiMobilePagerScrollToIndex(idx + delta);
}

function updateAIMobilePagerChrome(idx) {
  var track = document.getElementById('aiMobilePagerTrack');
  if (!track) return;
  var panes = track.querySelectorAll('.ai-mobile-pager-pane');
  var n = panes.length;
  var prev = document.querySelector('.ai-mobile-pager-prev');
  var next = document.querySelector('.ai-mobile-pager-next');
  if (prev) {
    prev.disabled = idx <= 0;
    prev.setAttribute('aria-disabled', idx <= 0 ? 'true' : 'false');
  }
  if (next) {
    next.disabled = idx >= n - 1;
    next.setAttribute('aria-disabled', idx >= n - 1 ? 'true' : 'false');
  }
  var pager = document.getElementById('aiMobilePager');
  if (pager && n > 0) {
    pager.setAttribute('aria-label', 'AI analysis, slide ' + (idx + 1) + ' of ' + n);
  }
  var dots = document.querySelectorAll('#aiMobilePagerDots .ai-mobile-pager-dot');
  if (dots.length) {
    for (var di = 0; di < dots.length; di++) {
      dots[di].classList.toggle('ai-mobile-pager-dot--active', di === idx);
    }
  }
  requestAnimationFrame(function() {
    syncAISlideTrackHeightToActivePane();
    requestAnimationFrame(syncAISlideTrackHeightToActivePane);
  });
}

function syncAIMobilePagerIndexFromTrack() {
  var track = document.getElementById('aiMobilePagerTrack');
  if (!track) return;
  if (track.clientWidth < 4) return;
  var idx = aiMobilePagerGetActiveIndexFromScroll(track);
  updateAIMobilePagerChrome(idx);
}

/** Match slide viewport to the active pane’s laid-out height (avoids pane.scrollHeight ≈ tallest slide). */
function syncAISlideTrackHeightToActivePane() {
  var track = document.getElementById('aiMobilePagerTrack');
  if (!track) return;
  var w = track.clientWidth;
  var panes = track.querySelectorAll('.ai-mobile-pager-pane');
  if (w < 4 || !panes.length) {
    track.style.removeProperty('height');
    return;
  }
  var idx = aiMobilePagerGetActiveIndexFromScroll(track);
  if (idx < 0) idx = 0;
  if (idx >= panes.length) idx = panes.length - 1;
  var pane = panes[idx];
  var h = pane.offsetHeight;
  if (h < 4) {
    try {
      h = pane.getBoundingClientRect().height;
    } catch (e) {}
  }
  if (h < 4) h = pane.scrollHeight;
  var tcs = window.getComputedStyle(track);
  h += (parseFloat(tcs.borderTopWidth) || 0) + (parseFloat(tcs.borderBottomWidth) || 0);
  h = Math.max(Math.ceil(h), 24);
  track.style.height = h + 'px';
}

function scheduleAISlideTrackHeightSync() {
  clearTimeout(window._aiSlideHeightDebT);
  window._aiSlideHeightDebT = setTimeout(function() {
    window._aiSlideHeightDebT = 0;
    syncAISlideTrackHeightToActivePane();
  }, 100);
}

function setupAIMobileSectionPager() {
  teardownAIMobileSectionPager();
  var main = document.querySelector('#aiResultsContent .ai-results-timeline-main');
  if (!main) return;
  var snaps = Array.prototype.slice.call(main.querySelectorAll(':scope > .ai-timeline-snap'));
  if (snaps.length < 2) return;

  var pager = document.createElement('div');
  pager.className = 'ai-section-pager ai-mobile-pager';
  pager.id = 'aiMobilePager';
  pager.setAttribute('role', 'region');
  pager.setAttribute('aria-label', 'AI analysis slides');

  var prevBtn = document.createElement('button');
  prevBtn.type = 'button';
  prevBtn.className = 'ai-mobile-pager-btn ai-mobile-pager-prev';
  prevBtn.setAttribute('aria-label', 'Previous slide');
  prevBtn.innerHTML = '&#8249;';

  var nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.className = 'ai-mobile-pager-btn ai-mobile-pager-next';
  nextBtn.setAttribute('aria-label', 'Next slide');
  nextBtn.innerHTML = '&#8250;';

  var track = document.createElement('div');
  track.className = 'ai-mobile-pager-track';
  track.id = 'aiMobilePagerTrack';

  for (var i = 0; i < snaps.length; i++) {
    var pane = document.createElement('div');
    pane.className = 'ai-mobile-pager-pane';
    pane.appendChild(snaps[i]);
    track.appendChild(pane);
  }

  var slideRow = document.createElement('div');
  slideRow.className = 'ai-section-pager-slide-row';
  slideRow.appendChild(prevBtn);
  slideRow.appendChild(track);
  slideRow.appendChild(nextBtn);

  pager.appendChild(slideRow);

  var dotsRow = document.createElement('div');
  dotsRow.id = 'aiMobilePagerDots';
  dotsRow.className = 'ai-mobile-pager-dots';
  dotsRow.setAttribute('aria-hidden', 'true');
  for (var di = 0; di < snaps.length; di++) {
    var dot = document.createElement('span');
    dot.className = 'ai-mobile-pager-dot' + (di === 0 ? ' ai-mobile-pager-dot--active' : '');
    dotsRow.appendChild(dot);
  }
  pager.appendChild(dotsRow);

  (function attachFirstVisitSwipeCue() {
    var storageKey = 'healthApp_aiSwipeCueSeen';
    var showCue = false;
    try {
      if (!localStorage.getItem(storageKey)) showCue = true;
    } catch (e0) {}
    try {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) showCue = false;
    } catch (e1) {}
    try {
      if (window.matchMedia('(min-width: 769px)').matches) showCue = false;
    } catch (e1b) {}
    if (!showCue) return;

    var cueDismissed = false;
    function dismissSwipeCue() {
      if (cueDismissed) return;
      cueDismissed = true;
      try {
        localStorage.setItem(storageKey, '1');
      } catch (e2) {}
      var el = document.getElementById('aiMobilePagerSwipeCue');
      if (el) {
        el.classList.add('ai-mobile-pager-swipe-cue--out');
        setTimeout(function() {
          try {
            el.remove();
          } catch (e3) {}
        }, 420);
      }
    }

    var cue = document.createElement('div');
    cue.id = 'aiMobilePagerSwipeCue';
    cue.className = 'ai-mobile-pager-swipe-cue';
    cue.setAttribute('aria-hidden', 'true');
    cue.innerHTML =
      '<div class="ai-mobile-pager-swipe-cue__box">' +
      '<div class="ai-mobile-pager-swipe-cue__track" aria-hidden="true">' +
      '<div class="ai-mobile-pager-swipe-cue__glow"></div>' +
      '</div>' +
      '</div>';
    pager.appendChild(cue);

    var initialScroll = -1;
    var onScrollDismiss = function() {
      if (initialScroll < 0) initialScroll = track.scrollLeft;
      if (Math.abs(track.scrollLeft - initialScroll) > 10) {
        dismissSwipeCue();
        track.removeEventListener('scroll', onScrollDismiss);
      }
    };
    track.addEventListener('scroll', onScrollDismiss, { passive: true });
    setTimeout(dismissSwipeCue, 14000);
  })();
  var anchor = main.querySelector(':scope > .ai-timeline-snap');
  main.insertBefore(pager, anchor || null);

  prevBtn.addEventListener('click', function() {
    aiMobilePagerNudge(-1);
  });
  nextBtn.addEventListener('click', function() {
    aiMobilePagerNudge(1);
  });

  var onScroll = function() {
    if (window._aiMobilePagerScrollRaf) return;
    window._aiMobilePagerScrollRaf = requestAnimationFrame(function() {
      window._aiMobilePagerScrollRaf = 0;
      syncAIMobilePagerIndexFromTrack();
      scheduleAISlideTrackHeightSync();
    });
  };
  window._aiMobilePagerScrollHandler = onScroll;
  window._aiMobilePagerTrackEl = track;
  track.addEventListener('scroll', onScroll, { passive: true });

  var onScrollEnd = function() {
    clearTimeout(window._aiSlideHeightDebT);
    window._aiSlideHeightDebT = 0;
    syncAIMobilePagerIndexFromTrack();
    syncAISlideTrackHeightToActivePane();
  };
  window._aiSlideTrackScrollendHandler = onScrollEnd;
  try {
    track.addEventListener('scrollend', onScrollEnd, { passive: true });
  } catch (eSe) {}

  window._aiSlidePaneResizeObservers = [];
  if (typeof ResizeObserver !== 'undefined') {
    var paneEls = track.querySelectorAll('.ai-mobile-pager-pane');
    var ro = new ResizeObserver(function() {
      scheduleAISlideTrackHeightSync();
    });
    for (var pi = 0; pi < paneEls.length; pi++) {
      ro.observe(paneEls[pi]);
    }
    window._aiSlidePaneResizeObservers.push(ro);
  }

  requestAnimationFrame(function() {
    requestAnimationFrame(function() {
      syncAIMobilePagerIndexFromTrack();
      syncAISlideTrackHeightToActivePane();
    });
  });
}

/** Normalize wheel deltaY (lines/pages modes) for consistent snap threshold */
function aiSectionWheelNormalizeDeltaY(e) {
  var dy = e.deltaY;
  if (e.deltaMode === 1) dy *= 16;
  else if (e.deltaMode === 2) dy *= Math.min(window.innerHeight || 600, 900);
  return dy;
}

/** Inner scrollable inside AI results (charts, overflow blocks) - let those handle wheel */
function findAIInnerVerticalScrollable(fromEl, boundary) {
  if (!fromEl || !boundary) return null;
  var el = fromEl.nodeType === 1 ? fromEl : fromEl.parentElement;
  for (; el && el !== boundary; el = el.parentElement) {
    if (!el || el === document.body || el === document.documentElement) break;
    try {
      var st = window.getComputedStyle(el);
      var oy = st.overflowY;
      if ((oy === 'auto' || oy === 'scroll' || oy === 'overlay') && el.scrollHeight > el.clientHeight + 2) {
        return el;
      }
    } catch (e) {}
  }
  return null;
}

function aiSectionWheelCurrentIndex(sections) {
  if (!sections || !sections.length) return 0;
  var vh = window.innerHeight;
  var bandTop = vh * 0.12;
  var bandBottom = vh * 0.52;
  var best = 0;
  var bestOverlap = -1;
  for (var i = 0; i < sections.length; i++) {
    var r = sections[i].getBoundingClientRect();
    var overlap = Math.max(0, Math.min(r.bottom, bandBottom) - Math.max(r.top, bandTop));
    if (overlap > bestOverlap) {
      bestOverlap = overlap;
      best = i;
    }
  }
  if (bestOverlap <= 0) {
    var mid = vh * 0.28;
    var bestDist = Infinity;
    for (var j = 0; j < sections.length; j++) {
      var rj = sections[j].getBoundingClientRect();
      var c = rj.top + rj.height / 2;
      var d = Math.abs(c - mid);
      if (d < bestDist) {
        bestDist = d;
        best = j;
      }
    }
  }
  return best;
}

function aiSectionWheelListener(e) {
  var tab = document.getElementById('aiTab');
  if (!tab || !tab.classList.contains('active')) return;
  if (isAIDesktopFreeScrollLayout()) return;
  if (document.getElementById('aiMobilePager')) return;
  try {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  } catch (e0) {}
  var sections = document.querySelectorAll('#aiResultsContent .ai-timeline-snap');
  if (!sections.length) return;
  if (Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;
  var tgt = e.target;
  if (!tgt || !tgt.closest || !tgt.closest('#aiResultsSection')) return;
  var boundary = document.getElementById('aiResultsSection');
  if (!boundary) return;
  if (findAIInnerVerticalScrollable(tgt, boundary)) return;

  var dy = aiSectionWheelNormalizeDeltaY(e);
  if (Math.abs(dy) < 0.5) return;

  var idx = aiSectionWheelCurrentIndex(sections);
  window._aiWheelAccum = (window._aiWheelAccum || 0) + dy;
  var acc = window._aiWheelAccum;

  if (idx <= 0 && acc < 0) {
    window._aiWheelAccum = 0;
    return;
  }
  if (idx >= sections.length - 1 && acc > 0) {
    window._aiWheelAccum = 0;
    return;
  }

  var threshold = 40;
  if (Math.abs(acc) < threshold) {
    e.preventDefault();
    clearTimeout(window._aiWheelSnapRelease);
    window._aiWheelSnapRelease = setTimeout(function() {
      window._aiWheelAccum = 0;
    }, 160);
    return;
  }

  var dir = acc > 0 ? 1 : -1;
  window._aiWheelAccum = 0;
  e.preventDefault();
  var next = idx + dir;
  if (next < 0 || next >= sections.length) return;
  var smooth = true;
  try {
    smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (e1) {}
  sections[next].scrollIntoView({ block: 'start', behavior: smooth ? 'smooth' : 'auto' });
}

function ensureAISectionWheelSnap() {
  if (window._aiSectionWheelBound) return;
  window._aiSectionWheelBound = true;
  window._aiWheelAccum = 0;
  window.addEventListener('wheel', aiSectionWheelListener, { passive: false, capture: true });
}

/** Scroll parent for main app content: inner container on mobile shell; window/body on desktop wide layout */
function getAIMainScrollParent() {
  var el = document.querySelector('.container.app-main-scroll');
  if (!el) return null;
  try {
    var st = window.getComputedStyle(el);
    if (st.overflowY === 'auto' || st.overflowY === 'scroll') return el;
  } catch (e) {}
  return null;
}

function teardownAITimelineScroll() {
  if (window._aiTimelineScrollHandler) {
    var h = window._aiTimelineScrollHandler;
    var targets = window._aiTimelineScrollTargets || [];
    for (var t = 0; t < targets.length; t++) {
      try {
        targets[t].removeEventListener('scroll', h);
      } catch (e) {}
    }
    try {
      window.removeEventListener('scroll', h, true);
    } catch (e2) {}
    window._aiTimelineScrollHandler = null;
    window._aiTimelineScrollTargets = null;
  }
  if (window._aiTimelineScrollRaf) {
    cancelAnimationFrame(window._aiTimelineScrollRaf);
    window._aiTimelineScrollRaf = 0;
  }
}

function bindAITimelineScroll() {
  teardownAITimelineScroll();
  var wrap = document.querySelector('#aiResultsContent .ai-results-timeline-layout');
  if (!wrap) return;
  var handler = function() {
    if (window._aiTimelineScrollRaf) return;
    window._aiTimelineScrollRaf = requestAnimationFrame(function() {
      window._aiTimelineScrollRaf = 0;
      syncAITimelineActiveFromScroll();
    });
  };
  window._aiTimelineScrollHandler = handler;
  window._aiTimelineScrollTargets = [];
  var scrollParent = getAIMainScrollParent();
  if (scrollParent) {
    scrollParent.addEventListener('scroll', handler, { passive: true });
    window._aiTimelineScrollTargets.push(scrollParent);
  } else {
    window.addEventListener('scroll', handler, { passive: true, capture: true });
  }
}

function syncAITimelineActiveFromScroll() {
  var pTrack = document.getElementById('aiMobilePagerTrack');
  if (!pTrack) return;
  if (pTrack.clientWidth <= 4) return;
  var pIdx = aiMobilePagerGetActiveIndexFromScroll(pTrack);
  if (typeof updateAIMobilePagerChrome === 'function') updateAIMobilePagerChrome(pIdx);
}

function initAITimelinePortrait() {
  teardownAIMobileSectionPager();
  updateAIScrollSnapClass();
  ensureAITimelineGlobalListeners();
  var wrap = document.querySelector('#aiResultsContent .ai-results-timeline-layout');
  if (!wrap) return;
  var main = wrap.querySelector('.ai-results-timeline-main');
  var mobileNav = document.getElementById('aiTimelineMobile');
  var mobileTrack = document.getElementById('aiTimelineMobileTrack');
  if (!main) return;
  var sections = main.querySelectorAll('.ai-timeline-snap');
  teardownAITimelineScroll();
  if (window._aiTimelineIO) {
    window._aiTimelineIO.disconnect();
    window._aiTimelineIO = null;
  }
  if (sections.length === 0) {
    if (mobileTrack) mobileTrack.innerHTML = '';
    if (mobileNav) {
      mobileNav.hidden = true;
      mobileNav.setAttribute('aria-hidden', 'true');
    }
    updateAIScrollSnapClass();
    return;
  }
  sections.forEach(function(sec, i) {
    var c = AI_TIMELINE_PALETTE[i % AI_TIMELINE_PALETTE.length];
    sec.style.setProperty('--ai-timeline-color', c);
  });
  if (mobileTrack) mobileTrack.innerHTML = '';
  if (mobileNav) {
    mobileNav.hidden = true;
    mobileNav.setAttribute('aria-hidden', 'true');
  }
  bindAITimelineScroll();
  setupAIMobileSectionPager();
  requestAnimationFrame(function() {
    syncAITimelineActiveFromScroll();
    updateAIScrollSnapClass();
  });
}

// Format a single "Things to watch" line: bold metric/label, de-emphasize "(may indicate flare-ups)"
function formatAnomalyLine(anomaly) {
  if (!anomaly || typeof anomaly !== 'string') return escapeHTML(String(anomaly));
  const escaped = escapeHTML(anomaly);
  const colonIdx = escaped.indexOf(': ');
  if (colonIdx === -1) return escaped;
  const label = escaped.substring(0, colonIdx);
  let rest = escaped.substring(colonIdx + 2);
  const noteMatch = rest.match(/^(.*?)\s*\((may indicate flare-ups)\)\s*$/i);
  if (noteMatch) {
    rest = noteMatch[1].trim();
    const note = noteMatch[2];
    return '<span class="ai-warning-metric">' + label + ':</span> ' + rest + ' <span class="ai-warning-note">(' + note + ')</span>';
  }
  return '<span class="ai-warning-metric">' + label + ':</span> ' + rest;
}

// Label positions (x, y) for each body region in the AI pain figure SVG viewBox "0 0 140 280"
var AI_PAIN_BODY_LABEL_POSITIONS = {
  head: { x: 70, y: 34 },
  neck: { x: 70, y: 67 },
  chest: { x: 70, y: 90 },
  abdomen: { x: 70, y: 135 },
  left_shoulder: { x: 34, y: 83 },
  left_upper_arm: { x: 25, y: 108 },
  left_elbow: { x: 25, y: 131 },
  left_forearm: { x: 25, y: 152 },
  left_wrist: { x: 25, y: 173 },
  left_hand: { x: 25, y: 185 },
  right_shoulder: { x: 106, y: 83 },
  right_upper_arm: { x: 115, y: 108 },
  right_elbow: { x: 115, y: 131 },
  right_forearm: { x: 115, y: 152 },
  right_wrist: { x: 115, y: 173 },
  right_hand: { x: 115, y: 185 },
  left_hip: { x: 52, y: 166 },
  left_thigh: { x: 54, y: 191 },
  left_knee: { x: 54, y: 224 },
  left_lower_leg: { x: 54, y: 252 },
  left_ankle: { x: 54, y: 268 },
  left_foot: { x: 46, y: 274 },
  right_hip: { x: 88, y: 166 },
  right_thigh: { x: 86, y: 191 },
  right_knee: { x: 86, y: 224 },
  right_lower_leg: { x: 86, y: 252 },
  right_ankle: { x: 86, y: 268 },
  right_foot: { x: 94, y: 274 }
};

// Build SVG for AI "Pain by body part" - human figure with stats as labels on each region
function getAIPainBodyFigureSVG(painByRegion) {
  var severityClass = function(data) {
    if (!data || (data.painDays === 0 && data.mildDays === 0)) return '';
    var totalDays = (data.painDays || 0) + (data.mildDays || 0);
    var painRatio = totalDays > 0 ? (data.painDays || 0) / totalDays : 0;
    var score = data.severityScore || 0;
    if (score >= 10 || (painRatio >= 0.7 && totalDays >= 5)) return 'ai-pain-region-high';
    if (score >= 4 || painRatio >= 0.4) return 'ai-pain-region-medium';
    return 'ai-pain-region-low';
  };
  var svg = '<svg class="ai-pain-body-svg" viewBox="0 0 140 280" xmlns="http://www.w3.org/2000/svg" aria-label="Pain by body part - color shows how each area felt on average">';
  svg += '<defs><filter id="ai-pain-body-shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="1" stdDeviation="1" flood-opacity="0.2"/></filter></defs>';
  svg += '<path class="ai-pain-body-outline" d="M70 10 A26 28 0 0 1 70 66 Q58 70 50 78 Q42 90 44 108 Q46 138 48 168 Q50 198 48 238 Q46 268 52 278 L64 280 L76 280 L88 278 Q94 268 92 238 Q90 198 92 168 Q94 138 96 108 Q98 90 90 78 Q82 70 70 66 Z" fill="rgba(255,255,255,0.06)" stroke="rgba(76,175,80,0.25)" stroke-width="0.5"/>';
  var regionPaths = [
    { id: 'head', tag: 'ellipse', attrs: 'cx="70" cy="34" rx="26" ry="28"' },
    { id: 'neck', tag: 'path', attrs: 'd="M54 58 Q52 64 54 76 L86 76 Q88 64 86 58 Q82 56 70 56 Q58 56 54 58 Z"' },
    { id: 'chest', tag: 'path', attrs: 'd="M46 72 Q38 80 42 96 L46 108 L94 108 L98 96 Q102 80 94 72 Q86 68 70 68 Q54 68 46 72 Z"' },
    { id: 'abdomen', tag: 'path', attrs: 'd="M46 108 Q44 132 46 158 L48 162 L92 162 L94 158 Q96 132 94 108 L46 108 Z"' },
    { id: 'left_shoulder', tag: 'path', attrs: 'd="M46 72 Q30 74 22 84 Q18 90 24 94 L42 92 Q44 80 46 74 Z"' },
    { id: 'left_upper_arm', tag: 'path', attrs: 'd="M24 90 Q16 106 20 126 L26 132 Q30 118 30 98 Q30 90 24 90 Z"' },
    { id: 'left_forearm', tag: 'path', attrs: 'd="M22 132 Q14 150 18 170 L26 174 Q30 160 30 142 Q30 132 22 132 Z"' },
    { id: 'left_hand', tag: 'path', attrs: 'd="M20 172 Q16 184 20 198 L30 198 Q34 186 32 174 Q30 172 20 172 Z"' },
    { id: 'right_shoulder', tag: 'path', attrs: 'd="M94 72 Q110 74 118 84 Q122 90 116 94 L98 92 Q96 80 94 74 Z"' },
    { id: 'right_upper_arm', tag: 'path', attrs: 'd="M116 90 Q124 106 120 126 L114 132 Q110 118 110 98 Q110 90 116 90 Z"' },
    { id: 'right_forearm', tag: 'path', attrs: 'd="M118 132 Q126 150 122 170 L114 174 Q110 160 110 142 Q110 132 118 132 Z"' },
    { id: 'right_hand', tag: 'path', attrs: 'd="M120 172 Q124 184 120 198 L110 198 Q106 186 108 174 Q110 172 120 172 Z"' },
    { id: 'left_hip', tag: 'path', attrs: 'd="M48 160 Q44 166 48 172 L56 172 Q60 166 56 162 Z"' },
    { id: 'left_thigh', tag: 'path', attrs: 'd="M48 170 Q44 192 48 212 L56 214 Q60 198 58 178 Z"' },
    { id: 'left_knee', tag: 'path', attrs: 'd="M50 214 Q48 222 52 234 L60 234 Q62 226 58 218 Z"' },
    { id: 'left_lower_leg', tag: 'path', attrs: 'd="M52 234 Q48 252 50 268 L58 268 Q62 252 60 236 Z"' },
    { id: 'left_foot', tag: 'path', attrs: 'd="M56 268 L52 266 L38 274 L40 280 L54 278 Z"' },
    { id: 'right_hip', tag: 'path', attrs: 'd="M92 160 Q96 166 92 172 L84 172 Q80 166 84 162 Z"' },
    { id: 'right_thigh', tag: 'path', attrs: 'd="M92 170 Q96 192 92 212 L84 214 Q80 198 82 178 Z"' },
    { id: 'right_knee', tag: 'path', attrs: 'd="M90 214 Q92 222 88 234 L80 234 Q78 226 82 218 Z"' },
    { id: 'right_lower_leg', tag: 'path', attrs: 'd="M88 234 Q92 252 90 268 L82 268 Q78 252 80 236 Z"' },
    { id: 'right_foot', tag: 'path', attrs: 'd="M84 268 L88 266 L102 274 L100 280 L86 278 Z"' },
    { id: 'left_elbow', tag: 'circle', attrs: 'cx="25" cy="131" r="6"' },
    { id: 'right_elbow', tag: 'circle', attrs: 'cx="115" cy="131" r="6"' },
    { id: 'left_wrist', tag: 'circle', attrs: 'cx="25" cy="173" r="6"' },
    { id: 'right_wrist', tag: 'circle', attrs: 'cx="115" cy="173" r="6"' },
    { id: 'left_ankle', tag: 'circle', attrs: 'cx="54" cy="268" r="6"' },
    { id: 'right_ankle', tag: 'circle', attrs: 'cx="86" cy="268" r="6"' }
  ];
  regionPaths.forEach(function(r) {
    var data = painByRegion[r.id];
    var cls = 'ai-pain-region ' + severityClass(data);
    svg += '<' + r.tag + ' class="' + cls + '" data-region="' + escapeHTML(r.id) + '" ' + r.attrs + ' fill="currentColor" filter="url(#ai-pain-body-shadow)"/>';
  });
  svg += '</svg>';
  return svg;
}

// Format prose/value text like "What we found": escape HTML, bold **x**, highlight (parenthesized) values
function formatAIValueText(text) {
  if (typeof text !== 'string' || !text) return '';
  const escaped = escapeHTML(text);
  let formatted = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  formatted = formatted.replace(/\(([^)]+)\)/g, '<span class="ai-brackets-highlight">($1)</span>');
  return formatted;
}

/** Safe text for HTML attribute (e.g. aria-label) */
function escapeAttr(text) {
  return String(text == null ? '' : text)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Short plain-language bullets for non-technical users (shown above dense analysis).
 */
function buildAIAnalysisAtAGlance(analysis, logs, dayCount) {
  if (!analysis) return '';
  var items = [];
  var trendKeys = Object.keys(analysis.trends || {}).filter(function(m) {
    return analysis.trends[m];
  });
  if (trendKeys.length > 0) {
    items.push(
      'You have <strong>' +
        trendKeys.length +
        '</strong> tracked metric' +
        (trendKeys.length === 1 ? '' : 's') +
        ' with enough data to compare in this period.'
    );
  }
  if (analysis.flareUpRisk && analysis.flareUpRisk.level) {
    var lvl = analysis.flareUpRisk.level;
    var matchCount = analysis.flareUpRisk.matchingMetrics || 0;
    if (lvl === 'high') {
      items.push(
        'The app flags a <strong>higher</strong> chance of a flare (' +
          matchCount +
          ' of 5 warning signs). This is a pattern only - not a prediction. Contact your care team if you feel worse.'
      );
    } else if (lvl === 'moderate') {
      items.push(
        'Flare risk looks <strong>moderate</strong> (' + matchCount + ' of 5 signs). Extra rest and tracking may help.'
      );
    } else {
      items.push(
        'Fewer flare warning signs showed up in this window. Still use how you <em>feel</em> as your main guide.'
      );
    }
  }
  if (analysis.anomalies && analysis.anomalies.length > 0) {
    items.push(
      'There ' +
        (analysis.anomalies.length === 1 ? 'is' : 'are') +
        ' <strong>' +
        analysis.anomalies.length +
        '</strong> pattern' +
        (analysis.anomalies.length === 1 ? '' : 's') +
        ' listed under <strong>Things to watch</strong> below.'
    );
  }
  if (logs && logs.length) {
    items.push(
      'Everything here is based on <strong>' +
        logs.length +
        '</strong> day' +
        (logs.length === 1 ? '' : 's') +
        ' of your logs in the date range you selected.'
    );
  }
  if (items.length === 0) return '';
  return (
    '<aside class="ai-at-a-glance" aria-label="Summary in plain language">' +
    '<h3 class="ai-at-a-glance-title">At a glance</h3>' +
    '<ul class="ai-at-a-glance-list">' +
    items.map(function(t) {
      return '<li>' + t + '</li>';
    }).join('') +
    '</ul>' +
    '<p class="ai-at-a-glance-footnote" role="note">Colours and arrows support the text - they are not the only way we show good versus concerning trends.</p>' +
    '</aside>'
  );
}

function displayAISummary(analysis, logs, dayCount, webLLMInsights = null, dateRangeText = '') {
  const resultsContent = document.getElementById('aiResultsContent');
  
  if (!resultsContent) {
    Logger.error('AI results content element not found');
    return;
  }

  // Store analysis data for radar chart access
  currentAIAnalysis = analysis;
  // Store filtered logs for average calculation (logs parameter contains the filtered logs for the selected range)
  currentAIFilteredLogs = logs;

  var optProfile = window.PerformanceUtils && window.PerformanceUtils.getOptimizationProfile ? window.PerformanceUtils.getOptimizationProfile() : null;
  var deviceOpts = (window.PerformanceUtils && typeof window.PerformanceUtils.getDeviceOpts === 'function') ? window.PerformanceUtils.getDeviceOpts() : {};
  var reduceUIAnimations = !!(optProfile && optProfile.reduceUIAnimations) || !!(deviceOpts.reduceAnimations);
  if (reduceUIAnimations) resultsContent.classList.add('reduce-motion'); else resultsContent.classList.remove('reduce-motion');
  var animStep = reduceUIAnimations ? 0 : 1;

  // Build the summary HTML with animation classes (delays zeroed on low/reduced-motion)
  let html = '';
  let animationDelay = 0;

  // Top-level results heading for the date range
  if (dateRangeText) {
    html += `<h2 class="ai-results-heading" id="ai-results-main-heading">Analysis for ${escapeHTML(dateRangeText)}</h2>`;
  }

  html += buildAIAnalysisAtAGlance(analysis, logs, dayCount);

  // AI Insights Section (from enhanced local analysis)
  let insightsText = webLLMInsights;
  
  // If no LLM insights, use enhanced local analysis
  if (!insightsText) {
    insightsText = generateComprehensiveInsights(analysis, logs, dayCount);
  }
  
  if (insightsText) {
    html += `
      <div class="ai-summary-section ai-animate-in" style="animation-delay: ${animationDelay}ms;">
        <section class="ai-synopsis-section" aria-labelledby="ai-heading-found">
        <h3 class="ai-section-title" id="ai-heading-found">🤖 What we found</h3>
        <p class="ai-section-intro">Patterns described in everyday language. Numbers in highlights come from your own entries. This screen supports self-care - it does not replace medical advice.</p>
        <div class="ai-llm-synopsis" role="region" aria-label="Detailed written findings">
          ${insightsText.split('\n\n').map(para => {
            const trimmed = para.trim();
            if (!trimmed) return '';
            // Escape HTML first, then format markdown-style bold text and highlight figures in brackets
            const escaped = escapeHTML(trimmed);
            let formatted = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            formatted = formatted.replace(/\(([^)]+)\)/g, '<span class="ai-brackets-highlight">($1)</span>');
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
        </section>
      </div>
  `;
    animationDelay += 200 * animStep;
  }

  // Natural language summary note (copyable). Rule-based note shown first; in-browser LLM may replace it.
  var summaryNoteSectionId = 'aiSummaryNoteSection';
  var summaryNoteTextId = 'aiSummaryNoteText';
  if (window.AIEngine && typeof window.AIEngine.generateAnalysisNote === 'function') {
    try {
      const noteText = window.AIEngine.generateAnalysisNote(analysis, { dayCount: dayCount || logs.length, logs: logs });
      if (noteText && noteText.trim()) {
        html += `
      <div class="ai-summary-section ai-animate-in" id="${summaryNoteSectionId}" style="animation-delay: ${animationDelay}ms;">
        <h3 class="ai-section-title" id="ai-heading-summary-note">📝 Summary note</h3>
        <p class="ai-section-intro">A short line you can copy for yourself or your clinician.</p>
        <p class="ai-generated-note" id="${summaryNoteTextId}">${escapeHTML(noteText.trim())}</p>
        <button type="button" class="ai-copy-note-btn" onclick="typeof copyAIGeneratedNote==='function'&&copyAIGeneratedNote(this)" title="Copy summary note to clipboard" aria-label="Copy summary note to clipboard">Copy note</button>
      </div>`;
        animationDelay += 200 * animStep;
      }
    } catch (e) { /* ignore */ }
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
  const statPills = [
    { icon: '📊', value: numericWithData.length, label: 'Metrics' },
    { icon: '🔥', value: daysFlare, label: 'Flare days' },
    { icon: '🍽️', value: daysFood, label: 'Food' },
    { icon: '🏃', value: daysExercise, label: 'Exercise' },
    { icon: '😰', value: daysStressors, label: 'Stress' },
    { icon: '💉', value: daysSymptoms, label: 'Symptoms' },
    { icon: '📍', value: daysPainLocation, label: 'Pain areas' },
    { icon: '⚡', value: daysEnergyClarity, label: 'Energy' },
    { icon: '📝', value: daysNotes, label: 'Notes' }
  ];
  html += `
    <div class="ai-summary-section ai-animate-in" style="animation-delay: ${animationDelay}ms;">
      <h3 class="ai-section-title" id="ai-heading-logged">📋 What you logged</h3>
      <p class="ai-section-intro">How many days in this range included each type of entry.</p>
      <div class="ai-stat-pills" role="list">
        ${statPills.map((p, i) => {
          const aria =
            p.label === 'Metrics'
              ? p.value + ' metrics with enough data to analyse'
              : p.value + ' days with ' + p.label.toLowerCase() + ' logged';
          return `<div class="ai-stat-pill ai-animate-in" style="animation-delay: ${animationDelay + (i * 40)}ms;" role="listitem" aria-label="${escapeAttr(aria)}">
          <span class="ai-stat-pill-icon" aria-hidden="true">${p.icon}</span>
          <span class="ai-stat-pill-value" aria-hidden="true">${p.value}</span>
          <span class="ai-stat-pill-label">${escapeHTML(p.label)}</span>
        </div>`;
        }).join('')}
      </div>
    </div>
  `;
  animationDelay += 200 * animStep;

  // Trends section - simplified for non-technical users
  html += `
    <div class="ai-summary-section ai-animate-in" style="animation-delay: ${animationDelay}ms;">
      <h3 class="ai-section-title" id="ai-heading-trends">📈 How you're doing</h3>
      <p class="ai-section-intro">Each card compares your recent average to your latest entry. Labels like “Getting better” describe the direction - not a medical judgement.</p>
      <div class="ai-trends-grid" role="list">
  `;
  animationDelay += 200 * animStep;
  
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
    
    const statusKey = currentStatus === 'improving' ? 'improving' : currentStatus === 'worsening' ? 'worsening' : 'stable';
    const ariaCard =
      metricName +
      '. ' +
      trendDescription +
      '. Typical value ' +
      averageDisplay +
      ', latest ' +
      currentDisplay +
      (predictedDisplay ? ', outlook ' + predictedDisplay : '') +
      '.';
    html += `
      <div class="ai-trend-card ai-trend-card--metric ai-animate-in ai-trend-status--${statusKey}" style="border-left-color: ${trendColor}; animation-delay: ${animationDelay + (index * 100)}ms;" role="listitem">
        <div class="ai-trend-card-inner" role="group" aria-label="${escapeAttr(ariaCard)}">
        <div class="ai-trend-header">
          <strong><span aria-hidden="true">${trendIcon}</span> ${metricName}</strong>
          <span class="ai-trend-status-chip ai-trend-status-chip--${statusKey}">${escapeHTML(trendDescription)}</span>
        </div>
        <div class="ai-trend-values">
          <div class="ai-trend-value"><span class="ai-trend-value-label">Typical</span><strong style="color: ${trendColor};">${averageDisplay}</strong></div>
          <div class="ai-trend-value"><span class="ai-trend-value-label">Latest</span><strong style="color: ${trendColor};">${currentDisplay}</strong></div>
          ${predictedDisplay ? `<div class="ai-trend-value"><span class="ai-trend-value-label">Outlook</span><strong style="color: ${predictedColor};">${predictedDisplay}</strong></div>` : ''}
        </div>
        </div>
      </div>
  `;
  });
  
  html += `</div></div>`;
  animationDelay += 300 * animStep;

  // Flare-up risk section
  if (analysis.flareUpRisk) {
    const riskLevel = analysis.flareUpRisk.level;
    const riskColor = riskLevel === 'high' ? '#f44336' : riskLevel === 'moderate' ? '#ff9800' : '#ffc107';
    const riskIcon = riskLevel === 'high' ? '🔴' : riskLevel === 'moderate' ? '🟡' : '🟠';
    
    const matchCount = analysis.flareUpRisk.matchingMetrics;
    html += `
      <div class="ai-summary-section ai-section-warning ai-animate-in" style="animation-delay: ${animationDelay}ms;">
        <h3 class="ai-section-title" id="ai-heading-flare" style="color: ${riskColor};"><span aria-hidden="true">${riskIcon}</span> Possible flare-up</h3>
        <p class="ai-section-intro">A simple score from patterns in your logs - not a medical test.</p>
        <div class="ai-flare-visual">
          <div class="ai-flare-level" style="color: ${riskColor};"><strong>${riskLevel}</strong> <span class="ai-flare-level-note">risk level</span></div>
          <div class="ai-flare-dots" aria-hidden="true">
            ${[1,2,3,4,5].map(n => `<span class="ai-flare-dot ${n <= matchCount ? 'active' : ''}" style="${n <= matchCount ? `background: ${riskColor};` : ''}"></span>`).join('')}
          </div>
          <p class="ai-flare-hint" role="status">${matchCount} of 5 warning signs lit. Listen to your body and seek care if symptoms concern you.</p>
        </div>
      </div>
    `;
    animationDelay += 300 * animStep;
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
          <h3 class="ai-section-title" id="ai-heading-correlations">🔗 Correlations</h3>
          <p class="ai-section-intro">Metrics that tended to move together in your logs. Tap a row (or press Enter when focused) to show or hide a chart.</p>
          <div class="ai-trends-grid ai-correlations-grid" role="list">
      `;
      
      topCorrelations.forEach((corr, index) => {
        const corrColor = corr.correlation > 0 ? '#e91e63' : '#f44336';
        const direction = corr.correlation > 0 ? 'goes up when' : 'goes down when';
        const strength = Math.abs(corr.correlation) > 0.7 ? 'strongly' : Math.abs(corr.correlation) > 0.5 ? 'usually' : 'sometimes';
        const corrSummary = corr.metric1 + ' ' + strength + ' ' + direction + ' ' + corr.metric2;
        
        html += `
          <div class="ai-correlation-card-wrap ai-animate-in" style="animation-delay: ${animationDelay + (index * 100)}ms;" role="listitem">
          <button type="button" class="ai-correlation-card-toggle ai-trend-card" style="border-left-color: ${corrColor};" onclick="toggleCorrelationRadarChart('${corr.metric1Field}', '${corr.metric2Field}', '${corr.metric3Field || ''}', ${index})" data-correlation-index="${index}" aria-expanded="false" aria-controls="correlationRadarChart_${index}" id="correlationToggle_${index}" aria-label="${escapeAttr(corrSummary + '. Show or hide chart.')}">
            <span class="ai-trend-header">
              <strong>${corr.metric1} ${strength} ${direction} ${corr.metric2}</strong>
            </span>
            <span class="ai-correlation-expand-hint" aria-hidden="true">Chart</span>
          </button>
            <div class="metric-radar-chart-container" id="correlationRadarChart_${index}" style="display: none; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid rgba(255, 255, 255, 0.1);" role="region" aria-label="Chart for ${escapeAttr(corr.metric1 + ' and ' + corr.metric2)}">
              <div id="correlationRadarChart_${index}_chart" style="height: 400px;"></div>
            </div>
          </div>
        `;
      });
      
      html += `</div></div>`;
      animationDelay += 300 * animStep;
      
      // Display correlation clusters if available - simplified for non-technical users
      if (analysis.correlationClusters && analysis.correlationClusters.length > 0) {
        html += `
          <div class="ai-summary-section ai-animate-in" style="animation-delay: ${animationDelay}ms;">
            <h3 class="ai-section-title ai-section-green">📊 Groups that change together</h3>
            <p class="ai-section-intro">These items often showed up together in your logs - useful context, not a rule.</p>
            <ul class="ai-list" style="margin-top: 1rem;">
              ${analysis.correlationClusters.map((cluster, idx) => {
                const clusterNames = cluster.map(m => m.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())).join(', ');
                return `<li style="margin-bottom: 0.75rem;">${clusterNames}</li>`;
              }).join('')}
            </ul>
          </div>
        `;
        animationDelay += 200 * animStep;
      }
    }
  }

  // Stressors impact section
  if (analysis.stressorAnalysis && analysis.stressorAnalysis.topStressors.length > 0) {
    const stressorAnalysis = analysis.stressorAnalysis;
    html += `
      <div class="ai-summary-section ai-section-info ai-animate-in" style="animation-delay: ${animationDelay}ms;">
        <h3 class="ai-section-title ai-section-green">😰 Stress and triggers</h3>
        <p style="color: rgba(224, 242, 241, 0.8); margin-bottom: 1rem;">${formatAIValueText(stressorAnalysis.summary)}</p>
    `;
    
    if (stressorAnalysis.impacts.length > 0) {
      html += `<ul class="ai-list">`;
      stressorAnalysis.impacts.slice(0, 3).forEach((impact, index) => {
        html += `<li class="ai-animate-in" style="animation-delay: ${animationDelay + 100 + (index * 100)}ms;">${formatAIValueText(impact)}</li>`;
      });
      html += `</ul>`;
    }
    
    html += `</div>`;
    animationDelay += 300 * animStep;
  }
  
  // Symptoms and pain location analysis section
  if (analysis.symptomsAndPainAnalysis && (analysis.symptomsAndPainAnalysis.topSymptoms.length > 0 || analysis.symptomsAndPainAnalysis.topPainLocations.length > 0)) {
    const symptomsAnalysis = analysis.symptomsAndPainAnalysis;
    html += `
      <div class="ai-summary-section ai-section-info ai-animate-in" style="animation-delay: ${animationDelay}ms;">
        <h3 class="ai-section-title ai-section-green">💉 Symptoms and where you had pain</h3>
        <p style="color: rgba(224, 242, 241, 0.8); margin-bottom: 1rem;">${formatAIValueText(symptomsAnalysis.summary)}</p>
    `;
    
    if (symptomsAnalysis.symptomImpacts.length > 0 || symptomsAnalysis.painLocationImpacts.length > 0) {
      html += `<ul class="ai-list">`;
      [...symptomsAnalysis.symptomImpacts, ...symptomsAnalysis.painLocationImpacts].slice(0, 3).forEach((impact, index) => {
        html += `<li class="ai-animate-in" style="animation-delay: ${animationDelay + 100 + (index * 100)}ms;">${formatAIValueText(impact)}</li>`;
      });
      html += `</ul>`;
    }
    
    html += `</div>`;
    animationDelay += 300 * animStep;
  }
  
  // Pain by body part (28 diagram regions) - show how bad each body part (severity, days, % of period)
  if (analysis.symptomsAndPainAnalysis && analysis.symptomsAndPainAnalysis.painByRegion) {
    const painByRegion = analysis.symptomsAndPainAnalysis.painByRegion;
    const regionsWithPain = Object.entries(painByRegion)
      .filter(([, data]) => data && (data.painDays > 0 || data.mildDays > 0))
      .sort((a, b) => (b[1].severityScore || 0) - (a[1].severityScore || 0));
    const painBodyFigureSVG = getAIPainBodyFigureSVG(painByRegion);
    html += `
      <div class="ai-summary-section ai-section-info ai-animate-in" style="animation-delay: ${animationDelay}ms;">
        <h3 class="ai-section-title ai-section-green">📍 Pain by body part</h3>
        <div class="ai-pain-body-figure-wrap">
          <div class="ai-pain-body-figure" aria-hidden="true">${painBodyFigureSVG}</div>
          <p class="ai-pain-body-legend"><span class="ai-legend-dot green"></span> good &nbsp; <span class="ai-legend-dot yellow"></span> discomfort &nbsp; <span class="ai-legend-dot red"></span> pain</p>
        </div>
        <p class="ai-section-intro">Severity uses colour <em>and</em> a text label.</p>
        <div class="ai-pain-table-wrap">
          <table class="ai-pain-table" style="width: 100%; border-collapse: collapse;">
            <caption class="visually-hidden">Pain and mild discomfort by body area for the selected period</caption>
            <thead>
              <tr style="border-bottom: 1px solid rgba(76, 175, 80, 0.3);">
                <th scope="col" class="ai-pain-col-part" style="text-align: left; padding: 8px 12px;">Body part</th>
                <th scope="col" class="ai-pain-col-mild" style="text-align: right; padding: 8px 12px;">Mild days</th>
                <th scope="col" class="ai-pain-col-pain" style="text-align: right; padding: 8px 12px;">Pain days</th>
                <th scope="col" class="ai-pain-col-period" style="text-align: right; padding: 8px 12px;">% of period</th>
                <th scope="col" class="ai-pain-col-severity" style="text-align: left; padding: 8px 12px;">Severity label</th>
              </tr>
            </thead>
            <tbody>
    `;
    if (regionsWithPain.length > 0) {
      regionsWithPain.forEach(([, data], index) => {
        const painRatio = data.painRatio != null ? Math.round(data.painRatio * 100) : (data.painDays && data.totalDays ? Math.round((data.painDays / data.totalDays) * 100) : 0);
        const pctOfPeriod = data.pctOfPeriod != null ? data.pctOfPeriod : (dayCount ? Math.round((data.totalDays / dayCount) * 100) : 0);
        let severityLabel = 'Low';
        if (data.severityScore >= 10 || (data.painRatio >= 0.7 && data.totalDays >= 5)) severityLabel = 'High';
        else if (data.severityScore >= 4 || data.painRatio >= 0.4) severityLabel = 'Medium';
        const severityClass = severityLabel === 'High' ? 'ai-pain-severity-high' : (severityLabel === 'Medium' ? 'ai-pain-severity-medium' : 'ai-pain-severity-low');
        html += `<tr class="ai-animate-in" style="animation-delay: ${animationDelay + 50 + (index * 25)}ms; border-bottom: 1px solid rgba(255,255,255,0.06);">
          <td class="ai-pain-col-part" style="padding: 8px 12px;">${escapeHTML(data.label)}</td>
          <td class="ai-pain-col-mild" style="text-align: right; padding: 8px 12px;"><span class="ai-brackets-highlight">${data.mildDays || 0}</span></td>
          <td class="ai-pain-col-pain" style="text-align: right; padding: 8px 12px;"><span class="ai-brackets-highlight">${data.painDays || 0}</span></td>
          <td class="ai-pain-col-period" style="text-align: right; padding: 8px 12px;"><span class="ai-brackets-highlight">${pctOfPeriod}%</span></td>
          <td class="ai-pain-col-severity" style="padding: 8px 12px;"><span class="${severityClass} ai-brackets-highlight" style="padding: 2px 8px; border-radius: 6px; font-size: 0.85rem;">${severityLabel}</span></td>
        </tr>`;
      });
    } else {
      html += `<tr><td colspan="5" style="padding: 12px;">No body areas with pain or mild in this period.</td></tr>`;
    }
    html += `</tbody></table></div>`;
    html += `</div>`;
    animationDelay += 300 * animStep;
  }
  
  // Pain data exploration: summary from all pain points in the period
  if (analysis.symptomsAndPainAnalysis && analysis.symptomsAndPainAnalysis.painExploration && analysis.symptomsAndPainAnalysis.painExploration.summaryLines && analysis.symptomsAndPainAnalysis.painExploration.summaryLines.length > 0) {
    const exploration = analysis.symptomsAndPainAnalysis.painExploration;
    html += `
      <div class="ai-summary-section ai-section-info ai-animate-in" style="animation-delay: ${animationDelay}ms;">
        <h3 class="ai-section-title ai-section-green">🔬 Pain patterns</h3>
        <ul class="ai-list" style="margin: 0; padding-left: 1.25rem;">
    `;
    exploration.summaryLines.forEach((line, i) => {
      html += `<li class="ai-animate-in" style="animation-delay: ${animationDelay + 50 + (i * 60)}ms; margin-bottom: 0.5rem;">${formatAIValueText(line)}</li>`;
    });
    html += `</ul></div>`;
    animationDelay += 300 * animStep;
  }
  
  // Nutrition analysis section
  if (analysis.nutritionAnalysis && analysis.nutritionAnalysis.avgCalories > 0) {
    const nutrition = analysis.nutritionAnalysis;
    html += `
      <div class="ai-summary-section ai-section-info ai-animate-in" style="animation-delay: ${animationDelay}ms;">
        <h3 class="ai-section-title ai-section-green">🍽️ Nutrition</h3>
        <div class="ai-nutrition-visual">
          <div class="ai-nutrition-main"><span class="ai-nutrition-value ai-brackets-highlight">${nutrition.avgCalories}</span> <span class="ai-nutrition-unit">cal</span></div>
          <div class="ai-nutrition-main"><span class="ai-nutrition-value ai-brackets-highlight">${nutrition.avgProtein}g</span> <span class="ai-nutrition-unit">protein</span></div>
        </div>
    `;
    if (nutrition.highCalorieDays > 0 || nutrition.lowCalorieDays > 0 || nutrition.highProteinDays > 0 || nutrition.lowProteinDays > 0) {
      const extras = [];
      if (nutrition.highCalorieDays > 0) extras.push(`>2500 cal: <span class="ai-brackets-highlight">${nutrition.highCalorieDays}d</span>`);
      if (nutrition.lowCalorieDays > 0) extras.push(`<1500 cal: <span class="ai-brackets-highlight">${nutrition.lowCalorieDays}d</span>`);
      if (nutrition.highProteinDays > 0) extras.push(`>100g: <span class="ai-brackets-highlight">${nutrition.highProteinDays}d</span>`);
      if (nutrition.lowProteinDays > 0) extras.push(`<50g: <span class="ai-brackets-highlight">${nutrition.lowProteinDays}d</span>`);
      html += `<p class="ai-nutrition-extra">${extras.join(' · ')}</p>`;
    }
    html += `</div>`;
    animationDelay += 300 * animStep;
  }
  
  // Exercise summary (avg minutes on days with exercise)
  if (analysis.exerciseSummary && analysis.exerciseSummary.daysWithExercise > 0) {
    const ex = analysis.exerciseSummary;
    html += `
      <div class="ai-summary-section ai-section-info ai-animate-in" style="animation-delay: ${animationDelay}ms;">
        <h3 class="ai-section-title ai-section-green">🏃 Exercise</h3>
        <div class="ai-exercise-visual">
          <span class="ai-exercise-value ai-brackets-highlight">${ex.avgMinutesPerDay}</span> <span class="ai-exercise-unit">min avg</span>
          <span class="ai-exercise-days ai-brackets-highlight">${ex.daysWithExercise} days</span>
        </div>
      </div>
    `;
    animationDelay += 300 * animStep;
  }

  // Top exercises (most logged by name)
  if (analysis.topExercises && analysis.topExercises.length > 0) {
    html += `
      <div class="ai-summary-section ai-section-info ai-animate-in" style="animation-delay: ${animationDelay}ms;">
        <h3 class="ai-section-title ai-section-green">🏃 Top exercises</h3>
        <ul class="ai-list ai-list-pills" style="columns: 2; column-gap: 1rem;">
    `;
    analysis.topExercises.forEach((item, index) => {
      html += `<li class="ai-animate-in" style="animation-delay: ${animationDelay + 50 + (index * 30)}ms;">${escapeHTML(item.name)}: <span class="ai-brackets-highlight">${item.count} ${item.count === 1 ? 'time' : 'times'}</span></li>`;
    });
    html += `</ul></div>`;
    animationDelay += 300 * animStep;
  }

  // Top foods (most logged by name)
  if (analysis.topFoods && analysis.topFoods.length > 0) {
    html += `
      <div class="ai-summary-section ai-section-info ai-animate-in" style="animation-delay: ${animationDelay}ms;">
        <h3 class="ai-section-title ai-section-green">🍽️ Top foods</h3>
        <ul class="ai-list ai-list-pills" style="columns: 2; column-gap: 1rem;">
    `;
    analysis.topFoods.forEach((item, index) => {
      html += `<li class="ai-animate-in" style="animation-delay: ${animationDelay + 50 + (index * 30)}ms;">${escapeHTML(item.name)}: <span class="ai-brackets-highlight">${item.count} ${item.count === 1 ? 'time' : 'times'}</span></li>`;
    });
    html += `</ul></div>`;
    animationDelay += 300 * animStep;
  }

  // Nutrition summary (avg calories/protein when present)
  if (analysis.nutritionAnalysis && analysis.nutritionAnalysis.daysWithFood > 0 && !analysis.nutritionAnalysis.avgCalories) {
    const nut = analysis.nutritionAnalysis;
    html += `
      <div class="ai-summary-section ai-section-info ai-animate-in" style="animation-delay: ${animationDelay}ms;">
        <h3 class="ai-section-title ai-section-green">🍽️ Food summary</h3>
        <div class="ai-exercise-visual"><span class="ai-exercise-days">${nut.daysWithFood} days</span> with food logged</div>
      </div>
    `;
    animationDelay += 300 * animStep;
  }
  
  // Food/Exercise impact section - simplified
  if (analysis.foodExerciseImpacts && analysis.foodExerciseImpacts.length > 0) {
    html += `
      <div class="ai-summary-section ai-animate-in" style="animation-delay: ${animationDelay}ms;">
        <h3 class="ai-section-title">🍽️ What seems to help</h3>
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
    animationDelay += 300 * animStep;
  }

  // Anomalies section (high-contrast, less dense)
  if (analysis.anomalies.length > 0) {
    html += `
      <div class="ai-summary-section ai-section-warning ai-animate-in" style="animation-delay: ${animationDelay}ms;">
        <h3 class="ai-section-title ai-section-orange" id="ai-heading-watch">⚠️ Things to watch</h3>
        <p class="ai-section-intro">Unusual patterns in your numbers. They are prompts to notice how you feel - not automatic diagnoses.</p>
        <ul class="ai-list ai-list-warning">
    `;
    analysis.anomalies.forEach((anomaly, index) => {
      const formatted = formatAnomalyLine(anomaly);
      html += `<li class="ai-animate-in" style="animation-delay: ${animationDelay + 200 + (index * 100)}ms;">${formatted}</li>`;
    });
    html += `</ul></div>`;
    animationDelay += 300 * animStep;
  }

  // General management section - simplified
  html += `
    <div class="ai-summary-section ai-section-info ai-animate-in" style="animation-delay: ${animationDelay}ms;">
      <h3 class="ai-section-title ai-section-green">💡 Important</h3>
      <p class="ai-disclaimer">For patterns only - talk to your doctor before changing care. You can share this at your next visit. AI data (e.g. prediction weights) is stored on your device and, when signed in, backed up to your cloud account.</p>
    </div>
  `;

  // Timeline layout wrapper + scroll-snap targets per section (mobile uses horizontal pager)
  if (html.indexOf('ai-summary-section') !== -1) {
    html = html.replace(/class="ai-summary-section/g, 'class="ai-summary-section ai-timeline-snap');
    html =
      '<div class="ai-results-timeline-outer">' +
      '<nav class="ai-timeline-mobile" id="aiTimelineMobile" hidden aria-hidden="true">' +
      '<div class="ai-timeline-mobile-line" id="aiTimelineMobileLine" aria-hidden="true"></div>' +
      '<div class="ai-timeline-mobile-track" id="aiTimelineMobileTrack" role="list"></div>' +
      '</nav>' +
      '<div class="ai-results-timeline-layout">' +
      '<div class="ai-results-timeline-main">' +
      html +
      '</div></div></div>';
  }

  // Set the HTML content (drop stale rails that were reparented to #appShell)
  purgeAItimelineDetachedOverlays();
  resultsContent.innerHTML = html;

  requestAnimationFrame(function() {
    requestAnimationFrame(function() {
      if (typeof initAITimelinePortrait === 'function') initAITimelinePortrait();
    });
  });

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
    void renderMetricRadarChart(metric, chartDiv).catch(function () {});
  }
}

// Render radar chart for a specific metric
async function renderMetricRadarChart(metric, container) {
  if (!currentAIAnalysis || !currentAIAnalysis.trends[metric]) {
    console.error('No trend data available for metric:', metric);
    return;
  }
  try {
    if (window.PerformanceUtils && typeof window.PerformanceUtils.ensureApexChartsLoaded === 'function') {
      await window.PerformanceUtils.ensureApexChartsLoaded();
    }
  } catch (e) {
    console.error(e);
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
  const toggleBtn = document.getElementById('correlationToggle_' + index);
  
  if (!chartContainer || !chartDiv) {
    console.error('Correlation radar chart container not found');
    return;
  }
  
  // Toggle visibility
  const isVisible = chartContainer.style.display !== 'none';
  
  if (isVisible) {
    // Hide chart
    chartContainer.style.display = 'none';
    if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
    if (chartDiv.chart) {
      chartDiv.chart.destroy();
      chartDiv.chart = null;
    }
  } else {
    // Show and render chart
    chartContainer.style.display = 'block';
    if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'true');
    void renderCorrelationRadarChart(metric1, metric2, metric3, chartDiv).catch(function () {});
  }
}

// Render radar chart for a correlation between two metrics with a third associated metric
async function renderCorrelationRadarChart(metric1, metric2, metric3, container) {
  if (!currentAIAnalysis || !currentAIAnalysis.trends[metric1] || !currentAIAnalysis.trends[metric2]) {
    console.error('No trend data available for correlation:', metric1, metric2);
    return;
  }
  try {
    if (window.PerformanceUtils && typeof window.PerformanceUtils.ensureApexChartsLoaded === 'function') {
      await window.PerformanceUtils.ensureApexChartsLoaded();
    }
  } catch (e) {
    console.error(e);
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
  bread_slices: 'fa-solid fa-bread-slice',
  milk: 'fa-solid fa-mug-saucer',
  cottage_cheese: 'fa-solid fa-cheese',
  cheese_slice: 'fa-solid fa-cheese',
  yogurt_drink: 'fa-solid fa-bottle-water',
  kefir: 'fa-solid fa-blender',
  cream_cheese_bagel: 'fa-solid fa-bread-slice',
  latte: 'fa-solid fa-mug-hot',
  ice_cream: 'fa-solid fa-ice-cream',
  stir_fry: 'fa-solid fa-bowl-food',
  burrito: 'fa-solid fa-burrito',
  sandwich: 'fa-solid fa-burger',
  curry: 'fa-solid fa-bowl-food',
  casserole: 'fa-solid fa-plate-wheat',
  omelette: 'fa-solid fa-egg',
  wrap: 'fa-solid fa-burrito',
  mac_cheese: 'fa-solid fa-cheese',
  orange: 'fa-solid fa-apple-whole',
  grapes: 'fa-solid fa-apple-whole',
  berries: 'fa-solid fa-apple-whole',
  mango: 'fa-solid fa-apple-whole',
  green_salad: 'fa-solid fa-bowl-food',
  roasted_veg: 'fa-solid fa-carrot',
  broccoli: 'fa-solid fa-carrot',
  popcorn: 'fa-solid fa-seedling',
  rice_cakes: 'fa-solid fa-bread-slice',
  trail_mix: 'fa-solid fa-seedling'
};

// Energy & Mental Clarity options for tile picker - mood = positive (green), neutral (blue), negative (amber/red)
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
// Predefined food items with calories and nutrients (selectable in food log). meals = which meal(s) show this item.
const PREDEFINED_FOODS = [
  { id: 'oatmeal', name: 'Oatmeal with berries', calories: 200, protein: 5, carbs: 36, fat: 4, group: 'grains', meals: ['breakfast'] },
  { id: 'eggs2', name: 'Eggs, 2 large', calories: 140, protein: 12, carbs: 1, fat: 10, group: 'protein', meals: ['breakfast'] },
  { id: 'greek_yogurt', name: 'Greek yogurt, 150g', calories: 130, protein: 11, carbs: 6, fat: 5, group: 'dairy', meals: ['breakfast', 'snack'] },
  { id: 'avocado_toast', name: 'Avocado toast', calories: 250, protein: 6, carbs: 22, fat: 16, group: 'mixed', meals: ['breakfast'] },
  { id: 'smoothie', name: 'Green smoothie', calories: 150, protein: 3, carbs: 28, fat: 2, group: 'fruits', meals: ['breakfast', 'snack'] },
  { id: 'cereal_milk', name: 'Cereal with milk', calories: 220, protein: 8, carbs: 38, fat: 5, group: 'grains', meals: ['breakfast'] },
  { id: 'banana', name: 'Banana', calories: 105, protein: 1.3, carbs: 27, fat: 0.4, group: 'fruits', meals: ['breakfast', 'snack'] },
  { id: 'toast_butter', name: 'Whole grain toast with butter', calories: 180, protein: 6, carbs: 24, fat: 7, group: 'grains', meals: ['breakfast'] },
  { id: 'grilled_chicken', name: 'Grilled chicken, 200g', calories: 330, protein: 62, carbs: 0, fat: 7, group: 'protein', meals: ['lunch', 'dinner'] },
  { id: 'brown_rice', name: 'Brown rice, 150g', calories: 165, protein: 3.5, carbs: 34, fat: 1.5, group: 'grains', meals: ['lunch', 'dinner'] },
  { id: 'salmon', name: 'Salmon fillet, 180g', calories: 360, protein: 50, carbs: 0, fat: 16, group: 'protein', meals: ['lunch', 'dinner'] },
  { id: 'quinoa_salad', name: 'Quinoa salad', calories: 220, protein: 8, carbs: 32, fat: 6, group: 'vegetables', meals: ['lunch', 'dinner'] },
  { id: 'steamed_veg', name: 'Steamed vegetables', calories: 50, protein: 2, carbs: 10, fat: 0, group: 'vegetables', meals: ['lunch', 'dinner'] },
  { id: 'green_salad', name: 'Green salad', calories: 60, protein: 3, carbs: 8, fat: 2, group: 'vegetables', meals: ['lunch', 'dinner'] },
  { id: 'roasted_veg', name: 'Roasted vegetables', calories: 90, protein: 2, carbs: 14, fat: 3, group: 'vegetables', meals: ['lunch', 'dinner'] },
  { id: 'broccoli', name: 'Broccoli, 150g', calories: 45, protein: 3.5, carbs: 9, fat: 0.5, group: 'vegetables', meals: ['lunch', 'dinner'] },
  { id: 'turkey_sandwich', name: 'Turkey sandwich', calories: 320, protein: 24, carbs: 35, fat: 10, group: 'protein', meals: ['lunch'] },
  { id: 'soup_veg', name: 'Vegetable soup', calories: 120, protein: 4, carbs: 18, fat: 3, group: 'vegetables', meals: ['lunch', 'dinner'] },
  { id: 'tuna_salad', name: 'Tuna salad', calories: 280, protein: 30, carbs: 8, fat: 14, group: 'protein', meals: ['lunch'] },
  { id: 'pasta', name: 'Pasta, 200g', calories: 250, protein: 8, carbs: 42, fat: 4, group: 'grains', meals: ['lunch', 'dinner'] },
  { id: 'grilled_fish', name: 'Grilled fish, 200g', calories: 280, protein: 45, carbs: 0, fat: 10, group: 'protein', meals: ['lunch', 'dinner'] },
  { id: 'sweet_potato', name: 'Sweet potato, 200g', calories: 180, protein: 4, carbs: 42, fat: 0, group: 'vegetables', meals: ['lunch', 'dinner'] },
  { id: 'mixed_nuts', name: 'Mixed nuts, 30g', calories: 180, protein: 5, carbs: 6, fat: 16, group: 'snacks', meals: ['snack'] },
  { id: 'apple', name: 'Apple', calories: 95, protein: 0.5, carbs: 25, fat: 0.3, group: 'fruits', meals: ['breakfast', 'snack'] },
  { id: 'hummus_veg', name: 'Hummus with vegetables', calories: 160, protein: 5, carbs: 18, fat: 8, group: 'vegetables', meals: ['lunch', 'snack'] },
  { id: 'protein_bar', name: 'Protein bar', calories: 200, protein: 20, carbs: 22, fat: 6, group: 'snacks', meals: ['snack'] },
  { id: 'cheese_crackers', name: 'Cheese and crackers', calories: 220, protein: 10, carbs: 18, fat: 12, group: 'snacks', meals: ['snack'] },
  { id: 'chocolate_bar', name: 'Chocolate bar', calories: 220, protein: 3, carbs: 26, fat: 13, group: 'snacks', meals: ['snack'] },
  { id: 'popcorn', name: 'Popcorn, 1 cup', calories: 31, protein: 1, carbs: 6, fat: 0.4, group: 'snacks', meals: ['snack'] },
  { id: 'rice_cakes', name: 'Rice cakes, 2', calories: 70, protein: 1.4, carbs: 14, fat: 0.5, group: 'snacks', meals: ['snack'] },
  { id: 'trail_mix', name: 'Trail mix, 30g', calories: 140, protein: 4, carbs: 14, fat: 9, group: 'snacks', meals: ['snack'] },
  { id: 'fruit_salad', name: 'Fresh fruit salad', calories: 80, protein: 1, carbs: 20, fat: 0, group: 'fruits', meals: ['breakfast', 'snack'] },
  { id: 'orange', name: 'Orange', calories: 62, protein: 1.2, carbs: 15, fat: 0.2, group: 'fruits', meals: ['breakfast', 'snack'] },
  { id: 'grapes', name: 'Grapes, 1 cup', calories: 104, protein: 1.1, carbs: 27, fat: 0.2, group: 'fruits', meals: ['snack'] },
  { id: 'berries', name: 'Mixed berries, 1 cup', calories: 85, protein: 1, carbs: 21, fat: 0.5, group: 'fruits', meals: ['breakfast', 'snack'] },
  { id: 'mango', name: 'Mango, half', calories: 50, protein: 0.4, carbs: 12.5, fat: 0.2, group: 'fruits', meals: ['breakfast', 'snack'] },
  { id: 'pizza_slice', name: 'Pizza slice', calories: 280, protein: 12, carbs: 33, fat: 11, group: 'mixed', meals: ['lunch', 'dinner'] },
  { id: 'bread_slices', name: 'Bread, 2 slices', calories: 160, protein: 6, carbs: 28, fat: 2, group: 'grains', meals: ['breakfast', 'lunch'] },
  // Dairy (expanded)
  { id: 'milk', name: 'Milk, 1 cup', calories: 150, protein: 8, carbs: 12, fat: 8, group: 'dairy', meals: ['breakfast', 'snack'] },
  { id: 'cottage_cheese', name: 'Cottage cheese, 150g', calories: 120, protein: 15, carbs: 6, fat: 4, group: 'dairy', meals: ['breakfast', 'lunch', 'snack'] },
  { id: 'cheese_slice', name: 'Cheese slice', calories: 70, protein: 4, carbs: 1, fat: 6, group: 'dairy', meals: ['lunch', 'snack'] },
  { id: 'yogurt_drink', name: 'Yogurt drink, 200ml', calories: 140, protein: 6, carbs: 22, fat: 3, group: 'dairy', meals: ['breakfast', 'snack'] },
  { id: 'kefir', name: 'Kefir, 1 cup', calories: 110, protein: 9, carbs: 12, fat: 2, group: 'dairy', meals: ['breakfast'] },
  { id: 'cream_cheese_bagel', name: 'Cream cheese on bagel', calories: 320, protein: 11, carbs: 38, fat: 14, group: 'dairy', meals: ['breakfast'] },
  { id: 'latte', name: 'Latte', calories: 190, protein: 10, carbs: 18, fat: 8, group: 'dairy', meals: ['breakfast', 'snack'] },
  { id: 'ice_cream', name: 'Ice cream, 1 scoop', calories: 140, protein: 2, carbs: 20, fat: 6, group: 'dairy', meals: ['snack'] },
  // Mixed (expanded)
  { id: 'stir_fry', name: 'Vegetable stir-fry', calories: 280, protein: 12, carbs: 32, fat: 10, group: 'mixed', meals: ['lunch', 'dinner'] },
  { id: 'burrito', name: 'Burrito', calories: 450, protein: 20, carbs: 48, fat: 18, group: 'mixed', meals: ['lunch', 'dinner'] },
  { id: 'sandwich', name: 'Sandwich', calories: 350, protein: 18, carbs: 38, fat: 12, group: 'mixed', meals: ['lunch'] },
  { id: 'curry', name: 'Curry with rice', calories: 420, protein: 16, carbs: 52, fat: 14, group: 'mixed', meals: ['dinner'] },
  { id: 'casserole', name: 'Casserole', calories: 380, protein: 22, carbs: 28, fat: 18, group: 'mixed', meals: ['dinner'] },
  { id: 'omelette', name: 'Omelette', calories: 280, protein: 18, carbs: 4, fat: 20, group: 'mixed', meals: ['breakfast', 'lunch'] },
  { id: 'wrap', name: 'Wrap', calories: 320, protein: 16, carbs: 36, fat: 10, group: 'mixed', meals: ['lunch', 'dinner'] },
  { id: 'mac_cheese', name: 'Mac and cheese', calories: 400, protein: 14, carbs: 42, fat: 20, group: 'mixed', meals: ['lunch', 'dinner'] }
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
  upper_body: 'fa-solid fa-dumbbell',
  single_leg_stance: 'fa-solid fa-person-walking',
  heel_to_toe: 'fa-solid fa-shoe-prints',
  standing_balance: 'fa-solid fa-scale-balanced',
  rest_day: 'fa-solid fa-moon',
  meditation: 'fa-solid fa-brain',
  gentle_mobility: 'fa-solid fa-person-walking',
  bodyweight_squats: 'fa-solid fa-person-walking',
  leg_raises: 'fa-solid fa-dumbbell',
  rowing: 'fa-solid fa-person-swimming',
  stair_climbing: 'fa-solid fa-stairs'
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
  { id: 'single_leg_stance', name: 'Single-leg stance', defaultDuration: 5, category: 'balance' },
  { id: 'heel_to_toe', name: 'Heel-to-toe walk', defaultDuration: 5, category: 'balance' },
  { id: 'standing_balance', name: 'Standing balance hold', defaultDuration: 8, category: 'balance' },
  { id: 'pt_exercises', name: 'Physical therapy exercises', defaultDuration: 20, category: 'recovery' },
  { id: 'breathing', name: 'Breathing exercises', defaultDuration: 10, category: 'recovery' },
  { id: 'rest_day', name: 'Rest day (light movement)', defaultDuration: 15, category: 'recovery' },
  { id: 'meditation', name: 'Meditation / relaxation', defaultDuration: 15, category: 'recovery' },
  { id: 'gentle_mobility', name: 'Gentle mobility flow', defaultDuration: 15, category: 'recovery' },
  { id: 'bodyweight_squats', name: 'Bodyweight squats', defaultDuration: 10, category: 'strength' },
  { id: 'leg_raises', name: 'Leg raises', defaultDuration: 10, category: 'strength' },
  { id: 'rowing', name: 'Rowing machine', defaultDuration: 20, category: 'cardio' },
  { id: 'stair_climbing', name: 'Stair climbing', defaultDuration: 15, category: 'cardio' }
];

// Initialize food and exercise arrays early (before DOMContentLoaded)
let logFormFoodByCategory = { breakfast: [], lunch: [], dinner: [], snack: [] };
let logFormExerciseItems = []; // array of { name, duration } (duration in minutes)
let logFormStressorsItems = [];
let logFormSymptomsItems = [];
var logFormMedications = []; // array of { name, times, taken } for medication/supplement tracker
var medTimesDraftForAdd = []; // HH:MM strings for current "Add medication" row (before main Add)
let editStressorsItems = [];
let editSymptomsItems = [];
let editFoodByCategory = { breakfast: [], lunch: [], dinner: [], snack: [] };
let editExerciseItems = [];

// Offline log queue: when offline, entries are saved locally and queued for sync when back online
var OFFLINE_QUEUE_KEY = 'healthLogsOfflineQueue';

// Frequently used log options (medications, stressors, symptoms, exercises, foods) - stored in localStorage
var FREQUENT_OPTIONS_KEY = 'rianellFrequentOptions';
var FREQUENT_OPTIONS_MAX = 8; // max items to show per section
var FREQUENT_OPTIONS_MAX_STORED = 50; // cap keys per type to avoid bloat

function getFrequentOptionsStore() {
  try {
    var raw = localStorage.getItem(FREQUENT_OPTIONS_KEY);
    return raw ? JSON.parse(raw) : { medications: {}, stressors: {}, symptoms: {}, exercises: {}, foods: {} };
  } catch (e) {
    return { medications: {}, stressors: {}, symptoms: {}, exercises: {}, foods: {} };
  }
}

function setFrequentOptionsStore(store) {
  try {
    localStorage.setItem(FREQUENT_OPTIONS_KEY, JSON.stringify(store));
  } catch (e) {}
}

function recordFrequentOption(type, key, display, extra) {
  if (!key || !type) return;
  var store = getFrequentOptionsStore();
  if (!store[type]) store[type] = {};
  var entry = store[type][key];
  if (entry) {
    entry.count = (entry.count || 0) + 1;
    if (display) entry.display = display;
    if (extra && extra.category) entry.category = extra.category;
  } else {
    store[type][key] = { count: 1, display: display || key };
    if (extra && extra.category) store[type][key].category = extra.category;
  }
  // Cap number of keys per type (keep top by count)
  var keys = Object.keys(store[type]);
  if (keys.length > FREQUENT_OPTIONS_MAX_STORED) {
    var sorted = keys.sort(function(a, b) { return (store[type][b].count || 0) - (store[type][a].count || 0); });
    var keep = sorted.slice(0, FREQUENT_OPTIONS_MAX_STORED);
    var next = {};
    keep.forEach(function(k) { next[k] = store[type][k]; });
    store[type] = next;
  }
  setFrequentOptionsStore(store);
}

function getFrequentOptions(type, limit) {
  limit = limit || FREQUENT_OPTIONS_MAX;
  var store = getFrequentOptionsStore();
  if (!store[type] || typeof store[type] !== 'object') return [];
  var entries = Object.keys(store[type]).map(function(k) {
    var e = store[type][k];
    return { key: k, count: e.count || 0, display: e.display || k, category: e.category };
  });
  entries.sort(function(a, b) { return b.count - a.count; });
  return entries.slice(0, limit);
}

function recordFrequentOptionsFromEntry(entry) {
  if (!entry) return;
  if (entry.medications && Array.isArray(entry.medications)) {
    entry.medications.forEach(function(m) {
      var name = (m.name || '').trim();
      if (name) recordFrequentOption('medications', name.toLowerCase(), name);
    });
  }
  if (entry.stressors && Array.isArray(entry.stressors)) {
    entry.stressors.forEach(function(s) {
      var v = (typeof s === 'string' ? s : '').trim();
      if (v) recordFrequentOption('stressors', v, v);
    });
  }
  if (entry.symptoms && Array.isArray(entry.symptoms)) {
    entry.symptoms.forEach(function(s) {
      var v = (typeof s === 'string' ? s : '').trim();
      if (v) recordFrequentOption('symptoms', v, v);
    });
  }
  if (entry.exercise && Array.isArray(entry.exercise)) {
    entry.exercise.forEach(function(e) {
      var name = (typeof e === 'string' ? e : (e && e.name) || '').trim();
      if (!name) return;
      var predefined = typeof PREDEFINED_EXERCISES !== 'undefined' && PREDEFINED_EXERCISES.find(function(x) { return x.name === name; });
      if (predefined) recordFrequentOption('exercises', predefined.id, predefined.name);
    });
  }
  if (entry.food && typeof entry.food === 'object') {
    var unescapeForKey = function(s) {
      return String(s).replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').trim().toLowerCase();
    };
    ['breakfast', 'lunch', 'dinner', 'snack'].forEach(function(cat) {
      var items = entry.food[cat];
      if (!Array.isArray(items)) return;
      items.forEach(function(f) {
        var name = (typeof f === 'string' ? f : (f && f.name) || '').trim();
        if (name) recordFrequentOption('foods', unescapeForKey(name), name.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"'), { category: cat });
      });
    });
  }
}

function getOfflineQueue() {
  try {
    return JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
  } catch (e) {
    return [];
  }
}

function addToOfflineQueue(entry) {
  var q = getOfflineQueue();
  q.push(entry);
  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(q));
  } catch (e) {
    console.warn('Offline queue save failed', e);
  }
}

function clearOfflineQueue() {
  try {
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
  } catch (e) {}
}

// Goals & targets (localStorage key rianellGoals)
// Applied only when the user has never saved goals yet.
var DEFAULT_GOALS = { steps: 10000, hydration: 9, sleep: 5, goodDaysPerWeek: 3 };
var GLASS_VOLUME_L = 0.25; // liters per glass (for displaying L next to glasses)

function getGoals() {
  try {
    var raw = localStorage.getItem('rianellGoals');
    if (!raw) return Object.assign({}, DEFAULT_GOALS);
    var g = JSON.parse(raw);
    return { steps: g.steps != null ? g.steps : DEFAULT_GOALS.steps, hydration: g.hydration != null ? g.hydration : DEFAULT_GOALS.hydration, sleep: g.sleep != null ? g.sleep : DEFAULT_GOALS.sleep, goodDaysPerWeek: g.goodDaysPerWeek != null ? g.goodDaysPerWeek : DEFAULT_GOALS.goodDaysPerWeek };
  } catch (e) {
    return Object.assign({}, DEFAULT_GOALS);
  }
}

function saveGoalsFromModal() {
  var steps = parseInt(document.getElementById('goalSteps') && document.getElementById('goalSteps').value, 10) || 0;
  var hydration = parseInt(document.getElementById('goalHydration') && document.getElementById('goalHydration').value, 10) || 0;
  var sleep = parseInt(document.getElementById('goalSleep') && document.getElementById('goalSleep').value, 10) || 0;
  var goodDays = parseInt(document.getElementById('goalGoodDays') && document.getElementById('goalGoodDays').value, 10) || 0;
  var g = { steps: steps, hydration: hydration, sleep: sleep, goodDaysPerWeek: goodDays };
  try {
    localStorage.setItem('rianellGoals', JSON.stringify(g));
    // Push goals to cloud when signed in
    if (typeof cloudSyncState !== 'undefined' && cloudSyncState.isAuthenticated && typeof syncToCloud === 'function') {
      syncToCloud();
    }
  } catch (e) {}
  return g;
}

function openGoalsModal() {
  var overlay = document.getElementById('goalsModalOverlay');
  if (!overlay) return;
  var goals = getGoals();
  var stepsEl = document.getElementById('goalSteps');
  var hydrationEl = document.getElementById('goalHydration');
  var sleepEl = document.getElementById('goalSleep');
  var goodDaysEl = document.getElementById('goalGoodDays');
  if (stepsEl) { stepsEl.value = goals.steps; updateGoalLabel('goalSteps', 'goalStepsLabel', 0, 'steps'); }
  if (hydrationEl) { hydrationEl.value = goals.hydration; updateGoalLabel('goalHydration', 'goalHydrationLabel', 0, 'glasses'); }
  if (sleepEl) { sleepEl.value = goals.sleep; updateGoalLabel('goalSleep', 'goalSleepLabel', 0, 'score'); }
  if (goodDaysEl) { goodDaysEl.value = goals.goodDaysPerWeek; updateGoalLabel('goalGoodDays', 'goalGoodDaysLabel', 0, 'days'); }
  overlay.style.display = 'block';
  overlay.style.visibility = 'visible';
  overlay.style.opacity = '1';
  document.body.classList.add('modal-active');
  document.body.style.overflow = 'hidden';
  overlay.onclick = function(e) { if (e.target === overlay) closeGoalsModal(); };
  var escapeHandler = function(e) { if (e.key === 'Escape') { closeGoalsModal(); document.removeEventListener('keydown', escapeHandler); } };
  document.addEventListener('keydown', escapeHandler);
}

function closeGoalsModal() {
  var overlay = document.getElementById('goalsModalOverlay');
  if (overlay) {
    overlay.style.display = 'none';
    overlay.style.visibility = 'hidden';
    overlay.style.opacity = '0';
    document.body.classList.remove('modal-active');
    document.body.style.overflow = '';
  }
}

function updateGoalLabel(sliderId, labelId, _zeroOff, suffix) {
  var slider = document.getElementById(sliderId);
  var label = document.getElementById(labelId);
  if (!slider || !label) return;
  var val = parseInt(slider.value, 10);
  if (suffix === 'steps') label.textContent = val === 0 ? 'Off' : val.toLocaleString();
  else if (suffix === 'glasses') label.textContent = val === 0 ? 'Off' : String(val) + ' [' + (val * GLASS_VOLUME_L).toFixed(2) + ' L]';
  else if (suffix === 'score') label.textContent = val === 0 ? 'Off' : String(val);
  else if (suffix === 'days') label.textContent = val === 0 ? 'Off' : val + ' days';
}

function saveGoalsAndClose() {
  saveGoalsFromModal();
  closeGoalsModal();
  updateGoalsProgressBlock();
}

function openBugReportModal() {
  var overlay = document.getElementById('bugReportModalOverlay');
  if (!overlay) return;
  overlay.style.display = 'block';
  overlay.style.visibility = 'visible';
  overlay.style.opacity = '1';
  document.body.classList.add('modal-active');
  document.body.style.overflow = 'hidden';
  overlay.onclick = function(e) { if (e.target === overlay) closeBugReportModal(); };
  var escapeHandler = function(e) { if (e.key === 'Escape') { closeBugReportModal(); document.removeEventListener('keydown', escapeHandler); } };
  document.addEventListener('keydown', escapeHandler);
}

function closeBugReportModal() {
  var overlay = document.getElementById('bugReportModalOverlay');
  if (!overlay) return;
  overlay.style.display = 'none';
  overlay.style.visibility = 'hidden';
  overlay.style.opacity = '0';
  document.body.classList.remove('modal-active');
  document.body.style.overflow = '';
}

async function submitBugReport(event) {
  if (event && typeof event.preventDefault === 'function') event.preventDefault();
  var descriptionEl = document.getElementById('bugReportDescription');
  var description = (descriptionEl && descriptionEl.value ? descriptionEl.value.trim() : '');
  if (!description) {
    if (typeof showAlertModal === 'function') showAlertModal('Please enter a bug description.', 'Bug Report');
    return;
  }

  var submitBtn = document.getElementById('bugReportSubmitButton');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
  }

  var payload = {
    title: (document.getElementById('bugReportTitle') && document.getElementById('bugReportTitle').value || '').trim(),
    description: description,
    steps: (document.getElementById('bugReportSteps') && document.getElementById('bugReportSteps').value || '').trim(),
    expected_behavior: (document.getElementById('bugReportExpected') && document.getElementById('bugReportExpected').value || '').trim(),
    actual_behavior: (document.getElementById('bugReportActual') && document.getElementById('bugReportActual').value || '').trim(),
    console_output: getBugReportConsoleOutput(),
    app_theme: (typeof appSettings !== 'undefined' && appSettings && appSettings.globalTheme) ? appSettings.globalTheme : '',
    user_agent: (typeof navigator !== 'undefined' && navigator.userAgent) ? navigator.userAgent : '',
    url: (typeof window !== 'undefined' && window.location) ? window.location.href : '',
    client_timestamp: new Date().toISOString()
  };

  try {
    if (isStaticHost()) throw new Error('Bug report submission is only available when running through the app server.');
    var response = await fetch('/api/bug-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    var data = {};
    try { data = await response.json(); } catch (e) {}
    if (!response.ok) {
      throw new Error(data.error || 'Failed to submit bug report.');
    }
    var form = document.getElementById('bugReportForm');
    if (form && typeof form.reset === 'function') form.reset();
    closeBugReportModal();
    if (typeof showAlertModal === 'function') showAlertModal('Thanks - your bug report was submitted.', 'Bug Report');
  } catch (err) {
    if (typeof showAlertModal === 'function') showAlertModal((err && err.message) ? err.message : 'Bug report submission failed.', 'Bug Report');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit';
    }
  }
}

function getGoodDaysThisWeek() {
  var logs = typeof window !== 'undefined' && window.logs ? window.logs : [];
  var today = new Date();
  var startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  var count = 0;
  var seen = {};
  logs.forEach(function(log) {
    var d = new Date(log.date);
    if (d < startOfWeek || d > today) return;
    if (seen[log.date]) return;
    seen[log.date] = true;
    var noFlare = log.flare !== 'Yes';
    var moodOk = (log.mood != null && parseInt(log.mood, 10) >= 6) || log.mood == null;
    if (noFlare && moodOk) count++;
  });
  return count;
}

function getGoodDaysStreak() {
  var logs = typeof window !== 'undefined' && window.logs ? window.logs : [];
  if (!logs.length) return 0;
  logs.sort(function(a, b) { return new Date(b.date) - new Date(a.date); });
  var streak = 0;
  for (var i = 0; i < logs.length; i++) {
    var log = logs[i];
    var noFlare = log.flare !== 'Yes';
    var moodOk = (log.mood != null && parseInt(log.mood, 10) >= 6) || log.mood == null;
    if (noFlare && moodOk) streak++; else break;
  }
  return streak;
}

function getLogsLast7Days() {
  var logs = typeof window !== 'undefined' && window.logs ? window.logs : [];
  var today = new Date();
  today.setHours(23, 59, 59, 999);
  var sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);
  return logs.filter(function(log) {
    var d = new Date(log.date);
    return d >= sevenDaysAgo && d <= today;
  });
}

function updateGoalsProgressBlock() {
  var block = document.getElementById('goalsProgressBlock');
  if (!block) return;
  var goals = getGoals();
  var hasAny = goals.steps > 0 || goals.hydration > 0 || goals.sleep > 0 || goals.goodDaysPerWeek > 0;
  block.setAttribute('data-has-goals', hasAny ? 'true' : 'false');
  if (!hasAny) {
    block.style.display = 'none';
    block.innerHTML = '';
    return;
  }
  if (typeof appSettings !== 'undefined' && appSettings.aiEnabled === false) {
    block.style.display = 'none';
    return;
  }
  var last7 = getLogsLast7Days();
  var parts = [];

  function insight(met, total, avgPct) {
    if (total === 0) return { cls: '', label: '' };
    if (met >= 6) return { cls: 'on-track', label: 'On track' };
    if (met >= 4) return { cls: 'mixed', label: 'Mixed' };
    if (avgPct >= 100) return { cls: 'on-track', label: 'Avg above target' };
    return { cls: 'below', label: 'Below target' };
  }
  function daysDots(met) {
    var s = '';
    for (var i = 0; i < 7; i++) s += '<span class="goals-dot' + (i < met ? ' filled' : '') + '" aria-hidden="true"></span>';
    return s;
  }

  var rows = [];
  if (goals.steps > 0) {
    var stepsLogs = last7.filter(function(l) { var v = parseInt(l.steps, 10); return !isNaN(v) && v >= 0; });
    var stepsSum = stepsLogs.reduce(function(acc, l) { return acc + parseInt(l.steps, 10); }, 0);
    var stepsAvg = stepsLogs.length ? Math.round(stepsSum / stepsLogs.length) : 0;
    var stepsMet = stepsLogs.filter(function(l) { return parseInt(l.steps, 10) >= goals.steps; }).length;
    var stepsPct = goals.steps > 0 ? Math.min(100, Math.round((stepsAvg / goals.steps) * 100)) : 0;
    var si = insight(stepsMet, 7, goals.steps > 0 ? Math.round((stepsAvg / goals.steps) * 100) : 0);
    rows.push('<div class="goals-metric-row">' +
      '<div class="goals-metric-head"><span class="goals-icon" aria-hidden="true"><i class="fa-solid fa-shoe-prints"></i></span><span class="goals-metric-name">Steps</span><span class="goals-metric-nums">' + stepsAvg.toLocaleString() + ' / ' + goals.steps.toLocaleString() + '</span></div>' +
      '<div class="goals-bar-wrap"><div class="goals-bar-fill" style="width:' + stepsPct + '%"></div></div>' +
      '<div class="goals-meta"><span class="goals-days" title="' + stepsMet + ' of 7 days met">' + daysDots(stepsMet) + '</span><span class="goals-status-pill ' + si.cls + '">' + si.label + '</span></div></div>');
  }
  if (goals.hydration > 0) {
    var hydLogs = last7.filter(function(l) { var v = parseFloat(l.hydration); return v != null && !isNaN(v) && v >= 0; });
    var hydSum = hydLogs.reduce(function(acc, l) { return acc + parseFloat(l.hydration); }, 0);
    var hydAvg = hydLogs.length ? (hydSum / hydLogs.length).toFixed(1) : '0';
    var hydMet = hydLogs.filter(function(l) { return parseFloat(l.hydration) >= goals.hydration; }).length;
    var hydAvgL = (parseFloat(hydAvg) * GLASS_VOLUME_L).toFixed(2);
    var goalL = (goals.hydration * GLASS_VOLUME_L).toFixed(2);
    var hydPct = goals.hydration > 0 ? Math.min(100, Math.round((parseFloat(hydAvg) / goals.hydration) * 100)) : 0;
    var si = insight(hydMet, 7, goals.hydration > 0 ? Math.round((parseFloat(hydAvg) / goals.hydration) * 100) : 0);
    rows.push('<div class="goals-metric-row">' +
      '<div class="goals-metric-head"><span class="goals-icon" aria-hidden="true"><i class="fa-solid fa-droplet"></i></span><span class="goals-metric-name">Hydration</span><span class="goals-metric-nums">' + hydAvg + ' [' + hydAvgL + ' L] / ' + goals.hydration + ' [' + goalL + ' L]</span></div>' +
      '<div class="goals-bar-wrap"><div class="goals-bar-fill" style="width:' + hydPct + '%"></div></div>' +
      '<div class="goals-meta"><span class="goals-days" title="' + hydMet + ' of 7 days met">' + daysDots(hydMet) + '</span><span class="goals-status-pill ' + si.cls + '">' + si.label + '</span></div></div>');
  }
  if (goals.sleep > 0) {
    var sleepLogs = last7.filter(function(l) { var v = parseInt(l.sleep, 10); return !isNaN(v) && v >= 1 && v <= 10; });
    var sleepSum = sleepLogs.reduce(function(acc, l) { return acc + parseInt(l.sleep, 10); }, 0);
    var sleepAvg = sleepLogs.length ? (sleepSum / sleepLogs.length).toFixed(1) : '0';
    var sleepMet = sleepLogs.filter(function(l) { return parseInt(l.sleep, 10) >= goals.sleep; }).length;
    var sleepPct = goals.sleep > 0 ? Math.min(100, Math.round((parseFloat(sleepAvg) / goals.sleep) * 100)) : 0;
    var si = insight(sleepMet, 7, goals.sleep > 0 ? Math.round((parseFloat(sleepAvg) / goals.sleep) * 100) : 0);
    rows.push('<div class="goals-metric-row">' +
      '<div class="goals-metric-head"><span class="goals-icon" aria-hidden="true"><i class="fa-solid fa-moon"></i></span><span class="goals-metric-name">Sleep</span><span class="goals-metric-nums">' + sleepAvg + ' / ' + goals.sleep + '</span></div>' +
      '<div class="goals-bar-wrap"><div class="goals-bar-fill" style="width:' + sleepPct + '%"></div></div>' +
      '<div class="goals-meta"><span class="goals-days" title="' + sleepMet + ' of 7 days met">' + daysDots(sleepMet) + '</span><span class="goals-status-pill ' + si.cls + '">' + si.label + '</span></div></div>');
  }
  if (goals.goodDaysPerWeek > 0) {
    var goodThisWeek = getGoodDaysThisWeek();
    var streak = getGoodDaysStreak();
    var goodCls = goodThisWeek >= goals.goodDaysPerWeek ? 'on-track' : 'below';
    var goodLabel = goodThisWeek >= goals.goodDaysPerWeek ? 'On track' : 'Below target';
    var goodPct = goals.goodDaysPerWeek > 0 ? Math.min(100, Math.round((goodThisWeek / goals.goodDaysPerWeek) * 100)) : 0;
    rows.push('<div class="goals-metric-row">' +
      '<div class="goals-metric-head"><span class="goals-icon" aria-hidden="true"><i class="fa-solid fa-face-smile"></i></span><span class="goals-metric-name">Good days</span><span class="goals-metric-nums">' + goodThisWeek + ' / ' + goals.goodDaysPerWeek + (streak > 0 ? ' · ' + streak + ' in a row' : '') + '</span></div>' +
      '<div class="goals-bar-wrap"><div class="goals-bar-fill" style="width:' + goodPct + '%"></div></div>' +
      '<div class="goals-meta"><span class="goals-status-pill ' + goodCls + '">' + goodLabel + '</span></div></div>');
  }
  if (rows.length === 0) { block.style.display = 'none'; return; }
  block.className = 'goals-progress-block';
  block.innerHTML = '<div class="goals-progress-title">Last 7 days vs targets</div>' + rows.join('');
  block.style.display = 'block';
}

function flushOfflineQueue() {
  if (!navigator.onLine) return;
  var q = getOfflineQueue();
  if (q.length === 0) return;
  try {
    if (typeof syncToCloud === 'function' && typeof cloudSyncState !== 'undefined' && cloudSyncState.isAuthenticated) {
      syncToCloud().catch(function(err) { console.warn('Offline queue sync failed', err); }).then(function() {
        clearOfflineQueue();
        if (typeof renderLogs === 'function') renderLogs();
      });
    } else {
      clearOfflineQueue();
    }
  } catch (e) {
    console.warn('flushOfflineQueue error', e);
  }
}

// Optimized localStorage helper function
function saveLogsToStorage() {
  // Invalidate filtered logs cache and chart results cache
  invalidateFilteredLogsCache();
  invalidateChartResultsCache();
  
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
  if (window.RianellLogsIDB && typeof window.RianellLogsIDB.scheduleMirror === 'function') {
    window.RianellLogsIDB.scheduleMirror(logs);
  }
}

// Load logs - handle both compressed and uncompressed data
let logs = [];
try {
  // Demo mode: skip reading stored logs here; runAppInit regenerates fresh demo data each load
  // (avoids async decompress racing with regenerated demo and keeps dates/variation fresh).
  var demoModeSkipStoredLogs = false;
  try {
    var _earlySettings = localStorage.getItem('rianellSettings');
    if (_earlySettings) demoModeSkipStoredLogs = JSON.parse(_earlySettings).demoMode === true;
  } catch (e) {}
  if (demoModeSkipStoredLogs) {
    logs = [];
    if (typeof window !== 'undefined') {
      window.logs = logs;
    }
  } else {
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

/** Full in-memory health log array (authoritative when synced via saveLogsToStorage). Avoids repeated JSON.parse(localStorage) on hot paths. */
function getAllHistoricalLogsSync() {
  var L = (typeof window !== 'undefined' && window.logs) ? window.logs : logs;
  return Array.isArray(L) ? L : [];
}

/** Chronological copy for training/prediction paths (does not mutate the live array). */
function getAllHistoricalLogsSortedSync() {
  return getAllHistoricalLogsSync().slice().sort(function (a, b) {
    return new Date(a.date) - new Date(b.date);
  });
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
    invalidateChartResultsCache();
  }
}

// Run migration on load
migrateLogs();

/**
 * Build one ECG-like beat (Lead II style): P, PR, Q, sharp R, S, ST, T. Width 100 units; ends on baseline.
 * Randomness is morphology only (amplitude/timing), not baseline drift — beats tile cleanly at x0+100.
 */
function buildEcgBeatSegment(x0, yBase) {
  var r = Math.random;
  var y = yBase;
  var parts = [];
  var L = function (x, yy) {
    parts.push('L' + (Math.round(x * 10) / 10) + ',' + (Math.round(yy * 10) / 10));
  };
  // Isoelectric
  L(x0 + 6, y);
  // P wave
  var pH = 1.2 + r() * 1.6;
  L(x0 + 9, y);
  L(x0 + 11, y - pH);
  L(x0 + 13, y - pH * (0.35 + r() * 0.25));
  L(x0 + 16, y);
  // PR
  L(x0 + 22 + r() * 1.5, y);
  // QRS: Q (small down) → R (sharp up) → S (down) → baseline
  var qx = x0 + 24.5 + r() * 1.2;
  var qy = 31 + r() * 1.8;
  var rPeak = 3 + r() * 6;
  var rNarrow = 0.45 + r() * 0.65;
  var sDepth = 32.5 + r() * 3.5;
  L(qx, y);
  L(qx + 1.4, qy);
  L(qx + 3.2, rPeak);
  L(qx + 3.2 + rNarrow, y - 0.15);
  L(qx + 5.2, sDepth);
  L(qx + 7, y);
  // ST
  L(x0 + 36, y);
  // T wave (rounded, asymmetric)
  var tH = 1.8 + r() * 2.2;
  var tSkew = r() * 4;
  L(x0 + 40, y);
  L(x0 + 42 + tSkew, y - tH * 0.35);
  L(x0 + 46 + tSkew, y - tH);
  L(x0 + 52 + tSkew * 0.5, y - tH * 0.4);
  L(x0 + 58, y);
  L(x0 + 100, y);
  return parts.join(' ');
}

/** Full 400×60 viewBox path: four beats, each with independent random morphology. */
function generateEcgPathD() {
  var base = 30;
  return (
    'M0,' +
    base +
    buildEcgBeatSegment(0, base) +
    buildEcgBeatSegment(100, base) +
    buildEcgBeatSegment(200, base) +
    buildEcgBeatSegment(300, base)
  );
}

var ecgHeartbeatInitialized = false;

/** Randomize ECG trace slightly; respects reduced motion (one static path, no iteration churn). */
function initEcgHeartbeatLine() {
  if (typeof document === 'undefined') return;
  var path = document.querySelector('.heartbeat-path');
  if (!path || ecgHeartbeatInitialized) return;
  var deviceOpts =
    window.PerformanceUtils && typeof window.PerformanceUtils.getDeviceOpts === 'function'
      ? window.PerformanceUtils.getDeviceOpts()
      : { reduceAnimations: false };
  if (deviceOpts.reduceAnimations) {
    path.setAttribute('d', generateEcgPathD());
    ecgHeartbeatInitialized = true;
    return;
  }
  function applyPath() {
    path.setAttribute('d', generateEcgPathD());
  }
  applyPath();
  path.addEventListener(
    'animationiteration',
    function () {
      if (Math.random() < 0.55) applyPath();
    },
    { passive: true }
  );
  ecgHeartbeatInitialized = true;
}

// Function to update heartbeat animation speed based on BPM
function updateHeartbeatAnimation() {
  const heartbeatPath = document.querySelector('.heartbeat-path');
  if (!heartbeatPath) return;
  const deviceOpts = (window.PerformanceUtils && typeof window.PerformanceUtils.getDeviceOpts === 'function')
    ? window.PerformanceUtils.getDeviceOpts() : { reduceAnimations: false };
  if (deviceOpts.reduceAnimations) {
    heartbeatPath.style.animation = 'none';
    return;
  }
  
  // Get the most recent BPM from logs
  if (logs.length === 0) {
    // Default to 72 BPM if no logs exist
    const defaultBPM = 72;
    const duration = Math.max(0.8, Math.min(3.2, (60 / defaultBPM) * 1.6));
    heartbeatPath.style.animationDuration = `${duration}s`;
    return;
  }
  
  // Sort logs by date (most recent first) and get the latest BPM
  const sortedLogs = [...logs].sort((a, b) => new Date(b.date) - new Date(a.date));
  const latestBPM = parseInt(sortedLogs[0].bpm);
  
  if (isNaN(latestBPM) || latestBPM < 30 || latestBPM > 200) {
    // Invalid BPM, use default
    const defaultBPM = 72;
    const duration = Math.max(0.8, Math.min(3.2, (60 / defaultBPM) * 1.6));
    heartbeatPath.style.animationDuration = `${duration}s`;
    return;
  }
  
  // Slower, calmer ECG visual cadence while still reflecting relative BPM.
  const duration = Math.max(0.8, Math.min(3.2, (60 / latestBPM) * 1.6));
  heartbeatPath.style.animationDuration = `${duration}s`;
  
  Logger.debug('Heartbeat animation updated', { bpm: latestBPM, durationSec: duration.toFixed(2) });
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
    
    // Invalidate filtered logs cache and chart results cache
    invalidateFilteredLogsCache();
    invalidateChartResultsCache();
    
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
    
    Logger.debug('Deleted log entry', { date: logDate });
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

// --- Tile picker: mobile-friendly filter (client-side search on chip labels) ---
function createTilePickerSearchEl(inputId, placeholder, ariaLabel) {
  const wrap = document.createElement('div');
  wrap.className = 'tile-picker-search-wrap';
  const label = document.createElement('label');
  label.className = 'visually-hidden';
  label.htmlFor = inputId;
  label.textContent = ariaLabel;
  const input = document.createElement('input');
  input.type = 'search';
  input.id = inputId;
  input.className = 'tile-picker-search';
  input.placeholder = placeholder;
  input.setAttribute('autocomplete', 'off');
  input.setAttribute('enterkeyhint', 'search');
  input.setAttribute('aria-label', ariaLabel);
  wrap.appendChild(label);
  wrap.appendChild(input);
  return wrap;
}

function filterTilePickerScope(scopeEl, query) {
  if (!scopeEl) return;
  const q = (query || '').trim().toLowerCase();
  const groups = scopeEl.querySelectorAll('.food-group, .stressor-group, .symptom-group, .tile-group');
  if (groups.length > 0) {
    groups.forEach(function(group) {
      let any = false;
      group.querySelectorAll('.food-chip, .stressor-chip, .symptom-chip, .exercise-chip, .energy-clarity-chip').forEach(function(btn) {
        const text = (btn.getAttribute('data-search-text') || '').toLowerCase();
        const match = !q || text.indexOf(q) !== -1;
        btn.hidden = !match;
        if (match) any = true;
      });
      group.hidden = !any;
    });
  } else {
    scopeEl.querySelectorAll('.food-chip, .stressor-chip, .symptom-chip, .exercise-chip, .energy-clarity-chip').forEach(function(btn) {
      const text = (btn.getAttribute('data-search-text') || '').toLowerCase();
      const match = !q || text.indexOf(q) !== -1;
      btn.hidden = !match;
    });
  }
  const qTrim = (query || '').trim();
  scopeEl.querySelectorAll('.exercise-category-block').forEach(function(d) {
    if (!qTrim) {
      d.hidden = false;
      return;
    }
    const chips = d.querySelectorAll('.exercise-chip');
    if (chips.length === 0) return;
    let vis = false;
    for (let i = 0; i < chips.length; i++) {
      if (!chips[i].hidden) {
        vis = true;
        break;
      }
    }
    d.hidden = !vis;
  });
}

function attachTilePickerSearch(scopeEl, inputEl) {
  if (!scopeEl || !inputEl) return;
  var debounceTimer = null;
  function run() {
    filterTilePickerScope(scopeEl, inputEl.value);
  }
  inputEl.addEventListener('input', function() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(run, 150);
  });
  inputEl.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      inputEl.value = '';
      filterTilePickerScope(scopeEl, '');
    }
  });
}

/** Corner checkmark for tile pickers (stressors, symptoms, food, exercise, energy, frequent chips). */
function ensurePickerChipCheckEl(btn) {
  if (!btn || btn.querySelector('.picker-chip-check')) return;
  var span = document.createElement('span');
  span.className = 'picker-chip-check';
  span.setAttribute('aria-hidden', 'true');
  btn.appendChild(span);
}

function setPickerChipSelected(btn, selected) {
  if (!btn) return;
  ensurePickerChipCheckEl(btn);
  btn.classList.toggle('picker-chip--selected', !!selected);
  btn.setAttribute('aria-pressed', selected ? 'true' : 'false');
  var check = btn.querySelector('.picker-chip-check');
  if (check) check.innerHTML = selected ? '<i class="fa-solid fa-check" aria-hidden="true"></i>' : '';
}

function itemNamesMatchFood(items, predefinedName) {
  return (items || []).some(function(item) {
    return (typeof item === 'string' ? item : (item && item.name)) === predefinedName;
  });
}

function syncFoodChipsInContainer(containerId, category, isEdit) {
  var items = isEdit ? (editFoodByCategory[category] || []) : (logFormFoodByCategory[category] || []);
  var root = document.getElementById(containerId);
  if (!root) return;
  root.querySelectorAll('.food-chip[data-food-id]').forEach(function(btn) {
    var id = btn.getAttribute('data-food-id');
    var def = PREDEFINED_FOODS.find(function(f) { return f.id === id; });
    setPickerChipSelected(btn, !!(def && itemNamesMatchFood(items, def.name)));
  });
}

function syncFrequentFoodChips() {
  var wrap = document.getElementById('logFoodFrequent');
  if (!wrap) return;
  wrap.querySelectorAll('.food-chip[data-food-id]').forEach(function(btn) {
    var id = btn.getAttribute('data-food-id');
    var cat = btn.getAttribute('data-food-category') || 'breakfast';
    var def = PREDEFINED_FOODS.find(function(f) { return f.id === id; });
    var items = logFormFoodByCategory[cat] || [];
    setPickerChipSelected(btn, !!(def && itemNamesMatchFood(items, def.name)));
  });
}

function syncExerciseChipsInContainer(containerId, isEdit) {
  var items = isEdit ? editExerciseItems : logFormExerciseItems;
  var root = document.getElementById(containerId);
  if (!root) return;
  root.querySelectorAll('.exercise-chip[data-exercise-id]').forEach(function(btn) {
    var id = btn.getAttribute('data-exercise-id');
    var ex = PREDEFINED_EXERCISES.find(function(e) { return e.id === id; });
    setPickerChipSelected(btn, !!(ex && itemNamesMatchFood(items, ex.name)));
  });
}

function syncFrequentExerciseChips() {
  var wrap = document.getElementById('logExerciseFrequent');
  if (!wrap) return;
  wrap.querySelectorAll('.exercise-chip[data-exercise-id]').forEach(function(btn) {
    var id = btn.getAttribute('data-exercise-id');
    var ex = PREDEFINED_EXERCISES.find(function(e) { return e.id === id; });
    setPickerChipSelected(btn, !!(ex && itemNamesMatchFood(logFormExerciseItems, ex.name)));
  });
}

function syncAllEditExerciseChips() {
  if (typeof EXERCISE_CATEGORIES === 'undefined') return;
  EXERCISE_CATEGORIES.forEach(function(cat) {
    syncExerciseChipsInContainer('editExercise' + cat.label + 'Chips', true);
  });
}

function stressorListForPickerContainer(containerId) {
  if (containerId === 'logStressorsTiles') return logFormStressorsItems;
  if (containerId === 'editStressorsTiles') return editStressorsItems;
  return [];
}

function syncStressorTilesVisual(containerId) {
  var list = stressorListForPickerContainer(containerId);
  function run(root) {
    if (!root) return;
    root.querySelectorAll('.stressor-chip[data-value]').forEach(function(btn) {
      var v = btn.getAttribute('data-value');
      setPickerChipSelected(btn, v && list.indexOf(v) !== -1);
    });
  }
  run(document.getElementById(containerId));
  if (containerId === 'logStressorsTiles') run(document.getElementById('logStressorsFrequent'));
}

function symptomListForPickerContainer(containerId) {
  if (containerId === 'logSymptomsTiles') return logFormSymptomsItems;
  if (containerId === 'editSymptomsTiles') return editSymptomsItems;
  return [];
}

function syncSymptomTilesVisual(containerId) {
  var list = symptomListForPickerContainer(containerId);
  function run(root) {
    if (!root) return;
    root.querySelectorAll('.symptom-chip[data-value]').forEach(function(btn) {
      var v = btn.getAttribute('data-value');
      setPickerChipSelected(btn, v && list.indexOf(v) !== -1);
    });
  }
  run(document.getElementById(containerId));
  if (containerId === 'logSymptomsTiles') run(document.getElementById('logSymptomsFrequent'));
}

// Build chip grid for one meal (log form) - grouped by food group, three sections per tile: icon, name, nutrition
function renderFoodChipsForCategory(category, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const mealLabel = category.charAt(0).toUpperCase() + category.slice(1);
  const searchId = 'tileSearch_' + containerId;
  container.innerHTML = '';
  const searchWrap = createTilePickerSearchEl(searchId, 'Filter foods…', 'Filter ' + mealLabel + ' food options');
  container.appendChild(searchWrap);
  FOOD_GROUPS.forEach(grp => {
    const foods = PREDEFINED_FOODS.filter(f => (f.group || 'mixed') === grp.id && (!f.meals || f.meals.length === 0 || f.meals.includes(category)));
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
      btn.setAttribute('data-search-text', (f.name + ' ' + (f.calories || '') + ' ' + (f.protein || '') + ' cal').toLowerCase());
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
  const searchInput = document.getElementById(searchId);
  if (searchInput) attachTilePickerSearch(container, searchInput);
  syncFoodChipsInContainer(containerId, category, false);
}

function renderFrequentFood() {
  var container = document.getElementById('logFoodFrequent');
  if (!container) return;
  var opts = getFrequentOptions('foods');
  container.innerHTML = '';
  if (opts.length === 0) {
    container.style.display = 'none';
    return;
  }
  container.style.display = 'block';
  var label = document.createElement('span');
  label.className = 'frequent-label';
  label.textContent = 'Frequent: ';
  container.appendChild(label);
  opts.forEach(function(o) {
    var predefined = PREDEFINED_FOODS.find(function(f) { return f.name.toLowerCase() === o.key; });
    if (!predefined) return;
    var cat = o.category || 'breakfast';
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'frequent-chip food-chip food-chip--mixed';
    btn.setAttribute('data-food-id', predefined.id);
    btn.setAttribute('data-food-category', cat);
    btn.textContent = o.display;
    btn.title = 'Add ' + o.display + ' to ' + cat;
    btn.addEventListener('click', function() { addLogFoodItem(cat, predefined.id); });
    container.appendChild(btn);
  });
  syncFrequentFoodChips();
}

// Render food items in log entry form (all 4 categories + chip grids)
function renderLogFoodItems() {
  renderFrequentFood();
  renderLogFoodCategoryList('breakfast', 'logFoodBreakfastList');
  renderLogFoodCategoryList('lunch', 'logFoodLunchList');
  renderLogFoodCategoryList('dinner', 'logFoodDinnerList');
  renderLogFoodCategoryList('snack', 'logFoodSnackList');
  renderFoodChipsForCategory('breakfast', 'logFoodBreakfastChips');
  renderFoodChipsForCategory('lunch', 'logFoodLunchChips');
  renderFoodChipsForCategory('dinner', 'logFoodDinnerChips');
  renderFoodChipsForCategory('snack', 'logFoodSnackChips');
}

// Build exercise tile grid for one category (log form) - three sections: icon (top), name (middle), duration (bottom)
function renderExerciseChipsForCategory(category, containerId) {
  const chipsEl = document.getElementById(containerId);
  if (!chipsEl) return;
  const parent = chipsEl.parentElement;
  const searchId = 'tileSearch_' + containerId;
  let searchWrap = parent.querySelector('.tile-picker-search-wrap');
  if (!searchWrap) {
    searchWrap = createTilePickerSearchEl(searchId, 'Filter exercises…', 'Filter exercises in this category');
    parent.insertBefore(searchWrap, chipsEl);
    const inp = document.getElementById(searchId);
    if (inp) attachTilePickerSearch(parent, inp);
  } else {
    const inp = document.getElementById(searchId);
    if (inp) inp.value = '';
  }
  const exercises = PREDEFINED_EXERCISES.filter(e => (e.category || 'cardio') === category);
  chipsEl.innerHTML = '';
  exercises.forEach(ex => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'exercise-chip exercise-chip--' + (ex.category || 'cardio');
    btn.setAttribute('data-exercise-id', ex.id);
    btn.setAttribute('data-search-text', (ex.name + ' ' + ex.defaultDuration + ' min').toLowerCase());
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
    chipsEl.appendChild(btn);
  });
  const inpAfter = document.getElementById(searchId);
  if (inpAfter && inpAfter.value) filterTilePickerScope(parent, inpAfter.value);
  else filterTilePickerScope(parent, '');
  syncExerciseChipsInContainer(containerId, false);
}

// Add exercise item to log entry form (from tile click - uses default duration)
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
  if (duration !== undefined && duration !== '') return `${safeName} - ${duration} min`;
  return safeName;
}

function renderFrequentExercises() {
  var container = document.getElementById('logExerciseFrequent');
  if (!container) return;
  var opts = getFrequentOptions('exercises');
  container.innerHTML = '';
  if (opts.length === 0) {
    container.style.display = 'none';
    return;
  }
  container.style.display = 'block';
  var label = document.createElement('span');
  label.className = 'frequent-label';
  label.textContent = 'Frequent: ';
  container.appendChild(label);
  opts.forEach(function(o) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'frequent-chip exercise-chip';
    btn.setAttribute('data-exercise-id', o.key);
    btn.textContent = o.display;
    btn.title = 'Add ' + o.display;
    btn.addEventListener('click', function() { addLogExerciseItem(o.key); });
    container.appendChild(btn);
  });
  syncFrequentExerciseChips();
}

// Render exercise items in log entry form (list + category tile grids)
function renderLogExerciseItems() {
  renderFrequentExercises();
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
  const root = document.getElementById('energyClarityTiles');
  if (!root) return;
  root.querySelectorAll('.energy-clarity-chip').forEach(tile => {
    var on = tile.getAttribute('data-value') === value;
    tile.classList.toggle('selected', on);
    tile.setAttribute('aria-selected', on ? 'true' : 'false');
    setPickerChipSelected(tile, on);
  });
}

function renderEnergyClarityTiles() {
  const container = document.getElementById('energyClarityTiles');
  const hidden = document.getElementById('energyClarity');
  if (!container) return;
  const currentValue = hidden ? hidden.value : '';
  const ecSearchId = 'tileSearch_energyClarityTiles';
  container.innerHTML = '';
  container.appendChild(createTilePickerSearchEl(ecSearchId, 'Filter options…', 'Filter energy and mental clarity options'));
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
      btn.setAttribute('data-search-text', (opt.label + ' ' + opt.value).toLowerCase());
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
  const ecSearchInput = document.getElementById(ecSearchId);
  if (ecSearchInput) attachTilePickerSearch(container, ecSearchInput);
  const label = document.getElementById('energyClaritySelectedLabel');
  if (label && !label.textContent) label.textContent = currentValue ? currentValue : 'None selected';
  setEnergyClaritySelection(currentValue || '');
}

// Energy & Mental Clarity tile picker (edit modal)
function setEditEnergyClaritySelection(value) {
  const hidden = document.getElementById('editEnergyClarity');
  const label = document.getElementById('editEnergyClaritySelectedLabel');
  if (hidden) hidden.value = value || '';
  if (label) label.textContent = value ? value : 'None selected';
  document.querySelectorAll('#editEnergyClarityTiles .energy-clarity-chip').forEach(tile => {
    var on = tile.getAttribute('data-value') === value;
    tile.classList.toggle('selected', on);
    tile.setAttribute('aria-selected', on ? 'true' : 'false');
    setPickerChipSelected(tile, on);
  });
}

function renderEditEnergyClarityTiles() {
  const container = document.getElementById('editEnergyClarityTiles');
  const hidden = document.getElementById('editEnergyClarity');
  if (!container) return;
  const currentValue = hidden ? hidden.value : '';
  const eecSearchId = 'tileSearch_editEnergyClarityTiles';
  container.innerHTML = '';
  container.appendChild(createTilePickerSearchEl(eecSearchId, 'Filter options…', 'Filter energy and mental clarity options'));
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
      btn.setAttribute('data-search-text', (opt.label + ' ' + opt.value).toLowerCase());
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
  const eecSearchInput = document.getElementById(eecSearchId);
  if (eecSearchInput) attachTilePickerSearch(container, eecSearchInput);
  const label = document.getElementById('editEnergyClaritySelectedLabel');
  if (label) label.textContent = currentValue ? currentValue : 'None selected';
  setEditEnergyClaritySelection(currentValue || '');
}

// Stressor options grouped by category (for coloured tile sections)
const STRESSOR_GROUPS = [
  { id: 'work', label: 'Work & demands', color: 'work' },
  { id: 'relationship', label: 'Relationships', color: 'relationship' },
  { id: 'physical', label: 'Physical', color: 'physical' },
  { id: 'environment', label: 'Environment', color: 'environment' },
  { id: 'emotional', label: 'Emotional & health', color: 'emotional' }
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
  { value: 'Health concern', label: 'Health concern', group: 'emotional' }
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
  'Health concern': 'fa-solid fa-heart-pulse'
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
  { value: 'Bloating', label: 'Bloating', group: 'digestive' },
  { value: 'Breathing difficulty', label: 'Breathing difficulty', group: 'respiratory' },
  { value: 'Cough', label: 'Cough', group: 'respiratory' },
  { value: 'Chest tightness', label: 'Chest tightness', group: 'respiratory' },
  { value: 'Dizziness', label: 'Dizziness', group: 'neurological' },
  { value: 'Headache', label: 'Headache', group: 'neurological' },
  { value: 'Tingling or numbness', label: 'Tingling or numbness', group: 'neurological' },
  { value: 'Migraine', label: 'Migraine', group: 'neurological' },
  { value: 'Fever', label: 'Fever', group: 'systemic' },
  { value: 'Chills', label: 'Chills', group: 'systemic' },
  { value: 'Night sweats', label: 'Night sweats', group: 'systemic' },
  { value: 'Body fatigue', label: 'Body fatigue', group: 'systemic' },
  { value: 'Skin rash', label: 'Skin rash', group: 'skin' },
  { value: 'Eye irritation', label: 'Eye irritation', group: 'skin' },
  { value: 'Dry skin', label: 'Dry skin', group: 'skin' },
  { value: 'Itching', label: 'Itching', group: 'skin' },
  { value: 'Muscle aches', label: 'Muscle aches', group: 'other' },
  { value: 'Other', label: 'Other', group: 'other' }
];

// Symptom value -> Font Awesome 6 icon (square tiles same style as food/stressor)
const SYMPTOM_ICONS = {
  'Nausea': 'fa-solid fa-face-nauseated',
  'Appetite loss': 'fa-solid fa-utensils',
  'Digestive issues': 'fa-solid fa-stomach',
  'Bloating': 'fa-solid fa-stomach',
  'Breathing difficulty': 'fa-solid fa-lungs',
  'Cough': 'fa-solid fa-lungs',
  'Chest tightness': 'fa-solid fa-heart-pulse',
  'Dizziness': 'fa-solid fa-spinner',
  'Headache': 'fa-solid fa-head-side-virus',
  'Tingling or numbness': 'fa-solid fa-hand',
  'Migraine': 'fa-solid fa-head-side-virus',
  'Fever': 'fa-solid fa-temperature-high',
  'Chills': 'fa-solid fa-snowflake',
  'Night sweats': 'fa-solid fa-temperature-high',
  'Body fatigue': 'fa-solid fa-battery-quarter',
  'Skin rash': 'fa-solid fa-hand-sparkles',
  'Eye irritation': 'fa-solid fa-eye',
  'Dry skin': 'fa-solid fa-hand-sparkles',
  'Itching': 'fa-solid fa-hand',
  'Muscle aches': 'fa-solid fa-dumbbell',
  'Other': 'fa-solid fa-ellipsis'
};

// Pain body diagram: region id -> display label (front view; includes joint points as circles)
const PAIN_BODY_REGIONS = [
  { id: 'head', label: 'Head' },
  { id: 'neck', label: 'Neck' },
  { id: 'chest', label: 'Chest' },
  { id: 'abdomen', label: 'Abdomen' },
  { id: 'left_shoulder', label: 'Left shoulder' },
  { id: 'left_upper_arm', label: 'Left upper arm' },
  { id: 'left_elbow', label: 'Left elbow' },
  { id: 'left_forearm', label: 'Left forearm' },
  { id: 'left_wrist', label: 'Left wrist' },
  { id: 'left_hand', label: 'Left hand' },
  { id: 'right_shoulder', label: 'Right shoulder' },
  { id: 'right_upper_arm', label: 'Right upper arm' },
  { id: 'right_elbow', label: 'Right elbow' },
  { id: 'right_forearm', label: 'Right forearm' },
  { id: 'right_wrist', label: 'Right wrist' },
  { id: 'right_hand', label: 'Right hand' },
  { id: 'left_hip', label: 'Left hip' },
  { id: 'left_thigh', label: 'Left thigh' },
  { id: 'left_knee', label: 'Left knee' },
  { id: 'left_lower_leg', label: 'Left lower leg' },
  { id: 'left_ankle', label: 'Left ankle' },
  { id: 'left_foot', label: 'Left foot' },
  { id: 'right_hip', label: 'Right hip' },
  { id: 'right_thigh', label: 'Right thigh' },
  { id: 'right_knee', label: 'Right knee' },
  { id: 'right_lower_leg', label: 'Right lower leg' },
  { id: 'right_ankle', label: 'Right ankle' },
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

/** Tile / frequent chip: toggle membership and refresh list + checkmarks. */
function toggleLogStressorItem(value) {
  if (!value || typeof value !== 'string') return;
  var i = logFormStressorsItems.indexOf(value);
  if (i >= 0) logFormStressorsItems.splice(i, 1);
  else logFormStressorsItems.push(value);
  renderLogStressorsItems();
}

function removeLogStressorItem(index) {
  logFormStressorsItems.splice(index, 1);
  renderLogStressorsItems();
}

function renderStressorTiles(containerId) {
  if (containerId === 'logStressorsTiles') {
    var freqEl = document.getElementById('logStressorsFrequent');
    if (freqEl) {
      var opts = getFrequentOptions('stressors');
      freqEl.innerHTML = '';
      if (opts.length > 0) {
        var label = document.createElement('span');
        label.className = 'frequent-label';
        label.textContent = 'Frequent: ';
        freqEl.appendChild(label);
        opts.forEach(function(o) {
          var btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'frequent-chip stressor-chip stressor-chip--emotional';
          btn.setAttribute('data-value', o.key);
          btn.textContent = o.display;
          btn.addEventListener('click', function() { toggleLogStressorItem(o.key); });
          freqEl.appendChild(btn);
        });
        freqEl.style.display = 'block';
      } else {
        freqEl.style.display = 'none';
      }
    }
  }
  const container = document.getElementById(containerId);
  if (!container) return;
  const searchId = 'tileSearch_' + containerId;
  container.innerHTML = '';
  container.appendChild(createTilePickerSearchEl(searchId, 'Filter stressors…', 'Filter stressors and triggers'));
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
      btn.setAttribute('data-search-text', (opt.label + ' ' + opt.value).toLowerCase());
      btn.title = 'Toggle: ' + opt.label;
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
        if (containerId === 'logStressorsTiles') toggleLogStressorItem(opt.value);
        else toggleEditStressorFromTile(opt.value);
      });
      chipsDiv.appendChild(btn);
    });
    groupDiv.appendChild(chipsDiv);
    container.appendChild(groupDiv);
  });
  const stressSearchInput = document.getElementById(searchId);
  if (stressSearchInput) attachTilePickerSearch(container, stressSearchInput);
  syncStressorTilesVisual(containerId);
}

function renderLogStressorsItems() {
  const container = document.getElementById('logStressorsList');
  if (!container) return;
  
  container.innerHTML = '';
  if (logFormStressorsItems.length === 0) {
    container.innerHTML = '<p class="empty-items">No stressors added yet.</p>';
    syncStressorTilesVisual('logStressorsTiles');
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
  syncStressorTilesVisual('logStressorsTiles');
}

function addLogSymptomItem(value) {
  const toAdd = (typeof value === 'string' ? value : (document.getElementById('logNewSymptomItem')?.value || '').trim());
  if (!toAdd || logFormSymptomsItems.includes(toAdd)) return;
  logFormSymptomsItems.push(toAdd);
  renderLogSymptomsItems();
}

function toggleLogSymptomItem(value) {
  if (!value || typeof value !== 'string') return;
  var i = logFormSymptomsItems.indexOf(value);
  if (i >= 0) logFormSymptomsItems.splice(i, 1);
  else logFormSymptomsItems.push(value);
  renderLogSymptomsItems();
}

function removeLogSymptomItem(index) {
  logFormSymptomsItems.splice(index, 1);
  renderLogSymptomsItems();
}

function renderSymptomTiles(containerId) {
  if (containerId === 'logSymptomsTiles') {
    var freqEl = document.getElementById('logSymptomsFrequent');
    if (freqEl) {
      var opts = getFrequentOptions('symptoms');
      freqEl.innerHTML = '';
      if (opts.length > 0) {
        var label = document.createElement('span');
        label.className = 'frequent-label';
        label.textContent = 'Frequent: ';
        freqEl.appendChild(label);
        opts.forEach(function(o) {
          var btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'frequent-chip symptom-chip symptom-chip--other';
          btn.setAttribute('data-value', o.key);
          btn.textContent = o.display;
          btn.addEventListener('click', function() { toggleLogSymptomItem(o.key); });
          freqEl.appendChild(btn);
        });
        freqEl.style.display = 'block';
      } else {
        freqEl.style.display = 'none';
      }
    }
  }
  const container = document.getElementById(containerId);
  if (!container) return;
  const symSearchId = 'tileSearch_' + containerId;
  container.innerHTML = '';
  container.appendChild(createTilePickerSearchEl(symSearchId, 'Filter symptoms…', 'Filter symptoms'));
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
      btn.setAttribute('data-search-text', (opt.label + ' ' + opt.value).toLowerCase());
      btn.title = 'Toggle: ' + opt.label;
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
        if (containerId === 'logSymptomsTiles') toggleLogSymptomItem(opt.value);
        else toggleEditSymptomFromTile(opt.value);
      });
      chipsDiv.appendChild(btn);
    });
    groupDiv.appendChild(chipsDiv);
    container.appendChild(groupDiv);
  });
  const symSearchInput = document.getElementById(symSearchId);
  if (symSearchInput) attachTilePickerSearch(container, symSearchInput);
  syncSymptomTilesVisual(containerId);
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
  var symTiles = document.getElementById('logSymptomsTiles');
  var hasSymptomTiles = symTiles && symTiles.querySelector('.symptom-chips');
  if (!hasSymptomTiles) renderSymptomTiles('logSymptomsTiles');
  else syncSymptomTilesVisual('logSymptomsTiles');
}

function normalizeMedTimePickerValue(v) {
  if (!v || typeof v !== 'string') return '';
  var t = v.trim();
  if (!/^\d{1,2}:\d{2}$/.test(t)) return '';
  var p = t.split(':');
  var h = parseInt(p[0], 10);
  var m = parseInt(p[1], 10);
  if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) return '';
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
}

function renderMedTimesDraftTags() {
  var wrap = document.getElementById('medTimesDraftTags');
  if (!wrap) return;
  wrap.innerHTML = '';
  medTimesDraftForAdd.forEach(function(t, i) {
    var span = document.createElement('span');
    span.className = 'medication-time-tag';
    span.setAttribute('role', 'listitem');
    span.innerHTML =
      '<span class="medication-time-tag__text">' + escapeHTML(t) + '</span>' +
      '<button type="button" class="medication-time-tag__remove" onclick="removeMedTimeDraftTag(' + i + ')" title="Remove" aria-label="Remove time">×</button>';
    wrap.appendChild(span);
  });
}

function addMedTimeTagFromPicker() {
  var el = document.getElementById('medTimePicker');
  var v = el && el.value ? normalizeMedTimePickerValue(el.value) : '';
  if (!v) return;
  if (medTimesDraftForAdd.indexOf(v) >= 0) return;
  if (medTimesDraftForAdd.length >= 10) return;
  medTimesDraftForAdd.push(v);
  medTimesDraftForAdd.sort();
  renderMedTimesDraftTags();
  if (typeof scheduleLogDraftPersist === 'function') scheduleLogDraftPersist();
}

function removeMedTimeDraftTag(index) {
  if (index < 0 || index >= medTimesDraftForAdd.length) return;
  medTimesDraftForAdd.splice(index, 1);
  renderMedTimesDraftTags();
  if (typeof scheduleLogDraftPersist === 'function') scheduleLogDraftPersist();
}

function clearMedTimesDraft() {
  medTimesDraftForAdd = [];
  var el = document.getElementById('medTimePicker');
  if (el) el.value = '';
  renderMedTimesDraftTags();
  if (typeof scheduleLogDraftPersist === 'function') scheduleLogDraftPersist();
}

function addLogMedicationItem() {
  var nameEl = document.getElementById('medName');
  var takenEl = document.getElementById('medTaken');
  var name = (nameEl && nameEl.value || '').trim();
  if (!name) return;
  var times = medTimesDraftForAdd.slice();
  var taken = takenEl ? takenEl.checked : true;
  logFormMedications.push({ name: name, times: times, taken: taken });
  if (nameEl) nameEl.value = '';
  if (takenEl) takenEl.checked = true;
  clearMedTimesDraft();
  renderLogMedicationsItems();
}

function removeLogMedicationItem(index) {
  logFormMedications.splice(index, 1);
  renderLogMedicationsItems();
}

function toggleLogMedicationTaken(index) {
  if (index < 0 || index >= logFormMedications.length) return;
  logFormMedications[index].taken = !logFormMedications[index].taken;
  renderLogMedicationsItems();
}

function renderFrequentMedications() {
  var container = document.getElementById('logMedicationsFrequent');
  if (!container) return;
  var opts = getFrequentOptions('medications');
  container.innerHTML = '';
  if (opts.length === 0) {
    container.style.display = 'none';
    return;
  }
  container.style.display = 'block';
  var label = document.createElement('span');
  label.className = 'frequent-label';
  label.textContent = 'Frequent: ';
  container.appendChild(label);
  opts.forEach(function(o) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'frequent-chip';
    btn.textContent = o.display;
    btn.title = 'Use ' + o.display;
    btn.addEventListener('click', function() {
      var nameEl = document.getElementById('medName');
      if (nameEl) {
        nameEl.value = o.display;
        nameEl.focus();
      }
    });
    container.appendChild(btn);
  });
}

function renderLogMedicationsItems() {
  renderFrequentMedications();
  renderMedTimesDraftTags();
  var list = document.getElementById('logMedicationsList');
  if (!list) return;
  list.innerHTML = '';
  if (logFormMedications.length === 0) {
    list.innerHTML = '<p class="empty-items">No medications or supplements added yet.</p>';
    return;
  }
  logFormMedications.forEach(function(item, index) {
    var timesLabel = item.times && item.times.length ? item.times.join(', ') : '';
    var div = document.createElement('div');
    div.className = 'medication-card';
    div.innerHTML =
      '<div class="medication-card-info">' +
        '<div class="medication-card-name">' + escapeHTML(item.name) + '</div>' +
        (timesLabel ? '<div class="medication-card-times">' + escapeHTML(timesLabel) + '</div>' : '') +
      '</div>' +
      '<div class="medication-card-actions">' +
        '<button type="button" class="medication-taken-toggle ' + (item.taken ? 'taken' : '') + '" onclick="toggleLogMedicationTaken(' + index + ')" title="' + (item.taken ? 'Mark as not taken' : 'Mark as taken') + '">' +
          (item.taken ? '✓ Taken' : 'Not taken') +
        '</button>' +
        '<button type="button" class="remove-item-btn" onclick="removeLogMedicationItem(' + index + ')" title="Remove">×</button>' +
      '</div>';
    list.appendChild(div);
  });
}

// Edit modal functions for stressors and symptoms
function addEditStressor(value) {
  const toAdd = (typeof value === 'string' ? value : (document.getElementById('editStressorSelect')?.value || '').trim());
  if (!toAdd || editStressorsItems.includes(toAdd)) return;
  editStressorsItems.push(toAdd);
  renderEditStressorsList();
}

function toggleEditStressorFromTile(value) {
  if (!value || typeof value !== 'string') return;
  var i = editStressorsItems.indexOf(value);
  if (i >= 0) editStressorsItems.splice(i, 1);
  else editStressorsItems.push(value);
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
    syncStressorTilesVisual('editStressorsTiles');
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
  syncStressorTilesVisual('editStressorsTiles');
}

function addEditSymptom(value) {
  const toAdd = (typeof value === 'string' ? value : (document.getElementById('editSymptomSelect')?.value || '').trim());
  if (!toAdd || editSymptomsItems.includes(toAdd)) return;
  editSymptomsItems.push(toAdd);
  renderEditSymptomsList();
}

function toggleEditSymptomFromTile(value) {
  if (!value || typeof value !== 'string') return;
  var i = editSymptomsItems.indexOf(value);
  if (i >= 0) editSymptomsItems.splice(i, 1);
  else editSymptomsItems.push(value);
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
    syncSymptomTilesVisual('editSymptomsTiles');
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
  syncSymptomTilesVisual('editSymptomsTiles');
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
  var cap = category.charAt(0).toUpperCase() + category.slice(1);
  syncFoodChipsInContainer('editFood' + cap + 'Chips', category, true);
}

function renderEditFoodChipsForCategory(category, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  FOOD_GROUPS.forEach(grp => {
    const foods = PREDEFINED_FOODS.filter(f => (f.group || 'mixed') === grp.id && (!f.meals || f.meals.length === 0 || f.meals.includes(category)));
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
  syncFoodChipsInContainer(containerId, category, true);
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
  syncAllEditExerciseChips();
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
  syncExerciseChipsInContainer(containerId, true);
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
  if (!overlay) {
    Logger.error('Food modal overlay not found');
    return;
  }
  const modalContent = overlay.querySelector('.modal-content');
  if (!modalContent) {
    Logger.error('Food modal content not found');
    return;
  }
  
  // Move modal to body if it's not already there (ensures viewport-relative positioning)
  if (overlay.parentElement !== document.body) {
    document.body.appendChild(overlay);
  }
  
  // Reset overlay scroll position (not page scroll - keep user's current view)
  overlay.scrollTop = 0;
  
  // Ensure overlay is fixed to viewport and visible (CSS .modal-overlay defaults to opacity: 0)
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
    visibility: visible !important;
    opacity: 1 !important;
    z-index: 10000 !important;
    overflow: hidden !important;
    background: rgba(0,0,0,0.4);
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
  requestAnimationFrame(function() {
    if (overlay && modalContent) {
      overlay.style.cssText = overlay.style.cssText;
      modalContent.style.cssText = modalContent.style.cssText;
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
  // Escape to close
  window._foodModalEscapeHandler = function(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      document.removeEventListener('keydown', window._foodModalEscapeHandler);
      window._foodModalEscapeHandler = null;
      closeFoodModal();
    }
  };
  document.addEventListener('keydown', window._foodModalEscapeHandler);
}

function closeFoodModal() {
  if (typeof closeTilePickerSheet === 'function') closeTilePickerSheet();
  if (window._foodModalEscapeHandler) {
    document.removeEventListener('keydown', window._foodModalEscapeHandler);
    window._foodModalEscapeHandler = null;
  }
  Logger.debug('Food modal closed', { date: currentEditingDate });
  const overlay = document.getElementById('foodModalOverlay');
  if (overlay) overlay.style.display = 'none';
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
      const foods = PREDEFINED_FOODS.filter(f => (f.group || 'mixed') === grp.id && (!f.meals || f.meals.length === 0 || f.meals.includes(cat)));
      if (foods.length === 0) return '';
      const chipsHtml = foods.map(f => {
        const iconClass = FOOD_ICONS[f.id] || 'fa-solid fa-utensils';
        const groupClass = 'food-chip--' + (f.group || 'mixed');
        return `<button type="button" class="food-chip ${groupClass}" data-food-id="${escapeHTML(f.id)}" title="Add ${escapeHTML(f.name)}, ${f.calories} cal to ${labels[cat]}" onclick="addFoodItemModal('${cat}', '${escapeHTML(f.id)}')"><span class="food-chip-icon"><i class="${iconClass}" aria-hidden="true"></i></span><span class="food-chip-name">${escapeHTML(f.name)}</span><span class="food-chip-nutrition">${f.calories} cal · ${f.protein}g P</span></button>`;
      }).join('');
      return `<div class="food-group" data-group="${escapeHTML(grp.id)}"><div class="food-group__title">${escapeHTML(grp.label)}</div><div class="food-chips">${chipsHtml}</div></div>`;
    }).join('');
    return `
    <div class="food-category-block food-meal-collapsible">
      <button type="button" class="food-category-summary tile-picker-trigger" aria-expanded="false" aria-controls="tilePickerSheet"><span class="food-meal-label">${labels[cat]}</span><span class="food-meal-arrow" aria-hidden="true">▶</span></button>
      <div class="tile-picker-slot">
        <div class="tile-picker-anchor">
          <div class="food-category-body">
            <div id="${listId}" class="items-list" style="min-height: 24px;">${itemsHtml}</div>
            <div class="food-tiles-by-group" style="margin-top: 8px;">${groupsHtml}</div>
          </div>
        </div>
      </div>
    </div>`;
  }).join('');
  /* Direct listeners: modal .modal-content uses stopPropagation so delegated body handlers are unreliable */
  container.querySelectorAll('.food-category-summary.tile-picker-trigger').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (typeof openTilePickerSheet === 'function') openTilePickerSheet(btn);
    });
  });
  // Keep food card selection badges in sync while editing an existing log.
  container.querySelectorAll('.food-chip[data-food-id]').forEach(function(btn) {
    var id = btn.getAttribute('data-food-id');
    var predefined = PREDEFINED_FOODS.find(function(f) { return f.id === id; });
    var selected = false;
    if (predefined) {
      selected = ['breakfast', 'lunch', 'dinner', 'snack'].some(function(cat) {
        return itemNamesMatchFood(currentFoodByCategory[cat] || [], predefined.name);
      });
    }
    setPickerChipSelected(btn, selected);
  });
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
      const isSorted = currentSortOrder === 'oldest';
      
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
  if (!overlay) {
    Logger.error('Exercise modal overlay not found');
    return;
  }
  const modalContent = overlay.querySelector('.modal-content');
  if (!modalContent) {
    Logger.error('Exercise modal content not found');
    return;
  }
  
  // Move modal to body if it's not already there (ensures viewport-relative positioning)
  if (overlay.parentElement !== document.body) {
    document.body.appendChild(overlay);
  }
  
  // Reset overlay scroll position (not page scroll - keep user's current view)
  overlay.scrollTop = 0;
  
  // Ensure overlay is fixed to viewport and visible (CSS .modal-overlay defaults to opacity: 0)
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
    visibility: visible !important;
    opacity: 1 !important;
    z-index: 10000 !important;
    overflow: hidden !important;
    background: rgba(0,0,0,0.4);
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
  requestAnimationFrame(function() {
    if (overlay && modalContent) {
      overlay.style.cssText = overlay.style.cssText;
      modalContent.style.cssText = modalContent.style.cssText;
    }
  });
  
  // Focus first focusable in modal (e.g. close button or first chip)
  const firstFocusable = modalContent ? modalContent.querySelector('button.modal-close, .exercise-chip') : null;
  if (firstFocusable) firstFocusable.focus();
  // Close on overlay click
  overlay.onclick = function(e) {
    if (e.target === overlay) {
      closeExerciseModal();
    }
  };
  // Escape to close
  window._exerciseModalEscapeHandler = function(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      document.removeEventListener('keydown', window._exerciseModalEscapeHandler);
      window._exerciseModalEscapeHandler = null;
      closeExerciseModal();
    }
  };
  document.addEventListener('keydown', window._exerciseModalEscapeHandler);
}

// Expose modals globally so inline onclick and delegated handlers work reliably (e.g. food/exercise icons on log entries)
if (typeof window !== 'undefined') {
  window.openFoodModal = openFoodModal;
  window.openExerciseModal = openExerciseModal;
}

function closeExerciseModal() {
  if (typeof closeTilePickerSheet === 'function') closeTilePickerSheet();
  if (window._exerciseModalEscapeHandler) {
    document.removeEventListener('keydown', window._exerciseModalEscapeHandler);
    window._exerciseModalEscapeHandler = null;
  }
  Logger.debug('Exercise modal closed', { date: currentEditingDate });
  const overlay = document.getElementById('exerciseModalOverlay');
  if (overlay) overlay.style.display = 'none';
  document.body.classList.remove('modal-active');
  document.body.style.overflow = '';
  currentEditingDate = null;
  currentExerciseItems = [];
}

// Add exercise in modal (by tile click - uses default duration)
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
      const searchAttr = escapeHTML((ex.name + ' ' + ex.defaultDuration + ' min').toLowerCase());
      return `<button type="button" class="exercise-chip ${groupClass}" data-exercise-id="${escapeHTML(ex.id)}" data-search-text="${searchAttr}" title="Add ${escapeHTML(ex.name)}, ${ex.defaultDuration} min" onclick="addExerciseItem('${escapeHTML(ex.id)}')"><span class="exercise-chip-icon"><i class="${iconClass}" aria-hidden="true"></i></span><span class="exercise-chip-name">${escapeHTML(ex.name)}</span><span class="exercise-chip-duration">${ex.defaultDuration} min</span></button>`;
    }).join('');
    return `
    <div class="exercise-category-block exercise-meal-collapsible">
      <button type="button" class="exercise-category-summary tile-picker-trigger" aria-expanded="false" aria-controls="tilePickerSheet"><span class="exercise-meal-label">${escapeHTML(cat.label)}</span><span class="exercise-meal-arrow" aria-hidden="true">▶</span></button>
      <div class="tile-picker-slot">
        <div class="tile-picker-anchor">
          <div class="exercise-category-body">
            <div class="exercise-chips">${chipsHtml}</div>
          </div>
        </div>
      </div>
    </div>`;
  }).join('');
  list.innerHTML = `
    <div class="tile-picker-search-wrap">
      <label class="visually-hidden" for="exerciseModalTileSearch">Filter exercises</label>
      <input type="search" class="tile-picker-search" id="exerciseModalTileSearch" placeholder="Filter exercises…" autocomplete="off" aria-label="Filter exercises" />
    </div>
    <div class="items-list" style="min-height: 24px; margin-bottom: 12px;">${itemsHtml}</div>
    ${categoryBlocks}
  `;
  const modalExSearch = document.getElementById('exerciseModalTileSearch');
  if (modalExSearch) attachTilePickerSearch(list, modalExSearch);
  list.querySelectorAll('.exercise-category-summary.tile-picker-trigger').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (typeof openTilePickerSheet === 'function') openTilePickerSheet(btn);
    });
  });
  // Keep exercise card selection badges in sync while editing an existing log.
  list.querySelectorAll('.exercise-chip[data-exercise-id]').forEach(function(btn) {
    var id = btn.getAttribute('data-exercise-id');
    var ex = PREDEFINED_EXERCISES.find(function(e) { return e.id === id; });
    setPickerChipSelected(btn, !!(ex && itemNamesMatchFood(currentExerciseItems, ex.name)));
  });
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
      const isSorted = currentSortOrder === 'oldest';
      
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
  // Escape to close
  window._editEntryModalEscapeHandler = function(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      document.removeEventListener('keydown', window._editEntryModalEscapeHandler);
      window._editEntryModalEscapeHandler = null;
      closeEditEntryModal();
    }
  };
  document.addEventListener('keydown', window._editEntryModalEscapeHandler);
}

function closeEditEntryModal() {
  if (typeof closeTilePickerSheet === 'function') closeTilePickerSheet();
  if (window._editEntryModalEscapeHandler) {
    document.removeEventListener('keydown', window._editEntryModalEscapeHandler);
    window._editEntryModalEscapeHandler = null;
  }
  Logger.debug('Edit entry modal closed', { date: editingEntryDate });
  const overlay = document.getElementById('editEntryModalOverlay');
  if (overlay) overlay.style.display = 'none';
  document.body.classList.remove('modal-active');
  document.body.style.overflow = '';
  editingEntryDate = null;
}

// Inline editing functions
function enableInlineEdit(logDate) {
  if (!logDate) {
    Logger.error('enableInlineEdit: logDate is required');
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
    const isSorted = currentSortOrder === 'oldest';
    
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
    const isSorted = currentSortOrder === 'oldest';
    
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
      <div class="log-entry-actions-left">
        <button class="delete-btn" onclick="event.stopPropagation(); deleteLogEntry('${escapeHTML(log.date)}')" title="Delete this entry">&times;</button>
        ${editButton}
      </div>
      <button class="share-btn" onclick="event.stopPropagation(); openShareModalForLog('${safeDate}')" title="Share this entry" aria-label="Share this entry"><i class="fa-solid fa-share" aria-hidden="true"></i></button>
    </div>
    <div class="log-entry-header-collapsible" onclick="toggleLogEntry('${escapeHTML(log.date)}')">
      <div class="log-entry-header-content">
        ${isEditing 
          ? `<input type="date" class="inline-edit-date" value="${log.date}" onclick="event.stopPropagation();" style="font-size: 1.2rem; padding: 5px; border-radius: 8px; border: 1px solid rgba(76, 175, 80, 0.5); background: rgba(0,0,0,0.3); color: #e0f2f1; width: auto; max-width: 200px; margin-right: 20px;" />`
          : `<h3 class="log-date">${formattedDate}</h3>`
        }
        <div class="header-badges">
          <button class="header-icon-btn food-btn" onclick="event.stopPropagation(); if(window.openFoodModal) window.openFoodModal('${escapeHTML(log.date)}')" title="Food Log ${foodCount > 0 ? `(${foodCount} items)` : ''}">
            🍽️${foodCount > 0 ? `<span class="badge-count">${foodCount}</span>` : ''}
          </button>
          <button class="header-icon-btn exercise-btn" onclick="event.stopPropagation(); if(window.openExerciseModal) window.openExerciseModal('${escapeHTML(log.date)}')" title="Exercise Log ${exerciseCount > 0 ? `(${exerciseCount} items)` : ''}">
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
      <div class="metric-group energy-cognitive">
        <h4 class="metric-group-title">⚡ Energy & Mental Clarity</h4>
        <div class="metric-item">
          <span class="metric-label">🧠 Energy/Clarity</span>
          ${isEditing 
            ? `<input type="text" class="inline-edit-energyClarity" value="${escapeHTML(log.energyClarity || '')}" maxlength="50" style="flex: 1; max-width: 200px; padding: 4px 8px; border-radius: 6px; border: 1px solid rgba(76, 175, 80, 0.5); background: rgba(0,0,0,0.3); color: #e0f2f1; margin-left: 12px;" />`
            : `<span class="metric-value">${log.energyClarity ? escapeHTML(log.energyClarity) : '-'}</span>`
          }
        </div>
        <div class="metric-item">
          <span class="metric-label">🌤️ Weather Sensitivity</span>
          ${isEditing 
            ? `<span style="display: flex; align-items: center; gap: 4px; margin-left: auto;"><input type="number" class="inline-edit-weatherSensitivity" value="${log.weatherSensitivity || ''}" min="0" max="10" placeholder="-" style="width: 60px; padding: 4px 8px; border-radius: 6px; border: 1px solid rgba(76, 175, 80, 0.5); background: rgba(0,0,0,0.3); color: #e0f2f1; text-align: center;" /><span style="color: #b0bec5; font-size: 0.9rem;">/10</span></span>`
            : `<span class="metric-value">${log.weatherSensitivity !== undefined && log.weatherSensitivity !== '' && log.weatherSensitivity != null ? log.weatherSensitivity + '/10' : '-'}</span>`
          }
        </div>
      </div>
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
      <div class="metric-group food-log">
        <h4 class="metric-group-title">🍽️ Food Log</h4>
        ${getAllFoodItems(log).length > 0 ? formatFoodLogForView(log) : `<div class="metric-item"><span class="metric-label">Items</span><span class="metric-value metric-value-muted">None logged</span></div>`}
      </div>
      <div class="metric-group exercise-log">
        <h4 class="metric-group-title">🏃 Exercise Log</h4>
        <div class="metric-item">
          <span class="metric-label">Activities</span>
          ${(log.exercise && log.exercise.length > 0)
            ? `<span class="metric-value metric-value-list">${log.exercise.map(item => escapeHTML(formatExerciseDisplay(item))).join('; ')}</span>`
            : `<span class="metric-value metric-value-muted">None logged</span>`
          }
        </div>
      </div>
      <div class="metric-group stress-triggers">
        <h4 class="metric-group-title">😰 Stress & Triggers</h4>
        <div class="metric-item">
          <span class="metric-label">💥 Stressors</span>
          <span class="metric-value">${(log.stressors && log.stressors.length > 0) ? log.stressors.map(s => escapeHTML(s)).join(', ') : '-'}</span>
        </div>
      </div>
      <div class="metric-group additional-symptoms">
        <h4 class="metric-group-title">💉 Additional Symptoms</h4>
        <div class="metric-item">
          <span class="metric-label">Symptoms</span>
          <span class="metric-value">${(log.symptoms && log.symptoms.length > 0) ? log.symptoms.map(s => escapeHTML(s)).join(', ') : '-'}</span>
        </div>
        <div class="metric-item">
          <span class="metric-label">📍 Pain Location</span>
          ${isEditing 
            ? `<input type="text" class="inline-edit-painLocation" value="${escapeHTML(log.painLocation || '')}" maxlength="150" style="flex: 1; max-width: 250px; padding: 4px 8px; border-radius: 6px; border: 1px solid rgba(76, 175, 80, 0.5); background: rgba(0,0,0,0.3); color: #e0f2f1; margin-left: 12px;" />`
            : `<span class="metric-value">${log.painLocation ? escapeHTML(log.painLocation) : '-'}</span>`
          }
        </div>
      </div>
      <div class="metric-group medications-log">
        <h4 class="metric-group-title">💊 Medication / Supplements</h4>
        <div class="metric-item">
          <span class="metric-label">Items</span>
          ${(log.medications && log.medications.length > 0)
            ? `<span class="metric-value metric-value-list">${log.medications.map(m => escapeHTML(m.name) + (m.times && m.times.length ? ' (' + m.times.join(', ') + ')' : '') + ' – ' + (m.taken ? 'Taken' : 'Not taken')).join('; ')}</span>`
            : `<span class="metric-value metric-value-muted">None logged</span>`
          }
        </div>
      </div>
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

// Build a single log entry DOM element (shared by chunked and non-chunked render)
function buildLogEntryElement(log) {
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
  return div;
}

// Chunk sizes for mobile-friendly rendering (avoid long main-thread blocks)
var LOG_RENDER_CHUNK_THRESHOLD = 30;
var LOG_RENDER_CHUNK_SIZE = 20;
var LOG_VIRTUAL_THRESHOLD = 120;
var LOG_VIRTUAL_INITIAL = 45;
var LOG_VIRTUAL_APPEND = 35;

// Shared render function to reduce code duplication (optimized). Uses chunking on large lists for mobile.
function renderLogEntries(logsToRender) {
  const outputEl = window.PerformanceUtils?.DOMCache?.getElement('logOutput') || document.getElementById('logOutput');
  if (!outputEl) return;
  if (outputEl._logVirtualObserver && typeof outputEl._logVirtualObserver.disconnect === 'function') {
    outputEl._logVirtualObserver.disconnect();
    outputEl._logVirtualObserver = null;
  }
  if (!Array.isArray(logsToRender) || logsToRender.length === 0) {
    const allLogs = (typeof window !== 'undefined' && Array.isArray(window.logs)) ? window.logs : logs;
    const hasAnyLogs = Array.isArray(allLogs) && allLogs.length > 0;
    outputEl.innerHTML = hasAnyLogs
      ? '<p class="empty-items">No logs in this range. Try another range or add a new entry with the + button.</p>'
      : '<p class="empty-items">No logs yet. Add your first entry with the + button.</p>';
    return;
  }
  const deviceOpts = (window.PerformanceUtils && typeof window.PerformanceUtils.getDeviceOpts === 'function')
    ? window.PerformanceUtils.getDeviceOpts() : { reduceAnimations: false, maxChartPoints: 200, deferAI: false, batchDOM: false };
  var isLow = typeof window.PerformanceUtils !== 'undefined' && window.PerformanceUtils.platform && window.PerformanceUtils.platform.deviceClass === 'low';
  var threshold = isLow ? 20 : LOG_RENDER_CHUNK_THRESHOLD;
  var chunkSize = isLow ? 15 : LOG_RENDER_CHUNK_SIZE;
  var useChunking = logsToRender.length > threshold;

  if (logsToRender.length > LOG_VIRTUAL_THRESHOLD && typeof IntersectionObserver !== 'undefined') {
    outputEl.innerHTML = '';
    var vIndex = 0;
    var vInitial = Math.min(LOG_VIRTUAL_INITIAL, logsToRender.length);
    var fragV = document.createDocumentFragment();
    for (var vi = 0; vi < vInitial; vi++) {
      fragV.appendChild(buildLogEntryElement(logsToRender[vi]));
    }
    outputEl.appendChild(fragV);
    vIndex = vInitial;
    var sentinel = document.createElement('div');
    sentinel.className = 'log-virtual-sentinel';
    sentinel.setAttribute('aria-hidden', 'true');
    sentinel.style.cssText = 'height:1px;margin:0;padding:0;';
    outputEl.appendChild(sentinel);
    var scrollRoot = outputEl.closest('.tab-content') || outputEl.parentElement || null;
    var io = new IntersectionObserver(function (entries) {
      for (var e = 0; e < entries.length; e++) {
        if (!entries[e].isIntersecting) continue;
        if (vIndex >= logsToRender.length) {
          if (sentinel.parentNode) sentinel.parentNode.removeChild(sentinel);
          io.disconnect();
          outputEl._logVirtualObserver = null;
          return;
        }
        var nextEnd = Math.min(vIndex + LOG_VIRTUAL_APPEND, logsToRender.length);
        var frag2 = document.createDocumentFragment();
        for (var j = vIndex; j < nextEnd; j++) {
          frag2.appendChild(buildLogEntryElement(logsToRender[j]));
        }
        outputEl.insertBefore(frag2, sentinel);
        vIndex = nextEnd;
        if (vIndex >= logsToRender.length && sentinel.parentNode) {
          sentinel.parentNode.removeChild(sentinel);
          io.disconnect();
          outputEl._logVirtualObserver = null;
        }
      }
    }, { root: scrollRoot, rootMargin: '200px', threshold: 0 });
    outputEl._logVirtualObserver = io;
    io.observe(sentinel);
    return;
  }

  if (useChunking) {
    outputEl.innerHTML = '';
    var index = 0;
    function renderNextChunk() {
      var end = Math.min(index + chunkSize, logsToRender.length);
      var fragment = document.createDocumentFragment();
      for (var i = index; i < end; i++) {
        fragment.appendChild(buildLogEntryElement(logsToRender[i]));
      }
      outputEl.appendChild(fragment);
      index = end;
      if (index < logsToRender.length) {
        requestAnimationFrame(renderNextChunk);
      }
    }
    requestAnimationFrame(renderNextChunk);
    return;
  }

  if (deviceOpts.batchDOM && window.PerformanceUtils?.domBatcher) {
    window.PerformanceUtils.domBatcher.schedule(function() {
      var fragment = document.createDocumentFragment();
      outputEl.innerHTML = "";
      for (var i = 0; i < logsToRender.length; i++) {
        fragment.appendChild(buildLogEntryElement(logsToRender[i]));
      }
      outputEl.appendChild(fragment);
    });
  } else {
    requestAnimationFrame(function() {
      var fragment = document.createDocumentFragment();
      outputEl.innerHTML = "";
      for (var i = 0; i < logsToRender.length; i++) {
        fragment.appendChild(buildLogEntryElement(logsToRender[i]));
      }
      outputEl.appendChild(fragment);
    });
  }
}

function renderLogs() {
  // Ensure we're using the most up-to-date logs array
  const currentLogs = (typeof window !== 'undefined' && window.logs) ? window.logs : logs;
  if (!Array.isArray(currentLogs)) {
    Logger.warn('renderLogs: logs is not an array', { type: typeof currentLogs });
    renderLogEntries([]);
    return;
  }
  renderLogEntries(currentLogs);
}

// Chart date range filter state (default 30 so demo/older data is visible; 7 often has no data)
let chartDateRange = {
  type: 30, // 1 (Today), 7, 30, 90, or 'custom'
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
  var _gfT0 = Date.now();
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
  perfLog('Data getFilteredLogs (cache miss)', Date.now() - _gfT0, { logsLen: logs.length, resultLen: sorted.length });
  return sorted;
}

// Invalidate filtered logs cache when logs change
function invalidateFilteredLogsCache() {
  _filteredLogsCache = null;
  _filteredLogsCacheKey = null;
  invalidateAIAnalysisCache();
}

function invalidateAIAnalysisCache() {
  window._aiAnalysisCache = null;
  window._aiAnalysisCacheMap = Object.create(null);
}

// ---- Chart results cache (precomputed View x Prediction for quick switch) ----
const CHART_RESULTS_CACHE_MAX = 32;
const _chartResultsCache = new Map();
let _chartResultsCacheOrder = [];

function getChartViewCacheKey(type, startDate, endDate) {
  return (type != null ? String(type) : '') + '_' + (startDate || '') + '_' + (endDate || '');
}

function getChartResultsCacheKey(viewKey, predRange, logsLength) {
  return viewKey + '_' + (predRange != null ? predRange : 7) + '_' + (logsLength != null ? logsLength : 0);
}

function getFilteredLogsForView(logsArray, viewType, viewStartDate, viewEndDate) {
  if (!logsArray || logsArray.length === 0) return [];
  let filtered = [...logsArray];
  if (viewStartDate && viewEndDate) {
    const start = new Date(viewStartDate);
    const end = new Date(viewEndDate);
    end.setHours(23, 59, 59, 999);
    start.setHours(0, 0, 0, 0);
    filtered = filtered.filter(log => {
      const logDate = new Date(log.date);
      return logDate >= start && logDate <= end;
    });
  } else if (viewType === 'custom') {
    return filtered;
  } else {
    const days = viewType;
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);
    filtered = filtered.filter(log => {
      const logDate = new Date(log.date);
      return logDate >= startDate && logDate <= endDate;
    });
  }
  return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
}

function getChartResultsCache(viewKey, predRange, logsLength) {
  const key = getChartResultsCacheKey(viewKey, predRange, logsLength);
  const entry = _chartResultsCache.get(key);
  if (entry) {
    const idx = _chartResultsCacheOrder.indexOf(key);
    if (idx > 0) {
      _chartResultsCacheOrder.splice(idx, 1);
      _chartResultsCacheOrder.unshift(key);
    }
    return entry;
  }
  return null;
}

function setChartResultsCache(viewKey, predRange, logsLength, value) {
  const key = getChartResultsCacheKey(viewKey, predRange, logsLength);
  if (_chartResultsCache.size >= CHART_RESULTS_CACHE_MAX && !_chartResultsCache.has(key)) {
    const oldest = _chartResultsCacheOrder.pop();
    if (oldest != null) _chartResultsCache.delete(oldest);
  }
  _chartResultsCache.set(key, value);
  const idx = _chartResultsCacheOrder.indexOf(key);
  if (idx >= 0) _chartResultsCacheOrder.splice(idx, 1);
  _chartResultsCacheOrder.unshift(key);
}

function invalidateChartResultsCache() {
  _chartResultsCache.clear();
  _chartResultsCacheOrder.length = 0;
}

function precomputeChartResultsForFixedRanges() {
  if (!logs || logs.length < 2 || !window.AIEngine || typeof analyzeHealthMetrics !== 'function') return;
  if (window._chartPrecomputeRunning) return;
  const aiOn = typeof appSettings !== 'undefined' && appSettings.aiEnabled !== false;
  if (!aiOn) return;
  window._chartPrecomputeRunning = true;
  const viewTypes = [1, 7, 30, 90];
  const predRanges = [1, 7, 30, 90];
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  let index = 0;
  const total = viewTypes.length * predRanges.length;
  async function runOne() {
    if (index >= total) {
      window._chartPrecomputeRunning = false;
      return;
    }
    const vi = Math.floor(index / predRanges.length);
    const pi = index % predRanges.length;
    index += 1;
    const viewType = viewTypes[vi];
    const predRange = predRanges[pi];
    const viewStart = viewType === 1 ? todayStr : null;
    const viewEnd = viewType === 1 ? todayStr : null;
    const viewKey = getChartViewCacheKey(viewType, viewStart, viewEnd);
    if (getChartResultsCache(viewKey, predRange, logs.length)) {
      runNext();
      return;
    }
    const filtered = getFilteredLogsForView(logs, viewType, viewStart, viewEnd);
    if (filtered.length < 2) {
      runNext();
      return;
    }
    const sortedLogs = [...filtered].sort((a, b) => new Date(a.date) - new Date(b.date));
    const allHistoricalLogs = getAllHistoricalLogsSortedSync();
    let anonymizedTrainingData = [];
    if (appSettings.useOpenData && appSettings.medicalCondition && typeof window.getAnonymizedTrainingData === 'function') {
      try {
        const data = await Promise.resolve(window.getAnonymizedTrainingData(appSettings.medicalCondition));
        anonymizedTrainingData = Array.isArray(data) ? data : [];
      } catch (e) {
        anonymizedTrainingData = [];
      }
    }
    const combinedTrainingLogs = anonymizedTrainingData.length > 0
      ? [...allHistoricalLogs, ...anonymizedTrainingData]
      : allHistoricalLogs;
    try {
      const analysis = await analyzeHealthMetrics(sortedLogs, combinedTrainingLogs);
      const lastDate = sortedLogs.length > 0 ? new Date(sortedLogs[sortedLogs.length - 1].date) : null;
      setChartResultsCache(viewKey, predRange, logs.length, {
        analysis,
        sortedLogs,
        filteredLogs: filtered,
        daysToPredict: predRange,
        lastDate,
        allLogsLength: combinedTrainingLogs.length
      });
    } catch (e) { /* ignore */ }
    runNext();
  }
  function runNext() {
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      setTimeout(function () { runOne(); }, 2000);
      return;
    }
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(function() { runOne(); }, { timeout: 400 });
    } else {
      setTimeout(function() { runOne(); }, 80);
    }
  }
  runNext();
}

var _schedulePrecomputeChartTimer = null;
function schedulePrecomputeChartResults() {
  if (!logs || logs.length < 2) return;
  const profile = window.PerformanceUtils && window.PerformanceUtils.getOptimizationProfile ? window.PerformanceUtils.getOptimizationProfile() : null;
  if (profile && profile.enableChartPreload === false) return;
  const staggerMs = (profile && profile.chartPreloadDelayMs != null) ? profile.chartPreloadDelayMs + 500 : 2000;
  function start() {
    precomputeChartResultsForFixedRanges();
  }
  if (_schedulePrecomputeChartTimer) clearTimeout(_schedulePrecomputeChartTimer);
  _schedulePrecomputeChartTimer = setTimeout(function () {
    _schedulePrecomputeChartTimer = null;
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(start, { timeout: staggerMs });
    } else {
      setTimeout(start, Math.min(staggerMs, 1000));
    }
  }, 400);
}

// Set chart date range. Options: { skipRefresh: true } to avoid refreshCharts (e.g. during init).
function setChartDateRange(range, options) {
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
  
  // Refresh charts with filtered data (skip during init to avoid duplicate createCombinedChart + 14x analyzeHealthMetrics)
  if (!(options && options.skipRefresh === true)) {
    refreshCharts();
  }
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
  Logger.debug('Prediction range set', { days: range });
  
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
  normalizeChartViewSettings();
  if (appSettings.chartView === 'balance') {
    createBalanceChart();
  } else if (appSettings.chartView === 'combined') {
    createCombinedChart();
  } else {
    updateCharts();
  }
}

async function chart(id, label, dataField, color) {
  try {
    if (window.PerformanceUtils && typeof window.PerformanceUtils.ensureApexChartsLoaded === 'function') {
      await window.PerformanceUtils.ensureApexChartsLoaded();
    }
  } catch (e) {
    console.error('ApexCharts is not loaded! Cannot create charts.', e);
    return;
  }
  if (typeof ApexCharts === 'undefined') {
    console.error('ApexCharts is not loaded! Cannot create charts.');
    return;
  }
  const container = window.PerformanceUtils?.DOMCache?.getElement(id) || document.getElementById(id);
  if (!container || !document.body.contains(container)) {
    return;
  }
  
  // Device-based opts (reduceAnimations, maxChartPoints, deferAI, batchDOM)
  const deviceOpts = (window.PerformanceUtils && typeof window.PerformanceUtils.getDeviceOpts === 'function')
    ? window.PerformanceUtils.getDeviceOpts() : { reduceAnimations: false, maxChartPoints: 200, deferAI: false, batchDOM: false };
  const isMobile = window.innerWidth <= 768;
  const isSmallScreen = window.innerWidth <= 480;
  
  // Get filtered logs based on date range (cached)
  const filteredLogs = getFilteredLogs();
  
  // Check if we have data
  if (!filteredLogs || filteredLogs.length === 0) {
    Logger.debug('Individual chart: no data in date range (empty state)', { label });
    if (container.chart) {
      try { container.chart.destroy(); } catch (e) { /* ApexCharts may throw if node is detached */ }
      container.chart = null;
    }
    container.style.display = 'none';
    return;
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
  
  // Reduce data points by device opts and viewport for better performance
  const maxPoints = Math.min(deviceOpts.maxChartPoints, isSmallScreen ? 30 : isMobile ? 50 : deviceOpts.maxChartPoints);
  let optimizedChartData = chartData;
  if (chartData.length > maxPoints) {
    const step = Math.ceil(chartData.length / maxPoints);
    optimizedChartData = chartData.filter((_, index) => index % step === 0 || index === chartData.length - 1);
  }
  
  if (optimizedChartData.length === 0) {
    Logger.debug('Individual chart: no valid data in range (empty state)', { label });
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
  
  // Show individual chart only when that view is active (avoids stacked views after preload/refresh)
  container.style.display = getCurrentChartView() === 'individual' ? 'block' : 'none';
  
  // Generate predicted data for the selected date range period (only when AI features enabled)
  let predictedData = [];
  const aiOn = typeof appSettings !== 'undefined' && appSettings.aiEnabled !== false;
  if (aiOn && predictionsEnabled && window.PerformanceUtils && typeof window.PerformanceUtils.ensureAIEngineLoaded === 'function') {
    try {
      await window.PerformanceUtils.ensureAIEngineLoaded();
    } catch (e) { /* chart can render without predictions */ }
  }
  if (aiOn && predictionsEnabled && window.AIEngine && chartData.length >= 2) {
    try {
      const daysToPredict = predictionRange;
      const allHistoricalLogs = getAllHistoricalLogsSortedSync();
      const allLogs = allHistoricalLogs
        .filter(log => {
          if (dataField === 'weight') {
            const weightValue = log[dataField];
            return weightValue !== undefined && weightValue !== null && weightValue !== '' && !isNaN(parseFloat(weightValue)) && parseFloat(weightValue) > 0;
          }
          if (dataField === 'steps') {
            const stepsValue = log[dataField];
            return stepsValue !== undefined && stepsValue !== null && stepsValue !== '' && !isNaN(parseInt(stepsValue)) && parseInt(stepsValue) >= 0;
          }
          if (dataField === 'hydration') {
            const hydrationValue = log[dataField];
            return hydrationValue !== undefined && hydrationValue !== null && hydrationValue !== '' && !isNaN(parseFloat(hydrationValue)) && parseFloat(hydrationValue) >= 0;
          }
          return log[dataField] !== undefined && log[dataField] !== null && log[dataField] !== '';
        });
      if (allLogs.length >= 2) {
        const sortedLogsForMetric = filteredLogs
          .filter(log => {
            if (dataField === 'weight') {
              const weightValue = log[dataField];
              return weightValue !== undefined && weightValue !== null && weightValue !== '' && !isNaN(parseFloat(weightValue)) && parseFloat(weightValue) > 0;
            }
            return log[dataField] !== undefined && log[dataField] !== null && log[dataField] !== '';
          })
          .sort((a, b) => new Date(a.date) - new Date(b.date));
        if (sortedLogsForMetric.length >= 2) {
          const viewKey = getChartViewCacheKey(chartDateRange.type, chartDateRange.startDate, chartDateRange.endDate);
          let trend = null;
          let lastDate = new Date(sortedLogsForMetric[sortedLogsForMetric.length - 1].date);
          let analysis = null;
          const cached = getChartResultsCache(viewKey, predictionRange, logs.length);
          if (cached && cached.analysis && cached.analysis.trends && cached.analysis.trends[dataField]) {
            trend = cached.analysis.trends[dataField];
            lastDate = cached.lastDate ? new Date(cached.lastDate) : lastDate;
          } else {
            const sortedLogsAll = window.PerformanceUtils?.memoizedSort
              ? window.PerformanceUtils.memoizedSort(filteredLogs, (a, b) => new Date(a.date) - new Date(b.date), 'sortedFilteredLogsChart')
              : [...filteredLogs].sort((a, b) => new Date(a.date) - new Date(b.date));
            let anonymizedTrainingData = [];
            if (appSettings.useOpenData && appSettings.medicalCondition && typeof window.getAnonymizedTrainingData === 'function') {
              try {
                anonymizedTrainingData = await window.getAnonymizedTrainingData(appSettings.medicalCondition);
              } catch (e) { /* ignore */ }
            }
            let combinedTrainingLogs = appSettings.useOpenData ? [...allHistoricalLogs, ...anonymizedTrainingData] : allHistoricalLogs;
            if (combinedTrainingLogs.length > 1200) combinedTrainingLogs = combinedTrainingLogs.slice(-1200);
            analysis = await analyzeHealthMetrics(sortedLogsAll, combinedTrainingLogs);
            setChartResultsCache(viewKey, predictionRange, logs.length, {
              analysis,
              sortedLogs: sortedLogsAll,
              filteredLogs,
              daysToPredict,
              lastDate: sortedLogsAll.length > 0 ? new Date(sortedLogsAll[sortedLogsAll.length - 1].date) : null,
              allLogsLength: combinedTrainingLogs.length
            });
            trend = analysis.trends[dataField] || null;
            if (sortedLogsAll.length > 0) lastDate = new Date(sortedLogsAll[sortedLogsAll.length - 1].date);
          }
          if (trend) {
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
              // Include isSteps/isHydration so predictions use correct scale (e.g. steps 0-50000, not 0-10)
              const metricContext = {
                variance: trend.variance || 0,
                average: trend.average || 0,
                metricName: dataField,
                isSteps: isSteps,
                isHydration: isHydration,
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
  
  Logger.debug('Creating ApexChart', { label: label, points: chartData.length });
  
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
        enabled: !isSmallScreen && !deviceOpts.reduceAnimations,
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

  const viewKeyInd = getChartViewCacheKey(chartDateRange.type, chartDateRange.startDate, chartDateRange.endDate);
  const lastOpt = optimizedChartData[optimizedChartData.length - 1];
  const firstOpt = optimizedChartData[0];
  const histLenInd = getAllHistoricalLogsSync().length;
  const individualChartSig = id + '|' + dataField + '|' + viewKeyInd + '|' + predictionRange + '|' + (predictionsEnabled ? '1' : '0') + '|' + (aiOn ? '1' : '0') + '|' + histLenInd + '|' + optimizedChartData.length + '|' + (firstOpt && firstOpt.x) + '|' + (lastOpt && lastOpt.x) + '|' + (lastOpt && lastOpt.y) + '|' + predictedData.length + '|' + (appSettings.weightUnit || 'kg');
  if (container.chart && container._individualChartSig === individualChartSig && typeof container.chart.updateOptions === 'function') {
    try {
      container.chart.updateOptions(options, true, true);
      const loadingElFast = container.querySelector('.chart-loading');
      if (loadingElFast) loadingElFast.style.display = 'none';
      if (container.classList) container.classList.add('loaded');
      injectChartShareButton(container, id);
      setTimeout(function () {
        try {
          if (container && container.chart && document.body.contains(container)) container.chart.updateOptions({}, false, true);
        } catch (e) { /* chart may have been destroyed */ }
      }, 100);
      return;
    } catch (e) { /* fall through to full recreate */ }
  }
  if (container.chart) {
    try { container.chart.destroy(); } catch (e) { /* ignore */ }
    container.chart = null;
  }
  container._individualChartSig = individualChartSig;
  
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
  
  // Ensure container is visible and has dimensions before rendering (cap retries to avoid 100% CPU)
  const maxContainerReadyRetries = 40; // 40 * 50ms = 2s max, then give up
  let containerReadyAttempts = 0;
  const ensureContainerReady = () => {
    containerReadyAttempts += 1;
    const rect = container.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(container);
    
    const notReady = rect.width === 0 || rect.height === 0 ||
        computedStyle.display === 'none' ||
        computedStyle.visibility === 'hidden' ||
        computedStyle.opacity === '0';
    if (notReady) {
      if (containerReadyAttempts < maxContainerReadyRetries) {
        setTimeout(ensureContainerReady, 50);
      }
      return;
    }
    
    if (computedStyle.position === 'static') {
      container.style.position = 'relative';
    }
    
    requestAnimationFrame(() => {
      if (!document.body.contains(container)) return;
      container.chart = new ApexCharts(container, options);
      container.chart.render().then(() => {
        if (!document.body.contains(container)) return;
        if (loadingElement) loadingElement.style.display = 'none';
        if (container.classList) container.classList.add('loaded');
        injectChartShareButton(container, id);
        setTimeout(() => {
          try {
            if (container && container.chart && document.body.contains(container)) container.chart.updateOptions({}, false, true);
          } catch (e) { /* chart may have been destroyed */ }
        }, 100);
      });
    });
  };
  
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
    void updateChartsImmediate().catch(function () {});
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
      var p = (window.PerformanceUtils && typeof window.PerformanceUtils.ensureApexChartsLoaded === 'function')
        ? window.PerformanceUtils.ensureApexChartsLoaded()
        : Promise.resolve();
      p.then(function () { return chart(container.id, config.label, config.field, config.color); })
        .then(function () { container.classList.add('loaded'); })
        .catch(function () {});
    }, 100); // Small delay for smooth loading effect
  }
}

// Preload charts in background (fallback when BackgroundLoader is not available).
function preloadChartsInBackground() {
  var profile = window.PerformanceUtils && window.PerformanceUtils.getOptimizationProfile ? window.PerformanceUtils.getOptimizationProfile() : null;
  if (profile && !profile.enableChartPreload) return;
  if (!logs || logs.length === 0) return;
  var filteredLogs = getFilteredLogs();
  if (!filteredLogs || filteredLogs.length === 0) return;
  if (!document.getElementById('chartSection')) return;
  var staggerMs = (profile && profile.lazyChartStaggerMs != null) ? profile.lazyChartStaggerMs : 200;
  var gapAfterCombinedMs = 260;
  function runCombinedThenStartLazy() {
    createCombinedChart();
    if (typeof enforceChartSectionView === 'function') {
      enforceChartSectionView(getCurrentChartView());
    }
    var lazyCharts = document.querySelectorAll('.lazy-chart');
    var index = 0;
    function scheduleNext() {
      if (index >= lazyCharts.length) return;
      var container = lazyCharts[index];
      var chartType = container && container.dataset && container.dataset.chartType;
      index += 1;
      if (chartType && !loadedCharts.has(chartType)) {
        loadedCharts.add(chartType);
        loadChart(container, chartType);
      }
      if (index < lazyCharts.length) setTimeout(scheduleNext, staggerMs);
    }
    setTimeout(scheduleNext, gapAfterCombinedMs);
  }
  function scheduleIdle() {
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(runCombinedThenStartLazy, { timeout: 2500 });
    } else {
      setTimeout(runCombinedThenStartLazy, 0);
    }
  }
  if (window.PerformanceUtils && typeof window.PerformanceUtils.ensureApexChartsLoaded === 'function') {
    window.PerformanceUtils.ensureApexChartsLoaded().then(scheduleIdle).catch(function () {});
  } else {
    scheduleIdle();
  }
}

function scheduleChartsPreload() {
  var profile = window.PerformanceUtils && window.PerformanceUtils.getOptimizationProfile ? window.PerformanceUtils.getOptimizationProfile() : null;
  if (profile && !profile.enableChartPreload) return;
  schedulePrecomputeChartResults();
  if (window.BackgroundLoader && typeof window.BackgroundLoader.scheduleChartPreload === 'function') {
    window.BackgroundLoader.scheduleChartPreload({
      runCombined: function() {
        if (!logs || logs.length === 0) return;
        var filtered = getFilteredLogs();
        if (!filtered || filtered.length === 0) return;
        if (!document.getElementById('chartSection')) return;
        var run = function () {
          createCombinedChart();
          if (typeof enforceChartSectionView === 'function') {
            enforceChartSectionView(getCurrentChartView());
          }
        };
        if (window.PerformanceUtils && typeof window.PerformanceUtils.ensureApexChartsLoaded === 'function') {
          window.PerformanceUtils.ensureApexChartsLoaded().then(run).catch(function () {});
        } else {
          run();
        }
      },
      runLazyChart: function(container, chartType) {
        loadedCharts.add(chartType);
        loadChart(container, chartType);
      },
      getLazyCharts: function() { return document.querySelectorAll('.lazy-chart'); },
      loadedCharts: loadedCharts
    });
  } else {
    var delay = (profile && profile.chartPreloadDelayMs != null) ? profile.chartPreloadDelayMs : 1500;
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(preloadChartsInBackground, { timeout: delay + 1000 });
    } else {
      setTimeout(preloadChartsInBackground, delay);
    }
  }
}

async function updateChartsImmediate() {
  var _perfT0 = Date.now();
  try {
    if (window.PerformanceUtils && typeof window.PerformanceUtils.ensureApexChartsLoaded === 'function') {
      await window.PerformanceUtils.ensureApexChartsLoaded();
    }
  } catch (e) {
    return;
  }
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
  await Promise.all([
    chart("bpmChart", "Resting Heart Rate", "bpm", "rgb(76,175,80)"),
    chart("fatigueChart", "Fatigue Level", "fatigue", "rgb(255,152,0)"),
    chart("stiffnessChart", "Stiffness Level", "stiffness", "rgb(255,193,7)"),
    chart("backPainChart", "Back Pain Level", "backPain", "rgb(244,67,54)"),
    chart("sleepChart", "Sleep Quality", "sleep", "rgb(63,81,181)"),
    chart("jointPainChart", "Joint Pain Level", "jointPain", "rgb(255,87,34)"),
    chart("mobilityChart", "Mobility Level", "mobility", "rgb(0,188,212)"),
    chart("dailyFunctionChart", "Daily Function Level", "dailyFunction", "rgb(139,195,74)"),
    chart("swellingChart", "Joint Swelling Level", "swelling", "rgb(156,39,176)"),
    chart("moodChart", "Mood Level", "mood", "rgb(103,58,183)"),
    chart("irritabilityChart", "Irritability Level", "irritability", "rgb(121,85,72)"),
    chart("weatherSensitivityChart", "Weather Sensitivity", "weatherSensitivity", "rgb(0,150,136)"),
    chart("stepsChart", "Steps", "steps", "rgb(100,181,246)"),
    chart("hydrationChart", "Hydration", "hydration", "rgb(33,150,243)")
  ]);
  if (typeof enforceChartSectionView === 'function') {
    enforceChartSectionView(getCurrentChartView());
  }
  perfLog('Charts updateChartsImmediate (14 charts)', Date.now() - _perfT0, {});
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
    if (typeof enforceChartSectionView === 'function') {
      enforceChartSectionView(getCurrentChartView());
    }
  }
}

var updateChartsApexRetries = 0;
var updateChartsApexRetryMax = 24; // 24 * 500ms = 12s then stop retrying
function updateCharts() {
  var _perfT0 = Date.now();
  if (typeof ApexCharts === 'undefined') {
    if (window.PerformanceUtils && typeof window.PerformanceUtils.ensureApexChartsLoaded === 'function') {
      window.PerformanceUtils.ensureApexChartsLoaded().then(function () {
        updateCharts();
      }).catch(function () {});
      return;
    }
    if (updateChartsApexRetries < updateChartsApexRetryMax) {
      updateChartsApexRetries += 1;
      setTimeout(updateCharts, 500);
    }
    return;
  }
  updateChartsApexRetries = 0;
  
  Logger.debug('Updating charts', { entryCount: logs.length });
  
  // Check if we have any data to display
  const hasData = logs && logs.length > 0;
  updateChartEmptyState(hasData);
  
  // If all charts were built during load, don't clear/destroy them
  if (window.__chartsBuiltDuringLoad) {
    perfLog('Charts updateCharts (early, built during load)', Date.now() - _perfT0, {});
    return;
  }
  
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
      perfLog('Charts updateCharts (lazy)', Date.now() - _perfT0, {});
    } else {
      // Load all charts immediately if lazy loading is disabled
      void updateChartsImmediate().catch(function () {});
      perfLog('Charts updateCharts (immediate)', Date.now() - _perfT0, {});
  }
}

form.addEventListener("submit", e => {
  e.preventDefault();
  
  // Validate form before submission
  if (!formValidator.validateForm()) {
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
    hydration: document.getElementById("hydration")?.value ? parseFloat(document.getElementById("hydration").value) : undefined,
    medications: logFormMedications.length > 0 ? logFormMedications.map(function(m) {
      return { name: escapeHTML(m.name.trim().substring(0, 80)), times: (m.times || []).slice(0, 10), taken: !!m.taken };
    }) : undefined
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

  recordFrequentOptionsFromEntry(newEntry);

  var wasOffline = !navigator.onLine;
  if (wasOffline) {
    addToOfflineQueue(newEntry.date);
  }

  saveLogsToStorage();
  Logger.debug('Health logs saved to localStorage', { entryCount: logs.length });

  if (!wasOffline) {
    // Sync anonymized data if contribution is enabled (but not in demo mode)
    if (appSettings.contributeAnonData && !appSettings.demoMode && typeof syncAnonymizedData === 'function') {
      setTimeout(() => syncAnonymizedData(), 1000);
    }
  }

  // Clear all item arrays after saving
  logFormFoodByCategory = { breakfast: [], lunch: [], dinner: [], snack: [] };
  logFormExerciseItems = [];
  logFormStressorsItems = [];
  logFormSymptomsItems = [];
  logFormMedications = [];
  if (typeof clearMedTimesDraft === 'function') clearMedTimesDraft();
  renderLogFoodItems();
  renderLogExerciseItems();
  renderLogStressorsItems();
  renderLogSymptomsItems();
  renderLogMedicationsItems();

  // Reset energy/clarity tile selection
  setEnergyClaritySelection('');
  resetPainBodyDiagram('painBodyDiagram', 'painLocation');

  renderLogs();
  updateCharts();
  updateHeartbeatAnimation(); // Update heartbeat speed based on new BPM
  updateAISummaryButtonState(); // Update AI button state
  
  // Switch to logs tab after saving
  switchTab('logs');

  // Show success message (include offline note when applicable)
  var successText = 'Entry saved successfully!';
  if (wasOffline) {
    successText = 'Entry saved locally. It will sync when you\'re back online.';
  }
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
  successMsg.textContent = successText;
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
  if (typeof clearLogDraft === 'function') clearLogDraft();
  currentLogWizardStep = 0;
  if (typeof setLogWizardStep === 'function') setLogWizardStep(0, true);
  
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
  chartView: 'individual',
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
  globalTheme: 'mint', // 'mint' | 'red-black' | 'mono' | 'rainbow'
  contributeAnonData: false, // Contribute anonymised data to pool
  useOpenData: false, // Use anonymised data pool for AI training (requires 90+ days)
  aiEnabled: true, // When false: hide AI Analysis tab, chart predictions, and Goals
  preferredLlmModelSize: 'recommended' // 'recommended' | 'tier1'..'tier5' for on-device AI model
};

// Make appSettings available on window for safe access
if (typeof window !== 'undefined') {
  window.appSettings = appSettings;
}

// Load settings from localStorage
function loadSettings() {
  const savedSettings = localStorage.getItem('rianellSettings');
  if (savedSettings) {
    appSettings = { ...appSettings, ...JSON.parse(savedSettings) };
  }
  normalizeChartViewSettings();
  
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
  if (typeof window !== 'undefined' && typeof window.__rianellRefreshFnTraceGate === 'function') {
    window.__rianellRefreshFnTraceGate();
  }
}

function saveSettings() {
  localStorage.setItem('rianellSettings', JSON.stringify(appSettings));
  // Keep window.appSettings in sync
  if (typeof window !== 'undefined') {
    window.appSettings = appSettings;
  }
  Logger.debug('Settings saved', { settings: appSettings });
  if (typeof window !== 'undefined' && typeof window.__rianellRefreshFnTraceGate === 'function') {
    window.__rianellRefreshFnTraceGate();
  }
}

function setPreferredLlmModel(value) {
  var valid = value === 'recommended' || value === 'tier1' || value === 'tier2' || value === 'tier3' || value === 'tier4' || value === 'tier5';
  if (!valid) return;
  appSettings.preferredLlmModelSize = value;
  saveSettings();
  if (typeof window.clearSummaryLLMCache === 'function') window.clearSummaryLLMCache();
}
if (typeof window !== 'undefined') window.setPreferredLlmModel = setPreferredLlmModel;

function applySettings() {
  // Always use dark mode
  document.body.classList.remove('light-mode');
  document.body.classList.add('dark-mode');
  applyGlobalTheme();
  
  // Apply AI feature visibility (tab, predictions, goals)
  applyAIFeatureVisibility();
  
  // Charts are always visible in charts tab - no settings needed
  // Chart view toggle is handled by buttons in the chart tab
  
  // Update dashboard title
  updateDashboardTitle();
}

function applyGlobalTheme() {
  var theme = (appSettings && typeof appSettings.globalTheme === 'string') ? appSettings.globalTheme : 'mint';
  var valid = ['mint', 'red-black', 'mono', 'rainbow'];
  if (valid.indexOf(theme) === -1) theme = 'mint';
  if (appSettings) appSettings.globalTheme = theme;

  var classes = ['theme-mint', 'theme-red-black', 'theme-mono', 'theme-rainbow'];
  document.body.classList.remove.apply(document.body.classList, classes);
  document.body.classList.add('theme-' + theme);
}

function setGlobalTheme(theme) {
  var valid = ['mint', 'red-black', 'mono', 'rainbow'];
  if (valid.indexOf(theme) === -1) return;
  if (appSettings.globalTheme === theme) return;
  appSettings.globalTheme = theme;
  saveSettings();
  applyGlobalTheme();
  loadSettingsState();
}
if (typeof window !== 'undefined') window.setGlobalTheme = setGlobalTheme;

function applyAIFeatureVisibility() {
  var on = typeof appSettings !== 'undefined' && appSettings.aiEnabled !== false;
  var tabAi = document.getElementById('tab-ai');
  var aiTabPanel = document.getElementById('aiTab');
  var predictionGroup = document.querySelector('.filter-group');
  if (predictionGroup && !predictionGroup.querySelector('.prediction-range-buttons')) predictionGroup = null;
  var predGroup = document.querySelectorAll('.filter-group');
  for (var i = 0; i < predGroup.length; i++) {
    if (predGroup[i].querySelector('.prediction-range-buttons')) {
      predictionGroup = predGroup[i];
      break;
    }
  }
  var goalsBtn = document.querySelector('.targets-button-top');
  var goalsBlock = document.getElementById('goalsProgressBlock');
  if (tabAi) {
    tabAi.style.display = on ? '' : 'none';
    tabAi.setAttribute('aria-hidden', on ? 'false' : 'true');
  }
  if (aiTabPanel) aiTabPanel.style.display = on ? '' : 'none';
  if (predictionGroup) predictionGroup.style.display = on ? '' : 'none';
  if (goalsBtn) goalsBtn.style.display = on ? '' : 'none';
  if (goalsBlock) goalsBlock.style.display = on ? (goalsBlock.getAttribute('data-has-goals') === 'true' ? '' : 'none') : 'none';
  var currentTab = document.querySelector('.tab-btn[data-tab].active');
  if (!on && currentTab && currentTab.getAttribute('data-tab') === 'ai') {
    if (typeof switchTab === 'function') switchTab('home');
  }
  var bottomAi = document.getElementById('bottom-tab-ai');
  if (bottomAi) bottomAi.style.display = on ? '' : 'none';
}

function toggleAIFeatures() {
  appSettings.aiEnabled = !appSettings.aiEnabled;
  saveSettings();
  applyAIFeatureVisibility();
  loadSettingsState();
}

function loadSettingsState() {
  // Update toggle switches to reflect current settings
  document.getElementById('reminderToggle').classList.toggle('active', appSettings.reminder);
  document.getElementById('soundToggle').classList.toggle('active', appSettings.sound);
  document.getElementById('backupToggle').classList.toggle('active', appSettings.backup);
  document.getElementById('compressToggle').classList.toggle('active', appSettings.compress);
  var aiEnabledToggle = document.getElementById('aiEnabledToggle');
  if (aiEnabledToggle) aiEnabledToggle.classList.toggle('active', appSettings.aiEnabled !== false);
  
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

  var themeButtons = document.querySelectorAll('.settings-theme-choice');
  if (themeButtons && themeButtons.length) {
    var activeTheme = (appSettings && appSettings.globalTheme) ? appSettings.globalTheme : 'mint';
    for (var tb = 0; tb < themeButtons.length; tb++) {
      var b = themeButtons[tb];
      var selected = b.getAttribute('data-theme') === activeTheme;
      b.classList.toggle('settings-theme-choice--active', selected);
      b.setAttribute('aria-checked', selected ? 'true' : 'false');
    }
  }

  // On-device AI model: sync dropdown and recommendation hint from benchmark
  const preferredLlmSelect = document.getElementById('preferredLlmModelSelect');
  const llmRecommendationHint = document.getElementById('llmModelRecommendationHint');
  if (preferredLlmSelect) {
    const val = (appSettings.preferredLlmModelSize && appSettings.preferredLlmModelSize !== 'recommended' && /^tier[1-5]$/.test(appSettings.preferredLlmModelSize))
      ? appSettings.preferredLlmModelSize
      : 'recommended';
    preferredLlmSelect.value = val;
  }
  if (llmRecommendationHint) {
    if (typeof window !== 'undefined' && window.DeviceBenchmark && typeof window.DeviceBenchmark.isBenchmarkReady === 'function' && window.DeviceBenchmark.isBenchmarkReady()) {
      const platformType = (typeof window.DeviceBenchmark.getPlatformTypeCached === 'function')
        ? window.DeviceBenchmark.getPlatformTypeCached()
        : (typeof window.DeviceBenchmark.getPlatformType === 'function' ? window.DeviceBenchmark.getPlatformType() : 'desktop');
      const tier = window.DeviceBenchmark.getPerformanceTier();
      const full = window.DeviceBenchmark.getFullProfile(platformType, tier, {});
      const size = full && full.llmModelSize ? full.llmModelSize : 'tier3';
      const tierNum = size.replace('tier', '');
      llmRecommendationHint.textContent = 'Recommended: Tier ' + (tierNum || size);
    } else {
      llmRecommendationHint.textContent = 'Run benchmark (reload app) to see recommendation.';
    }
  }

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
  
  // Sync tutorial modal toggles (Contribute / Use open data) when settings load
  if (typeof updateTutorialDataTogglesState === 'function') updateTutorialDataTogglesState();

  // Show only install options relevant to current platform (iOS / Android / desktop)
  if (typeof refreshAppInstallSection === 'function') refreshAppInstallSection();
}

// Update tutorial slide 4 toggles from appSettings (same as Settings)
function updateTutorialDataTogglesState() {
  const contributeToggle = document.getElementById('tutorialContributeAnonDataToggle');
  const useOpenToggle = document.getElementById('tutorialUseOpenDataToggle');
  if (contributeToggle) {
    if (appSettings.demoMode) {
      contributeToggle.style.opacity = '0.5';
      contributeToggle.style.cursor = 'not-allowed';
      contributeToggle.classList.remove('active');
    } else {
      contributeToggle.style.opacity = '1';
      contributeToggle.style.cursor = 'pointer';
      contributeToggle.classList.toggle('active', appSettings.contributeAnonData || false);
    }
  }
  if (useOpenToggle) {
    if (appSettings.demoMode) {
      useOpenToggle.style.opacity = '0.5';
      useOpenToggle.style.cursor = 'not-allowed';
      useOpenToggle.classList.remove('active');
    } else {
      useOpenToggle.style.opacity = '1';
      useOpenToggle.style.cursor = 'pointer';
      useOpenToggle.classList.toggle('active', appSettings.useOpenData || false);
    }
  }
}

// Toggle contribute anonymised data
// optionalToggleId: use 'tutorialContributeAnonDataToggle' when called from tutorial
async function toggleContributeAnonData(optionalToggleId) {
  const toggleId = optionalToggleId || 'contributeAnonDataToggle';
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
    
    // Update toggle state (Settings and/or tutorial)
    const toggle = document.getElementById(toggleId);
    if (toggle) toggle.classList.toggle('active', appSettings.contributeAnonData);
    const settingsToggle = document.getElementById('contributeAnonDataToggle');
    if (settingsToggle) settingsToggle.classList.toggle('active', appSettings.contributeAnonData);
    
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
      
      // Update toggle state (Settings and tutorial)
      const toggle = document.getElementById(toggleId);
      if (toggle) toggle.classList.add('active');
      const settingsToggle = document.getElementById('contributeAnonDataToggle');
      if (settingsToggle) settingsToggle.classList.add('active');
      
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
      const toggle = document.getElementById(toggleId);
      if (toggle) toggle.classList.remove('active');
      const settingsToggle = document.getElementById('contributeAnonDataToggle');
      if (settingsToggle) settingsToggle.classList.remove('active');
    }
  );
}

// Toggle use open data for training
// optionalToggleId: use 'tutorialUseOpenDataToggle' when called from tutorial
async function toggleUseOpenData(optionalToggleId) {
  const toggleId = optionalToggleId || 'useOpenDataToggle';
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
    
    const toggle = document.getElementById(toggleId);
    if (toggle) toggle.classList.toggle('active', appSettings.useOpenData);
    const settingsToggle = document.getElementById('useOpenDataToggle');
    if (settingsToggle) settingsToggle.classList.toggle('active', appSettings.useOpenData);
    
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
  
  const toggle = document.getElementById(toggleId);
  if (toggle) toggle.classList.toggle('active', appSettings.useOpenData);
  const settingsToggle = document.getElementById('useOpenDataToggle');
  if (settingsToggle) settingsToggle.classList.toggle('active', appSettings.useOpenData);
  
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
  if (setting === 'sound' && appSettings.sound && typeof playHeartbeatSound === 'function') {
    playHeartbeatSound();
  }
}

function clearBenchmarkCacheAndNotify() {
  if (typeof window !== 'undefined' && window.DeviceBenchmark && typeof window.DeviceBenchmark.clearBenchmarkCache === 'function') {
    window.DeviceBenchmark.clearBenchmarkCache();
    showAlertModal('Performance benchmark cache cleared. Reload the app to run the benchmark again and see the device-class modal.', 'Developer');
  } else {
    showAlertModal('Benchmark module not available.', 'Developer');
  }
}

// Settings modal: multi-pane carousel (desktop ‹ ›, mobile swipe)
function captureSettingsModalCarouselState(overlay) {
  var track = document.getElementById('settingsCarouselTrack');
  if (!track) {
    var sc = overlay && overlay.querySelector('.settings-content');
    if (sc) window.settingsModalScrollPosition = sc.scrollTop;
    return;
  }
  var idx = parseInt(track.getAttribute('data-settings-index') || '0', 10);
  window.settingsModalPaneIndex = idx;
  var panes = track.querySelectorAll('.settings-carousel-pane');
  var pane = panes[idx];
  window.settingsModalScrollPosition = pane ? pane.scrollTop : 0;
}

function bindSettingsCarouselTouchOnce() {
  if (window._settingsCarouselTouchBound) return;
  var vp = document.getElementById('settingsCarouselViewport');
  if (!vp) return;
  window._settingsCarouselTouchBound = true;
  var startX = null;
  vp.addEventListener(
    'touchstart',
    function(e) {
      if (!e.changedTouches || !e.changedTouches.length) return;
      startX = e.changedTouches[0].screenX;
    },
    { passive: true }
  );
  vp.addEventListener(
    'touchend',
    function(e) {
      if (startX == null || !e.changedTouches || !e.changedTouches.length) return;
      var dx = e.changedTouches[0].screenX - startX;
      startX = null;
      if (Math.abs(dx) < 56) return;
      if (dx > 0) settingsCarouselStep(-1);
      else settingsCarouselStep(1);
    },
    { passive: true }
  );
}

function ensureSettingsCarouselDots(panes) {
  var dotsWrap = document.getElementById('settingsCarouselDots');
  if (!dotsWrap) return;
  var n = panes && panes.length ? panes.length : 0;
  if (n < 1) {
    dotsWrap.innerHTML = '';
    return;
  }
  if (dotsWrap.childElementCount === n) return;
  dotsWrap.innerHTML = '';
  function settingsIconForTitle(title, idx) {
    var t = String(title || '').toLowerCase();
    if (t.indexOf('personal') !== -1 || t.indexOf('cloud') !== -1) return 'fa-solid fa-user';
    if (t.indexOf('ai') !== -1 || t.indexOf('goal') !== -1) return 'fa-solid fa-comment-medical';
    if (t.indexOf('display') !== -1 || t.indexOf('reminder') !== -1) return 'fa-solid fa-chart-column';
    if (t.indexOf('custom') !== -1 || t.indexOf('theme') !== -1) return 'fa-solid fa-palette';
    if (t.indexOf('data option') !== -1) return 'fa-solid fa-gear';
    if (t.indexOf('performance') !== -1) return 'fa-solid fa-bolt';
    if (t.indexOf('install') !== -1) return 'fa-solid fa-mobile-screen-button';
    if (t.indexOf('data management') !== -1) return 'fa-solid fa-floppy-disk';
    return (idx % 2 === 0) ? 'fa-solid fa-circle' : 'fa-regular fa-circle';
  }
  for (var i = 0; i < n; i++) {
    var dot = document.createElement('button');
    var paneTitle = (panes[i] && panes[i].getAttribute('data-settings-pane-title')) || ('Section ' + String(i + 1));
    dot.className = 'settings-carousel-dot';
    dot.type = 'button';
    dot.setAttribute('aria-label', 'Go to settings section ' + String(i + 1) + (paneTitle ? ': ' + paneTitle : ''));
    dot.setAttribute('title', paneTitle);
    dot.setAttribute('data-settings-target', String(i));
    dot.innerHTML = '<span class="settings-carousel-dot__icon" aria-hidden="true"><i class="' + settingsIconForTitle(paneTitle, i) + '"></i></span>';
    dot.addEventListener('click', function(e) {
      var idx = parseInt(e.currentTarget.getAttribute('data-settings-target') || '0', 10);
      settingsCarouselGo(idx);
    });
    dotsWrap.appendChild(dot);
  }
}

function updateSettingsCarouselDots(activeIdx) {
  var dots = document.querySelectorAll('#settingsCarouselDots .settings-carousel-dot');
  if (!dots || !dots.length) return;
  for (var i = 0; i < dots.length; i++) {
    var active = i === activeIdx;
    dots[i].classList.toggle('settings-carousel-dot--active', active);
    dots[i].setAttribute('aria-current', active ? 'true' : 'false');
  }
}

function settingsCarouselGo(i) {
  var track = document.getElementById('settingsCarouselTrack');
  var vp = document.getElementById('settingsCarouselViewport');
  var meta = document.getElementById('settingsCarouselMeta');
  var prev = document.getElementById('settingsCarouselPrev');
  var next = document.getElementById('settingsCarouselNext');
  if (!track || !vp) return;
  var panes = track.querySelectorAll('.settings-carousel-pane');
  var n = panes.length;
  if (n < 1) return;
  ensureSettingsCarouselDots(panes);
  if (i < 0) i = 0;
  if (i >= n) i = n - 1;
  track.setAttribute('data-settings-index', String(i));
  track.style.setProperty('--settings-pane-index', String(i));
  track.style.setProperty('--settings-pane-count', String(n));
  vp.style.setProperty('--settings-pane-count', String(n));
  if (prev) {
    prev.disabled = i <= 0;
    prev.setAttribute('aria-disabled', i <= 0 ? 'true' : 'false');
  }
  if (next) {
    next.disabled = i >= n - 1;
    next.setAttribute('aria-disabled', i >= n - 1 ? 'true' : 'false');
  }
  panes.forEach(function(p, idx) {
    var active = idx === i;
    p.classList.toggle('settings-carousel-pane--active', active);
    p.setAttribute('aria-hidden', active ? 'false' : 'true');
    if ('inert' in p) p.inert = !active;
  });
  var title = (panes[i] && panes[i].getAttribute('data-settings-pane-title')) || '';
  if (meta) meta.textContent = String(i + 1) + ' / ' + n + (title ? ' - ' + title : '');
  updateSettingsCarouselDots(i);
  window.settingsModalPaneIndex = i;
}

function settingsCarouselStep(delta) {
  var track = document.getElementById('settingsCarouselTrack');
  if (!track) return;
  var i = parseInt(track.getAttribute('data-settings-index') || '0', 10);
  settingsCarouselGo(i + delta);
}

function initSettingsCarouselUI() {
  bindSettingsCarouselTouchOnce();
  var track = document.getElementById('settingsCarouselTrack');
  if (!track) return;
  var n = track.querySelectorAll('.settings-carousel-pane').length;
  if (n < 1) return;
  var saved = typeof window.settingsModalPaneIndex === 'number' ? window.settingsModalPaneIndex : 0;
  if (saved < 0 || saved >= n) saved = 0;
  settingsCarouselGo(saved);
}

window.settingsCarouselStep = settingsCarouselStep;
window.settingsCarouselGo = settingsCarouselGo;

// Override the placeholder with the full implementation
// This replaces the earlier placeholder function
(function() {
  var _settingsEscapeAndTrapHandler = null;
  var _settingsPreviousActiveElement = null;

  function getFocusableInSettings() {
    const overlay = document.getElementById('settingsOverlay');
    if (!overlay) return [];
    const sel = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    return Array.prototype.filter.call(overlay.querySelectorAll(sel), function(el) {
      var pane = el.closest('.settings-carousel-pane');
      if (pane && !pane.classList.contains('settings-carousel-pane--active')) return false;
      return el.offsetParent !== null && (el.tabIndex >= 0 || el.tagName === 'A' || el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA' || el.tagName === 'BUTTON');
    });
  }

  function removeSettingsKeydown() {
    if (_settingsEscapeAndTrapHandler) {
      document.removeEventListener('keydown', _settingsEscapeAndTrapHandler);
      _settingsEscapeAndTrapHandler = null;
    }
  }

  function settingsOverlayDoCloseCleanup(overlay, onDone) {
    overlay.style.display = 'none';
    overlay.style.visibility = 'hidden';
    document.body.classList.remove('modal-active');
    document.body.style.overflow = '';
    if (onDone) onDone();
  }

  function settingsOverlayCloseWithTransition(overlay, onDone) {
    if (!overlay.classList.contains('settings-overlay--open')) {
      settingsOverlayDoCloseCleanup(overlay, onDone);
      return;
    }
    overlay.classList.remove('settings-overlay--open');
    var cleaned = false;
    function doCleanup() {
      if (cleaned) return;
      cleaned = true;
      overlay.removeEventListener('transitionend', onEnd);
      if (timeoutId != null) clearTimeout(timeoutId);
      settingsOverlayDoCloseCleanup(overlay, onDone);
    }
    var onEnd = function(e) {
      if (e.target !== overlay) return;
      doCleanup();
    };
    overlay.addEventListener('transitionend', onEnd);
    var timeoutId = setTimeout(doCleanup, 450);
  }

  const fullToggleSettings = function() {
    const overlay = document.getElementById('settingsOverlay');
    if (!overlay) return;
    const isVisible = overlay.classList.contains('settings-overlay--open') || overlay.style.display === 'block' || overlay.style.display === 'flex';

    if (isVisible) {
      captureSettingsModalCarouselState(overlay);
      const conditionSelector = document.getElementById('medicalConditionSelector');
      if (conditionSelector) window.settingsModalConditionSelectorOpen = conditionSelector.style.display !== 'none';
      removeSettingsKeydown();
      settingsOverlayCloseWithTransition(overlay, function() {
        if (_settingsPreviousActiveElement && typeof _settingsPreviousActiveElement.focus === 'function') {
          _settingsPreviousActiveElement.focus();
          _settingsPreviousActiveElement = null;
        }
      });
    } else {
      if (overlay.style.display === 'block' && !overlay.classList.contains('settings-overlay--open')) {
        settingsOverlayDoCloseCleanup(overlay, null);
      }
      _settingsPreviousActiveElement = document.activeElement;
      document.body.style.overflow = 'hidden';
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
      overlay.style.zIndex = '99999';
      document.body.classList.add('modal-active');
      const menu = overlay.querySelector('.settings-menu');
      if (menu) {
        menu.style.position = 'fixed';
        menu.style.top = '50%';
        menu.style.left = '50%';
        menu.style.right = 'auto';
        menu.style.bottom = 'auto';
        menu.style.margin = '0';
        menu.style.padding = '0';
        menu.style.zIndex = '100000';
        menu.style.visibility = 'visible';
        menu.style.display = 'flex';
      }
      if (typeof loadSettingsState === 'function') loadSettingsState();
      requestAnimationFrame(function() {
        overlay.classList.add('settings-overlay--open');
      });
      initSettingsCarouselUI();
      setTimeout(function() {
        var track = document.getElementById('settingsCarouselTrack');
        var idx = parseInt((track && track.getAttribute('data-settings-index')) || '0', 10);
        var panes = track ? track.querySelectorAll('.settings-carousel-pane') : [];
        var pane = panes[idx];
        if (pane && window.settingsModalScrollPosition !== undefined) pane.scrollTop = window.settingsModalScrollPosition;
      }, 50);
      if (window.settingsModalConditionSelectorOpen) {
        const conditionSelector = document.getElementById('medicalConditionSelector');
        if (conditionSelector) conditionSelector.style.display = 'block';
      }
      _settingsEscapeAndTrapHandler = function(e) {
        if (e.key === 'Escape') {
          e.preventDefault();
          removeSettingsKeydown();
          window.closeSettings();
          return;
        }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          var kt = e.target;
          if (kt && (kt.tagName === 'INPUT' || kt.tagName === 'TEXTAREA' || kt.tagName === 'SELECT')) return;
          e.preventDefault();
          if (e.key === 'ArrowLeft') settingsCarouselStep(-1);
          else settingsCarouselStep(1);
          return;
        }
        if (e.key !== 'Tab') return;
        var focusable = getFocusableInSettings();
        if (focusable.length === 0) return;
        var first = focusable[0];
        var last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      };
      document.addEventListener('keydown', _settingsEscapeAndTrapHandler);
      setTimeout(function() {
        var focusable = getFocusableInSettings();
        if (focusable.length > 0) focusable[0].focus();
      }, 50);
    }
  };
  
  window.toggleSettings = fullToggleSettings;
  
  window.closeSettings = function() {
    const overlay = document.getElementById('settingsOverlay');
    if (!overlay) return;
    captureSettingsModalCarouselState(overlay);
    const conditionSelector = document.getElementById('medicalConditionSelector');
    if (conditionSelector) window.settingsModalConditionSelectorOpen = conditionSelector.style.display !== 'none';
    removeSettingsKeydown();
    var focusBack = function() {
      if (_settingsPreviousActiveElement && typeof _settingsPreviousActiveElement.focus === 'function') {
        _settingsPreviousActiveElement.focus();
        _settingsPreviousActiveElement = null;
      }
    };
    if (overlay.classList.contains('settings-overlay--open')) {
      settingsOverlayCloseWithTransition(overlay, focusBack);
    } else {
      settingsOverlayDoCloseCleanup(overlay, focusBack);
    }
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
    loadAvailableConditions('existingConditionsSelect');
  }
}

// Safe placeholder for <select> (avoid innerHTML for static messages)
function fillSelectSingleOption(selectEl, message) {
  if (!selectEl) return;
  selectEl.replaceChildren();
  const o = document.createElement('option');
  o.value = '';
  o.textContent = message;
  selectEl.appendChild(o);
}

// Load available conditions from Supabase
// optionalSelectId: use 'tutorialExistingConditionsSelect' for tutorial modal
async function loadAvailableConditions(optionalSelectId) {
  const selectId = optionalSelectId || 'existingConditionsSelect';
  const select = document.getElementById(selectId);
  if (!select) return;
  
  // Show loading state
  fillSelectSingleOption(select, 'Loading conditions...');
  select.disabled = true;
  
  try {
    // Initialize Supabase client if needed
    let client = window.supabaseClient || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
    
    if (!client) {
      // Try to initialize from SUPABASE_CONFIG (require non-empty url so we never call createClient when config failed to load)
      var config = window.SUPABASE_CONFIG;
      var hasUrl = config && typeof config.url === 'string' && config.url.trim().length > 0;
      if (hasUrl && typeof supabase !== 'undefined') {
        client = supabase.createClient(config.url, config.anonKey || '');
        window.supabaseClient = client;
      } else {
        if (typeof appSettings === 'undefined' || !appSettings.demoMode) {
          console.warn('Supabase client not available - SUPABASE_CONFIG or supabase library not found');
        }
        fillSelectSingleOption(select, '-- Select a condition --');
        select.disabled = false;
        return;
      }
    }
    
    // Fetch unique conditions from anonymized_data table
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
      populateConditionsSelect(uniqueConditions, selectId);
      console.log(`Loaded ${uniqueConditions.length} unique conditions from Supabase`);
    } else {
      populateConditionsSelect([], selectId);
      console.log('No conditions found in Supabase');
    }
    
    select.disabled = false;
  } catch (error) {
    console.error('Error loading conditions:', error);
    fillSelectSingleOption(select, 'Error loading conditions');
    select.disabled = false;
  }
}

// Populate conditions select dropdown
// optionalSelectId: use 'tutorialExistingConditionsSelect' for tutorial modal
function populateConditionsSelect(conditions, optionalSelectId) {
  const selectId = optionalSelectId || 'existingConditionsSelect';
  const select = document.getElementById(selectId);
  if (!select) return;
  
  fillSelectSingleOption(select, '-- Select a condition --');
  
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
    const logCount = getAllHistoricalLogsSync().length;
    
    showConfirmModal(
      `⚠️ WARNING: Changing your medical condition will DELETE ALL ${logCount} of your health log entries.\n\nThis action cannot be undone. Are you sure you want to continue?`,
      'Confirm Condition Change',
      () => {
        // User confirmed - proceed with condition change
        updateMedicalCondition(condition);
        // Clear all logs
        logs.length = 0;
        if (typeof window !== 'undefined') window.logs = logs;
        localStorage.setItem("healthLogs", JSON.stringify([]));
        if (window.PerformanceUtils?.DataCache) window.PerformanceUtils.DataCache.invalidate('allHistoricalLogs');
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
    const logCount = getAllHistoricalLogsSync().length;
    
    showConfirmModal(
      `⚠️ WARNING: Changing your medical condition will DELETE ALL ${logCount} of your health log entries.\n\nThis action cannot be undone. Are you sure you want to continue?`,
      'Confirm Condition Change',
      () => {
        // User confirmed - proceed with condition change
        updateMedicalCondition(condition);
        // Clear all logs
        logs.length = 0;
        if (typeof window !== 'undefined') window.logs = logs;
        localStorage.setItem("healthLogs", JSON.stringify([]));
        if (window.PerformanceUtils?.DataCache) window.PerformanceUtils.DataCache.invalidate('allHistoricalLogs');
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

// Tutorial modal: condition selector (same UI and logic as Settings)
function updateTutorialConditionDisplay() {
  const display = document.getElementById('tutorialConditionDisplay');
  if (!display) return;
  if (appSettings.demoMode) {
    display.textContent = 'Disabled in demo mode';
    return;
  }
  display.textContent = appSettings.medicalCondition && appSettings.medicalCondition.trim()
    ? appSettings.medicalCondition
    : 'Medical Condition';
}

function toggleTutorialConditionSelector() {
  if (appSettings.demoMode) {
    showAlertModal('Condition selection is disabled in demo mode.', 'Demo Mode');
    return;
  }
  const selector = document.getElementById('tutorialConditionSelector');
  const displayContainer = document.getElementById('tutorialConditionDisplayContainer');
  if (!selector) return;
  const isVisible = selector.style.display !== 'none';
  if (isVisible) {
    selector.style.display = 'none';
    if (displayContainer) displayContainer.style.display = 'block';
  } else {
    selector.style.display = 'block';
    if (displayContainer) displayContainer.style.display = 'none';
    loadAvailableConditions('tutorialExistingConditionsSelect');
  }
}

function selectTutorialCondition() {
  const select = document.getElementById('tutorialExistingConditionsSelect');
  if (!select || !select.value) return;
  const condition = select.value.trim();
  if (!condition) return;
  const currentCondition = appSettings.medicalCondition;
  if (currentCondition && currentCondition !== condition) {
    const logCount = getAllHistoricalLogsSync().length;
    showConfirmModal(
      `⚠️ WARNING: Changing your medical condition will DELETE ALL ${logCount} of your health log entries.\n\nThis action cannot be undone. Are you sure you want to continue?`,
      'Confirm Condition Change',
      () => {
        updateMedicalCondition(condition);
        logs.length = 0;
        if (typeof window !== 'undefined') window.logs = logs;
        localStorage.setItem('healthLogs', JSON.stringify([]));
        if (window.PerformanceUtils?.DataCache) window.PerformanceUtils.DataCache.invalidate('allHistoricalLogs');
        if (typeof renderLogs === 'function') renderLogs();
        if (typeof updateCharts === 'function') updateCharts();
        const sel = document.getElementById('tutorialConditionSelector');
        const disp = document.getElementById('tutorialConditionDisplayContainer');
        if (sel) sel.style.display = 'none';
        if (disp) disp.style.display = 'block';
        select.value = '';
        updateTutorialConditionDisplay();
        showAlertModal(`Condition changed to "${condition}". All previous log entries have been cleared.`, 'Condition Changed');
      },
      () => { select.value = ''; }
    );
  } else {
    updateMedicalCondition(condition);
    const sel = document.getElementById('tutorialConditionSelector');
    const disp = document.getElementById('tutorialConditionDisplayContainer');
    if (sel) sel.style.display = 'none';
    if (disp) disp.style.display = 'block';
    select.value = '';
    updateTutorialConditionDisplay();
  }
}

function addTutorialCondition() {
  const input = document.getElementById('tutorialNewConditionInput');
  if (!input) return;
  const condition = input.value.trim();
  if (!condition) {
    showAlertModal('Please enter a condition name', 'Condition Required');
    return;
  }
  const currentCondition = appSettings.medicalCondition;
  if (currentCondition && currentCondition !== condition) {
    const logCount = getAllHistoricalLogsSync().length;
    showConfirmModal(
      `⚠️ WARNING: Changing your medical condition will DELETE ALL ${logCount} of your health log entries.\n\nThis action cannot be undone. Are you sure you want to continue?`,
      'Confirm Condition Change',
      () => {
        updateMedicalCondition(condition);
        logs.length = 0;
        if (typeof window !== 'undefined') window.logs = logs;
        localStorage.setItem('healthLogs', JSON.stringify([]));
        if (window.PerformanceUtils?.DataCache) window.PerformanceUtils.DataCache.invalidate('allHistoricalLogs');
        if (typeof renderLogs === 'function') renderLogs();
        if (typeof updateCharts === 'function') updateCharts();
        input.value = '';
        const sel = document.getElementById('tutorialConditionSelector');
        const disp = document.getElementById('tutorialConditionDisplayContainer');
        if (sel) sel.style.display = 'none';
        if (disp) disp.style.display = 'block';
        updateTutorialConditionDisplay();
        loadAvailableConditions('tutorialExistingConditionsSelect');
        showAlertModal(`Condition changed to "${condition}". All previous log entries have been cleared.`, 'Condition Changed');
      },
      () => {}
    );
    return;
  }
  updateMedicalCondition(condition);
  input.value = '';
  const sel = document.getElementById('tutorialConditionSelector');
  const disp = document.getElementById('tutorialConditionDisplayContainer');
  if (sel) sel.style.display = 'none';
  if (disp) disp.style.display = 'block';
  updateTutorialConditionDisplay();
  loadAvailableConditions('tutorialExistingConditionsSelect');
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
  setTimeout(() => {
    const displayCheck = document.getElementById('medicalConditionDisplay');
    if (displayCheck && appSettings.medicalCondition) {
      displayCheck.textContent = appSettings.medicalCondition;
    }
    updateTutorialConditionDisplay();
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
    Promise.resolve(syncAnonymizedData()).catch(function(error) {
      Logger.warn('Failed to sync anonymized data after condition update', { error: String(error) });
    });
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
// On mobile/low device use fewer days to avoid memory and CPU strain (365 = 1 year is enough for showcase)
function getDemoDataDays() {
  var isLow = typeof window.PerformanceUtils !== 'undefined' && window.PerformanceUtils.platform && window.PerformanceUtils.platform.deviceClass === 'low';
  return isLow ? 365 : 3650;
}

/** On mobile use a fixed 90-day premade dataset and rebase dates to recent (no heavy generation). */
function getPremadeMobileDemoLogs() {
  var n = 90;
  var logs = [];
  var cycle = 14 + 5 + 10; // good + flare + recovery
  for (var day = 0; day < n; day++) {
    var phase = day % cycle;
    var inFlare = phase >= 14 && phase < 19;
    var inRecovery = phase >= 19 && phase < 29;
    var fatigue = inFlare ? 7 : (inRecovery ? 5 : 4);
    var stiffness = inFlare ? 8 : (inRecovery ? 5 : 3);
    var sleep = inFlare ? 4 : (inRecovery ? 6 : 8);
    var mood = inFlare ? 4 : (inRecovery ? 6 : 8);
    var steps = inFlare ? 2500 : (inRecovery ? 5000 : 7500);
    var hydration = inFlare ? 6 : 8;
    var bpm = inFlare ? 78 : 68;
    logs.push({
      date: '2000-01-01',
      bpm: String(bpm),
      weight: '75.0',
      flare: inFlare ? 'Yes' : 'No',
      fatigue: String(fatigue),
      stiffness: String(stiffness),
      backPain: String(inFlare ? 7 : 3),
      sleep: String(sleep),
      jointPain: String(inFlare ? 7 : 3),
      mobility: String(inFlare ? 4 : 8),
      dailyFunction: String(inFlare ? 4 : 8),
      swelling: String(inFlare ? 6 : 2),
      mood: String(mood),
      irritability: String(inFlare ? 7 : 3),
      weatherSensitivity: String(inFlare ? 7 : 3),
      steps: steps,
      hydration: hydration,
      notes: inFlare ? 'Flare day, rested' : (day % 7 === 0 ? 'Good day overall' : ''),
      food: { breakfast: [], lunch: [], dinner: [], snack: [] },
      exercise: inFlare ? [] : [{ name: 'Walking', duration: 20 }]
    });
  }
  return logs;
}

function rebaseDatesToRecent(logs) {
  var today = new Date();
  for (var i = 0; i < logs.length; i++) {
    var d = new Date(today);
    d.setDate(d.getDate() - (logs.length - 1 - i));
    logs[i].date = d.toISOString().split('T')[0];
  }
  return logs;
}

function generateDemoData(numDays) {
  if (numDays == null) numDays = getDemoDataDays();
  // Desktop: up to 10 years (3650 days); mobile: 1 year (365) for performance
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
  let totalFlareLength = 0; // Total days of current flare (for gradual severity curve)
  let flareDayIndex = 0; // Day within current flare (0 = first day) for gradual severity ramp
  let preFlareDays = 0; // 2-4 days of gradual build before flare (for AI "things to watch")
  let recoveryPhase = 0; // Days since last flare (for gradual recovery over 10-14 days)
  let baselineHealth = 7.0; // Baseline health score (improves over time with treatment)
  let seasonalFactor = 0; // Seasonal variation (-1 to 1)
  let weeklyPattern = 0; // Day of week pattern (0-6)
  
  // Pattern tracking for correlations and smooth series (so AI trends/predictions look good)
  let previousSleep = 7;
  let previousMood = 7;
  let previousFatigue = 4;
  let previousStiffness = 3;
  let previousSteps = 7000;
  let previousHydration = 8.0;
  let daysSinceLastFlare = 999; // Cooldown: no new flare until this is high enough (~monthly flares)
  
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
    
    // Flare-up pattern: ~monthly (1 flare per 25-35 days), gradual pre-flare and recovery
    daysSinceLastFlare++;
    const minDaysBetweenFlares = 22; // Cooldown: no new flare for at least 3 weeks
    const baseFlareChancePerDay = 0.032; // ~1 flare per 31 days when in window
    const seasonalAdjust = seasonalFactor * 0.008; // Slightly more in winter
    const flareChance = daysSinceLastFlare >= minDaysBetweenFlares
      ? Math.min(0.045, baseFlareChancePerDay + seasonalAdjust)
      : 0;

    if (flareDuration > 0) {
      flareDayIndex++;
      flareDuration--;
      recoveryPhase = 0;
      if (flareDuration === 0) {
        flareState = false;
        flareDayIndex = 0;
        recoveryPhase = 1;
        daysSinceLastFlare = 0;
      }
    } else if (preFlareDays > 0) {
      preFlareDays--;
      if (preFlareDays === 0) {
        flareState = true;
        flareDayIndex = 0;
        flareDuration = Math.floor(getRandom() * 4) + 3; // 3-6 days (shorter flares, monthly)
        totalFlareLength = flareDuration;
        recoveryPhase = 0;
      }
    } else if (getRandom() < flareChance) {
      preFlareDays = Math.floor(getRandom() * 2) + 3; // 3-4 days gradual build before flare
      recoveryPhase = 0;
    } else {
      recoveryPhase++;
    }

    const inPreFlare = preFlareDays > 0;
    const inFlare = flareState;
    const inRecovery = recoveryPhase > 0 && recoveryPhase <= 14;

    // Recovery: gradual over 14 days (smoother "Getting Better")
    const recoveryBoost = inRecovery ? Math.min(0.45, recoveryPhase * 0.032) : 0;
    
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
    
    // Base values with patterns (pain cluster: stiffness -> backPain, jointPain, swelling move together)
    let fatigue, stiffness, backPain, jointPain, sleep, mobility, dailyFunction, swelling, mood, irritability, bpm;

    if (inFlare || inPreFlare) {
      // Gradual severity: pre-flare builds over 3-4 days; flare peaks in middle then eases
      let severity;
      if (inPreFlare) {
        const preFlareTotal = 4; // max preFlareDays was 3-4
        const buildDay = preFlareTotal - preFlareDays;
        severity = 0.25 + (buildDay / preFlareTotal) * 0.45; // 0.25 -> 0.70 gradual
      } else {
        const mid = totalFlareLength / 2;
        const distFromMid = Math.abs(flareDayIndex - mid);
        severity = Math.max(0.5, 1.0 - (distFromMid / (mid + 0.5)) * 0.4); // peak in middle, gradual ramp up/down
      }
      const painBase = baselineHealth - 2.2 + (severity * 2.2) - (seasonalFactor * 1.2);
      stiffness = Math.max(1, Math.min(10, painBase + (r2 * 1.2)));
      backPain = Math.max(1, Math.min(10, stiffness + (r3 * 0.8) - 0.3));
      jointPain = Math.max(1, Math.min(10, stiffness * 0.85 + (r4 * 1)));
      swelling = Math.max(1, Math.min(10, jointPain * 0.7 + (r8 * 0.8)));
      fatigue = Math.max(1, Math.min(10, baselineHealth - 2.5 + (severity * 2) + (r1 * 1.2) - (seasonalFactor * 1)));
      sleep = Math.max(1, Math.min(10, baselineHealth - 3 + (severity * 1.5) + (r5 * 1) - (seasonalFactor * 0.8)));
      mobility = Math.max(1, Math.min(10, 11 - stiffness - (fatigue - 5) * 0.25 + (r6 * 0.8)));
      dailyFunction = Math.max(1, Math.min(10, mobility * 0.92 + (r7 * 0.6)));
      mood = Math.max(1, Math.min(10, baselineHealth - 2.5 + (severity * 1.8) + (r9 * 1) - (seasonalFactor * 1)));
      irritability = Math.max(1, Math.min(10, 12 - mood + (r10 * 1)));
      bpm = Math.floor(70 + (r11 * 8) + (seasonalFactor * 3) + (inFlare ? severity * 6 : 2));
      // Smooth transition: blend with previous day so no sudden jumps
      stiffness = stiffness * 0.7 + previousStiffness * 0.3;
      fatigue = fatigue * 0.7 + previousFatigue * 0.3;
      sleep = sleep * 0.75 + previousSleep * 0.25;
      mood = mood * 0.75 + previousMood * 0.25;
    } else {
      // Normal state: Clear correlations and patterns
      // Sleep quality affects everything
      const sleepQuality = baselineHealth + (r5 * 2) + seasonalFactor + weeklyPattern + recoveryBoost;
      sleep = Math.max(1, Math.min(10, sleepQuality));
      
      // Fatigue inversely correlates with sleep (strong correlation)
      fatigue = Math.max(1, Math.min(10, baselineHealth - (sleep - 5) * 0.8 + (r1 * 1.5) - seasonalFactor));
      
      // Pain cluster: stiffness drives backPain, jointPain, swelling (so AI "groups that change together" is clear)
      stiffness = Math.max(1, Math.min(10, baselineHealth - 2 - (seasonalFactor * 2) + (r2 * 1.2) + recoveryBoost));
      backPain = Math.max(1, Math.min(7, stiffness + (r3 * 0.8) - 0.3)); // Cap 7 in normal so severe pain = flare days
      jointPain = Math.max(1, Math.min(7, stiffness * 0.75 + (r4 * 1)));
      swelling = Math.max(1, Math.min(7, jointPain * 0.65 + (r8 * 0.8)));
      
      // Mobility inversely correlates with stiffness and fatigue
      mobility = Math.max(1, Math.min(10, baselineHealth + 1 - (stiffness - 5) * 0.5 - (fatigue - 5) * 0.3 + (r6 * 1) + recoveryBoost));
      
      // Daily function correlates with mobility and mood
      dailyFunction = Math.max(1, Math.min(10, mobility * 0.9 + (r7 * 1)));
      
      // Mood correlates with sleep and inversely with fatigue (strong correlations)
      mood = Math.max(1, Math.min(10, baselineHealth + 0.5 + (sleep - 5) * 0.6 - (fatigue - 5) * 0.4 + (r9 * 1) + weeklyPattern + recoveryBoost));
      
      // Irritability inversely correlates with mood and sleep
      irritability = Math.max(1, Math.min(10, baselineHealth - 2 - (mood - 5) * 0.5 - (sleep - 5) * 0.3 + (r10 * 1.5)));
      
      // BPM correlates with stress/fatigue
      bpm = Math.floor(65 + (fatigue - 5) * 2 + (r11 * 8) + (seasonalFactor * 3));

      // Stronger smoothing in normal state so trends are stable and gradual
      sleep = Math.max(1, Math.min(10, sleep * 0.65 + previousSleep * 0.35));
      mood = Math.max(1, Math.min(10, mood * 0.65 + previousMood * 0.35));
      stiffness = Math.max(1, Math.min(10, stiffness * 0.7 + previousStiffness * 0.3));
      fatigue = Math.max(1, Math.min(10, fatigue * 0.7 + previousFatigue * 0.3));
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
    
    // Store for next iteration (smoothing so AI trends are interpretable)
    previousSleep = sleep;
    previousMood = mood;
    previousFatigue = fatigue;
    previousStiffness = stiffness;

    // Steps: smooth, gradual series; flare drop and 14-day recovery ramp
    let steps;
    if (inFlare) {
      const drop = previousSteps * 0.5 + (getRandom() * 800); // Gradual drop
      steps = Math.floor(previousSteps * 0.55 + Math.max(1500, drop * 0.45));
      steps = Math.max(1500, Math.min(5500, steps));
    } else if (inRecovery) {
      const recoveryFrac = recoveryPhase / 14; // Gradual over 14 days
      const targetSteps = 4500 + recoveryFrac * 4500 + (getRandom() * 800);
      steps = Math.floor(previousSteps * 0.7 + targetSteps * 0.3);
      steps = Math.max(3500, Math.min(12000, steps));
    } else {
      const delta = (getRandom() - 0.5) * 600; // Smaller daily swing for smoother series
      steps = Math.floor(previousSteps + delta);
      steps = Math.max(4500, Math.min(13000, steps));
    }
    previousSteps = steps;

    // Hydration: lower during flare, smooth and gradual otherwise
    let hydration;
    if (inFlare) {
      hydration = previousHydration * 0.75 + (getRandom() * 0.8) + 4.5;
    } else if (inRecovery) {
      hydration = previousHydration + (getRandom() - 0.5) * 0.4;
    } else {
      hydration = previousHydration + (getRandom() - 0.5) * 0.35;
    }
    hydration = Math.max(4.5, Math.min(13, hydration));
    previousHydration = hydration;
    
    // Weight: Slight variation around base (within ±2kg) - optimized
    const weightChange = (r12 - 0.5) * 0.6; // -0.3 to 0.3
    currentWeight += weightChange;
    currentWeight = currentWeight < 70 ? 70 : (currentWeight > 80 ? 80 : currentWeight); // Clamp between 70-80kg
    const weight = Math.round(currentWeight * 10) / 10;
    
    // Notes: Slightly more during flare/pre-flare; flare-specific notes for AI context
    let notes = '';
    const noteChance = inFlare ? 0.22 : (inPreFlare ? 0.14 : 0.08);
    if (getRandom() < noteChance) {
      if (inFlare && getRandom() < 0.4) {
        notes = ['Flare day, rested', 'Staying off feet today', 'Pain worse this morning'][Math.floor(getRandom() * 3)];
      } else {
        notes = noteTemplates[Math.floor(getRandom() * noteTemplates.length)];
      }
    }
    
    // Generate food and exercise data (use PREDEFINED_FOODS / PREDEFINED_EXERCISES for consistency with tiles)
    const breakfastItems = [];
    const lunchItems = [];
    const dinnerItems = [];
    const snackItems = [];
    
    // Food - less logged during flare (correlates with "low energy" days for AI)
    const foodChance = inFlare ? 0.35 : (inPreFlare ? 0.5 : 0.65);
    if (getRandom() < foodChance) {
      const mealPools = {
        breakfast: PREDEFINED_FOODS.filter(f => !f.meals || f.meals.length === 0 || f.meals.includes('breakfast')),
        lunch: PREDEFINED_FOODS.filter(f => !f.meals || f.meals.length === 0 || f.meals.includes('lunch')),
        dinner: PREDEFINED_FOODS.filter(f => !f.meals || f.meals.length === 0 || f.meals.includes('dinner')),
        snack: PREDEFINED_FOODS.filter(f => !f.meals || f.meals.length === 0 || f.meals.includes('snack'))
      };
      const mealKeys = ['breakfast', 'lunch', 'dinner', 'snack'];
      const numTotal = Math.floor(getRandom() * 6) + 1;
      const used = new Set();
      for (let i = 0; i < numTotal; i++) {
        const meal = mealKeys[i % 4];
        const pool = mealPools[meal];
        if (!pool || pool.length === 0) continue;
        const f = pool[Math.floor(getRandom() * pool.length)];
        if (used.has(f.id)) continue;
        used.add(f.id);
        const item = { name: f.name, calories: f.calories, protein: f.protein };
        if (meal === 'breakfast') breakfastItems.push(item);
        else if (meal === 'lunch') lunchItems.push(item);
        else if (meal === 'dinner') dinnerItems.push(item);
        else snackItems.push(item);
      }
    }
    
    // Exercise: less during flare, more on good days (correlates with mobility/stiffness for AI)
    const exerciseChance = inFlare ? 0.08 : (inRecovery ? 0.2 : (stiffness >= 7 || fatigue >= 7 ? 0.2 : 0.45));
    const exerciseItems = [];
    if (getRandom() < exerciseChance) {
      const maxItems = inFlare ? 1 : (inRecovery ? 2 : 3);
      const numExerciseItems = Math.floor(getRandom() * maxItems) + 1;
      const exUsed = new Set();
      for (let i = 0; i < numExerciseItems && exUsed.size < PREDEFINED_EXERCISES.length; i++) {
        const template = PREDEFINED_EXERCISES[Math.floor(getRandom() * PREDEFINED_EXERCISES.length)];
        if (exUsed.has(template.id)) continue;
        exUsed.add(template.id);
        const durationVariation = inFlare ? 0.6 : (1 + (getRandom() - 0.5) * 0.4);
        exerciseItems.push({
          name: template.name,
          duration: Math.max(5, Math.round(template.defaultDuration * durationVariation))
        });
      }
    }
    
    // Energy & mental clarity - use ENERGY_CLARITY_OPTIONS values
    const energyClarityValues = ENERGY_CLARITY_OPTIONS.map(o => o.value).concat('');
    const energyClarity = getRandom() > 0.3 ? energyClarityValues[Math.floor(getRandom() * energyClarityValues.length)] : '';
    
    // Stressors - slightly more during pre-flare and flare (gradual, not overwhelming)
    const numStressors = inFlare ? Math.floor(getRandom() * 2) + 1 : (inPreFlare ? Math.floor(getRandom() * 2) : Math.floor(getRandom() * 2));
    const stressors = [];
    const stressorValues = STRESSOR_OPTIONS.map(o => o.value);
    for (let i = 0; i < numStressors && stressors.length < stressorValues.length; i++) {
      const val = stressorValues[Math.floor(getRandom() * stressorValues.length)];
      if (!stressors.includes(val)) stressors.push(val);
    }
    
    // Use current SYMPTOM_OPTIONS; gradual increase during pre-flare and flare
    const symptomValues = SYMPTOM_OPTIONS.map(o => o.value);
    const numSymptoms = inFlare ? Math.floor(getRandom() * 2) + 1 : (inPreFlare ? Math.floor(getRandom() * 2) : Math.floor(getRandom() * 2));
    const symptoms = [];
    for (let i = 0; i < numSymptoms && symptoms.length < symptomValues.length; i++) {
      const val = symptomValues[Math.floor(getRandom() * symptomValues.length)];
      if (!symptoms.includes(val)) symptoms.push(val);
    }
    
    // Use PAIN_BODY_REGIONS so demo pain matches diagram format (e.g. "Left knee (pain), Head (mild)")
    let painLocation = '';
    if (getRandom() > 0.5 && PAIN_BODY_REGIONS.length > 0) {
      const numRegions = Math.floor(getRandom() * 3) + 1;
      const used = new Set();
      const parts = [];
      for (let i = 0; i < numRegions && parts.length < 5; i++) {
        const r = PAIN_BODY_REGIONS[Math.floor(getRandom() * PAIN_BODY_REGIONS.length)];
        if (used.has(r.id)) continue;
        used.add(r.id);
        const severity = getRandom() < 0.5 ? '(mild)' : '(pain)';
        parts.push(r.label + ' ' + severity);
      }
      painLocation = parts.join(', ');
    }
    
    // Weather sensitivity: gradual rise in pre-flare, high in flare, smooth elsewhere
    let weatherSensitivity;
    if (inFlare) {
      const mid = totalFlareLength / 2;
      const sev = Math.max(0.6, 1.0 - Math.abs(flareDayIndex - mid) / (mid + 0.5) * 0.35);
      weatherSensitivity = Math.floor(6 + sev * 3.5 + getRandom() * 0.5);
    } else if (inPreFlare) {
      weatherSensitivity = Math.floor(4 + (4 - preFlareDays) * 1.0 + getRandom());
    } else {
      weatherSensitivity = Math.floor(getRandom() * 3) + 1;
    }
    weatherSensitivity = Math.max(1, Math.min(10, weatherSensitivity));
    
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
          localStorage.setItem('rianellSettings', JSON.stringify(settings));
        } else {
          const raw = localStorage.getItem('rianellSettings');
          const settings = raw ? JSON.parse(raw) : {};
          settings.demoMode = false;
          settings.userName = '';
          settings.medicalCondition = '';
          localStorage.setItem('rianellSettings', JSON.stringify(settings));
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

      const finalSettings = JSON.parse(localStorage.getItem('rianellSettings') || '{}');
      finalSettings.demoMode = false;
      localStorage.setItem('rianellSettings', JSON.stringify(finalSettings));
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
          // On mobile use premade dataset + rebase dates (instant); on desktop generate full demo
          var demoLogs = getDemoDataDays() === 365
            ? rebaseDatesToRecent(getPremadeMobileDemoLogs())
            : generateDemoData(getDemoDataDays());
          
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
  Logger.debug('Condition context updated', { condition: conditionName });
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

/** If motd.json fails to load (offline, 404), show this single line until retry. */
const MOTD_FALLBACK_MINIMAL = ['Rianell'];

/**
 * Loads MOTD lines from web/motd.json (see repo). Sets window.__rianellMotdMessages.
 * @returns {Promise<void>}
 */
function loadMotdJson() {
  if (typeof window === 'undefined' || typeof fetch !== 'function') {
    return Promise.resolve();
  }
  var url = 'motd.json';
  try {
    url = new URL('motd.json', window.location.href).href;
  } catch (e) {}
  return fetch(url, { cache: 'force-cache' })
    .then(function (r) {
      if (!r.ok) throw new Error('motd');
      return r.json();
    })
    .then(function (data) {
      if (data && Array.isArray(data.messages) && data.messages.length) {
        window.__rianellMotdMessages = data.messages.filter(function (x) {
          return typeof x === 'string' && String(x).trim().length > 0;
        });
      }
    })
    .catch(function () {
      window.__rianellMotdMessages = null;
    });
}

function getMotdMessageList() {
  var w = typeof window !== 'undefined' ? window.__rianellMotdMessages : null;
  if (w && Array.isArray(w) && w.length) return w;
  return MOTD_FALLBACK_MINIMAL;
}

/**
 * Preset MOTD line: one random choice per full page load (stable across repeated calls in the same session).
 */
function getRandomMotdFallback() {
  const list = getMotdMessageList();
  if (!list.length) return 'Rianell';
  if (typeof window !== 'undefined' && window.__rianellMotdSessionPick != null) {
    return window.__rianellMotdSessionPick;
  }
  var idx = Math.floor(Math.random() * list.length);
  var pick = list[idx];
  if (typeof window !== 'undefined') window.__rianellMotdSessionPick = pick;
  return pick;
}

/**
 * Runs after the app shell is visible so MOTD LLM does not contend with preloadSummaryLLM during startup.
 */
function scheduleDashboardMotdWithLlm(fallbackTitle) {
  var deviceOpts = (window.PerformanceUtils && typeof window.PerformanceUtils.getDeviceOpts === 'function')
    ? window.PerformanceUtils.getDeviceOpts() : { deferAI: false };
  if (deviceOpts.deferAI) return;
  var fb = fallbackTitle != null ? fallbackTitle : getRandomMotdFallback();
  (async function motdDashboardTitle() {
    if (typeof window.generateMotdWithLLM !== 'function') {
      if (window.PerformanceUtils && typeof window.PerformanceUtils.lazyLoadScript === 'function') {
        try {
          await window.PerformanceUtils.lazyLoadScript('summary-llm.js');
        } catch (e) {}
      }
    }
    if (typeof window.generateMotdWithLLM !== 'function') return;
    try {
      var motd = await window.generateMotdWithLLM(fb);
      var t = motd && motd.trim ? motd.trim() : '';
      if (!t || t === fb) return;
      var el = document.getElementById('dashboardTitle');
      if (!el) return;
      // Keep MOTD quote only on Home tab; avoid applying async result after tab switch.
      var activeTab = tabNameRef || 'home';
      if (activeTab !== 'home') return;
      el.textContent = t;
      el.setAttribute('data-text', t);
      if (typeof syncMobileFixedTitlePadding === 'function') {
        requestAnimationFrame(function() {
          syncMobileFixedTitlePadding();
        });
      }
    } catch (e) {}
  })();
}

function updateDashboardTitle() {
  const titleElement = document.getElementById('dashboardTitle');
  if (!titleElement) return;
  const titleContainer = document.querySelector('.title-container');

  const activeTab = tabNameRef || 'home';
  if (activeTab !== 'home') {
    if (titleContainer) titleContainer.style.display = 'none';
    titleElement.textContent = '';
    titleElement.setAttribute('data-text', '');
    document.title = 'Rianell';
    if (typeof syncMobileFixedTitlePadding === 'function') {
      requestAnimationFrame(function() {
        syncMobileFixedTitlePadding();
      });
    }
    return;
  }

  if (titleContainer) titleContainer.style.display = '';
  const fallbackTitle = getRandomMotdFallback();

  titleElement.textContent = fallbackTitle;
  titleElement.setAttribute('data-text', fallbackTitle);
  document.title = 'Rianell';
  if (typeof syncMobileFixedTitlePadding === 'function') {
    requestAnimationFrame(function() {
      syncMobileFixedTitlePadding();
    });
  }

  var deviceOpts = (window.PerformanceUtils && typeof window.PerformanceUtils.getDeviceOpts === 'function')
    ? window.PerformanceUtils.getDeviceOpts() : { deferAI: false };
  if (deviceOpts.deferAI) return;
  if (document.body && document.body.classList.contains('loaded')) {
    scheduleDashboardMotdWithLlm(fallbackTitle);
  }
}

// Filtering and sorting functionality
let currentSortOrder = 'newest'; // 'newest' or 'oldest'

// Set log view date range (7, 30, or 90 days)
function clearAISection() {
  var rail = document.getElementById('aiTimelinePortrait');
  var mob = document.getElementById('aiTimelineMobile');
  if (rail) rail.remove();
  if (mob) mob.remove();
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
  
    // Always refresh AI panel (empty state or analysis) when range changes
  const deviceOptsRange = (window.PerformanceUtils && typeof window.PerformanceUtils.getDeviceOpts === 'function')
    ? window.PerformanceUtils.getDeviceOpts() : { deferAI: false };
  if (deviceOptsRange.deferAI) {
    setTimeout(function() { generateAISummary(); }, 500);
  } else {
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
  
  // Always refresh AI panel (empty state or analysis) when custom range is applied
  const deviceOptsCustom = (window.PerformanceUtils && typeof window.PerformanceUtils.getDeviceOpts === 'function')
    ? window.PerformanceUtils.getDeviceOpts() : { deferAI: false };
  if (deviceOptsCustom.deferAI) {
    setTimeout(function() { generateAISummary(); }, 500);
  } else {
    generateAISummary();
  }
}

function checkAndUpdateViewRangeButtons() {
  // Check if the current date range matches any predefined range (7, 30, 90 days)
  const startDateInput = document.getElementById('startDate');
  const endDateInput = document.getElementById('endDate');
  
  if (!startDateInput || !endDateInput || !startDateInput.value || !endDateInput.value) {
    // If dates are empty, default to Today selected
    if (typeof setLogViewRange === 'function') setLogViewRange(1);
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

function setSortOrder(order) {
  if (order !== 'newest' && order !== 'oldest') return;
  currentSortOrder = order;
  var oldestBtn = document.getElementById('sortOldest');
  var newestBtn = document.getElementById('sortNewest');
  if (oldestBtn) oldestBtn.classList.toggle('active', order === 'oldest');
  if (newestBtn) newestBtn.classList.toggle('active', order === 'newest');

  var startDate = document.getElementById('startDate').value;
  var endDate = document.getElementById('endDate').value;
  var logsToSort = [];
  if (startDate || endDate) {
    logsToSort = logs.filter(function(log) {
      var logDate = new Date(log.date);
      var start = startDate ? new Date(startDate) : new Date('1900-01-01');
      var end = endDate ? new Date(endDate) : new Date('2100-12-31');
      end.setHours(23, 59, 59, 999);
      start.setHours(0, 0, 0, 0);
      return logDate >= start && logDate <= end;
    });
  } else {
    var activeRangeBtn = document.querySelector('.log-date-range-btn.active');
    if (activeRangeBtn) {
      var btnId = activeRangeBtn.id;
      var days = 7;
      if (btnId === 'logRange1Day') days = 1;
      else if (btnId === 'logRange7Days') days = 7;
      else if (btnId === 'logRange30Days') days = 30;
      else if (btnId === 'logRange90Days') days = 90;
      var rangeEnd = new Date();
      rangeEnd.setHours(23, 59, 59, 999);
      var rangeStart = new Date();
      rangeStart.setDate(rangeStart.getDate() - (days - 1));
      rangeStart.setHours(0, 0, 0, 0);
      logsToSort = logs.filter(function(log) {
        var logDate = new Date(log.date);
        return logDate >= rangeStart && logDate <= rangeEnd;
      });
    } else {
      logsToSort = logs.slice();
    }
  }
  var sortedLogs = logsToSort.sort(function(a, b) {
    var dateA = new Date(a.date);
    var dateB = new Date(b.date);
    return currentSortOrder === 'newest' ? dateB - dateA : dateA - dateB;
  });
  renderSortedLogs(sortedLogs);
}

function toggleSort() {
  setSortOrder(currentSortOrder === 'newest' ? 'oldest' : 'newest');
}

function renderFilteredLogs(filteredLogs) {
  renderLogEntries(filteredLogs);
}

function renderSortedLogs(sortedLogs) {
  renderLogEntries(sortedLogs);
}

// Close tile picker sheet if its anchor lives inside this section; also close native <details> (e.g. perf benchmark)
function collapseSectionContent(sectionEl) {
  if (!sectionEl) return;
  var sheet = document.getElementById('tilePickerSheet');
  var restore = window._tilePickerRestore;
  if (sheet && sheet.open && restore && restore.slot && sectionEl.contains(restore.slot)) {
    closeTilePickerSheet();
  }
  sectionEl.querySelectorAll('details[open]').forEach(function (details) {
    details.removeAttribute('open');
  });
}

// Collapsible section functionality - only one section open at a time in Log Entry tab
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
        collapseSectionContent(section);
        section.classList.remove('open');
        if (arrow) arrow.textContent = '▶';
        setTimeout(() => {
          section.style.willChange = 'auto';
        }, 300);
      } else {
        // Accordion: one open section at a time within the same wizard step (not the whole form - avoids collapsing hidden steps)
        const logTab = document.getElementById('logTab');
        const scopeRoot = section.closest('.log-wizard-step') || logTab;
        if (scopeRoot) {
          scopeRoot.querySelectorAll('.section-content.open').forEach(content => {
            if (content.id !== sectionId) {
              collapseSectionContent(content);
              content.classList.remove('open');
              const prev = content.previousElementSibling;
              const otherArrow = prev?.querySelector('.section-arrow');
              if (otherArrow) otherArrow.textContent = '▶';
              content.style.willChange = 'auto';
            }
          });
        }
        section.classList.add('open');
        if (arrow) arrow.textContent = '';
        setTimeout(() => {
          section.style.willChange = 'auto';
        }, 300);
      }
    });
    
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

function restoreTilePickerAnchor() {
  if (!window._tilePickerRestore) return;
  var anchor = window._tilePickerRestore.anchor;
  var slot = window._tilePickerRestore.slot;
  var prevTrigger = window._tilePickerLastTrigger;
  if (anchor && slot && anchor.parentNode !== slot) {
    slot.appendChild(anchor);
  }
  if (prevTrigger) prevTrigger.setAttribute('aria-expanded', 'false');
  window._tilePickerRestore = null;
  window._tilePickerLastTrigger = null;
}

function closeTilePickerSheet() {
  var sheet = document.getElementById('tilePickerSheet');
  if (sheet && sheet.open) sheet.close();
}

function openTilePickerSheet(triggerEl) {
  var sheet = document.getElementById('tilePickerSheet');
  var body = document.getElementById('tilePickerSheetBody');
  var titleEl = document.getElementById('tilePickerSheetTitle');
  if (!sheet || !body || !triggerEl) return;

  var slot = triggerEl.nextElementSibling;
  if (!slot || !slot.classList.contains('tile-picker-slot')) return;
  var anchor = slot.querySelector('.tile-picker-anchor');
  if (!anchor) return;

  if (sheet.open && window._tilePickerLastTrigger === triggerEl) {
    sheet.close();
    return;
  }

  if (sheet.open) {
    restoreTilePickerAnchor();
  }

  var labelEl = triggerEl.querySelector('.food-meal-label, .exercise-meal-label');
  var titleText = labelEl ? labelEl.textContent.trim() : triggerEl.textContent.trim();
  if (titleEl) titleEl.textContent = titleText;

  window._tilePickerRestore = { anchor: anchor, slot: slot };
  window._tilePickerLastTrigger = triggerEl;
  triggerEl.setAttribute('aria-expanded', 'true');
  body.appendChild(anchor);
  if (!sheet.open) {
    sheet.showModal();
  }
  try {
    void anchor.offsetHeight;
    body.scrollTop = 0;
  } catch (e) {}
}

function initializeTilePickerSheet() {
  if (window._tilePickerSheetInit) return;
  window._tilePickerSheetInit = true;
  var dialog = document.getElementById('tilePickerSheet');
  var closeBtn = document.getElementById('tilePickerSheetClose');
  if (!dialog) return;
  /* Capture phase: food/exercise modals use .modal-content onclick=stopPropagation(), which
   * blocks bubble from reaching body - tile picker must run on capture or triggers inside those modals never fire.
   * Triggers inside #foodModalOverlay / #exerciseModalOverlay use direct listeners from renderFoodItems/renderExerciseItems;
   * skip here so we do not open then immediately toggle-close on the same click. */
  document.body.addEventListener('click', function (e) {
    var t = e.target.closest('.tile-picker-trigger');
    if (!t) return;
    if (t.closest('#foodModalOverlay') || t.closest('#exerciseModalOverlay')) return;
    e.preventDefault();
    openTilePickerSheet(t);
  }, true);
  if (closeBtn) {
    closeBtn.addEventListener('click', function () {
      closeTilePickerSheet();
    });
  }
  dialog.addEventListener('close', function () {
    restoreTilePickerAnchor();
  });
  dialog.addEventListener('click', function (e) {
    if (e.target === dialog) closeTilePickerSheet();
  });
}

function initializeOneOpenDetails() {
  initializeTilePickerSheet();
}

if (typeof window !== 'undefined') {
  window.closeTilePickerSheet = closeTilePickerSheet;
  window.openTilePickerSheet = openTilePickerSheet;
}

// --- App-like navigation: home panel, log wizard, hash, draft ---
var LOG_WIZARD_TOTAL_STEPS = 10;
var currentLogWizardStep = 0;
var logWizardNavSyncing = false;
var logDraftDebounceTimer = null;
var LOG_DRAFT_STORAGE_KEY = 'healthLogDraftV1';

function syncMainNavTabs(tabName) {
  document.querySelectorAll('.main-nav-tab').forEach(function(btn) {
    var t = btn.getAttribute('data-tab');
    var isActive = t === tabName;
    btn.classList.toggle('active', isActive);
    if (btn.getAttribute('role') === 'tab') {
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    }
    if (btn.classList.contains('app-bottom-nav-btn')) {
      if (isActive) btn.setAttribute('aria-current', 'page');
      else btn.removeAttribute('aria-current');
    }
  });
}

function initializeLogWizardSections() {
  var form = document.getElementById('logForm');
  if (!form) return;
  form.querySelectorAll('.section-content').forEach(function(el) {
    el.classList.add('open');
  });
}

function updateHomeTodayPanel() {
  var greet = document.getElementById('homeGreeting');
  var dateEl = document.getElementById('homeTodayDate');
  var statusEl = document.getElementById('homeTodayStatus');
  var name = (typeof appSettings !== 'undefined' && appSettings.userName) ? String(appSettings.userName).trim() : '';
  if (greet) greet.textContent = name ? 'Hi, ' + name : 'Today';
  var d = new Date();
  if (dateEl) {
    dateEl.textContent = d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  }
  if (!statusEl) return;
  var yyyy = d.getFullYear();
  var mm = String(d.getMonth() + 1).padStart(2, '0');
  var dd = String(d.getDate()).padStart(2, '0');
  var todayStr = yyyy + '-' + mm + '-' + dd;
  var logArr = typeof window.logs !== 'undefined' && window.logs ? window.logs : [];
  var today = logArr.find(function(l) { return l.date === todayStr; });
  if (today) {
    statusEl.textContent = 'You have logged today. Open View logs to browse or edit entries.';
  } else {
    statusEl.innerHTML = 'No log for today yet. Tap <span class="home-plus-emphasis" aria-hidden="true">+</span> to record how you feel.';
  }
}

function openLogWizardFromHome() {
  switchTab('log', true);
  setLogWizardStep(0);
  if (typeof setAppHashFromTab === 'function') setAppHashFromTab('log');
}

function buildLogReviewSummaryHtml() {
  var html = [];

  function readValue(id) {
    var el = document.getElementById(id);
    return el ? String(el.value || '').trim() : '';
  }

  function addRow(rows, label, value) {
    if (value === undefined || value === null) return;
    var v = String(value).trim();
    if (!v) return;
    rows.push(
      '<div class="log-review-row">' +
        '<span class="log-review-label">' + escapeHTML(label) + '</span>' +
        '<span class="log-review-value">' + escapeHTML(v) + '</span>' +
      '</div>'
    );
  }

  function sectionCard(title, rows, options) {
    var opts = options || {};
    if (!rows.length && !opts.showWhenEmpty) return '';
    var body = rows.length
      ? rows.join('')
      : '<div class="log-review-empty">Nothing added for this section</div>';
    return (
      '<section class="log-review-card">' +
        '<h4 class="log-review-heading">' + escapeHTML(title) + '</h4>' +
        '<div class="log-review-grid">' + body + '</div>' +
      '</section>'
    );
  }

  var basics = [];
  addRow(basics, 'Date', readValue('date'));
  addRow(basics, 'Flare', readValue('flare'));
  html.push(sectionCard('Basics', basics, { showWhenEmpty: true }));

  var vitals = [];
  var bpm = readValue('bpm');
  var weight = readValue('weight');
  if (bpm) addRow(vitals, 'Heart rate', bpm + ' bpm');
  if (weight) addRow(vitals, 'Weight', weight + ' ' + (appSettings && appSettings.weightUnit ? appSettings.weightUnit : 'kg'));
  html.push(sectionCard('Vitals', vitals, { showWhenEmpty: true }));

  var symptoms = [];
  var symptomMap = {
    stiffness: 'Stiffness',
    jointPain: 'Joint pain',
    mobility: 'Mobility',
    swelling: 'Swelling'
  };
  Object.keys(symptomMap).forEach(function(id) {
    var v = readValue(id);
    if (v) addRow(symptoms, symptomMap[id], v + '/10');
  });
  addRow(symptoms, 'Pain locations', readValue('painLocation'));
  if (typeof logFormSymptomsItems !== 'undefined' && logFormSymptomsItems.length) {
    addRow(symptoms, 'Selected symptoms', logFormSymptomsItems.join(', '));
  }
  html.push(sectionCard('Symptoms & pain', symptoms));

  var wellbeing = [];
  var wellbeingMap = {
    fatigue: 'Fatigue',
    sleep: 'Sleep quality',
    mood: 'Mood',
    irritability: 'Irritability',
    weatherSensitivity: 'Weather sensitivity',
    dailyFunction: 'Daily function'
  };
  Object.keys(wellbeingMap).forEach(function(id) {
    var v = readValue(id);
    if (v) addRow(wellbeing, wellbeingMap[id], v + '/10');
  });
  var steps = readValue('steps');
  var hydration = readValue('hydration');
  if (steps) addRow(wellbeing, 'Steps', steps);
  if (hydration) addRow(wellbeing, 'Hydration', hydration + ' glasses');
  addRow(wellbeing, 'Energy / clarity', readValue('energyClarity'));
  if (typeof logFormStressorsItems !== 'undefined' && logFormStressorsItems.length) {
    addRow(wellbeing, 'Stressors', logFormStressorsItems.join(', '));
  }
  html.push(sectionCard('Energy & day', wellbeing));

  var foodExercise = [];
  if (typeof logFormFoodByCategory !== 'undefined') {
    var mealNames = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack' };
    ['breakfast', 'lunch', 'dinner', 'snack'].forEach(function(meal) {
      var arr = logFormFoodByCategory[meal] || [];
      if (!arr.length) return;
      var mealText = arr
        .map(function(x) { return typeof x === 'string' ? x : (x && x.name ? x.name : ''); })
        .filter(Boolean)
        .join(', ');
      addRow(foodExercise, mealNames[meal], mealText);
    });
  }
  if (typeof logFormExerciseItems !== 'undefined' && logFormExerciseItems.length) {
    var exText = logFormExerciseItems
      .map(function(x) { return typeof x === 'string' ? x : (x && x.name ? x.name : ''); })
      .filter(Boolean)
      .join(', ');
    addRow(foodExercise, 'Exercise', exText);
  }
  html.push(sectionCard('Food & exercise', foodExercise));

  var medsNotes = [];
  if (typeof logFormMedications !== 'undefined' && logFormMedications.length) {
    addRow(medsNotes, 'Medications', logFormMedications.map(function(m) { return m.name; }).join(', '));
  }
  addRow(medsNotes, 'Notes', readValue('notes'));
  html.push(sectionCard('Medication & notes', medsNotes));

  var output = html.join('');
  return output || '<p class="log-review-empty">No details yet - you can still save after adding required fields.</p>';
}

function updateLogWizardChrome() {
  var label = document.getElementById('logWizardStepLabel');
  var fill = document.getElementById('logWizardProgressFill');
  var bar = document.getElementById('logWizardProgressBar');
  var title = document.getElementById('logTabTitle');
  var stepEl = document.querySelector('.log-wizard-step[data-log-step="' + currentLogWizardStep + '"]');
  var stepTitle = stepEl ? (stepEl.getAttribute('data-step-title') || '') : '';
  if (label) label.textContent = 'Step ' + (currentLogWizardStep + 1) + ' of ' + LOG_WIZARD_TOTAL_STEPS + (stepTitle ? ' - ' + stepTitle : '');
  if (fill) fill.style.width = ((currentLogWizardStep + 1) / LOG_WIZARD_TOTAL_STEPS * 100) + '%';
  if (bar) {
    bar.setAttribute('aria-valuenow', String(currentLogWizardStep + 1));
    bar.setAttribute('aria-valuemax', String(LOG_WIZARD_TOTAL_STEPS));
  }
  if (title) title.textContent = stepTitle ? 'Log: ' + stepTitle : 'Log today';
  var backBtn = document.getElementById('logWizardBackBtn');
  var nextBtn = document.getElementById('logWizardNextBtn');
  var skipBtn = document.getElementById('logWizardSkipBtn');
  var saveBtn = document.getElementById('logWizardSaveBtn');
  /* Keep all three nav buttons in the layout (do not use display:none) so the row does not collapse to one full-width button */
  var backLabel = document.getElementById('logWizardBackLabel');
  if (backBtn) {
    backBtn.style.display = '';
    backBtn.style.visibility = 'visible';
    var backText = currentLogWizardStep > 0 ? 'Back' : 'Close';
    if (backLabel) {
      backLabel.textContent = backText;
    } else {
      backBtn.textContent = backText;
    }
    backBtn.setAttribute('data-nav-mode', currentLogWizardStep > 0 ? 'back' : 'close');
    backBtn.setAttribute('aria-label', currentLogWizardStep > 0 ? 'Previous step' : 'Close and return to home');
    backBtn.tabIndex = 0;
  }
  var dotsWrap = document.getElementById('logWizardStepDots');
  if (dotsWrap) {
    dotsWrap.innerHTML = '';
    for (var di = 0; di < LOG_WIZARD_TOTAL_STEPS; di++) {
      var dot = document.createElement('span');
      dot.className = 'log-wizard-dot';
      if (di < currentLogWizardStep) dot.classList.add('log-wizard-dot--done');
      if (di === currentLogWizardStep) dot.classList.add('log-wizard-dot--active');
      dotsWrap.appendChild(dot);
    }
  }
  if (skipBtn) {
    var canSkip = currentLogWizardStep > 0 && currentLogWizardStep < LOG_WIZARD_TOTAL_STEPS - 1;
    skipBtn.style.display = '';
    skipBtn.style.visibility = canSkip ? 'visible' : 'hidden';
    skipBtn.style.pointerEvents = canSkip ? '' : 'none';
    skipBtn.setAttribute('aria-hidden', canSkip ? 'false' : 'true');
    skipBtn.tabIndex = canSkip ? 0 : -1;
  }
  if (nextBtn) {
    var canNext = currentLogWizardStep < LOG_WIZARD_TOTAL_STEPS - 1;
    nextBtn.style.display = '';
    nextBtn.style.visibility = canNext ? 'visible' : 'hidden';
    nextBtn.style.pointerEvents = canNext ? '' : 'none';
    nextBtn.setAttribute('aria-hidden', canNext ? 'false' : 'true');
    nextBtn.tabIndex = canNext ? 0 : -1;
  }
  if (saveBtn) saveBtn.style.display = currentLogWizardStep === LOG_WIZARD_TOTAL_STEPS - 1 ? '' : 'none';
}

function setLogWizardStep(step, skipHashUpdate) {
  step = Math.max(0, Math.min(LOG_WIZARD_TOTAL_STEPS - 1, step));
  currentLogWizardStep = step;
  document.querySelectorAll('#logWizardSteps .log-wizard-step').forEach(function(el) {
    var s = parseInt(el.getAttribute('data-log-step'), 10);
    el.classList.toggle('log-wizard-step--active', s === step);
  });
  if (step === LOG_WIZARD_TOTAL_STEPS - 1) {
    var review = document.getElementById('logReviewSummary');
    if (review) review.innerHTML = buildLogReviewSummaryHtml();
  }
  updateLogWizardChrome();
  var panel = document.getElementById('logTab');
  if (panel) {
    if (step === LOG_WIZARD_TOTAL_STEPS - 1) {
      var saveFocus = document.getElementById('logWizardSaveBtn');
      if (saveFocus && typeof saveFocus.focus === 'function') {
        try { saveFocus.focus({ preventScroll: true }); } catch (e) { saveFocus.focus(); }
      }
    } else {
      var focusTarget = panel.querySelector('.log-wizard-step.log-wizard-step--active input, .log-wizard-step.log-wizard-step--active select, .log-wizard-step.log-wizard-step--active textarea');
      if (focusTarget && typeof focusTarget.focus === 'function') {
        try { focusTarget.focus({ preventScroll: true }); } catch (e) { focusTarget.focus(); }
      }
    }
  }
  if (!skipHashUpdate && tabNameRef === 'log' && typeof setAppHashFromTab === 'function') {
    setAppHashFromTab('log');
  }
  scheduleLogDraftPersist();
}
var tabNameRef = 'home';

function validateLogWizardStep(step) {
  if (step === 0) {
    var ok = true;
    if (typeof formValidator !== 'undefined' && formValidator.validateField) {
      if (!formValidator.validateField('date')) ok = false;
      if (!formValidator.validateField('flare')) ok = false;
    }
    return ok;
  }
  return true;
}

function logWizardGoNext() {
  if (!validateLogWizardStep(currentLogWizardStep)) {
    var summaryElement = document.getElementById('validationSummary');
    if (summaryElement && summaryElement.classList.contains('show')) {
      summaryElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return;
  }
  if (currentLogWizardStep < LOG_WIZARD_TOTAL_STEPS - 1) {
    setLogWizardStep(currentLogWizardStep + 1);
  }
}

function resetLogWizardFieldToDefault(el) {
  if (!el) return;
  var tag = (el.tagName || '').toLowerCase();
  var type = (el.type || '').toLowerCase();
  if (tag === 'select') {
    el.selectedIndex = 0;
    return;
  }
  if (type === 'checkbox' || type === 'radio') {
    el.checked = false;
    return;
  }
  if (type === 'range') {
    var attrVal = el.getAttribute('value');
    if (attrVal != null && attrVal !== '') {
      el.value = attrVal;
    } else if (el.min !== '' && !isNaN(parseFloat(el.min))) {
      el.value = el.min;
    } else {
      el.value = '0';
    }
    if (typeof updateSliderColor === 'function') updateSliderColor(el);
    return;
  }
  if (type === 'number') {
    el.value = '';
    return;
  }
  if (tag === 'textarea' || tag === 'input') {
    el.value = '';
  }
}

function clearLogWizardStepData(step) {
  var stepEl = document.querySelector('.log-wizard-step[data-log-step="' + step + '"]');
  if (stepEl) {
    stepEl.querySelectorAll('input, select, textarea').forEach(function(el) {
      if (!el || !el.id) return;
      resetLogWizardFieldToDefault(el);
      if (typeof formValidator !== 'undefined' && formValidator.clearFieldError) {
        formValidator.clearFieldError(el.id);
      }
    });
  }

  if (step === 2) {
    if (typeof resetPainBodyDiagram === 'function') resetPainBodyDiagram('painBodyDiagram', 'painLocation');
    if (typeof logFormSymptomsItems !== 'undefined') logFormSymptomsItems = [];
    if (typeof renderLogSymptomsItems === 'function') renderLogSymptomsItems();
  } else if (step === 3) {
    if (typeof setEnergyClaritySelection === 'function') setEnergyClaritySelection('');
  } else if (step === 4) {
    if (typeof logFormStressorsItems !== 'undefined') logFormStressorsItems = [];
    if (typeof renderLogStressorsItems === 'function') renderLogStressorsItems();
  } else if (step === 6) {
    if (typeof logFormFoodByCategory !== 'undefined') {
      logFormFoodByCategory = { breakfast: [], lunch: [], dinner: [], snack: [] };
    }
    if (typeof renderLogFoodItems === 'function') renderLogFoodItems();
  } else if (step === 7) {
    if (typeof logFormExerciseItems !== 'undefined') logFormExerciseItems = [];
    if (typeof renderLogExerciseItems === 'function') renderLogExerciseItems();
  } else if (step === 8) {
    if (typeof logFormMedications !== 'undefined') logFormMedications = [];
    if (typeof clearMedTimesDraft === 'function') clearMedTimesDraft();
    if (typeof renderLogMedicationsItems === 'function') renderLogMedicationsItems();
  }
}

function logWizardSkipCurrentStep() {
  var canSkip = currentLogWizardStep > 0 && currentLogWizardStep < LOG_WIZARD_TOTAL_STEPS - 1;
  if (!canSkip) return;
  clearLogWizardStepData(currentLogWizardStep);
  if (currentLogWizardStep < LOG_WIZARD_TOTAL_STEPS - 1) {
    setLogWizardStep(currentLogWizardStep + 1);
  }
}

function logWizardGoBack() {
  if (currentLogWizardStep > 0) {
    setLogWizardStep(currentLogWizardStep - 1);
  } else {
    if (typeof switchTab === 'function') switchTab('home', true);
  }
}

function collectLogDraftSnapshot() {
  var snap = {
    step: currentLogWizardStep,
    food: typeof logFormFoodByCategory !== 'undefined' ? JSON.parse(JSON.stringify(logFormFoodByCategory)) : {},
    exercise: typeof logFormExerciseItems !== 'undefined' ? logFormExerciseItems.slice() : [],
    stressors: typeof logFormStressorsItems !== 'undefined' ? logFormStressorsItems.slice() : [],
    symptoms: typeof logFormSymptomsItems !== 'undefined' ? logFormSymptomsItems.slice() : [],
    medications: typeof logFormMedications !== 'undefined' ? logFormMedications.slice() : [],
    medTimesDraft: typeof medTimesDraftForAdd !== 'undefined' ? medTimesDraftForAdd.slice() : [],
    fields: {}
  };
  var form = document.getElementById('logForm');
  if (!form) return snap;
  form.querySelectorAll('input, select, textarea').forEach(function(el) {
    if (!el.id || el.type === 'file' || el.type === 'button') return;
    if (el.type === 'checkbox') snap.fields[el.id] = el.checked;
    else snap.fields[el.id] = el.value;
  });
  return snap;
}

function persistLogDraftNow() {
  try {
    if (typeof sessionStorage === 'undefined') return;
    sessionStorage.setItem(LOG_DRAFT_STORAGE_KEY, JSON.stringify(collectLogDraftSnapshot()));
  } catch (e) {}
}

function scheduleLogDraftPersist() {
  if (logDraftDebounceTimer) clearTimeout(logDraftDebounceTimer);
  logDraftDebounceTimer = setTimeout(function() {
    logDraftDebounceTimer = null;
    persistLogDraftNow();
  }, 400);
}

function clearLogDraft() {
  try {
    if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(LOG_DRAFT_STORAGE_KEY);
  } catch (e) {}
}

function restoreLogDraftIfAny() {
  try {
    if (typeof sessionStorage === 'undefined') return;
    var raw = sessionStorage.getItem(LOG_DRAFT_STORAGE_KEY);
    if (!raw) return;
    var snap = JSON.parse(raw);
    if (!snap || typeof snap.step !== 'number') return;
    if (snap.food && typeof logFormFoodByCategory !== 'undefined') {
      logFormFoodByCategory = snap.food;
      if (typeof renderLogFoodItems === 'function') renderLogFoodItems();
    }
    if (snap.exercise && typeof logFormExerciseItems !== 'undefined') {
      logFormExerciseItems = snap.exercise;
      if (typeof renderLogExerciseItems === 'function') renderLogExerciseItems();
    }
    if (snap.stressors && typeof logFormStressorsItems !== 'undefined') {
      logFormStressorsItems = snap.stressors;
      if (typeof renderLogStressorsItems === 'function') renderLogStressorsItems();
    }
    if (snap.symptoms && typeof logFormSymptomsItems !== 'undefined') {
      logFormSymptomsItems = snap.symptoms;
      if (typeof renderLogSymptomsItems === 'function') renderLogSymptomsItems();
    }
    if (typeof medTimesDraftForAdd !== 'undefined') {
      if (snap.medTimesDraft && Array.isArray(snap.medTimesDraft)) {
        medTimesDraftForAdd = snap.medTimesDraft
          .map(function(t) { return normalizeMedTimePickerValue(String(t || '')); })
          .filter(Boolean)
          .slice(0, 10);
      } else {
        medTimesDraftForAdd = [];
      }
    }
    if (snap.medications && typeof logFormMedications !== 'undefined') {
      logFormMedications = snap.medications;
      if (typeof renderLogMedicationsItems === 'function') renderLogMedicationsItems();
    } else if (typeof renderMedTimesDraftTags === 'function') {
      renderMedTimesDraftTags();
    }
    if (snap.fields) {
      Object.keys(snap.fields).forEach(function(id) {
        var el = document.getElementById(id);
        if (!el) return;
        if (el.type === 'checkbox') el.checked = !!snap.fields[id];
        else el.value = snap.fields[id];
      });
    }
    ['fatigue', 'stiffness', 'sleep', 'jointPain', 'mobility', 'dailyFunction', 'swelling', 'mood', 'irritability', 'weatherSensitivity'].forEach(function(id) {
      var sl = document.getElementById(id);
      if (sl && typeof updateSliderColor === 'function') updateSliderColor(sl);
    });
    initializeLogWizardSections();
    setLogWizardStep(Math.min(snap.step, LOG_WIZARD_TOTAL_STEPS - 1), true);
  } catch (e) {}
}

function parseAppHash() {
  var h = (typeof location !== 'undefined' && location.hash ? location.hash : '').replace(/^#/, '');
  if (h.toLowerCase() === 'demo') return { tab: 'home' };
  if (!h || h === 'home') return { tab: 'home' };
  if (h.indexOf('log') === 0) {
    var m = h.match(/^log\/step\/(\d+)/);
    if (m) return { tab: 'log', step: Math.max(0, parseInt(m[1], 10) - 1) };
    return { tab: 'log' };
  }
  if (h === 'logs') return { tab: 'logs' };
  if (h === 'charts') return { tab: 'charts' };
  if (h === 'ai') return { tab: 'ai' };
  return { tab: 'home' };
}

function setAppHashFromTab(tab) {
  if (logWizardNavSyncing) return;
  var next = tab === 'log' ? '#log/step/' + (currentLogWizardStep + 1) : '#' + tab;
  if (location.hash === next) return;
  logWizardNavSyncing = true;
  try {
    history.replaceState(null, '', location.pathname + location.search + next);
  } finally {
    setTimeout(function() { logWizardNavSyncing = false; }, 0);
  }
}

function applyHashRoute() {
  var r = parseAppHash();
  if (r.tab === 'ai' && typeof appSettings !== 'undefined' && appSettings.aiEnabled === false) {
    r.tab = 'home';
  }
  if (r.tab === 'log' && typeof r.step === 'number' && !isNaN(r.step)) {
    currentLogWizardStep = r.step;
  }
  switchTab(r.tab, true);
  if (r.tab === 'log' && typeof r.step !== 'number') {
    restoreLogDraftIfAny();
  }
  if (typeof setAppHashFromTab === 'function') {
    setAppHashFromTab(r.tab);
  }
}

function ensureChartsStylesLoaded() {
  if (document.getElementById('chartsDeferredStyles')) return;
  var l = document.createElement('link');
  l.id = 'chartsDeferredStyles';
  l.rel = 'stylesheet';
  l.href = 'styles-charts.css?v=1';
  document.head.appendChild(l);
}

// Tab switching functionality
function switchTab(tabName, skipHash) {
  const allTabs = document.querySelectorAll('.tab-content');
  const selectedTab = document.getElementById(tabName + 'Tab');
  const currentActive = document.querySelector('.tab-content.active');
  if (!selectedTab) return;
  tabNameRef = tabName;
  if (document.body) {
    document.body.classList.toggle('tab-not-home', tabName !== 'home');
  }

  function doSwitch() {
    allTabs.forEach(function(tab) {
      tab.classList.remove('active', 'tab-content--leave');
      tab.style.display = 'none';
    });
    syncMainNavTabs(tabName);
    if (selectedTab) {
      selectedTab.classList.add('active');
      selectedTab.style.display = 'block';
      selectedTab.style.visibility = 'visible';
      selectedTab.style.opacity = '1';
    }
    var selectedBtnTop = document.querySelector('.tab-navigation .tab-btn[data-tab="' + tabName + '"]');
    var nav = document.querySelector('.tab-navigation');
    var indicator = document.getElementById('tabNavIndicator');
    if (nav && indicator) {
      if (selectedBtnTop) {
        var left = selectedBtnTop.offsetLeft;
        var w = selectedBtnTop.offsetWidth;
        indicator.style.width = w + 'px';
        indicator.style.transform = 'translateX(' + left + 'px)';
        indicator.style.opacity = '1';
      } else {
        indicator.style.width = '0';
        indicator.style.opacity = '0';
      }
    }
    var fabWrap = document.getElementById('appFabWrap');
    if (fabWrap) fabWrap.classList.toggle('app-fab-wrap--hidden', tabName === 'log');
    if (tabName !== 'ai') {
      if (typeof teardownAITimelineScroll === 'function') teardownAITimelineScroll();
      var aiMobNav = document.getElementById('aiTimelineMobile');
      if (aiMobNav) {
        aiMobNav.hidden = true;
      }
    } else {
      setTimeout(function() {
        if (typeof updateAIScrollSnapClass === 'function') updateAIScrollSnapClass();
        if (document.querySelector('#aiResultsContent .ai-results-timeline-layout') && typeof syncAITimelineActiveFromScroll === 'function') {
          syncAITimelineActiveFromScroll();
        }
      }, 0);
    }
    /* Same scroll root for every tab: .container.app-main-scroll (mobile shell is viewport-locked) */
    var container = document.querySelector('.container');
    if (container) container.scrollTop = 0;
    if (selectedTab) selectedTab.scrollTop = 0;
    window.scrollTo(0, 0);
    if (tabName === 'home' && typeof updateGoalsProgressBlock === 'function') {
      updateGoalsProgressBlock();
    }
    if (typeof updateHomeTodayPanel === 'function') {
      updateHomeTodayPanel();
    }
    if (tabName === 'log') {
      initializeLogWizardSections();
      setLogWizardStep(typeof currentLogWizardStep === 'number' ? currentLogWizardStep : 0, true);
    }
    if (tabName === 'charts') {
    ensureChartsStylesLoaded();
    const chartSection = document.getElementById('chartSection');
    if (chartSection) {
      chartSection.classList.remove('hidden');
      // Always show balance view when opening the Charts tab
      appSettings.chartView = 'balance';
      saveSettings();
      toggleChartView('balance');
      schedulePrecomputeChartResults();
    }
  }
  
  // View Logs tab: default to last 7 days
  if (tabName === 'logs') {
    if (typeof setLogViewRange === 'function') setLogViewRange(7);
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
    
    // Always load AI panel: empty-state message or analysis (was gated on logs.length, leaving a blank area)
    const deviceOptsAiTab = (window.PerformanceUtils && typeof window.PerformanceUtils.getDeviceOpts === 'function')
      ? window.PerformanceUtils.getDeviceOpts() : { deferAI: false };
    const delayAiTab = deviceOptsAiTab.deferAI ? 800 : 100;
    setTimeout(() => {
      generateAISummary();
    }, delayAiTab);
  }
  
  // Scroll to top smoothly
  window.scrollTo({ top: 0, behavior: 'smooth' });

    if (typeof updateAIScrollSnapClass === 'function') updateAIScrollSnapClass();

    if (typeof updateDashboardTitle === 'function') {
      updateDashboardTitle();
    }

    if (!skipHash && typeof setAppHashFromTab === 'function') {
      setAppHashFromTab(tabName);
    }
  }

  if (currentActive && currentActive !== selectedTab) {
    currentActive.classList.add('tab-content--leave');
    setTimeout(doSwitch, 180);
  } else {
    doSwitch();
  }
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

// Handle unhandled promise rejections (often from extensions). Mirrors early handler in index.html.
function __rianellRejectionText(reason) {
  if (reason == null) return '';
  if (typeof reason === 'string') return reason;
  var m = '';
  try {
    if (reason.message) m += String(reason.message);
    if (reason.stack) m += '\n' + String(reason.stack);
  } catch (e) {}
  try { m += '\n' + String(reason); } catch (e2) {}
  if (!m.trim()) {
    try { m = JSON.stringify(reason); } catch (e3) {}
  }
  return m;
}

/** Keep in sync with early unhandledrejection script in index.html */
function __rianellIsExtensionRejectionBlob(blob) {
  if (!blob || typeof blob !== 'string') return false;
  if (/chrome-extension:|moz-extension:|safari-web-extension:|extension:\/\//i.test(blob)) return true;
  if (/tabs:outgoing|tabs\.outgoing|outgoing\.message\.ready|No\s+Listener:?|i18next|Grammarly|locize|chrome-error:|chromewebdata|vendor\.js|VM\d+\s+vendor|serviceWorker\.js|background\.js/i.test(blob)) return true;
  if (/Frame with ID \d+ was removed|No tab with id|Could not establish connection|Receiving end does not exist|message port closed/i.test(blob)) return true;
  if (/chrome-error:|chromewebdata|Unsafe attempt to load URL/i.test(blob)) return true;
  if (blob.includes('ERR_INVALID_URL') && blob.includes('data:;base64')) return true;
  return false;
}

window.addEventListener('unhandledrejection', (event) => {
  const blob = __rianellRejectionText(event.reason);
  if (__rianellIsExtensionRejectionBlob(blob)) {
    event.preventDefault();
    event.stopImmediatePropagation();
  }
}, true);

// Initialize the app
window.addEventListener('load', () => {
  // Show loading overlay immediately (body.loading keeps overlay visible via CSS)
  const loadingOverlay = document.getElementById('loadingOverlay');
  const loadingTextEl = loadingOverlay ? loadingOverlay.querySelector('.loading-text') : null;
  function finishLoadingOverlayWithBurst(onDone) {
    if (!loadingOverlay) {
      if (typeof onDone === 'function') onDone();
      return;
    }
    if (loadingOverlay.classList.contains('loading-overlay--bursting')) {
      // If a burst is already in progress, do not drop callbacks; complete shortly after.
      if (typeof onDone === 'function') setTimeout(onDone, 660);
      return;
    }
    loadingOverlay.classList.add('loading-overlay--bursting');
    var done = false;
    var complete = function () {
      if (done) return;
      done = true;
      if (typeof onDone === 'function') onDone();
    };
    setTimeout(complete, 640);
  }
    if (loadingTextEl) loadingTextEl.textContent = 'Loading Rianell…';
  
  // Always set dark mode on load
  document.body.classList.remove('light-mode');
  document.body.classList.add('dark-mode');

  function startAfterMotd() {
  loadSettings();

  // Shared link: /#Demo enables demo mode and reloads (or restarts if already in demo).
  try {
    var _demoHash = (typeof location !== 'undefined' && location.hash ? location.hash : '').replace(/^#/, '');
    if (_demoHash.toLowerCase() === 'demo') {
      history.replaceState(null, '', location.pathname + location.search + '#home');
      if (typeof appSettings !== 'undefined' && appSettings.demoMode) {
        location.reload();
        return;
      }
      if (typeof setDemoHashPendingOnboardingIfEligible === 'function') setDemoHashPendingOnboardingIfEligible();
      if (typeof toggleDemoMode === 'function') {
        toggleDemoMode();
        return;
      }
    }
  } catch (e) { /* ignore */ }

  function setOrbitLoadingProgress(percent) {
    var value = Math.max(0, Math.min(100, Math.floor(percent)));
    var orbitHost = loadingOverlay ? loadingOverlay.querySelector('#loadingOrbitProgressHost') : null;
    var orbitProgress = loadingOverlay ? loadingOverlay.querySelector('#loadingOrbitProgress') : null;
    if (orbitHost) orbitHost.style.setProperty('--loading-progress', String(value / 100));
    if (orbitProgress) orbitProgress.setAttribute('aria-valuenow', String(value));
  }

  function runAppInit() {
  tryLockPortraitOrientationMobile();
  if (typeof initEcgHeartbeatLine === 'function') initEcgHeartbeatLine();
  installPerfLongTaskObserver();
  if (window.RianellLogsIDB && typeof window.RianellLogsIDB.migrateFromLocalStorageOnce === 'function') {
    window.RianellLogsIDB.migrateFromLocalStorageOnce();
  }
  try {
    if (typeof performance !== 'undefined' && performance.mark) performance.mark('rianell-init');
  } catch (e) {}
  // Sync platform.deviceClass from DeviceBenchmark if ready (so isLowDevice etc. use benchmark tier)
  if (typeof window !== 'undefined' && window.PerformanceUtils && typeof window.PerformanceUtils.applyBenchmarkToPlatform === 'function') {
    window.PerformanceUtils.applyBenchmarkToPlatform();
  }
  // Tier 5 or GPU-good: enable GPU-friendly chart containers (compositor layer promotion)
  var chartSectionEl = document.getElementById('chartSection');
  if (chartSectionEl && typeof window !== 'undefined' && window.DeviceBenchmark && window.DeviceBenchmark.isBenchmarkReady && window.DeviceBenchmark.isBenchmarkReady()) {
    var platformType = (typeof window.DeviceBenchmark.getPlatformTypeCached === 'function') ? window.DeviceBenchmark.getPlatformTypeCached() : (typeof window.DeviceBenchmark.getPlatformType === 'function' ? window.DeviceBenchmark.getPlatformType() : 'desktop');
    var tier = window.DeviceBenchmark.getPerformanceTier();
    var full = (typeof window.DeviceBenchmark.getFullProfile === 'function') ? window.DeviceBenchmark.getFullProfile(platformType, tier, {}) : {};
    if (tier === 5 || full.gpuGood) {
      chartSectionEl.classList.add('chart-gpu-accelerated');
    }
  }
  // Demo mode: regenerate fresh demo data on every app load (dates/values vary via generateDemoData / rebase)
  if (appSettings.demoMode) {
    console.log('Demo mode: refreshing demo data on load...');
    var demoLogs = getDemoDataDays() === 365
      ? rebaseDatesToRecent(getPremadeMobileDemoLogs())
      : generateDemoData(getDemoDataDays());
    logs = demoLogs;
    if (typeof window !== 'undefined') {
      window.logs = logs;
    }
    migrateLogs();
    saveLogsToStorage();
  }
  
  // Date range and chart section must be set before createCombinedChart (skipRefresh so we don't run createCombinedChart twice)
  try {
    initializeDateFilters();
    setChartDateRange(30, { skipRefresh: true });
    setPredictionRange(7);
  // Use 30 days so charts and log list have data on first load (setLogViewRange overwrites chartDateRange)
  setLogViewRange(30);
  if (appSettings.showCharts) {
      ensureChartsStylesLoaded();
      const chartSection = document.getElementById('chartSection');
      if (chartSection) chartSection.classList.remove('hidden');
    }
  } catch (e) {
    console.error('Error during initial setup:', e);
  }
  
  if (loadingTextEl) loadingTextEl.textContent = 'Loading charts and AI…';

  // Second loading phase: show progress toward completion (benchmark bar was 100% after suite or cache)
  setOrbitLoadingProgress(0);
  var chartsAiProgressVal = 0;
  var chartsAiProgressTimer = setInterval(function () {
    chartsAiProgressVal = Math.min(95, chartsAiProgressVal + Math.random() * 5 + 1.5);
    setOrbitLoadingProgress(chartsAiProgressVal);
  }, 140);

  // Keep loading circle until combined chart and summary LLM are ready (or timeout). On mobile (low device) skip chart build during load to avoid memory spike and tab crash.
  const isLowDevice = typeof window.PerformanceUtils !== 'undefined' && window.PerformanceUtils.platform && window.PerformanceUtils.platform.deviceClass === 'low';
  const needCharts = appSettings.showCharts && chartSectionEl && logs && logs.length > 0 && !isLowDevice;
  const chartsReady = !needCharts
    ? Promise.resolve()
    : runCriticalTask(function () {
        return (typeof createCombinedChart === 'function' ? createCombinedChart() : Promise.resolve()).then(function () {
          window.__chartsBuiltDuringLoad = true;
        }).catch(function () {});
      });
  const aiReady = (appSettings.aiEnabled === false || typeof window.preloadSummaryLLM !== 'function')
    ? Promise.resolve()
    : runCriticalTask(function () {
        var chain = (window.PerformanceUtils && typeof window.PerformanceUtils.ensureAIEngineLoaded === 'function')
          ? window.PerformanceUtils.ensureAIEngineLoaded()
          : Promise.resolve();
        return chain.then(function () {
          return window.preloadSummaryLLM().then(function () {
            return typeof preloadAIForAllRanges === 'function' ? preloadAIForAllRanges() : Promise.resolve();
          });
        }).catch(function () {});
      });
  var loadTimeoutMs = isLowDevice ? 5000 : 12000;
  const timeout = new Promise(function (resolve) { setTimeout(resolve, loadTimeoutMs); });
  
  Promise.race([ Promise.allSettled([ chartsReady, aiReady ]), timeout ]).then(function () {
    clearInterval(chartsAiProgressTimer);
    setOrbitLoadingProgress(100);

    finishLoadingOverlayWithBurst(function () {
      if (loadingOverlay) {
        loadingOverlay.classList.add('hidden');
        document.body.classList.remove('loading');
        document.body.classList.add('loaded');
        showCookieBannerIfNeeded();
        setTimeout(function () { loadingOverlay.remove(); }, 500);
      } else {
        document.body.classList.remove('loading');
        document.body.classList.add('loaded');
        showCookieBannerIfNeeded();
      }
    });

    scheduleDashboardMotdWithLlm(getRandomMotdFallback());

    renderLogs();
    updateCharts();
    if (appSettings.aiEnabled !== false && window.DeviceBenchmark && window.DeviceBenchmark.getCachedResult) {
      var cached = window.DeviceBenchmark.getCachedResult();
      if (cached && cached.gpu && cached.gpu.good) {
        var warm = function() {
          try {
            if (window.AIEngine && typeof window.AIEngine.warmGPUBackend === 'function') {
              window.AIEngine.warmGPUBackend();
            }
          } catch (e) { /* ignore */ }
        };
        var scheduleWarm = function () {
          if (typeof requestIdleCallback !== 'undefined') requestIdleCallback(warm, { timeout: 2000 }); else setTimeout(warm, 800);
        };
        if (window.PerformanceUtils && typeof window.PerformanceUtils.ensureAIEngineLoaded === 'function') {
          window.PerformanceUtils.ensureAIEngineLoaded().then(scheduleWarm).catch(function () {});
        } else {
          scheduleWarm();
        }
      }
    }
    updateAISummaryButtonState();
    var isLow = typeof window.PerformanceUtils !== 'undefined' && window.PerformanceUtils.platform && window.PerformanceUtils.platform.deviceClass === 'low';
    if (!window.__chartsBuiltDuringLoad && !isLow && typeof scheduleChartsPreload === 'function') scheduleChartsPreload();
    window.__chartsBuiltDuringLoad = false;
    if (!isLow && typeof scheduleAIPreload === 'function') scheduleAIPreload();
    clearAISection();
    // Build 14 individual charts after layout so they get correct dimensions (skip if page hidden to avoid memory pressure)
    if (appSettings.showCharts && logs && logs.length > 0 && appSettings.chartView === 'individual') {
      requestAnimationFrame(function() {
        setTimeout(function() {
          if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
          if (typeof updateChartsImmediate === 'function') void updateChartsImmediate().catch(function () {});
        }, 80);
      });
    }
    
    if (!appSettings.weightUnit) {
      appSettings.weightUnit = 'kg';
      saveSettings();
    }
    if (appSettings.medicalCondition) {
      updateConditionContext(appSettings.medicalCondition);
    }
    updateWeightInputConstraints();
    updateHeartbeatAnimation();
    var initParams = typeof URLSearchParams !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    if (initParams && initParams.get('quick') === 'true') {
      switchTab('log', true);
      setLogWizardStep(0, true);
      setTimeout(function() {
        var di = document.getElementById('date');
        if (di) di.focus();
      }, 150);
    } else {
      applyHashRoute();
    }
    initializeSections();
    /* initializeSections() clears .open on all accordions; log wizard needs .open so tile picker rows and section children are not stuck at opacity 0 from slideInUp */
    if (typeof initializeLogWizardSections === 'function') initializeLogWizardSections();
    initializeOneOpenDetails();
    
    const toggleBtn = document.getElementById('predictionToggle');
    if (toggleBtn) {
      toggleBtn.classList.remove('active');
      toggleBtn.title = 'Click to turn off predictions';
    }
    if (typeof NotificationManager !== 'undefined') {
      setTimeout(function () {
        if (typeof updateNotificationPermissionStatus === 'function') {
          updateNotificationPermissionStatus();
        }
      }, 1000);
    }
    // On /tutorial serve tutorial by itself for demo/testing; otherwise show tutorial once for new users
    setTimeout(function () {
      if (typeof isTutorialTestPage === 'function' && isTutorialTestPage()) {
        if (typeof openTutorialModal === 'function') openTutorialModal();
      } else if (typeof tryDemoHashLinkOnboarding === 'function' && tryDemoHashLinkOnboarding()) {
        /* One-time #demo link: random goals + optional tutorial; skip default first-run tutorial */
      } else if (typeof maybeShowTutorialOnce === 'function') {
        maybeShowTutorialOnce();
      }
      if (typeof isTutorialTestPage === 'function' && isTutorialTestPage()) return;
      var tutorialSeen = (function () {
        try { return !!localStorage.getItem('rianellTutorialSeen'); } catch (e) { return true; }
      })();
      if (!tutorialSeen) return;
      var today = new Date();
      var yyyy = today.getFullYear();
      var mm = String(today.getMonth() + 1).padStart(2, '0');
      var dd = String(today.getDate()).padStart(2, '0');
      var todayStr = yyyy + '-' + mm + '-' + dd;
      var hasToday = logs.some(function (log) { return log.date === todayStr; });
      if (!hasToday && !window.matchMedia('(display-mode: standalone)').matches && !window.navigator.standalone && appSettings.reminder !== false) {
        showAlertModal('You have not logged an entry for today.');
      }
    }, 500);
  });
  }

  if (typeof window !== 'undefined' && window.DeviceBenchmark && typeof window.DeviceBenchmark.runBenchmarkIfNeeded === 'function') {
    window.DeviceBenchmark.runBenchmarkIfNeeded(
      function (pct, meta) {
        var label = meta && meta.label ? (' · ' + meta.label) : '';
        if (loadingTextEl) loadingTextEl.textContent = 'Measuring performance…' + (pct > 0 ? ' ' + pct + '%' : '') + label;
        setOrbitLoadingProgress(pct);
      },
      function (tier, platformType, result) {
        setOrbitLoadingProgress(100);
        // Persist benchmark immediately so refreshes do not re-enter first-run flow.
        if (
          result &&
          typeof window !== 'undefined' &&
          window.DeviceBenchmark &&
          typeof window.DeviceBenchmark.saveBenchmarkResult === 'function'
        ) {
          try { window.DeviceBenchmark.saveBenchmarkResult(result); } catch (e) {}
        }
        finishLoadingOverlayWithBurst(function () {
          if (loadingOverlay) {
            loadingOverlay.classList.add('hidden');
            document.body.classList.remove('loading');
          }
          /* index.html hides body > *:not(#loadingOverlay) until .loaded - without this, the first-run
             benchmark modal is visibility:hidden and Continue never fires; runAppInit never runs (stuck). */
          document.body.classList.add('loaded');
          if (openPerfBenchmarkModal({
            mode: 'firstRun',
            result: result || { platformType: platformType, tier: tier },
            onContinue: function () {
              runAppInit();
            }
          }) === false) {
            runAppInit();
          }
        });
      }
    );
  } else {
    runAppInit();
  }
  }

  (typeof loadMotdJson === 'function' ? loadMotdJson() : Promise.resolve()).then(startAfterMotd, startAfterMotd);
  initVoiceInputControls();
});

function initializeDateFilters() {
  const today = new Date();
  // Default View Logs range to Today (1 day)
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const startDateInput = document.getElementById('startDate');
  const endDateInput = document.getElementById('endDate');
  
  if (startDateInput && endDateInput) {
    startDateInput.value = formatDate(today);
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
