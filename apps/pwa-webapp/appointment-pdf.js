/**
 * Plan 12 CL1 — appointment mode PDF (PWA).
 */
(function () {
  'use strict';

  async function ensureJsPdf() {
    if (typeof window.jspdf !== 'undefined' && window.jspdf.jsPDF) return window.jspdf.jsPDF;
    if (window.PerformanceUtils && typeof window.PerformanceUtils.lazyLoadScript === 'function') {
      await window.PerformanceUtils.lazyLoadScript('https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js');
    }
    if (typeof window.jspdf !== 'undefined' && window.jspdf.jsPDF) return window.jspdf.jsPDF;
    throw new Error('PDF library not available');
  }

  async function generateAppointmentPdf(opts) {
    var Shared = window.RianellShared;
    if (!Shared || typeof Shared.buildAppointmentReportHtml !== 'function') {
      throw new Error('Shared appointment report module not loaded');
    }
    var logs = (opts && opts.logs) || (typeof window.getHealthLogsArray === 'function' ? window.getHealthLogsArray() : []);
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
    var printWin = window.open('', '_blank');
    if (!printWin) throw new Error('Popup blocked. Allow popups to save PDF');
    printWin.document.write(html);
    printWin.document.close();
    printWin.focus();
    setTimeout(function () {
      try { printWin.print(); } catch (e) { /* user may save as PDF from dialog */ }
    }, 400);
  }

  window.RianellAppointmentPdf = { generate: generateAppointmentPdf };
})();
