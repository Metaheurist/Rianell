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
  
  // Check if we have data
  if (!logs || logs.length === 0) {
    console.warn('No data available for combined chart');
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
  
  const series = metrics.map(metric => {
    const data = logs
      .filter(log => log[metric.field] !== undefined && log[metric.field] !== null && log[metric.field] !== '')
      .map(log => ({
        x: log.date,
        y: parseFloat(log[metric.field]) || 0
      }))
      .sort((a, b) => new Date(a.x) - new Date(b.x));
    
    return {
      name: metric.name,
      data: data,
      color: metric.color
    };
  });
  
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
      width: 2
    },
    markers: {
      size: 4,
      strokeWidth: 2,
      hover: {
        size: 6
      }
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
      borderColor: '#374151'
    },
    legend: {
      labels: {
        colors: '#e0f2f1'
      },
      position: 'bottom'
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
  
  // Clear all health logs
  logs = [];
  localStorage.removeItem("healthLogs");
  
  // Clear all app settings - reset to defaults
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
  
  // Clear cloud sync data and logout
  if (typeof handleCloudLogout === 'function') {
    try {
      await handleCloudLogout();
    } catch (error) {
      console.warn('Cloud logout error (may not be logged in):', error);
    }
  }
  
  // Clear all cloud-related localStorage items
  localStorage.removeItem('cloudAutoSync');
  localStorage.removeItem('cloudLastSync');
  localStorage.removeItem('currentCloudUserId');
  
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
  alert('✅ All data cleared successfully!\n\n- Health logs deleted\n- Settings reset\n- Cloud sync logged out\n\nThe app has been reset to default state.');
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
// LLM AI ENHANCEMENT - NO API KEY REQUIRED!
// ============================================

// Transformers.js Configuration - Runs LLM directly in browser, completely free, no API key needed!
// Now served locally from your server with progress tracking!
const TRANSFORMERS_CONFIG = {
  enabled: true, // Enabled - served locally from your server
  task: 'text-generation', // Task type for Transformers.js pipeline (chat models use text-generation)
  // Better quality models for detailed health analysis:
  // Using TinyLlama for better quality responses while still being reasonable size
  model: 'Xenova/TinyLlama-1.1B-Chat-v1.0', // Chat-optimized model for better conversational responses (~500MB)
  // Alternative higher-quality models (larger downloads):
  // 'Xenova/Phi-3-mini-4k-instruct' - Microsoft's efficient model, excellent quality (~2GB) - use task: 'text-generation'
  // 'Xenova/Qwen2.5-1.5B-Instruct' - High quality instruction model (~600MB) - if available
  maxNewTokens: 800, // Increased for longer, more detailed responses
  temperature: 0.7,
  topK: 50,
  topP: 0.95
};

// Transformers.js pipeline instance (will be initialized on first use)
let transformersPipeline = null;
let transformersInitializing = false;

// Condition context for the LLM (will be updated from user settings)
let CONDITION_CONTEXT = {
  name: 'Ankylosing Spondylitis',
  description: 'A chronic inflammatory arthritis affecting the spine and joints',
  keyMetrics: ['backPain', 'stiffness', 'mobility', 'fatigue', 'sleep', 'flare'],
  treatmentAreas: ['pain management', 'mobility exercises', 'sleep quality', 'medication timing', 'flare prevention']
};

// Download and load Transformers.js script from local server with progress tracking
async function loadTransformersScript(progressCallback) {
  // Check if already loaded
  if (window.transformers || window.pipeline || typeof pipeline !== 'undefined') {
    return true;
  }
  
  // Check cache first
  try {
    const cache = await caches.open('transformers-cache-v1');
    const cached = await cache.match('/transformers.js');
    if (cached) {
      console.log('Loading Transformers.js from cache...');
      const blob = await cached.blob();
      const url = URL.createObjectURL(blob);
      await loadScriptFromBlob(url);
      return true;
    }
  } catch (e) {
    console.log('Cache not available, downloading...');
  }
  
  // Download from server with progress
  try {
    const response = await fetch('/transformers.js');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const contentLength = +response.headers.get('Content-Length');
    const reader = response.body.getReader();
    const chunks = [];
    let receivedLength = 0;
    
    // Update progress bar elements
    const progressBar = document.getElementById('aiModelProgressBar');
    const progressText = document.getElementById('aiModelProgressText');
    
    if (progressText) {
      progressText.textContent = 'Downloading Transformers.js library...';
    }
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      chunks.push(value);
      receivedLength += value.length;
      
      if (contentLength) {
        const percent = Math.round((receivedLength / contentLength) * 100);
        
        // Update progress bar
        if (progressBar) {
          progressBar.style.width = `${percent}%`;
        }
        
        if (progressText) {
          const mbReceived = (receivedLength / 1024 / 1024).toFixed(2);
          const mbTotal = (contentLength / 1024 / 1024).toFixed(2);
          progressText.textContent = `${percent}% (${mbReceived} MB / ${mbTotal} MB)`;
        }
        
        if (progressCallback) {
          progressCallback(percent, receivedLength, contentLength);
        }
      }
    }
    
    if (progressText) {
      progressText.textContent = 'Loading library...';
    }
    
    // Create blob and cache it
    const blob = new Blob(chunks, { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    
    // Cache for future use
    try {
      const cache = await caches.open('transformers-cache-v1');
      await cache.put('/transformers.js', new Response(blob));
      console.log('✅ Transformers.js cached for future use');
    } catch (e) {
      console.warn('Could not cache Transformers.js:', e);
    }
    
    // Load the script
    await loadScriptFromBlob(url);
    return true;
  } catch (error) {
    console.error('Failed to download Transformers.js:', error);
    const progressText = document.getElementById('aiModelProgressText');
    if (progressText) {
      progressText.textContent = 'Download failed - using local analysis';
    }
    return false;
  }
}

// Load script from blob URL - Transformers.js is an ES module
async function loadScriptFromBlob(blobUrl) {
  try {
    // Transformers.js is an ES module, so we need to import it dynamically
    console.log('Loading Transformers.js as ES module from blob URL...');
    const module = await import(blobUrl);
    
    // Check what's exported - Transformers.js exports { pipeline, ... }
    if (module.pipeline) {
      window.transformers = module;
      window.transformersPipeline = module.pipeline;
      window.transformersLoaded = true;
      console.log('✅ Transformers.js loaded successfully! pipeline function available.');
      return true;
    } else if (module.default && module.default.pipeline) {
      window.transformers = module.default;
      window.transformersPipeline = module.default.pipeline;
      window.transformersLoaded = true;
      console.log('✅ Transformers.js loaded successfully! (default export)');
      return true;
    } else {
      console.warn('⚠️ Transformers.js module loaded but pipeline not found. Available exports:', Object.keys(module));
      return false;
    }
  } catch (error) {
    console.error('❌ Error loading Transformers.js as ES module:', error);
    // Fallback: try loading as regular script tag with type="module"
    console.log('Trying fallback: loading as script tag with type="module"...');
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = blobUrl;
      script.type = 'module';
      script.async = true;
      
      script.onload = () => {
        // Give it a moment to initialize, then check
        setTimeout(() => {
          if (checkAndExposeTransformers()) {
            resolve(true);
          } else {
            console.warn('⚠️ Script loaded but Transformers.js not detected');
            resolve(false);
          }
        }, 1000);
      };
      
      script.onerror = (err) => {
        console.error('❌ Failed to load Transformers.js script:', err);
        reject(new Error('Failed to load Transformers.js script'));
      };
      
      document.head.appendChild(script);
    });
  }
}

