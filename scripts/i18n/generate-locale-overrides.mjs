#!/usr/bin/env node
/** Generate i18n-packs/locale-packs from en-GB canonical + per-locale string overrides. */
import fs from 'node:fs';
import path from 'node:path';
import { canonicalLocalePacksDir } from '../../packages/shared/src/i18n/packPaths.mjs';
import { EXACT_OVERRIDES } from '../lib/tier-a-exact-overrides.mjs';
import { MIXED_FIXES } from '../lib/lc20-mixed-fixes.mjs';
import { applyRuleBasedMt, shouldKeepEnglish } from '../lib/rule-based-mt.mjs';
import { PLAN02_TIER_A_OVERRIDES } from '../lib/plan02-tier-a-overrides.mjs';
import { PLAN03_TIER_A_OVERRIDES } from '../lib/plan03-tier-a-overrides.mjs';
import { PLAN04_TIER_A_OVERRIDES } from '../lib/plan04-tier-a-overrides.mjs';
import { PLAN05_TIER_A_OVERRIDES } from '../lib/plan05-tier-a-overrides.mjs';

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
  const mixed = MIXED_FIXES[locale] || {};
  for (const [key, val] of Object.entries(mixed)) {
    if (typeof val === 'string' && val.trim()) out[key] = val;
  }
  const plan02 = PLAN02_TIER_A_OVERRIDES[locale] || {};
  for (const [key, val] of Object.entries(plan02)) {
    if (typeof val === 'string' && val.trim()) out[key] = val;
  }
  const plan03 = PLAN03_TIER_A_OVERRIDES[locale] || {};
  for (const [key, val] of Object.entries(plan03)) {
    if (typeof val === 'string' && val.trim()) out[key] = val;
  }
  const plan04 = PLAN04_TIER_A_OVERRIDES[locale] || {};
  for (const [key, val] of Object.entries(plan04)) {
    if (typeof val === 'string' && val.trim()) out[key] = val;
  }
  const plan05 = PLAN05_TIER_A_OVERRIDES[locale] || {};
  for (const [key, val] of Object.entries(plan05)) {
    if (typeof val === 'string' && val.trim()) out[key] = val;
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
  ga: {
    label: 'Gaeilge',
    llmCapability: 'ui-only',
    strings: {
      'common.close': 'Dún',
      'common.cancel': 'Cealaigh',
      'common.continue': 'Lean ar aghaidh',
      'common.confirm': 'Deimhnigh',
      'common.save': 'Sábháil',
      'common.loading': 'Ag lódáil…',
      'common.accept': 'Glac',
      'gate.title': 'Réigiún príobháideachais',
      'gate.confirm': 'Deimhnigh agus lean ar aghaidh',
      'settings.privacy.title': 'Príobháideachas & réigiún',
      'settings.privacy.languageLabel': 'Teanga',
      'nav.home': 'Baile',
      'nav.logs': 'Logaí',
      'nav.charts': 'Cairteacha',
      'nav.ai': 'Anailís AI',
      'nav.settings': 'Socruithe',
      'wizard.action.back': 'Ar ais',
      'wizard.action.skip': 'Scipeáil',
      'wizard.action.saveEntry': 'Sábháil iontráil',
      'wizard.progress.stepOfTotal': 'Céim {current} as {total}',
      'common.god.mode.test.all.ui': 'Mód Dé – tástáil an UI go léir',
      'tutorial.done': 'Tosaigh',
    },
  },
};

for (const [locale, meta] of Object.entries(OVERRIDES)) {
  const filePath = path.join(dir, `${locale}.json`);
  const existing = fs.existsSync(filePath)
    ? JSON.parse(fs.readFileSync(filePath, 'utf8'))
    : { strings: {} };
  let strings = { ...canonical.strings, ...(existing.strings || {}), ...(meta.strings || {}) };
  if (TIER_A.includes(locale)) {
    strings = applyTierATranslations(strings, locale);
  }
  const overrides = EXACT_OVERRIDES[locale] || {};
  for (const [key, val] of Object.entries(overrides)) {
    if (typeof val === 'string' && val.trim()) strings[key] = val;
  }
  const mixed = MIXED_FIXES[locale] || {};
  for (const [key, val] of Object.entries(mixed)) {
    if (typeof val === 'string' && val.trim()) strings[key] = val;
  }
  const out = {
    locale,
    label: meta.label,
    strings,
    ...(meta.llmCapability ? { llmCapability: meta.llmCapability } : {}),
    ...(TIER_A.includes(locale) ? { machineTranslatedUi: true } : {}),
  };
  fs.writeFileSync(filePath, `${JSON.stringify(out, null, 2)}\n`, 'utf8');
  console.log('wrote', locale);
}

/** Preserve ar/he packs: merge canonical keys without overwriting existing translations. */
const RTL_LOCALES = {
  ar: { label: 'العربية', llmCapability: 'ui-only' },
  he: { label: 'עברית', llmCapability: 'ui-only' },
};
for (const [locale, meta] of Object.entries(RTL_LOCALES)) {
  const filePath = path.join(dir, `${locale}.json`);
  const existing = fs.existsSync(filePath)
    ? JSON.parse(fs.readFileSync(filePath, 'utf8'))
    : { strings: {} };
  const strings = { ...canonical.strings, ...(existing.strings || {}) };
  for (const [key, val] of Object.entries(canonical.strings || {})) {
    if (strings[key] === undefined || strings[key] === '') strings[key] = val;
  }
  const out = {
    locale,
    label: meta.label,
    strings,
    llmCapability: meta.llmCapability,
  };
  fs.writeFileSync(filePath, `${JSON.stringify(out, null, 2)}\n`, 'utf8');
  console.log('merged', locale);
}
