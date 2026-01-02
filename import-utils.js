// ============================================
// IMPORT UTILITIES
// Multi-format import functionality with options
// ============================================

let importFileData = null;
let importPreviewData = null;

// Show import modal
function showImportModal() {
  // Close settings modal if open
  const settingsOverlay = document.getElementById('settingsOverlay');
  if (settingsOverlay) {
    // Check if settings modal is visible (same check as toggleSettings uses)
    const isVisible = settingsOverlay.style.display === 'block' || 
                      settingsOverlay.style.display === 'flex';
    if (isVisible) {
      if (typeof toggleSettings === 'function') {
        toggleSettings();
      } else {
        settingsOverlay.style.display = 'none';
        document.body.classList.remove('modal-active');
        document.body.style.overflow = '';
      }
    }
  }
  
  // Close export modal if open
  const exportModal = document.getElementById('exportModalOverlay');
  if (exportModal && exportModal.style.display === 'flex') {
    if (typeof closeExportModal === 'function') {
      closeExportModal();
    } else {
      exportModal.style.display = 'none';
    }
  }
  
  const modal = document.getElementById('importModalOverlay');
  const fileInput = document.getElementById('importFileInput');
  const fileName = document.getElementById('importFileName');
  const preview = document.getElementById('importPreview');
  
  if (modal) {
    modal.style.display = 'flex';
    importFileData = null;
    importPreviewData = null;
    
    if (fileInput) {
      fileInput.value = '';
    }
    if (fileName) {
      fileName.textContent = '';
    }
    if (preview) {
      preview.style.display = 'none';
    }
  }
}

// Close import modal
function closeImportModal() {
  const modal = document.getElementById('importModalOverlay');
  if (modal) {
    modal.style.display = 'none';
  }
  hideImportProgress();
  importFileData = null;
  importPreviewData = null;
}

// Handle file selection
function handleImportFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const fileName = document.getElementById('importFileName');
  const formatSelect = document.getElementById('importFormat');
  const preview = document.getElementById('importPreview');
  const previewContent = document.getElementById('importPreviewContent');
  
  if (fileName) {
    fileName.textContent = file.name;
  }
  
  const format = formatSelect ? formatSelect.value : 'csv';
  
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      if (format === 'csv') {
        importPreviewData = parseCSV(e.target.result);
      } else if (format === 'json') {
        importPreviewData = parseJSON(e.target.result);
      }
      
      if (importPreviewData && preview && previewContent) {
        showImportPreview(importPreviewData, preview, previewContent);
      }
      
      importFileData = {
        file: file,
        content: e.target.result,
        format: format
      };
    } catch (error) {
      console.error('File parse error:', error);
      if (fileName) {
        fileName.textContent = 'Error reading file';
        fileName.style.color = '#f44336';
      }
    }
  };
  
  reader.readAsText(file);
}

// Parse CSV content
function parseCSV(csvContent) {
  const lines = csvContent.split('\n').filter(line => line.trim());
  if (lines.length < 2) {
    throw new Error('CSV file must have at least a header and one data row');
  }
  
  const headers = lines[0].split(',').map(h => h.trim());
  const expectedHeaders = ['Date', 'BPM', 'Weight', 'Fatigue', 'Stiffness', 'Back Pain', 'Sleep', 'Joint Pain', 'Mobility', 'Daily Function', 'Swelling', 'Flare', 'Mood', 'Irritability', 'Notes'];
  
  // Flexible header matching
  const headerMap = {};
  expectedHeaders.forEach(expected => {
    const found = headers.find(h => h.toLowerCase() === expected.toLowerCase());
    if (found) {
      headerMap[expected] = headers.indexOf(found);
    }
  });
  
  const logs = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    
    const values = lines[i].split(',');
    const log = {};
    
    expectedHeaders.forEach(header => {
      const index = headerMap[header];
      if (index !== undefined && values[index] !== undefined) {
        const value = values[index].trim();
        const fieldName = header.toLowerCase().replace(/\s+/g, '');
        if (fieldName === 'backpain') {
          log.backPain = value;
        } else if (fieldName === 'dailyfunction') {
          log.dailyFunction = value;
        } else {
          log[fieldName] = value;
        }
      }
    });
    
    if (log.date) {
      logs.push(log);
    }
  }
  
  return logs;
}

// Parse JSON content
function parseJSON(jsonContent) {
  const data = JSON.parse(jsonContent);
  
  if (!Array.isArray(data)) {
    throw new Error('JSON file must contain an array of log entries');
  }
  
  return data;
}

