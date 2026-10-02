/**
 * Cloud sign-in and sign-up form helpers: password visibility toggles and the local password strength meter.
 * Extracted from app.js. app.js re-publishes any window.* bindings at their original
 * positions; this module must not import app.js (it is loaded as app.js?v=N).
 */

import { Logger } from './logger.js';
import { svgIcon } from './dom-safety.js';

function toggleSignupModalPasswordVisibility() {
  const passwordInput = document.getElementById('signupModalPassword');
  const toggleBtn = document.getElementById('signupModalPasswordToggle');
  const toggleIcon = toggleBtn && toggleBtn.querySelector('.password-toggle-icon');
  if (!passwordInput || !toggleBtn || !toggleIcon) return;
  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    toggleIcon.innerHTML = svgIcon('eye', 'ui-svg-icon', 'Hide password');
    toggleBtn.setAttribute('title', 'Hide password');
  } else {
    passwordInput.type = 'password';
    toggleIcon.innerHTML = svgIcon('eye', 'ui-svg-icon', 'Show password');
    toggleBtn.setAttribute('title', 'Show password');
  }
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
    toggleIcon.innerHTML = svgIcon('eye', 'ui-svg-icon', 'Hide password');
    toggleBtn.setAttribute('title', 'Hide password');
  } else {
    passwordInput.type = 'password';
    toggleIcon.innerHTML = svgIcon('eye', 'ui-svg-icon', 'Show password');
    toggleBtn.setAttribute('title', 'Show password');
  }
}

function checkPasswordStrengthLocal(pw) {
  var S = window.RianellShared;
  if (S && typeof S.checkPasswordStrength === 'function') return S.checkPasswordStrength(pw);
  return { score: pw && pw.length >= 12 ? 2 : 0, label: '', feedback: [] };
}

function updatePasswordStrengthUI(inputId, fillId, labelId) {
  var input = document.getElementById(inputId);
  var fill = document.getElementById(fillId);
  var label = document.getElementById(labelId);
  if (!input || !fill) return;
  var result = checkPasswordStrengthLocal(input.value || '');
  var pct = Math.min(100, Math.max(0, (result.score / 4) * 100));
  fill.style.setProperty('--progress', String(Math.max(0, Math.min(100, pct)) / 100));
  var colors = ['#f44336', '#ff9800', '#ffc107', '#8bc34a', '#4caf50'];
  fill.style.backgroundColor = colors[result.score] || colors[0];
  if (label) {
    label.textContent = result.feedback && result.feedback.length
      ? result.feedback.join(' · ')
      : (result.label || '');
  }
}

function initPasswordStrengthBindings() {
  bindPasswordStrengthInput('encryptedExportPassphrase', 'encryptedExportStrengthFill', 'encryptedExportStrengthLabel');
  bindPasswordStrengthInput('shareCreatePassword', 'shareCreateStrengthFill', 'shareCreateStrengthLabel');
  bindPasswordStrengthInput('appLockPinSetupInput', 'appLockSetupStrengthFill', 'appLockSetupStrengthLabel');
  bindPasswordStrengthInput('appLockPinConfirmInput', 'appLockSetupStrengthFill', 'appLockSetupStrengthLabel');
  bindPasswordStrengthInput('appLockPassphraseInput', 'appLockUnlockStrengthFill', 'appLockUnlockStrengthLabel');
}

function bindPasswordStrengthInput(inputId, fillId, labelId) {
  var input = document.getElementById(inputId);
  if (!input || input.__pwStrengthBound) return;
  input.__pwStrengthBound = true;
  input.addEventListener('input', function () {
    updatePasswordStrengthUI(inputId, fillId, labelId);
  });
}

export { toggleSignupModalPasswordVisibility, togglePasswordVisibility, checkPasswordStrengthLocal, updatePasswordStrengthUI, initPasswordStrengthBindings };