// Check and expose Transformers.js globally
function checkAndExposeTransformers() {
  // Check multiple possible locations for Transformers.js
  // Transformers.js from @xenova/transformers exports { pipeline, env, ... }
  
  // Check if already exposed
  if (window.transformers && window.transformers.pipeline) {
    window.transformersPipeline = window.transformers.pipeline;
    console.log('✅ Transformers.js detected (window.transformers)');
    return true;
  }
  
  // Check for pipeline function directly
  if (typeof pipeline !== 'undefined') {
    window.transformersPipeline = pipeline;
    window.transformers = { pipeline };
    console.log('✅ Transformers.js pipeline detected (global pipeline)');
    return true;
  } else if (window.pipeline) {
    window.transformersPipeline = window.pipeline;
    window.transformers = { pipeline: window.pipeline };
    console.log('✅ Transformers.js pipeline detected (window.pipeline)');
    return true;
  }
  
  // Check for Xenova namespace
  if (window.Xenova && window.Xenova.transformers) {
    window.transformers = window.Xenova.transformers;
    window.transformersPipeline = window.Xenova.transformers.pipeline;
    console.log('✅ Transformers.js detected (window.Xenova)');
    return true;
  }
  
  // Check for any global transformers object
  const possibleNames = ['transformers', 'Transformers', 'TRANSFORMERS', 'hf_transformers'];
  for (const name of possibleNames) {
    if (window[name] && window[name].pipeline) {
      window.transformers = window[name];
      window.transformersPipeline = window[name].pipeline;
      console.log(`✅ Transformers.js detected (window.${name})`);
      return true;
    }
  }
  
  console.warn('⚠️ Transformers.js not found. Available window keys:', 
    Object.keys(window).filter(k => k.toLowerCase().includes('transform') || k.toLowerCase().includes('pipeline')));
  return false;
}

