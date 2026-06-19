/** Plan 14 X14.4 — telehealth / presentation mode for charts. */

export const PRESENTATION_CHART_RANGE_DAYS = 7;

export function normalizePresentationModePrefs(raw) {
  const v = raw && typeof raw === 'object' ? raw : {};
  return {
    chartsPresentationMode: v.chartsPresentationMode === true,
    weeklyReviewDismissedWeek:
      typeof v.weeklyReviewDismissedWeek === 'string' ? v.weeklyReviewDismissedWeek : null,
  };
}

export function getPresentationChartRange(currentRange) {
  return PRESENTATION_CHART_RANGE_DAYS;
}

export function shouldLockChartRangeInPresentation(presentationMode) {
  return presentationMode === true;
}
