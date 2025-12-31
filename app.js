// PWA Service Worker Registrationt centr
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('PWA: Service Worker registered successfully:', registration.scope);
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content is available, notify user
              showUpdateNotification();
            }
          });
        });
      })
      .catch(error => {
        console.log('PWA: Service Worker registration failed:', error);
      });
  });
}

// PWA Install Prompt
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('PWA: Install prompt triggered');
  e.preventDefault();
  deferredPrompt = e;
  showInstallButton();
});

function showInstallButton() {
  // Create install button if it doesn't exist
  if (!document.getElementById('installButton')) {
    const installButton = document.createElement('button');
    installButton.id = 'installButton';
    installButton.textContent = '📱 Install App';
    installButton.className = 'export-button';
    installButton.style.marginTop = '10px';
    installButton.onclick = installPWA;
    
    // Add to button container
    const buttonContainer = document.querySelector('.button-container');
    buttonContainer.appendChild(installButton);
  }
}

function installPWA() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('PWA: User accepted the install prompt');
        hideInstallButton();
      } else {
        console.log('PWA: User dismissed the install prompt');
      }
      deferredPrompt = null;
    });
  }
}

function hideInstallButton() {
  const installButton = document.getElementById('installButton');
  if (installButton) {
    installButton.remove();
  }
}

// Enhanced PWA functions for settings menu
function installOrLaunchPWA() {
  // Debug info
  console.log('PWA Install Debug:', {
    isStandalone: window.matchMedia('(display-mode: standalone)').matches,
    isAppleStandalone: window.navigator.standalone,
    hasDeferredPrompt: !!deferredPrompt,
    protocol: window.location.protocol,
    userAgent: navigator.userAgent
  });
  
  // Check if app is already installed
  if (window.matchMedia('(display-mode: standalone)').matches) {
    alert('App is already running in standalone mode! 🎉');
    return;
  }
  
  // Check if running as PWA (Safari)
  if (window.navigator.standalone === true) {
    alert('App is already installed as PWA! 🎉');
    return;
  }
  
  // Try to install if prompt is available
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('PWA: User accepted the install prompt');
        alert('App installed successfully! 📱\nLook for "Jan\'s Health Dashboard" in your apps.');
        hideInstallButton();
      } else {
        console.log('PWA: User dismissed the install prompt');
      }
      deferredPrompt = null;
    });
  } else {
    // Check why install prompt is not available
    const protocol = window.location.protocol;
    if (protocol === 'file:') {
      showFileProtocolHelp();
    } else {
      showInstallInstructions();
    }
  }
}

function showFileProtocolHelp() {
  const helpText = `⚠️ PWA Installation Limitation

Chrome requires HTTPS or localhost to show the automatic install prompt.

🔧 Solutions:

1. **Run a Local Server** (Recommended):
   • Open Command Prompt in this folder
   • Run: python -m http.server 8000
   • Open: http://localhost:8000

2. **Manual Installation**:
   • Chrome Menu (⋮) → More Tools → Create Shortcut
   • Check "Open as window" ✅
   
3. **Use Edge Browser**:
   • Edge works better with file:// for PWA installation

4. **Upload to Web Hosting**:
   • Host on GitHub Pages, Netlify, etc.

Would you like manual installation instructions instead?`;
  
  if (confirm(helpText + '\n\nShow manual installation steps?')) {
    showInstallInstructions();
  }
}

function openInStandalone() {
  const currentUrl = window.location.href;
  const standaloneUrl = currentUrl + (currentUrl.includes('?') ? '&' : '?') + 'standalone=true';
  
  // Try to open in new window with app-like properties
  const newWindow = window.open(standaloneUrl, 'HealthDashboard', 
    'width=400,height=800,toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes'
  );
  
  if (newWindow) {
    alert('Opening in standalone mode! 🚀\nClose this window and use the new one.');
    // Focus the new window
    newWindow.focus();
  } else {
    alert('⚠️ Popup blocked!\nPlease allow popups for this site and try again.');
  }
}

function showInstallInstructions() {
  const userAgent = navigator.userAgent.toLowerCase();
  let instructions = '';
  
  if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
    instructions = `
📱 Install on Chrome:

METHOD 1 - Create Shortcut:
1. Click ⋮ menu (top right)
2. More Tools → Create Shortcut
3. Name: "Your's Health Dashboard"
4. ✅ Check "Open as window"
5. Click "Create"

METHOD 2 - Install Button:
• Look for install icon (⊞) in address bar
• Or ⋮ menu → "Install Jan's Health Dashboard"

NOTE: Automatic install works best with:
• http://localhost:8000 (local server)
• Or hosted website (https://)
    `;
  } else if (userAgent.includes('firefox')) {
    instructions = `
📱 Install on Firefox:
1. Click the ☰ menu (top right)
2. Select "Install this site as an app"
3. Choose a name and click "Install"
    `;
  } else if (userAgent.includes('safari')) {
    instructions = `
📱 Install on Safari:
1. Tap the Share button (□↗)
2. Scroll down and tap "Add to Home Screen"
3. Tap "Add" to install
    `;
  } else if (userAgent.includes('edg')) {
    instructions = `
📱 Install on Edge:
1. Click the ⋯ menu (top right)
2. Select "Apps" > "Install this site as an app"
3. Click "Install"
    `;
  } else {
    instructions = `
📱 Install Instructions:
Look for an "Install" or "Add to Home Screen" option in your browser's menu.

Most modern browsers support installing web apps!
    `;
  }
  
  alert(instructions);
}

