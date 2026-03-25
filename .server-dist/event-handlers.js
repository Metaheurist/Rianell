// ============================================
// EVENT HANDLERS MODULE
// Centralized event handlers for CSP compliance
// Removes need for inline onclick handlers
// ============================================

// Initialize all event handlers when DOM is ready
function initializeEventHandlers() {
  var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("event-handlers.js", "initializeEventHandlers", arguments) : undefined;
  try {
    // Settings menu handlers
    const settingsOverlay = document.getElementById('settingsOverlay');
    const settingsClose = document.querySelector('.settings-close');
    const settingsButtonTop = document.querySelector('.settings-button-top');
    if (settingsOverlay) {
      settingsOverlay.addEventListener('click', function (e) {
        var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("event-handlers.js", "anonymous", arguments) : undefined;
        try {
          if (e.target === settingsOverlay) {
            toggleSettings();
          }
        } finally {
          __rianellTraceExit(__rt);
        }
      });
    }
    if (settingsClose) {
      settingsClose.addEventListener('click', function (e) {
        var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("event-handlers.js", "anonymous", arguments) : undefined;
        try {
          e.preventDefault();
          e.stopPropagation();
          if (typeof closeSettings === 'function') {
            closeSettings();
          } else {
            toggleSettings();
          }
        } finally {
          __rianellTraceExit(__rt);
        }
      });
    }
    if (settingsButtonTop) {
      settingsButtonTop.addEventListener('click', toggleSettings);
    }

    // Settings form handlers
    const userNameInput = document.getElementById('userNameInput');
    const medicalConditionInput = document.getElementById('medicalConditionInput');
    const reminderToggle = document.getElementById('reminderToggle');
    const soundToggle = document.getElementById('soundToggle');
    const backupToggle = document.getElementById('backupToggle');
    const compressToggle = document.getElementById('compressToggle');
    const animationsToggle = document.getElementById('animationsToggle');
    const lazyToggle = document.getElementById('lazyToggle');
    const cloudAutoSync = document.getElementById('cloudAutoSync');
    if (userNameInput) {
      userNameInput.addEventListener('change', updateUserName);
    }
    if (medicalConditionInput) {
      medicalConditionInput.addEventListener('change', updateMedicalCondition);
    }

    // Reminder time input
    const reminderTimeInput = document.getElementById('reminderTime');
    if (reminderTimeInput) {
      reminderTimeInput.addEventListener('change', function () {
        var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("event-handlers.js", "anonymous", arguments) : undefined;
        try {
          if (typeof updateReminderTime === 'function') {
            updateReminderTime();
          }
        } finally {
          __rianellTraceExit(__rt);
        }
      });
    }

    // Notification permission button
    const notificationPermissionBtn = document.querySelector('[onclick*="requestNotificationPermission"]');
    if (notificationPermissionBtn) {
      notificationPermissionBtn.addEventListener('click', function () {
        var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("event-handlers.js", "anonymous", arguments) : undefined;
        try {
          if (typeof requestNotificationPermission === 'function') {
            requestNotificationPermission();
          }
        } finally {
          __rianellTraceExit(__rt);
        }
      });
    }
    if (reminderToggle) {
      reminderToggle.addEventListener('click', () => toggleSetting('reminder'));
    }
    if (soundToggle) {
      soundToggle.addEventListener('click', () => toggleSetting('sound'));
    }
    if (backupToggle) {
      backupToggle.addEventListener('click', () => toggleSetting('backup'));
    }
    if (compressToggle) {
      compressToggle.addEventListener('click', () => toggleSetting('compress'));
    }

    // Demo mode toggle - uses onclick in HTML (button) for reliable click handling
    if (animationsToggle) {
      animationsToggle.addEventListener('click', () => toggleSetting('animations'));
    }
    if (lazyToggle) {
      lazyToggle.addEventListener('click', () => toggleSetting('lazy'));
    }
    if (cloudAutoSync) {
      cloudAutoSync.addEventListener('change', function () {
        var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("event-handlers.js", "anonymous", arguments) : undefined;
        try {
          if (typeof toggleAutoSync === 'function') {
            toggleAutoSync();
          }
        } finally {
          __rianellTraceExit(__rt);
        }
      });
    }

    // Cloud sync handlers
    const passwordToggle = document.getElementById('passwordToggle');
    const cloudSignUpBtn = document.getElementById('cloudSignUpBtn');
    const cloudLoginBtn = document.getElementById('cloudLoginBtn');
    const cloudSyncBtn = document.getElementById('cloudSyncBtn');
    const cloudLogoutBtn = document.getElementById('cloudLogoutBtn');
    if (passwordToggle) {
      passwordToggle.addEventListener('click', togglePasswordVisibility);
    }
    if (cloudSignUpBtn) {
      cloudSignUpBtn.addEventListener('click', function () {
        var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("event-handlers.js", "anonymous", arguments) : undefined;
        try {
          if (typeof handleCloudSignUp === 'function') {
            handleCloudSignUp();
          }
        } finally {
          __rianellTraceExit(__rt);
        }
      });
    }
    if (cloudLoginBtn) {
      cloudLoginBtn.addEventListener('click', function () {
        var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("event-handlers.js", "anonymous", arguments) : undefined;
        try {
          if (typeof handleCloudLogin === 'function') {
            handleCloudLogin();
          } else {
            console.error('handleCloudLogin function not available');
          }
        } finally {
          __rianellTraceExit(__rt);
        }
      });
    }
    if (cloudSyncBtn) {
      cloudSyncBtn.addEventListener('click', syncToCloud);
    }
    if (cloudLogoutBtn) {
      cloudLogoutBtn.addEventListener('click', function () {
        var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("event-handlers.js", "anonymous", arguments) : undefined;
        try {
          if (typeof handleCloudLogout === 'function') {
            handleCloudLogout();
          } else {
            console.error('handleCloudLogout function not available');
          }
        } finally {
          __rianellTraceExit(__rt);
        }
      });
    }

    // Settings action buttons
    const installAppBtn = document.querySelector('.install-app-btn');
    const exportBtn = document.querySelector('.export-btn');
    const importBtn = document.querySelector('.import-btn');
    const printBtn = document.querySelector('.print-btn');
    if (installAppBtn) {
      installAppBtn.addEventListener('click', installOrLaunchPWA);
    }
    if (exportBtn) {
      exportBtn.addEventListener('click', exportData);
    }
    if (importBtn) {
      importBtn.addEventListener('click', importData);
    }
    if (printBtn) {
      printBtn.addEventListener('click', function () {
        var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("event-handlers.js", "anonymous", arguments) : undefined;
        try {
          if (typeof printReport === 'function') {
            printReport();
            return;
          }
          if (window.PerformanceUtils && typeof window.PerformanceUtils.ensurePrintUtilsLoaded === 'function') {
            window.PerformanceUtils.ensurePrintUtilsLoaded().then(function () {
              var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("event-handlers.js", "anonymous", arguments) : undefined;
              try {
                if (typeof printReport === 'function') printReport();
              } finally {
                __rianellTraceExit(__rt);
              }
            }).catch(function () {
              var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("event-handlers.js", "anonymous", arguments) : undefined;
              try {} finally {
                __rianellTraceExit(__rt);
              }
            });
          }
        } finally {
          __rianellTraceExit(__rt);
        }
      });
    }

    // Chart prediction range buttons
    const predictionToggle = document.getElementById('predictionToggle');
    const predRange1Day = document.getElementById('predRange1Day');
    const predRange7Days = document.getElementById('predRange7Days');
    const predRange30Days = document.getElementById('predRange30Days');
    const predRange90Days = document.getElementById('predRange90Days');
    if (predictionToggle) {
      predictionToggle.addEventListener('click', togglePredictions);
    }
    if (predRange1Day) {
      predRange1Day.addEventListener('click', () => setPredictionRange(1));
    }
    if (predRange7Days) {
      predRange7Days.addEventListener('click', () => setPredictionRange(7));
    }
    if (predRange30Days) {
      predRange30Days.addEventListener('click', () => setPredictionRange(30));
    }
    if (predRange90Days) {
      predRange90Days.addEventListener('click', () => setPredictionRange(90));
    }

    // Date range buttons
    const range1Day = document.getElementById('range1Day');
    const range7Days = document.getElementById('range7Days');
    const range30Days = document.getElementById('range30Days');
    const range90Days = document.getElementById('range90Days');
    const rangeCustom = document.getElementById('rangeCustom');
    if (range1Day) {
      range1Day.addEventListener('click', () => setChartDateRange(1));
    }
    if (range7Days) {
      range7Days.addEventListener('click', () => setChartDateRange(7));
    }
    if (range30Days) {
      range30Days.addEventListener('click', () => setChartDateRange(30));
    }
    if (range90Days) {
      range90Days.addEventListener('click', () => setChartDateRange(90));
    }
    if (rangeCustom) {
      rangeCustom.addEventListener('click', () => setChartDateRange('custom'));
    }

    // Tab navigation handlers
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
      var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("event-handlers.js", "[arrow]", undefined) : undefined;
      try {
        btn.addEventListener('click', function () {
          var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("event-handlers.js", "anonymous", arguments) : undefined;
          try {
            const tab = this.getAttribute('data-tab');
            switchTab(tab);
          } finally {
            __rianellTraceExit(__rt);
          }
        });
      } finally {
        __rianellTraceExit(__rt);
      }
    });

    // AI date range input change handlers
    const aiStartDate = document.getElementById('aiStartDate');
    const aiEndDate = document.getElementById('aiEndDate');
    if (aiStartDate) {
      aiStartDate.addEventListener('change', function () {
        var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("event-handlers.js", "anonymous", arguments) : undefined;
        try {
          if (aiStartDate.value && aiEndDate && aiEndDate.value) {
            applyAICustomDateRange();
          }
        } finally {
          __rianellTraceExit(__rt);
        }
      });
    }
    if (aiEndDate) {
      aiEndDate.addEventListener('change', function () {
        var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("event-handlers.js", "anonymous", arguments) : undefined;
        try {
          if (aiStartDate && aiStartDate.value && aiEndDate.value) {
            applyAICustomDateRange();
          }
        } finally {
          __rianellTraceExit(__rt);
        }
      });
    }

    // Section toggle handlers: delegation via data-section (no onclick parsing)
    document.addEventListener('click', function (e) {
      var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("event-handlers.js", "anonymous", arguments) : undefined;
      try {
        const header = e.target.closest('.section-header[data-section]');
        if (header && typeof toggleSection === 'function') {
          const sectionId = header.getAttribute('data-section');
          if (sectionId) toggleSection(sectionId);
        }
      } finally {
        __rianellTraceExit(__rt);
      }
    });

    // Weight unit toggle: only bind edit modal toggle here; main form uses onclick="toggleWeightUnit()" to avoid double-firing
    const editWeightUnitToggle = document.getElementById('editWeightUnitToggle');
    if (editWeightUnitToggle) {
      editWeightUnitToggle.addEventListener('click', toggleEditWeightUnit);
    }

    // Add item buttons
    const addFoodBtns = document.querySelectorAll('.add-item-btn');
    addFoodBtns.forEach(btn => {
      var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("event-handlers.js", "[arrow]", undefined) : undefined;
      try {
        if (btn.closest('#foodLog') || btn.closest('#logFoodItems')) {
          btn.addEventListener('click', addLogFoodItem);
        } else if (btn.closest('#foodModal')) {
          btn.addEventListener('click', addFoodItem);
        } else if (btn.closest('#exerciseLog') || btn.closest('#logExerciseItems')) {
          btn.addEventListener('click', addLogExerciseItem);
        } else if (btn.closest('#exerciseModal')) {
          btn.addEventListener('click', addExerciseItem);
        }
      } finally {
        __rianellTraceExit(__rt);
      }
    });

    // Log view range buttons
    const logRange1Day = document.getElementById('logRange1Day');
    const logRange7Days = document.getElementById('logRange7Days');
    const logRange30Days = document.getElementById('logRange30Days');
    const logRange90Days = document.getElementById('logRange90Days');
    if (logRange1Day) logRange1Day.addEventListener('click', () => setLogViewRange(1));
    if (logRange7Days) logRange7Days.addEventListener('click', () => setLogViewRange(7));
    if (logRange30Days) logRange30Days.addEventListener('click', () => setLogViewRange(30));
    if (logRange90Days) logRange90Days.addEventListener('click', () => setLogViewRange(90));

    // Filter and sort buttons
    const filterBtn = document.querySelector('.filter-btn');
    const sortButton = document.getElementById('sortButton');
    if (filterBtn) filterBtn.addEventListener('click', filterLogs);
    if (sortButton) sortButton.addEventListener('click', toggleSort);

    // Log entry list: delegated click for food/exercise icons (works for dynamically rendered entries)
    const logOutput = document.getElementById('logOutput');
    if (logOutput) {
      logOutput.addEventListener('click', function (e) {
        var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("event-handlers.js", "anonymous", arguments) : undefined;
        try {
          const foodBtn = e.target.closest('.header-icon-btn.food-btn');
          const exerciseBtn = e.target.closest('.header-icon-btn.exercise-btn');
          if (foodBtn) {
            e.stopPropagation();
            e.preventDefault();
            const entry = foodBtn.closest('.entry');
            if (entry && typeof window.openFoodModal === 'function') {
              window.openFoodModal(entry.getAttribute('data-log-date'));
            }
            return;
          }
          if (exerciseBtn) {
            e.stopPropagation();
            e.preventDefault();
            const entry = exerciseBtn.closest('.entry');
            if (entry && typeof window.openExerciseModal === 'function') {
              window.openExerciseModal(entry.getAttribute('data-log-date'));
            }
          }
        } finally {
          __rianellTraceExit(__rt);
        }
      });
    }

    // Chart view toggle
    const individualViewBtn = document.getElementById('individualViewBtn');
    const combinedViewBtn = document.getElementById('combinedViewBtn');
    const balanceViewBtn = document.getElementById('balanceViewBtn');
    if (individualViewBtn) individualViewBtn.addEventListener('click', () => toggleChartView('individual'));
    if (combinedViewBtn) combinedViewBtn.addEventListener('click', () => toggleChartView('combined'));
    if (balanceViewBtn) balanceViewBtn.addEventListener('click', () => toggleChartView('balance'));

    // Custom date range inputs
    const chartStartDate = document.getElementById('chartStartDate');
    const chartEndDate = document.getElementById('chartEndDate');
    if (chartStartDate) chartStartDate.addEventListener('change', applyCustomDateRange);
    if (chartEndDate) chartEndDate.addEventListener('change', applyCustomDateRange);

    // Modal handlers
    const foodModal = document.getElementById('foodModal');
    const exerciseModal = document.getElementById('exerciseModal');
    const editEntryModal = document.getElementById('editEntryModal');
    const alertModal = document.getElementById('alertModal');
    if (foodModal) {
      foodModal.addEventListener('click', function (e) {
        var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("event-handlers.js", "anonymous", arguments) : undefined;
        try {
          if (e.target === foodModal) {
            closeFoodModal();
          }
        } finally {
          __rianellTraceExit(__rt);
        }
      });
      const foodModalClose = foodModal.querySelector('.modal-close');
      const foodModalSave = foodModal.querySelector('.modal-save-btn');
      if (foodModalClose) foodModalClose.addEventListener('click', closeFoodModal);
      if (foodModalSave) foodModalSave.addEventListener('click', saveFoodLog);
    }
    if (exerciseModal) {
      exerciseModal.addEventListener('click', function (e) {
        var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("event-handlers.js", "anonymous", arguments) : undefined;
        try {
          if (e.target === exerciseModal) {
            closeExerciseModal();
          }
        } finally {
          __rianellTraceExit(__rt);
        }
      });
      const exerciseModalClose = exerciseModal.querySelector('.modal-close');
      const exerciseModalSave = exerciseModal.querySelector('.modal-save-btn');
      if (exerciseModalClose) exerciseModalClose.addEventListener('click', closeExerciseModal);
      if (exerciseModalSave) exerciseModalSave.addEventListener('click', saveExerciseLog);
    }
    if (editEntryModal) {
      editEntryModal.addEventListener('click', function (e) {
        var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("event-handlers.js", "anonymous", arguments) : undefined;
        try {
          if (e.target === editEntryModal) {
            closeEditEntryModal();
          }
        } finally {
          __rianellTraceExit(__rt);
        }
      });
      const editModalClose = editEntryModal.querySelector('.modal-close');
      const editModalSave = editEntryModal.querySelector('.modal-save-btn');
      if (editModalClose) editModalClose.addEventListener('click', closeEditEntryModal);
      if (editModalSave) editModalSave.addEventListener('click', saveEditedEntry);
    }
    if (alertModal) {
      alertModal.addEventListener('click', function (e) {
        var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("event-handlers.js", "anonymous", arguments) : undefined;
        try {
          if (e.target === alertModal) {
            closeAlertModal();
          }
        } finally {
          __rianellTraceExit(__rt);
        }
      });
      const alertModalClose = alertModal.querySelector('.modal-close');
      const alertModalOk = alertModal.querySelector('.modal-save-btn');
      if (alertModalClose) alertModalClose.addEventListener('click', closeAlertModal);
      if (alertModalOk) alertModalOk.addEventListener('click', closeAlertModal);
    }

    // Slider input handlers for edit modal
    const editSliders = ['editFatigue', 'editStiffness', 'editBackPain', 'editSleep', 'editJointPain', 'editMobility', 'editDailyFunction', 'editSwelling', 'editMood', 'editIrritability'];
    editSliders.forEach(sliderId => {
      var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("event-handlers.js", "[arrow]", undefined) : undefined;
      try {
        const slider = document.getElementById(sliderId);
        if (slider) {
          slider.addEventListener('input', () => updateEditSliderColor(sliderId));
        }
      } finally {
        __rianellTraceExit(__rt);
      }
    });

    // Clear data button
    const clearDataBtn = document.querySelector('.danger-btn');
    if (clearDataBtn && clearDataBtn.textContent.includes('Clear')) {
      clearDataBtn.addEventListener('click', clearData);
    }
    const donateModalCloseBtn = document.getElementById('donateModalCloseBtn');
    if (donateModalCloseBtn) {
      donateModalCloseBtn.addEventListener('click', function (e) {
        var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("event-handlers.js", "anonymous", arguments) : undefined;
        try {
          e.preventDefault();
          e.stopPropagation();
          if (typeof window.closeDonateModal === 'function') {
            window.closeDonateModal();
          }
        } finally {
          __rianellTraceExit(__rt);
        }
      });
    }
  } finally {
    __rianellTraceExit(__rt);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeEventHandlers);
} else {
  initializeEventHandlers();
}
// Event handlers for Health App

(function () {
  var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("event-handlers.js", "anonymous", arguments) : undefined;
  try {
    function setupEventHandlers() {
      var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("event-handlers.js", "setupEventHandlers", arguments) : undefined;
      try {
        // Bind range buttons
        document.querySelectorAll('[data-set-range]').forEach(btn => {
          var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("event-handlers.js", "[arrow]", undefined) : undefined;
          try {
            btn.addEventListener('click', () => {
              var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("event-handlers.js", "[arrow]", undefined) : undefined;
              try {
                const days = parseInt(btn.getAttribute('data-set-range'), 10);
                if (window.setLogViewRange) window.setLogViewRange(days);
              } finally {
                __rianellTraceExit(__rt);
              }
            });
          } finally {
            __rianellTraceExit(__rt);
          }
        });
      } finally {
        __rianellTraceExit(__rt);
      }
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', setupEventHandlers);
    } else {
      setupEventHandlers();
    }
  } finally {
    __rianellTraceExit(__rt);
  }
})();