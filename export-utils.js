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
    script.src = 'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js';
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

// Export AI analysis to PDF: use jsPDF + jspdf-autotable for visual (table + colors), else jsPDF text
// Optional textOrNull: plain-text fallback when visual path fails
function exportAIAnalysisToPDF(textOrNull) {
  var contentEl = document.getElementById('aiResultsContent');
  var fallbackText = typeof textOrNull === 'string' ? textOrNull.trim() : (contentEl && contentEl.innerText ? contentEl.innerText.trim() : '');

  var hasContent = contentEl && ((contentEl.innerHTML && contentEl.innerHTML.trim().length > 0) || (fallbackText && fallbackText.length > 0));
  if (!hasContent) {
    if (typeof showAlertModal === 'function') showAlertModal('No AI analysis content to export.', 'Export PDF');
    else alert('No AI analysis content to export.');
    return;
  }

  function doTextPDF() {
    var JsPDF = getJsPDFConstructor();
    if (JsPDF) {
      fallbackToTextPDF(fallbackText, JsPDF);
      return;
    }
    loadScriptThen('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js', function () {
      var Ctor = getJsPDFConstructor();
      if (Ctor) fallbackToTextPDF(fallbackText, Ctor);
      else if (typeof showAlertModal === 'function') showAlertModal('PDF library could not be loaded.', 'Export Error');
    }, function () { if (typeof showAlertModal === 'function') showAlertModal('Failed to load PDF library.', 'Export Error'); });
  }

  var JsPDF = getJsPDFConstructor();
  if (!JsPDF) {
    loadScriptThen('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js', function () {
      var Ctor = getJsPDFConstructor();
      if (Ctor) runAIAnalysisPDFVisual(contentEl, fallbackText, Ctor, doTextPDF);
      else doTextPDF();
    }, doTextPDF);
    return;
  }
  runAIAnalysisPDFVisual(contentEl, fallbackText, JsPDF, doTextPDF);
}

// Allowed tags for AI report HTML (preserves markup, strips script/events)
var REPORT_HTML_ALLOWED_TAGS = ['p', 'strong', 'em', 'b', 'i', 'ul', 'ol', 'li', 'h2', 'h3', 'h4', 'br', 'div', 'span', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'section'];

function sanitizeHTMLForReport(html) {
  if (!html || typeof html !== 'string') return '';
  var doc = document.implementation.createHTMLDocument('');
  var body = doc.body;
  body.innerHTML = html;
  function stripNode(node) {
    if (node.nodeType === Node.TEXT_NODE) return true;
    if (node.nodeType !== Node.ELEMENT_NODE) return false;
    var tag = node.tagName.toLowerCase();
    if (REPORT_HTML_ALLOWED_TAGS.indexOf(tag) === -1) {
      var text = doc.createTextNode(node.textContent || '');
      node.parentNode.replaceChild(text, node);
      return true;
    }
    for (var i = node.attributes.length - 1; i >= 0; i--) {
      var a = node.attributes[i];
      var an = (a.name || '').toLowerCase();
      if (an !== 'class') node.removeAttribute(a.name);
    }
    var next;
    for (var c = node.firstChild; c; c = next) {
      next = c.nextSibling;
      stripNode(c);
    }
    return true;
  }
  stripNode(body);
  return body.innerHTML;
}

