/** Derive first-run locale defaults (Plan 03 S3). */
const LB_LOCALES = new Set(['en-US', 'en-us']);

export function deriveWeightUnitFromLocale(locale) {
  const tag = typeof locale === 'string' ? locale.trim() : '';
  if (LB_LOCALES.has(tag) || tag.endsWith('-US')) return 'lb';
  return 'kg';
}

export function deriveFirstDayOfWeekFromLocale(locale) {
  try {
    const loc = typeof locale === 'string' && locale ? locale : 'en-GB';
    const parts = new Intl.Locale(loc).weekInfo;
    if (parts && (parts.firstDay === 0 || parts.firstDay === 1 || parts.firstDay === 6)) {
      return parts.firstDay;
    }
  } catch (_) {
    /* Intl.Locale.weekInfo not in all runtimes */
  }
  const tag = (typeof locale === 'string' ? locale : 'en-GB').toLowerCase();
  if (tag.startsWith('en-us')) return 0;
  return 1;
}

export function deriveDateFormatFromLocale(locale) {
  const tag = (typeof locale === 'string' ? locale : 'en-GB').toLowerCase();
  if (tag.startsWith('en-us')) return 'MDY';
  if (tag.startsWith('ja') || tag.startsWith('zh') || tag.startsWith('ko')) return 'YMD';
  return 'DMY';
}

/** Apply locale-derived defaults only when prefs have no explicit user choice yet. */
export function applyLocaleDefaultsToPrefs(prefs, locale) {
  const next = { ...(prefs && typeof prefs === 'object' ? prefs : {}) };
  const loc = typeof locale === 'string' && locale ? locale : next.uiLocale || 'en-GB';
  if (!next.localeDefaultsApplied) {
    if (!next.weightUnitSource || next.weightUnitSource === 'default') {
      next.weightUnit = deriveWeightUnitFromLocale(loc);
      next.weightUnitSource = 'locale';
    }
    next.dateFormat = next.dateFormat || deriveDateFormatFromLocale(loc);
    next.firstDayOfWeek =
      typeof next.firstDayOfWeek === 'number'
        ? next.firstDayOfWeek
        : deriveFirstDayOfWeekFromLocale(loc);
    next.localeDefaultsApplied = true;
  }
  return next;
}
