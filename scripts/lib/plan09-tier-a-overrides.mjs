/** Plan 09 i18n — Tier A overrides for charts analytics (C1, C2, C7). */
const PLAN09_FR = {
  'charts.correlations.title': 'Corrélations de métriques',
  'charts.correlations.confidence.high': 'Confiance élevée',
  'charts.correlations.confidence.medium': 'Confiance moyenne',
  'charts.correlations.confidence.low': 'Confiance faible',
  'charts.correlations.positive': 'a tendance à augmenter avec',
  'charts.correlations.negative': 'a tendance à diminuer quand',
  'charts.flarePostMortem.title': 'Analyse post-poussée',
  'charts.flarePostMortem.window': 'Fenêtre de {days} jours autour du {date}',
  'charts.flarePostMortem.metricLine': '{label} : {before} avant → {after} après (Δ {delta})',
  'charts.forecast.section': 'Prévision',
  'charts.forecast.uncertainty': 'Humeur +{days} j : ~{value}/10 ({lower}–{upper})',
};

const PLAN09_DE = {
  'charts.correlations.title': 'Metrik-Korrelationen',
  'charts.correlations.confidence.high': 'Hohe Konfidenz',
  'charts.correlations.confidence.medium': 'Mittlere Konfidenz',
  'charts.correlations.confidence.low': 'Niedrige Konfidenz',
  'charts.correlations.positive': 'steigt tendenziell mit',
  'charts.correlations.negative': 'fällt tendenziell, wenn',
  'charts.flarePostMortem.title': 'Schub-Nachanalyse',
  'charts.flarePostMortem.window': '{days}-Tage-Fenster um {date}',
  'charts.flarePostMortem.metricLine': '{label}: {before} davor → {after} danach (Δ {delta})',
  'charts.forecast.section': 'Prognose',
  'charts.forecast.uncertainty': 'Stimmung +{days} T.: ~{value}/10 ({lower}–{upper})',
};

const PLAN09_ES = {
  'charts.correlations.title': 'Correlaciones de métricas',
  'charts.correlations.confidence.high': 'Alta confianza',
  'charts.correlations.confidence.medium': 'Confianza media',
  'charts.correlations.confidence.low': 'Baja confianza',
  'charts.correlations.positive': 'tiende a subir con',
  'charts.correlations.negative': 'tiende a bajar cuando',
  'charts.flarePostMortem.title': 'Post-mortem de brote',
  'charts.flarePostMortem.window': 'Ventana de {days} días alrededor de {date}',
  'charts.flarePostMortem.metricLine': '{label}: {before} antes → {after} después (Δ {delta})',
  'charts.forecast.section': 'Pronóstico',
  'charts.forecast.uncertainty': 'Ánimo +{days} d: ~{value}/10 ({lower}–{upper})',
};

const PLAN09_IT = {
  'charts.correlations.title': 'Correlazioni metriche',
  'charts.correlations.confidence.high': 'Alta confidenza',
  'charts.correlations.confidence.medium': 'Confidenza media',
  'charts.correlations.confidence.low': 'Bassa confidenza',
  'charts.correlations.positive': 'tende ad aumentare con',
  'charts.correlations.negative': 'tende a diminuire quando',
  'charts.flarePostMortem.title': 'Post-mortem del flare',
  'charts.flarePostMortem.window': 'Finestra di {days} giorni intorno al {date}',
  'charts.flarePostMortem.metricLine': '{label}: {before} prima → {after} dopo (Δ {delta})',
  'charts.forecast.section': 'Previsione',
  'charts.forecast.uncertainty': 'Umore +{days} g: ~{value}/10 ({lower}–{upper})',
};

const PLAN09_NL = {
  'charts.correlations.title': 'Metriekcorrelaties',
  'charts.correlations.confidence.high': 'Hoge betrouwbaarheid',
  'charts.correlations.confidence.medium': 'Gemiddelde betrouwbaarheid',
  'charts.correlations.confidence.low': 'Lage betrouwbaarheid',
  'charts.correlations.positive': 'neigt te stijgen met',
  'charts.correlations.negative': 'neigt te dalen wanneer',
  'charts.flarePostMortem.title': 'Flare-achterafanalyse',
  'charts.flarePostMortem.window': '{days}-dagenvenster rond {date}',
  'charts.flarePostMortem.metricLine': '{label}: {before} vóór → {after} na (Δ {delta})',
  'charts.forecast.section': 'Prognose',
  'charts.forecast.uncertainty': 'Stemming +{days} d: ~{value}/10 ({lower}–{upper})',
};

const PLAN09_PL = {
  'charts.correlations.title': 'Korelacje metryk',
  'charts.correlations.confidence.high': 'Wysoka pewność',
  'charts.correlations.confidence.medium': 'Średnia pewność',
  'charts.correlations.confidence.low': 'Niska pewność',
  'charts.correlations.positive': 'ma tendencję rosnąć wraz z',
  'charts.correlations.negative': 'ma tendencję spadać, gdy',
  'charts.flarePostMortem.title': 'Analiza po zaostrzeniu',
  'charts.flarePostMortem.window': 'Okno {days} dni wokół {date}',
  'charts.flarePostMortem.metricLine': '{label}: {before} przed → {after} po (Δ {delta})',
  'charts.forecast.section': 'Prognoza',
  'charts.forecast.uncertainty': 'Nastrój +{days} d: ~{value}/10 ({lower}–{upper})',
};

const PLAN09_PT = {
  'charts.correlations.title': 'Correlações de métricas',
  'charts.correlations.confidence.high': 'Alta confiança',
  'charts.correlations.confidence.medium': 'Confiança média',
  'charts.correlations.confidence.low': 'Baixa confiança',
  'charts.correlations.positive': 'tende a subir com',
  'charts.correlations.negative': 'tende a cair quando',
  'charts.flarePostMortem.title': 'Pós-mortem de crise',
  'charts.flarePostMortem.window': 'Janela de {days} dias em torno de {date}',
  'charts.flarePostMortem.metricLine': '{label}: {before} antes → {after} depois (Δ {delta})',
  'charts.forecast.section': 'Previsão',
  'charts.forecast.uncertainty': 'Humor +{days} d: ~{value}/10 ({lower}–{upper})',
};

export const PLAN09_TIER_A_OVERRIDES = {
  'fr-FR': PLAN09_FR,
  'de-DE': PLAN09_DE,
  'es-ES': PLAN09_ES,
  'it-IT': PLAN09_IT,
  'nl-NL': PLAN09_NL,
  'pl-PL': PLAN09_PL,
  'pt-BR': PLAN09_PT,
  'pt-PT': PLAN09_PT,
};