function showUpdateNotification() {
  const updateBanner = document.createElement('div');
  updateBanner.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: var(--primary-color);
    color: white;
    padding: 15px;
    text-align: center;
    z-index: 10000;
    font-weight: bold;
  `;
  updateBanner.innerHTML = `
    New version available! 
    <button onclick="location.reload()" style="margin-left: 10px; padding: 5px 10px; background: white; color: var(--primary-color); border: none; border-radius: 4px; cursor: pointer;">
      Update Now
    </button>
    <button onclick="this.parentElement.remove()" style="margin-left: 5px; padding: 5px 10px; background: transparent; color: white; border: 1px solid white; border-radius: 4px; cursor: pointer;">
      Later
    </button>
  `;
  document.body.insertBefore(updateBanner, document.body.firstChild);
}

// Handle PWA shortcuts
window.addEventListener('DOMContentLoaded', function() {
  const urlParams = new URLSearchParams(window.location.search);
  
  if (urlParams.get('quick') === 'true') {
    // Focus on first input for quick entry
    document.getElementById('date').focus();
  }
  
  if (urlParams.get('charts') === 'true') {
    // Show charts immediately
    document.getElementById('chartSection').classList.remove('hidden');
  }

  // Check if there's a log entry for today, and if not, show an alert
  const logs = JSON.parse(localStorage.getItem("healthLogs") || "[]");
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;
  const hasToday = logs.some(log => log.date === todayStr);
  if (!hasToday) {
    // Only show alert if not installed as PWA to avoid annoying notifications
    if (!window.matchMedia('(display-mode: standalone)').matches) {
      alert("You have not logged an entry for today.");
    }
  }
});

// Form Validation System
class FormValidator {
  constructor() {
    this.errors = new Map();
    this.rules = new Map();
    this.setupValidationRules();
    this.bindValidationEvents();
  }

  setupValidationRules() {
    // Date validation
    this.rules.set('date', {
      required: true,
      validate: (value) => {
        if (!value) return 'Date is required';
        
        const selectedDate = new Date(value);
        const today = new Date();
        const maxPastDate = new Date();
        maxPastDate.setFullYear(today.getFullYear() - 5); // 5 years ago max
        
        if (selectedDate > today) {
          return 'Date cannot be in the future';
        }
        
        if (selectedDate < maxPastDate) {
          return 'Date cannot be more than 5 years ago';
        }
        
        return null;
      }
    });

    // BPM validation
    this.rules.set('bpm', {
      required: true,
      validate: (value) => {
        if (!value) return 'Resting BPM is required';
        
        const bpm = parseInt(value);
        if (isNaN(bpm)) return 'BPM must be a number';
        if (bpm < 30) return 'BPM cannot be less than 30';
        if (bpm > 200) return 'BPM cannot be more than 200 (please check this value)';
        if (bpm > 120) return 'High BPM detected - please verify this is correct';
        
        return null;
      }
    });

    // Weight validation
    this.rules.set('weight', {
      required: true,
      validate: (value) => {
        if (!value) return 'Weight is required';
        
        const weight = parseFloat(value);
        if (isNaN(weight)) return 'Weight must be a number';
        
        // Convert to kg for validation
        let weightKg = weight;
        if (appSettings.weightUnit === 'lb') {
          weightKg = parseFloat(lbToKg(weight));
        }
        
        if (weightKg < 20) {
          const minDisplay = appSettings.weightUnit === 'lb' ? '44lb' : '20kg';
          return `Weight cannot be less than ${minDisplay}`;
        }
        if (weightKg > 300) {
          const maxDisplay = appSettings.weightUnit === 'lb' ? '661lb' : '300kg';
          return `Weight cannot be more than ${maxDisplay}`;
        }
        if (weightKg < 40) {
          const minDisplay = appSettings.weightUnit === 'lb' ? '88lb' : '40kg';
          return `Weight seems low - please verify this is correct (min: ${minDisplay})`;
        }
        if (weightKg > 200) {
          const maxDisplay = appSettings.weightUnit === 'lb' ? '441lb' : '200kg';
          return `Weight seems high - please verify this is correct (max: ${maxDisplay})`;
        }
        
        return null;
      }
    });

    // Flare validation
    this.rules.set('flare', {
      required: true,
      validate: (value) => {
        if (!value || value === '') return 'Please select if you had a flare-up today';
        if (!['Yes', 'No'].includes(value)) return 'Invalid flare-up selection';
        return null;
      }
    });

    // Notes validation (optional but with length limit)
    this.rules.set('notes', {
      required: false,
      validate: (value) => {
        if (value && value.length > 500) {
          return 'Notes cannot be longer than 500 characters';
        }
        return null;
      }
    });

    // Slider validations (fatigue, stiffness, etc.)
    const sliderFields = ['fatigue', 'stiffness', 'backPain', 'sleep', 'jointPain', 'mobility', 'dailyFunction', 'swelling', 'mood', 'irritability'];
    sliderFields.forEach(field => {
      this.rules.set(field, {
        required: true,
        validate: (value) => {
          const val = parseInt(value);
          if (isNaN(val)) return `${this.getFieldDisplayName(field)} level is required`;
          if (val < 1 || val > 10) return `${this.getFieldDisplayName(field)} level must be between 1 and 10`;
          return null;
        }
      });
    });
  }

  getFieldDisplayName(fieldId) {
    const names = {
      'fatigue': 'Fatigue',
      'stiffness': 'Stiffness',
      'backPain': 'Back Pain',
      'sleep': 'Sleep Quality',
      'jointPain': 'Joint Pain',
      'mobility': 'Mobility',
      'dailyFunction': 'Daily Function',
      'swelling': 'Swelling',
      'mood': 'Mood',
      'irritability': 'Irritability'
    };
    return names[fieldId] || fieldId;
  }

  bindValidationEvents() {
    // Real-time validation on input/change events
    this.rules.forEach((rule, fieldId) => {
      const element = document.getElementById(fieldId);
      if (element) {
        const events = element.tagName === 'SELECT' ? ['change'] : ['input', 'blur'];
        events.forEach(event => {
          element.addEventListener(event, () => {
            this.validateField(fieldId);
          });
        });
      }
    });
  }

  validateField(fieldId) {
    const element = document.getElementById(fieldId);
    const rule = this.rules.get(fieldId);
    
    if (!element || !rule) return true;

    const value = element.value.trim();
    const error = rule.validate(value);

    if (error) {
      this.setFieldError(fieldId, error);
      return false;
    } else {
      this.clearFieldError(fieldId);
      return true;
    }
  }

  setFieldError(fieldId, message) {
    this.errors.set(fieldId, message);
    
    const element = document.getElementById(fieldId);
    const errorElement = document.getElementById(`${fieldId}-error`);
    
    if (element) {
      element.classList.remove('valid');
      element.classList.add('invalid');
    }
    
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.classList.add('show');
    }
    
    this.updateValidationSummary();
  }

  clearFieldError(fieldId) {
    this.errors.delete(fieldId);
    
    const element = document.getElementById(fieldId);
    const errorElement = document.getElementById(`${fieldId}-error`);
    
    if (element) {
      element.classList.remove('invalid');
      element.classList.add('valid');
    }
    
    if (errorElement) {
      errorElement.classList.remove('show');
    }
    
    this.updateValidationSummary();
  }

  updateValidationSummary() {
    const summaryElement = document.getElementById('validationSummary');
    const listElement = document.getElementById('validationList');
    
    if (this.errors.size === 0) {
      summaryElement.classList.remove('show');
      return;
    }
    
    listElement.innerHTML = '';
    this.errors.forEach((message, fieldId) => {
      const li = document.createElement('li');
      li.textContent = message;
      listElement.appendChild(li);
    });
    
    summaryElement.classList.add('show');
  }

  validateForm() {
    let isValid = true;
    
    this.rules.forEach((rule, fieldId) => {
      if (!this.validateField(fieldId)) {
        isValid = false;
      }
    });
    
    return isValid;
  }

  clearAllErrors() {
    this.errors.clear();
    
    this.rules.forEach((rule, fieldId) => {
      const element = document.getElementById(fieldId);
      const errorElement = document.getElementById(`${fieldId}-error`);
      
      if (element) {
        element.classList.remove('valid', 'invalid');
      }
      
      if (errorElement) {
        errorElement.classList.remove('show');
      }
    });
    
    this.updateValidationSummary();
  }
}

// Initialize form validator
const formValidator = new FormValidator();

// Weight unit conversion functions
function kgToLb(kg) {
  return (kg * 2.20462).toFixed(1);
}

function lbToKg(lb) {
  return (lb / 2.20462).toFixed(1);
}

function toggleWeightUnit() {
  const weightInput = document.getElementById('weight');
  const unitDisplay = document.getElementById('weightUnitDisplay');
  const currentValue = parseFloat(weightInput.value);
  
  if (!isNaN(currentValue) && currentValue > 0) {
    // Convert current value
    if (appSettings.weightUnit === 'kg') {
      // Converting from kg to lb
      const lbValue = parseFloat(kgToLb(currentValue));
      weightInput.value = lbValue;
      appSettings.weightUnit = 'lb';
      updateWeightInputConstraints();
    } else {
      // Converting from lb to kg
      const kgValue = parseFloat(lbToKg(currentValue));
      weightInput.value = kgValue;
      appSettings.weightUnit = 'kg';
      updateWeightInputConstraints();
    }
  } else {
    // Just toggle the unit if no value
    appSettings.weightUnit = appSettings.weightUnit === 'kg' ? 'lb' : 'kg';
    updateWeightInputConstraints();
  }
  
  unitDisplay.textContent = appSettings.weightUnit;
  saveSettings();
  
  // Trigger validation update
  formValidator.validateField('weight');
  
  // Update charts and logs display to reflect new unit
  renderLogs();
  updateCharts();
}

function updateWeightInputConstraints() {
  const weightInput = document.getElementById('weight');
  const unitDisplay = document.getElementById('weightUnitDisplay');
  
  if (appSettings.weightUnit === 'kg') {
    weightInput.min = 20;
    weightInput.max = 300;
    weightInput.step = 0.1;
    unitDisplay.textContent = 'kg';
  } else {
    // Convert kg ranges to lb: 20kg = 44lb, 300kg = 661lb
    weightInput.min = 44;
    weightInput.max = 661;
    weightInput.step = 0.1;
    unitDisplay.textContent = 'lb';
  }
}

function getWeightInDisplayUnit(weightKg) {
  if (appSettings.weightUnit === 'lb') {
    return parseFloat(kgToLb(weightKg));
  }
  return parseFloat(weightKg);
}

function getWeightUnitSuffix() {
  return appSettings.weightUnit;
}



document.getElementById("date").valueAsDate = new Date();
document.getElementById("flare").value = "No"; // Set default flare value

// Add character counter for notes field
const notesField = document.getElementById("notes");
const notesCounter = document.getElementById("notesCounter");

function updateNotesCounter() {
  const currentLength = notesField.value.length;
  notesCounter.textContent = `${currentLength}/500`;
  
  if (currentLength > 450) {
    notesCounter.style.color = '#f44336';
  } else if (currentLength > 400) {
    notesCounter.style.color = '#ff9800';
  } else {
    notesCounter.style.color = '';
  }
}

notesField.addEventListener('input', updateNotesCounter);

const form = document.getElementById("logForm");
const output = document.getElementById("logOutput");
const chartSection = document.getElementById("chartSection");

// Initialize slider colors and add event listeners
const sliders = ['fatigue', 'stiffness', 'backPain', 'sleep', 'jointPain', 'mobility', 'dailyFunction', 'swelling', 'mood', 'irritability'];

function updateSliderColor(slider) {
  const value = parseInt(slider.value);
  const percentage = (value / 10) * 100;
  
  // Sliders where HIGH values are GOOD (inverted colors)
  const invertedSliders = ['sleep', 'mobility', 'dailyFunction'];
  const isInverted = invertedSliders.includes(slider.id);
  
  let fillColor;
  
  if (isInverted) {
    // For positive metrics: high = green, low = red
    if (value >= 8 && value <= 10) {
      fillColor = '#4CAF50'; // Green
    } else if (value >= 4 && value <= 7) {
      fillColor = '#FF9800'; // Orange
    } else if (value >= 1 && value <= 3) {
      fillColor = '#F44336'; // Red
    }
  } else {
    // For negative metrics: high = red, low = green
    if (value >= 1 && value <= 3) {
      fillColor = '#4CAF50'; // Green
    } else if (value >= 4 && value <= 7) {
      fillColor = '#FF9800'; // Orange
    } else if (value >= 8 && value <= 10) {
      fillColor = '#F44336'; // Red
    }
  }
  
  // Create gradient background that fills to the current value
  const gradient = `linear-gradient(to right, ${fillColor} 0%, ${fillColor} ${percentage}%, #333 ${percentage}%, #333 100%)`;
  slider.style.background = gradient;
  
  // Remove old classes and add new one for any additional styling
  slider.classList.remove('green', 'orange', 'red');
  if (fillColor === '#4CAF50') {
    slider.classList.add('green');
  } else if (fillColor === '#FF9800') {
    slider.classList.add('orange');
  } else if (fillColor === '#F44336') {
    slider.classList.add('red');
  }
}

sliders.forEach(sliderId => {
  const slider = document.getElementById(sliderId);
  slider.value = 5; // Set default value
  updateSliderColor(slider);
  
  slider.addEventListener('input', function() {
    updateSliderColor(this);
  });
});

function toggleChartView(showCombined) {
  const combinedContainer = document.getElementById('combinedChartContainer');
  const individualContainer = document.getElementById('individualChartsContainer');
  const individualBtn = document.getElementById('individualViewBtn');
  const combinedBtn = document.getElementById('combinedViewBtn');
  
  // Save the preference but don't let settings interfere
  appSettings.combinedChart = showCombined;
  saveSettings();
  
  // Check if we have data first
  const hasData = logs && logs.length > 0;
  if (!hasData) {
    updateChartEmptyState(false);
    return;
  }
  
  if (showCombined) {
    combinedContainer.classList.remove('hidden');
    individualContainer.classList.add('hidden');
    
    // Update button states
    if (combinedBtn) combinedBtn.classList.add('active');
    if (individualBtn) individualBtn.classList.remove('active');
    
    // Disconnect chart observer when showing combined view
    if (chartObserver) {
      chartObserver.disconnect();
    }
    
    // Small delay to prevent jump
    setTimeout(() => {
    createCombinedChart();
    }, 50);
  } else {
    combinedContainer.classList.add('hidden');
    individualContainer.classList.remove('hidden');
    
    // Update button states
    if (individualBtn) individualBtn.classList.add('active');
    if (combinedBtn) combinedBtn.classList.remove('active');
    
    // Use lazy loading for individual charts
    updateCharts();
  }
}

function createCombinedChart() {
  // Check if ApexCharts is available
  if (typeof ApexCharts === 'undefined') {
    console.error('ApexCharts is not loaded! Cannot create combined chart.');
    return;
  }
  
  const container = document.getElementById('combinedChart');
  if (!container) {
    console.error('Combined chart container not found');
    return;
  }
  
  // Get filtered logs based on date range
  const filteredLogs = getFilteredLogs();
  
  // Check if we have data
  if (!filteredLogs || filteredLogs.length === 0) {
    console.warn('No data available for combined chart (after date filter)');
    updateChartEmptyState(false);
    return;
  }
  
  updateChartEmptyState(true);
  
  // Destroy existing chart if it exists
  if (container.chart) {
    container.chart.destroy();
  }
  
  // Prepare data for all metrics (excluding weight and bpm as they use different scales)
  const metrics = [
    { field: 'fatigue', name: 'Fatigue', color: '#ff9800' },
    { field: 'stiffness', name: 'Stiffness', color: '#ffc107' },
    { field: 'backPain', name: 'Back Pain', color: '#f44336' },
    { field: 'sleep', name: 'Sleep Quality', color: '#3f51b5' },
    { field: 'jointPain', name: 'Joint Pain', color: '#ff5722' },
    { field: 'mobility', name: 'Mobility', color: '#00bcd4' },
    { field: 'dailyFunction', name: 'Daily Function', color: '#8bc34a' },
    { field: 'swelling', name: 'Swelling', color: '#9c27b0' },
    { field: 'mood', name: 'Mood', color: '#673ab7' },
    { field: 'irritability', name: 'Irritability', color: '#795548' }
  ];
  
  // Use prediction range setting
  const daysToPredict = predictionRange;
  
  // Get predictions for all metrics using all available data for training
  let predictionsData = null;
  if (window.AIEngine && filteredLogs.length >= 2) {
    try {
      const sortedLogs = [...filteredLogs].sort((a, b) => new Date(a.date) - new Date(b.date));
      // Get ALL historical logs for training (no date filtering - use everything available, up to 10 years)
      const allHistoricalLogs = JSON.parse(localStorage.getItem("healthLogs") || "[]")
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      // Use all historical data for training to get better predictions
      const analysis = window.AIEngine.analyzeHealthMetrics(sortedLogs, allHistoricalLogs);
      predictionsData = {
        trends: analysis.trends,
        daysToPredict: daysToPredict,
        lastDate: sortedLogs.length > 0 ? new Date(sortedLogs[sortedLogs.length - 1].date) : null,
        allLogsLength: allLogs.length
      };
    } catch (error) {
      console.warn('Error generating predictions for combined chart:', error);
    }
  }
  
  const series = metrics.map(metric => {
    const data = filteredLogs
      .filter(log => log[metric.field] !== undefined && log[metric.field] !== null && log[metric.field] !== '')
      .map(log => ({
        x: new Date(log.date).getTime(), // Use timestamp for datetime axis
        y: parseFloat(log[metric.field]) || 0
      }))
      .sort((a, b) => a.x - b.x); // Sort by timestamp
    
    // Add predicted data if available
    let predictedData = [];
    if (predictionsData && predictionsData.trends && predictionsData.trends[metric.field]) {
      const trend = predictionsData.trends[metric.field];
      const lastDate = predictionsData.lastDate;
      const daysToPredict = predictionsData.daysToPredict;
      const trainingDataLength = predictionsData.allLogsLength;
      
      if (trend.regression && lastDate) {
        const regression = trend.regression;
        const isBPM = metric.field === 'bpm';
        const isWeight = metric.field === 'weight';
        
        // Get ALL historical logs for this metric (no date filtering - use everything available)
        const allLogsForMetric = JSON.parse(localStorage.getItem("healthLogs") || "[]")
          .filter(log => log[metric.field] !== undefined && log[metric.field] !== null && log[metric.field] !== '')
          .sort((a, b) => new Date(a.date) - new Date(b.date));
        
        if (allLogsForMetric.length > 0) {
          const firstDate = new Date(allLogsForMetric[0].date);
          const lastDateForCalc = new Date(allLogsForMetric[allLogsForMetric.length - 1].date);
          const lastXValue = Math.floor((lastDateForCalc - firstDate) / (1000 * 60 * 60 * 24));
          
          // Use AIEngine's improved prediction method with metric-specific context
          const metricContext = {
            variance: trend.variance || 0,
            average: trend.average || 0,
            metricName: metric.field,
            trainingValues: allLogsForMetric.map(log => {
              const val = parseFloat(log[metric.field]);
              // For weight, ensure we return a valid number (weight should never be 0)
              if (metric.field === 'weight') {
                return isNaN(val) || val <= 0 ? null : val;
              }
              return val || 0;
            }).filter(v => v !== null) // Remove null values for weight
          };
          const predictions = window.AIEngine.predictFutureValues(
            { slope: regression.slope, intercept: regression.intercept },
            lastXValue,
            daysToPredict,
            isBPM,
            isWeight,
            metricContext
          );
          
          // Generate predictions using the improved method
          for (let i = 0; i < daysToPredict; i++) {
            const value = predictions[i];
            
            const futureDate = new Date(lastDate);
            futureDate.setDate(futureDate.getDate() + (i + 1)); // i+1 because predictions start from day 1
            
            predictedData.push({
              x: futureDate.getTime(),
              y: value
            });
          }
        }
      }
    }
    
    const seriesArray = [{
      name: metric.name,
      data: data,
      color: metric.color
    }];
    
    // Add predicted series if available
    if (predictedData.length > 0) {
      const rgbMatch = metric.color.match(/\d+/g);
      const predictionColor = rgbMatch ? `rgba(${rgbMatch.join(', ')}, 0.5)` : metric.color;
      
    seriesArray.push({
      name: `${metric.name} (Predicted)`,
      data: predictedData,
      color: predictionColor,
      stroke: {
        dashArray: 5
      }
    });
    }
    
    return seriesArray;
  }).flat(); // Flatten the array of series arrays
  
  console.log(`Creating combined chart with ${series.length} metrics`);
  
  const options = {
    series: series,
    chart: {
      type: 'line',
      height: 500,
      toolbar: {
        show: false
      },
      background: 'transparent',
      selection: {
        enabled: false
      },
      zoom: {
        enabled: false
      },
      pan: {
        enabled: false
      },
      animations: {
        enabled: false
      }
    },
    title: {
      text: 'Combined Health Metrics Overview',
      align: 'center',
      style: {
        fontSize: '20px',
        fontWeight: 'bold',
        color: '#e0f2f1'
      }
    },
    stroke: {
      curve: 'smooth',
      width: 2.5,
      lineCap: 'round'
    },
    markers: {
      size: 3,
      strokeWidth: 2,
      hover: {
        size: 5,
        sizeOffset: 2
      },
      shape: 'circle',
      showNullDataPoints: false
    },
    xaxis: {
      type: 'datetime',
      title: {
        text: 'Date',
        style: {
          color: '#e0f2f1',
          fontSize: '14px',
          fontWeight: 'bold'
        }
      },
      labels: {
        style: {
          colors: '#e0f2f1'
        }
      }
    },
    yaxis: {
      title: {
        text: 'Level (1-10)',
        style: {
          color: '#e0f2f1',
          fontSize: '14px',
          fontWeight: 'bold'
        }
      },
      labels: {
        style: {
          colors: '#e0f2f1'
        }
      },
      min: 0,
      max: 10
    },
    grid: {
      borderColor: '#374151',
      strokeDashArray: 4,
      xaxis: {
        lines: {
          show: true
        }
      },
      yaxis: {
        lines: {
          show: true
        }
      },
      padding: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
      }
    },
    legend: {
      labels: {
        colors: '#e0f2f1'
      },
      position: 'bottom'
    },
    tooltip: {
      theme: 'dark',
      shared: true,
      intersect: false,
      x: {
        format: 'dd MMM yyyy'
      },
      marker: {
        show: true
      },
      style: {
        fontSize: '13px'
      }
    },
    dataLabels: {
      enabled: false
    },
    crosshairs: {
      show: true,
      position: 'front',
      stroke: {
        color: '#b0bec5',
        width: 1,
        dashArray: 3
      }
    }
  };
  
  // Apply light mode styles if in light mode
  if (false) { // Always dark mode
    options.title.style.color = '#1b5e20';
    options.xaxis.title.style.color = '#1b5e20';
    options.xaxis.labels.style.colors = '#1b5e20';
    options.yaxis.title.style.color = '#1b5e20';
    options.yaxis.labels.style.colors = '#1b5e20';
    options.grid.borderColor = '#81c784';
    options.legend.labels.colors = '#1b5e20';
    options.tooltip.theme = 'light';
  }
  
  // Hide any loading placeholder
  const loadingElement = container.querySelector('.chart-loading');
  if (loadingElement) {
    loadingElement.style.display = 'none';
  }
  
  container.chart = new ApexCharts(container, options);
  container.chart.render().then(() => {
    // Ensure loading is hidden after render
    if (loadingElement) {
      loadingElement.style.display = 'none';
    }
    // Mark container as loaded
    container.classList.add('loaded');
  });
}

async function clearData() {
  // Confirm with user before clearing all data
  if (!confirm('⚠️ WARNING: This will permanently delete ALL your health data, settings, and log you out of cloud sync.\n\nThis action cannot be undone!\n\nAre you sure you want to continue?')) {
    return;
  }
  
  // Clear all health logs from localStorage
  logs = [];
  localStorage.removeItem("healthLogs");
  
  // Delete health logs from cloud (but keep settings on cloud)
  if (typeof deleteCloudLogs === 'function') {
    try {
      await deleteCloudLogs();
      console.log('✅ Health logs deleted from cloud (settings preserved)');
    } catch (error) {
      console.warn('Cloud logs deletion error (may not be logged in or sync failed):', error);
      // Continue with local clearing even if cloud deletion fails
    }
  }
  
  // Clear all app settings - reset to defaults (local only, cloud settings preserved)
  appSettings = {
    showCharts: true,
    combinedChart: false,
    reminder: true,
    sound: false,
    backup: true,
    compress: false,
    animations: true,
    lazy: true,
    userName: '',
    weightUnit: 'kg',
    medicalCondition: '' // Clear medical condition
  };
  localStorage.removeItem('healthAppSettings');
  
  // Logout from cloud sync
  if (typeof handleCloudLogout === 'function') {
    try {
      await handleCloudLogout();
      console.log('✅ Logged out from cloud sync');
    } catch (error) {
      console.warn('Cloud logout error (may not be logged in):', error);
    }
  }
  
  // Clear all cloud-related localStorage items
  localStorage.removeItem('cloudAutoSync');
  localStorage.removeItem('cloudLastSync');
  localStorage.removeItem('currentCloudUserId');
  
  // Clear AI model cache from IndexedDB
  try {
    if ('indexedDB' in window) {
      // AI models may use IndexedDB to cache models
      // Try to delete common database names used by AI model caches
      const dbNames = [
        'transformers-cache',
        'transformersjs-cache',
        'hf-transformers-cache',
        'xenova-transformers-cache'
      ];
      
      // Also try to get all database names and delete any that look like AI model caches
      if (indexedDB.databases) {
        const databases = await indexedDB.databases();
        for (const db of databases) {
          if (db.name && (
            db.name.toLowerCase().includes('transformers') ||
            db.name.toLowerCase().includes('xenova') ||
            db.name.toLowerCase().includes('hf-')
          )) {
            dbNames.push(db.name);
          }
        }
      }
      
      // Delete all found databases
      const deletePromises = [...new Set(dbNames)].map(dbName => {
        return new Promise((resolve) => {
          const deleteDB = indexedDB.deleteDatabase(dbName);
          deleteDB.onsuccess = () => {
            console.log(`✅ Cleared AI model cache: ${dbName}`);
            resolve();
          };
          deleteDB.onerror = () => {
            // Database might not exist, that's okay
            resolve();
          };
          deleteDB.onblocked = () => {
            console.warn(`⚠️ IndexedDB deletion blocked for ${dbName} - may need to close other tabs`);
            resolve(); // Don't fail the whole operation
          };
        });
      });
      
      await Promise.all(deletePromises);
      console.log('✅ AI model cache cleared from IndexedDB');
    }
  } catch (error) {
    console.warn('⚠️ Error clearing AI model cache:', error);
    // Don't fail the whole operation if this fails
  }
  
  
  // Clear any other localStorage items related to the app
  // (keeping service worker registration and other browser data)
  
  // Reset UI
  renderLogs();
  updateCharts();
  updateAISummaryButtonState(); // Update AI button state
  
  // Reload settings
  if (typeof loadSettings === 'function') {
    loadSettings();
  }
  
  // Apply settings to UI
  if (typeof applySettings === 'function') {
    applySettings();
  }
  
  // Update settings state (toggles, etc.)
  if (typeof loadSettingsState === 'function') {
    loadSettingsState();
  }
  
  // Explicitly clear input fields in UI (after loadSettingsState to override any defaults)
  const userNameInput = document.getElementById('userNameInput');
  if (userNameInput) {
    userNameInput.value = '';
  }
  
  const medicalConditionInput = document.getElementById('medicalConditionInput');
  if (medicalConditionInput) {
    medicalConditionInput.value = '';
  }
  
  // Update dashboard title and condition context
  if (typeof updateDashboardTitle === 'function') {
    updateDashboardTitle();
  }
  
  if (typeof updateConditionContext === 'function') {
    updateConditionContext('');
  }
  
  // Show confirmation
  alert('✅ All data cleared successfully!\n\n- Health logs deleted (local & cloud)\n- Local settings reset\n- Cloud settings preserved\n- Cloud sync logged out\n- AI model cache deleted\n\nThe app has been reset to default state.');
}


