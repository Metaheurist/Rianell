/**
 * Plan 12 CL1 - appointment / weekly review PDF (PWA).
 */
(function () {
  'use strict';

  function getHtml2pdf() {
    var h = window.html2pdf;
    if (typeof h === 'function') return h;
    if (h && typeof h.default === 'function') return h.default;
    return null;
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async function ensureHtml2pdf() {
    if (getHtml2pdf()) return getHtml2pdf();
    if (window.PerformanceUtils && typeof window.PerformanceUtils.lazyLoadScript === 'function') {
      var urls = [
        'https://cdn.jsdelivr.net/npm/html2pdf.js@0.10.1/dist/html2pdf.bundle.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js',
      ];
      for (var i = 0; i < urls.length; i++) {
        try {
          await window.PerformanceUtils.lazyLoadScript(urls[i]);
          if (getHtml2pdf()) return getHtml2pdf();
        } catch (e) { /* try next CDN */ }
      }
    } else {
      try {
        await loadScript('https://cdn.jsdelivr.net/npm/html2pdf.js@0.10.1/dist/html2pdf.bundle.min.js');
      } catch (e) {
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js');
      }
    }
    return getHtml2pdf();
  }

  function getLogs(opts) {
    if (opts && Array.isArray(opts.logs)) return opts.logs;
    if (typeof window.getHealthLogsArray === 'function') {
      var fromFn = window.getHealthLogsArray();
      if (Array.isArray(fromFn) && fromFn.length) return fromFn;
    }
    if (window.logs && Array.isArray(window.logs)) return window.logs;
    return [];
  }

  function openPrintFallback(html) {
    var printWin = window.open('', '_blank');
    if (!printWin) throw new Error('Popup blocked. Allow popups to save PDF.');
    printWin.document.write(html);
    printWin.document.close();
    printWin.focus();
    setTimeout(function () {
      try { printWin.print(); } catch (e) { /* user may save as PDF from dialog */ }
    }, 400);
  }

  async function downloadHtmlAsPdf(html, filename) {
    var html2pdfFn = await ensureHtml2pdf();
    if (!html2pdfFn) return false;

    var iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.cssText = 'position:fixed;left:-10000px;top:0;width:820px;height:1200px;border:0;opacity:0;pointer-events:none';
    document.body.appendChild(iframe);

    var doc = iframe.contentDocument || (iframe.contentWindow && iframe.contentWindow.document);
    if (!doc) {
      document.body.removeChild(iframe);
      return false;
    }

    doc.open();
    doc.write(html);
    doc.close();

    await new Promise(function (r) { setTimeout(r, 350); });

    var body = doc.body;
    if (!body) {
      document.body.removeChild(iframe);
      return false;
    }

    try {
      await html2pdfFn()
        .set({
          margin: [8, 8, 8, 8],
          filename: filename,
          image: { type: 'jpeg', quality: 0.96 },
          html2canvas: { scale: 2, useCORS: true, logging: false },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak: { mode: ['css', 'legacy'] },
        })
        .from(body)
        .save();
      return true;
    } finally {
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
    }
  }

  async function generateAppointmentPdf(opts) {
    var Shared = window.RianellShared;
    if (!Shared || typeof Shared.buildAppointmentReportHtml !== 'function') {
      throw new Error('Report module not loaded. Refresh and try again.');
    }

    var logs = getLogs(opts || {});
    var settings = (typeof window.appSettings !== 'undefined' && window.appSettings) ? window.appSettings : {};
    var timeline = Shared.buildMedicationTimeline
      ? Shared.buildMedicationTimeline(logs, settings.treatmentStarts || [])
      : { rows: [] };
    var model = Shared.buildAppointmentReportModel(logs, {
      appointmentDate: settings.nextAppointmentDate || null,
      briefText: (opts && opts.briefText) || '',
      medSchedule: settings.medSchedule || [],
      timelineRows: timeline.rows || [],
      doctorQuestions: (opts && opts.doctorQuestions) || [],
    });
    var html = Shared.buildAppointmentReportHtml(model);
    var filename = 'rianell-weekly-review-' + new Date().toISOString().slice(0, 10) + '.pdf';

    try {
      var downloaded = await downloadHtmlAsPdf(html, filename);
      if (downloaded) return;
    } catch (err) {
      console.warn('appointment-pdf: html2pdf download failed, using print fallback', err);
    }

    openPrintFallback(html);
  }

  window.RianellAppointmentPdf = { generate: generateAppointmentPdf };
  window.printOrShareAppointmentReport = generateAppointmentPdf;
})();
