// ============================================
// NOTIFICATIONS & REMINDERS
// Safari Web App notifications and daily reminders
// Android: when running in Capacitor, uses native LocalNotifications for compatibility (permissions, background)
// Sound: respects "Enable sound notifications" and plays heartbeat when app is in foreground.
// ============================================

const isCapacitor = typeof window.Capacitor !== 'undefined' && window.Capacitor.isNativePlatform?.();
const LocalNotifications = isCapacitor && window.Capacitor?.Plugins?.LocalNotifications;
function isSoundEnabled() {
  var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("notifications.js", "isSoundEnabled", arguments) : undefined;
  try {
    try {
      const s = localStorage.getItem('rianellSettings');
      return s ? JSON.parse(s).sound === true : false;
    } catch (e) {
      return false;
    }
  } finally {
    __rianellTraceExit(__rt);
  }
}
var _heartbeatAudioContext = null;
function getAudioContext() {
  var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("notifications.js", "getAudioContext", arguments) : undefined;
  try {
    if (_heartbeatAudioContext) return _heartbeatAudioContext;
    if (typeof window.AudioContext !== 'undefined') _heartbeatAudioContext = new window.AudioContext();else if (typeof window.webkitAudioContext !== 'undefined') _heartbeatAudioContext = new window.webkitAudioContext();
    return _heartbeatAudioContext;
  } finally {
    __rianellTraceExit(__rt);
  }
}

/**
 * Play a short heartbeat-monitor style sound (lub-dub, lub-dub) using Web Audio.
 * Works on mobile when AudioContext is allowed (e.g. after user interaction).
 */