function exportData() {
  const headers = "Date,BPM,Weight,Fatigue,Stiffness,Back Pain,Sleep,Joint Pain,Mobility,Daily Function,Swelling,Flare,Mood,Irritability,Notes";
  const csvContent = "data:text/csv;charset=utf-8," 
    + headers + "\n"
    + logs.map(log => Object.values(log).join(",")).join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "health_logs.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function importData() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.csv';
  input.onchange = function(event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          const csv = e.target.result;
          const lines = csv.split('\n');
          const headers = lines[0].split(',');
          
          // Validate headers
          const expectedHeaders = ['Date', 'BPM', 'Weight', 'Fatigue', 'Stiffness', 'Back Pain', 'Sleep', 'Joint Pain', 'Mobility', 'Daily Function', 'Swelling', 'Flare', 'Mood', 'Irritability', 'Notes'];
          if (!expectedHeaders.every(header => headers.includes(header))) {
            alert('Invalid CSV format. Please use a file exported from this app.');
            return;
          }
          
          const importedLogs = [];
          for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim() === '') continue;
            
            const values = lines[i].split(',');
            const log = {
              date: values[0],
              bpm: values[1],
              weight: values[2],
              fatigue: values[3],
              stiffness: values[4],
              backPain: values[5],
              sleep: values[6],
              jointPain: values[7],
              mobility: values[8],
              dailyFunction: values[9],
              swelling: values[10],
              flare: values[11],
              mood: values[12],
              irritability: values[13],
              notes: values[14] || ''
            };
            importedLogs.push(log);
          }
          
          // Merge with existing data (avoid duplicates by date)
          const existingDates = logs.map(log => log.date);
          const newLogs = importedLogs.filter(log => !existingDates.includes(log.date));
          
          if (newLogs.length === 0) {
            alert('No new entries to import. All entries in the file already exist.');
            return;
          }
          
          logs.push(...newLogs);
          localStorage.setItem("healthLogs", JSON.stringify(logs));
          renderLogs();
          updateCharts();
          updateHeartbeatAnimation(); // Update heartbeat speed after import
          updateAISummaryButtonState(); // Update AI button state
          
          alert(`Successfully imported ${newLogs.length} new health entries!`);
          
        } catch (error) {
          alert('Error reading file. Please make sure it\'s a valid CSV file exported from this app.');
          console.error('Import error:', error);
        }
      };
      reader.readAsText(file);
    }
  };
  input.click();
}


// ============================================
// AI ANALYSIS ENGINE
// Uses AIEngine.js for comprehensive local analysis
// ============================================

// Condition context (used by AIEngine)
let CONDITION_CONTEXT = {
  name: 'Ankylosing Spondylitis',
  description: 'A chronic inflammatory arthritis affecting the spine and joints',
  keyMetrics: ['backPain', 'stiffness', 'mobility', 'fatigue', 'sleep', 'flare'],
  treatmentAreas: ['pain management', 'mobility exercises', 'sleep quality', 'medication timing', 'flare prevention']
};

// Make CONDITION_CONTEXT available globally for AIEngine
window.CONDITION_CONTEXT = CONDITION_CONTEXT;

// AI Analysis functions are now in AIEngine.js
// Use AIEngine.analyzeHealthMetrics() and AIEngine.generateComprehensiveInsights()

// Legacy function wrappers for compatibility (delegate to AIEngine)
function analyzeHealthMetrics(logs) {
  if (window.AIEngine) {
    return window.AIEngine.analyzeHealthMetrics(logs);
  }
  // Fallback if AIEngine not loaded
  return { trends: {}, correlations: [], anomalies: [], advice: [], patterns: [], riskFactors: [] };
}

function generateComprehensiveInsights(analysis, logs, dayCount) {
  if (window.AIEngine) {
    return window.AIEngine.generateComprehensiveInsights(analysis, logs, dayCount);
  }
  return "AI Engine not loaded. Please refresh the page.";
}

// Legacy function (kept for any direct calls, but AIEngine has enhanced version)
function generateConditionAdvice(trends, logs) {
  if (window.AIEngine) {
    const conditionContext = window.CONDITION_CONTEXT || { name: 'your condition' };
    return window.AIEngine.generateConditionAdvice(trends, logs, conditionContext);
  }
  return [];
}

// Legacy function (kept for compatibility)
function calculateCorrelation(x, y) {
  if (window.AIEngine) {
    return window.AIEngine.calculateCorrelation(x, y);
  }
  return 0;
}

// Close settings on Escape key
document.addEventListener('keydown', function(event) {
  if (event.key === 'Escape') {
    const settingsOverlay = document.getElementById('settingsOverlay');
    if (settingsOverlay && settingsOverlay.style.display === 'flex') {
      toggleSettings();
    }
  }
});

// ============================================
// AI SUMMARY - REBUILT FROM SCRATCH
// ============================================

// Update AI Summary button state based on data availability
function updateAISummaryButtonState() {
  const aiButton = document.querySelector('.ai-action-btn');
  if (!aiButton) return;
  
  const allLogs = JSON.parse(localStorage.getItem("healthLogs") || "[]");
  const hasData = allLogs && allLogs.length > 0;
  
  if (hasData) {
    aiButton.disabled = false;
    aiButton.classList.remove('disabled');
    aiButton.style.opacity = '1';
    aiButton.style.cursor = 'pointer';
    aiButton.title = 'Generate AI Health Analysis';
  } else {
    aiButton.disabled = true;
    aiButton.classList.add('disabled');
    aiButton.style.opacity = '0.5';
    aiButton.style.cursor = 'not-allowed';
    aiButton.title = 'No data available. Start logging to generate AI analysis.';
  }
}

function generateAISummary() {
  // Get health logs from localStorage
  const allLogs = JSON.parse(localStorage.getItem("healthLogs") || "[]");
  
  // Check if we have data
  if (allLogs.length === 0) {
    alert('No health data available. Please log some entries first before generating an AI summary.');
    return;
  }

  // Get the results content element
  const resultsContent = document.getElementById('aiResultsContent');
  const aiSection = document.getElementById('aiSummarySection');
  
  if (!resultsContent) {
    console.error('AI results content element not found');
    return;
  }

  // Open the collapsible section if it's closed
  if (aiSection && !aiSection.classList.contains('open')) {
    toggleSection('aiSummarySection');
  }
  
  // Get filtered logs based on log view date range (from startDate/endDate inputs)
  // This defines the range for AI analysis
  const startDateInput = document.getElementById('startDate');
  const endDateInput = document.getElementById('endDate');
  
  let filteredLogs = logs;
  let dateRangeText = '';
  
  // Use log view date range if set, otherwise use chart date range
  if (startDateInput && endDateInput && startDateInput.value && endDateInput.value) {
    const startDate = startDateInput.value;
    const endDate = endDateInput.value;
    
    filteredLogs = logs.filter(log => {
      const logDate = new Date(log.date);
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      return logDate >= start && logDate <= end;
    });
    
    // Format date range text
    const start = new Date(startDate).toLocaleDateString();
    const end = new Date(endDate).toLocaleDateString();
    dateRangeText = `${start} to ${end}`;
  } else {
    // Fallback to chart date range
    filteredLogs = getFilteredLogs();
    
    // Determine date range description for loading message
    if (chartDateRange.type === 'custom') {
      if (chartDateRange.startDate && chartDateRange.endDate) {
        const start = new Date(chartDateRange.startDate).toLocaleDateString();
        const end = new Date(chartDateRange.endDate).toLocaleDateString();
        dateRangeText = `${start} to ${end}`;
      } else {
        dateRangeText = 'selected date range';
      }
    } else {
      dateRangeText = `last ${chartDateRange.type} days`;
    }
  }
  
  if (filteredLogs.length === 0) {
    alert('No health data available in the selected date range. Please adjust your date range or log some entries.');
    return;
  }
  
  // Sort logs chronologically (oldest first)
  const sortedLogs = filteredLogs.sort((a, b) => new Date(a.date) - new Date(b.date));
  
  // Show loading state
  resultsContent.innerHTML = `
    <div class="ai-loading-state">
      <div class="ai-loading-icon">🧠</div>
      <p class="ai-loading-text">Analyzing your health data...</p>
      <p class="ai-loading-subtext">Processing ${sortedLogs.length} days of health metrics (${dateRangeText})</p>
    </div>
  `;

  // Analyze the data after a short delay for UX
  // Use ALL historical logs for training (up to 10 years), filtered logs for display
  setTimeout(async () => {
    // Get ALL historical data from localStorage (no date filtering)
    const allLogsForTraining = JSON.parse(localStorage.getItem("healthLogs") || "[]")
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    const analysis = window.AIEngine ? 
      window.AIEngine.analyzeHealthMetrics(sortedLogs, allLogsForTraining) : 
      analyzeHealthMetrics(sortedLogs);
    
    // Use enhanced local analysis from AIEngine
    let webLLMInsights = null;
    
    // Display the combined results (with enhanced local insights)
    displayAISummary(analysis, sortedLogs, sortedLogs.length, webLLMInsights);
  }, 1500);
}

function displayAISummary(analysis, logs, dayCount, webLLMInsights = null) {
  const resultsContent = document.getElementById('aiResultsContent');
  
  if (!resultsContent) {
    console.error('AI results content element not found');
    return;
  }

  // Build the summary HTML with animation classes
  let html = '';
  let animationDelay = 0;

  // Header card - animate first
  html += `
    <div class="ai-summary-header ai-animate-in" style="animation-delay: ${animationDelay}ms;">
      <h3>✅ AI Health Analysis Complete</h3>
      <p>${dayCount} days analyzed</p>
    </div>
  `;
  animationDelay += 200;

  // AI Insights Section (from enhanced local analysis)
  let insightsText = webLLMInsights;
  
  // If no LLM insights, use enhanced local analysis
  if (!insightsText) {
    insightsText = generateComprehensiveInsights(analysis, logs, dayCount);
  }
  
  if (insightsText) {
    html += `
      <div class="ai-summary-section ai-animate-in" style="animation-delay: ${animationDelay}ms;">
        <h3 class="ai-section-title">🤖 AI-Powered Insights</h3>
        <div class="ai-llm-synopsis">
          ${insightsText.split('\n\n').map(para => {
            const trimmed = para.trim();
            if (!trimmed) return '';
            // Format markdown-style bold text
            let formatted = trimmed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            // Format bullet points
            if (trimmed.startsWith('- ')) {
              formatted = formatted.substring(2);
              return `<p class="ai-bullet-point">• ${formatted}</p>`;
            }
            // Format section headers (lines that end with colon and are short)
            if (trimmed.endsWith(':') && trimmed.length < 50) {
              return `<h4 class="ai-subsection-title">${formatted}</h4>`;
            }
            return `<p>${formatted}</p>`;
          }).join('')}
        </div>
      </div>
    `;
    animationDelay += 200;
  }

  // Trends section
  html += `
    <div class="ai-summary-section ai-animate-in" style="animation-delay: ${animationDelay}ms;">
      <h3 class="ai-section-title">📈 Trend Analysis</h3>
      <div class="ai-trends-grid">
  `;
  animationDelay += 200;
  
  Object.keys(analysis.trends).forEach((metric, index) => {
    const trend = analysis.trends[metric];
    const isBPM = metric === 'bpm';
    
    // Determine status and colors based on average vs current comparison
    // Use predictedStatus for predicted value, statusFromAverage for current trend
    const currentStatus = trend.statusFromAverage || 'stable';
    const predictedStatus = trend.predictedStatus || 'stable';
    
    // Set icon and color based on status
    let trendIcon, trendColor, predictedColor;
    if (currentStatus === 'improving') {
      trendIcon = "📈";
      trendColor = "#4caf50"; // Green
    } else if (currentStatus === 'worsening') {
      trendIcon = "📉";
      trendColor = "#f44336"; // Red
    } else {
      trendIcon = "➡️";
      trendColor = "#2196f3"; // Blue
    }
    
    // Predicted color based on predicted status
    if (predictedStatus === 'improving') {
      predictedColor = "#4caf50"; // Green
    } else if (predictedStatus === 'worsening') {
      predictedColor = "#f44336"; // Red
    } else {
      predictedColor = "#2196f3"; // Blue
    }
    
    const metricName = metric.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    const isWeight = metric === 'weight';
    
    // Format values differently for BPM, Weight vs other metrics
    let averageDisplay, currentDisplay, predictedDisplay = '';
    
    if (isBPM) {
      // BPM: whole numbers only
      averageDisplay = Math.round(trend.average).toString();
      currentDisplay = Math.round(trend.current).toString();
      if (trend.projected7Days !== undefined && trend.projected7Days !== null) {
        predictedDisplay = Math.round(trend.projected7Days).toString();
      }
    } else if (isWeight) {
      // Weight: show actual weight value with unit (1 decimal place)
      const weightUnit = appSettings.weightUnit || 'kg';
      const weightUnitSuffix = weightUnit === 'lb' ? 'lb' : 'kg';
      
      // Convert to display unit if needed
      let avgWeight = trend.average;
      let currentWeight = trend.current;
      let predictedWeight = trend.projected7Days;
      
      if (weightUnit === 'lb') {
        avgWeight = parseFloat(kgToLb(avgWeight));
        currentWeight = parseFloat(kgToLb(currentWeight));
        if (predictedWeight !== undefined && predictedWeight !== null) {
          predictedWeight = parseFloat(kgToLb(predictedWeight));
        }
      }
      
      averageDisplay = avgWeight.toFixed(1) + weightUnitSuffix;
      currentDisplay = currentWeight.toFixed(1) + weightUnitSuffix;
      if (predictedWeight !== undefined && predictedWeight !== null) {
        predictedDisplay = predictedWeight.toFixed(1) + weightUnitSuffix;
      }
    } else {
      // Other metrics: 0-10 scale
      averageDisplay = Math.round(trend.average) + '/10';
      currentDisplay = Math.round(trend.current) + '/10';
      if (trend.projected7Days !== undefined && trend.projected7Days !== null) {
        predictedDisplay = Math.round(trend.projected7Days) + '/10';
      }
    }
    
    html += `
      <div class="ai-trend-card ai-animate-in" style="border-left-color: ${trendColor}; animation-delay: ${animationDelay + (index * 100)}ms;">
        <div class="ai-trend-header">
          <strong>${trendIcon} ${metricName}</strong>
        </div>
        <div class="ai-trend-stats">
          <span>Average: <strong style="color: ${trendColor};">${averageDisplay}</strong></span>
          <span>Current: <strong style="color: ${trendColor};">${currentDisplay}</strong></span>
          ${predictedDisplay ? `<span>Predicted (7d): <strong style="color: ${predictedColor};">${predictedDisplay}</strong></span>` : ''}
        </div>
      </div>
    `;
  });
  
  html += `</div></div>`;
  animationDelay += 300;

  // Anomalies section
  if (analysis.anomalies.length > 0) {
    html += `
      <div class="ai-summary-section ai-section-warning ai-animate-in" style="animation-delay: ${animationDelay}ms;">
        <h3 class="ai-section-title ai-section-orange">⚠️ Areas of Concern</h3>
        <ul class="ai-list ai-list-warning">
    `;
    analysis.anomalies.forEach((anomaly, index) => {
      html += `<li class="ai-animate-in" style="animation-delay: ${animationDelay + 200 + (index * 100)}ms;">${anomaly}</li>`;
    });
    html += `</ul></div>`;
    animationDelay += 300;
  }

  // General management section
  html += `
    <div class="ai-summary-section ai-section-info ai-animate-in" style="animation-delay: ${animationDelay}ms;">
      <h3 class="ai-section-title ai-section-green">🏥 General ${CONDITION_CONTEXT.name} Management</h3>
      <p class="ai-disclaimer">
        <strong>Remember:</strong> This analysis is for informational purposes only. Always consult with your healthcare provider before making changes to your treatment plan. Consider sharing this data during your next appointment.
      </p>
    </div>
  `;

  // Set the HTML content
  resultsContent.innerHTML = html;
  
  // Scroll to the AI section smoothly
  const aiSection = document.getElementById('aiSummarySection');
  if (aiSection) {
    setTimeout(() => {
      aiSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  }
}

let logs = JSON.parse(localStorage.getItem("healthLogs") || "[]");

// Migrate existing logs to include food and exercise arrays
function migrateLogs() {
  let needsMigration = false;
  logs.forEach(log => {
    if (!log.food) {
      log.food = [];
      needsMigration = true;
    }
    if (!log.exercise) {
      log.exercise = [];
      needsMigration = true;
    }
  });
  if (needsMigration) {
    localStorage.setItem("healthLogs", JSON.stringify(logs));
  }
}

// Run migration on load
migrateLogs();

// Function to update heartbeat animation speed based on BPM
function updateHeartbeatAnimation() {
  const heartbeatPath = document.querySelector('.heartbeat-path');
  if (!heartbeatPath) return;
  
  // Get the most recent BPM from logs
  if (logs.length === 0) {
    // Default to 72 BPM if no logs exist
    const defaultBPM = 72;
    const duration = Math.max(0.3, Math.min(2.0, 60 / defaultBPM));
    heartbeatPath.style.animationDuration = `${duration}s`;
    return;
  }
  
  // Sort logs by date (most recent first) and get the latest BPM
  const sortedLogs = [...logs].sort((a, b) => new Date(b.date) - new Date(a.date));
  const latestBPM = parseInt(sortedLogs[0].bpm);
  
  if (isNaN(latestBPM) || latestBPM < 30 || latestBPM > 200) {
    // Invalid BPM, use default
    const defaultBPM = 72;
    const duration = Math.max(0.3, Math.min(2.0, 60 / defaultBPM));
    heartbeatPath.style.animationDuration = `${duration}s`;
    return;
  }
  
  // Calculate animation duration: 60 seconds / BPM = seconds per beat
  // Clamp between 0.3s (200 BPM) and 2.0s (30 BPM) for reasonable visual range
  const duration = Math.max(0.3, Math.min(2.0, 60 / latestBPM));
  heartbeatPath.style.animationDuration = `${duration}s`;
  
  console.log(`Heartbeat animation updated: ${latestBPM} BPM = ${duration.toFixed(2)}s per beat`);
}

// Add sample data if no data exists
if (logs.length === 0) {
  const sampleData = [
    {
      date: "2024-01-15",
      bpm: 72,
      weight: 75,
      fatigue: 4,
      stiffness: 6,
      backPain: 5,
      sleep: 7,
      jointPain: 3,
      mobility: 8,
      dailyFunction: 7,
      swelling: 2,
      flare: "No",
      mood: 6,
      irritability: 3,
      notes: "Feeling better today",
      food: ["Grilled chicken, 200g", "Brown rice, 150g", "Steamed vegetables"],
      exercise: ["Walking, 30 minutes", "Yoga, 20 minutes"]
    },
    {
      date: "2024-01-16",
      bpm: 75,
      weight: 74.8,
      fatigue: 6,
      stiffness: 7,
      backPain: 6,
      sleep: 5,
      jointPain: 5,
      mobility: 6,
      dailyFunction: 5,
      swelling: 4,
      flare: "No",
      mood: 4,
      irritability: 5,
      notes: "Rough night sleep",
      food: ["Oatmeal with berries", "Greek yogurt, 150g"],
      exercise: []
    },
    {
      date: "2024-01-17",
      bpm: 68,
      weight: 74.9,
      fatigue: 3,
      stiffness: 4,
      backPain: 3,
      sleep: 8,
      jointPain: 2,
      mobility: 9,
      dailyFunction: 8,
      swelling: 1,
      flare: "No",
      mood: 8,
      irritability: 2,
      notes: "Great day!",
      food: ["Salmon fillet, 180g", "Quinoa salad", "Fresh fruit salad"],
      exercise: ["Swimming, 25 minutes", "Stretching, 15 minutes"]
    }
  ];
  
  logs = sampleData;
  localStorage.setItem("healthLogs", JSON.stringify(logs));
  console.log("Added sample data for demonstration");
  // Update heartbeat animation after sample data is added
  setTimeout(() => updateHeartbeatAnimation(), 100);
}

function deleteLogEntry(logDate) {
  if (confirm(`Are you sure you want to delete the entry for ${logDate}?`)) {
    // Remove from logs array
    logs = logs.filter(log => log.date !== logDate);
    
    // Update localStorage
    localStorage.setItem("healthLogs", JSON.stringify(logs));
    
    // Re-render logs and update charts
    renderLogs();
    updateCharts();
    updateHeartbeatAnimation(); // Update heartbeat speed after deletion
    updateAISummaryButtonState(); // Update AI button state
    
    console.log(`Deleted log entry for ${logDate}`);
  }
}

// Food and Exercise Logging Functions
let currentEditingDate = null;
let currentFoodItems = [];
let currentExerciseItems = [];

function openFoodModal(logDate) {
  currentEditingDate = logDate;
  const log = logs.find(l => l.date === logDate);
  currentFoodItems = log && log.food ? [...log.food] : [];
  renderFoodItems();
  document.getElementById('foodModalOverlay').style.display = 'flex';
  const input = document.getElementById('newFoodItem');
  input.focus();
  // Add Enter key support
  input.onkeypress = function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addFoodItem();
    }
  };
}

