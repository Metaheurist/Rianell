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
    settingsClose.addEventListener('click', toggleSettings);
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
  const demoModeToggle = document.getElementById('demoModeToggle');
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
  
  if (demoModeToggle) {
    demoModeToggle.addEventListener('click', toggleDemoMode);
  }
  
  if (animationsToggle) {
    animationsToggle.addEventListener('click', () => toggleSetting('animations'));
  }
  
  if (lazyToggle) {
    lazyToggle.addEventListener('click', () => toggleSetting('lazy'));
  }
  
  if (cloudAutoSync) {
    cloudAutoSync.addEventListener('change', toggleAutoSync);
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
    cloudSignUpBtn.addEventListener('click', handleCloudSignUp);
  }
  
  if (cloudLoginBtn) {
    cloudLoginBtn.addEventListener('click', handleCloudLogin);
  }
  
  if (cloudSyncBtn) {
    cloudSyncBtn.addEventListener('click', syncToCloud);
  }
  
  if (cloudLogoutBtn) {
    cloudLogoutBtn.addEventListener('click', handleCloudLogout);
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
    printBtn.addEventListener('click', printReport);
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
}

  // Tab navigation handlers
  const tabButtons = document.querySelectorAll('.tab-btn');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      const tab = this.getAttribute('data-tab');
      switchTab(tab);
    });
  });
  
  // Section toggle handlers
  const sectionHeaders = document.querySelectorAll('.section-header');
  sectionHeaders.forEach(header => {
    header.addEventListener('click', function() {
      const sectionId = this.getAttribute('onclick');
      if (sectionId) {
        const match = sectionId.match(/toggleSection\('([^']+)'\)/);
        if (match) {
          toggleSection(match[1]);
        }
      }
    });
  });
  
  // Weight unit toggle
  const weightUnitToggle = document.getElementById('weightUnitToggle');
  const editWeightUnitToggle = document.getElementById('editWeightUnitToggle');
  if (weightUnitToggle) {
    weightUnitToggle.addEventListener('click', toggleWeightUnit);
  }
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
  const aiActionBtn = document.querySelector('.ai-action-btn');
  
  if (filterBtn) filterBtn.addEventListener('click', filterLogs);
  if (sortButton) sortButton.addEventListener('click', toggleSort);
  if (aiActionBtn) aiActionBtn.addEventListener('click', generateAISummary);
  
  // Chart view toggle
  const individualViewBtn = document.getElementById('individualViewBtn');
  const combinedViewBtn = document.getElementById('combinedViewBtn');
  
  if (individualViewBtn) individualViewBtn.addEventListener('click', () => toggleChartView(false));
  if (combinedViewBtn) combinedViewBtn.addEventListener('click', () => toggleChartView(true));
  
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
  
  // AI Summary section toggle
  const aiSummaryHeader = document.querySelector('[onclick*="toggleSection(\'aiSummarySection\')"]');
  if (aiSummaryHeader) {
    aiSummaryHeader.addEventListener('click', () => toggleSection('aiSummarySection'));
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeEventHandlers);
} else {
  initializeEventHandlers();
}