function openAIAnalysisReportForPrint() {
  var contentEl = document.getElementById('aiResultsContent');
  var analysis = (typeof window.currentAIAnalysis !== 'undefined' && window.currentAIAnalysis) ? window.currentAIAnalysis : null;
  if (!contentEl || (!contentEl.innerHTML && !contentEl.innerText)) {
    if (typeof showAlertModal === 'function') showAlertModal('No AI analysis content to export.', 'Report');
    else alert('No AI analysis content to export.');
    return;
  }
  var rawHTML = contentEl.innerHTML && contentEl.innerHTML.trim() ? contentEl.innerHTML.trim() : '';
  var rawText = contentEl.innerText ? contentEl.innerText.trim() : '';
  var dateRangeText = '';
  if (rawText) {
    var m = rawText.match(/Analysis for (.+?)(?:\n|$)/);
    if (m) dateRangeText = m[1].trim();
  }
  var bodyContent = rawHTML ? sanitizeHTMLForReport(rawHTML) : ('<div class="report-body-text"><pre>' + escapeHTMLForReport(rawText) + '</pre></div>');
  function escapeHTMLForReport(s) {
    if (!s) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  var reportHTML = '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>Health AI Analysis Report</title><style>' +
    '@page{size:A4;margin:1.5cm;}' +
    'body{font-family:Georgia,\"Times New Roman\",serif;color:#1a1a1a;line-height:1.6;margin:0;padding:0;background:#fff;}' +
    '.report-header{border-bottom:2px solid #2c3e50;padding-bottom:1rem;margin-bottom:1.5rem;}' +
    '.report-header h1{font-size:1.5rem;font-weight:700;color:#2c3e50;margin:0 0 0.35rem 0;}' +
    '.report-header .report-subtitle{font-size:0.95rem;color:#5c6bc0;margin:0 0 0.2rem 0;}' +
    '.report-header .report-meta{font-size:0.8rem;color:#666;margin:0;}' +
    '.report-body{font-size:0.9rem;}' +
    '.report-body h2,.report-body h3,.report-body h4{color:#2c3e50;margin:1.25rem 0 0.5rem 0;font-size:1.05rem;border-bottom:1px solid #b0bec5;padding-bottom:0.35rem;}' +
    '.report-body .ai-summary-section{margin-bottom:1.25rem;page-break-inside:avoid;}' +
    '.report-body .ai-section-title{color:#1a237e;font-weight:700;margin:0 0 0.5rem 0;}' +
    '.report-body table{border-collapse:collapse;width:100%;margin:0.5rem 0;font-size:0.85rem;}' +
    '.report-body th,.report-body td{border:1px solid #333;padding:6px 10px;text-align:left;}' +
    '.report-body th{background:#263238;color:#fff;font-weight:700;}' +
    '.report-body tr:nth-child(even){background:#f5f5f5;}' +
    '.report-footer{margin-top:2rem;padding-top:1rem;border-top:1px solid #b0bec5;font-size:0.8rem;color:#666;}' +
    '.report-print-hint{margin-top:1.5rem;font-size:0.85rem;color:#78909c;}' +
    '</style></head><body>' +
    '<div class="report-header">' +
    '<h1>Health AI Analysis Report</h1>' +
    (dateRangeText ? '<p class="report-subtitle">' + escapeHTMLForReport(dateRangeText) + '</p>' : '') +
    '<p class="report-meta">For discussion with your healthcare provider.</p>' +
    '</div>' +
    '<div class="report-body">' + bodyContent + '</div>' +
    '<div class="report-footer">For patterns only—talk to your doctor before changing care. You can share this at your next visit.</div>' +
    '<p class="report-print-hint">To save as PDF: use Print (Ctrl+P or Cmd+P) and choose "Save as PDF".</p>' +
    '</body></html>';
  var win = window.open('', '_blank');
  if (!win) {
    if (typeof showAlertModal === 'function') showAlertModal('Popup blocked. Please allow popups for this site and try again.', 'Report');
    else alert('Popup blocked. Please allow popups for this site and try again.');
    return;
  }
  win.document.open();
  win.document.write(reportHTML);
  win.document.close();
  if (typeof closeShareModal === 'function') closeShareModal();
}

function getHtml2pdf() {
  if (typeof window === 'undefined') return null;
  var h = window.html2pdf;
  if (typeof h === 'function') return h;
  if (h && typeof h.default === 'function') return h.default;
  return null;
}

// Capture the AI report section as a PDF (screenshot-style) using html2pdf.js
function exportAIAnalysisSectionToPDF() {
  var el = document.getElementById('aiResultsSection') || document.getElementById('aiResultsContent');
  if (!el) {
    if (typeof showAlertModal === 'function') showAlertModal('Report section not found.', 'Export PDF');
    return;
  }
  var hasContent = el.innerText && el.innerText.trim().length > 0;
  if (!hasContent) {
    if (typeof showAlertModal === 'function') showAlertModal('No AI analysis content to capture.', 'Export PDF');
    return;
  }
  if (typeof closeShareModal === 'function') closeShareModal();

  function runCapture() {
    var html2pdfFn = getHtml2pdf();
    if (!html2pdfFn) {
      if (typeof showAlertModal === 'function') showAlertModal('PDF capture library did not load correctly. Try "Open report (Print to PDF)" instead.', 'Export Error');
      return;
    }
    el.scrollIntoView({ behavior: 'instant', block: 'start' });
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        try {
          var filename = 'health_ai_analysis_' + new Date().toISOString().split('T')[0] + '.pdf';
          var opt = {
            margin: 10,
            filename: filename,
            image: { type: 'jpeg', quality: 0.95 },
            html2canvas: { scale: 2, useCORS: true, logging: false },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
          };
          html2pdfFn().set(opt).from(el).save();
        } catch (err) {
          console.error('Section PDF capture error:', err);
          if (typeof showAlertModal === 'function') showAlertModal('Could not capture section as PDF. Try "Export PDF" or "Open report (Print to PDF)" instead.', 'Export Error');
        }
      });
    });
  }

  if (getHtml2pdf()) {
    runCapture();
    return;
  }
  var cdnUrls = [
    'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js',
    'https://cdn.jsdelivr.net/npm/html2pdf.js@0.10.1/dist/html2pdf.bundle.min.js'
  ];
  var idx = 0;
  function tryNext() {
    if (idx >= cdnUrls.length) {
      if (typeof showAlertModal === 'function') showAlertModal('Could not load PDF capture library. Check your connection or try "Open report (Print to PDF)" to save as PDF.', 'Export Error');
      return;
    }
    var url = cdnUrls[idx++];
    loadScriptThen(url, function () {
      if (getHtml2pdf()) runCapture();
      else tryNext();
    }, tryNext);
  }
  tryNext();
}

