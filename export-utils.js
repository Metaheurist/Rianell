// ============================================
// EXPORT UTILITIES
// Multi-format export functionality
// ============================================

// Export data in CSV format
function exportToCSV(logs) {
  const headers = "Date,BPM,Weight,Fatigue,Stiffness,Back Pain,Sleep,Joint Pain,Mobility,Daily Function,Swelling,Flare,Mood,Irritability,Notes";
  const csvContent = headers + "\n" + logs.map(log => {
    return [
      log.date || '',
      log.bpm || '',
      log.weight || '',
      log.fatigue || '',
      log.stiffness || '',
      log.backPain || '',
      log.sleep || '',
      log.jointPain || '',
      log.mobility || '',
      log.dailyFunction || '',
      log.swelling || '',
      log.flare || '',
      log.mood || '',
      log.irritability || '',
      (log.notes || '').replace(/,/g, ';') // Replace commas in notes to avoid CSV issues
    ].join(',');
  }).join("\n");
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `health_logs_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Export data in JSON format
function exportToJSON(logs) {
  const jsonContent = JSON.stringify(logs, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `health_logs_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Export data in PDF format (requires jsPDF library)
async function exportToPDF(logs) {
  // Check if jsPDF is available
  if (typeof window.jspdf === 'undefined' && typeof window.jsPDF === 'undefined') {
    // Load jsPDF dynamically
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    script.onload = () => {
      generatePDF(logs);
    };
    script.onerror = () => {
      showAlertModal('Failed to load PDF library. Please check your internet connection.', 'Export Error');
    };
    document.head.appendChild(script);
    return;
  }
  
  generatePDF(logs);
}

function generatePDF(logs) {
  try {
    const { jsPDF } = window.jspdf || window.jsPDF;
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(18);
    doc.text('Health Data Report', 14, 20);
    
    // Date range
    if (logs.length > 0) {
      const dates = logs.map(l => new Date(l.date)).sort((a, b) => a - b);
      const startDate = dates[0].toLocaleDateString();
      const endDate = dates[dates.length - 1].toLocaleDateString();
      doc.setFontSize(10);
      doc.text(`Date Range: ${startDate} - ${endDate}`, 14, 30);
      doc.text(`Total Entries: ${logs.length}`, 14, 36);
    }
    
    // Table headers
    let yPos = 45;
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('Date', 14, yPos);
    doc.text('BPM', 50, yPos);
    doc.text('Weight', 65, yPos);
    doc.text('Pain', 85, yPos);
    doc.text('Sleep', 100, yPos);
    doc.text('Mood', 115, yPos);
    doc.text('Notes', 140, yPos);
    
    yPos += 5;
    doc.setFont(undefined, 'normal');
    doc.setFontSize(8);
    
    // Table rows (limit to fit on page)
    const maxRows = Math.floor((280 - yPos) / 6);
    const rowsToShow = logs.slice(-maxRows); // Show most recent entries
    
    rowsToShow.forEach((log, index) => {
      if (yPos > 280) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.text(log.date || '', 14, yPos);
      doc.text(log.bpm || '', 50, yPos);
      doc.text(log.weight || '', 65, yPos);
      doc.text(log.backPain || '', 85, yPos);
      doc.text(log.sleep || '', 100, yPos);
      doc.text(log.mood || '', 115, yPos);
      const notes = (log.notes || '').substring(0, 20);
      doc.text(notes, 140, yPos);
      
      yPos += 6;
    });
    
    if (logs.length > maxRows) {
      doc.addPage();
      doc.setFontSize(10);
      doc.text(`Note: Showing last ${maxRows} of ${logs.length} entries`, 14, 20);
    }
    
    // Save PDF
    doc.save(`health_logs_${new Date().toISOString().split('T')[0]}.pdf`);
  } catch (error) {
    console.error('PDF export error:', error);
    showAlertModal('Error generating PDF: ' + error.message, 'Export Error');
  }
}

// Export data in Excel format (requires SheetJS library)
async function exportToExcel(logs) {
  // Check if SheetJS is available
  if (typeof window.XLSX === 'undefined') {
    // Load SheetJS dynamically
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
    script.onload = () => {
      generateExcel(logs);
    };
    script.onerror = () => {
      showAlertModal('Failed to load Excel library. Please check your internet connection.', 'Export Error');
    };
    document.head.appendChild(script);
    return;
  }
  
  generateExcel(logs);
}

function generateExcel(logs) {
  try {
    const XLSX = window.XLSX;
    
    // Prepare data
    const worksheetData = [
      ['Date', 'BPM', 'Weight', 'Fatigue', 'Stiffness', 'Back Pain', 'Sleep', 'Joint Pain', 'Mobility', 'Daily Function', 'Swelling', 'Flare', 'Mood', 'Irritability', 'Notes']
    ];
    
    logs.forEach(log => {
      worksheetData.push([
        log.date || '',
        log.bpm || '',
        log.weight || '',
        log.fatigue || '',
        log.stiffness || '',
        log.backPain || '',
        log.sleep || '',
        log.jointPain || '',
        log.mobility || '',
        log.dailyFunction || '',
        log.swelling || '',
        log.flare || '',
        log.mood || '',
        log.irritability || '',
        log.notes || ''
      ]);
    });
    
    // Create workbook and worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Health Logs');
    
    // Generate Excel file
    XLSX.writeFile(workbook, `health_logs_${new Date().toISOString().split('T')[0]}.xlsx`);
  } catch (error) {
    console.error('Excel export error:', error);
    showAlertModal('Error generating Excel file: ' + error.message, 'Export Error');
  }
}

// Main export function - shows modal and handles format selection
function showExportModal() {
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
  
  // Close import modal if open
  const importModal = document.getElementById('importModalOverlay');
  if (importModal && importModal.style.display === 'flex') {
    if (typeof closeImportModal === 'function') {
      closeImportModal();
    } else {
      importModal.style.display = 'none';
    }
  }
  
  const modal = document.getElementById('exportModalOverlay');
  if (modal) {
    modal.style.display = 'flex';
  }
}

function closeExportModal() {
  const modal = document.getElementById('exportModalOverlay');
  if (modal) {
    modal.style.display = 'none';
  }
}

// Perform export based on format
function performExport(format) {
  const logs = JSON.parse(localStorage.getItem("healthLogs") || "[]");
  
  if (logs.length === 0) {
    showAlertModal('No data to export.', 'Export');
    closeExportModal();
    return;
  }
  
  try {
    switch(format) {
      case 'csv':
        exportToCSV(logs);
        break;
      case 'json':
        exportToJSON(logs);
        break;
      case 'pdf':
        exportToPDF(logs);
        break;
      case 'excel':
        exportToExcel(logs);
        break;
      default:
        showAlertModal('Unknown export format.', 'Export Error');
        return;
    }
    
    closeExportModal();
    showAlertModal(`Data exported successfully as ${format.toUpperCase()}!`, 'Export Success');
  } catch (error) {
    console.error('Export error:', error);
    showAlertModal('Error exporting data: ' + error.message, 'Export Error');
  }
}
