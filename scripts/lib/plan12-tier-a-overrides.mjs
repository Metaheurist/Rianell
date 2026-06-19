/** Plan 12 i18n — Tier A overrides for clinician & sharing keys. */

const BASE = {
  'home.appointment.prepBusy': null,
  'ai.doctorQuestions.action': null,
  'ai.doctorQuestions.loading': null,
  'ai.doctorQuestions.section': null,
  'settings.export.qrHandoff.action': null,
  'settings.export.qrHandoff.title': null,
  'settings.export.qrHandoff.hint': null,
  'settings.export.qrHandoff.placeholder': null,
  'settings.export.qrHandoff.meta': null,
  'settings.export.qrHandoff.shareTitle': null,
  'settings.export.qrHandoff.scanHint': null,
};

const FR = {
  ...BASE,
  'home.appointment.prepBusy': 'Préparation du rapport…',
  'ai.doctorQuestions.action': 'Questions pour mon médecin',
  'ai.doctorQuestions.loading': 'Suggestion de questions…',
  'ai.doctorQuestions.section': 'Questions pour mon médecin',
  'settings.export.qrHandoff.action': 'Transfert QR (cabinet)',
  'settings.export.qrHandoff.title': 'Transfert QR (cabinet)',
  'settings.export.qrHandoff.hint': 'Code chiffré éphémère pour partage en lecture seule. Phrase secrète (8 caractères min.).',
  'settings.export.qrHandoff.placeholder': 'Phrase secrète de transfert (8 caractères min.)',
  'settings.export.qrHandoff.meta': '{count} jour(s) de journal · expire {expires}',
  'settings.export.qrHandoff.shareTitle': 'Code de transfert Rianell',
  'settings.export.qrHandoff.scanHint': 'Montrez ce QR à votre clinicien. Lecture seule, expiration automatique.',
};

const DE = {
  ...BASE,
  'home.appointment.prepBusy': 'Bericht wird erstellt…',
  'ai.doctorQuestions.action': 'Fragen für meinen Arzt',
  'ai.doctorQuestions.loading': 'Fragen werden vorgeschlagen…',
  'ai.doctorQuestions.section': 'Fragen für meinen Arzt',
  'settings.export.qrHandoff.action': 'QR-Übergabe (Praxis)',
  'settings.export.qrHandoff.title': 'QR-Übergabe (Praxis)',
  'settings.export.qrHandoff.hint': 'Kurzlebiges verschlüsseltes Code für Nur-Lesen-Freigabe. Passphrase (mind. 8 Zeichen).',
  'settings.export.qrHandoff.placeholder': 'Übergabe-Passphrase (mind. 8 Zeichen)',
  'settings.export.qrHandoff.meta': '{count} Protokolltag(e) · läuft ab {expires}',
  'settings.export.qrHandoff.shareTitle': 'Rianell-Übergabecode',
  'settings.export.qrHandoff.scanHint': 'QR dem Behandler zeigen. Nur Lesen, läuft automatisch ab.',
};

const ES = {
  ...FR,
  'home.appointment.prepBusy': 'Preparando informe…',
  'ai.doctorQuestions.action': 'Preguntas para mi médico',
  'ai.doctorQuestions.loading': 'Sugiriendo preguntas…',
  'ai.doctorQuestions.section': 'Preguntas para mi médico',
  'settings.export.qrHandoff.action': 'Transferencia QR (consulta)',
  'settings.export.qrHandoff.title': 'Transferencia QR (consulta)',
  'settings.export.qrHandoff.hint': 'Código cifrado efímero para compartir solo lectura. Frase de acceso (mín. 8 caracteres).',
  'settings.export.qrHandoff.placeholder': 'Frase de transferencia (mín. 8 caracteres)',
  'settings.export.qrHandoff.meta': '{count} día(s) de registro · caduca {expires}',
  'settings.export.qrHandoff.shareTitle': 'Código de transferencia Rianell',
  'settings.export.qrHandoff.scanHint': 'Muestra este QR a tu clínico. Solo lectura, caduca automáticamente.',
};

const IT = {
  ...FR,
  'home.appointment.prepBusy': 'Preparazione report…',
  'ai.doctorQuestions.action': 'Domande per il medico',
  'ai.doctorQuestions.loading': 'Suggerimento domande…',
  'ai.doctorQuestions.section': 'Domande per il medico',
  'settings.export.qrHandoff.action': 'Handoff QR (visita)',
  'settings.export.qrHandoff.title': 'Handoff QR (visita)',
  'settings.export.qrHandoff.hint': 'Codice crittografato effimero per condivisione in sola lettura. Passphrase (min. 8 caratteri).',
  'settings.export.qrHandoff.placeholder': 'Passphrase handoff (min. 8 caratteri)',
  'settings.export.qrHandoff.meta': '{count} giorno/i di log · scade {expires}',
  'settings.export.qrHandoff.shareTitle': 'Codice handoff Rianell',
  'settings.export.qrHandoff.scanHint': 'Mostra questo QR al clinico. Solo lettura, scade automaticamente.',
};

