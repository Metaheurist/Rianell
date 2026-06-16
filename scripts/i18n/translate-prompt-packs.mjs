#!/usr/bin/env node
/** Apply translated prompt-pack strings for Tier A locales (LC-17). */
import fs from 'node:fs';
import path from 'node:path';
import { SHIPPED_LOCALES } from '../../packages/shared/src/i18n/locales.mjs';
import { canonicalPromptPacksDir } from '../../packages/shared/src/i18n/packPaths.mjs';

const root = process.cwd();
const dir = canonicalPromptPacksDir(root);
const en = JSON.parse(fs.readFileSync(path.join(dir, 'en-GB.json'), 'utf8'));

const PROMPT_OVERRIDES = {
  'fr-FR': {
    label: 'Français',
    'motd.system':
      'Tu écris une courte citation simple sur la vie saine pour une appli de suivi santé. Sujets : sommeil, eau, mouvement doux, repos, air frais, alimentation équilibrée ou gestion du stress. Mots courants. Max 18 mots. Pas de noms. Pas de conseil médical. Pas de guillemets. Réponds uniquement par la phrase.',
    'motd.user': 'Écris une citation sur un mode de vie sain.',
    'summary.system':
      'Tu résumes les données de suivi santé pour le patient en exactement 2 phrases courtes. Utilise uniquement les données fournies. Mentionne 1 à 2 constats précis. Sois clair et encourageant. Réponds uniquement par le résumé.',
    'suggest.system':
      'Tu écris une courte phrase pour une note de journal quotidien. Compare aujourd’hui à la moyenne récente. Utilise uniquement les données fournies. Réponds uniquement par la phrase.',
    'homeQuestion.system':
      'Tu réponds à une question précise de suivi santé en utilisant uniquement les données fournies. Écris 3 à 5 phrases courtes en langage simple. Pas de diagnostic ni d’ordre médical. Sois encourageant. Réponds uniquement par la réponse.',
    'context.improving': 'En amélioration : {metrics}.',
    'context.worsening': 'En dégradation : {metrics}.',
    'context.stable': 'Stable : {metrics}.',
    'context.dataLine': '{dayCount} jour(s) de données.',
    'context.flares': 'Poussées : {count} jour(s).',
    'context.topStressor': 'Facteur de stress principal : {name}{pct}.',
  },
  'de-DE': {
    label: 'Deutsch',
    'motd.system':
      'Du schreibst ein kurzes, einfaches Zitat über gesundes Leben für eine Gesundheits-App. Themen: Schlaf, Wasser, sanfte Bewegung, Ruhe, frische Luft, ausgewogene Ernährung oder Stressabbau. Alltagssprache. Max. 18 Wörter. Keine Namen. Keine medizinischen Ratschläge. Keine Anführungszeichen. Antworte nur mit dem Zitat.',
    'motd.user': 'Schreibe ein Zitat zu einem gesunden Lebensstil.',
    'summary.system':
      'Du fasst Gesundheitsdaten für den Nutzer in genau 2 kurzen Sätzen zusammen. Nutze nur die bereitgestellten Daten. Nenne 1–2 konkrete Befunde. Sei klar und ermutigend. Antworte nur mit dem Text.',
    'suggest.system':
      'Du schreibst einen kurzen Satz für eine Tagesnotiz. Vergleiche heute mit dem jüngsten Durchschnitt. Nutze nur die bereitgestellten Daten. Antworte nur mit dem Satz.',
    'homeQuestion.system':
      'Du beantwortest eine konkrete Gesundheitsfrage nur mit den bereitgestellten Daten. Schreibe 3–5 kurze Sätze in einfacher Sprache. Keine Diagnose oder medizinischen Anweisungen. Sei ermutigend. Antworte nur mit der Antwort.',
    'context.improving': 'Verbesserung: {metrics}.',
    'context.worsening': 'Verschlechterung: {metrics}.',
    'context.stable': 'Stabil: {metrics}.',
    'context.dataLine': '{dayCount} Tag(e) mit Daten.',
    'context.flares': 'Schübe: {count} Tag(e).',
    'context.topStressor': 'Hauptstressfaktor: {name}{pct}.',
  },
  'es-ES': {
    label: 'Español',
    'motd.system':
      'Escribes una cita breve y sencilla sobre vida saludable para una app de seguimiento. Temas: sueño, agua, movimiento suave, descanso, aire fresco, comida equilibrada o alivio del estrés. Palabras cotidianas. Máx. 18 palabras. Sin nombres. Sin consejo médico. Sin comillas. Responde solo con la frase.',
    'motd.user': 'Escribe una cita sobre estilo de vida saludable.',
    'summary.system':
      'Resumes datos de salud para el usuario en exactamente 2 frases cortas. Usa solo los datos proporcionados. Menciona 1–2 hallazgos concretos. Sé claro y alentador. Responde solo con el resumen.',
    'suggest.system':
      'Escribes una frase corta para una nota diaria. Compara hoy con el promedio reciente. Usa solo los datos proporcionados. Responde solo con la frase.',
    'homeQuestion.system':
      'Respondes una pregunta concreta de salud usando solo los datos proporcionados. Escribe 3–5 frases cortas en lenguaje sencillo. Sin diagnóstico ni órdenes médicas. Sé alentador. Responde solo con la respuesta.',
    'context.improving': 'Mejorando: {metrics}.',
    'context.worsening': 'Empeorando: {metrics}.',
    'context.stable': 'Estable: {metrics}.',
    'context.dataLine': '{dayCount} día(s) de datos.',
    'context.flares': 'Brotes: {count} día(s).',
    'context.topStressor': 'Factor de estrés principal: {name}{pct}.',
  },
  'it-IT': {
    label: 'Italiano',
    'motd.system':
      'Scrivi una breve citazione semplice sulla vita sana per un’app di monitoraggio. Argomenti: sonno, acqua, movimento leggero, riposo, aria fresca, cibo equilibrato o sollievo dallo stress. Parole quotidiane. Max 18 parole. Niente nomi. Niente consigli medici. Niente virgolette. Rispondi solo con la frase.',
    'motd.user': 'Scrivi una citazione su uno stile di vita sano.',
    'summary.system':
      'Riassumi i dati di salute per l’utente in esattamente 2 frasi brevi. Usa solo i dati forniti. Menziona 1–2 risultati specifici. Sii chiaro e incoraggiante. Rispondi solo con il riepilogo.',
    'suggest.system':
      'Scrivi una frase breve per una nota giornaliera. Confronta oggi con la media recente. Usa solo i dati forniti. Rispondi solo con la frase.',
    'homeQuestion.system':
      'Rispondi a una domanda specifica usando solo i dati forniti. Scrivi 3–5 frasi brevi in linguaggio semplice. Niente diagnosi o ordini medici. Sii incoraggiante. Rispondi solo con la risposta.',
    'context.improving': 'In miglioramento: {metrics}.',
    'context.worsening': 'In peggioramento: {metrics}.',
    'context.stable': 'Stabile: {metrics}.',
    'context.dataLine': '{dayCount} giorno/i di dati.',
    'context.flares': 'Riaccutizzazioni: {count} giorno/i.',
    'context.topStressor': 'Fattore di stress principale: {name}{pct}.',
  },
  'nl-NL': {
    label: 'Nederlands',
    'motd.system':
      'Je schrijft één kort, eenvoudig citaat over gezond leven voor een gezondheidsapp. Onderwerpen: slaap, water, zachte beweging, rust, frisse lucht, gebalanceerd eten of stressvermindering. Alledaagse woorden. Max. 18 woorden. Geen namen. Geen medisch advies. Geen aanhalingstekens. Antwoord alleen met de zin.',
    'motd.user': 'Schrijf een citaat over een gezonde levensstijl.',
    'summary.system':
      'Je vat gezondheidsgegevens samen in precies 2 korte zinnen. Gebruik alleen de verstrekte data. Noem 1–2 specifieke bevindingen. Wees duidelijk en bemoedigend. Antwoord alleen met de samenvatting.',
    'suggest.system':
      'Je schrijft één korte zin voor een dagelijkse lognotitie. Vergelijk vandaag met het recente gemiddelde. Gebruik alleen de verstrekte data. Antwoord alleen met de zin.',
    'homeQuestion.system':
      'Je beantwoordt één specifieke gezondheidsvraag met alleen de verstrekte data. Schrijf 3–5 korte zinnen in eenvoudige taal. Geen diagnose of medische orders. Wees bemoedigend. Antwoord alleen met het antwoord.',
    'context.improving': 'Verbetering: {metrics}.',
    'context.worsening': 'Verslechtering: {metrics}.',
    'context.stable': 'Stabiel: {metrics}.',
    'context.dataLine': '{dayCount} dag(en) met gegevens.',
    'context.flares': 'Opflakkeringen: {count} dag(en).',
    'context.topStressor': 'Belangrijkste stressfactor: {name}{pct}.',
  },
  'pl-PL': {
    label: 'Polski',
    'motd.system':
      'Piszesz jedno krótkie, proste zdanie o zdrowym stylu życia dla aplikacji zdrowotnej. Tematy: sen, woda, delikatny ruch, odpoczynek, świeże powietrze, zbilansowane jedzenie lub ulga w stresie. Proste słowa. Maks. 18 słów. Bez imion. Bez porad medycznych. Bez cudzysłowów. Odpowiedz tylko zdaniem.',
    'motd.user': 'Napisz cytat o zdrowym stylu życia.',
    'summary.system':
      'Streszczasz dane zdrowotne w dokładnie 2 krótkich zdaniach. Używaj tylko podanych danych. Wspomnij 1–2 konkretne ustalenia. Bądź jasny i zachęcający. Odpowiedz tylko podsumowaniem.',
    'suggest.system':
      'Piszesz jedno krótkie zdanie do notatki dziennika. Porównaj dziś ze średnią z ostatnich dni. Używaj tylko podanych danych. Odpowiedz tylko zdaniem.',
    'homeQuestion.system':
      'Odpowiadasz na jedno konkretne pytanie zdrowotne, używając tylko podanych danych. Napisz 3–5 krótkich zdań prostym językiem. Bez diagnozy ani zaleceń medycznych. Bądź zachęcający. Odpowiedz tylko odpowiedzią.',
    'context.improving': 'Poprawa: {metrics}.',
    'context.worsening': 'Pogorszenie: {metrics}.',
    'context.stable': 'Stabilnie: {metrics}.',
    'context.dataLine': '{dayCount} dzień/dni danych.',
    'context.flares': 'Zaostrzenia: {count} dzień/dni.',
    'context.topStressor': 'Główny stresor: {name}{pct}.',
  },
  'pt-BR': {
    label: 'Português (Brasil)',
    'motd.system':
      'Você escreve uma citação curta e simples sobre vida saudável para um app de saúde. Temas: sono, água, movimento leve, descanso, ar fresco, alimentação equilibrada ou alívio do estresse. Palavras do dia a dia. Máx. 18 palavras. Sem nomes. Sem conselho médico. Sem aspas. Responda apenas com a frase.',
    'motd.user': 'Escreva uma citação sobre estilo de vida saudável.',
    'summary.system':
      'Você resume dados de saúde em exatamente 2 frases curtas. Use apenas os dados fornecidos. Mencione 1–2 achados específicos. Seja claro e encorajador. Responda apenas com o resumo.',
    'suggest.system':
      'Você escreve uma frase curta para uma nota diária. Compare hoje com a média recente. Use apenas os dados fornecidos. Responda apenas com a frase.',
    'homeQuestion.system':
      'Você responde uma pergunta específica de saúde usando apenas os dados fornecidos. Escreva 3–5 frases curtas em linguagem simples. Sem diagnóstico nem ordens médicas. Seja encorajador. Responda apenas com a resposta.',
    'context.improving': 'Melhorando: {metrics}.',
    'context.worsening': 'Piorando: {metrics}.',
    'context.stable': 'Estável: {metrics}.',
    'context.dataLine': '{dayCount} dia(s) de dados.',
    'context.flares': 'Crises: {count} dia(s).',
    'context.topStressor': 'Principal fator de estresse: {name}{pct}.',
  },
  'pt-PT': {
    label: 'Português (Portugal)',
    'motd.system':
      'Escreves uma citação curta e simples sobre vida saudável para uma app de saúde. Temas: sono, água, movimento suave, descanso, ar fresco, alimentação equilibrada ou alívio do stress. Palavras do dia a dia. Máx. 18 palavras. Sem nomes. Sem conselho médico. Sem aspas. Responde apenas com a frase.',
    'motd.user': 'Escreve uma citação sobre estilo de vida saudável.',
    'summary.system':
      'Resumes dados de saúde em exatamente 2 frases curtas. Usa apenas os dados fornecidos. Menciona 1–2 achados específicos. Sê claro e encorajador. Responde apenas com o resumo.',
    'suggest.system':
      'Escreves uma frase curta para uma nota diária. Compara hoje com a média recente. Usa apenas os dados fornecidos. Responde apenas com a frase.',
    'homeQuestion.system':
      'Respondes a uma pergunta específica de saúde usando apenas os dados fornecidos. Escreve 3–5 frases curtas em linguagem simples. Sem diagnóstico nem ordens médicas. Sê encorajador. Responde apenas com a resposta.',
    'context.improving': 'A melhorar: {metrics}.',
    'context.worsening': 'A piorar: {metrics}.',
    'context.stable': 'Estável: {metrics}.',
    'context.dataLine': '{dayCount} dia(s) de dados.',
    'context.flares': 'Surto: {count} dia(s).',
    'context.topStressor': 'Principal fator de stress: {name}{pct}.',
  },
};

for (const locale of SHIPPED_LOCALES) {
  if (locale === 'en-GB') continue;
  const overrides = PROMPT_OVERRIDES[locale];
  if (!overrides) continue;
  const filePath = path.join(dir, `${locale}.json`);
  const pack = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const strings = { ...en.strings, ...(pack.strings || {}) };
  for (const [key, value] of Object.entries(overrides)) {
    if (key === 'label') continue;
    strings[key] = value;
  }
  const out = {
    ...pack,
    locale,
    label: overrides.label || pack.label,
    llmCapability: pack.llmCapability || en.llmCapability,
    strings,
  };
  fs.writeFileSync(filePath, `${JSON.stringify(out, null, 2)}\n`, 'utf8');
  console.log(`translate-prompt-packs: updated ${locale}`);
}

console.log('translate-prompt-packs: done');
