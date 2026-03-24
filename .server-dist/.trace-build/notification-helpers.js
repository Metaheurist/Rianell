// ============================================
// NOTIFICATION HELPER FUNCTIONS
// Functions called from HTML/event handlers
// ============================================

// Update reminder time
function updateReminderTime() {
  var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("notification-helpers.js", "updateReminderTime", arguments) : undefined;
  try {
    const timeInput = document.getElementById('reminderTime');
    if (timeInput && typeof NotificationManager !== 'undefined') {
      NotificationManager.setReminderTime(timeInput.value);
      if (typeof showAlertModal === 'function') {
        showAlertModal(`Reminder time set to ${timeInput.value}`, 'Settings Saved');
      }
    }
  } finally {
    __rianellTraceExit(__rt);
  }
}

// Request notification permission
async function requestNotificationPermission() {
  var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("notification-helpers.js", "requestNotificationPermission", arguments) : undefined;
  try {
    // Check if notifications are supported
    if (!('Notification' in window)) {
      if (typeof showAlertModal === 'function') {
        showAlertModal('This browser does not support notifications.', 'Not Supported');
      }
      return;
    }

    // Check current permission status
    const currentPermission = Notification.permission;

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
        } catch (e) {/* unlock AudioContext for mobile */}
      }
      const granted = await NotificationManager.requestPermission();
      updateNotificationPermissionStatus();
      if (granted) {
        if (typeof showAlertModal === 'function') {
          showAlertModal('Notification permission granted! You\'ll receive daily reminders.', 'Permission Granted');
        }
        setTimeout(() => {
          var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("notification-helpers.js", "[arrow]", undefined) : undefined;
          try {
            if (typeof NotificationManager !== 'undefined' && NotificationManager.showNotification) {
              NotificationManager.showNotification('Notifications enabled! ✅', 'You\'ll receive daily reminders to log your health data.', '/');
            }
          } finally {
            __rianellTraceExit(__rt);
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
  } finally {
    __rianellTraceExit(__rt);
  }
}

// Update notification permission status display
function updateNotificationPermissionStatus() {
  var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("notification-helpers.js", "updateNotificationPermissionStatus", arguments) : undefined;
  try {
    const statusEl = document.getElementById('notificationPermissionStatus');
    const buttonEl = statusEl ? statusEl.parentElement : null;
    if (!statusEl) return;
    if (!('Notification' in window)) {
      statusEl.textContent = 'Not Supported';
      if (buttonEl) {
        buttonEl.disabled = true;
        buttonEl.style.opacity = '0.5';
        buttonEl.style.cursor = 'not-allowed';
      }
      return;
    }
    const permission = Notification.permission;
    switch (permission) {
      case 'granted':
        statusEl.textContent = '✓ Granted';
        if (buttonEl) {
          buttonEl.style.background = 'rgba(76, 175, 80, 0.2)';
          buttonEl.style.cursor = 'default';
          buttonEl.disabled = false;
          buttonEl.style.opacity = '1';
        }
        break;
      case 'denied':
        statusEl.textContent = '✗ Denied';
        if (buttonEl) {
          buttonEl.style.background = 'rgba(244, 67, 54, 0.2)';
          buttonEl.style.cursor = 'default';
          buttonEl.disabled = false;
          buttonEl.style.opacity = '1';
        }
        break;
      default:
        statusEl.textContent = 'Request Permission';
        if (buttonEl) {
          buttonEl.style.background = 'rgba(255, 255, 255, 0.05)';
          buttonEl.style.cursor = 'pointer';
          buttonEl.disabled = false;
          buttonEl.style.opacity = '1';
        }
    }
  } finally {
    __rianellTraceExit(__rt);
  }
}

// Make functions available globally
window.updateReminderTime = updateReminderTime;
window.requestNotificationPermission = requestNotificationPermission;
window.updateNotificationPermissionStatus = updateNotificationPermissionStatus;