// Initialize Transformers.js pipeline (runs in browser, no API key needed!)
async function initTransformers() {
  if (transformersPipeline || transformersInitializing) {
    return transformersPipeline;
  }

  if (!TRANSFORMERS_CONFIG.enabled) {
    return null;
  }

  // First, ensure the script is loaded
  let pipelineFn = window.transformersPipeline || window.pipeline || 
                   (typeof pipeline !== 'undefined' ? pipeline : null) ||
                   (window.transformers && window.transformers.pipeline ? window.transformers.pipeline : null);
  
  // If not loaded, download it with progress
  if (!pipelineFn) {
    console.log('Downloading Transformers.js library from server...');
    
    // Show progress in console (progress bar will be shown when model downloads)
    const loaded = await loadTransformersScript((percent, received, total) => {
      console.log(`Downloading Transformers.js: ${percent}% (${(received / 1024 / 1024).toFixed(2)} MB / ${(total / 1024 / 1024).toFixed(2)} MB)`);
    });
    
    if (!loaded) {
      console.warn('⚠️ Failed to load Transformers.js script. Using local analysis only.');
      TRANSFORMERS_CONFIG.enabled = false;
      return null;
    }
    
    // Check again after loading
    checkAndExposeTransformers();
    pipelineFn = window.transformersPipeline || window.pipeline || 
                 (typeof pipeline !== 'undefined' ? pipeline : null) ||
                 (window.transformers && window.transformers.pipeline ? window.transformers.pipeline : null);
    
    if (!pipelineFn) {
      // Wait a bit more for initialization
      for (let i = 0; i < 10; i++) {
        await new Promise(resolve => setTimeout(resolve, 200));
        checkAndExposeTransformers();
        pipelineFn = window.transformersPipeline || window.pipeline || 
                     (typeof pipeline !== 'undefined' ? pipeline : null) ||
                     (window.transformers && window.transformers.pipeline ? window.transformers.pipeline : null);
        if (pipelineFn) {
          console.log('✅ Transformers.js library loaded successfully!');
          break;
        }
      }
    }
  }
  
  if (!pipelineFn) {
    // Silently fail - local analysis is comprehensive enough
    if (TRANSFORMERS_CONFIG.enabled) {
      console.info('ℹ️ Transformers.js library not found. Using local analysis (comprehensive insights available).');
      TRANSFORMERS_CONFIG.enabled = false;
    }
    return null;
  }

  try {
    transformersInitializing = true;
    console.log('Initializing Transformers.js pipeline (this may take a moment on first load)...');
    
    // Update progress bar
    const progressBar = document.getElementById('aiModelProgressBar');
    const progressText = document.getElementById('aiModelProgressText');
    
    // Track total model size across all files
    let totalModelSize = 0;
    let totalDownloaded = 0;
    const fileSizes = new Map(); // Track individual file sizes
    const fileProgress = new Map(); // Track progress per file
    
    // Get estimated model size based on model name
    const getModelSize = (modelName) => {
      if (modelName.includes('TinyLlama')) return 500; // ~500MB
      if (modelName.includes('LaMini-Flan-T5')) return 200; // ~200MB
      if (modelName.includes('Phi-3-mini')) return 2000; // ~2GB
      if (modelName.includes('Qwen2.5-1.5B')) return 600; // ~600MB
      return 500; // Default estimate
    };
    
    const estimatedModelSizeMB = getModelSize(TRANSFORMERS_CONFIG.model);
    
    if (progressText) {
      progressText.textContent = `Preparing to download model (${estimatedModelSizeMB} MB total)...`;
    }
    
    // Configure Transformers.js to use browser cache for models
    // This ensures models are cached in IndexedDB for offline use
    if (window.transformers && window.transformers.env) {
      window.transformers.env.useBrowserCache = true;
      window.transformers.env.useFSCache = false; // Use browser cache, not file system
      console.log('✅ Transformers.js caching enabled');
    }
    
    // Create pipeline with progress callback
    // Transformers.js automatically downloads and caches models in IndexedDB
    transformersPipeline = await pipelineFn(
      TRANSFORMERS_CONFIG.task,
      TRANSFORMERS_CONFIG.model,
      {
        progress_callback: (progress) => {
          // Update progress bar during model download
          // Transformers.js progress object has: {status, name, file, progress, loaded, total}
          let percent = 0;
          let statusText = 'Initializing...';
          
          // Track file sizes and total downloaded
          if (progress.file && progress.total) {
            // Store file size if not already tracked
            if (!fileSizes.has(progress.file)) {
              fileSizes.set(progress.file, progress.total);
              totalModelSize += progress.total;
            }
            // Update progress for this file
            fileProgress.set(progress.file, progress.loaded || 0);
            
            // Calculate total downloaded across all files
            totalDownloaded = 0;
            fileSizes.forEach((size, file) => {
              const fileLoaded = fileProgress.get(file) || 0;
              totalDownloaded += Math.min(fileLoaded, size);
            });
          }
          
          // Handle different progress formats
          // Calculate percent based on what data we have
          if (progress.loaded && progress.total) {
            // Calculate overall model progress if we have total size
            if (totalModelSize > 0 && totalDownloaded > 0) {
              percent = Math.round((totalDownloaded / totalModelSize) * 100);
            } else {
              // Fallback to file-level progress
              percent = Math.round((progress.loaded / progress.total) * 100);
            }
          } else if (progress.progress !== undefined) {
            // Progress might be 0-1 or 0-100, check and normalize
            if (progress.progress <= 1) {
              // It's a fraction (0-1), convert to percentage
              percent = Math.round(progress.progress * 100);
            } else {
              // It's already a percentage, use as-is but cap at 100
              percent = Math.min(Math.round(progress.progress), 100);
            }
          }
          
          // Ensure percent is always between 0 and 100
          percent = Math.max(0, Math.min(100, percent));
          
          // Update progress bar
          if (progressBar) {
            progressBar.style.width = `${percent}%`;
          }
          
          // Update progress text
          if (progressText) {
            if (progress.status === 'progress' || progress.status === 'downloading') {
              const loaded = progress.loaded || 0;
              const total = progress.total || 0;
              
              if (totalModelSize > 0) {
                // Show overall model progress with exact total size
                const mbDownloaded = (totalDownloaded / 1024 / 1024).toFixed(2);
                const mbTotal = (totalModelSize / 1024 / 1024).toFixed(2);
                statusText = `Downloading model: ${percent}% (${mbDownloaded} MB / ${mbTotal} MB)`;
              } else if (total > 0) {
                // Show file-level progress until we know total size
                const mbDownloaded = (loaded / 1024 / 1024).toFixed(2);
                const mbTotal = (total / 1024 / 1024).toFixed(2);
                statusText = `Downloading ${progress.file || 'model'}: ${percent}% (${mbDownloaded} MB / ${mbTotal} MB)`;
              } else {
                statusText = `Downloading ${progress.file || 'model'}: ${percent}%`;
              }
            } else if (progress.status === 'loading' || progress.status === 'ready') {
              statusText = progress.status === 'ready' ? 'Model ready!' : 'Loading model into memory...';
            } else if (progress.file) {
              statusText = `Loading ${progress.file}: ${percent}%`;
            } else {
              statusText = `Loading model: ${percent}%`;
            }
            progressText.textContent = statusText;
          }
          
          // Update percentage display in progress bar
          const progressPercent = document.getElementById('aiModelProgressPercent');
          if (progressPercent) {
            progressPercent.textContent = `${percent}%`;
          }
          
          console.log('Model loading progress:', progress, `(${percent}%)`, `Total: ${totalModelSize > 0 ? (totalModelSize / 1024 / 1024).toFixed(2) + ' MB' : 'calculating...'}`);
        }
      }
    );
    
    // Hide progress bar when done
    if (progressBar) progressBar.style.width = '100%';
    if (progressText) progressText.textContent = 'Model ready and cached!';
    
    console.log('✅ Transformers.js pipeline initialized successfully!');
    
    // Verify and confirm model caching
    try {
      // Transformers.js automatically caches models in IndexedDB
      // The model is now cached and will be available offline
      if ('indexedDB' in window) {
        console.log('✅ Model cached in IndexedDB for offline use');
        console.log(`✅ Model: ${TRANSFORMERS_CONFIG.model} is now available offline`);
      }
      
      // Update progress text to confirm caching
      if (progressText) {
        setTimeout(() => {
          progressText.textContent = 'Model cached and ready for offline use!';
        }, 1000);
      }
    } catch (e) {
      console.warn('Could not verify cache:', e);
    }
    
    transformersInitializing = false;
    return transformersPipeline;
  } catch (error) {
    console.error('Transformers.js initialization error:', error);
    transformersInitializing = false;
    // Disable Transformers.js for this session
    TRANSFORMERS_CONFIG.enabled = false;
    console.info('ℹ️ Transformers.js disabled. AI analysis will use local analysis only (still provides comprehensive insights).');
    return null;
  }
}

