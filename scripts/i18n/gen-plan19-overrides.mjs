#!/usr/bin/env node
/** One-off generator for Plan 19 Tier A connector/developer i18n overrides. */
import fs from 'node:fs';
import path from 'node:path';

const CONNECTOR = {
  'settings.connectors.connect': {
    'pt-BR': 'Conectar', 'fr-FR': 'Connecter', 'de-DE': 'Verbinden', 'es-ES': 'Conectar',
    'it-IT': 'Connetti', 'nl-NL': 'Verbinden', 'pl-PL': 'Połącz', 'pt-PT': 'Ligar',
  },
  'settings.connectors.connected': {
    'pt-BR': 'Conectado', 'fr-FR': 'Connecté', 'de-DE': 'Verbunden', 'es-ES': 'Conectado',
    'it-IT': 'Connesso', 'nl-NL': 'Verbonden', 'pl-PL': 'Połączono', 'pt-PT': 'Ligado',
  },
  'settings.connectors.disconnect': {
    'pt-BR': 'Desconectar', 'fr-FR': 'Déconnecter', 'de-DE': 'Trennen', 'es-ES': 'Desconectar',
    'it-IT': 'Disconnetti', 'nl-NL': 'Verbreken', 'pl-PL': 'Rozłącz', 'pt-PT': 'Desligar',
  },
  'settings.connectors.disconnected': {
    'pt-BR': 'Desconectado.', 'fr-FR': 'Déconnecté.', 'de-DE': 'Getrennt.', 'es-ES': 'Desconectado.',
    'it-IT': 'Disconnesso.', 'nl-NL': 'Verbroken.', 'pl-PL': 'Rozłączono.', 'pt-PT': 'Desligado.',
  },
  'settings.connectors.syncNow': {
    'pt-BR': 'Sincronizar agora', 'fr-FR': 'Synchroniser', 'de-DE': 'Jetzt synchronisieren', 'es-ES': 'Sincronizar ahora',
    'it-IT': 'Sincronizza ora', 'nl-NL': 'Nu synchroniseren', 'pl-PL': 'Synchronizuj teraz', 'pt-PT': 'Sincronizar agora',
  },
  'settings.connectors.lastSync': {
    'pt-BR': 'Última sincronização: {time}', 'fr-FR': 'Dernière synchro : {time}', 'de-DE': 'Zuletzt synchronisiert: {time}', 'es-ES': 'Última sincronización: {time}',
    'it-IT': 'Ultima sincronizzazione: {time}', 'nl-NL': 'Laatst gesynchroniseerd: {time}', 'pl-PL': 'Ostatnia synchronizacja: {time}', 'pt-PT': 'Última sincronização: {time}',
  },
  'settings.connectors.syncError': {
    'pt-BR': 'Falha na sincronização: {message}', 'fr-FR': 'Échec de la synchro : {message}', 'de-DE': 'Synchronisierung fehlgeschlagen: {message}', 'es-ES': 'Error de sincronización: {message}',
    'it-IT': 'Sincronizzazione non riuscita: {message}', 'nl-NL': 'Synchroniseren mislukt: {message}', 'pl-PL': 'Synchronizacja nie powiodła się: {message}', 'pt-PT': 'Falha na sincronização: {message}',
  },
  'settings.connectors.syncSuccess': {
    'pt-BR': '{count} entradas sincronizadas', 'fr-FR': '{count} entrées synchronisées', 'de-DE': '{count} Einträge synchronisiert', 'es-ES': '{count} entradas sincronizadas',
    'it-IT': '{count} voci sincronizzate', 'nl-NL': '{count} items gesynchroniseerd', 'pl-PL': 'Zsynchronizowano {count} wpisów', 'pt-PT': '{count} entradas sincronizadas',
  },
  'settings.connectors.sheetsConfig': {
    'pt-BR': 'Configurar planilha', 'fr-FR': 'Configurer la feuille', 'de-DE': 'Tabelle konfigurieren', 'es-ES': 'Configurar hoja',
    'it-IT': 'Configura foglio', 'nl-NL': 'Spreadsheet instellen', 'pl-PL': 'Skonfiguruj arkusz', 'pt-PT': 'Configurar folha',
  },
  'settings.connectors.sheetsImportRange': {
    'pt-BR': 'Intervalo de importação', 'fr-FR': 'Plage d\'import', 'de-DE': 'Importbereich', 'es-ES': 'Rango de importación',
    'it-IT': 'Intervallo importazione', 'nl-NL': 'Importbereik', 'pl-PL': 'Zakres importu', 'pt-PT': 'Intervalo de importação',
  },
  'settings.connectors.sheetsExportRange': {
    'pt-BR': 'Intervalo de exportação', 'fr-FR': 'Plage d\'export', 'de-DE': 'Exportbereich', 'es-ES': 'Rango de exportación',
    'it-IT': 'Intervallo esportazione', 'nl-NL': 'Exportbereik', 'pl-PL': 'Zakres eksportu', 'pt-PT': 'Intervalo de exportação',
  },
  'settings.connectors.sheetsSaved': {
    'pt-BR': 'Configurações da planilha guardadas.', 'fr-FR': 'Paramètres de feuille enregistrés.', 'de-DE': 'Tabelleneinstellungen gespeichert.', 'es-ES': 'Ajustes de hoja guardados.',
    'it-IT': 'Impostazioni foglio salvate.', 'nl-NL': 'Spreadsheetinstellingen opgeslagen.', 'pl-PL': 'Zapisano ustawienia arkusza.', 'pt-PT': 'Definições da folha guardadas.',
  },
  'settings.connectors.exportNow': {
    'pt-BR': 'Exportar agora', 'fr-FR': 'Exporter maintenant', 'de-DE': 'Jetzt exportieren', 'es-ES': 'Exportar ahora',
    'it-IT': 'Esporta ora', 'nl-NL': 'Nu exporteren', 'pl-PL': 'Eksportuj teraz', 'pt-PT': 'Exportar agora',
  },
  'settings.connectors.cloudRequired': {
    'pt-BR': 'Conectores exigem sincronização na nuvem (desativados no modo só local).', 'fr-FR': 'Les connecteurs nécessitent la synchro cloud (désactivés en mode local uniquement).', 'de-DE': 'Connectoren erfordern Cloud-Sync (im Nur-lokal-Modus deaktiviert).', 'es-ES': 'Los conectores requieren sincronización en la nube (desactivados en modo solo local).',
    'it-IT': 'I connettori richiedono la sincronizzazione cloud (disabilitati in modalità solo locale).', 'nl-NL': 'Connectors vereisen cloudsynchronisatie (uitgeschakeld in alleen-lokaal modus).', 'pl-PL': 'Złącza wymagają synchronizacji w chmurze (wyłączone w trybie tylko lokalnie).', 'pt-PT': 'Conectores exigem sincronização na cloud (desativados em modo só local).',
  },
  'settings.connectors.unsupported': {
    'pt-BR': 'Conector não suportado.', 'fr-FR': 'Connecteur non pris en charge.', 'de-DE': 'Connector nicht unterstützt.', 'es-ES': 'Conector no compatible.',
    'it-IT': 'Connettore non supportato.', 'nl-NL': 'Connector niet ondersteund.', 'pl-PL': 'Nieobsługiwane złącze.', 'pt-PT': 'Conector não suportado.',
  },
  'settings.connectors.sheetsInvalidUrl': {
    'pt-BR': 'Introduza um URL ou ID válido do Google Sheets.', 'fr-FR': 'Saisissez une URL ou un ID Google Sheets valide.', 'de-DE': 'Geben Sie eine gültige Google-Sheets-URL oder -ID ein.', 'es-ES': 'Introduce una URL o ID válido de Google Sheets.',
    'it-IT': 'Inserisci un URL o ID Google Sheets valido.', 'nl-NL': 'Voer een geldige Google Sheets-URL of -ID in.', 'pl-PL': 'Wprowadź prawidłowy adres URL lub ID Arkuszy Google.', 'pt-PT': 'Introduza um URL ou ID válido do Google Sheets.',
  },
  'settings.connectors.lead': {
    'pt-BR': 'Ligue apps de terceiros para importar dados automaticamente.', 'fr-FR': 'Connectez des apps tierces pour importer des données automatiquement.', 'de-DE': 'Verbinden Sie Drittanbieter-Apps, um Daten automatisch zu importieren.', 'es-ES': 'Conecta apps de terceros para importar datos automáticamente.',
    'it-IT': 'Collega app di terze parti per importare dati automaticamente.', 'nl-NL': 'Koppel apps van derden om gegevens automatisch te importeren.', 'pl-PL': 'Połącz aplikacje zewnętrzne, aby automatycznie importować dane.', 'pt-PT': 'Ligue apps de terceiros para importar dados automaticamente.',
  },
};