function closeFoodModal() {
  document.getElementById('foodModalOverlay').style.display = 'none';
  currentEditingDate = null;
  currentFoodItems = [];
  document.getElementById('newFoodItem').value = '';
}

function addFoodItem() {
  const input = document.getElementById('newFoodItem');
  const item = input.value.trim();
  if (item) {
    currentFoodItems.push(item);
    input.value = '';
    renderFoodItems();
    input.focus();
  }
}

function removeFoodItem(index) {
  currentFoodItems.splice(index, 1);
  renderFoodItems();
}

function renderFoodItems() {
  const list = document.getElementById('foodItemsList');
  if (currentFoodItems.length === 0) {
    list.innerHTML = '<p class="empty-items">No food items logged yet.</p>';
    return;
  }
  list.innerHTML = currentFoodItems.map((item, index) => `
    <div class="item-entry">
      <span class="item-text">${item}</span>
      <button class="remove-item-btn" onclick="removeFoodItem(${index})" title="Remove">×</button>
    </div>
  `).join('');
}

function saveFoodLog() {
  if (!currentEditingDate) return;
  const log = logs.find(l => l.date === currentEditingDate);
  if (log) {
    log.food = [...currentFoodItems];
    localStorage.setItem("healthLogs", JSON.stringify(logs));
    renderLogs();
    closeFoodModal();
  }
}

function openExerciseModal(logDate) {
  currentEditingDate = logDate;
  const log = logs.find(l => l.date === logDate);
  currentExerciseItems = log && log.exercise ? [...log.exercise] : [];
  renderExerciseItems();
  document.getElementById('exerciseModalOverlay').style.display = 'flex';
  const input = document.getElementById('newExerciseItem');
  input.focus();
  // Add Enter key support
  input.onkeypress = function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addExerciseItem();
    }
  };
}

function closeExerciseModal() {
  document.getElementById('exerciseModalOverlay').style.display = 'none';
  currentEditingDate = null;
  currentExerciseItems = [];
  document.getElementById('newExerciseItem').value = '';
}

function addExerciseItem() {
  const input = document.getElementById('newExerciseItem');
  const item = input.value.trim();
  if (item) {
    currentExerciseItems.push(item);
    input.value = '';
    renderExerciseItems();
    input.focus();
  }
}

function removeExerciseItem(index) {
  currentExerciseItems.splice(index, 1);
  renderExerciseItems();
}

function renderExerciseItems() {
  const list = document.getElementById('exerciseItemsList');
  if (currentExerciseItems.length === 0) {
    list.innerHTML = '<p class="empty-items">No exercise logged yet.</p>';
    return;
  }
  list.innerHTML = currentExerciseItems.map((item, index) => `
    <div class="item-entry">
      <span class="item-text">${item}</span>
      <button class="remove-item-btn" onclick="removeExerciseItem(${index})" title="Remove">×</button>
    </div>
  `).join('');
}

function saveExerciseLog() {
  if (!currentEditingDate) return;
  const log = logs.find(l => l.date === currentEditingDate);
  if (log) {
    log.exercise = [...currentExerciseItems];
    localStorage.setItem("healthLogs", JSON.stringify(logs));
    renderLogs();
    closeExerciseModal();
  }
}

// Edit Entry Functions
let editingEntryDate = null;

function openEditEntryModal(logDate) {
  editingEntryDate = logDate;
  const log = logs.find(l => l.date === logDate);
  if (!log) return;
  
  // Populate form with existing data
  document.getElementById('editDate').value = log.date;
  document.getElementById('editBpm').value = log.bpm;
  
  // Handle weight conversion for display
  const weightDisplay = getWeightInDisplayUnit(parseFloat(log.weight));
  document.getElementById('editWeight').value = weightDisplay;
  document.getElementById('editWeightUnitDisplay').textContent = appSettings.weightUnit || 'kg';
  
  document.getElementById('editFatigue').value = log.fatigue;
  document.getElementById('editFatigueValue').textContent = log.fatigue;
  updateEditSliderColor('editFatigue');
  
  document.getElementById('editStiffness').value = log.stiffness;
  document.getElementById('editStiffnessValue').textContent = log.stiffness;
  updateEditSliderColor('editStiffness');
  
  document.getElementById('editBackPain').value = log.backPain;
  document.getElementById('editBackPainValue').textContent = log.backPain;
  updateEditSliderColor('editBackPain');
  
  document.getElementById('editSleep').value = log.sleep;
  document.getElementById('editSleepValue').textContent = log.sleep;
  updateEditSliderColor('editSleep');
  
  document.getElementById('editJointPain').value = log.jointPain;
  document.getElementById('editJointPainValue').textContent = log.jointPain;
  updateEditSliderColor('editJointPain');
  
  document.getElementById('editMobility').value = log.mobility;
  document.getElementById('editMobilityValue').textContent = log.mobility;
  updateEditSliderColor('editMobility');
  
  document.getElementById('editDailyFunction').value = log.dailyFunction;
  document.getElementById('editDailyFunctionValue').textContent = log.dailyFunction;
  updateEditSliderColor('editDailyFunction');
  
  document.getElementById('editSwelling').value = log.swelling;
  document.getElementById('editSwellingValue').textContent = log.swelling;
  updateEditSliderColor('editSwelling');
  
  document.getElementById('editFlare').value = log.flare || 'No';
  document.getElementById('editMood').value = log.mood;
  document.getElementById('editMoodValue').textContent = log.mood;
  updateEditSliderColor('editMood');
  
  document.getElementById('editIrritability').value = log.irritability;
  document.getElementById('editIrritabilityValue').textContent = log.irritability;
  updateEditSliderColor('editIrritability');
  
  document.getElementById('editNotes').value = log.notes || '';
  
  // Initialize sliders
  const editSliders = ['editFatigue', 'editStiffness', 'editBackPain', 'editSleep', 'editJointPain', 'editMobility', 'editDailyFunction', 'editSwelling', 'editMood', 'editIrritability'];
  editSliders.forEach(sliderId => {
    const slider = document.getElementById(sliderId);
    if (slider) {
      slider.addEventListener('input', function() {
        const valueSpan = document.getElementById(sliderId + 'Value');
        if (valueSpan) valueSpan.textContent = this.value;
        updateEditSliderColor(sliderId);
      });
    }
  });
  
  document.getElementById('editEntryModalOverlay').style.display = 'flex';
}

function closeEditEntryModal() {
  document.getElementById('editEntryModalOverlay').style.display = 'none';
  editingEntryDate = null;
}

function updateEditSliderColor(sliderId) {
  const slider = document.getElementById(sliderId);
  if (!slider) return;
  const value = parseInt(slider.value);
  const percentage = (value / 10) * 100;
  slider.style.background = `linear-gradient(to right, #4caf50 0%, #4caf50 ${percentage}%, rgba(255, 255, 255, 0.1) ${percentage}%, rgba(255, 255, 255, 0.1) 100%)`;
}

function toggleEditWeightUnit() {
  const currentUnit = appSettings.weightUnit || 'kg';
  const newUnit = currentUnit === 'kg' ? 'lb' : 'kg';
  appSettings.weightUnit = newUnit;
  localStorage.setItem('appSettings', JSON.stringify(appSettings));
  
  const weightInput = document.getElementById('editWeight');
  const currentValue = parseFloat(weightInput.value);
  
  if (currentUnit === 'kg') {
    weightInput.value = kgToLb(currentValue).toFixed(1);
  } else {
    weightInput.value = lbToKg(currentValue).toFixed(1);
  }
  
  document.getElementById('editWeightUnitDisplay').textContent = newUnit;
}

