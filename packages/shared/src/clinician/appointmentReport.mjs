/** Plan 12 CL1 — appointment mode PDF sections (charts summary + brief + meds + flare calendar). */

export const APPOINTMENT_DISCLAIMER =
  'Wellness tracking only, not medical advice, diagnosis, or treatment. Discuss patterns with your clinician.';

export const APPOINTMENT_RANGE_DAYS = 30;

function sortLogsNewestFirst(logs) {
  return [...(Array.isArray(logs) ? logs : [])].sort((a, b) =>
    String(b?.date || '').localeCompare(String(a?.date || ''))
  );
}

export function filterLogsForAppointment(logs, days = APPOINTMENT_RANGE_DAYS, todayStr) {
  const today = todayStr || new Date().toISOString().slice(0, 10);
  const end = new Date(`${today}T12:00:00`);
  const start = new Date(end);
  start.setDate(start.getDate() - days);
  return (Array.isArray(logs) ? logs : []).filter((log) => {
    if (!log?.date || !/^\d{4}-\d{2}-\d{2}$/.test(log.date)) return false;
    const d = new Date(`${log.date}T12:00:00`);
    return d >= start && d <= end;
  });
}

function mean(values) {
  if (!values.length) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function buildAppointmentChartRows(logs, days = 14) {
  const slice = filterLogsForAppointment(logs, days);
  const mood = slice.map((l) => l.mood).filter((v) => v != null);
  const sleep = slice.map((l) => l.sleep).filter((v) => v != null);
  const fatigue = slice.map((l) => l.fatigue).filter((v) => v != null);
  const flareDays = slice.filter((l) => l.flare === 'Yes').length;
  const rows = [
    { label: 'Logged days', value: String(slice.length) },
    { label: 'Flare days', value: String(flareDays) },
  ];
  const moodAvg = mean(mood);
  const sleepAvg = mean(sleep);
  const fatigueAvg = mean(fatigue);
  if (moodAvg != null) rows.push({ label: 'Mood (avg /10)', value: moodAvg.toFixed(1) });
  if (sleepAvg != null) rows.push({ label: 'Sleep (avg /10)', value: sleepAvg.toFixed(1) });
  if (fatigueAvg != null) rows.push({ label: 'Fatigue (avg /10)', value: fatigueAvg.toFixed(1) });
  return rows;
}

export function collectFlareCalendarEntries(logs, days = APPOINTMENT_RANGE_DAYS, todayStr) {
  return filterLogsForAppointment(logs, days, todayStr)
    .filter((l) => l.flare === 'Yes')
    .map((l) => l.date)
    .sort();
}

export function collectMedicationList(logs, medSchedule = []) {
  const names = new Set();
  (Array.isArray(medSchedule) ? medSchedule : []).forEach((m) => {
    if (m?.enabled !== false && m?.drug) names.add(String(m.drug).trim());
  });
  sortLogsNewestFirst(logs)
    .slice(0, 30)
    .forEach((log) => {
      if (Array.isArray(log.medications)) {
        log.medications.forEach((med) => {
          const n = typeof med === 'string' ? med : med?.name || med?.drug;
          if (n) names.add(String(n).trim());
        });
      }
      if (Array.isArray(log.medicationDoses)) {
        log.medicationDoses.forEach((d) => {
          if (d?.drug) names.add(String(d.drug).trim());
        });
      }
    });
  return [...names].filter(Boolean).sort();
}

export function buildAppointmentReportModel(logs, opts = {}) {
  const rangeDays = opts.rangeDays ?? APPOINTMENT_RANGE_DAYS;
  const filtered = filterLogsForAppointment(logs, rangeDays, opts.todayStr);
  return {
    appointmentDate: opts.appointmentDate || null,
    rangeLabel: opts.rangeLabel || `Last ${rangeDays} days`,
    briefText: opts.briefText || '',
    chartRows: buildAppointmentChartRows(logs, Math.min(14, rangeDays)),
    flareDates: collectFlareCalendarEntries(logs, rangeDays, opts.todayStr),
    medications: collectMedicationList(filtered, opts.medSchedule),
    timelineRows: Array.isArray(opts.timelineRows) ? opts.timelineRows : [],
    doctorQuestions: Array.isArray(opts.doctorQuestions) ? opts.doctorQuestions : [],
    disclaimer: opts.disclaimer || APPOINTMENT_DISCLAIMER,
  };
}

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildAppointmentReportHtml(model) {
  const m = model && typeof model === 'object' ? model : {};
  const chartRows = (m.chartRows || [])
    .map((r) => `<tr><td>${escapeHtml(r.label)}</td><td>${escapeHtml(r.value)}</td></tr>`)
    .join('');
  const flareList = (m.flareDates || []).length
    ? (m.flareDates || []).map((d) => `<li>${escapeHtml(d)}</li>`).join('')
    : '<li>None recorded in range</li>';
  const medList = (m.medications || []).length
    ? (m.medications || []).map((d) => `<li>${escapeHtml(d)}</li>`).join('')
    : '<li>None listed</li>';
  const timeline = (m.timelineRows || [])
    .map(
      (row) =>
        `<tr><td>${escapeHtml(row.startDate)}</td><td>${escapeHtml(row.label)}</td>` +
        `<td>${escapeHtml(row.preFatigueAvg ?? '-')}</td><td>${escapeHtml(row.postFatigueAvg ?? '-')}</td></tr>`,
    )
    .join('');
  const questions = (m.doctorQuestions || [])
    .map((q, i) => `<li>${escapeHtml(q)}</li>`)
    .join('');
  const apptLine = m.appointmentDate
    ? `<p><strong>Upcoming visit:</strong> ${escapeHtml(m.appointmentDate)}</p>`
    : '';
  const briefBlock = m.briefText
    ? `<h2>Visit prep summary</h2><p style="white-space:pre-wrap">${escapeHtml(m.briefText)}</p>`
    : '<p><em>Generate a clinician brief in the app to include AI summary text.</em></p>';
  const questionsBlock = questions
    ? `<h2>Questions for my clinician</h2><ol>${questions}</ol>`
    : '';

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Rianell appointment report</title>
<style>
body{font-family:system-ui,sans-serif;padding:28px;color:#222;font-size:13px;line-height:1.45}
h1{font-size:20px;margin:0 0 8px}
h2{font-size:15px;margin:20px 0 8px;border-bottom:1px solid #ddd;padding-bottom:4px}
table{border-collapse:collapse;width:100%;margin:8px 0}
td,th{border:1px solid #ccc;padding:6px 8px;text-align:left}
.footer{font-size:11px;color:#666;margin-top:24px;border-top:1px solid #eee;padding-top:10px}
.page{page-break-after:always}
.page:last-child{page-break-after:auto}
</style></head><body>
<div class="page">
<h1>Rianell appointment report</h1>
<p><strong>Range:</strong> ${escapeHtml(m.rangeLabel)}</p>
${apptLine}
${briefBlock}
<h2>Chart summary</h2>
<table><thead><tr><th>Metric</th><th>Value</th></tr></thead><tbody>${chartRows}</tbody></table>
${questionsBlock}
<p class="footer">${escapeHtml(m.disclaimer)}</p>
</div>
<div class="page">
<h2>Medications</h2>
<ul>${medList}</ul>
<h2>Flare calendar</h2>
<ul>${flareList}</ul>
<h2>Treatment timeline</h2>
<table><thead><tr><th>Start</th><th>Label</th><th>Pre fatigue</th><th>Post fatigue</th></tr></thead>
<tbody>${timeline || '<tr><td colspan="4">No treatment markers recorded</td></tr>'}</tbody></table>
<p class="footer">${escapeHtml(m.disclaimer)}</p>
</div>
</body></html>`;
}