function hexToRgb(hex) {
  if (!hex || hex.charAt(0) !== '#') return [0, 0, 0];
  var h = hex.replace('#', '');
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)];
}

function runAIAnalysisPDFVisual(contentEl, fallbackText, JsPDF, onFallback) {
  var analysis = (typeof window.currentAIAnalysis !== 'undefined' && window.currentAIAnalysis) ? window.currentAIAnalysis : null;
  var rawText = fallbackText || (contentEl && contentEl.innerText ? contentEl.innerText.trim() : '');
  var text = sanitizeTextForPDF(rawText || '');
  var dateRangeText = '';
  if (text) {
    var m = text.match(/Analysis for (.+?)(?:\n|$)/);
    if (m) dateRangeText = sanitizeTextForPDF(m[1]);
  }

  function tryBuild() {
    var Ctor = getJsPDFConstructor();
    if (!Ctor) { onFallback(); return; }
    var testDoc = new Ctor();
    var hasAutoTable = typeof testDoc.autoTable === 'function';
    if (!hasAutoTable) {
      onFallback();
      return;
    }
    try {
      var doc = new Ctor();
      var margin = 14;
      var pageWidth = doc.internal.pageSize.getWidth();
      var pageHeight = doc.internal.pageSize.getHeight();
      var y = 20;
      var maxWidth = pageWidth - margin * 2;

      doc.setFontSize(20);
      doc.setFont(undefined, 'bold');
      doc.setTextColor.apply(doc, hexToRgb('#1a237e'));
      doc.text('Health AI Analysis Report', margin, y);
      y += 10;
      if (dateRangeText) {
        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        doc.setTextColor.apply(doc, hexToRgb('#5c6bc0'));
        doc.text(dateRangeText, margin, y);
        y += 8;
      }
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      doc.text('For discussion with your healthcare provider.', margin, y);
      y += 10;
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);

      if (analysis && analysis.trends && Object.keys(analysis.trends).length > 0 && doc.autoTable) {
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.setTextColor.apply(doc, hexToRgb('#e91e63'));
        doc.text("How you're doing", margin, y);
        y += 10;
        doc.setFont(undefined, 'normal');
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);

        var weightUnit = (typeof window.appSettings !== 'undefined' && window.appSettings && window.appSettings.weightUnit === 'lb') ? 'lb' : 'kg';
        var kgToLb = typeof window.kgToLb === 'function' ? window.kgToLb : function (k) { return k * 2.205; };
        var head = [['Metric', 'Status', 'Avg', 'Now', 'Next']];
        var body = [];
        Object.keys(analysis.trends).forEach(function (metric) {
          var t = analysis.trends[metric];
          var name = metric.replace(/([A-Z])/g, ' $1').replace(/^./, function (s) { return s.toUpperCase(); });
          var status = (t.statusFromAverage === 'improving') ? 'Getting Better' : (t.statusFromAverage === 'worsening') ? 'Getting Worse' : 'Staying Stable';
          var avg = t.average, now = t.current, nextVal = t.projected7Days;
          if (metric === 'bpm') {
            avg = Math.round(avg) + ''; now = Math.round(now) + ''; nextVal = nextVal != null ? Math.round(nextVal) + '' : '';
          } else if (metric === 'weight') {
            if (weightUnit === 'lb') { avg = kgToLb(avg); now = kgToLb(now); if (nextVal != null) nextVal = kgToLb(nextVal); }
            avg = avg.toFixed(1) + weightUnit; now = now.toFixed(1) + weightUnit; nextVal = nextVal != null ? nextVal.toFixed(1) + weightUnit : '';
          } else if (metric === 'steps') {
            avg = Math.round(avg).toLocaleString(); now = Math.round(now).toLocaleString(); nextVal = nextVal != null ? Math.round(nextVal).toLocaleString() : '';
          } else if (metric === 'hydration') {
            avg = avg.toFixed(1) + ' glasses'; now = now.toFixed(1) + ' glasses'; nextVal = nextVal != null ? nextVal.toFixed(1) + ' glasses' : '';
          } else {
            avg = Math.round(avg) + '/10'; now = Math.round(now) + '/10'; nextVal = nextVal != null ? Math.round(nextVal) + '/10' : '';
          }
          body.push([name, status, avg, now, nextVal ? nextVal : '—']);
        });

        doc.autoTable({
          head: head,
          body: body,
          startY: y,
          margin: { left: margin },
          theme: 'striped',
          headStyles: { fillColor: hexToRgb('#e8eaf6'), textColor: hexToRgb('#283593'), fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [252, 228, 236] }
        });
        y = doc.lastAutoTable.finalY + 12;
      }

      if (analysis && analysis.flareUpRisk) {
        if (y > pageHeight - 40) { doc.addPage(); y = 20; }
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.setTextColor.apply(doc, hexToRgb('#2e7d32'));
        doc.text('Possible flare-up', margin, y);
        y += 8;
        var level = analysis.flareUpRisk.level || 'low';
        var rc = level === 'high' ? [198, 40, 40] : level === 'moderate' ? [230, 81, 0] : [249, 168, 37];
        doc.setFontSize(11);
        doc.setTextColor.apply(doc, rc);
        var levelText = 'Risk: ' + (level.charAt(0).toUpperCase() + level.slice(1));
        if (analysis.flareUpRisk.matchingMetrics != null) levelText += ' · ' + analysis.flareUpRisk.matchingMetrics + '/5 signs';
        if (analysis.flareUpRisk.confidence != null) levelText += ' (' + analysis.flareUpRisk.confidence + '% match)';
        doc.text(levelText, margin, y);
        y += 8;
        doc.setTextColor(0, 0, 0);
        doc.setFont(undefined, 'normal');
        doc.text('Keep an eye on how you feel and do what usually helps you prevent or ease flare-ups.', margin, y, { maxWidth: maxWidth });
        y += 14;
      }

      if (text) {
        var sections = [/What we found/i, /What you logged/i, /Things to watch/i, /Correlations/i, /Important/i, /Symptoms/i, /Pain by body part/i, /Stress and triggers/i, /Nutrition/i, /Exercise/i];
        var listSectionPatterns = [/Symptoms/i, /Pain by body part/i, /Pain patterns/i, /Stress and triggers/i, /Nutrition/i, /Exercise/i, /Top foods/i, /Top exercises/i, /What you logged/i];
        var sectionTitle = '', sectionContent = [];
        function flush() {
          if (sectionTitle && sectionContent.length) {
            var titleClean = sanitizeTextForPDF(sectionTitle.replace(/^[\s\u2014\-]+|[\s\u2014\-]+$/g, ''));
            var isListSection = listSectionPatterns.some(function (r) { return r.test(titleClean); });
            var sectionStartY = y;
            if (y > pageHeight - 40) { doc.addPage(); y = 20; sectionStartY = y; }
            // Section card background behind title (match app .ai-summary-section)
            doc.setFillColor(252, 228, 236);
            doc.rect(margin - 2, sectionStartY - 2, pageWidth - 2 * margin + 4, 26, 'F');
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.setTextColor.apply(doc, hexToRgb('#e91e63'));
            doc.text(titleClean, margin, sectionStartY + 6);
            y = sectionStartY + 10;
            doc.setDrawColor(233, 30, 99);
            doc.setLineWidth(0.4);
            doc.line(margin, y + 1, pageWidth - margin, y + 1);
            y += 10;
            doc.setFont(undefined, 'normal');
            doc.setFontSize(11);
            doc.setTextColor(0, 0, 0);

            if (isListSection && doc.autoTable) {
              var tableBody = [];
              var hasValueColumn = false;
              sectionContent.forEach(function (line) {
                var clean = sanitizeTextForPDF(line);
                if (!clean) return;
                var idx = clean.indexOf(' (');
                if (idx !== -1) {
                  hasValueColumn = true;
                  var name = clean.substring(0, idx).trim();
                  var val = clean.substring(idx).replace(/^[\s(]+|[\s)]+$/g, '');
                  tableBody.push([name, val]);
                } else {
                  tableBody.push([clean]);
                }
              });
              if (tableBody.length > 0 && hasValueColumn) {
                tableBody = tableBody.map(function (row) { return row.length === 2 ? row : [row[0], '']; });
              }
              if (tableBody.length > 0) {
                var head = hasValueColumn ? [['Item', 'Value']] : [['Item']];
                doc.autoTable({
                  head: head,
                  body: tableBody,
                  startY: y,
                  margin: { left: margin },
                  theme: 'grid',
                  headStyles: { fillColor: [40, 40, 40], textColor: [255, 255, 255], fontStyle: 'bold' },
                  styles: { lineColor: [0, 0, 0], lineWidth: 0.25 },
                  columnStyles: hasValueColumn ? { 1: { cellWidth: 40 } } : {}
                });
                y = doc.lastAutoTable.finalY + 10;
              }
            } else {
              var para = sanitizeTextForPDF(sectionContent.join('\n').trim());
              var lines = doc.splitTextToSize(para, maxWidth);
              for (var i = 0; i < lines.length; i++) {
                if (y > pageHeight - 20) { doc.addPage(); y = 20; }
                doc.text(lines[i], margin, y);
                y += 6;
              }
              y += 10;
            }
          }
          sectionContent = [];
        }
        var lines = text.split(/\r?\n/);
        for (var i = 0; i < lines.length; i++) {
          var trimmed = (lines[i] || '').trim();
          var isHead = sections.some(function (r) { return r.test(trimmed); });
          if (isHead && trimmed.length < 60) {
            flush();
            sectionTitle = trimmed;
          } else if (trimmed && !/^─+$/.test(trimmed)) {
            if (!sectionTitle) sectionTitle = 'Summary';
            sectionContent.push(trimmed);
          }
        }
        flush();
      }

      var footerY = pageHeight - 18;
      if (y > footerY - 10) { doc.addPage(); y = 20; footerY = pageHeight - 18; }
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text('For patterns only—talk to your doctor before changing care. You can share this at your next visit.', margin, footerY, { maxWidth: maxWidth });
      var filename = 'health_ai_analysis_' + new Date().toISOString().split('T')[0] + '.pdf';
      doc.save(filename);
      if (typeof closeShareModal === 'function') closeShareModal();
    } catch (err) {
      console.error('Visual PDF error:', err);
      onFallback();
    }
  }

  if ((typeof window.jspdf !== 'undefined' && window.jspdf.jsPDF && window.jspdf.jsPDF.prototype.autoTable) ||
      (typeof window.jsPDF !== 'undefined' && window.jsPDF.prototype.autoTable)) {
    tryBuild();
    return;
  }
  loadScriptThen('https://cdn.jsdelivr.net/npm/jspdf-autotable@3.8.2/dist/jspdf.plugin.autotable.js', function () {
    tryBuild();
  }, function () {
    onFallback();
  });
}