function saveEditedEntry() {
  if (!editingEntryDate) return;
  
  const form = document.getElementById('editEntryForm');
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }
  
  const log = logs.find(l => l.date === editingEntryDate);
  if (!log) return;
  
  // Get weight value and convert to kg if needed
  let weightValue = parseFloat(document.getElementById("editWeight").value);
  if (appSettings.weightUnit === 'lb') {
    weightValue = parseFloat(lbToKg(weightValue));
  }
  
  // Update log entry
  log.date = document.getElementById("editDate").value;
  log.bpm = document.getElementById("editBpm").value;
  log.weight = weightValue.toFixed(1);
  log.fatigue = document.getElementById("editFatigue").value;
  log.stiffness = document.getElementById("editStiffness").value;
  log.backPain = document.getElementById("editBackPain").value;
  log.sleep = document.getElementById("editSleep").value;
  log.jointPain = document.getElementById("editJointPain").value;
  log.mobility = document.getElementById("editMobility").value;
  log.dailyFunction = document.getElementById("editDailyFunction").value;
  log.swelling = document.getElementById("editSwelling").value;
  log.flare = document.getElementById("editFlare").value;
  log.mood = document.getElementById("editMood").value;
  log.irritability = document.getElementById("editIrritability").value;
  log.notes = document.getElementById("editNotes").value;
  
  // Preserve food and exercise arrays if they exist
  if (!log.food) log.food = [];
  if (!log.exercise) log.exercise = [];
  
  localStorage.setItem("healthLogs", JSON.stringify(logs));
  renderLogs();
  updateCharts();
  updateHeartbeatAnimation();
  closeEditEntryModal();
  
  // Show success message
  const successMsg = document.createElement('div');
  successMsg.className = 'success-notification';
  successMsg.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #4caf50, #66bb6a);
    color: white;
    padding: 18px 24px;
    border-radius: 16px;
    font-weight: 600;
    font-size: 1rem;
    z-index: 10000;
    box-shadow: 0 8px 24px rgba(76, 175, 80, 0.4), 0 0 20px rgba(76, 175, 80, 0.3);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    animation: slideInRight 0.4s cubic-bezier(0.4, 0, 0.2, 1), fadeOut 0.3s ease-out 2.7s forwards;
  `;
  successMsg.textContent = 'Entry updated successfully! ✅';
  document.body.appendChild(successMsg);
  setTimeout(() => {
    successMsg.style.animation = 'slideOutRight 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards';
    setTimeout(() => successMsg.remove(), 300);
  }, 3000);
}



function renderLogs() {
  output.innerHTML = "";
  logs.forEach(log => {
    const div = document.createElement("div");
    div.className = "entry";
    if (isExtreme(log)) div.classList.add("highlight");
    // Add flare-up class for red glow effect
    if (log.flare === 'Yes') div.classList.add("flare-up-entry");
    
    // Convert weight to display unit (stored as kg)
    const weightDisplay = getWeightInDisplayUnit(parseFloat(log.weight));
    const weightUnit = getWeightUnitSuffix();
    
    // Format date nicely
    const dateObj = new Date(log.date);
    const formattedDate = dateObj.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
    
    // Format flare-up status
    const flareStatus = log.flare === 'Yes' ? '<span class="flare-badge flare-yes">Flare-up</span>' : '<span class="flare-badge flare-no">No Flare-up</span>';
    
    // Count food and exercise items
    const foodCount = log.food && log.food.length > 0 ? log.food.length : 0;
    const exerciseCount = log.exercise && log.exercise.length > 0 ? log.exercise.length : 0;
    
    div.innerHTML = `
      <button class="delete-btn" onclick="deleteLogEntry('${log.date}')" title="Delete this entry">&times;</button>
      <button class="edit-btn" onclick="openEditEntryModal('${log.date}')" title="Edit this entry">✏️</button>
      <div class="log-entry-header">
        <h3 class="log-date">${formattedDate}</h3>
        ${flareStatus}
      </div>
      <div class="log-actions">
        <button class="action-button food-btn" onclick="openFoodModal('${log.date}')" title="View/Edit Food Log">
          🍽️ Food ${foodCount > 0 ? `(${foodCount})` : ''}
        </button>
        <button class="action-button exercise-btn" onclick="openExerciseModal('${log.date}')" title="View/Edit Exercise Log">
          🏃 Exercise ${exerciseCount > 0 ? `(${exerciseCount})` : ''}
        </button>
      </div>
      <div class="log-metrics-grid">
        <div class="metric-group vital-signs">
          <h4 class="metric-group-title">Vital Signs</h4>
          <div class="metric-item">
            <span class="metric-label">❤️ Heart Rate</span>
            <span class="metric-value">${log.bpm} BPM</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">⚖️ Weight</span>
            <span class="metric-value">${weightDisplay}${weightUnit}</span>
          </div>
        </div>
        <div class="metric-group symptoms">
          <h4 class="metric-group-title">Symptoms</h4>
          <div class="metric-item">
            <span class="metric-label">😴 Fatigue</span>
            <span class="metric-value">${log.fatigue}/10</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">🔒 Stiffness</span>
            <span class="metric-value">${log.stiffness}/10</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">💢 Back Pain</span>
            <span class="metric-value">${log.backPain}/10</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">🦴 Joint Pain</span>
            <span class="metric-value">${log.jointPain}/10</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">💧 Swelling</span>
            <span class="metric-value">${log.swelling}/10</span>
          </div>
        </div>
        <div class="metric-group wellbeing">
          <h4 class="metric-group-title">Wellbeing</h4>
          <div class="metric-item">
            <span class="metric-label">🌙 Sleep</span>
            <span class="metric-value">${log.sleep}/10</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">😊 Mood</span>
            <span class="metric-value">${log.mood}/10</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">😤 Irritability</span>
            <span class="metric-value">${log.irritability}/10</span>
          </div>
        </div>
        <div class="metric-group function">
          <h4 class="metric-group-title">Function</h4>
          <div class="metric-item">
            <span class="metric-label">🚶 Mobility</span>
            <span class="metric-value">${log.mobility}/10</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">📋 Daily Activities</span>
            <span class="metric-value">${log.dailyFunction}/10</span>
          </div>
        </div>
      </div>
      ${log.notes ? `<div class="log-notes"><strong>📝 Note:</strong> ${log.notes}</div>` : ''}`;
    output.appendChild(div);
  });
}

// Chart date range filter state
let chartDateRange = {
  type: 30, // 7, 30, 90, or 'custom'
  startDate: null,
  endDate: null
};

// Prediction range state
let predictionRange = 7; // 7, 30, or 90 days

// Get filtered logs based on current date range
function getFilteredLogs() {
  if (!logs || logs.length === 0) return [];
  
  let filtered = [...logs];
  
  if (chartDateRange.type === 'custom') {
    if (chartDateRange.startDate && chartDateRange.endDate) {
      const start = new Date(chartDateRange.startDate);
      const end = new Date(chartDateRange.endDate);
      end.setHours(23, 59, 59, 999); // Include entire end date
      
      filtered = filtered.filter(log => {
        const logDate = new Date(log.date);
        return logDate >= start && logDate <= end;
      });
    }
  } else {
    // Days range (7, 30, 90)
    const days = chartDateRange.type;
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);
    
    filtered = filtered.filter(log => {
      const logDate = new Date(log.date);
      return logDate >= startDate && logDate <= endDate;
    });
  }
  
  return filtered;
}

// Set chart date range
function setChartDateRange(range) {
  chartDateRange.type = range;
  
  // Update button states
  document.querySelectorAll('.date-range-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  if (range === 'custom') {
    document.getElementById('rangeCustom').classList.add('active');
    document.getElementById('customDateRangeSelector').classList.remove('hidden');
    
    // Set default dates if not already set
    const startInput = document.getElementById('chartStartDate');
    const endInput = document.getElementById('chartEndDate');
    
    if (!startInput.value || !endInput.value) {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30); // Default to last 30 days
      
      startInput.value = startDate.toISOString().split('T')[0];
      endInput.value = endDate.toISOString().split('T')[0];
      
      chartDateRange.startDate = startInput.value;
      chartDateRange.endDate = endInput.value;
    }
  } else {
    document.getElementById(`range${range}Days`).classList.add('active');
    document.getElementById('customDateRangeSelector').classList.add('hidden');
    chartDateRange.startDate = null;
    chartDateRange.endDate = null;
  }
  
  // Refresh charts with filtered data
  refreshCharts();
}

// Apply custom date range
function applyCustomDateRange() {
  const startInput = document.getElementById('chartStartDate');
  const endInput = document.getElementById('chartEndDate');
  
  if (startInput.value && endInput.value) {
    chartDateRange.startDate = startInput.value;
    chartDateRange.endDate = endInput.value;
    refreshCharts();
  }
}

// Set prediction range
function setPredictionRange(range) {
  predictionRange = range;
  console.log(`Prediction range set to: ${range} days`);
  
  // Update button states
  document.querySelectorAll('.prediction-range-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  const buttonId = `predRange${range}Days`;
  const button = document.getElementById(buttonId);
  if (button) {
    button.classList.add('active');
  } else {
    console.warn(`Button with id '${buttonId}' not found`);
  }
  
  // Refresh charts with new prediction range
  refreshCharts();
}

// Refresh all charts with current filter
function refreshCharts() {
  if (appSettings.combinedChart) {
    createCombinedChart();
  } else {
    updateCharts();
  }
}

function chart(id, label, dataField, color) {
  // Check if ApexCharts is available
  if (typeof ApexCharts === 'undefined') {
    console.error('ApexCharts is not loaded! Cannot create charts.');
    return;
  }
  
  const container = document.getElementById(id);
  if (!container) {
    console.error(`Container element with id '${id}' not found`);
    return;
  }
  
  // Get filtered logs based on date range
  const filteredLogs = getFilteredLogs();
  
  // Check if we have data
  if (!filteredLogs || filteredLogs.length === 0) {
    console.warn(`No data available for chart: ${label} (after date filter)`);
    // Show empty state message
    if (container.querySelector('.chart-loading')) {
      container.querySelector('.chart-loading').textContent = 'No data in selected date range';
      container.querySelector('.chart-loading').style.display = 'flex';
    }
    return;
  }
  
  // Destroy existing chart if it exists
  if (container.chart) {
    container.chart.destroy();
  }
  
  // Prepare data and filter out invalid entries
  const chartData = filteredLogs
    .filter(log => {
      // For weight, check if value exists and is valid (weight can be any positive number)
      if (dataField === 'weight') {
        const weightValue = log[dataField];
        return weightValue !== undefined && weightValue !== null && weightValue !== '' && !isNaN(parseFloat(weightValue)) && parseFloat(weightValue) > 0;
      }
      // For other metrics, use standard filter
      return log[dataField] !== undefined && log[dataField] !== null && log[dataField] !== '';
    })
    .map(log => {
      let value = parseFloat(log[dataField]);
      // For weight, ensure we have a valid number
      if (dataField === 'weight') {
        if (isNaN(value) || value <= 0) {
          return null; // Skip invalid weight entries
        }
        // Convert weight to display unit if needed
        if (appSettings.weightUnit === 'lb') {
          value = parseFloat(kgToLb(value));
        }
      } else {
        // For other metrics, use || 0 fallback
        value = value || 0;
      }
      // Parse date properly for ApexCharts datetime type
      const dateValue = new Date(log.date).getTime();
      if (isNaN(dateValue)) {
        return null; // Skip invalid dates
      }
      return {
        x: dateValue, // Use timestamp for datetime axis
        y: value
      };
    })
    .filter(item => item !== null) // Remove any null entries
    .sort((a, b) => a.x - b.x); // Sort by timestamp
  
  if (chartData.length === 0) {
    console.warn(`No valid data for chart: ${label}`);
    return;
  }
  
  // Generate predicted data for the selected date range period
  let predictedData = [];
  if (window.AIEngine && chartData.length >= 2) {
    try {
      // Use prediction range setting
      const daysToPredict = predictionRange;
      
      // Get ALL historical logs for training (no date filtering - use everything available)
      // This ensures we use up to 10 years of data for better predictions
      const allHistoricalLogs = JSON.parse(localStorage.getItem("healthLogs") || "[]")
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      
      // Filter to only logs with this metric for training
      const allLogs = allHistoricalLogs
        .filter(log => {
          // For weight, check if value exists and is valid (weight can be any positive number)
          if (dataField === 'weight') {
            const weightValue = log[dataField];
            return weightValue !== undefined && weightValue !== null && weightValue !== '' && !isNaN(parseFloat(weightValue)) && parseFloat(weightValue) > 0;
          }
          // For other metrics, use standard filter
          return log[dataField] !== undefined && log[dataField] !== null && log[dataField] !== '';
        });
      
      if (allLogs.length >= 2) {
        // Sort filtered logs chronologically for getting the last date (for prediction start point)
        const sortedLogs = filteredLogs
          .filter(log => {
            // For weight, check if value exists and is valid (weight can be any positive number)
            if (dataField === 'weight') {
              const weightValue = log[dataField];
              return weightValue !== undefined && weightValue !== null && weightValue !== '' && !isNaN(parseFloat(weightValue)) && parseFloat(weightValue) > 0;
            }
            // For other metrics, use standard filter
            return log[dataField] !== undefined && log[dataField] !== null && log[dataField] !== '';
          })
          .sort((a, b) => new Date(a.date) - new Date(b.date));
        
        if (sortedLogs.length >= 2) {
          // Analyze with AIEngine: use ALL historical logs for training (up to 10 years),
          // filtered logs just for determining last date and display
          const analysis = window.AIEngine.analyzeHealthMetrics(sortedLogs, allLogs);
          
          if (analysis.trends[dataField]) {
            const trend = analysis.trends[dataField];
            const lastDate = new Date(sortedLogs[sortedLogs.length - 1].date);
            const isBPM = dataField === 'bpm';
            
            // Generate predictions for the selected period using regression from all data
            if (trend.regression) {
              const regression = trend.regression;
              const isWeight = dataField === 'weight';
              
              // Get the last date from training data to calculate days since start
              const firstTrainingDate = new Date(allLogs[0].date);
              const lastTrainingDate = new Date(allLogs[allLogs.length - 1].date);
              const lastX = Math.floor((lastTrainingDate - firstTrainingDate) / (1000 * 60 * 60 * 24));
              
              // Use AIEngine's improved prediction method with metric-specific context
              const metricContext = {
                variance: trend.variance || 0,
                average: trend.average || 0,
                metricName: dataField,
                trainingValues: allLogs.map(log => {
                  const val = parseFloat(log[dataField]);
                  // For weight, ensure we return a valid number (weight should never be 0)
                  if (dataField === 'weight') {
                    return isNaN(val) || val <= 0 ? null : val;
                  }
                  return val || 0;
                }).filter(v => v !== null) // Remove null values for weight
              };
              const predictions = window.AIEngine.predictFutureValues(
                { slope: regression.slope, intercept: regression.intercept },
                lastX,
                daysToPredict,
                isBPM,
                isWeight,
                metricContext
              );
              
              // Generate predictions using the improved method
              for (let i = 0; i < daysToPredict; i++) {
                const value = predictions[i];
                
                // Convert weight to display unit if needed
                if (dataField === 'weight' && appSettings.weightUnit === 'lb') {
                  value = parseFloat(kgToLb(value));
                  value = Math.round(value * 10) / 10; // Weight: 1 decimal place
                }
                
                const futureDate = new Date(lastDate);
                futureDate.setDate(futureDate.getDate() + (i + 1)); // i+1 because predictions start from day 1
                
                predictedData.push({
                  x: futureDate.getTime(),
                  y: value
                });
              }
            }
          }
        }
      }
    } catch (error) {
      console.warn(`Error generating predictions for ${dataField}:`, error);
    }
  }
  
  // Debug logging for weight chart
  if (dataField === 'weight') {
    console.log(`Weight chart data:`, chartData.slice(0, 5));
    console.log(`Weight values range:`, {
      min: Math.min(...chartData.map(d => d.y)),
      max: Math.max(...chartData.map(d => d.y)),
      count: chartData.length
    });
  }
  
  console.log(`Creating ApexChart for ${label} with ${chartData.length} data points`);
  
  // Prepare series array
  const series = [{
    name: label,
    data: chartData
  }];
  
  // Add predicted data as a separate series if available
  if (predictedData.length > 0) {
    // Create a lighter/different color for predictions
    let predictionColor = color;
    if (color.includes('rgb(')) {
      const rgbMatch = color.match(/\d+/g);
      if (rgbMatch) {
        predictionColor = `rgba(${rgbMatch.join(', ')}, 0.6)`;
      }
    } else if (color.includes('#')) {
      // Convert hex to rgba
      const hex = color.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      predictionColor = `rgba(${r}, ${g}, ${b}, 0.6)`;
    }
    
    series.push({
      name: `${label} (Predicted)`,
      data: predictedData,
      color: predictionColor,
      stroke: {
        dashArray: 5
      }
    });
  }
  
  const options = {
    series: series,
    chart: {
      type: 'line',
      height: 350,
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: false,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: false,
          reset: true
        }
      },
      background: 'transparent',
      selection: {
        enabled: true,
        type: 'x',
        fill: {
          color: 'rgba(76, 175, 80, 0.1)'
        },
        stroke: {
          width: 1,
          dashArray: 3,
          color: '#4caf50',
          opacity: 0.4
        }
      },
      zoom: {
        enabled: true,
        type: 'x',
        autoScaleYaxis: true
      },
      pan: {
        enabled: true,
        type: 'x'
      },
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
        animateGradually: {
          enabled: true,
          delay: 150
        },
        dynamicAnimation: {
          enabled: true,
          speed: 350
        }
      },
      events: {
        dataPointSelection: function(event, chartContext, config) {
          // Optional: Add click handler for data points
        }
      }
    },
    title: {
      text: label,
      align: 'center',
      style: {
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#e0f2f1'
      }
    },
    stroke: {
      curve: 'smooth',
      width: 3,
      lineCap: 'round'
    },
    markers: {
      size: 4,
      colors: series.map((s, i) => i === 0 ? color : (s.color || color)),
      strokeColors: '#fff',
      strokeWidth: 2,
      hover: {
        size: 6,
        sizeOffset: 2
      },
      shape: 'circle',
      showNullDataPoints: false
    },
    colors: series.map((s, i) => i === 0 ? color : (s.color || color)),
    xaxis: {
      type: 'datetime',
      title: {
        text: 'Date',
        style: {
          color: '#e0f2f1',
          fontSize: '14px',
          fontWeight: 'bold'
        }
      },
      labels: {
        style: {
          colors: '#e0f2f1'
        }
      }
    },
    yaxis: {
      title: {
        text: getYAxisLabel(dataField),
        style: {
          color: '#e0f2f1',
          fontSize: '14px',
          fontWeight: 'bold'
        }
      },
      labels: {
        style: {
          colors: '#e0f2f1'
        },
        formatter: dataField === 'weight' ? function(val) {
          return val.toFixed(1);
        } : undefined
      },
      min: dataField === 'weight' ? undefined : 0,
      max: getMaxValue(dataField)
    },
    grid: {
      borderColor: '#374151',
      strokeDashArray: 4,
      xaxis: {
        lines: {
          show: true
        }
      },
      yaxis: {
        lines: {
          show: true
        }
      },
      padding: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
      }
    },
    tooltip: {
      theme: 'dark',
      x: {
        format: 'dd MMM yyyy'
      }
    }
  };
  
  // Apply light mode styles if in light mode
  if (false) { // Always dark mode
    options.title.style.color = '#1b5e20';
    options.xaxis.title.style.color = '#1b5e20';
    options.xaxis.labels.style.colors = '#1b5e20';
    options.yaxis.title.style.color = '#1b5e20';
    options.yaxis.labels.style.colors = '#1b5e20';
    options.grid.borderColor = '#81c784';
    options.tooltip.theme = 'light';
  }
  
  // Hide loading placeholder before creating chart
  const loadingElement = container.querySelector('.chart-loading');
  if (loadingElement) {
    loadingElement.style.display = 'none';
  }
  
  container.chart = new ApexCharts(container, options);
  container.chart.render().then(() => {
    // Ensure loading is hidden after render
    if (loadingElement) {
      loadingElement.style.display = 'none';
    }
    // Mark container as loaded
    container.classList.add('loaded');
  });
}

function getYAxisLabel(dataField) {
  const labels = {
    bpm: 'BPM',
    weight: `Weight (${appSettings.weightUnit || 'kg'})`,
    fatigue: 'Level (1-10)',
    stiffness: 'Level (1-10)',
    backPain: 'Level (1-10)',
    sleep: 'Quality (1-10)',
    jointPain: 'Level (1-10)',
    mobility: 'Level (1-10)',
    dailyFunction: 'Level (1-10)',
    swelling: 'Level (1-10)',
    mood: 'Level (1-10)',
    irritability: 'Level (1-10)'
  };
  return labels[dataField] || 'Value';
}

function getMaxValue(dataField) {
  if (dataField === 'bpm') return 120;
  if (dataField === 'weight') return null; // Auto scale
  return 10; // Most metrics are 1-10 scale
}

// Lazy loading system
let chartObserver;
const loadedCharts = new Set();

function initializeLazyLoading() {
  // Check if Intersection Observer is supported
  if (!('IntersectionObserver' in window)) {
    console.warn('IntersectionObserver not supported, falling back to immediate chart loading');
    updateChartsImmediate();
    return;
  }

  // Create intersection observer for lazy loading
  chartObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const container = entry.target;
        const chartType = container.dataset.chartType;
        
        if (!loadedCharts.has(chartType)) {
          loadedCharts.add(chartType);
          loadChart(container, chartType);
          
          // Stop observing this chart
          chartObserver.unobserve(container);
        }
      }
    });
  }, {
    rootMargin: '100px', // Start loading 100px before chart becomes visible
    threshold: 0.01 // Lower threshold for better detection
  });

  // Start observing all lazy charts
  const lazyCharts = document.querySelectorAll('.lazy-chart');
  lazyCharts.forEach(chart => {
    chartObserver.observe(chart);
  });
  
  // Fallback: load charts immediately if they're already visible
  setTimeout(() => {
    const visibleCharts = Array.from(lazyCharts).filter(chart => {
      const rect = chart.getBoundingClientRect();
      return rect.top < window.innerHeight && rect.bottom > 0;
    });
    
    visibleCharts.forEach(chart => {
      const chartType = chart.dataset.chartType;
      if (!loadedCharts.has(chartType)) {
        console.log(`Force loading visible chart: ${chartType}`);
        loadedCharts.add(chartType);
        loadChart(chart, chartType);
        chartObserver.unobserve(chart);
      }
    });
  }, 500);
}

function loadChart(container, chartType) {
  const chartConfig = {
    bpm: { label: "Resting Heart Rate", field: "bpm", color: "rgb(76,175,80)" },
    weight: { label: "Weight", field: "weight", color: "rgb(33,150,243)" },
    fatigue: { label: "Fatigue Level", field: "fatigue", color: "rgb(255,152,0)" },
    stiffness: { label: "Stiffness Level", field: "stiffness", color: "rgb(255,193,7)" },
    backPain: { label: "Back Pain Level", field: "backPain", color: "rgb(244,67,54)" },
    sleep: { label: "Sleep Quality", field: "sleep", color: "rgb(63,81,181)" },
    jointPain: { label: "Joint Pain Level", field: "jointPain", color: "rgb(255,87,34)" },
    mobility: { label: "Mobility Level", field: "mobility", color: "rgb(0,188,212)" },
    dailyFunction: { label: "Daily Function Level", field: "dailyFunction", color: "rgb(139,195,74)" },
    swelling: { label: "Joint Swelling Level", field: "swelling", color: "rgb(156,39,176)" },
    mood: { label: "Mood Level", field: "mood", color: "rgb(103,58,183)" },
    irritability: { label: "Irritability Level", field: "irritability", color: "rgb(121,85,72)" }
  };

  const config = chartConfig[chartType];
  if (config) {
    // Hide loading placeholder immediately
    const loadingElement = container.querySelector('.chart-loading');
    if (loadingElement) {
      loadingElement.style.display = 'none';
    }
    
    setTimeout(() => {
      chart(container.id, config.label, config.field, config.color);
      container.classList.add('loaded');
    }, 100); // Small delay for smooth loading effect
  }
}

function updateChartsImmediate() {
  // Check if we have data
  const hasData = logs && logs.length > 0;
  updateChartEmptyState(hasData);
  
  if (!hasData) {
    // Hide all loading placeholders
    document.querySelectorAll('.chart-loading').forEach(loading => {
      loading.style.display = 'none';
    });
    return;
  }
  
  // Hide all loading placeholders first
  document.querySelectorAll('.chart-loading').forEach(loading => {
    loading.style.display = 'none';
  });
  
  // Create all individual charts immediately
  chart("bpmChart", "Resting Heart Rate", "bpm", "rgb(76,175,80)");
  chart("weightChart", "Weight", "weight", "rgb(33,150,243)");
  chart("fatigueChart", "Fatigue Level", "fatigue", "rgb(255,152,0)");
  chart("stiffnessChart", "Stiffness Level", "stiffness", "rgb(255,193,7)");
  chart("backPainChart", "Back Pain Level", "backPain", "rgb(244,67,54)");
  chart("sleepChart", "Sleep Quality", "sleep", "rgb(63,81,181)");
  chart("jointPainChart", "Joint Pain Level", "jointPain", "rgb(255,87,34)");
  chart("mobilityChart", "Mobility Level", "mobility", "rgb(0,188,212)");
  chart("dailyFunctionChart", "Daily Function Level", "dailyFunction", "rgb(139,195,74)");
  chart("swellingChart", "Joint Swelling Level", "swelling", "rgb(156,39,176)");
  chart("moodChart", "Mood Level", "mood", "rgb(103,58,183)");
  chart("irritabilityChart", "Irritability Level", "irritability", "rgb(121,85,72)");
}

// Update empty state placeholder visibility
function updateChartEmptyState(hasData) {
  const placeholder = document.getElementById('chartEmptyPlaceholder');
  const combinedContainer = document.getElementById('combinedChartContainer');
  const individualContainer = document.getElementById('individualChartsContainer');
  
  if (!placeholder) return;
  
  if (!hasData) {
    // Show placeholder, hide chart containers
    placeholder.classList.remove('hidden');
    if (combinedContainer) combinedContainer.classList.add('hidden');
    if (individualContainer) individualContainer.classList.add('hidden');
  } else {
    // Hide placeholder, show appropriate chart container based on view
    placeholder.classList.add('hidden');
    // Chart containers will be shown/hidden by toggleChartView
  }
}

function updateCharts() {
  // Check if ApexCharts is loaded
  if (typeof ApexCharts === 'undefined') {
    console.warn('ApexCharts not loaded yet, retrying in 500ms...');
    setTimeout(updateCharts, 500);
    return;
  }
  
  console.log('Updating charts with', logs.length, 'log entries');
  
  // Check if we have any data to display
  const hasData = logs && logs.length > 0;
  updateChartEmptyState(hasData);
  
  // Only handle individual charts - combined is handled by toggleChartView
    // Use lazy loading if enabled (default), otherwise load immediately
    if (appSettings.lazy !== false) {
      // Clear loaded charts set to allow reloading
      loadedCharts.clear();
      
      // Reset chart containers to show loading state
      const lazyCharts = document.querySelectorAll('.lazy-chart');
      lazyCharts.forEach(chart => {
        chart.classList.remove('loaded');
        // Destroy existing chart if it exists
        if (chart.chart) {
          chart.chart.destroy();
          chart.chart = null;
        }
      });
      
      // Reinitialize lazy loading
      if (chartObserver) {
        chartObserver.disconnect();
      }
      
      // Check if charts are visible, if so initialize lazy loading
      const chartSection = document.getElementById('chartSection');
      if (!chartSection.classList.contains('hidden')) {
        setTimeout(() => {
          initializeLazyLoading();
        }, 100); // Small delay to ensure DOM is ready
      }
    } else {
      // Load all charts immediately if lazy loading is disabled
      updateChartsImmediate();
  }
}

form.addEventListener("submit", e => {
  e.preventDefault();
  
  // Validate form before submission
  if (!formValidator.validateForm()) {
    console.log('Form validation failed');
    // Scroll to validation summary
    const summaryElement = document.getElementById('validationSummary');
    if (summaryElement && summaryElement.classList.contains('show')) {
      summaryElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return;
  }
  
  // Get weight value and convert to kg if needed
  let weightValue = parseFloat(document.getElementById("weight").value);
  if (appSettings.weightUnit === 'lb') {
    weightValue = parseFloat(lbToKg(weightValue));
  }
  
  const newEntry = {
    date: document.getElementById("date").value,
    bpm: document.getElementById("bpm").value,
    weight: weightValue.toFixed(1), // Always store as kg
    fatigue: document.getElementById("fatigue").value,
    stiffness: document.getElementById("stiffness").value,
    backPain: document.getElementById("backPain").value,
    sleep: document.getElementById("sleep").value,
    jointPain: document.getElementById("jointPain").value,
    mobility: document.getElementById("mobility").value,
    dailyFunction: document.getElementById("dailyFunction").value,
    swelling: document.getElementById("swelling").value,
    flare: document.getElementById("flare").value,
    mood: document.getElementById("mood").value,
    irritability: document.getElementById("irritability").value,
    notes: document.getElementById("notes").value,
    food: [], // Initialize food array
    exercise: [] // Initialize exercise array
  };
  
  // Check for duplicate dates
  const existingEntry = logs.find(log => log.date === newEntry.date);
  if (existingEntry) {
    if (confirm(`An entry for ${newEntry.date} already exists. Do you want to update it?`)) {
      const index = logs.findIndex(log => log.date === newEntry.date);
      logs[index] = newEntry;
    } else {
      return;
    }
  } else {
    logs.push(newEntry);
  }
  
  localStorage.setItem("healthLogs", JSON.stringify(logs));
  renderLogs();
  updateCharts();
  updateHeartbeatAnimation(); // Update heartbeat speed based on new BPM
  updateAISummaryButtonState(); // Update AI button state
  
  // Switch to logs tab after saving
  switchTab('logs');
  
  // Show success message
  const successMsg = document.createElement('div');
  successMsg.className = 'success-notification';
  successMsg.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #4caf50, #66bb6a);
    color: white;
    padding: 18px 24px;
    border-radius: 16px;
    font-weight: 600;
    font-size: 1rem;
    z-index: 10000;
    box-shadow: 0 8px 24px rgba(76, 175, 80, 0.4), 0 0 20px rgba(76, 175, 80, 0.3);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    animation: slideInRight 0.4s cubic-bezier(0.4, 0, 0.2, 1), fadeOut 0.3s ease-out 2.7s forwards;
    transform: translateX(0);
    opacity: 1;
  `;
  successMsg.textContent = existingEntry ? 'Entry updated successfully! ✅' : 'Entry saved successfully! ✅';
  document.body.appendChild(successMsg);
  
  setTimeout(() => {
    successMsg.style.animation = 'slideOutRight 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards';
  setTimeout(() => {
    successMsg.remove();
    }, 300);
  }, 3000);
  
  form.reset();
  document.getElementById("date").valueAsDate = new Date();
  document.getElementById("flare").value = "No"; // Set default flare value
  
  // Clear validation errors after successful submission
  formValidator.clearAllErrors();
  
  // Reset sliders to default values and update their colors
  sliders.forEach(sliderId => {
    const slider = document.getElementById(sliderId);
    slider.value = 5;
    updateSliderColor(slider);
  });
});

