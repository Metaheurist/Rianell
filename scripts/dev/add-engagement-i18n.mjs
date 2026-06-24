import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const newKeys = {
  'home.welcome.title': 'Welcome to Rianell',
  'home.welcome.body':
    'Track how {condition} affects your daily life. Small daily entries reveal patterns your doctor will find valuable.',
  'home.discover.mood': 'How does mood tracking help?',
  'home.discover.goals': 'Set my first health goals',
  'home.discover.ai': 'What can AI analysis show me?',
  'home.discover.mood.info':
    'Your mood score connects to sleep, fatigue, and flare days. Tracking it takes 10 seconds.',
  'home.discover.mood.cta': 'Try a check-in',
  'home.discover.ai.info':
    'After a few entries, your AI spots patterns you might miss — like which days tend to be harder and why.',
  'home.firstLog.celebration':
    'Your first entry is saved. Come back tomorrow — two entries start showing patterns.',
  'home.streak.graceDay': "One missed day won't break this. Tap + to keep it going.",
  'home.streak.grace':
    'Life gets in the way sometimes. Pick up where you left off — your data is still here.',
  'home.checkin.saved.toast': 'Check-in saved',
  'logs.empty.warm.title': 'Your health story starts here',
  'logs.empty.warm.message':
    'Each entry helps spot what affects how you feel. No pressure — a quick note is enough.',
  'logs.empty.warm.cta': "Add today's entry",
  'charts.empty.warm.title': 'Your patterns are waiting',
  'charts.empty.warm.message': 'Log a few days and your trends will take shape here.',
  'charts.empty.preview.a11y': 'Placeholder chart preview',
  'ai.empty.warm.title': 'Insights are on their way',
  'ai.empty.warm.message':
    'After a few entries, your AI will start connecting dots you might miss.',
  'ai.preview.label1': 'Energy & sleep pattern',
  'ai.preview.label2': 'Trigger analysis',
  'ai.preview.label3': 'What to discuss at your next appointment',
  'ai.preview.unlock': 'Your first insight appears after 3 entries',
  'mood.empty.warm.title': 'Your mood story builds here',
  'mood.empty.warm.message':
    'Each check-in helps spot patterns in how you feel. Morning, midday, or evening — whatever works for you.',
  'mood.screening.whatIsThis':
    'These are validated wellbeing questions (PHQ-2 / GAD-2) used worldwide. They help you notice patterns — not diagnose. Your answers stay on your device.',
  'mood.screening.notDiagnosis':
    'This is not a clinical diagnosis. If you have concerns, please speak with your doctor or a mental health professional.',
  'weeklyReview.empty.warm.title': 'Building your review',
  'weeklyReview.correlations.empty.warm':
    'Log a few more days and patterns between your symptoms and habits will appear here.',
  'weeklyReview.digest.empty.warm':
    'Your weekly digest needs at least 7 days with mood, sleep, and fatigue entries.',
  'settings.chapter.gettingStarted': 'Getting started',
  'settings.chapter.customise': 'Customise',
  'settings.chapter.advanced': 'Advanced',
  'settings.setup.progress': 'Setup {done}/{total} complete',
  'settings.ai.inlineHint': 'Runs entirely on your device. No data is sent to any server.',
  'settings.performance.modelHint':
    "Controls AI quality vs. speed. 'Small' works well on most phones.",
  'settings.anon.inlineHint':
    'Only aggregate patterns are shared — never your individual entries.',
  'goals.firstVisit.body':
    "Your targets tell the app when you're having a good day. The defaults work fine — adjust whenever you like.",
  'goals.firstVisit.dismiss': 'Got it',
  'goals.onTrack': 'On track',
  'achievements.unlockedOf': '{unlocked} / {total} Achievements',
  'gamification.milestone.5logs':
    'Five entries in — your patterns are starting to take shape.',
  'gamification.milestone.10logs':
    '10 entries! The AI is getting better at reading your patterns.',
  'gamification.milestone.25logs': "25 entries. You've built something genuinely valuable here.",
  'gamification.milestone.50logs':
    '50 entries — you know your body better than most doctors will.',
  'gamification.goal.goodDay': 'Good day logged. Your patterns are recording it.',
  'gamification.goal.steps': "Steps goal reached. That's real.",
  'gamification.goal.hydration': 'Hydration goal met — well done.',
  'gamification.goal.generic': 'Goal reached today.',
  'gamification.weeklyReview.complete':
    'Weekly review done. Your health story just got richer.',
  'gamification.weeklyReview.heroCard':
    'Weekly review complete. Your doctor will find this useful.',
  'gamification.unlock.food': 'Food logging is now available! Add what you ate today.',
  'gamification.unlock.exercise':
    "Exercise tracking just unlocked. Log what you've been doing.",
  'gamification.unlock.medications':
    'Medication logging is ready. Keep your records complete.',
  'gamification.personalBest.goodDays': 'Personal best: {n} good days in a row.',
  'gamification.personalBest.flareFree': 'Personal best: {n} days flare-free.',
  'home.welcome.pill.sleep': 'Sleep',
  'home.welcome.pill.mood': 'Mood',
  'home.welcome.pill.energy': 'Energy',
};

const files = [
  'i18n-packs/locale-packs/v1/en-GB.json',
  'i18n-packs/locale-packs/v1/en-US.json',
  'i18n-packs/locale-packs/v1/en-AU.json',
  'apps/rn-app/i18n-packs/locale-packs/v1/en-GB.json',
  'apps/rn-app/i18n-packs/locale-packs/v1/en-US.json',
  'apps/rn-app/i18n-packs/locale-packs/v1/en-AU.json',
  'apps/pwa-webapp/i18n-packs/locale-packs/v1/en-GB.json',
  'apps/pwa-webapp/i18n-packs/locale-packs/v1/en-US.json',
  'apps/pwa-webapp/i18n-packs/locale-packs/v1/en-AU.json',
];

for (const rel of files) {
  const file = path.join(root, rel);
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  let added = 0;
  for (const [k, v] of Object.entries(newKeys)) {
    if (!data.strings[k]) {
      data.strings[k] = v;
      added++;
    }
  }
  const sorted = Object.keys(data.strings)
    .sort()
    .reduce((o, k) => {
      o[k] = data.strings[k];
      return o;
    }, {});
  data.strings = sorted;
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
  console.log(`${rel}: added ${added}`);
}
