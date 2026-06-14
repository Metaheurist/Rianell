import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  SHIPPED_LOCALES,
  localeLabel,
  t as translate,
  resolveActiveLocale,
  getDefaultLocaleForRegion,
  applyRegionDefaultLocale,
  isRtlLocale,
  textDirection,
} from '@rianell/shared';
import type { Preferences } from '../storage/preferences';

type Catalog = { locale: string; label: string; strings: Record<string, string> };
type CatalogMap = Record<string, Catalog>;

// Bundled catalogs (Metro resolves JSON under apps/rn-app/i18n-packs/locale-packs/v1/)
const catalogModules: CatalogMap = {
  'en-GB': require('../../i18n-packs/locale-packs/v1/en-GB.json'),
  'en-US': require('../../i18n-packs/locale-packs/v1/en-US.json'),
  'en-AU': require('../../i18n-packs/locale-packs/v1/en-AU.json'),
  'pt-BR': require('../../i18n-packs/locale-packs/v1/pt-BR.json'),
  'fr-FR': require('../../i18n-packs/locale-packs/v1/fr-FR.json'),
  'de-DE': require('../../i18n-packs/locale-packs/v1/de-DE.json'),
  'es-ES': require('../../i18n-packs/locale-packs/v1/es-ES.json'),
  'it-IT': require('../../i18n-packs/locale-packs/v1/it-IT.json'),
  'pl-PL': require('../../i18n-packs/locale-packs/v1/pl-PL.json'),
  'nl-NL': require('../../i18n-packs/locale-packs/v1/nl-NL.json'),
  'pt-PT': require('../../i18n-packs/locale-packs/v1/pt-PT.json'),
  ar: require('../../i18n-packs/locale-packs/v1/ar.json'),
  he: require('../../i18n-packs/locale-packs/v1/he.json'),
  ga: require('../../i18n-packs/locale-packs/v1/ga.json'),
};

type I18nContextValue = {
  locale: string;
  direction: 'ltr' | 'rtl';
  isRtl: boolean;
  t: (key: string, params?: Record<string, string | number>) => string;
  localeOptions: { id: string; label: string }[];
  setLocale: (locale: string, source?: Preferences['uiLocaleSource']) => void;
  applyRegionLocale: (regionId: string) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  prefs,
  onLocaleChange,
  children,
}: {
  prefs: Preferences;
  onLocaleChange?: (next: Preferences) => void;
  children: React.ReactNode;
}) {
  const locale = resolveActiveLocale(prefs);
  const [, bump] = useState(0);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) =>
      translate(key, locale, catalogModules, params as Record<string, string>),
    [locale],
  );

  const setLocale = useCallback(
    (nextLocale: string, source: Preferences['uiLocaleSource'] = 'user') => {
      if (!onLocaleChange) return;
      onLocaleChange({
        ...prefs,
        uiLocale: nextLocale,
        uiLocaleSource: source,
        uiLocaleUpdatedAt: new Date().toISOString(),
      });
      bump((n) => n + 1);
    },
    [onLocaleChange, prefs],
  );

  const applyRegionLocale = useCallback(
    (regionId: string) => {
      const defaultLoc = getDefaultLocaleForRegion(regionId);
      if (onLocaleChange) {
        onLocaleChange(
          applyRegionDefaultLocale(
            { ...prefs, privacyRegion: regionId },
            regionId,
          ) as Preferences,
        );
      }
      return defaultLoc;
    },
    [onLocaleChange, prefs],
  );

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      direction: textDirection(locale),
      isRtl: isRtlLocale(locale),
      t,
      localeOptions: SHIPPED_LOCALES.map((id) => ({ id, label: localeLabel(id) })),
      setLocale,
      applyRegionLocale,
    }),
    [locale, t, setLocale, applyRegionLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useT() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    return {
      locale: 'en-GB',
      direction: 'ltr',
      isRtl: false,
      t: (key: string) => key,
      localeOptions: [],
      setLocale: () => {},
      applyRegionLocale: () => 'en-GB',
    };
  }
  return ctx;
}