function isExtreme(log) {
  let extremeCount = 0;
  
  if (log.backPain >= 8) extremeCount++;
  if (log.fatigue >= 8) extremeCount++;
  if (log.stiffness >= 8) extremeCount++;
  if (log.jointPain >= 8) extremeCount++;
  if (log.flare === "Yes") extremeCount++;
  
  return extremeCount >= 3;
}

// Settings functionality
let appSettings = {
  showCharts: true, // Enable charts by default
  combinedChart: false,
  reminder: true,
  sound: false,
  backup: true,
  compress: false,
  animations: true,
  lazy: true,
  userName: '',
  weightUnit: 'kg', // 'kg' or 'lb', always store as kg
  medicalCondition: 'Ankylosing Spondylitis' // Default condition, user can change
};

// Load settings from localStorage
function loadSettings() {
  const savedSettings = localStorage.getItem('healthAppSettings');
  if (savedSettings) {
    appSettings = { ...appSettings, ...JSON.parse(savedSettings) };
  }
  
  // Apply loaded settings to UI
  applySettings();
  loadSettingsState();
}

function saveSettings() {
  localStorage.setItem('healthAppSettings', JSON.stringify(appSettings));
}

function applySettings() {
  // Always use dark mode
    document.body.classList.remove('light-mode');
    document.body.classList.add('dark-mode');
  
  // Charts are always visible in charts tab - no settings needed
  // Chart view toggle is handled by buttons in the chart tab
  
  // Update dashboard title
  updateDashboardTitle();
}

function loadSettingsState() {
  // Update toggle switches to reflect current settings
  document.getElementById('reminderToggle').classList.toggle('active', appSettings.reminder);
  document.getElementById('soundToggle').classList.toggle('active', appSettings.sound);
  document.getElementById('backupToggle').classList.toggle('active', appSettings.backup);
  document.getElementById('compressToggle').classList.toggle('active', appSettings.compress);
  document.getElementById('animationsToggle').classList.toggle('active', appSettings.animations);
  document.getElementById('lazyToggle').classList.toggle('active', appSettings.lazy);
  const demoModeToggle = document.getElementById('demoModeToggle');
  if (demoModeToggle) {
    demoModeToggle.classList.toggle('active', appSettings.demoMode || false);
  }
  
  // Load user name
  const userNameInput = document.getElementById('userNameInput');
  if (userNameInput && appSettings.userName) {
    userNameInput.value = appSettings.userName;
  }
  
  const medicalConditionInput = document.getElementById('medicalConditionInput');
  if (medicalConditionInput) {
    medicalConditionInput.value = appSettings.medicalCondition || 'Ankylosing Spondylitis';
  }
  
  // Update condition context with stored value
  if (appSettings.medicalCondition) {
    updateConditionContext(appSettings.medicalCondition);
  }
  
  // Initialize weight unit display and constraints
  if (appSettings.weightUnit) {
    const unitDisplay = document.getElementById('weightUnitDisplay');
    if (unitDisplay) {
      unitDisplay.textContent = appSettings.weightUnit;
    }
    updateWeightInputConstraints();
  }
}

function toggleSetting(setting) {
  appSettings[setting] = !appSettings[setting];
  saveSettings();
  applySettings();
  loadSettingsState();
}

function toggleSettings() {
  const overlay = document.getElementById('settingsOverlay');
  if (overlay.style.display === 'flex') {
    overlay.style.display = 'none';
  } else {
    overlay.style.display = 'flex';
    loadSettingsState();
  }
}

function updateUserName() {
  const userNameInput = document.getElementById('userNameInput');
  appSettings.userName = userNameInput.value;
  saveSettings();
  updateDashboardTitle();
}

function updateMedicalCondition() {
  const medicalConditionInput = document.getElementById('medicalConditionInput');
  if (medicalConditionInput) {
    const condition = medicalConditionInput.value.trim() || 'Ankylosing Spondylitis';
    appSettings.medicalCondition = condition;
    saveSettings();
    
    // Update CONDITION_CONTEXT for AI analysis
    updateConditionContext(condition);
    
      // Sync to cloud if authenticated (but not in demo mode)
      if (!appSettings.demoMode && typeof cloudSyncState !== 'undefined' && cloudSyncState.isAuthenticated && typeof syncToCloud === 'function') {
        setTimeout(() => syncToCloud(), 500);
      }
  }
}