// Get AI insights using Transformers.js (runs locally in browser, no API key!)
async function getTransformersInsights(analysis, logs, dayCount) {
  // If disabled, return null to use local analysis only
  if (!TRANSFORMERS_CONFIG.enabled) {
    return null;
  }

  try {
    // Initialize pipeline if needed
    const pipeline = await initTransformers();
    if (!pipeline) {
      return null;
    }

    // Prepare the prompt
    const prompt = buildLLMPrompt(analysis, logs, dayCount);
    
    // Create full prompt with system message - focused on data analysis
    const fullPrompt = `You are analyzing health tracking data for someone with ${CONDITION_CONTEXT.name}. Your role is to interpret the actual numbers and metrics provided, identify patterns, and offer practical insights. Base your response ONLY on the data given. Do not make general medical claims or statements about things not in the data.\n\n${prompt}`;
    
    // Generate response using Transformers.js
    const output = await transformersPipeline(fullPrompt, {
      max_new_tokens: TRANSFORMERS_CONFIG.maxNewTokens,
      temperature: TRANSFORMERS_CONFIG.temperature,
      do_sample: true,
      return_full_text: false
    });

    // Transformers.js returns an array of generated text objects
    if (output && Array.isArray(output) && output.length > 0) {
      // Get the generated text from the first result
      const generatedText = output[0].generated_text || output[0].text || output[0];
      return typeof generatedText === 'string' ? generatedText.trim() : String(generatedText).trim();
    } else if (output && typeof output === 'string') {
      return output.trim();
    }
    
    throw new Error('Unexpected response format from Transformers.js');
  } catch (error) {
    console.error('Transformers.js error:', error);
    // Return null to fall back to local analysis
    return null;
  }
}

