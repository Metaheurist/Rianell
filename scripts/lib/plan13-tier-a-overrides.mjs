/** Plan 13 i18n - Tier A overrides for research pool keys. */

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
  'research.pool.insights.title': 'Insights communautaires',
  'research.pool.insights.lead': 'Tendances de personnes avec une condition similaire, regroupées à partir d’au moins {kMin} contributeurs anonymes. Aucune donnée personnelle n’est jamais affichée.',
  'research.pool.insights.loading': 'Chargement des tendances…',
  'research.pool.insights.suppressed': 'Il faut au moins {kMin} contributeurs similaires avant de pouvoir afficher une tendance en toute sécurité.',
  'research.pool.insights.optInRequired': 'Activez le partage anonyme pour la recherche dans Réglages pour voir les tendances de la communauté.',
  'research.pool.insights.unavailable': 'Les insights communautaires ne sont pas disponibles pour le moment.',
  'research.pool.insight.sleepFlare': 'Parmi les contributeurs, ceux qui dorment en moyenne 7 h ou plus signalent des poussées {highPct} % des jours, contre {lowPct} % pour un sommeil plus court.',
};

const DE = {
  ...BASE,
  'research.pool.export.action': 'Meinen Beitragsverlauf exportieren',
  'research.pool.export.shareTitle': 'Rianell-Beitragsexport',
  'research.pool.insights.title': 'Forschungspool-Einblicke',
  'research.pool.insights.lead': 'So vergleichen sich Menschen mit einer ähnlichen Erkrankung - aus mindestens {kMin} anonymen Mitwirkenden. Persönliche Daten werden nie angezeigt.',
  'research.pool.insights.loading': 'Gemeinschaftstrends werden geladen…',
  'research.pool.insights.suppressed': 'Mindestens {kMin} ähnliche Mitwirkende nötig, bevor wir einen Trend sicher anzeigen können.',
  'research.pool.insights.optInRequired': 'Schalten Sie anonyme Forschungsfreigabe in den Einstellungen ein, um Gemeinschaftstrends zu sehen.',
  'research.pool.insights.unavailable': 'Gemeinschaftseinblicke sind derzeit nicht verfügbar.',
  'research.pool.insight.sleepFlare': 'Mitwirkende mit durchschnittlich 7+ Stunden Schlaf melden Schübe an {highPct} % der Tage, gegenüber {lowPct} % bei weniger Schlaf.',
};

const ES = {
  ...FR,
  'research.pool.export.action': 'Exportar mi historial de contribución',
  'research.pool.export.shareTitle': 'Exportación de contribución Rianell',
  'research.pool.insights.title': 'Insights del pool de investigación',
  'research.pool.insights.lead': 'Tendencias de personas con una condición similar, a partir de al menos {kMin} colaboradores anónimos. Nunca se muestran datos personales.',
  'research.pool.insights.loading': 'Cargando tendencias de la comunidad…',
  'research.pool.insights.suppressed': 'Necesitamos al menos {kMin} colaboradores similares antes de mostrar una tendencia con seguridad.',
  'research.pool.insights.optInRequired': 'Activa el intercambio anónimo para investigación en Ajustes para ver tendencias de la comunidad.',
  'research.pool.insight.sleepFlare': 'Entre los colaboradores, quienes duermen de media 7 h o más reportan brotes el {highPct} % de los días, frente al {lowPct} % con menos sueño.',
};

const IT = {
  ...FR,
  'research.pool.export.action': 'Esporta la mia cronologia di contributo',
  'research.pool.export.shareTitle': 'Export contributi Rianell',
  'research.pool.insights.title': 'Insight del pool di ricerca',
  'research.pool.insights.lead': 'Tendenze da persone con una condizione simile, da almeno {kMin} contributori anonimi. Nessun dato personale viene mai mostrato.',
  'research.pool.insights.loading': 'Caricamento tendenze della comunità…',
  'research.pool.insights.suppressed': 'Servono almeno {kMin} contributori simili prima di mostrare una tendenza in sicurezza.',
  'research.pool.insights.optInRequired': 'Attiva la condivisione anonima per la ricerca nelle Impostazioni per vedere le tendenze della comunità.',
  'research.pool.insight.sleepFlare': 'Tra i contributori, chi dorme in media 7 ore o più segnala riacutizzazioni il {highPct} % dei giorni, contro il {lowPct} % con meno sonno.',
};

const NL = {
  ...DE,
  'research.pool.export.action': 'Mijn bijdragegeschiedenis exporteren',
  'research.pool.export.shareTitle': 'Rianell-bijdrage-export',
  'research.pool.insights.title': 'Inzichten onderzoekspool',
  'research.pool.insight.sleepFlare': 'Bijdragers met gemiddeld 7+ uur slaap melden opflakkeringen op {highPct} % van de dagen, tegen {lowPct} % bij minder slaap.',
};

const PL = {
  ...DE,
  'research.pool.export.action': 'Eksportuj historię mojego wkładu',
  'research.pool.export.shareTitle': 'Eksport wkładu Rianell',
  'research.pool.insights.title': 'Wgląd w pulę badawczą',
  'research.pool.insight.sleepFlare': 'Wśród współtwórców osoby śpiące średnio 7+ godzin zgłaszają zaostrzenia w {highPct} % dni, w porównaniu z {lowPct} % przy krótszym śnie.',
};

const PT = {
  ...ES,
  'research.pool.export.action': 'Exportar o meu historial de contribuição',
  'research.pool.export.shareTitle': 'Exportação de contribuição Rianell',
  'research.pool.insights.title': 'Insights do pool de investigação',
  'research.pool.insight.sleepFlare': 'Entre os contribuidores, quem dorme em média 7+ horas reporta surtos em {highPct} % dos dias, contra {lowPct} % com menos sono.',
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