function playHeartbeatSound() {
  var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("notifications.js", "playHeartbeatSound", arguments) : undefined;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      if (ctx.state === 'suspended') ctx.resume();
    } catch (e) {/* ignore */}
    const now = ctx.currentTime;
    const gainNode = ctx.createGain();
    gainNode.connect(ctx.destination);
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.35, now + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    function beep(start, freq, duration) {
      var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("notifications.js", "beep", arguments) : undefined;
      try {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        osc.connect(gainNode);
        osc.start(start);
        osc.stop(start + duration);
      } finally {
        __rianellTraceExit(__rt);
      }
    }
    // Lub-dub pattern: low then slightly higher, twice (like a heartbeat monitor)
    const lubHz = 90;
    const dubHz = 110;
    const lubLen = 0.1;
    const dubLen = 0.07;
    const gap = 0.06;
    const pause = 0.38;
    beep(now, lubHz, lubLen);
    beep(now + lubLen + gap, dubHz, dubLen);
    beep(now + lubLen + gap + dubLen + pause, lubHz, lubLen);
    beep(now + lubLen + gap + dubLen + pause + lubLen + gap, dubHz, dubLen);
  } finally {
    __rianellTraceExit(__rt);
  }
}
const NotificationManager = {
  permission: null,
  reminderTime: null,
  reminderInterval: null,
  nativeNotificationId: 9001,
  initialized: false,
  // Initialize notification system
  async init() {
    var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("notifications.js", "init", arguments) : undefined;
    try {
      if (this.initialized) return; // Prevent double initialization
      this.initialized = true;
      if (!(typeof window.isRianellNativeApp === 'function' && window.isRianellNativeApp())) {
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone || document.referrer.includes('android-app://');
        if (!isStandalone) {
          this.showInstallPrompt();
        }
      }
      if (LocalNotifications) {
        try {
          const {
            display
          } = await LocalNotifications.checkPermissions();
          this.permission = display === 'granted' ? 'granted' : display === 'denied' ? 'denied' : 'default';
        } catch (e) {/* ignore */}
      }
      await this.requestPermission();

      // Load saved reminder time
      this.loadReminderSettings();

      // Schedule reminders if enabled
      if (this.isReminderEnabled()) {
        this.scheduleReminders();
      }

      // Check if we need to show today's reminder
      this.checkTodayReminder();
    } finally {
      __rianellTraceExit(__rt);
    }
  },
  // Show install prompt for Safari
  showInstallPrompt() {
    var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("notifications.js", "showInstallPrompt", arguments) : undefined;
    try {
      if (typeof window.isRianellNativeApp === 'function' && window.isRianellNativeApp()) return;
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone || document.referrer.includes('android-app://');
      if (isStandalone) return;

      // Check if user has dismissed the prompt
      const dismissed = localStorage.getItem('installPromptDismissed');
      if (dismissed) return;

      // Only show on iOS Safari or Android Chrome
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isAndroid = /Android/.test(navigator.userAgent);
      const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome|CriOS|FxiOS/.test(navigator.userAgent);
      const isChrome = /Chrome/.test(navigator.userAgent) && !/Edg/.test(navigator.userAgent);
      if (isIOS && isSafari || isAndroid && isChrome) {
        setTimeout(() => {
          var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("notifications.js", "[arrow]", undefined) : undefined;
          try {
            if (typeof showAlertModal === 'function') {
              const instructions = isIOS ? '📱 Add to Home Screen\n\n1. Tap the Share button (□↑) at the bottom\n2. Scroll down and tap "Add to Home Screen"\n3. Tap "Add" to install\n\nYou\'ll get daily reminders and can use it like a native app!' : '📱 Install App\n\n1. Tap the menu (⋮) in the top right\n2. Tap "Add to Home screen" or "Install app"\n3. Tap "Add" or "Install"\n\nYou\'ll get daily reminders and can use it like a native app!';
              showAlertModal(instructions, 'Install App');

              // Store dismissal (user can re-enable in settings if needed)
              setTimeout(() => {
                var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("notifications.js", "[arrow]", undefined) : undefined;
                try {
                  localStorage.setItem('installPromptDismissed', 'true');
                } finally {
                  __rianellTraceExit(__rt);
                }
              }, 10000); // Auto-dismiss after 10 seconds
            }
          } finally {
            __rianellTraceExit(__rt);
          }
        }, 3000); // Show after 3 seconds
      }
    } finally {
      __rianellTraceExit(__rt);
    }
  },
  // Request notification permission
  async requestPermission() {
    var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("notifications.js", "requestPermission", arguments) : undefined;
    try {
      if (LocalNotifications) {
        try {
          const {
            display
          } = await LocalNotifications.requestPermissions();
          this.permission = display === 'granted' ? 'granted' : display === 'denied' ? 'denied' : 'default';
          if (this.permission === 'granted') return true;
        } catch (e) {
          console.warn('Capacitor LocalNotifications permission request failed:', e);
        }
      }
      if (!('Notification' in window)) {
        console.warn('This browser does not support notifications');
        return false;
      }
      if (Notification.permission === 'granted') {
        this.permission = 'granted';
        return true;
      }
      if (Notification.permission === 'denied') {
        this.permission = 'denied';
        return false;
      }
      try {
        const permission = await Notification.requestPermission();
        this.permission = permission;
        return permission === 'granted';
      } catch (error) {
        console.error('Error requesting notification permission:', error);
        return false;
      }
    } finally {
      __rianellTraceExit(__rt);
    }
  },
  // Check if reminder is enabled
  isReminderEnabled() {
    var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("notifications.js", "isReminderEnabled", arguments) : undefined;
    try {
      try {
        const settings = JSON.parse(localStorage.getItem('rianellSettings') || '{}');
        return settings.reminder !== false; // Default to true
      } catch (e) {
        return true;
      }
    } finally {
      __rianellTraceExit(__rt);
    }
  },
  // Load reminder settings
  loadReminderSettings() {
    var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("notifications.js", "loadReminderSettings", arguments) : undefined;
    try {
      try {
        const settings = JSON.parse(localStorage.getItem('rianellSettings') || '{}');
        this.reminderTime = settings.reminderTime || '20:00'; // Default 8 PM
      } catch (e) {
        this.reminderTime = '20:00';
      }
    } finally {
      __rianellTraceExit(__rt);
    }
  },
  // Save reminder settings
  saveReminderSettings() {
    var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("notifications.js", "saveReminderSettings", arguments) : undefined;
    try {
      try {
        const settings = JSON.parse(localStorage.getItem('rianellSettings') || '{}');
        settings.reminderTime = this.reminderTime;
        localStorage.setItem('rianellSettings', JSON.stringify(settings));
      } catch (e) {
        console.error('Error saving reminder settings:', e);
      }
    } finally {
      __rianellTraceExit(__rt);
    }
  },
  // Schedule daily reminders
  async scheduleReminders() {
    var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("notifications.js", "scheduleReminders", arguments) : undefined;
    try {
      // Clear existing interval
      if (this.reminderInterval) {
        clearInterval(this.reminderInterval);
        this.reminderInterval = null;
      }
      if (LocalNotifications) {
        await this.scheduleNativeReminder();
        return;
      }

      // Web/PWA fallback: check every minute if it's time for reminder.
      this.reminderInterval = setInterval(() => {
        var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("notifications.js", "[arrow]", undefined) : undefined;
        try {
          this.checkReminderTime();
        } finally {
          __rianellTraceExit(__rt);
        }
      }, 60000);
      this.checkReminderTime();
    } finally {
      __rianellTraceExit(__rt);
    }
  },
  getNextReminderDate() {
    var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("notifications.js", "getNextReminderDate", arguments) : undefined;
    try {
      const [hours, minutes] = String(this.reminderTime || '20:00').split(':').map(Number);
      const now = new Date();
      const next = new Date();
      next.setHours(Number.isFinite(hours) ? hours : 20, Number.isFinite(minutes) ? minutes : 0, 0, 0);
      if (next <= now) {
        next.setDate(next.getDate() + 1);
      }
      return next;
    } finally {
      __rianellTraceExit(__rt);
    }
  },
  async scheduleNativeReminder() {
    var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("notifications.js", "scheduleNativeReminder", arguments) : undefined;
    try {
      if (!LocalNotifications) return;
      try {
        if (this.permission !== 'granted') {
          await this.requestPermission();
        }
        if (this.permission !== 'granted') return;
        await LocalNotifications.cancel({
          notifications: [{
            id: this.nativeNotificationId
          }]
        });
        const at = this.getNextReminderDate();
        await LocalNotifications.schedule({
          notifications: [{
            id: this.nativeNotificationId,
            title: 'Time to log your health data! 📊',
            body: 'Don\'t forget to record today\'s health metrics.',
            schedule: {
              on: {
                hour: at.getHours(),
                minute: at.getMinutes()
              },
              allowWhileIdle: true
            },
            actionTypeId: '',
            extra: {
              url: '/?quick=true'
            }
          }]
        });
      } catch (error) {
        console.warn('Failed to schedule native reminder:', error);
      }
    } finally {
      __rianellTraceExit(__rt);
    }
  },
  // Check if it's time for reminder
  checkReminderTime() {
    var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("notifications.js", "checkReminderTime", arguments) : undefined;
    try {
      if (!this.isReminderEnabled()) return;
      if (this.permission !== 'granted') return;
      const now = new Date();
      const [hours, minutes] = this.reminderTime.split(':').map(Number);
      const reminderTime = new Date();
      reminderTime.setHours(hours, minutes, 0, 0);

      // Check if current time is within 1 minute of reminder time
      const timeDiff = Math.abs(now - reminderTime);
      if (timeDiff < 60000) {
        // Within 1 minute
        // Check if we already sent a reminder today
        const lastReminder = localStorage.getItem('lastReminderDate');
        const today = now.toDateString();
        if (lastReminder !== today) {
          this.sendDailyReminder();
          localStorage.setItem('lastReminderDate', today);
        }
      }
    } finally {
      __rianellTraceExit(__rt);
    }
  },
  // Send daily reminder notification
  async sendDailyReminder() {
    var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("notifications.js", "sendDailyReminder", arguments) : undefined;
    try {
      if (this.permission !== 'granted') return;

      // Check if entry already exists for today
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const logs = JSON.parse(localStorage.getItem('healthLogs') || '[]');
      const hasToday = logs.some(log => log.date === todayStr);
      if (hasToday) {
        // Already logged today, send encouragement
        this.showNotification('Great job! 🎉', 'You\'ve already logged your health data today. Keep up the good work!', '/?quick=true');
      } else {
        // Remind to log
        this.showNotification('Time to log your health data! 📊', 'Don\'t forget to record today\'s health metrics.', '/?quick=true');
      }
    } finally {
      __rianellTraceExit(__rt);
    }
  },
  // Show notification (respects sound setting: silent when sound off, system sound + optional heartbeat when on)
  async showNotification(title, body, url = '/') {
    var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("notifications.js", "showNotification", arguments) : undefined;
    try {
      if (this.permission !== 'granted') return;
      const silent = !isSoundEnabled();
      const opts = {
        body: body,
        icon: '/Icons/beta/Icon-192.png',
        badge: '/Icons/beta/Icon-72.png',
        tag: 'health-reminder',
        requireInteraction: false,
        silent: silent,
        data: {
          url: url,
          timestamp: Date.now()
        },
        actions: [{
          action: 'open',
          title: 'Open App'
        }, {
          action: 'dismiss',
          title: 'Dismiss'
        }]
      };
      try {
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.ready;
          await registration.showNotification(title, opts);
        } else {
          const notification = new Notification(title, {
            body: opts.body,
            icon: opts.icon,
            badge: opts.badge,
            tag: opts.tag,
            requireInteraction: opts.requireInteraction,
            silent: opts.silent,
            data: opts.data
          });
          notification.onclick = () => {
            var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("notifications.js", "[arrow]", undefined) : undefined;
            try {
              window.focus();
              const openUrl = url && url.startsWith('http') ? url : window.location.origin + (url && url.startsWith('/') ? url : '/' + (url || '?quick=true'));
              window.location.href = openUrl;
              notification.close();
            } finally {
              __rianellTraceExit(__rt);
            }
          };
        }
        if (document.visibilityState === 'visible' && !silent && typeof playHeartbeatSound === 'function') {
          playHeartbeatSound();
        }
      } catch (error) {
        console.error('Error showing notification:', error);
      }
    } finally {
      __rianellTraceExit(__rt);
    }
  },
  // Check if we need to show today's reminder (in-app)
  checkTodayReminder() {
    var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("notifications.js", "checkTodayReminder", arguments) : undefined;
    try {
      if (!this.isReminderEnabled()) return;
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const logs = JSON.parse(localStorage.getItem('healthLogs') || '[]');
      const hasToday = logs.some(log => log.date === todayStr);
      if (!hasToday && document.visibilityState === 'visible') {
        const lastInAppReminder = localStorage.getItem('lastInAppReminderDate');
        if (lastInAppReminder !== todayStr) {
          setTimeout(() => {
            var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("notifications.js", "[arrow]", undefined) : undefined;
            try {
              if (isSoundEnabled() && typeof playHeartbeatSound === 'function') {
                playHeartbeatSound();
              }
              if (typeof showAlertModal === 'function') {
                showAlertModal('📊 Don\'t forget to log today\'s health data!', 'Daily Reminder');
                localStorage.setItem('lastInAppReminderDate', todayStr);
              }
            } finally {
              __rianellTraceExit(__rt);
            }
          }, 2000);
        }
      }
    } finally {
      __rianellTraceExit(__rt);
    }
  },
  // Set reminder time
  async setReminderTime(time) {
    var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("notifications.js", "setReminderTime", arguments) : undefined;
    try {
      this.reminderTime = time;
      this.saveReminderSettings();
      if (this.isReminderEnabled()) {
        await this.scheduleReminders();
      }
    } finally {
      __rianellTraceExit(__rt);
    }
  },
  // Enable/disable reminders
  async setReminderEnabled(enabled) {
    var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("notifications.js", "setReminderEnabled", arguments) : undefined;
    try {
      try {
        const settings = JSON.parse(localStorage.getItem('rianellSettings') || '{}');
        settings.reminder = enabled;
        localStorage.setItem('rianellSettings', JSON.stringify(settings));
        if (enabled) {
          await this.scheduleReminders();
        } else {
          if (LocalNotifications) {
            try {
              await LocalNotifications.cancel({
                notifications: [{
                  id: this.nativeNotificationId
                }]
              });
            } catch (e) {/* ignore */}
          }
          if (this.reminderInterval) {
            clearInterval(this.reminderInterval);
            this.reminderInterval = null;
          }
        }
      } catch (e) {
        console.error('Error setting reminder:', e);
      }
    } finally {
      __rianellTraceExit(__rt);
    }
  }
};

// Handle notification clicks from service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', event => {
    var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("notifications.js", "[arrow]", undefined) : undefined;
    try {
      if (event.data && event.data.type === 'NOTIFICATION_CLICK') {
        const url = event.data.url || '/';
        window.focus();
        window.location.href = url;
      }
    } finally {
      __rianellTraceExit(__rt);
    }
  });
}

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("notifications.js", "[arrow]", undefined) : undefined;
    try {
      NotificationManager.init();
    } finally {
      __rianellTraceExit(__rt);
    }
  });
} else {
  NotificationManager.init();
}

// Make available globally
window.NotificationManager = NotificationManager;
window.isSoundEnabled = isSoundEnabled;
window.playHeartbeatSound = playHeartbeatSound;
window.getAudioContext = getAudioContext;