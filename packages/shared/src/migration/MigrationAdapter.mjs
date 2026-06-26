/** Plan 25 — unified migration adapter interface. */

export class MigrationAdapter {
  static get id() {
    return 'base';
  }

  static get displayName() {
    return 'Base';
  }

  static get fileTypes() {
    return ['.csv'];
  }

  static get fieldMap() {
    return {};
  }

  static async parse(_fileContent) {
    return [];
  }
}

export function listMigrationAdapters(adapters) {
  return adapters.map((A) => ({
    id: A.id,
    displayName: A.displayName,
    fileTypes: A.fileTypes,
  }));
}

export function detectMigrationAdapter(filename, adapters) {
  const lower = String(filename || '').toLowerCase();
  return adapters.find((A) => A.fileTypes.some((ext) => lower.endsWith(ext))) || null;
}

export function detectImportConflicts(existingLogs, importedLogs) {
  const dates = new Set((existingLogs || []).map((l) => l?.date).filter(Boolean));
  return (importedLogs || []).map((entry) => ({
    entry,
    conflict: dates.has(entry.date),
  }));
}
