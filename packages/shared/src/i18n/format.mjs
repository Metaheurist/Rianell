/** Locale-aware formatting helpers (Intl wrappers). */

const GRANULAR_DATE_KEYS = [
  'weekday',
  'era',
  'year',
  'month',
  'day',
  'hour',
  'minute',
  'second',
  'timeZoneName',
  'fractionalSecondDigits',
];

function hasGranularDateOptions(opts) {
  return GRANULAR_DATE_KEYS.some((k) => opts[k] !== undefined);
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Parse YYYY-MM-DD as local noon to avoid UTC day-shift in western timezones. */
export function parseIsoDateLocal(iso) {
  const raw = typeof iso === 'string' ? iso.trim() : '';
  if (!ISO_DATE_RE.test(raw)) return null;
  const d = new Date(`${raw}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function coerceDateValue(value) {
  if (value instanceof Date) return value;
  const local = parseIsoDateLocal(value);
  if (local) return local;
  return new Date(value);
}

/** Format a stored log date (YYYY-MM-DD) for display using the active UI locale. */
export function formatIsoDate(iso, locale, opts = {}) {
  const d = parseIsoDateLocal(iso);
  if (!d) return typeof iso === 'string' ? iso : '';
  return formatDate(d, locale, opts);
}

export function formatDate(value, locale, opts = {}) {
  const d = coerceDateValue(value);
  if (Number.isNaN(d.getTime())) return '';
  const { dateStyle, timeStyle, ...rest } = opts;
  const intlOpts = { ...rest };
  const granular = hasGranularDateOptions(intlOpts);

  if (!granular) {
    intlOpts.dateStyle = dateStyle ?? 'medium';
  } else if (dateStyle !== undefined) {
    intlOpts.dateStyle = dateStyle;
  }

  if (timeStyle !== undefined && !granular) {
    intlOpts.timeStyle = timeStyle;
  }

  try {
    return new Intl.DateTimeFormat(locale || 'en-GB', intlOpts).format(d);
  } catch {
    return d.toLocaleDateString(locale || 'en-GB', intlOpts);
  }
}

export function formatNumber(value, locale, opts = {}) {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return '';
  return new Intl.NumberFormat(locale || 'en-GB', opts).format(n);
}

export function formatRelativeDay(iso, locale) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.round((target - today) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays === 1) return 'Tomorrow';
  return formatDate(d, locale, { dateStyle: 'medium' });
}

export function languageNameForLocale(localeId, displayLocale = 'en-GB') {
  try {
    const dn = new Intl.DisplayNames([displayLocale], { type: 'language' });
    const [lang] = String(localeId || '').split('-');
    return dn.of(lang) || localeId;
  } catch {
    return localeId;
  }
}
