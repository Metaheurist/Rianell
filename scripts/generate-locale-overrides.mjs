#!/usr/bin/env node
/** Generate i18n-packs/locale-packs from en-GB canonical + per-locale string overrides. */
import fs from 'node:fs';
import path from 'node:path';
import { canonicalLocalePacksDir } from '../packages/shared/src/i18n/packPaths.mjs';
import { EXACT_OVERRIDES } from './lib/tier-a-exact-overrides.mjs';
import { applyRuleBasedMt, shouldKeepEnglish } from './lib/rule-based-mt.mjs';

const root = process.cwd();
const dir = canonicalLocalePacksDir(root);
const canonical = JSON.parse(fs.readFileSync(path.join(dir, 'en-GB.json'), 'utf8'));
const TIER_A = ['pt-BR', 'fr-FR', 'de-DE', 'es-ES', 'it-IT', 'nl-NL', 'pl-PL', 'pt-PT'];

function applyTierATranslations(strings, locale) {
  const out = { ...strings };
  for (const [key, enVal] of Object.entries(canonical.strings || {})) {
    if (key.startsWith('policy.')) continue;
    if (typeof enVal !== 'string') continue;
    if (shouldKeepEnglish(enVal)) continue;
    if ((out[key] || '').trim() !== enVal.trim()) continue;
    const rule = applyRuleBasedMt(enVal, locale);
    if (rule.trim() !== enVal.trim()) out[key] = rule;
  }
  const overrides = EXACT_OVERRIDES[locale] || {};
  for (const [key, enVal] of Object.entries(canonical.strings || {})) {
    if (key.startsWith('policy.')) continue;
    if (typeof enVal !== 'string') continue;
    if (shouldKeepEnglish(enVal)) continue;
    const exact = overrides[key] ?? overrides[enVal];
    if (!exact || exact.trim() === enVal.trim()) continue;
    out[key] = exact;
  }
  return out;
}

const OVERRIDES = {
  'en-US': {
    label: 'English (US)',
    strings: {
      'gate.lead':
        'Choose where you primarily live. This sets applicable privacy notices, UI language, and feature rules. We do not use GPS or IP to detect your location.',
      'settings.privacy.storageNote': 'All encrypted cloud backups use one Supabase project (operator region).',
      'policy.other-jurisdictions-us-ca.title': 'California (CCPA/CPRA)',
    },
  },
  'en-AU': {
    label: 'English (Australia)',
    strings: {
      'home.greeting': 'G\'day, {name}',
    },
  },
  'pt-BR': {
    label: 'Português (Brasil)',
    strings: {
      'common.close': 'Fechar',
      'common.cancel': 'Cancelar',
      'common.continue': 'Continuar',
      'common.confirm': 'Confirmar',
      'common.save': 'Salvar',
      'gate.title': 'Região de privacidade',
      'gate.lead':
        'Escolha onde você mora principalmente. Isso define avisos de privacidade, idioma da interface e regras de recursos. Não usamos GPS ou IP para detectar sua localização.',
      'gate.confirm': 'Confirmar e continuar',
      'gate.viewPolicies': 'Ver políticas aplicáveis',
      'settings.privacy.title': 'Privacidade e região',
      'settings.privacy.languageLabel': 'Idioma',
      'nav.home': 'Início',
      'nav.logs': 'Registros',
      'nav.charts': 'Gráficos',
      'nav.settings': 'Configurações',
    },
  },
  'fr-FR': {
    label: 'Français',
    strings: {
      'common.close': 'Fermer',
      'common.cancel': 'Annuler',
      'common.continue': 'Continuer',
      'gate.title': 'Région de confidentialité',
      'gate.lead':
        'Indiquez où vous résidez principalement. Cela définit les notices de confidentialité, la langue de l\'interface et les règles de fonctionnalités. Nous n\'utilisons pas le GPS ni l\'IP.',
      'gate.confirm': 'Confirmer et continuer',
      'settings.privacy.title': 'Confidentialité et région',
      'settings.privacy.languageLabel': 'Langue',
      'nav.home': 'Accueil',
      'nav.logs': 'Journaux',
      'nav.charts': 'Graphiques',
      'nav.settings': 'Paramètres',
    },
  },
  'de-DE': {
    label: 'Deutsch',
    strings: {
      'common.close': 'Schließen',
      'common.cancel': 'Abbrechen',
      'gate.title': 'Datenschutzregion',
      'gate.confirm': 'Bestätigen und fortfahren',
      'settings.privacy.title': 'Datenschutz & Region',
      'settings.privacy.languageLabel': 'Sprache',
      'nav.home': 'Start',
      'nav.logs': 'Protokolle',
      'nav.charts': 'Diagramme',
      'nav.settings': 'Einstellungen',
    },
  },
  'es-ES': {
    label: 'Español',
    strings: {
      'common.close': 'Cerrar',
      'gate.title': 'Región de privacidad',
      'gate.confirm': 'Confirmar y continuar',
      'settings.privacy.languageLabel': 'Idioma',
      'nav.home': 'Inicio',
      'nav.settings': 'Ajustes',
    },
  },
  'it-IT': {
    label: 'Italiano',
    strings: {
      'common.close': 'Chiudi',
      'gate.title': 'Regione privacy',
      'settings.privacy.languageLabel': 'Lingua',
      'nav.home': 'Home',
      'nav.settings': 'Impostazioni',
    },
  },
  'pl-PL': {
    label: 'Polski',
    strings: {
      'common.close': 'Zamknij',
      'gate.title': 'Region prywatności',
      'settings.privacy.languageLabel': 'Język',
      'nav.home': 'Start',
      'nav.settings': 'Ustawienia',
    },
  },
  'nl-NL': {
    label: 'Nederlands',
    strings: {
      'common.close': 'Sluiten',
      'gate.title': 'Privacyregio',
      'settings.privacy.languageLabel': 'Taal',
      'nav.home': 'Home',
      'nav.settings': 'Instellingen',
    },
  },
  'pt-PT': {
    label: 'Português (Portugal)',
    strings: {
      'common.close': 'Fechar',
      'gate.title': 'Região de privacidade',
      'settings.privacy.languageLabel': 'Idioma',
      'nav.home': 'Início',
      'nav.settings': 'Definições',
    },
  },
};

for (const [locale, meta] of Object.entries(OVERRIDES)) {
  let strings = { ...canonical.strings, ...(meta.strings || {}) };
  if (TIER_A.includes(locale)) {
    strings = applyTierATranslations(strings, locale);
  }
  const out = {
    locale,
    label: meta.label,
    strings,
    ...(TIER_A.includes(locale) ? { machineTranslatedUi: true } : {}),
  };
  fs.writeFileSync(path.join(dir, `${locale}.json`), `${JSON.stringify(out, null, 2)}\n`, 'utf8');
  console.log('wrote', locale);
}
