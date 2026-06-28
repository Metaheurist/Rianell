/** v1.97.0, Tier A overrides for Engagement & UX keys (pl-PL, pt-PT gap close). */

const ENG_PL = {
  'gamification.milestone.5logs': 'Pięć wpisów, Twoje wzorce zaczynają się wyłaniać.',
  'gamification.milestone.10logs': '10 wpisów! AI coraz lepiej czyta Twoje wzorce.',
  'gamification.milestone.25logs': '25 wpisów. Zbudowałeś coś naprawdę wartościowego.',
  'gamification.milestone.50logs': '50 wpisów, znasz swoje ciało lepiej niż większość lekarzy.',
  'gamification.goal.goodDay': 'Dobry dzień zapisany. Twoje wzorce to rejestrują.',
  'gamification.goal.steps': 'Cel kroków osiągnięty. To coś realnego.',
  'gamification.goal.hydration': 'Cel nawodnienia osiągnięty, dobra robota.',
  'gamification.personalBest.goodDays': 'Rekord osobisty: {n} dobrych dni z rzędu.',
  'gamification.personalBest.flareFree': 'Rekord osobisty: {n} dni bez zaostrzeń.',
  'gamification.unlock.exercise': 'Śledzenie aktywności właśnie odblokowane. Zapisz, co robiłeś.',
  'gamification.unlock.medications': 'Dziennik leków jest gotowy. Utrzymuj kompletne zapisy.',
  'gamification.weeklyReview.complete': 'Przegląd tygodnia zakończony. Twoja historia zdrowia właśnie się wzbogaciła.',
  'gamification.weeklyReview.heroCard': 'Przegląd tygodnia ukończony. Twój lekarz uzna to za pomocne.',
  'goals.firstVisit.body':
    'Twoje cele mówią aplikacji, kiedy masz dobry dzień. Domyślne wartości są w porządku, dostosuj je, kiedy chcesz.',
  'goals.firstVisit.dismiss': 'Rozumiem',
  'home.welcome.pill.energy': 'Energia',
  'achievements.unlockedOf': '{unlocked} / {total} osiągnięć',
  'achievements.progressPercent': '{percent}%',
};

const ENG_PT_PT = {
  'ai.empty.warm.title': 'As suas perceções estão a caminho',
  'ai.empty.warm.message':
    'Após alguns registos, a sua IA começará a ligar pontos que pode não ver.',
  'ai.preview.label2': 'Análise de desencadeadores',
  'ai.preview.label3': 'O que discutir na próxima consulta',
  'ai.preview.unlock': 'A sua primeira perceção aparece após 3 registos',
  'charts.empty.warm.title': 'Os seus padrões estão à espera',
  'charts.empty.warm.message': 'Registe alguns dias e as suas tendências ganharão forma aqui.',
  'gamification.milestone.5logs': 'Cinco registos, os seus padrões começam a tomar forma.',
  'gamification.milestone.10logs': '10 registos! A IA está a ler melhor os seus padrões.',
  'gamification.milestone.25logs': '25 registos. Construiu algo genuinamente valioso.',
  'gamification.milestone.50logs': '50 registos, conhece o seu corpo melhor do que a maioria dos médicos.',
  'gamification.goal.goodDay': 'Bom dia registado. Os seus padrões estão a registá-lo.',
  'gamification.goal.steps': 'Meta de passos atingida. Isso é real.',
  'gamification.goal.hydration': 'Meta de hidratação atingida, muito bem.',
  'gamification.personalBest.goodDays': 'Recorde pessoal: {n} bons dias seguidos.',
  'gamification.personalBest.flareFree': 'Recorde pessoal: {n} dias sem surtos.',
  'gamification.unlock.exercise': 'Registo de exercício desbloqueado. Registe o que tem feito.',
  'gamification.unlock.medications': 'Registo de medicamentos pronto. Mantenha os registos completos.',
  'gamification.weeklyReview.complete':
    'Revisão semanal concluída. A sua história de saúde ficou mais rica.',
  'gamification.weeklyReview.heroCard':
    'Revisão semanal concluída. O seu médico achará isto útil.',
  'goals.firstVisit.body':
    'As suas metas dizem à app quando está a ter um bom dia. Os valores predefinidos funcionam bem, ajuste quando quiser.',
  'goals.firstVisit.dismiss': 'Entendi',
  'home.welcome.title': 'Bem-vindo ao Rianell',
  'home.welcome.body':
    'Acompanhe como {condition} afeta o seu dia a dia. Pequenos registos diários revelam padrões que o seu médico valorizará.',
  'home.discover.mood': 'Como ajuda o registo de humor?',
  'home.discover.goals': 'Definir as minhas primeiras metas de saúde',
  'home.discover.ai': 'O que pode mostrar a análise de IA?',
  'home.discover.mood.info':
    'A sua pontuação de humor liga-se ao sono, fadiga e dias de surto. Registar leva 10 segundos.',
  'home.discover.mood.cta': 'Experimentar um check-in',
  'home.discover.ai.info':
    'Após alguns registos, a sua IA deteta padrões que pode não ver, como quais dias tendem a ser mais difíceis e porquê.',
  'logs.empty.warm.title': 'A sua história de saúde começa aqui',
  'logs.empty.warm.message':
    'Cada registo ajuda a ver o que afeta como se sente. Sem pressão, uma nota rápida chega.',
  'logs.empty.warm.cta': 'Adicionar o registo de hoje',
  'mood.empty.warm.title': 'A sua história de humor constrói-se aqui',
  'mood.empty.warm.message':
    'Cada check-in ajuda a ver padrões em como se sente. Manhã, meio-dia ou noite, o que funcionar para si.',
  'settings.chapter.gettingStarted': 'Primeiros passos',
  'settings.chapter.customise': 'Personalizar',
  'settings.chapter.advanced': 'Avançado',
  'settings.setup.progress': 'Configuração {done}/{total} concluída',
  'achievements.unlockedOf': '{unlocked} / {total} conquistas',
  'achievements.progressPercent': '{percent}%',
};

export const ENGAGEMENT_TIER_A_OVERRIDES = {
  'pl-PL': ENG_PL,
  'pt-PT': ENG_PT_PT,
};