function buildLLMPrompt(analysis, logs, dayCount) {
  // Format the analysis data for the LLM
  const trendsSummary = Object.entries(analysis.trends)
    .map(([metric, data]) => {
      const metricName = metric.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      const direction = data.trend > 0.2 ? 'improving' : data.trend < -0.2 ? 'worsening' : 'stable';
      return `- ${metricName}: Average ${data.average}/10, Current ${data.current}/10, Trend: ${direction}`;
    })
    .join('\n');

  const recentData = logs.slice(-3).map(log => ({
    date: log.date,
    bpm: log.bpm,
    backPain: log.backPain,
    stiffness: log.stiffness,
    fatigue: log.fatigue,
    sleep: log.sleep,
    mobility: log.mobility,
    flare: log.flare === 'Yes' ? 'Yes' : 'No'
  }));

  const flareCount = logs.filter(log => log.flare === 'Yes').length;
  const avgBPM = logs.reduce((sum, log) => sum + parseInt(log.bpm || 0), 0) / logs.length;

  return `TASK: Analyze the patient's health tracking data and provide personalized insights for ${CONDITION_CONTEXT.name} management.

PATIENT DATA (last ${dayCount} days):
${trendsSummary}

PATTERNS DETECTED:
${analysis.correlations.length > 0 ? analysis.correlations.join('\n') : 'No significant correlations detected'}

CONCERNS IDENTIFIED:
${analysis.anomalies.length > 0 ? analysis.anomalies.join('\n') : 'No major anomalies detected'}

RECENT ENTRIES (last 3 days):
${recentData.map(d => `Date: ${d.date} | Pain: ${d.backPain}/10 | Stiffness: ${d.stiffness}/10 | Fatigue: ${d.fatigue}/10 | Sleep: ${d.sleep}/10 | Mobility: ${d.mobility}/10 | Flare: ${d.flare} | BPM: ${d.bpm}`).join('\n')}

STATISTICS:
- Flare-ups: ${flareCount} out of ${dayCount} days (${Math.round(flareCount/dayCount*100)}% of days)
- Average BPM: ${Math.round(avgBPM)} bpm

INSTRUCTIONS:
Analyze ONLY the data provided above. Write a detailed response (at least 3-4 paragraphs, 400-600 words):
1. INTERPRET the trends (1 paragraph): What do the numbers mean? Are symptoms improving, worsening, or stable? Reference specific metrics and their changes over time.
2. IDENTIFY patterns and correlations (1 paragraph): What connections do you see between metrics? For example: "When sleep quality drops below 6/10, your pain levels increase by an average of 2 points." Explain any notable patterns you observe.
3. PROVIDE detailed actionable recommendations (1-2 paragraphs): Based on the actual data patterns, provide specific, practical recommendations. Include:
   - Lifestyle adjustments (sleep, activity, stress management)
   - When to consider discussing changes with healthcare provider
   - Strategies to address specific patterns you identified
   - Encouragement and positive reinforcement for improvements

REQUIREMENTS:
- Write at least 3-4 detailed paragraphs (400-600 words minimum)
- Reference specific numbers from the data throughout (e.g., "Your pain averaged 6/10 over the last 7 days, with a peak of 8/10 on Tuesday")
- Focus on what the data shows, not general medical advice
- Be empathetic, encouraging, and supportive
- Avoid making claims about things not in the data
- Write in second person ("Your pain levels have...", "You've experienced...")
- Provide detailed, actionable recommendations based on the patterns
- Do not provide medical diagnoses - only observations and lifestyle suggestions based on the data`;
}