// Show import preview
function showImportPreview(logs, previewElement, contentElement) {
  if (!logs || logs.length === 0) {
    contentElement.innerHTML = '<p style="color: #f44336;">No valid data found in file.</p>';
    previewElement.style.display = 'block';
    return;
  }
  
  const previewCount = Math.min(5, logs.length);
  let html = `<p style="margin-bottom: 0.5rem;"><strong>Found ${logs.length} entries</strong> (showing first ${previewCount}):</p>`;
  html += '<table style="width: 100%; font-size: 0.8rem; border-collapse: collapse;">';
  html += '<tr style="background: rgba(76, 175, 80, 0.2);"><th style="padding: 4px; text-align: left;">Date</th><th style="padding: 4px; text-align: left;">BPM</th><th style="padding: 4px; text-align: left;">Pain</th><th style="padding: 4px; text-align: left;">Sleep</th></tr>';
  
  for (let i = 0; i < previewCount; i++) {
    const log = logs[i];
    html += `<tr style="border-top: 1px solid rgba(255, 255, 255, 0.1);">
      <td style="padding: 4px;">${log.date || ''}</td>
      <td style="padding: 4px;">${log.bpm || ''}</td>
      <td style="padding: 4px;">${log.backPain || ''}</td>
      <td style="padding: 4px;">${log.sleep || ''}</td>
    </tr>`;
  }
  
  html += '</table>';
  if (logs.length > previewCount) {
    html += `<p style="margin-top: 0.5rem; font-size: 0.75rem; color: rgba(224, 242, 241, 0.7);">... and ${logs.length - previewCount} more entries</p>`;
  }
  
  contentElement.innerHTML = html;
  previewElement.style.display = 'block';
}

// Show import progress
function showImportProgress(percent, status) {
  const progressContainer = document.getElementById('importProgressContainer');
  const progressBar = document.getElementById('importProgressBar');
  const progressPercent = document.getElementById('importProgressPercent');
  const progressStatus = document.getElementById('importProgressStatus');
  const importButton = document.getElementById('importButton');
  const importCancelButton = document.getElementById('importCancelButton');
  
  if (progressContainer) {
    progressContainer.style.display = 'block';
  }
  if (progressBar) {
    progressBar.style.width = percent + '%';
  }
  if (progressPercent) {
    progressPercent.textContent = Math.round(percent) + '%';
  }
  if (progressStatus) {
    progressStatus.textContent = status;
  }
  if (importButton) {
    importButton.disabled = true;
    importButton.style.opacity = '0.5';
    importButton.style.cursor = 'not-allowed';
  }
  if (importCancelButton) {
    importCancelButton.disabled = true;
    importCancelButton.style.opacity = '0.5';
    importCancelButton.style.cursor = 'not-allowed';
  }
}

// Hide import progress
function hideImportProgress() {
  const progressContainer = document.getElementById('importProgressContainer');
  const importButton = document.getElementById('importButton');
  const importCancelButton = document.getElementById('importCancelButton');
  
  if (progressContainer) {
    progressContainer.style.display = 'none';
  }
  if (importButton) {
    importButton.disabled = false;
    importButton.style.opacity = '1';
    importButton.style.cursor = 'pointer';
  }
  if (importCancelButton) {
    importCancelButton.disabled = false;
    importCancelButton.style.opacity = '1';
    importCancelButton.style.cursor = 'pointer';
  }
}

