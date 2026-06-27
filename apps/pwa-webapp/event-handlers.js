// ============================================
// EVENT HANDLERS MODULE
// Centralized event handlers for CSP compliance
// Removes need for inline onclick handlers
// ============================================

// Initialize all event handlers when DOM is ready
function initializeEventHandlers() {
  // Settings menu handlers
  const settingsOverlay = document.getElementById('settingsOverlay');
  const settingsClose = document.querySelector('.settings-close');
  const settingsButtonTop = document.querySelector('.settings-button-top');
  
  if (settingsOverlay) {
    settingsOverlay.addEventListener('click', function(e) {
      if (e.target === settingsOverlay) {
        toggleSettings();
      }
    });
  }
  
  if (settingsClose) {
    settingsClose.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      if (typeof closeSettings === 'function') {
        closeSettings();
      } else {
        toggleSettings();
      }
    });
  }
  
  if (settingsButtonTop) {
    settingsButtonTop.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (typeof toggleSettings === 'function') toggleSettings();
    });
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
    userNameInput.addEventListener('change', function () {
      if (typeof window.updateUserName === 'function') window.updateUserName();
    });
  }

  if (medicalConditionInput) {
    medicalConditionInput.addEventListener('change', function () {
      if (typeof window.updateMedicalCondition === 'function') window.updateMedicalCondition();
    });
  }
  
  // Reminder time input
  const reminderTimeInput = document.getElementById('reminderTime');
  if (reminderTimeInput) {
    reminderTimeInput.addEventListener('change', function() {
      if (typeof updateReminderTime === 'function') {
        updateReminderTime();
      }
    });
  }
  
  // Notification permission button
  const notificationPermissionBtn = document.querySelector('[onclick*="requestNotificationPermission"]');
  if (notificationPermissionBtn) {
    notificationPermissionBtn.addEventListener('click', function() {
      if (typeof requestNotificationPermission === 'function') {
        requestNotificationPermission();
      }
    });
  }

  const pushNotificationsOptInBtn = document.getElementById('pushNotificationsOptInBtn');
  if (pushNotificationsOptInBtn) {
    pushNotificationsOptInBtn.addEventListener('click', function() {
      if (typeof subscribePushFromSettings === 'function') {
        void subscribePushFromSettings();
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
    cloudAutoSync.addEventListener('change', function() {
      if (typeof toggleAutoSync === 'function') {
        toggleAutoSync();
      }
    });
  }
  
  // Cloud sync handlers
  const passwordToggle = document.getElementById('passwordToggle');
  const cloudSignUpBtn = document.getElementById('cloudSignUpBtn');
  const cloudLoginBtn = document.getElementById('cloudLoginBtn');
  const cloudPasskeySignInBtn = document.getElementById('cloudPasskeySignInBtn');
  const cloudPasskeyEnrollBtn = document.getElementById('cloudPasskeyEnrollBtn');
  const cloudSyncBtn = document.getElementById('cloudSyncBtn');
  const cloudLogoutBtn = document.getElementById('cloudLogoutBtn');
  
  if (passwordToggle) {
    passwordToggle.addEventListener('click', togglePasswordVisibility);
  }
  
  if (cloudSignUpBtn) {
    cloudSignUpBtn.addEventListener('click', function() {
      if (typeof handleCloudSignUp === 'function') {
        handleCloudSignUp();
      }
    });
  }
  
  if (cloudLoginBtn) {
    cloudLoginBtn.addEventListener('click', function() {
      if (typeof handleCloudLogin === 'function') {
        handleCloudLogin();
      } else {
        console.error('handleCloudLogin function not available');
      }
    });
  }

  if (cloudPasskeySignInBtn) {
    cloudPasskeySignInBtn.addEventListener('click', function() {
      if (typeof handlePasskeySignIn === 'function') handlePasskeySignIn();
    });
  }

  if (cloudPasskeyEnrollBtn) {
    cloudPasskeyEnrollBtn.addEventListener('click', function() {
      if (typeof handlePasskeyEnroll === 'function') handlePasskeyEnroll();
    });
  }

  if (cloudSyncBtn) {
    cloudSyncBtn.addEventListener('click', syncToCloud);
  }
  
  if (cloudLogoutBtn) {
    cloudLogoutBtn.addEventListener('click', function() {
      if (typeof handleCloudLogout === 'function') {
        handleCloudLogout();
      } else {
        console.error('handleCloudLogout function not available');
      }
    });
  }
  
  // Settings action buttons
  const installAppBtn = document.querySelector('.install-app-btn');
  const printBtn = document.querySelector('.print-btn');
  
  if (installAppBtn) {
    installAppBtn.addEventListener('click', installOrLaunchPWA);
  }
  
  if (printBtn) {
    printBtn.addEventListener('click', function () {
      if (typeof printReport === 'function') {
        printReport();
        return;
      }
      if (window.PerformanceUtils && typeof window.PerformanceUtils.ensurePrintUtilsLoaded === 'function') {
        window.PerformanceUtils.ensurePrintUtilsLoaded().then(function () {
          if (typeof printReport === 'function') printReport();
        }).catch(function () {});
      }
    });
  }
  
  // Prediction range slider
  const predictionRangeSlider = document.getElementById('predictionRangeSlider');
  if (predictionRangeSlider) {
    const predValues = [null, 1, 7, 30, 90];
    predictionRangeSlider.addEventListener('input', function () {
      const pos = parseInt(this.value, 10);
      if (pos === 0) {
        togglePredictions();
      } else {
        setPredictionRange(predValues[pos]);
      }
    });
    // Initialise fill on load
    if (typeof updateRangeSlider === 'function') updateRangeSlider('predictionRangeSlider', parseInt(predictionRangeSlider.value, 10));
  }

  // Chart date range slider
  const chartRangeSlider = document.getElementById('chartRangeSlider');
  if (chartRangeSlider) {
    const chartValues = [1, 7, 30, 90, 'custom'];
    chartRangeSlider.addEventListener('input', function () {
      setChartDateRange(chartValues[parseInt(this.value, 10)]);
    });
    if (typeof updateRangeSlider === 'function') updateRangeSlider('chartRangeSlider', parseInt(chartRangeSlider.value, 10));
  }

  // Log date range slider
  const logRangeSlider = document.getElementById('logRangeSlider');
  if (logRangeSlider) {
    const logValues = [1, 7, 30, 90];
    logRangeSlider.addEventListener('input', function () {
      setLogViewRange(logValues[parseInt(this.value, 10)]);
    });
    if (typeof updateRangeSlider === 'function') updateRangeSlider('logRangeSlider', parseInt(logRangeSlider.value, 10));
  }

  // AI date range slider
  const aiRangeSlider = document.getElementById('aiRangeSlider');
  if (aiRangeSlider) {
    const aiValues = [7, 30, 90, 'custom'];
    aiRangeSlider.addEventListener('input', function () {
      setAIDateRange(aiValues[parseInt(this.value, 10)]);
    });
    if (typeof updateRangeSlider === 'function') updateRangeSlider('aiRangeSlider', parseInt(aiRangeSlider.value, 10));
  }
  
  // Tab navigation handlers
  const tabButtons = document.querySelectorAll('.tab-btn');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      const tab = this.getAttribute('data-tab');
      if (typeof window.switchTab === 'function') window.switchTab(tab);
    });
  });
  
  // AI date range input change handlers
  const aiStartDate = document.getElementById('aiStartDate');
  const aiEndDate = document.getElementById('aiEndDate');
  if (aiStartDate) {
    aiStartDate.addEventListener('change', function() {
      if (aiStartDate.value && aiEndDate && aiEndDate.value) {
        applyAICustomDateRange();
      }
    });
  }
  if (aiEndDate) {
    aiEndDate.addEventListener('change', function() {
      if (aiStartDate && aiStartDate.value && aiEndDate.value) {
        applyAICustomDateRange();
      }
    });
  }
  
  // Section toggle handlers: delegation via data-section (no onclick parsing)
  document.addEventListener('click', function(e) {
    const header = e.target.closest('.section-header[data-section]');
    if (header && typeof toggleSection === 'function') {
      const sectionId = header.getAttribute('data-section');
      if (sectionId) toggleSection(sectionId);
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
    if (btn.closest('#foodLog') || btn.closest('#logFoodItems')) {
      btn.addEventListener('click', addLogFoodItem);
    } else if (btn.closest('#foodModal')) {
      btn.addEventListener('click', addFoodItem);
    } else if (btn.closest('#exerciseLog') || btn.closest('#logExerciseItems')) {
      btn.addEventListener('click', addLogExerciseItem);
    } else if (btn.closest('#exerciseModal')) {
      btn.addEventListener('click', addExerciseItem);
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
    logOutput.addEventListener('click', function(e) {
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
    foodModal.addEventListener('click', function(e) {
      if (e.target === foodModal) {
        closeFoodModal();
      }
    });
    const foodModalClose = foodModal.querySelector('.modal-close');
    const foodModalSave = foodModal.querySelector('.modal-save-btn');
    if (foodModalClose) foodModalClose.addEventListener('click', closeFoodModal);
    if (foodModalSave) foodModalSave.addEventListener('click', saveFoodLog);
  }
  
  if (exerciseModal) {
    exerciseModal.addEventListener('click', function(e) {
      if (e.target === exerciseModal) {
        closeExerciseModal();
      }
    });
    const exerciseModalClose = exerciseModal.querySelector('.modal-close');
    const exerciseModalSave = exerciseModal.querySelector('.modal-save-btn');
    if (exerciseModalClose) exerciseModalClose.addEventListener('click', closeExerciseModal);
    if (exerciseModalSave) exerciseModalSave.addEventListener('click', saveExerciseLog);
  }
  
  if (editEntryModal) {
    editEntryModal.addEventListener('click', function(e) {
      if (e.target === editEntryModal) {
        closeEditEntryModal();
      }
    });
    const editModalClose = editEntryModal.querySelector('.modal-close');
    const editModalSave = editEntryModal.querySelector('.modal-save-btn');
    if (editModalClose) editModalClose.addEventListener('click', closeEditEntryModal);
    if (editModalSave) editModalSave.addEventListener('click', saveEditedEntry);
  }
  
  if (alertModal) {
    alertModal.addEventListener('click', function(e) {
      if (e.target === alertModal) {
        closeAlertModal();
      }
    });
    const alertModalClose = alertModal.querySelector('.modal-close');
    const alertModalOk = alertModal.querySelector('.modal-save-btn');
    if (alertModalClose) alertModalClose.addEventListener('click', closeAlertModal);
    if (alertModalOk) alertModalOk.addEventListener('click', closeAlertModal);
  }
  
  // Slider input handlers for edit modal
  const editSliders = ['editFatigue', 'editStiffness', 'editBackPain', 'editSleep', 
                       'editJointPain', 'editMobility', 'editDailyFunction', 
                       'editSwelling', 'editMood', 'editIrritability'];
  editSliders.forEach(sliderId => {
    const slider = document.getElementById(sliderId);
    if (slider) {
      slider.addEventListener('input', () => updateEditSliderColor(sliderId));
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
      e.preventDefault();
      e.stopPropagation();
      if (typeof window.closeDonateModal === 'function') {
        window.closeDonateModal();
      }
    });
  }
  
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeEventHandlers);
} else {
  initializeEventHandlers();
}
// Event handlers for Health App

(function() {
  function setupEventHandlers() {
    // Bind range buttons
    document.querySelectorAll('[data-set-range]').forEach(btn => {
      btn.addEventListener('click', () => {
        const days = parseInt(btn.getAttribute('data-set-range'), 10);
        if (window.setLogViewRange) window.setLogViewRange(days);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupEventHandlers);
  } else {
    setupEventHandlers();
  }
})();