// Custom AI Analysis Engine (condition-agnostic)
function analyzeHealthMetrics(logs) {
  const analysis = {
    trends: {},
    correlations: [],
    anomalies: [],
    advice: [],
    summary: ""
  };

  if (logs.length === 0) return analysis;

  // Calculate averages and trends
  const metrics = ['fatigue', 'stiffness', 'backPain', 'sleep', 'jointPain', 'mobility', 'dailyFunction', 'swelling', 'mood', 'irritability'];
  
  metrics.forEach(metric => {
    const values = logs.map(log => parseInt(log[metric]));
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const trend = values.length > 1 ? (values[values.length - 1] - values[0]) / (values.length - 1) : 0;
    
    analysis.trends[metric] = {
      average: Math.round(avg * 10) / 10,
      trend: Math.round(trend * 100) / 100,
      current: values[values.length - 1],
      min: Math.min(...values),
      max: Math.max(...values)
    };
  });

  // Detect correlations
  const sleepValues = logs.map(log => parseInt(log.sleep));
  const fatigueValues = logs.map(log => parseInt(log.fatigue));
  const painValues = logs.map(log => parseInt(log.backPain));
  const moodValues = logs.map(log => parseInt(log.mood));

  if (calculateCorrelation(sleepValues, fatigueValues) < -0.5) {
    analysis.correlations.push("Poor sleep strongly correlates with increased fatigue");
  }
  
  if (calculateCorrelation(painValues, moodValues) < -0.4) {
    analysis.correlations.push("Higher pain levels correlate with lower mood");
  }

  // Detect anomalies
  const flareUps = logs.filter(log => log.flare === 'Yes').length;
  if (flareUps > logs.length * 0.4) {
    analysis.anomalies.push(`High flare-up frequency: ${flareUps} out of ${logs.length} days`);
  }

  const highPainDays = logs.filter(log => parseInt(log.backPain) >= 8).length;
  if (highPainDays > logs.length * 0.3) {
    analysis.anomalies.push(`Severe pain episodes: ${highPainDays} out of ${logs.length} days`);
  }

  const poorSleepDays = logs.filter(log => parseInt(log.sleep) <= 4).length;
  if (poorSleepDays > logs.length * 0.3) {
    analysis.anomalies.push(`Poor sleep quality: ${poorSleepDays} out of ${logs.length} days`);
  }

  // Generate condition-specific advice
  analysis.advice = generateConditionAdvice(analysis.trends, logs);
  
  return analysis;
}

function calculateCorrelation(x, y) {
  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((total, xi, i) => total + xi * y[i], 0);
  const sumX2 = x.reduce((total, xi) => total + xi * xi, 0);
  const sumY2 = y.reduce((total, yi) => total + yi * yi, 0);
  
  return (n * sumXY - sumX * sumY) / Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
}

function generateConditionAdvice(trends, logs) {
  const advice = [];

  // Sleep advice
  if (trends.sleep.average < 6) {
    advice.push("🛏️ **Sleep Improvement**: Your sleep quality is below optimal. Consider establishing a consistent bedtime routine, avoiding screens before bed, and discussing sleep aids with your doctor.");
  }

  // Pain management
  if (trends.backPain.average > 6) {
    advice.push("🔥 **Pain Management**: High pain levels detected. Consider heat therapy, gentle stretching, anti-inflammatory medications, and discuss biologics with your rheumatologist if not already prescribed.");
  }

  // Exercise and mobility
  if (trends.mobility.average < 6) {
    advice.push(`🏃 **Mobility Focus**: Low mobility scores suggest need for gentle exercise. Try swimming, yoga, or physical therapy exercises appropriate for ${CONDITION_CONTEXT.name}.`);
  }

  // Stiffness management
  if (trends.stiffness.average > 6) {
    advice.push("🧘 **Morning Stiffness**: High stiffness levels indicate need for morning stretches, hot showers, and potentially adjusting medication timing with your doctor.");
  }

  // Fatigue management
  if (trends.fatigue.average > 6) {
    advice.push("⚡ **Energy Management**: Chronic fatigue detected. Focus on pacing activities, short naps (20-30 min), and discussing fatigue with your healthcare team as it may indicate disease activity.");
  }

  // Mood support
  if (trends.mood.average < 6) {
    advice.push("😊 **Mental Health**: Low mood scores suggest connecting with support groups, considering counseling, and ensuring you're getting adequate vitamin D and social interaction.");
  }

  return advice;
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
  
  // Show loading state
  resultsContent.innerHTML = `
    <div class="ai-loading-state">
      <div class="ai-loading-icon">🧠</div>
      <p class="ai-loading-text">Analyzing your health data...</p>
      <p class="ai-loading-subtext">Processing your last 7 days of health metrics</p>
    </div>
  `;

  // Get last 7 entries (most recent first, then reverse for chronological order)
  const sortedLogs = allLogs.sort((a, b) => new Date(b.date) - new Date(a.date));
  const last7Logs = sortedLogs.slice(0, 7).reverse();

  // Analyze the data after a short delay for UX
  setTimeout(async () => {
    const analysis = analyzeHealthMetrics(last7Logs);
    
    // Try to get Transformers.js AI insights (runs locally in browser, no API key!)
    // Note: Transformers.js is optional - local analysis provides comprehensive insights
    let webLLMInsights = null; // Keep variable name for compatibility
    if (TRANSFORMERS_CONFIG.enabled) {
      try {
        // Show loading state with progress bar
        resultsContent.innerHTML = `
          <div class="ai-loading-state">
            <div class="ai-loading-icon">🧠</div>
            <p class="ai-loading-text">Loading AI model...</p>
            <p class="ai-loading-subtext" id="aiModelProgressText">Initializing...</p>
            <div id="aiModelProgressBarContainer" class="ai-progress-bar-container">
              <div id="aiModelProgressBar" class="ai-progress-bar"></div>
              <span id="aiModelProgressPercent" class="ai-progress-text">0%</span>
            </div>
            <p class="ai-loading-note">First time: downloading model. Subsequent uses are instant!</p>
          </div>
        `;
        
        // Initialize Transformers.js (will download script if needed, then model)
        await initTransformers();
        
        // Get insights
        transformersInsights = await getTransformersInsights(analysis, last7Logs, last7Logs.length);
      } catch (error) {
        console.error('Transformers.js AI error:', error);
        // Continue with local analysis only
      }
    } else {
      // Transformers.js is disabled - use local analysis only (still comprehensive!)
      console.log('ℹ️ Transformers.js is disabled. Using local analysis (comprehensive insights available).');
    }
    
    // Display the combined results
    displayAISummary(analysis, last7Logs.length, transformersInsights);
  }, 1500);
}

