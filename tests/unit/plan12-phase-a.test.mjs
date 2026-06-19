import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAppointmentReportModel,
  buildAppointmentReportHtml,
  APPOINTMENT_DISCLAIMER,
  createQrHandoffPayload,
  decryptQrHandoffToken,
  isQrHandoffExpired,
  QR_HANDOFF_MAX_CHARS,
  buildMedicationTimeline,
  inferTreatmentStartsFromLogs,
  normalizeTreatmentStarts,
} from '@rianell/shared';
import {
  buildDoctorQuestionsContext,
  buildDoctorQuestionsFallback,
  parseDoctorQuestionsResponse,
} from '@rianell/shared';

const SAMPLE_LOGS = [
  { date: '2026-06-01', mood: 6, sleep: 7, fatigue: 5, flare: 'No', medications: ['Med A'] },
  { date: '2026-06-08', mood: 5, sleep: 6, fatigue: 6, flare: 'Yes', medications: ['Med A', 'Med B'] },
  { date: '2026-06-15', mood: 7, sleep: 8, fatigue: 4, flare: 'No', medicationDoses: [{ drug: 'Med B', dose: '10mg' }] },
];

test('buildAppointmentReportModel includes disclaimer and chart rows', () => {
  const model = buildAppointmentReportModel(SAMPLE_LOGS, {
    appointmentDate: '2026-06-20',
    briefText: 'Patterns look stable.',
    doctorQuestions: ['How is my sleep trend?'],
  });
  assert.equal(model.disclaimer, APPOINTMENT_DISCLAIMER);
  assert.ok(model.chartRows.length >= 2);
  assert.equal(model.appointmentDate, '2026-06-20');
  assert.equal(model.doctorQuestions.length, 1);
  const html = buildAppointmentReportHtml(model);
  assert.match(html, /Wellness tracking only/);
  assert.match(html, /Patterns look stable/);
});

test('inferTreatmentStartsFromLogs detects first med appearances', () => {
  const starts = inferTreatmentStartsFromLogs(SAMPLE_LOGS);
  assert.equal(starts.length, 2);
  assert.equal(starts[0].label, 'Med A');
  assert.equal(starts[0].date, '2026-06-01');
});

test('buildMedicationTimeline uses explicit treatmentStarts when set', () => {
  const rows = buildMedicationTimeline(SAMPLE_LOGS, [{ date: '2026-06-08', label: 'Steroid trial' }]);
  assert.equal(rows.rows.length, 1);
  assert.equal(rows.rows[0].label, 'Steroid trial');
});

test('normalizeTreatmentStarts filters invalid entries', () => {
  const out = normalizeTreatmentStarts([{ date: 'bad', label: 'x' }, { date: '2026-06-01', label: 'OK' }]);
  assert.deepEqual(out, [{ date: '2026-06-01', label: 'OK' }]);
});

test('QR handoff round-trip encrypts bounded payload', async () => {
  const { token, logCount } = await createQrHandoffPayload(SAMPLE_LOGS, 'test-pass-phrase', {
    ttlMinutes: 60,
    subtle: globalThis.crypto.subtle,
  });
  assert.ok(token.length <= QR_HANDOFF_MAX_CHARS);
  assert.equal(logCount, 3);
  const data = await decryptQrHandoffToken(token, 'test-pass-phrase', { subtle: globalThis.crypto.subtle });
  assert.equal(data.logs.length, 3);
  assert.equal(data.readOnly, true);
});

test('isQrHandoffExpired rejects past tokens', () => {
  assert.equal(isQrHandoffExpired({ expiresAt: '2000-01-01T00:00:00.000Z' }), true);
});

test('doctor questions helpers parse numbered list', () => {
  const ctx = buildDoctorQuestionsContext({ analysis: { avgMood: 6.2, flareDays: 1 }, rangeLabel: 'Last 14 days' });
  assert.match(ctx, /Mood avg/);
  const parsed = parseDoctorQuestionsResponse('1. Sleep changes?\n2. Fatigue pattern?\n3. Next steps?');
  assert.equal(parsed.length, 3);
  const fb = buildDoctorQuestionsFallback({ flareDays: 2 });
  assert.equal(fb.length, 3);
});
