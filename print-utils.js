// ============================================
// PRINT UTILITIES
// Generate print-friendly reports
// ============================================

function printReport() {
  const logs = JSON.parse(localStorage.getItem("healthLogs") || "[]");
  const appSettings = JSON.parse(localStorage.getItem('healthAppSettings') || '{}');
  const userName = appSettings.userName || 'User';
  const conditionName = appSettings.medicalCondition || 'Health Condition';
  
  if (logs.length === 0) {
    showAlertModal('No data to print.', 'Print');
    return;
  }
  
  // Create print content
  const printWindow = window.open('', '_blank');
  const printContent = generatePrintContent(logs, userName, conditionName);
  
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Health Data Report</title>
      <style>
        @page {
          size: A4;
          margin: 1.5cm;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          color: #333;
          line-height: 1.6;
          margin: 0;
          padding: 0;
        }
        
        .print-header {
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #333;
        }
        
        .print-header h1 {
          color: #1b5e20;
          margin: 0 0 0.5rem 0;
          font-size: 24pt;
        }
        
        .print-header .print-meta {
          color: #666;
          font-size: 10pt;
        }
        
        .print-summary {
          margin: 1.5rem 0;
          padding: 1rem;
          background: #f9f9f9;
          border-left: 4px solid #4caf50;
          page-break-inside: avoid;
        }
        
        .print-summary h3 {
          color: #1b5e20;
          margin: 0 0 0.75rem 0;
          font-size: 14pt;
        }
        
        .print-summary ul {
          margin: 0;
          padding-left: 1.5rem;
        }
        
        .print-summary li {
          margin: 0.5rem 0;
          color: #333;
        }
        
        .print-table {
          width: 100%;
          border-collapse: collapse;
          margin: 1rem 0;
          font-size: 9pt;
          page-break-inside: avoid;
        }
        
        .print-table th,
        .print-table td {
          padding: 6px;
          text-align: left;
          border: 1px solid #ddd;
        }
        
        .print-table th {
          background: #4caf50;
          color: white;
          font-weight: 600;
        }
        
        .print-table tr:nth-child(even) {
          background: #f9f9f9;
        }
        
        .print-footer {
          margin-top: 2rem;
          padding-top: 1rem;
          border-top: 1px solid #ddd;
          font-size: 8pt;
          color: #666;
          text-align: center;
        }
        
        @media print {
          .no-print {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      ${printContent}
    </body>
    </html>
  `);
  
  printWindow.document.close();
  
  // Wait for content to load, then print
  setTimeout(() => {
    printWindow.print();
  }, 250);
}

function generatePrintContent(logs, userName, conditionName) {
  const dates = logs.map(l => new Date(l.date)).sort((a, b) => a - b);
  const startDate = dates.length > 0 ? dates[0].toLocaleDateString() : 'N/A';
  const endDate = dates.length > 0 ? dates[dates.length - 1].toLocaleDateString() : 'N/A';
  const today = new Date().toLocaleDateString();
  
  // Calculate summary statistics
  const avgBPM = logs.length > 0 ? Math.round(logs.reduce((sum, l) => sum + (parseFloat(l.bpm) || 0), 0) / logs.length) : 0;
  const avgPain = logs.length > 0 ? (logs.reduce((sum, l) => sum + (parseFloat(l.backPain) || 0), 0) / logs.length).toFixed(1) : 0;
  const avgSleep = logs.length > 0 ? (logs.reduce((sum, l) => sum + (parseFloat(l.sleep) || 0), 0) / logs.length).toFixed(1) : 0;
  const flareCount = logs.filter(l => l.flare === 'true' || l.flare === true).length;
  
  let html = `
    <div class="print-header">
      <h1>Health Data Report</h1>
      <div class="print-meta">
        <strong>Patient:</strong> ${userName}<br>
        <strong>Condition:</strong> ${conditionName}<br>
        <strong>Report Date:</strong> ${today}<br>
        <strong>Data Range:</strong> ${startDate} to ${endDate}<br>
        <strong>Total Entries:</strong> ${logs.length}
      </div>
    </div>
    
    <div class="print-summary">
      <h3>Summary Statistics</h3>
      <ul>
        <li><strong>Average Resting Heart Rate:</strong> ${avgBPM} BPM</li>
        <li><strong>Average Back Pain Level:</strong> ${avgPain}/10</li>
        <li><strong>Average Sleep Quality:</strong> ${avgSleep}/10</li>
        <li><strong>Total Flare-ups:</strong> ${flareCount}</li>
      </ul>
    </div>
    
    <div class="print-summary">
      <h3>Health Log Entries</h3>
      <table class="print-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>BPM</th>
            <th>Weight</th>
            <th>Pain</th>
            <th>Sleep</th>
            <th>Mood</th>
            <th>Flare</th>
          </tr>
        </thead>
        <tbody>
  `;
  
  // Show most recent 50 entries (to fit on page)
  const entriesToShow = logs.slice(-50).reverse();
  entriesToShow.forEach(log => {
    html += `
      <tr>
        <td>${log.date || ''}</td>
        <td>${log.bpm || ''}</td>
        <td>${log.weight || ''}</td>
        <td>${log.backPain || ''}</td>
        <td>${log.sleep || ''}</td>
        <td>${log.mood || ''}</td>
        <td>${(log.flare === 'true' || log.flare === true) ? 'Yes' : 'No'}</td>
      </tr>
    `;
  });
  
  if (logs.length > 50) {
    html += `
      <tr>
        <td colspan="7" style="text-align: center; font-style: italic; color: #666;">
          ... and ${logs.length - 50} more entries (showing most recent 50)
        </td>
      </tr>
    `;
  }
  
  html += `
        </tbody>
      </table>
    </div>
    
    <div class="print-footer">
      <p>Generated by Health Dashboard on ${today}</p>
      <p>This report is for informational purposes only. Consult with your healthcare provider for medical advice.</p>
    </div>
  `;
  
  return html;
}