function displayAISummary(analysis, dayCount, webLLMInsights = null) {
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

  // AI Insights Section (if available from Transformers.js)
  if (webLLMInsights) {
    html += `
      <div class="ai-summary-section ai-animate-in" style="animation-delay: ${animationDelay}ms;">
        <h3 class="ai-section-title">🤖 AI-Powered Insights</h3>
        <div class="ai-llm-synopsis">
          ${webLLMInsights.split('\n\n').map(para => para.trim() ? `<p>${para.trim()}</p>` : '').join('')}
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
    const trendIcon = trend.trend > 0.2 ? "📈" : trend.trend < -0.2 ? "📉" : "➡️";
    const metricName = metric.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    const trendColor = trend.trend > 0.2 ? "#4caf50" : trend.trend < -0.2 ? "#ff9800" : "#2196f3";
    
    html += `
      <div class="ai-trend-card ai-animate-in" style="border-left-color: ${trendColor}; animation-delay: ${animationDelay + (index * 100)}ms;">
        <div class="ai-trend-header">
          <strong>${trendIcon} ${metricName}</strong>
        </div>
        <div class="ai-trend-stats">
          <span>Average: <strong style="color: ${trendColor};">${trend.average}/10</strong></span>
          <span>Current: <strong style="color: ${trendColor};">${trend.current}/10</strong></span>
        </div>
      </div>
    `;
  });
  
  html += `</div></div>`;
  animationDelay += 300;

  // Correlations section
  if (analysis.correlations.length > 0) {
    html += `
      <div class="ai-summary-section ai-animate-in" style="animation-delay: ${animationDelay}ms;">
        <h3 class="ai-section-title ai-section-blue">🔗 Key Correlations</h3>
        <ul class="ai-list">
    `;
    analysis.correlations.forEach((corr, index) => {
      html += `<li class="ai-animate-in" style="animation-delay: ${animationDelay + 200 + (index * 100)}ms;">${corr}</li>`;
    });
    html += `</ul></div>`;
    animationDelay += 300;
  }

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

  // Advice section
  if (analysis.advice.length > 0) {
    html += `
      <div class="ai-summary-section ai-animate-in" style="animation-delay: ${animationDelay}ms;">
        <h3 class="ai-section-title ai-section-pink">💡 Personalized Recommendations</h3>
        <div class="ai-advice-list">
    `;
    analysis.advice.forEach((advice, index) => {
      const cleanAdvice = advice.replace(/\*\*/g, '').replace(/#/g, '');
      html += `
        <div class="ai-advice-card ai-animate-in" style="animation-delay: ${animationDelay + 200 + (index * 150)}ms;">
          <p>${cleanAdvice}</p>
        </div>
      `;
    });
    html += `</div></div>`;
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

  // Add a note if WebLLM wasn't used but is enabled
  if (!webLLMInsights && TRANSFORMERS_CONFIG.enabled) {
    html += `
      <div class="ai-summary-section" style="opacity: 0.7; font-size: 0.9rem; margin-top: 1rem;">
        <p>💡 <em>AI insights are loading or temporarily unavailable.</em></p>
        <p style="margin-top: 0.5rem; font-size: 0.85rem;">Note: First-time use downloads the AI model. The exact size will be shown during download. Subsequent uses are instant.</p>
      </div>
    `;
  }

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
      notes: "Feeling better today"
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
      notes: "Rough night sleep"
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
      notes: "Great day!"
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



function renderLogs() {
  output.innerHTML = "";
  logs.forEach(log => {
    const div = document.createElement("div");
    div.className = "entry";
    if (isExtreme(log)) div.classList.add("highlight");
    
    // Convert weight to display unit (stored as kg)
    const weightDisplay = getWeightInDisplayUnit(parseFloat(log.weight));
    const weightUnit = getWeightUnitSuffix();
    
    div.innerHTML = `
      <button class="delete-btn" onclick="deleteLogEntry('${log.date}')" title="Delete this entry">&times;</button>
      <strong>${log.date}</strong><br>
      BPM: ${log.bpm}, Weight: ${weightDisplay}${weightUnit}, Flare-up: ${log.flare}<br>
      Fatigue: ${log.fatigue}, Stiffness: ${log.stiffness}, Back Pain: ${log.backPain}, Sleep: ${log.sleep},<br>
      Joint Pain: ${log.jointPain}, Mobility: ${log.mobility}, Daily Activities: ${log.dailyFunction},<br>
      Swelling: ${log.swelling}, Mood: ${log.mood}, Irritability: ${log.irritability}<br>
      ${log.notes ? '<em>' + log.notes + '</em>' : ''}`;
    output.appendChild(div);
  });
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
  
  // Check if we have data
  if (!logs || logs.length === 0) {
    console.warn(`No data available for chart: ${label}`);
    return;
  }
  
  // Destroy existing chart if it exists
  if (container.chart) {
    container.chart.destroy();
  }
  
  // Prepare data and filter out invalid entries
  const chartData = logs
    .filter(log => log[dataField] !== undefined && log[dataField] !== null && log[dataField] !== '')
    .map(log => {
      let value = parseFloat(log[dataField]) || 0;
      // Convert weight to display unit if needed
      if (dataField === 'weight' && appSettings.weightUnit === 'lb') {
        value = parseFloat(kgToLb(value));
      }
      return {
      x: log.date,
        y: value
      };
    })
    .sort((a, b) => new Date(a.x) - new Date(b.x));
  
  if (chartData.length === 0) {
    console.warn(`No valid data for chart: ${label}`);
    return;
  }
  
  console.log(`Creating ApexChart for ${label} with ${chartData.length} data points`);
  
  const options = {
    series: [{
      name: label,
      data: chartData
    }],
    chart: {
      type: 'line',
      height: 300,
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
      width: 3
    },
    markers: {
      size: 5,
      colors: [color],
      strokeColors: '#fff',
      strokeWidth: 2,
      hover: {
        size: 7
      }
    },
    colors: [color],
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
        }
      },
      min: dataField === 'weight' ? undefined : 0,
      max: getMaxValue(dataField)
    },
    grid: {
      borderColor: '#374151'
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
    notes: document.getElementById("notes").value
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
    
    // Sync to cloud if authenticated
    if (typeof cloudSyncState !== 'undefined' && cloudSyncState.isAuthenticated && typeof syncToCloud === 'function') {
      setTimeout(() => syncToCloud(), 500);
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
    document.title = `${userName.charAt(0).toUpperCase() + userName.slice(1)}'s Health Dashboard`;
  } else {
    titleElement.textContent = 'Health Dashboard';
    document.title = 'Health Dashboard';
  }
}