// Perform import based on selected options
async function performImport() {
  if (!importFileData || !importPreviewData) {
    showAlertModal('Please select a file first.', 'Import');
    return;
  }
  
  const importOption = document.querySelector('input[name="importOption"]:checked');
  const option = importOption ? importOption.value : 'append';
  
  // Show progress bar
  showImportProgress(0, 'Starting import...');
  
  // Use setTimeout to allow UI to update before starting heavy operations
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const existingLogs = JSON.parse(localStorage.getItem("healthLogs") || "[]");
  let newLogs = [];
  let updatedCount = 0;
  let addedCount = 0;
  
  try {
    showImportProgress(10, 'Processing import options...');
    await new Promise(resolve => setTimeout(resolve, 50));
    if (option === 'replace') {
      // Replace all existing data
      showImportProgress(30, 'Replacing existing data...');
      await new Promise(resolve => setTimeout(resolve, 50));
      
      newLogs = importPreviewData;
      showImportProgress(60, 'Saving data...');
      await new Promise(resolve => setTimeout(resolve, 50));
      
      localStorage.setItem("healthLogs", JSON.stringify(newLogs));
      if (typeof logs !== 'undefined') {
        logs = newLogs;
      }
      addedCount = newLogs.length;
    } else if (option === 'append') {
      // Append new entries only (skip duplicates by date)
      showImportProgress(30, 'Checking for duplicates...');
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const existingDates = existingLogs.map(log => log.date);
      const uniqueNewLogs = importPreviewData.filter(log => !existingDates.includes(log.date));
      
      showImportProgress(50, 'Appending new entries...');
      await new Promise(resolve => setTimeout(resolve, 50));
      
      newLogs = [...existingLogs, ...uniqueNewLogs];
      showImportProgress(70, 'Saving data...');
      await new Promise(resolve => setTimeout(resolve, 50));
      
      localStorage.setItem("healthLogs", JSON.stringify(newLogs));
      if (typeof logs !== 'undefined') {
        logs = newLogs;
      }
      addedCount = uniqueNewLogs.length;
    } else if (option === 'merge') {
      // Merge by date (update existing, add new)
      showImportProgress(30, 'Merging data...');
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const existingDatesMap = new Map();
      existingLogs.forEach(log => {
        existingDatesMap.set(log.date, log);
      });
      
      const totalEntries = importPreviewData.length;
      importPreviewData.forEach((log, index) => {
        if (existingDatesMap.has(log.date)) {
          // Update existing
          Object.assign(existingDatesMap.get(log.date), log);
          updatedCount++;
        } else {
          // Add new
          existingDatesMap.set(log.date, log);
          addedCount++;
        }
        
        // Update progress during merge
        if (index % Math.max(1, Math.floor(totalEntries / 10)) === 0) {
          const mergeProgress = 30 + (index / totalEntries) * 40;
          showImportProgress(mergeProgress, `Processing entry ${index + 1} of ${totalEntries}...`);
        }
      });
      
      showImportProgress(70, 'Saving merged data...');
      await new Promise(resolve => setTimeout(resolve, 50));
      
      newLogs = Array.from(existingDatesMap.values());
      localStorage.setItem("healthLogs", JSON.stringify(newLogs));
      if (typeof logs !== 'undefined') {
        logs = newLogs;
      }
    }
    
    showImportProgress(80, 'Refreshing UI...');
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Refresh UI
    if (typeof renderLogs === 'function') {
      renderLogs();
    }
    if (typeof updateCharts === 'function') {
      updateCharts();
    }
    if (typeof updateHeartbeatAnimation === 'function') {
      updateHeartbeatAnimation();
    }
    if (typeof updateAISummaryButtonState === 'function') {
      updateAISummaryButtonState();
    }
    
    showImportProgress(90, 'Finalizing...');
    await new Promise(resolve => setTimeout(resolve, 50));
    
    showImportProgress(100, 'Import complete!');
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Hide progress and close modal
    hideImportProgress();
    
    // Show success message
    let message = '';
    if (option === 'replace') {
      message = `Successfully imported ${addedCount} entries (replaced all existing data).`;
    } else if (option === 'append') {
      message = `Successfully imported ${addedCount} new entries.`;
    } else {
      message = `Successfully imported: ${addedCount} new entries, ${updatedCount} entries updated.`;
    }
    
    closeImportModal();
    showAlertModal(message, 'Import Success');
    
    // Sync to cloud if authenticated (before reload)
    if (!appSettings.demoMode && typeof cloudSyncState !== 'undefined' && cloudSyncState.isAuthenticated && typeof syncToCloud === 'function') {
      // Start sync but don't wait for it - reload will happen anyway
      syncToCloud().catch(err => console.error('Cloud sync error:', err));
    }
    
    // Reload app after a short delay to show success message
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  } catch (error) {
    console.error('Import error:', error);
    Logger.error('Import error', { error: error.message, stack: error.stack });
    hideImportProgress();
    showAlertModal('Error importing data: ' + error.message, 'Import Error');
  }
}

// Initialize import file input handler
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    const importFileInput = document.getElementById('importFileInput');
    if (importFileInput) {
      importFileInput.addEventListener('change', handleImportFileSelect);
    }
  });
} else {
  const importFileInput = document.getElementById('importFileInput');
  if (importFileInput) {
    importFileInput.addEventListener('change', handleImportFileSelect);
  }
}