const DEV_PANEL = {
  'developer.panel.title': {
    'pt-BR': 'Programador e API', 'fr-FR': 'Développeur et API', 'de-DE': 'Entwickler & API', 'es-ES': 'Desarrollador y API',
    'it-IT': 'Sviluppatore e API', 'nl-NL': 'Ontwikkelaar & API', 'pl-PL': 'Deweloper i API', 'pt-PT': 'Programador e API',
  },
  'developer.panel.tabs.keys': {
    'pt-BR': 'Chaves', 'fr-FR': 'Clés', 'de-DE': 'Schlüssel', 'es-ES': 'Claves',
    'it-IT': 'Chiavi', 'nl-NL': 'Sleutels', 'pl-PL': 'Klucze', 'pt-PT': 'Chaves',
  },
  'developer.panel.tabs.webhooks': {
    'pt-BR': 'Webhooks', 'fr-FR': 'Webhooks', 'de-DE': 'Webhooks', 'es-ES': 'Webhooks',
    'it-IT': 'Webhook', 'nl-NL': 'Webhooks', 'pl-PL': 'Webhooki', 'pt-PT': 'Webhooks',
  },
  'developer.panel.tabs.data': {
    'pt-BR': 'Dados', 'fr-FR': 'Données', 'de-DE': 'Daten', 'es-ES': 'Datos',
    'it-IT': 'Dati', 'nl-NL': 'Gegevens', 'pl-PL': 'Dane', 'pt-PT': 'Dados',
  },
  'developer.panel.tabs.delivery': {
    'pt-BR': 'Registo de entrega', 'fr-FR': 'Journal de livraison', 'de-DE': 'Zustellprotokoll', 'es-ES': 'Registro de entrega',
    'it-IT': 'Registro consegne', 'nl-NL': 'Leveringslog', 'pl-PL': 'Dziennik dostaw', 'pt-PT': 'Registo de entrega',
  },
  'developer.panel.tabs.fhir': {
    'pt-BR': 'FHIR', 'fr-FR': 'FHIR', 'de-DE': 'FHIR', 'es-ES': 'FHIR',
    'it-IT': 'FHIR', 'nl-NL': 'FHIR', 'pl-PL': 'FHIR', 'pt-PT': 'FHIR',
  },
  'developer.panel.keysHint': {
    'pt-BR': 'Requer sincronização na nuvem. As chaves são mostradas uma vez ao gerar.', 'fr-FR': 'Nécessite la synchro cloud. Les clés ne sont affichées qu\'à la création.', 'de-DE': 'Erfordert Cloud-Sync. Schlüssel werden nur einmal bei Erstellung angezeigt.', 'es-ES': 'Requiere sincronización en la nube. Las claves se muestran una sola vez al generarlas.',
    'it-IT': 'Richiede sync cloud. Le chiavi vengono mostrate una sola volta alla generazione.', 'nl-NL': 'Vereist cloudsynchronisatie. Sleutels worden eenmalig getoond bij aanmaken.', 'pl-PL': 'Wymaga synchronizacji w chmurze. Klucze są pokazywane tylko raz po wygenerowaniu.', 'pt-PT': 'Requer sincronização na cloud. As chaves são mostradas uma vez ao gerar.',
  },
  'developer.panel.keyLabel': {
    'pt-BR': 'Etiqueta (opcional)', 'fr-FR': 'Libellé (facultatif)', 'de-DE': 'Bezeichnung (optional)', 'es-ES': 'Etiqueta (opcional)',
    'it-IT': 'Etichetta (opzionale)', 'nl-NL': 'Label (optioneel)', 'pl-PL': 'Etykieta (opcjonalnie)', 'pt-PT': 'Etiqueta (opcional)',
  },
  'developer.panel.keyLabelPlaceholder': {
    'pt-BR': 'A minha integração', 'fr-FR': 'Mon intégration', 'de-DE': 'Meine Integration', 'es-ES': 'Mi integración',
    'it-IT': 'La mia integrazione', 'nl-NL': 'Mijn integratie', 'pl-PL': 'Moja integracja', 'pt-PT': 'A minha integração',
  },
  'developer.panel.scopes': {
    'pt-BR': 'Âmbitos', 'fr-FR': 'Portées', 'de-DE': 'Bereiche', 'es-ES': 'Ámbitos',
    'it-IT': 'Ambiti', 'nl-NL': 'Scopes', 'pl-PL': 'Zakresy', 'pt-PT': 'Âmbitos',
  },
  'developer.panel.dataHint': {
    'pt-BR': 'Explore entradas locais recentes. Estatísticas cloud aparecem quando iniciou sessão.', 'fr-FR': 'Parcourez les entrées locales récentes. Les stats cloud apparaissent une fois connecté.', 'de-DE': 'Durchsuchen Sie lokale Einträge. Cloud-Statistiken erscheinen nach Anmeldung.', 'es-ES': 'Explora entradas locales recientes. Las estadísticas cloud aparecen al iniciar sesión.',
    'it-IT': 'Esplora le voci locali recenti. Le statistiche cloud compaiono dopo l\'accesso.', 'nl-NL': 'Bekijk recente lokale items. Cloudstatistieken verschijnen na aanmelding.', 'pl-PL': 'Przeglądaj ostatnie wpisy lokalne. Statystyki chmury po zalogowaniu.', 'pt-PT': 'Explore entradas locais recentes. Estatísticas cloud aparecem com sessão iniciada.',
  },
  'developer.panel.refreshData': {
    'pt-BR': 'Atualizar', 'fr-FR': 'Actualiser', 'de-DE': 'Aktualisieren', 'es-ES': 'Actualizar',
    'it-IT': 'Aggiorna', 'nl-NL': 'Vernieuwen', 'pl-PL': 'Odśwież', 'pt-PT': 'Atualizar',
  },
  'developer.panel.copyJson': {
    'pt-BR': 'Copiar como JSON', 'fr-FR': 'Copier en JSON', 'de-DE': 'Als JSON kopieren', 'es-ES': 'Copiar como JSON',
    'it-IT': 'Copia come JSON', 'nl-NL': 'Kopiëren als JSON', 'pl-PL': 'Kopiuj jako JSON', 'pt-PT': 'Copiar como JSON',
  },
  'developer.panel.deliveryHint': {
    'pt-BR': 'Tentativas recentes de entrega de webhooks.', 'fr-FR': 'Tentatives récentes de livraison webhook.', 'de-DE': 'Aktuelle Webhook-Zustellversuche.', 'es-ES': 'Intentos recientes de entrega de webhooks.',
    'it-IT': 'Tentativi recenti di consegna webhook.', 'nl-NL': 'Recente webhook-leverpogingen.', 'pl-PL': 'Ostatnie próby dostarczenia webhooków.', 'pt-PT': 'Tentativas recentes de entrega de webhooks.',
  },
  'developer.panel.refreshDelivery': {
    'pt-BR': 'Atualizar', 'fr-FR': 'Actualiser', 'de-DE': 'Aktualisieren', 'es-ES': 'Actualizar',
    'it-IT': 'Aggiorna', 'nl-NL': 'Vernieuwen', 'pl-PL': 'Odśwież', 'pt-PT': 'Atualizar',
  },
  'developer.panel.fhirHint': {
    'pt-BR': 'Consulte recursos FHIR R4 com a sua sessão atual.', 'fr-FR': 'Interrogez vos ressources FHIR R4 avec votre session.', 'de-DE': 'FHIR-R4-Ressourcen mit Ihrer Sitzung abfragen.', 'es-ES': 'Consulta recursos FHIR R4 con tu sesión actual.',
    'it-IT': 'Interroga le risorse FHIR R4 con la sessione corrente.', 'nl-NL': 'Bevraag FHIR R4-resources met uw sessie.', 'pl-PL': 'Odpytaj zasoby FHIR R4 w bieżącej sesji.', 'pt-PT': 'Consulte recursos FHIR R4 com a sua sessão.',
  },
  'developer.panel.fhirResource': {
    'pt-BR': 'Tipo de recurso', 'fr-FR': 'Type de ressource', 'de-DE': 'Ressourcentyp', 'es-ES': 'Tipo de recurso',
    'it-IT': 'Tipo risorsa', 'nl-NL': 'Resourcetype', 'pl-PL': 'Typ zasobu', 'pt-PT': 'Tipo de recurso',
  },
  'developer.panel.fhirCode': {
    'pt-BR': 'Código LOINC (Observation, opcional)', 'fr-FR': 'Code LOINC (Observation, optionnel)', 'de-DE': 'LOINC-Code (Observation, optional)', 'es-ES': 'Código LOINC (Observation, opcional)',
    'it-IT': 'Codice LOINC (Observation, opzionale)', 'nl-NL': 'LOINC-code (Observation, optioneel)', 'pl-PL': 'Kod LOINC (Observation, opcjonalnie)', 'pt-PT': 'Código LOINC (Observation, opcional)',
  },
  'developer.panel.runFhir': {
    'pt-BR': 'Executar consulta', 'fr-FR': 'Lancer la requête', 'de-DE': 'Abfrage starten', 'es-ES': 'Ejecutar consulta',
    'it-IT': 'Esegui query', 'nl-NL': 'Query uitvoeren', 'pl-PL': 'Uruchom zapytanie', 'pt-PT': 'Executar consulta',
  },
  'developer.panel.neverUsed': {
    'pt-BR': 'Nunca usada', 'fr-FR': 'Jamais utilisée', 'de-DE': 'Nie verwendet', 'es-ES': 'Nunca usada',
    'it-IT': 'Mai usata', 'nl-NL': 'Nooit gebruikt', 'pl-PL': 'Nigdy nie używana', 'pt-PT': 'Nunca usada',
  },
  'developer.panel.neverDelivered': {
    'pt-BR': 'Nunca entregue', 'fr-FR': 'Jamais livrée', 'de-DE': 'Nie zugestellt', 'es-ES': 'Nunca entregada',
    'it-IT': 'Mai consegnata', 'nl-NL': 'Nooit geleverd', 'pl-PL': 'Nigdy nie dostarczono', 'pt-PT': 'Nunca entregue',
  },
  'developer.panel.statsLogs': {
    'pt-BR': 'Registos recentes', 'fr-FR': 'Entrées récentes', 'de-DE': 'Aktuelle Einträge', 'es-ES': 'Registros recientes',
    'it-IT': 'Voci recenti', 'nl-NL': 'Recente logs', 'pl-PL': 'Ostatnie wpisy', 'pt-PT': 'Registos recentes',
  },
  'developer.panel.statsKeys': {
    'pt-BR': 'Chaves ativas', 'fr-FR': 'Clés actives', 'de-DE': 'Aktive Schlüssel', 'es-ES': 'Claves activas',
    'it-IT': 'Chiavi attive', 'nl-NL': 'Actieve sleutels', 'pl-PL': 'Aktywne klucze', 'pt-PT': 'Chaves ativas',
  },
  'developer.panel.statsWebhooks': {
    'pt-BR': 'Webhooks', 'fr-FR': 'Webhooks', 'de-DE': 'Webhooks', 'es-ES': 'Webhooks',
    'it-IT': 'Webhook', 'nl-NL': 'Webhooks', 'pl-PL': 'Webhooki', 'pt-PT': 'Webhooks',
  },
};