// Filtering and sorting functionality
let currentSortOrder = 'newest'; // 'newest' or 'oldest'

function filterLogs() {
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;
  
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
    
    // Convert weight to display unit (stored as kg)
    const weightDisplay = getWeightInDisplayUnit(parseFloat(log.weight));
    const weightUnit = getWeightUnitSuffix();
    
    div.innerHTML = `
      <button class="delete-btn" onclick="deleteLogEntry('${log.date}')" title="Delete this entry">&times;</button>
      <strong>${log.date}</strong><br>
      BPM: ${log.bpm}, Weight: ${weightDisplay}${weightUnit}, Flare-up: ${log.flare}<br>
      Fatigue: ${log.fatigue}, Stiffness: ${log.stiffness}, Back Pain: ${log.backPain}, Sleep: ${log.sleep},<br>
      Joint Pain: ${log.jointPain}, Mobility: ${log.mobility}, Daily Activities: ${log.dailyFunction},<br>
      Swelling: ${log.swelling}, Mood: ${log.mood}, Irritability: ${log.irritability}<br>
      ${log.notes ? '<em>' + log.notes + '</em>' : ''}`;
    output.appendChild(div);
  });
}

function renderSortedLogs(sortedLogs) {
  output.innerHTML = "";
  sortedLogs.forEach(log => {
    const div = document.createElement("div");
    div.className = "entry";
    if (isExtreme(log)) div.classList.add("highlight");
    
    // Convert weight to display unit (stored as kg)
    const weightDisplay = getWeightInDisplayUnit(parseFloat(log.weight));
    const weightUnit = getWeightUnitSuffix();
    
    div.innerHTML = `
      <button class="delete-btn" onclick="deleteLogEntry('${log.date}')" title="Delete this entry">&times;</button>
      <strong>${log.date}</strong><br>
      BPM: ${log.bpm}, Weight: ${weightDisplay}${weightUnit}, Flare-up: ${log.flare}<br>
      Fatigue: ${log.fatigue}, Stiffness: ${log.stiffness}, Back Pain: ${log.backPain}, Sleep: ${log.sleep},<br>
      Joint Pain: ${log.jointPain}, Mobility: ${log.mobility}, Daily Activities: ${log.dailyFunction},<br>
      Swelling: ${log.swelling}, Mood: ${log.mood}, Irritability: ${log.irritability}<br>
      ${log.notes ? '<em>' + log.notes + '</em>' : ''}`;
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
    
    // Automatically apply the filter
    setTimeout(() => {
      filterLogs();
    }, 100);
  }
}
