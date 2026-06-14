/** RTL locale detection for layout direction. */

export function isRtlLocale(localeId) {
  const id = String(localeId || '').toLowerCase();
  return id === 'ar' || id.startsWith('ar-') || id === 'he' || id.startsWith('he-');
}

export function textDirection(localeId) {
  return isRtlLocale(localeId) ? 'rtl' : 'ltr';
}