const COMMON = {
  'common.hard': {
    'pt-BR': 'Duro', 'fr-FR': 'Dur', 'de-DE': 'Hart', 'es-ES': 'Duro',
    'it-IT': 'Duro', 'nl-NL': 'Hard', 'pl-PL': 'Twardy', 'pt-PT': 'Duro',
  },
  'common.loose': {
    'pt-BR': 'Solto', 'fr-FR': 'Liquide', 'de-DE': 'Weich', 'es-ES': 'Blando',
    'it-IT': 'Molliccio', 'nl-NL': 'Los', 'pl-PL': 'Luźny', 'pt-PT': 'Solto',
  },
  'common.google.sheets.url.or.id': {
    'pt-BR': 'URL ou ID do Google Sheets', 'fr-FR': 'URL ou ID Google Sheets', 'de-DE': 'Google-Sheets-URL oder -ID', 'es-ES': 'URL o ID de Google Sheets',
    'it-IT': 'URL o ID Google Sheets', 'nl-NL': 'Google Sheets-URL of -ID', 'pl-PL': 'URL lub ID Arkuszy Google', 'pt-PT': 'URL ou ID do Google Sheets',
  },
  'common.export.appends.rows.to.your.sheet.max.90': {
    'pt-BR': 'A exportação adiciona linhas à folha (máx. 90 dias / 500 linhas por sincronização).', 'fr-FR': 'L\'export ajoute des lignes à votre feuille (max. 90 jours / 500 lignes par synchro).', 'de-DE': 'Export hängt Zeilen an (max. 90 Tage / 500 Zeilen pro Sync).', 'es-ES': 'La exportación añade filas (máx. 90 días / 500 filas por sincronización).',
    'it-IT': 'L\'esportazione aggiunge righe (max 90 giorni / 500 righe per sync).', 'nl-NL': 'Export voegt rijen toe (max. 90 dagen / 500 rijen per sync).', 'pl-PL': 'Eksport dodaje wiersze (maks. 90 dni / 500 wierszy na sync).', 'pt-PT': 'A exportação acrescenta linhas (máx. 90 dias / 500 linhas por sync).',
  },
  'common.developer.panel.sections': {
    'pt-BR': 'Secções do painel de programador', 'fr-FR': 'Sections du panneau développeur', 'de-DE': 'Entwicklerpanel-Bereiche', 'es-ES': 'Secciones del panel de desarrollador',
    'it-IT': 'Sezioni pannello sviluppatore', 'nl-NL': 'Ontwikkelaarspaneel-secties', 'pl-PL': 'Sekcje panelu dewelopera', 'pt-PT': 'Secções do painel de programador',
  },
  'common.could.not.load.api.keys': {
    'pt-BR': 'Não foi possível carregar as chaves API.', 'fr-FR': 'Impossible de charger les clés API.', 'de-DE': 'API-Schlüssel konnten nicht geladen werden.', 'es-ES': 'No se pudieron cargar las claves API.',
    'it-IT': 'Impossibile caricare le chiavi API.', 'nl-NL': 'API-sleutels laden mislukt.', 'pl-PL': 'Nie udało się wczytać kluczy API.', 'pt-PT': 'Não foi possível carregar as chaves API.',
  },
  'common.no.webhooks.yet': {
    'pt-BR': 'Ainda não há webhooks.', 'fr-FR': 'Aucun webhook pour l\'instant.', 'de-DE': 'Noch keine Webhooks.', 'es-ES': 'Aún no hay webhooks.',
    'it-IT': 'Nessun webhook ancora.', 'nl-NL': 'Nog geen webhooks.', 'pl-PL': 'Brak webhooków.', 'pt-PT': 'Ainda não há webhooks.',
  },
  'common.could.not.load.webhooks': {
    'pt-BR': 'Não foi possível carregar webhooks.', 'fr-FR': 'Impossible de charger les webhooks.', 'de-DE': 'Webhooks konnten nicht geladen werden.', 'es-ES': 'No se pudieron cargar los webhooks.',
    'it-IT': 'Impossibile caricare i webhook.', 'nl-NL': 'Webhooks laden mislukt.', 'pl-PL': 'Nie udało się wczytać webhooków.', 'pt-PT': 'Não foi possível carregar webhooks.',
  },
  'common.no.log.entries.to.show': {
    'pt-BR': 'Sem entradas de registo para mostrar.', 'fr-FR': 'Aucune entrée de journal à afficher.', 'de-DE': 'Keine Einträge anzuzeigen.', 'es-ES': 'No hay entradas de registro que mostrar.',
    'it-IT': 'Nessuna voce di registro da mostrare.', 'nl-NL': 'Geen logitems om te tonen.', 'pl-PL': 'Brak wpisów do wyświetlenia.', 'pt-PT': 'Sem entradas de registo para mostrar.',
  },
  'common.no.deliveries.yet': {
    'pt-BR': 'Ainda não há entregas.', 'fr-FR': 'Aucune livraison pour l\'instant.', 'de-DE': 'Noch keine Zustellungen.', 'es-ES': 'Aún no hay entregas.',
    'it-IT': 'Nessuna consegna ancora.', 'nl-NL': 'Nog geen leveringen.', 'pl-PL': 'Brak dostaw.', 'pt-PT': 'Ainda não há entregas.',
  },
  'common.could.not.load.delivery.log': {
    'pt-BR': 'Não foi possível carregar o registo de entregas.', 'fr-FR': 'Impossible de charger le journal de livraison.', 'de-DE': 'Zustellprotokoll konnte nicht geladen werden.', 'es-ES': 'No se pudo cargar el registro de entregas.',
    'it-IT': 'Impossibile caricare il registro consegne.', 'nl-NL': 'Leveringslog laden mislukt.', 'pl-PL': 'Nie udało się wczytać dziennika dostaw.', 'pt-PT': 'Não foi possível carregar o registo de entregas.',
  },
  'common.sign.in.with.cloud.sync.to.query.fhir': {
    'pt-BR': 'Inicie sessão com sincronização na nuvem para consultar FHIR.', 'fr-FR': 'Connectez-vous avec la synchro cloud pour interroger FHIR.', 'de-DE': 'Melden Sie sich mit Cloud-Sync an, um FHIR abzufragen.', 'es-ES': 'Inicia sesión con sincronización en la nube para consultar FHIR.',
    'it-IT': 'Accedi con sync cloud per interrogare FHIR.', 'nl-NL': 'Meld u aan met cloudsynchronisatie om FHIR te bevragen.', 'pl-PL': 'Zaloguj się z synchronizacją w chmurze, aby odpytać FHIR.', 'pt-PT': 'Inicie sessão com cloud sync para consultar FHIR.',
  },
  'common.supabase.project.url.not.configured': {
    'pt-BR': 'URL do projeto Supabase não configurado.', 'fr-FR': 'URL du projet Supabase non configurée.', 'de-DE': 'Supabase-Projekt-URL nicht konfiguriert.', 'es-ES': 'URL del proyecto Supabase no configurada.',
    'it-IT': 'URL progetto Supabase non configurato.', 'nl-NL': 'Supabase-project-URL niet geconfigureerd.', 'pl-PL': 'Nie skonfigurowano adresu URL projektu Supabase.', 'pt-PT': 'URL do projeto Supabase não configurado.',
  },
  'common.fhir.query.failed.message': {
    'pt-BR': 'Consulta FHIR falhou: {message}', 'fr-FR': 'Échec de la requête FHIR : {message}', 'de-DE': 'FHIR-Abfrage fehlgeschlagen: {message}', 'es-ES': 'Consulta FHIR fallida: {message}',
    'it-IT': 'Query FHIR non riuscita: {message}', 'nl-NL': 'FHIR-query mislukt: {message}', 'pl-PL': 'Zapytanie FHIR nie powiodło się: {message}', 'pt-PT': 'Consulta FHIR falhou: {message}',
  },
};

const locales = ['pt-BR', 'fr-FR', 'de-DE', 'es-ES', 'it-IT', 'nl-NL', 'pl-PL', 'pt-PT'];
const allMaps = { ...CONNECTOR, ...DEV_PANEL, ...COMMON };
const out = {};
for (const locale of locales) {
  out[locale] = {};
  for (const [key, byLocale] of Object.entries(allMaps)) {
    if (byLocale[locale]) out[locale][key] = byLocale[locale];
  }
}

const fileBody = `/** Plan 19 connectors + developer panel Tier A overrides. */
export const PLAN19_TIER_A_OVERRIDES = ${JSON.stringify(out, null, 2)};
`;
fs.writeFileSync(path.join(process.cwd(), 'scripts/lib/plan19-tier-a-overrides.mjs'), fileBody);
console.log('wrote plan19 overrides', Object.keys(out['de-DE']).length, 'keys per locale');
