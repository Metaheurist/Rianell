import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import {
  buildAppointmentReportHtml,
  buildAppointmentReportModel,
  buildMedicationTimeline,
} from '@rianell/shared';
import type { LogEntry } from '../storage/logs';
import type { Preferences } from '../storage/preferences';

export async function printOrShareAppointmentReport(options: {
  logs: LogEntry[];
  prefs: Preferences;
  briefText?: string;
  doctorQuestions?: string[];
}): Promise<void> {
  const timeline = buildMedicationTimeline(options.logs, options.prefs.treatmentStarts || []);
  const model = buildAppointmentReportModel(options.logs, {
    appointmentDate: options.prefs.nextAppointmentDate,
    briefText: options.briefText || '',
    medSchedule: options.prefs.medSchedule,
    timelineRows: timeline.rows,
    doctorQuestions: options.doctorQuestions || [],
  });
  const html = buildAppointmentReportHtml(model);
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Appointment report',
    });
  }
}
