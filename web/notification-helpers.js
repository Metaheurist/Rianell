// ============================================
// NOTIFICATION HELPER FUNCTIONS
// Functions called from HTML/event handlers
// ============================================

function isNativeNotificationCapable() {
  return !!(window.Capacitor && window.Capacitor.isNativePlatform?.() && window.Capacitor?.Plugins?.LocalNotifications);
}

function getNotificationPermissionState() {
  if (isNativeNotificationCapable()) {
    var managerPermission = (typeof NotificationManager !== 'undefined' && NotificationManager && NotificationManager.permission) || 'default';
    if (managerPermission === 'granted' || managerPermission === 'denied') return managerPermission;
    return 'default';
  }
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

// Update reminder time
function updateReminderTime() {
  const timeInput = document.getElementById('reminderTime');
  if (timeInput && typeof NotificationManager !== 'undefined') {
    NotificationManager.setReminderTime(timeInput.value);
    if (typeof showAlertModal === 'function') {
      showAlertModal(`Reminder time set to ${timeInput.value}`, 'Settings Saved');
    }
  }
}

// Request notification permission
async function requestNotificationPermission() {
  var nativeCapable = isNativeNotificationCapable();
  const currentPermission = getNotificationPermissionState();

  if (!nativeCapable && currentPermission === 'unsupported') {
    if (typeof showAlertModal === 'function') {
      showAlertModal('This browser does not support notifications.', 'Not Supported');
    }
    return;
  }
  
  // If already granted, show message and return
  if (currentPermission === 'granted') {
    if (typeof showAlertModal === 'function') {
      showAlertModal('Notification permission is already granted! You\'ll receive daily reminders.', 'Already Granted');
    }
    // Update status display
    updateNotificationPermissionStatus();
    return;
  }
  
  // If denied, inform user they need to change browser settings
  if (currentPermission === 'denied') {
    if (typeof showAlertModal === 'function') {
      showAlertModal('Notification permission was denied. Please enable it in your browser settings to receive reminders.', 'Permission Denied');
    }
    updateNotificationPermissionStatus();
    return;
  }
  
  // Check if NotificationManager is available
  if (typeof NotificationManager === 'undefined') {
    if (typeof showAlertModal === 'function') {
      showAlertModal('Notification system not loaded. Please refresh the page.', 'Error');
    }
    return;
  }
  
  // Request permission (only if default/prompt state)
  try {
    if (typeof getAudioContext === 'function') {
      try {
        const ctx = getAudioContext();
        if (ctx && ctx.resume) ctx.resume();
      } catch (e) { /* unlock AudioContext for mobile */ }
    }
    const granted = await NotificationManager.requestPermission();
    updateNotificationPermissionStatus();
    
    if (granted) {
      if (typeof showAlertModal === 'function') {
        showAlertModal('Notification permission granted! You\'ll receive daily reminders.', 'Permission Granted');
      }
      setTimeout(() => {
        if (typeof NotificationManager !== 'undefined' && NotificationManager.showNotification) {
          NotificationManager.showNotification(
            'Notifications enabled! ✅',
            'You\'ll receive daily reminders to log your health data.',
            '/'
          );
        }
      }, 500);
    } else {
      if (typeof showAlertModal === 'function') {
        showAlertModal('Notification permission denied. Please enable it in your browser settings to receive reminders.', 'Permission Denied');
      }
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    if (typeof showAlertModal === 'function') {
      showAlertModal('An error occurred while requesting notification permission.', 'Error');
    }
  }
}

// Update notification permission status display
function updateNotificationPermissionStatus() {
  const statusEl = document.getElementById('notificationPermissionStatus');
  const buttonEl = statusEl ? statusEl.parentElement : null;
  if (!statusEl) return;
  if (buttonEl) {
    buttonEl.classList.remove('is-granted', 'is-denied', 'is-default');
  }

  const nativeCapable = isNativeNotificationCapable();
  const permission = getNotificationPermissionState();
  if (!nativeCapable && permission === 'unsupported') {
    statusEl.textContent = 'Not Supported';
    if (buttonEl) {
      buttonEl.disabled = true;
      buttonEl.style.opacity = '0.5';
      buttonEl.style.cursor = 'not-allowed';
      buttonEl.classList.add('is-default');
    }
    return;
  }
  switch (permission) {
    case 'granted':
      statusEl.textContent = '✓ Granted';
      if (buttonEl) {
        buttonEl.style.cursor = 'default';
        buttonEl.disabled = false;
        buttonEl.style.opacity = '1';
        buttonEl.classList.add('is-granted');
      }
      break;
    case 'denied':
      statusEl.textContent = '✗ Denied';
      if (buttonEl) {
        buttonEl.style.cursor = 'default';
        buttonEl.disabled = false;
        buttonEl.style.opacity = '1';
        buttonEl.classList.add('is-denied');
      }
      break;
    default:
      statusEl.textContent = 'Request Permission';
      if (buttonEl) {
        buttonEl.style.cursor = 'pointer';
        buttonEl.disabled = false;
        buttonEl.style.opacity = '1';
        buttonEl.classList.add('is-default');
      }
  }
}

// Make functions available globally
window.updateReminderTime = updateReminderTime;
window.requestNotificationPermission = requestNotificationPermission;
window.updateNotificationPermissionStatus = updateNotificationPermissionStatus;