// Demo Mode Functions - Optimized for performance
function generateDemoData(numDays = 3650) {
  // Generate 10 years of demo data (3650 days) - Optimized version
  const demoLogs = new Array(numDays); // Pre-allocate array for better performance
  const today = new Date();
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() - 1); // Yesterday
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - (numDays - 1));
  
  // Pre-calculate date strings to avoid repeated Date operations
  const startTimestamp = startDate.getTime();
  const oneDayMs = 86400000; // Milliseconds in a day
  
  // Track state for realistic trends
  let currentWeight = 75.0;
  let flareState = false;
  let flareDuration = 0;
  
  // Pre-generate random numbers in batches for better performance
  const batchSize = 1000;
  let randomBatch = [];
  let randomIndex = 0;
  
  function getRandom() {
    if (randomIndex >= randomBatch.length) {
      randomBatch = new Array(batchSize);
      for (let i = 0; i < batchSize; i++) {
        randomBatch[i] = Math.random();
      }
      randomIndex = 0;
    }
    return randomBatch[randomIndex++];
  }
  
  // Pre-define note templates
  const noteTemplates = [
    'Feeling better today',
    'Morning stiffness was manageable',
    'Had a good night\'s sleep',
    'Some joint pain in the morning',
    'Feeling tired',
    'Good day overall',
    'Minor flare symptoms',
    'Exercised today, feeling good'
  ];
  
  // Generate consecutive daily entries - optimized loop
  for (let day = 0; day < numDays; day++) {
    // Calculate date more efficiently
    const dateTimestamp = startTimestamp + (day * oneDayMs);
    const date = new Date(dateTimestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const dayOfMonth = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${dayOfMonth}`;
    
    // Simulate flare-ups (flare can last 2-5 days) - optimized
    if (flareDuration > 0) {
      flareDuration--;
      if (flareDuration === 0) {
        flareState = false;
      }
    } else if (getRandom() < 0.15) { // 15% chance of starting a flare
      flareState = true;
      flareDuration = Math.floor(getRandom() * 4) + 2; // 2-5 days
    }
    
    // Pre-calculate random values
    const r1 = getRandom();
    const r2 = getRandom();
    const r3 = getRandom();
    const r4 = getRandom();
    const r5 = getRandom();
    const r6 = getRandom();
    const r7 = getRandom();
    const r8 = getRandom();
    const r9 = getRandom();
    const r10 = getRandom();
    const r11 = getRandom();
    const r12 = getRandom();
    
    // During flare-ups, symptoms are worse - use pre-calculated randoms
    let fatigue, stiffness, backPain, jointPain, sleep, mobility, dailyFunction, swelling, mood, irritability, bpm;
    
    if (flareState) {
      fatigue = Math.floor(r1 * 5) + 5; // 5-9
      stiffness = Math.floor(r2 * 5) + 6; // 6-10
      backPain = Math.floor(r3 * 5) + 6; // 6-10
      jointPain = Math.floor(r4 * 5) + 5; // 5-9
      sleep = Math.floor(r5 * 4) + 3; // 3-6
      mobility = Math.floor(r6 * 4) + 3; // 3-6
      dailyFunction = Math.floor(r7 * 5) + 3; // 3-7
      swelling = Math.floor(r8 * 5) + 4; // 4-8
      mood = Math.floor(r9 * 4) + 3; // 3-6
      irritability = Math.floor(r10 * 5) + 5; // 5-9
      bpm = Math.floor(r11 * 26) + 70; // 70-95
    } else {
      fatigue = Math.floor(r1 * 5) + 2; // 2-6
      stiffness = Math.floor(r2 * 5) + 1; // 1-5
      backPain = Math.floor(r3 * 5) + 1; // 1-5
      jointPain = Math.floor(r4 * 4) + 1; // 1-4
      sleep = Math.floor(r5 * 4) + 6; // 6-9
      mobility = Math.floor(r6 * 4) + 6; // 6-9
      dailyFunction = Math.floor(r7 * 4) + 6; // 6-9
      swelling = Math.floor(r8 * 3) + 1; // 1-3
      mood = Math.floor(r9 * 5) + 5; // 5-9
      irritability = Math.floor(r10 * 4) + 1; // 1-4
      bpm = Math.floor(r11 * 26) + 60; // 60-85
    }
    
    // Weight: Slight variation around base (within ±2kg) - optimized
    const weightChange = (r12 - 0.5) * 0.6; // -0.3 to 0.3
    currentWeight += weightChange;
    currentWeight = currentWeight < 70 ? 70 : (currentWeight > 80 ? 80 : currentWeight); // Clamp between 70-80kg
    const weight = Math.round(currentWeight * 10) / 10;
    
    // Notes: Occasionally add notes (only check if needed)
    let notes = '';
    if (getRandom() < 0.1) { // 10% chance of note
      notes = noteTemplates[Math.floor(getRandom() * noteTemplates.length)];
    }
    
    // Generate food and exercise data
    const foodItems = [];
    const exerciseItems = [];
    
    // Food items - 60% chance of having food logged
    if (getRandom() < 0.6) {
      const numFoodItems = Math.floor(getRandom() * 4) + 1; // 1-4 items
      const foodTemplates = [
        'Grilled chicken, 200g',
        'Brown rice, 150g',
        'Steamed vegetables',
        'Salmon fillet, 180g',
        'Quinoa salad',
        'Greek yogurt, 150g',
        'Oatmeal with berries',
        'Whole grain bread, 2 slices',
        'Mixed nuts, 30g',
        'Fresh fruit salad',
        'Eggs, 2 large',
        'Avocado toast',
        'Grilled fish, 200g',
        'Sweet potato, 200g',
        'Green smoothie'
      ];
      
      for (let i = 0; i < numFoodItems; i++) {
        const foodIndex = Math.floor(getRandom() * foodTemplates.length);
        foodItems.push(foodTemplates[foodIndex]);
      }
    }
    
    // Exercise items - 40% chance of having exercise logged
    if (getRandom() < 0.4) {
      const numExerciseItems = Math.floor(getRandom() * 3) + 1; // 1-3 items
      const exerciseTemplates = [
        'Walking, 30 minutes',
        'Yoga, 20 minutes',
        'Swimming, 25 minutes',
        'Cycling, 40 minutes',
        'Stretching, 15 minutes',
        'Light jogging, 20 minutes',
        'Pilates, 30 minutes',
        'Tai Chi, 25 minutes',
        'Water aerobics, 30 minutes',
        'Physical therapy exercises, 20 minutes',
        'Gentle strength training, 15 minutes',
        'Balance exercises, 10 minutes'
      ];
      
      for (let i = 0; i < numExerciseItems; i++) {
        const exerciseIndex = Math.floor(getRandom() * exerciseTemplates.length);
        exerciseItems.push(exerciseTemplates[exerciseIndex]);
      }
    }
    
    // Create object directly (avoiding push for better performance)
    demoLogs[day] = {
      date: dateStr,
      bpm: String(bpm),
      weight: weight.toFixed(1),
      flare: flareState ? 'Yes' : 'No',
      fatigue: String(fatigue),
      stiffness: String(stiffness),
      backPain: String(backPain),
      sleep: String(sleep),
      jointPain: String(jointPain),
      mobility: String(mobility),
      dailyFunction: String(dailyFunction),
      swelling: String(swelling),
      mood: String(mood),
      irritability: String(irritability),
      notes: notes,
      food: foodItems,
      exercise: exerciseItems
    };
  }
  
  return demoLogs;
}

function toggleDemoMode() {
  const isDemoMode = appSettings.demoMode || false;
  
  if (isDemoMode) {
    // Disable demo mode - restore original data
    const originalLogs = localStorage.getItem('healthLogs_backup');
    const originalSettings = localStorage.getItem('appSettings_backup');
    
    if (originalLogs) {
      localStorage.setItem('healthLogs', originalLogs);
      logs = JSON.parse(originalLogs);
    }
    
    if (originalSettings) {
      const restoredSettings = JSON.parse(originalSettings);
      appSettings = { ...appSettings, ...restoredSettings };
      saveSettings();
      
      // Update UI
      const userNameInput = document.getElementById('userNameInput');
      const medicalConditionInput = document.getElementById('medicalConditionInput');
      if (userNameInput) userNameInput.value = appSettings.userName || '';
      if (medicalConditionInput) medicalConditionInput.value = appSettings.medicalCondition || '';
      updateDashboardTitle();
      updateConditionContext(appSettings.medicalCondition || 'Ankylosing Spondylitis');
    }
    
    // Clear backup
    localStorage.removeItem('healthLogs_backup');
    localStorage.removeItem('appSettings_backup');
    
    appSettings.demoMode = false;
    saveSettings();
    
    // Refresh UI
    renderLogs();
    updateCharts();
    updateHeartbeatAnimation();
    loadSettingsState();
    
    alert('Demo mode disabled. Your original data has been restored.');
  } else {
    // Enable demo mode - backup current data and load demo data
    if (confirm('Enable demo mode? This will temporarily replace your data with 10 years of sample data. Your original data will be restored when you disable demo mode.')) {
      // Show loading indicator
      const loadingMsg = document.createElement('div');
      loadingMsg.className = 'success-notification';
      loadingMsg.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #4caf50, #66bb6a);
        color: white;
        padding: 24px 32px;
        border-radius: 16px;
        font-weight: 600;
        font-size: 1.1rem;
        z-index: 10001;
        box-shadow: 0 8px 24px rgba(76, 175, 80, 0.4);
        text-align: center;
      `;
      loadingMsg.textContent = '🔄 Generating demo data... This may take a moment.';
      document.body.appendChild(loadingMsg);
      
      // Backup current data
      const currentLogs = localStorage.getItem('healthLogs');
      const currentSettings = JSON.stringify(appSettings);
      
      if (currentLogs) {
        localStorage.setItem('healthLogs_backup', currentLogs);
      }
      localStorage.setItem('appSettings_backup', currentSettings);
      
      // Use setTimeout to allow UI to update before heavy computation
      setTimeout(() => {
        try {
          // Generate and load demo data (optimized)
          const demoLogs = generateDemoData(3650); // 10 years
          
          // Store data efficiently
          localStorage.setItem('healthLogs', JSON.stringify(demoLogs));
          logs = demoLogs;
          
          // Update settings for demo
          appSettings.userName = 'John Doe';
          appSettings.medicalCondition = 'Arthritis';
          appSettings.demoMode = true;
          saveSettings();
          
          // Update UI
          const userNameInput = document.getElementById('userNameInput');
          const medicalConditionInput = document.getElementById('medicalConditionInput');
          if (userNameInput) userNameInput.value = 'John Doe';
          if (medicalConditionInput) medicalConditionInput.value = 'Arthritis';
          updateDashboardTitle();
          updateConditionContext('Arthritis');
          
          // Refresh UI
          renderLogs();
          updateCharts();
          updateHeartbeatAnimation();
          loadSettingsState();
          
          // Remove loading indicator
          if (document.body.contains(loadingMsg)) {
            document.body.removeChild(loadingMsg);
          }
          
          alert('Demo mode enabled! 10 years of sample data loaded. Your original data is safely backed up.');
        } catch (error) {
          console.error('Error generating demo data:', error);
          if (document.body.contains(loadingMsg)) {
            document.body.removeChild(loadingMsg);
          }
          alert('Error generating demo data. Please try again.');
        }
      }, 100); // Small delay to allow UI update
    }
  }
}

function updateConditionContext(conditionName) {
  // Update the condition context with user's condition
  CONDITION_CONTEXT.name = conditionName;
  
  // Update description based on common conditions (can be expanded)
  const conditionDescriptions = {
    'Ankylosing Spondylitis': 'A chronic inflammatory arthritis affecting the spine and joints',
    'Rheumatoid Arthritis': 'An autoimmune disorder causing joint inflammation and pain',
    'Fibromyalgia': 'A condition characterized by widespread pain and fatigue',
    'Arthritis': 'A general term for conditions affecting joints and surrounding tissues',
    'Lupus': 'An autoimmune disease that can affect various body systems',
    'Osteoarthritis': 'A degenerative joint disease causing cartilage breakdown',
    'Psoriatic Arthritis': 'A form of arthritis associated with psoriasis'
  };
  
  CONDITION_CONTEXT.description = conditionDescriptions[conditionName] || 'A chronic health condition requiring ongoing management';
  
  // Keep existing metrics and treatment areas (can be customized per condition later)
  console.log(`Condition context updated to: ${conditionName}`);
}

// Initialize condition context from settings
function initializeConditionContext() {
  const condition = appSettings.medicalCondition || 'Ankylosing Spondylitis';
  updateConditionContext(condition);
}

// Old function - keeping for backward compatibility but updating it
function updateMedicalConditionOld() {
  const medicalConditionInput = document.getElementById('medicalConditionInput');
  const condition = medicalConditionInput.value.trim() || 'Ankylosing Spondylitis';
  appSettings.medicalCondition = condition;
  saveSettings();
  updateConditionContext(condition);
  
  // Show confirmation
  const successMsg = document.createElement('div');
  successMsg.className = 'success-notification';
  successMsg.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #4caf50, #66bb6a);
    color: white;
    padding: 12px 20px;
    border-radius: 12px;
    font-weight: 600;
    font-size: 0.9rem;
    z-index: 10000;
    box-shadow: 0 8px 24px rgba(76, 175, 80, 0.4);
    animation: slideInRight 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  `;
  successMsg.textContent = `Medical condition updated to: ${condition}`;
  document.body.appendChild(successMsg);
  
  setTimeout(() => {
    successMsg.style.animation = 'slideOutRight 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards';
    setTimeout(() => successMsg.remove(), 300);
  }, 2000);
}

// Update condition context dynamically
function updateConditionContext(conditionName) {
  CONDITION_CONTEXT.name = conditionName;
  // Update description based on condition (you can expand this)
  if (conditionName.toLowerCase().includes('ankylosing') || conditionName.toLowerCase().includes('spondylitis')) {
    CONDITION_CONTEXT.description = 'A chronic inflammatory arthritis affecting the spine and joints';
  } else if (conditionName.toLowerCase().includes('arthritis')) {
    CONDITION_CONTEXT.description = 'A condition affecting joints and mobility';
  } else if (conditionName.toLowerCase().includes('fibromyalgia')) {
    CONDITION_CONTEXT.description = 'A condition characterized by widespread pain and fatigue';
  } else if (conditionName.toLowerCase().includes('lupus')) {
    CONDITION_CONTEXT.description = 'An autoimmune disease that can affect various parts of the body';
  } else if (conditionName.toLowerCase().includes('rheumatoid')) {
    CONDITION_CONTEXT.description = 'An autoimmune condition causing joint inflammation and pain';
  } else {
    CONDITION_CONTEXT.description = 'A chronic health condition requiring ongoing management';
  }
}

function updateDashboardTitle() {
  const titleElement = document.getElementById('dashboardTitle');
  const userName = appSettings.userName;
  
  if (userName && userName.trim() !== '') {
    const newTitle = `Welcome to ${userName}'s health`;
    titleElement.textContent = newTitle;
    titleElement.setAttribute('data-text', newTitle);
    document.title = `${userName.charAt(0).toUpperCase() + userName.slice(1)}'s Health Dashboard`;
  } else {
    titleElement.textContent = 'Health Dashboard';
    titleElement.setAttribute('data-text', 'Health Dashboard');
    document.title = 'Health Dashboard';
  }
}

// Filtering and sorting functionality
let currentSortOrder = 'newest'; // 'newest' or 'oldest'

