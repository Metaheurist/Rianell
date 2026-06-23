/** Plan 06 i18n - Tier A exact overrides for cloud sync & portability keys. */
const PLAN06_FR = {
  'settings.cloud.conflictTitle': 'Conflit de synchronisation',
  'settings.cloud.conflictBody': '{count} date(s) diffèrent entre cet appareil et le cloud. Quelle copie conserver ?',
  'settings.cloud.keepLocal': 'Garder l’appareil',
  'settings.cloud.keepCloud': 'Garder le cloud',
  'settings.cloud.autoSyncOnOpen': 'Sync auto à l’ouverture',
  'settings.export.logs.csv': 'Exporter les journaux (CSV)',
  'settings.import.logs.csv': 'Importer les journaux (CSV)',
};

const PLAN06_DE = {
  'settings.cloud.conflictTitle': 'Sync-Konflikt',
  'settings.cloud.conflictBody': '{count} Datum/Daten unterscheiden sich zwischen Gerät und Cloud. Welche Kopie soll gelten?',
  'settings.cloud.keepLocal': 'Gerät behalten',
  'settings.cloud.keepCloud': 'Cloud behalten',
  'settings.cloud.autoSyncOnOpen': 'Auto-Sync beim App-Start',
  'settings.export.logs.csv': 'Protokolle exportieren (CSV)',
  'settings.import.logs.csv': 'Protokolle importieren (CSV)',
};

const PLAN06_ES = { ...PLAN06_FR,
  'settings.cloud.conflictTitle': 'Conflicto de sincronización',
  'settings.cloud.keepLocal': 'Mantener dispositivo',
  'settings.cloud.keepCloud': 'Mantener nube',
  'settings.export.logs.csv': 'Exportar registros (CSV)',
  'settings.import.logs.csv': 'Importar registros (CSV)',
};

const PLAN06_IT = { ...PLAN06_FR,
  'settings.cloud.conflictTitle': 'Conflitto di sincronizzazione',
  'settings.export.logs.csv': 'Esporta registri (CSV)',
};

const PLAN06_NL = { ...PLAN06_DE,
  'settings.cloud.conflictTitle': 'Synchronisatieconflict',
  'settings.export.logs.csv': 'Logboeken exporteren (CSV)',
};

const PLAN06_PL = { ...PLAN06_DE,
  'settings.cloud.conflictTitle': 'Konflikt synchronizacji',
  'settings.export.logs.csv': 'Eksportuj dzienniki (CSV)',
};

const PLAN06_PT = { ...PLAN06_ES,
  'settings.export.logs.csv': 'Exportar registos (CSV)',
};

const PLAN06_PT_BR = { ...PLAN06_PT,
  'settings.export.logs.csv': 'Exportar registros (CSV)',
};

export const PLAN06_TIER_A_OVERRIDES = {
  'fr-FR': PLAN06_FR,
  'de-DE': PLAN06_DE,
  'es-ES': PLAN06_ES,
  'it-IT': PLAN06_IT,
  'nl-NL': PLAN06_NL,
  'pl-PL': PLAN06_PL,
  'pt-PT': PLAN06_PT,
  'pt-BR': PLAN06_PT_BR,
};