function buildPdfmakeDoc(analysis, text, dateRangeText) {
  var body = [];

  body.push({ text: 'Health AI Analysis', fontSize: 20, bold: true, color: '#1a237e', margin: [0, 0, 0, 4] });
  if (dateRangeText) body.push({ text: dateRangeText, fontSize: 11, color: '#5c6bc0', margin: [0, 0, 0, 14] });
  body.push({ text: ' ', margin: [0, 0, 0, 4] });

  if (analysis && analysis.trends && Object.keys(analysis.trends).length > 0) {
    body.push({ text: "How you're doing", fontSize: 14, bold: true, color: '#e91e63', margin: [0, 14, 0, 8] });
    var weightUnit = (typeof window.appSettings !== 'undefined' && window.appSettings && window.appSettings.weightUnit === 'lb') ? 'lb' : 'kg';
    var kgToLb = typeof window.kgToLb === 'function' ? window.kgToLb : function (k) { return k * 2.205; };
    var tableBody = [[
      { text: 'Metric', fontSize: 10, bold: true, fillColor: '#e8eaf6', color: '#283593' },
      { text: 'Status', fontSize: 10, bold: true, fillColor: '#e8eaf6', color: '#283593' },
      { text: 'Avg', fontSize: 10, bold: true, fillColor: '#e8eaf6', color: '#283593' },
      { text: 'Now', fontSize: 10, bold: true, fillColor: '#e8eaf6', color: '#283593' },
      { text: 'Next', fontSize: 10, bold: true, fillColor: '#e8eaf6', color: '#283593' }
    ]];
    Object.keys(analysis.trends).forEach(function (metric) {
      var t = analysis.trends[metric];
      var name = metric.replace(/([A-Z])/g, ' $1').replace(/^./, function (s) { return s.toUpperCase(); });
      var status = (t.statusFromAverage === 'improving') ? 'Getting Better' : (t.statusFromAverage === 'worsening') ? 'Getting Worse' : 'Staying Stable';
      var avg = t.average;
      var now = t.current;
      var nextVal = t.projected7Days;
      if (metric === 'bpm') {
        avg = Math.round(avg) + ''; now = Math.round(now) + ''; nextVal = nextVal != null ? Math.round(nextVal) + '' : '';
      } else if (metric === 'weight') {
        if (weightUnit === 'lb') { avg = kgToLb(avg); now = kgToLb(now); if (nextVal != null) nextVal = kgToLb(nextVal); }
        avg = avg.toFixed(1) + weightUnit; now = now.toFixed(1) + weightUnit; nextVal = nextVal != null ? nextVal.toFixed(1) + weightUnit : '';
      } else if (metric === 'steps') {
        avg = Math.round(avg).toLocaleString(); now = Math.round(now).toLocaleString(); nextVal = nextVal != null ? Math.round(nextVal).toLocaleString() : '';
      } else if (metric === 'hydration') {
        avg = avg.toFixed(1) + ' glasses'; now = now.toFixed(1) + ' glasses'; nextVal = nextVal != null ? nextVal.toFixed(1) + ' glasses' : '';
      } else {
        avg = Math.round(avg) + '/10'; now = Math.round(now) + '/10'; nextVal = nextVal != null ? Math.round(nextVal) + '/10' : '';
      }
      tableBody.push([
        { text: name, bold: true, fillColor: '#fce4ec', color: '#880e4f' },
        { text: status },
        { text: String(avg) },
        { text: String(now) },
        { text: nextVal ? String(nextVal) : '—' }
      ]);
    });
    body.push({
      table: { headerRows: 1, widths: ['*', 'auto', 50, 50, 50], body: tableBody },
      layout: 'lightHorizontalLines',
      margin: [0, 0, 0, 12]
    });
  }

  if (analysis && analysis.flareUpRisk) {
    body.push({ text: 'Possible flare-up', fontSize: 14, bold: true, color: '#4caf50', margin: [0, 14, 0, 8] });
    var level = analysis.flareUpRisk.level || 'low';
    var color = level === 'high' ? '#c62828' : level === 'moderate' ? '#e65100' : '#f9a825';
    var matchCount = analysis.flareUpRisk.matchingMetrics;
    var confidence = analysis.flareUpRisk.confidence;
    var levelText = 'Risk: ' + (level.charAt(0).toUpperCase() + level.slice(1));
    if (matchCount != null) levelText += ' · ' + matchCount + '/5 signs';
    if (confidence != null) levelText += ' (' + confidence + '% match)';
    body.push({ text: levelText, fontSize: 11, bold: true, color: color, margin: [0, 0, 0, 6] });
    body.push({ text: 'Keep an eye on how you feel and do what usually helps you prevent or ease flare-ups.', fontSize: 11, margin: [0, 0, 0, 6], lineHeight: 1.35 });
    body.push({ text: ' ', margin: [0, 0, 0, 4] });
  }

  if (text) {
    var sections = [
      /What we found/i,
      /What you logged/i,
      /Things to watch/i,
      /Correlations/i,
      /Important/i,
      /Symptoms/i,
      /Pain by body part/i,
      /Stress and triggers/i,
      /Nutrition/i,
      /Exercise/i
    ];
    var sectionTitle = '';
    var sectionContent = [];
    function flushSection() {
      if (sectionTitle && sectionContent.length) {
        var titleClean = sectionTitle.replace(/^[\s\u2014\-]+|[\s\u2014\-]+$/g, '');
        body.push({
          text: titleClean,
          fontSize: 14,
          bold: true,
          color: body.length > 4 ? '#2e7d32' : '#e91e63',
          margin: [0, 14, 0, 8]
        });
        body.push({ text: sectionContent.join('\n').trim(), fontSize: 11, margin: [0, 0, 0, 6], lineHeight: 1.35 });
        body.push({ text: ' ', margin: [0, 0, 0, 6] });
      }
      sectionContent = [];
    }
    var lines = text.split(/\r?\n/);
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var trimmed = (line || '').trim();
      var isHeading = sections.some(function (r) { return r.test(trimmed); });
      if (isHeading && trimmed.length < 60) {
        flushSection();
        sectionTitle = trimmed;
      } else if (trimmed && !/^─+$/.test(trimmed)) {
        if (!sectionTitle) sectionTitle = 'Summary';
        sectionContent.push(trimmed);
      }
    }
    flushSection();
  }

  return {
    pageSize: 'A4',
    pageMargins: [40, 40, 40, 50],
    defaultStyle: { fontSize: 11 },
    content: body
  };
}