// Set log view date range (7, 30, or 90 days)
function setLogViewRange(days) {
  // Calculate date range
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (days - 1));
  startDate.setHours(0, 0, 0, 0);
  
  // Update date inputs
  const startDateInput = document.getElementById('startDate');
  const endDateInput = document.getElementById('endDate');
  
  if (startDateInput && endDateInput) {
    startDateInput.value = startDate.toISOString().split('T')[0];
    endDateInput.value = endDate.toISOString().split('T')[0];
  }
  
  // Update chart date range to match
  chartDateRange.type = days;
  chartDateRange.startDate = startDateInput.value;
  chartDateRange.endDate = endDateInput.value;
  
  // Update chart date range buttons
  document.querySelectorAll('.date-range-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  const chartButtonId = `range${days}Days`;
  const chartButton = document.getElementById(chartButtonId);
  if (chartButton) {
    chartButton.classList.add('active');
  }
  
  // Update log view range buttons
  document.querySelectorAll('.log-date-range-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  const logButtonId = `logRange${days}Days`;
  const logButton = document.getElementById(logButtonId);
  if (logButton) {
    logButton.classList.add('active');
  }
  
  // Hide custom date range selector if it was showing
  document.getElementById('customDateRangeSelector').classList.add('hidden');
  
  // Filter and render logs
  filterLogs();
  
  // Refresh charts to match the new range
  refreshCharts();
}

function checkAndUpdateViewRangeButtons() {
  // Check if the current date range matches any predefined range (7, 30, 90 days)
  const startDateInput = document.getElementById('startDate');
  const endDateInput = document.getElementById('endDate');
  
  if (!startDateInput || !endDateInput || !startDateInput.value || !endDateInput.value) {
    // If dates are empty, deselect all buttons
    document.querySelectorAll('.log-date-range-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    return;
  }
  
  const startDate = new Date(startDateInput.value);
  const endDate = new Date(endDateInput.value);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  
  // Check if end date is today (or very close to today)
  const endDateDiff = Math.abs(today - endDate);
  const oneDayMs = 86400000;
  const isEndDateToday = endDateDiff < oneDayMs;
  
  if (!isEndDateToday) {
    // End date is not today, so it's a custom range - deselect all buttons
    document.querySelectorAll('.log-date-range-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    return;
  }
  
  // Calculate the number of days between start and end
  const daysDiff = Math.ceil((endDate - startDate) / oneDayMs) + 1; // +1 to include both start and end days
  
  // Check if it matches any predefined range
  if (daysDiff === 7 || daysDiff === 30 || daysDiff === 90) {
    // Check if start date matches the expected start date for this range
    const expectedStartDate = new Date(today);
    expectedStartDate.setDate(expectedStartDate.getDate() - (daysDiff - 1));
    expectedStartDate.setHours(0, 0, 0, 0);
    
    const startDateMatch = Math.abs(startDate - expectedStartDate) < oneDayMs;
    
    if (startDateMatch) {
      // Matches a predefined range - select the appropriate button
      document.querySelectorAll('.log-date-range-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      const logButtonId = `logRange${daysDiff}Days`;
      const logButton = document.getElementById(logButtonId);
      if (logButton) {
        logButton.classList.add('active');
      }
    } else {
      // Doesn't match exactly - deselect all buttons
      document.querySelectorAll('.log-date-range-btn').forEach(btn => {
        btn.classList.remove('active');
      });
    }
  } else {
    // Doesn't match any predefined range - deselect all buttons
    document.querySelectorAll('.log-date-range-btn').forEach(btn => {
      btn.classList.remove('active');
    });
  }
}

function filterLogs() {
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;
  
  // Check and update View Range buttons based on current date selection
  checkAndUpdateViewRangeButtons();
  
  if (!startDate && !endDate) {
    renderLogs();
    return;
  }
  
  const filteredLogs = logs.filter(log => {
    const logDate = new Date(log.date);
    const start = startDate ? new Date(startDate) : new Date('1900-01-01');
    const end = endDate ? new Date(endDate) : new Date('2100-12-31');
    
    return logDate >= start && logDate <= end;
  });
  
  renderFilteredLogs(filteredLogs);
}

function toggleSort() {
  currentSortOrder = currentSortOrder === 'newest' ? 'oldest' : 'newest';
  document.getElementById('sortOrder').textContent = currentSortOrder === 'newest' ? 'Newest' : 'Oldest';
  
  const sortedLogs = [...logs].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return currentSortOrder === 'newest' ? dateB - dateA : dateA - dateB;
  });
  
  renderSortedLogs(sortedLogs);
}

function renderFilteredLogs(filteredLogs) {
  output.innerHTML = "";
  filteredLogs.forEach(log => {
    const div = document.createElement("div");
    div.className = "entry";
    if (isExtreme(log)) div.classList.add("highlight");
    // Add flare-up class for red glow effect
    if (log.flare === 'Yes') div.classList.add("flare-up-entry");
    
    // Convert weight to display unit (stored as kg)
    const weightDisplay = getWeightInDisplayUnit(parseFloat(log.weight));
    const weightUnit = getWeightUnitSuffix();
    
    // Format date nicely
    const dateObj = new Date(log.date);
    const formattedDate = dateObj.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
    
    // Format flare-up status
    const flareStatus = log.flare === 'Yes' ? '<span class="flare-badge flare-yes">Flare-up</span>' : '<span class="flare-badge flare-no">No Flare-up</span>';
    
    // Count food and exercise items
    const foodCount = log.food && log.food.length > 0 ? log.food.length : 0;
    const exerciseCount = log.exercise && log.exercise.length > 0 ? log.exercise.length : 0;
    
    div.innerHTML = `
      <button class="delete-btn" onclick="deleteLogEntry('${log.date}')" title="Delete this entry">&times;</button>
      <button class="edit-btn" onclick="openEditEntryModal('${log.date}')" title="Edit this entry">✏️</button>
      <div class="log-entry-header">
        <h3 class="log-date">${formattedDate}</h3>
        ${flareStatus}
      </div>
      <div class="log-actions">
        <button class="action-button food-btn" onclick="openFoodModal('${log.date}')" title="View/Edit Food Log">
          🍽️ Food ${foodCount > 0 ? `(${foodCount})` : ''}
        </button>
        <button class="action-button exercise-btn" onclick="openExerciseModal('${log.date}')" title="View/Edit Exercise Log">
          🏃 Exercise ${exerciseCount > 0 ? `(${exerciseCount})` : ''}
        </button>
      </div>
      <div class="log-metrics-grid">
        <div class="metric-group vital-signs">
          <h4 class="metric-group-title">Vital Signs</h4>
          <div class="metric-item">
            <span class="metric-label">❤️ Heart Rate</span>
            <span class="metric-value">${log.bpm} BPM</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">⚖️ Weight</span>
            <span class="metric-value">${weightDisplay}${weightUnit}</span>
          </div>
        </div>
        <div class="metric-group symptoms">
          <h4 class="metric-group-title">Symptoms</h4>
          <div class="metric-item">
            <span class="metric-label">😴 Fatigue</span>
            <span class="metric-value">${log.fatigue}/10</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">🔒 Stiffness</span>
            <span class="metric-value">${log.stiffness}/10</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">💢 Back Pain</span>
            <span class="metric-value">${log.backPain}/10</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">🦴 Joint Pain</span>
            <span class="metric-value">${log.jointPain}/10</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">💧 Swelling</span>
            <span class="metric-value">${log.swelling}/10</span>
          </div>
        </div>
        <div class="metric-group wellbeing">
          <h4 class="metric-group-title">Wellbeing</h4>
          <div class="metric-item">
            <span class="metric-label">🌙 Sleep</span>
            <span class="metric-value">${log.sleep}/10</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">😊 Mood</span>
            <span class="metric-value">${log.mood}/10</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">😤 Irritability</span>
            <span class="metric-value">${log.irritability}/10</span>
          </div>
        </div>
        <div class="metric-group function">
          <h4 class="metric-group-title">Function</h4>
          <div class="metric-item">
            <span class="metric-label">🚶 Mobility</span>
            <span class="metric-value">${log.mobility}/10</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">📋 Daily Activities</span>
            <span class="metric-value">${log.dailyFunction}/10</span>
          </div>
        </div>
      </div>
      ${log.notes ? `<div class="log-notes"><strong>📝 Note:</strong> ${log.notes}</div>` : ''}`;
    output.appendChild(div);
  });
}

function renderSortedLogs(sortedLogs) {
  output.innerHTML = "";
  sortedLogs.forEach(log => {
    const div = document.createElement("div");
    div.className = "entry";
    if (isExtreme(log)) div.classList.add("highlight");
    // Add flare-up class for red glow effect
    if (log.flare === 'Yes') div.classList.add("flare-up-entry");
    
    // Convert weight to display unit (stored as kg)
    const weightDisplay = getWeightInDisplayUnit(parseFloat(log.weight));
    const weightUnit = getWeightUnitSuffix();
    
    // Format date nicely
    const dateObj = new Date(log.date);
    const formattedDate = dateObj.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
    
    // Format flare-up status
    const flareStatus = log.flare === 'Yes' ? '<span class="flare-badge flare-yes">Flare-up</span>' : '<span class="flare-badge flare-no">No Flare-up</span>';
    
    // Count food and exercise items
    const foodCount = log.food && log.food.length > 0 ? log.food.length : 0;
    const exerciseCount = log.exercise && log.exercise.length > 0 ? log.exercise.length : 0;
    
    div.innerHTML = `
      <button class="delete-btn" onclick="deleteLogEntry('${log.date}')" title="Delete this entry">&times;</button>
      <button class="edit-btn" onclick="openEditEntryModal('${log.date}')" title="Edit this entry">✏️</button>
      <div class="log-entry-header">
        <h3 class="log-date">${formattedDate}</h3>
        ${flareStatus}
      </div>
      <div class="log-actions">
        <button class="action-button food-btn" onclick="openFoodModal('${log.date}')" title="View/Edit Food Log">
          🍽️ Food ${foodCount > 0 ? `(${foodCount})` : ''}
        </button>
        <button class="action-button exercise-btn" onclick="openExerciseModal('${log.date}')" title="View/Edit Exercise Log">
          🏃 Exercise ${exerciseCount > 0 ? `(${exerciseCount})` : ''}
        </button>
      </div>
      <div class="log-metrics-grid">
        <div class="metric-group vital-signs">
          <h4 class="metric-group-title">Vital Signs</h4>
          <div class="metric-item">
            <span class="metric-label">❤️ Heart Rate</span>
            <span class="metric-value">${log.bpm} BPM</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">⚖️ Weight</span>
            <span class="metric-value">${weightDisplay}${weightUnit}</span>
          </div>
        </div>
        <div class="metric-group symptoms">
          <h4 class="metric-group-title">Symptoms</h4>
          <div class="metric-item">
            <span class="metric-label">😴 Fatigue</span>
            <span class="metric-value">${log.fatigue}/10</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">🔒 Stiffness</span>
            <span class="metric-value">${log.stiffness}/10</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">💢 Back Pain</span>
            <span class="metric-value">${log.backPain}/10</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">🦴 Joint Pain</span>
            <span class="metric-value">${log.jointPain}/10</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">💧 Swelling</span>
            <span class="metric-value">${log.swelling}/10</span>
          </div>
        </div>
        <div class="metric-group wellbeing">
          <h4 class="metric-group-title">Wellbeing</h4>
          <div class="metric-item">
            <span class="metric-label">🌙 Sleep</span>
            <span class="metric-value">${log.sleep}/10</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">😊 Mood</span>
            <span class="metric-value">${log.mood}/10</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">😤 Irritability</span>
            <span class="metric-value">${log.irritability}/10</span>
          </div>
        </div>
        <div class="metric-group function">
          <h4 class="metric-group-title">Function</h4>
          <div class="metric-item">
            <span class="metric-label">🚶 Mobility</span>
            <span class="metric-value">${log.mobility}/10</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">📋 Daily Activities</span>
            <span class="metric-value">${log.dailyFunction}/10</span>
          </div>
        </div>
      </div>
      ${log.notes ? `<div class="log-notes"><strong>📝 Note:</strong> ${log.notes}</div>` : ''}`;
    output.appendChild(div);
  });
}

// Collapsible section functionality
function toggleSection(sectionId) {
  const section = document.getElementById(sectionId);
  const header = section?.previousElementSibling;
  const arrow = header?.querySelector('.section-arrow');
  
  if (section && header) {
    const isOpen = section.classList.contains('open');
    
    if (isOpen) {
      section.classList.remove('open');
      if (arrow) arrow.textContent = '▶';
    } else {
      section.classList.add('open');
      if (arrow) arrow.textContent = '▼';
    }
  }
}

// Initialize all sections as collapsed by default
function initializeSections() {
  const sections = document.querySelectorAll('.section-content');
  sections.forEach(section => {
    // Remove 'open' class to keep sections collapsed
    section.classList.remove('open');
    const header = section.previousElementSibling;
    const arrow = header?.querySelector('.section-arrow');
    if (arrow) arrow.textContent = '▶';
  });
}

// Tab switching functionality
function switchTab(tabName) {
  console.log('Switching to tab:', tabName);
  
  // Hide all tabs
  const allTabs = document.querySelectorAll('.tab-content');
  const allTabBtns = document.querySelectorAll('.tab-btn');
  
  allTabs.forEach(tab => {
    tab.classList.remove('active');
    tab.style.display = 'none';
  });
  
  allTabBtns.forEach(btn => {
    btn.classList.remove('active');
  });
  
  // AI results container is always visible at bottom of container when it has content
  // No need to hide/show based on tab switching - it stays at the bottom
  
  // Show selected tab
  const selectedTab = document.getElementById(tabName + 'Tab');
  const selectedBtn = document.querySelector(`[data-tab="${tabName}"]`);
  
  console.log('Selected tab element:', selectedTab);
  console.log('Selected button element:', selectedBtn);
  
  if (selectedTab) {
    selectedTab.classList.add('active');
    selectedTab.style.display = 'block';
    selectedTab.style.visibility = 'visible';
    selectedTab.style.opacity = '1';
    console.log('Tab activated:', tabName);
  } else {
    console.error('Tab not found:', tabName + 'Tab');
  }
  
  if (selectedBtn) {
    selectedBtn.classList.add('active');
  }
  
  // Special handling for charts tab
  if (tabName === 'charts') {
    const chartSection = document.getElementById('chartSection');
    if (chartSection) {
      chartSection.classList.remove('hidden');
      
      // Initialize chart view based on saved preference without jumping
      const combinedContainer = document.getElementById('combinedChartContainer');
      const individualContainer = document.getElementById('individualChartsContainer');
      const individualBtn = document.getElementById('individualViewBtn');
      const combinedBtn = document.getElementById('combinedViewBtn');
      
      // Set default if not set
      if (appSettings.combinedChart === undefined) {
        appSettings.combinedChart = false;
        saveSettings();
      }
      
      if (appSettings.combinedChart) {
        // Show combined view
        combinedContainer.classList.remove('hidden');
        individualContainer.classList.add('hidden');
        if (combinedBtn) combinedBtn.classList.add('active');
        if (individualBtn) individualBtn.classList.remove('active');
        // Small delay to prevent jump
        setTimeout(() => {
          createCombinedChart();
        }, 100);
      } else {
        // Show individual view
        combinedContainer.classList.add('hidden');
        individualContainer.classList.remove('hidden');
        if (individualBtn) individualBtn.classList.add('active');
        if (combinedBtn) combinedBtn.classList.remove('active');
        // Update charts when switching to charts tab
        setTimeout(() => {
          updateCharts();
        }, 200);
      }
    }
  }
  
  // Special handling for logs tab - ensure it's visible
  if (tabName === 'logs') {
    // Logs are always visible in their tab
  }
  
  // Scroll to top smoothly
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Initialize the app
window.addEventListener('load', () => {
  // Always set dark mode on load
  document.body.classList.remove('light-mode');
  document.body.classList.add('dark-mode');
  
  loadSettings();
  renderLogs();
  updateCharts(); // Check for empty state on page load
  updateAISummaryButtonState(); // Update AI button state on page load
  
  // Initialize weight unit
  if (!appSettings.weightUnit) {
    appSettings.weightUnit = 'kg';
    saveSettings();
  }
  
  // Initialize medical condition
  if (!appSettings.medicalCondition) {
    appSettings.medicalCondition = 'Ankylosing Spondylitis';
    saveSettings();
  }
  
  // Update condition context with stored value
  if (appSettings.medicalCondition) {
    updateConditionContext(appSettings.medicalCondition);
  }
  
  updateWeightInputConstraints();
  updateHeartbeatAnimation(); // Initialize heartbeat animation speed
  
  // Prepopulate date filters with last 7 days
  initializeDateFilters();
  
  // Show charts tab content if charts are enabled
  if (appSettings.showCharts) {
    const chartSection = document.getElementById('chartSection');
    if (chartSection) {
      chartSection.classList.remove('hidden');
    }
  }
  
  // Initialize on log entry tab
  switchTab('log');
  
  // Initialize collapsible sections
  initializeSections();
  
  // Initialize chart date range to 30 days
  setChartDateRange(30);
  setPredictionRange(7); // Initialize prediction range to 7 days
  setLogViewRange(30); // Initialize log view range to 30 days
});

function initializeDateFilters() {
  const today = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 7);
  
  // Format dates for input[type="date"]
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const startDateInput = document.getElementById('startDate');
  const endDateInput = document.getElementById('endDate');
  
  if (startDateInput && endDateInput) {
    startDateInput.value = formatDate(sevenDaysAgo);
    endDateInput.value = formatDate(today);
    
    // Add event listeners to detect manual date changes
    startDateInput.addEventListener('change', () => {
      checkAndUpdateViewRangeButtons();
    });
    
    endDateInput.addEventListener('change', () => {
      checkAndUpdateViewRangeButtons();
    });
    
    // Automatically apply the filter
    setTimeout(() => {
      filterLogs();
    }, 100);
  }
}
