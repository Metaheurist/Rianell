import { getPolicyDocumentsForRegion as docsFromPack } from '../privacy/getPolicyDocuments.mjs';
import { t } from '../i18n/translate.mjs';

/** Policy documents with locale-aware summaries from locale-packs when available. */
export function getPolicyDocumentsForRegionI18n(regionId, pack, localeId, catalogs) {
  const docs = docsFromPack(regionId, pack);
  if (!catalogs || !localeId) return docs;
  return docs.map((d) => {
    const titleKey = `policy.${d.id}.title`;
    const summaryKey = `policy.${d.id}.summary`;
    const title = t(titleKey, localeId, catalogs);
    const summary = t(summaryKey, localeId, catalogs);
    return {
      ...d,
      title: title !== titleKey ? title : d.title,
      summary: summary !== summaryKey ? summary : d.summary,
    };
  });
}