function fallbackToTextPDF(fallbackText, JsPDF) {
  var text = sanitizeTextForPDF(fallbackText);
  if (text) generateAIAnalysisPDF(text, JsPDF);
  else if (typeof showAlertModal === 'function') showAlertModal('No AI analysis content to export.', 'Export PDF');
}

function loadScriptThen(src, onload, onerror) {
  var script = document.createElement('script');
  script.src = src;
  script.onload = onload;
  script.onerror = onerror || function () {};
  document.head.appendChild(script);
}

// Strip or replace characters that can break jsPDF default font (e.g. emoji, some Unicode)
function sanitizeTextForPDF(text) {
  if (!text || typeof text !== 'string') return text || '';
  return text
    .replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F1E0}-\u{1F1FF}]/gu, '') // emoji blocks
    .replace(/[\uFE00-\uFE0F]/g, '') // variation selectors
    .replace(/\u2014/g, '-')        // em dash
    .replace(/\u2013/g, '-')        // en dash
    .replace(/[\u2018\u2019]/g, "'") // smart single quotes
    .replace(/[\u201C\u201D]/g, '"') // smart double quotes
    .replace(/\u2022/g, '-')        // bullet
    .replace(/\u00A0/g, ' ')        // nbsp
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/^[^\x20-\x7E]+|[^\x20-\x7E]+$/g, '') // strip leading/trailing non-ASCII (e.g. emoji in headings)
    .trim();
}

