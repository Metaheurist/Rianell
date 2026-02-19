// ============================================
// NOTIFICATIONS & REMINDERS
// Safari Web App notifications and daily reminders
// ============================================

const NotificationManager = {
  permission: null,
  reminderTime: null,
  reminderInterval: null,
  initialized: false,
  
  // Initialize notification system
  async init() {
    if (this.initialized) return; // Prevent double initialization
    this.initialized = true;
    // Check if we're in a standalone mode (added to home screen)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         window.navigator.standalone || 
                         document.referrer.includes('android-app://');
    
    if (!isStandalone) {
      // Show install prompt for Safari
      this.showInstallPrompt();
    }
    
    // Request notification permission
    await this.requestPermission();
    
    // Load saved reminder time
    this.loadReminderSettings();
    
    // Schedule reminders if enabled
    if (this.isReminderEnabled()) {
      this.scheduleReminders();
    }
    
    // Check if we need to show today's reminder
    this.checkTodayReminder();
  },
  
  // Show install prompt for Safari
  showInstallPrompt() {
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         window.navigator.standalone || 
                         document.referrer.includes('android-app://');
    if (isStandalone) return;
    
    // Check if user has dismissed the prompt
    const dismissed = localStorage.getItem('installPromptDismissed');
    if (dismissed) return;
    
    // Only show on iOS Safari or Android Chrome
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome|CriOS|FxiOS/.test(navigator.userAgent);
    const isChrome = /Chrome/.test(navigator.userAgent) && !/Edg/.test(navigator.userAgent);
    
    if ((isIOS && isSafari) || (isAndroid && isChrome)) {
      setTimeout(() => {
        if (typeof showAlertModal === 'function') {
          const instructions = isIOS 
            ? '📱 Add to Home Screen\n\n1. Tap the Share button (□↑) at the bottom\n2. Scroll down and tap "Add to Home Screen"\n3. Tap "Add" to install\n\nYou\'ll get daily reminders and can use it like a native app!'
            : '📱 Install App\n\n1. Tap the menu (⋮) in the top right\n2. Tap "Add to Home screen" or "Install app"\n3. Tap "Add" or "Install"\n\nYou\'ll get daily reminders and can use it like a native app!';
          
          showAlertModal(instructions, 'Install App');
          
          // Store dismissal (user can re-enable in settings if needed)
          setTimeout(() => {
            localStorage.setItem('installPromptDismissed', 'true');
          }, 10000); // Auto-dismiss after 10 seconds
        }
      }, 3000); // Show after 3 seconds
    }
  },
  
  // Request notification permission
  async requestPermission() {
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
    
    // Request permission
    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  },
  
  // Check if reminder is enabled
  isReminderEnabled() {
    try {
      const settings = JSON.parse(localStorage.getItem('healthAppSettings') || '{}');
      return settings.reminder !== false; // Default to true
    } catch (e) {
      return true;
    }
  },
  
  // Load reminder settings
  loadReminderSettings() {
    try {
      const settings = JSON.parse(localStorage.getItem('healthAppSettings') || '{}');
      this.reminderTime = settings.reminderTime || '20:00'; // Default 8 PM
    } catch (e) {
      this.reminderTime = '20:00';
    }
  },
  
  // Save reminder settings
  saveReminderSettings() {
    try {
      const settings = JSON.parse(localStorage.getItem('healthAppSettings') || '{}');
      settings.reminderTime = this.reminderTime;
      localStorage.setItem('healthAppSettings', JSON.stringify(settings));
    } catch (e) {
      console.error('Error saving reminder settings:', e);
    }
  },
  
  // Schedule daily reminders
  scheduleReminders() {
    // Clear existing interval
    if (this.reminderInterval) {
      clearInterval(this.reminderInterval);
    }
    
    // Check every minute if it's time for reminder
    this.reminderInterval = setInterval(() => {
      this.checkReminderTime();
    }, 60000); // Check every minute
    
    // Also check immediately
    this.checkReminderTime();
  },
  
  // Check if it's time for reminder
  checkReminderTime() {
    if (!this.isReminderEnabled()) return;
    if (this.permission !== 'granted') return;
    
    const now = new Date();
    const [hours, minutes] = this.reminderTime.split(':').map(Number);
    const reminderTime = new Date();
    reminderTime.setHours(hours, minutes, 0, 0);
    
    // Check if current time is within 1 minute of reminder time
    const timeDiff = Math.abs(now - reminderTime);
    if (timeDiff < 60000) { // Within 1 minute
      // Check if we already sent a reminder today
      const lastReminder = localStorage.getItem('lastReminderDate');
      const today = now.toDateString();
      
      if (lastReminder !== today) {
        this.sendDailyReminder();
        localStorage.setItem('lastReminderDate', today);
      }
    }
  },
  
  // Send daily reminder notification
  async sendDailyReminder() {
    if (this.permission !== 'granted') return;
    
    // Check if entry already exists for today
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const logs = JSON.parse(localStorage.getItem('healthLogs') || '[]');
    const hasToday = logs.some(log => log.date === todayStr);
    
    if (hasToday) {
      // Already logged today, send encouragement
      this.showNotification(
        'Great job! 🎉',
        'You\'ve already logged your health data today. Keep up the good work!',
        '/?quick=true'
      );
    } else {
      // Remind to log
      this.showNotification(
        'Time to log your health data! 📊',
        'Don\'t forget to record today\'s health metrics.',
        '/?quick=true'
      );
    }
  },
  
  // Show notification
  async showNotification(title, body, url = '/') {
    if (this.permission !== 'granted') return;
    
    try {
      // Use service worker registration if available
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        
        await registration.showNotification(title, {
          body: body,
          icon: '/Icons/Icon-192.png',
          badge: '/Icons/Icon-72.png',
          tag: 'health-reminder',
          requireInteraction: false,
          data: {
            url: url,
            timestamp: Date.now()
          },
          actions: [
            {
              action: 'open',
              title: 'Open App'
            },
            {
              action: 'dismiss',
              title: 'Dismiss'
            }
          ]
        });
      } else {
        // Fallback to regular Notification API
        const notification = new Notification(title, {
          body: body,
          icon: '/Icons/Icon-192.png',
          badge: '/Icons/Icon-72.png',
          tag: 'health-reminder',
          requireInteraction: false,
          data: {
            url: url
          }
        });
        
        notification.onclick = () => {
          window.focus();
          const openUrl = (url && url.startsWith('http')) ? url : (window.location.origin + (url && url.startsWith('/') ? url : '/' + (url || '?quick=true')));
          window.location.href = openUrl;
          notification.close();
        };
      }
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  },
  
  // Check if we need to show today's reminder (in-app)
  checkTodayReminder() {
    if (!this.isReminderEnabled()) return;
    
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const logs = JSON.parse(localStorage.getItem('healthLogs') || '[]');
    const hasToday = logs.some(log => log.date === todayStr);
    
    // Only show in-app reminder if not logged and app is in foreground
    if (!hasToday && document.visibilityState === 'visible') {
      // Check if we already showed reminder today
      const lastInAppReminder = localStorage.getItem('lastInAppReminderDate');
      if (lastInAppReminder !== todayStr) {
        setTimeout(() => {
          if (typeof showAlertModal === 'function') {
            showAlertModal(
              '📊 Don\'t forget to log today\'s health data!',
              'Daily Reminder'
            );
            localStorage.setItem('lastInAppReminderDate', todayStr);
          }
        }, 2000);
      }
    }
  },
  
  // Set reminder time
  setReminderTime(time) {
    this.reminderTime = time;
    this.saveReminderSettings();
    if (this.isReminderEnabled()) {
      this.scheduleReminders();
    }
  },
  
  // Enable/disable reminders
  setReminderEnabled(enabled) {
    try {
      const settings = JSON.parse(localStorage.getItem('healthAppSettings') || '{}');
      settings.reminder = enabled;
      localStorage.setItem('healthAppSettings', JSON.stringify(settings));
      
      if (enabled) {
        this.scheduleReminders();
      } else {
        if (this.reminderInterval) {
          clearInterval(this.reminderInterval);
          this.reminderInterval = null;
        }
      }
    } catch (e) {
      console.error('Error setting reminder:', e);
    }
  }
};

// Handle notification clicks from service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', event => {
    if (event.data && event.data.type === 'NOTIFICATION_CLICK') {
      const url = event.data.url || '/';
      window.focus();
      window.location.href = url;
    }
  });
}

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    NotificationManager.init();
  });
} else {
  NotificationManager.init();
}

// Make available globally
window.NotificationManager = NotificationManager;
