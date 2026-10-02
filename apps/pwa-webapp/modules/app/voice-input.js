/**
 * Speech-to-text voice input buttons for eligible text fields (Web Speech API).
 * Extracted from app.js. app.js re-publishes any window.* bindings at their original
 * positions; this module must not import app.js (it is loaded as app.js?v=N).
 */

import { tUi } from './i18n-theme.js';
import { showAlertModal } from './modal-host.js';

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
    showAlertModal(tUi('common.microphone.permission.is.required.for.vo'), tUi('common.voice.input'));
  }
}

async function toggleVoiceInputForField(field, button) {
  var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    if (typeof showAlertModal === 'function') {
      showAlertModal(tUi('common.speech.to.text.is.not.supported.on.this.'), tUi('common.voice.input'));
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
      showAlertModal(tUi('common.no.microphone.detected.connect.a.microph'), tUi('common.voice.input'));
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

export { initVoiceInputControls };