function getJsPDFConstructor() {
  try {
    if (typeof window.jspdf !== 'undefined' && window.jspdf.jsPDF) return window.jspdf.jsPDF;
    if (typeof window.jsPDF !== 'undefined') return window.jsPDF;
    if (typeof window.jspdf !== 'undefined' && typeof window.jspdf.default !== 'undefined') return window.jspdf.default;
    if (typeof window.jspdf !== 'undefined' && typeof window.jspdf === 'function') return window.jspdf;
  } catch (e) { /* ignore */ }
  return null;
}

function generateAIAnalysisPDF(text, JsPDF) {
  try {
    const doc = new JsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 16;
    const indent = 8;
    const maxWidth = pageWidth - margin * 2;
    const maxWidthIndent = pageWidth - margin - indent;
    const lineHeight = 6.5;
    const sectionGap = 6;
    const paragraphGap = 5;
    const pageHeight = doc.internal.pageSize.getHeight();
    const bottomMargin = 28;
    const minYForNewPage = pageHeight - bottomMargin;
    const fontBody = 11;
    const fontHeading = 14;
    const fontSub = 11;

    function isSectionHeading(trimmed) {
      return /^\s*(What we found|What you logged|How you're doing|Things to watch|Correlations|Important|Possible flare-up|Symptoms|Pain by body part|Stress and triggers|Pain patterns|Nutrition|Exercise|Top exercises|Top foods|Food summary|What seems to help)/i.test(trimmed);
    }
    function isSectionDivider(trimmed) {
      return trimmed === '' || /^─+$/.test(trimmed);
    }
    function isDataLabel(trimmed) {
      return /^(Avg|Now|Next)\s*$/i.test(trimmed) || /^(Avg|Now|Next)\s+/i.test(trimmed);
    }
    function isValueLine(trimmed) {
      return /^\d|\.\d|\/\d0$|lb$|kg$|glasses$|Staying Stable|Getting Better|Getting Worse|may get|may stay/i.test(trimmed) || (trimmed.length <= 25 && /^[\d.,\s\/]+$/.test(trimmed));
    }
    function isMetricOrStatus(trimmed) {
      if (!trimmed || trimmed.length > 45) return false;
      if (isDataLabel(trimmed) || isValueLine(trimmed)) return false;
      var lower = trimmed.toLowerCase();
      if (/^(bpm|weight|fatigue|stiffness|sleep|mood|steps|hydration|back pain|joint pain|mobility|daily function|swelling|irritability|weather sensitivity)$/i.test(trimmed)) return true;
      if (/getting better|getting worse|staying stable/i.test(trimmed)) return true;
      return trimmed.length <= 25 && !/^\d/.test(trimmed);
    }

    var lines = text.replace(/\r\n/g, '\n').split('\n');
    var blocks = [];
    var i = 0;
    while (i < lines.length) {
      var trimmed = (lines[i] || '').trim();
      if (isSectionDivider(trimmed)) {
        blocks.push({ type: 'gap', line: trimmed });
        i++;
        continue;
      }
      if (isSectionHeading(trimmed)) {
        blocks.push({ type: 'heading', line: trimmed });
        i++;
        continue;
      }
      var paraLines = [];
      while (i < lines.length) {
        trimmed = (lines[i] || '').trim();
        if (isSectionDivider(trimmed) || isSectionHeading(trimmed)) break;
        paraLines.push(trimmed);
        i++;
      }
      if (paraLines.length) blocks.push({ type: 'paragraph', lines: paraLines });
    }

    var yPos = 22;
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('Health AI Analysis Report', margin, yPos);
    yPos += 10;
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text('For discussion with your healthcare provider.', margin, yPos);
    yPos += 12;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(fontBody);

    function blockHeight(block, fontDoc) {
      if (block.type === 'gap') return block.line === '' ? 4 : sectionGap;
      if (block.type === 'heading') {
        fontDoc.setFontSize(fontHeading);
        var w = fontDoc.splitTextToSize(block.line || ' ', maxWidth);
        fontDoc.setFontSize(fontBody);
        return w.length * lineHeight + 10;
      }
      var h = 0;
      for (var k = 0; k < block.lines.length; k++) {
        var line = block.lines[k] || ' ';
        var lineW = isValueLine(line) ? maxWidthIndent : maxWidth;
        var w = fontDoc.splitTextToSize(line, lineW);
        h += w.length * lineHeight;
        if (isMetricOrStatus(line)) h += 4;
        if (isDataLabel(line)) h += 2;
      }
      h += paragraphGap;
      return h;
    }

    var maxBlockHeight = minYForNewPage - 22;

    function ensureSpace(need) {
      if (yPos + need > minYForNewPage) {
        doc.addPage();
        yPos = 22;
      }
    }

    function drawLine(txt, useIndent) {
      var w = doc.splitTextToSize(txt || ' ', useIndent ? maxWidthIndent : maxWidth);
      var x = useIndent ? margin + indent : margin;
      for (var j = 0; j < w.length; j++) {
        if (yPos > minYForNewPage) {
          doc.addPage();
          yPos = 22;
        }
        doc.text(w[j], x, yPos);
        yPos += lineHeight;
      }
    }

    for (var b = 0; b < blocks.length; b++) {
      var block = blocks[b];
      var need = blockHeight(block, doc);

      if (block.type === 'gap') {
        ensureSpace(need);
        yPos += block.line === '' ? 4 : sectionGap;
        continue;
      }
      if (block.type === 'heading') {
        ensureSpace(need);
        doc.setFont(undefined, 'bold');
        doc.setFontSize(fontHeading);
        drawLine(block.line, false);
        doc.setFont(undefined, 'normal');
        doc.setFontSize(fontBody);
        yPos += 10;
        continue;
      }
      if (need <= maxBlockHeight) {
        ensureSpace(need);
        for (var k = 0; k < block.lines.length; k++) {
          var line = block.lines[k] || ' ';
          if (isMetricOrStatus(line)) {
            doc.setFont(undefined, 'bold');
            doc.setFontSize(fontSub);
            drawLine(line, false);
            doc.setFont(undefined, 'normal');
            doc.setFontSize(fontBody);
            yPos += 4;
            continue;
          }
          if (isDataLabel(line)) {
            doc.setFont(undefined, 'bold');
            doc.setFontSize(10);
            drawLine(line, false);
            doc.setFont(undefined, 'normal');
            doc.setFontSize(fontBody);
            yPos += 2;
            continue;
          }
          if (isValueLine(line)) {
            drawLine(line, true);
            continue;
          }
          drawLine(line, false);
        }
        yPos += paragraphGap;
      } else {
        for (var k = 0; k < block.lines.length; k++) {
          var line = block.lines[k] || ' ';
          if (isMetricOrStatus(line)) {
            if (yPos > minYForNewPage - lineHeight * 2) { doc.addPage(); yPos = 22; }
            doc.setFont(undefined, 'bold');
            doc.setFontSize(fontSub);
            drawLine(line, false);
            doc.setFont(undefined, 'normal');
            doc.setFontSize(fontBody);
            yPos += 4;
            continue;
          }
          if (isDataLabel(line)) {
            doc.setFont(undefined, 'bold');
            doc.setFontSize(10);
            drawLine(line, false);
            doc.setFont(undefined, 'normal');
            doc.setFontSize(fontBody);
            yPos += 2;
            continue;
          }
          if (isValueLine(line)) {
            drawLine(line, true);
            continue;
          }
          drawLine(line, false);
        }
        yPos += paragraphGap;
      }
    }

    var footerY = pageHeight - 18;
    if (yPos > footerY - 10) { doc.addPage(); yPos = 22; footerY = pageHeight - 18; }
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('For patterns only—talk to your doctor before changing care. You can share this at your next visit.', margin, footerY, { maxWidth: maxWidth });

    doc.save('health_ai_analysis_' + new Date().toISOString().split('T')[0] + '.pdf');
    if (typeof closeShareModal === 'function') closeShareModal();
  } catch (error) {
    console.error('AI PDF export error:', error);
    if (typeof showAlertModal === 'function') {
      showAlertModal('Error generating PDF: ' + error.message, 'Export Error');
    } else {
      alert('Error generating PDF: ' + error.message);
    }
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
  // Disable export in demo mode
  if (typeof appSettings !== 'undefined' && appSettings.demoMode) {
    if (typeof showAlertModal === 'function') {
      showAlertModal('Data export is disabled in demo mode. Demo data is not saved or synced.', 'Demo Mode');
    } else {
      alert('Data export is disabled in demo mode. Demo data is not saved or synced.');
    }
    return;
  }
  
  // Close settings modal if open
  if (typeof closeSettingsModalIfOpen === 'function') {
    closeSettingsModalIfOpen();
  } else {
    // Fallback if helper function not available
    const settingsOverlay = document.getElementById('settingsOverlay');
    if (settingsOverlay) {
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
    // Escape to close
    window._exportModalEscapeHandler = function(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        document.removeEventListener('keydown', window._exportModalEscapeHandler);
        window._exportModalEscapeHandler = null;
        closeExportModal();
      }
    };
    document.addEventListener('keydown', window._exportModalEscapeHandler);
  }
}

function closeExportModal() {
  if (window._exportModalEscapeHandler) {
    document.removeEventListener('keydown', window._exportModalEscapeHandler);
    window._exportModalEscapeHandler = null;
  }
  const modal = document.getElementById('exportModalOverlay');
  if (modal) {
    modal.style.display = 'none';
  }
}

// Perform export based on format
function performExport(format) {
  // Disable export in demo mode
  if (typeof appSettings !== 'undefined' && appSettings.demoMode) {
    if (typeof showAlertModal === 'function') {
      showAlertModal('Data export is disabled in demo mode. Demo data is not saved or synced.', 'Demo Mode');
    } else {
      alert('Data export is disabled in demo mode. Demo data is not saved or synced.');
    }
    closeExportModal();
    return;
  }
  
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
