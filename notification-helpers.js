// ============================================
// NOTIFICATION HELPER FUNCTIONS
// Functions called from HTML/event handlers
// ============================================

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
  // Close settings modal if open
  const settingsOverlay = document.getElementById('settingsOverlay');
  if (settingsOverlay && settingsOverlay.style.display === 'flex') {
    if (typeof toggleSettings === 'function') {
      toggleSettings();
    } else {
      settingsOverlay.style.display = 'none';
    }
  }
  
  if (typeof NotificationManager === 'undefined') {
    if (typeof showAlertModal === 'function') {
      showAlertModal('Notification system not loaded. Please refresh the page.', 'Error');
    }
    return;
  }
  
  const granted = await NotificationManager.requestPermission();
  updateNotificationPermissionStatus();
  
  if (granted) {
    if (typeof showAlertModal === 'function') {
      showAlertModal('Notification permission granted! You\'ll receive daily reminders.', 'Permission Granted');
    }
    // Test notification
    setTimeout(() => {
      NotificationManager.showNotification(
        'Notifications enabled! ✅',
        'You\'ll receive daily reminders to log your health data.',
        '/'
      );
    }, 500);
  } else {
    if (typeof showAlertModal === 'function') {
      showAlertModal('Notification permission denied. Please enable it in your browser settings to receive reminders.', 'Permission Denied');
    }
  }
}

// Update notification permission status display
function updateNotificationPermissionStatus() {
  const statusEl = document.getElementById('notificationPermissionStatus');
  if (!statusEl) return;
  
  if (!('Notification' in window)) {
    statusEl.textContent = 'Not Supported';
    statusEl.parentElement.disabled = true;
    return;
  }
  
  const permission = Notification.permission;
  switch (permission) {
    case 'granted':
      statusEl.textContent = '✓ Granted';
      statusEl.parentElement.style.background = 'rgba(76, 175, 80, 0.2)';
      break;
    case 'denied':
      statusEl.textContent = '✗ Denied';
      statusEl.parentElement.style.background = 'rgba(244, 67, 54, 0.2)';
      break;
    default:
      statusEl.textContent = 'Request Permission';
      statusEl.parentElement.style.background = 'rgba(255, 255, 255, 0.05)';
  }
}

// Make functions available globally
window.updateReminderTime = updateReminderTime;
window.requestNotificationPermission = requestNotificationPermission;
window.updateNotificationPermissionStatus = updateNotificationPermissionStatus;