const NL = {
  ...DE,
  'home.appointment.prepBusy': 'Rapport wordt opgebouwd…',
  'ai.doctorQuestions.action': 'Vragen voor mijn arts',
  'ai.doctorQuestions.loading': 'Vragen worden voorgesteld…',
  'ai.doctorQuestions.section': 'Vragen voor mijn arts',
  'settings.export.qrHandoff.action': 'QR-overdracht (spreekuur)',
  'settings.export.qrHandoff.title': 'QR-overdracht (spreekuur)',
  'settings.export.qrHandoff.hint': 'Kortlopende versleutelde code voor alleen-lezen delen. Wachtwoordzin (min. 8 tekens).',
  'settings.export.qrHandoff.placeholder': 'Overdracht-wachtwoordzin (min. 8 tekens)',
  'settings.export.qrHandoff.meta': '{count} logdag(en) · verloopt {expires}',
  'settings.export.qrHandoff.shareTitle': 'Rianell-overdrachtscode',
  'settings.export.qrHandoff.scanHint': 'Toon deze QR aan uw zorgverlener. Alleen-lezen, verloopt automatisch.',
};

const PL = {
  ...DE,
  'home.appointment.prepBusy': 'Tworzenie raportu…',
  'ai.doctorQuestions.action': 'Pytania do lekarza',
  'ai.doctorQuestions.loading': 'Sugerowanie pytań…',
  'ai.doctorQuestions.section': 'Pytania do lekarza',
  'settings.export.qrHandoff.action': 'Przekazanie QR (wizyta)',
  'settings.export.qrHandoff.title': 'Przekazanie QR (wizyta)',
  'settings.export.qrHandoff.hint': 'Krótkotrwały szyfrowany kod do udostępnienia tylko do odczytu. Hasło (min. 8 znaków).',
  'settings.export.qrHandoff.placeholder': 'Hasło przekazania (min. 8 znaków)',
  'settings.export.qrHandoff.meta': '{count} dzień/dni dziennika · wygasa {expires}',
  'settings.export.qrHandoff.shareTitle': 'Kod przekazania Rianell',
  'settings.export.qrHandoff.scanHint': 'Pokaż ten QR lekarzowi. Tylko odczyt, automatyczne wygaśnięcie.',
};

const PT = {
  ...ES,
  'home.appointment.prepBusy': 'A preparar relatório…',
  'ai.doctorQuestions.action': 'Perguntas para o médico',
  'ai.doctorQuestions.loading': 'A sugerir perguntas…',
  'ai.doctorQuestions.section': 'Perguntas para o médico',
  'settings.export.qrHandoff.action': 'Transferência QR (consulta)',
  'settings.export.qrHandoff.title': 'Transferência QR (consulta)',
  'settings.export.qrHandoff.hint': 'Código encriptado efémero para partilha só de leitura. Frase-passe (mín. 8 caracteres).',
  'settings.export.qrHandoff.placeholder': 'Frase-passe de transferência (mín. 8 caracteres)',
  'settings.export.qrHandoff.meta': '{count} dia(s) de registo · expira {expires}',
  'settings.export.qrHandoff.shareTitle': 'Código de transferência Rianell',
  'settings.export.qrHandoff.scanHint': 'Mostre este QR ao clínico. Só leitura, expira automaticamente.',
};

const PT_BR = {
  ...PT,
  'home.appointment.prepBusy': 'Gerando relatório…',
  'settings.export.qrHandoff.hint': 'Código criptografado efêmero para compartilhamento somente leitura. Senha (mín. 8 caracteres).',
  'settings.export.qrHandoff.placeholder': 'Senha de transferência (mín. 8 caracteres)',
  'settings.export.qrHandoff.scanHint': 'Mostre este QR ao profissional. Somente leitura, expira automaticamente.',
};

export const PLAN12_TIER_A_OVERRIDES = {
  'fr-FR': FR,
  'de-DE': DE,
  'es-ES': ES,
  'it-IT': IT,
  'nl-NL': NL,
  'pl-PL': PL,
  'pt-PT': PT,
  'pt-BR': PT_BR,
};
