/** Plan 13 RE4 — export bundle for personal anonymized contribution history. */

export const CONTRIBUTION_EXPORT_FORMAT = 'rianell-contribution-export-v1';

export function formatContributionExport(rows, opts = {}) {
  const list = Array.isArray(rows) ? rows : [];
  return {
    format: CONTRIBUTION_EXPORT_FORMAT,
    exportedAt: new Date().toISOString(),
    medicalCondition: opts.medicalCondition || null,
    rowCount: list.length,
    rows: list.map((row) => ({
      id: row.id ?? null,
      createdAt: row.created_at || row.createdAt || null,
      medicalCondition: row.medical_condition || row.medicalCondition || null,
      researchFacets: row.research_facets || row.researchFacets || null,
      decrypted: row.decrypted ?? null,
    })),
    retentionNote:
      'Opting out stops future uploads. Existing rows remain until you delete them from Settings or request erasure.',
  };
}
