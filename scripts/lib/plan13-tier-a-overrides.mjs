/** Plan 13 i18n — Tier A overrides for research pool keys. */

const BASE = {
  'research.pool.export.action': null,
  'research.pool.export.shareTitle': null,
  'research.pool.insights.title': null,
  'research.pool.insights.lead': null,
  'research.pool.insights.loading': null,
  'research.pool.insights.suppressed': null,
  'research.pool.insights.optInRequired': null,
  'research.pool.insights.unavailable': null,
  'research.pool.insight.sleepFlare': null,
};

const FR = {
  ...BASE,
  'research.pool.export.action': 'Exporter mon historique de contribution',
  'research.pool.export.shareTitle': 'Export de contribution Rianell',
  'research.pool.insights.title': 'Insights du pool de recherche',
  'research.pool.insights.lead': 'Tendances k-anonymisées des contributeurs avec votre condition (k minimum={kMin}). Jamais d’individus.',
  'research.pool.insights.loading': 'Chargement des insights…',
  'research.pool.insights.suppressed': 'Pas assez de contributeurs pour un motif sûr (k≥{kMin}).',
  'research.pool.insights.optInRequired': 'Activez le pool anonymisé pour voir les insights agrégés.',
  'research.pool.insights.unavailable': 'Insights indisponibles pour le moment.',
  'research.pool.insight.sleepFlare': 'Les contributeurs avec ≥7h de sommeil signalent des poussées {highPct}% des jours vs {lowPct}% pour moins de sommeil (k≥{kMin}).',
};

const DE = {
  ...BASE,
  'research.pool.export.action': 'Meinen Beitragsverlauf exportieren',
  'research.pool.export.shareTitle': 'Rianell-Beitragsexport',
  'research.pool.insights.title': 'Forschungspool-Einblicke',
  'research.pool.insights.lead': 'K-anonymisierte Muster von Mitwirkenden mit Ihrer Erkrankung (Mindest-k={kMin}). Keine Einzelpersonen.',
  'research.pool.insights.loading': 'Pool-Einblicke werden geladen…',
  'research.pool.insights.suppressed': 'Noch zu wenige Mitwirkende für ein sicheres Muster (k≥{kMin}).',
  'research.pool.insights.optInRequired': 'Aktivieren Sie den anonymen Pool für aggregierte Einblicke.',
  'research.pool.insights.unavailable': 'Pool-Einblicke derzeit nicht verfügbar.',
  'research.pool.insight.sleepFlare': 'Mitwirkende mit ≥7h Schlaf melden Schübe an {highPct}% der Tage vs {lowPct}% bei weniger Schlaf (k≥{kMin}).',
};

const ES = {
  ...FR,
  'research.pool.export.action': 'Exportar mi historial de contribución',
  'research.pool.export.shareTitle': 'Exportación de contribución Rianell',
  'research.pool.insights.title': 'Insights del pool de investigación',
  'research.pool.insights.lead': 'Patrones k-anonimizados de contribuyentes con su condición (k mínimo={kMin}). Sin individuos.',
  'research.pool.insight.sleepFlare': 'Quienes promedian ≥7h de sueño reportan brotes el {highPct}% de los días vs {lowPct}% con menos sueño (k≥{kMin}).',
};

const IT = {
  ...FR,
  'research.pool.export.action': 'Esporta la mia cronologia di contributo',
  'research.pool.export.shareTitle': 'Export contributi Rianell',
  'research.pool.insights.title': 'Insight del pool di ricerca',
  'research.pool.insight.sleepFlare': 'Chi dorme in media ≥7h segnala riacutizzazioni il {highPct}% dei giorni vs {lowPct}% con meno sonno (k≥{kMin}).',
};

const NL = {
  ...DE,
  'research.pool.export.action': 'Mijn bijdragegeschiedenis exporteren',
  'research.pool.export.shareTitle': 'Rianell-bijdrage-export',
  'research.pool.insights.title': 'Inzichten onderzoekspool',
  'research.pool.insight.sleepFlare': 'Bijdragers met ≥7u slaap melden opflakkeringen op {highPct}% van de dagen vs {lowPct}% bij minder slaap (k≥{kMin}).',
};

const PL = {
  ...DE,
  'research.pool.export.action': 'Eksportuj historię mojego wkładu',
  'research.pool.export.shareTitle': 'Eksport wkładu Rianell',
  'research.pool.insights.title': 'Wgląd w pulę badawczą',
  'research.pool.insight.sleepFlare': 'Współtwórcy ze średnio ≥7h snu zgłaszają zaostrzenia w {highPct}% dni vs {lowPct}% przy krótszym śnie (k≥{kMin}).',
};

const PT = {
  ...ES,
  'research.pool.export.action': 'Exportar o meu historial de contribuição',
  'research.pool.export.shareTitle': 'Exportação de contribuição Rianell',
  'research.pool.insights.title': 'Insights do pool de investigação',
  'research.pool.insight.sleepFlare': 'Contribuidores com ≥7h de sono reportam surtos em {highPct}% dos dias vs {lowPct}% com menos sono (k≥{kMin}).',
};

const PT_BR = {
  ...PT,
  'research.pool.export.action': 'Exportar meu histórico de contribuição',
  'research.pool.export.shareTitle': 'Exportação de contribuição Rianell',
};

export const PLAN13_TIER_A_OVERRIDES = {
  'fr-FR': FR,
  'de-DE': DE,
  'es-ES': ES,
  'it-IT': IT,
  'nl-NL': NL,
  'pl-PL': PL,
  'pt-PT': PT,
  'pt-BR': PT_BR,
};
