import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync('apps/pwa-webapp/index.html', 'utf8');
const js = readFileSync('apps/pwa-webapp/app.js', 'utf8');
const css = readFileSync('apps/pwa-webapp/styles.css', 'utf8');

test('Phase 4 advanced vitals is a closed accordion by default', () => {
  assert.match(html, /id="vitalsAdvancedDetails"/);
  assert.match(html, /class="vitals-advanced-details ui-accordion"/);
  assert.doesNotMatch(html, /id="vitalsAdvancedDetails"[^>]*\sopen\b/);
  assert.match(html, /Add Advanced Vitals \(Optional\)/);
});

test('Phase 4 symptoms split layout puts map + scales columns', () => {
  assert.match(html, /id="symptomsSplitLayout"/);
  assert.match(html, /id="symptomsScaleColumn"/);
  assert.match(html, /symptoms-split-layout__map/);
  assert.match(css, /\.symptoms-split-layout/);
  assert.match(css, /symptoms-split-layout__map/);
  assert.match(css, /order:\s*-1/);
});

test('Phase 4 targets via Goals modal; Trophy Room on Home', () => {
  assert.match(html, /id="targetSettingsPanel"/);
  assert.match(html, /id="goalsModalOverlay"/);
  assert.match(html, /id="achievementsTrophyRoom"/);
  assert.match(html, /home-trophy-room/);
  assert.match(html, /id="goalSteps"/);
  assert.match(html, /id="achievementsGrid"/);
  assert.match(html, /id="goalsAchievementsGrid"/);
  assert.match(html, /data-goal-nudge="goalSteps"/);
  assert.doesNotMatch(html, /data-settings-pane-title="AI & Goals"/);
  assert.doesNotMatch(html, /id="openTrophyRoomFromGoalsBtn"/);
  assert.equal((html.match(/id="goalSteps"/g) || []).length, 1);
  assert.equal((html.match(/id="achievementsGrid"/g) || []).length, 1);
  assert.equal((html.match(/id="goalsAchievementsGrid"/g) || []).length, 1);
  assert.equal((html.match(/id="achievementsTrophyRoom"/g) || []).length, 1);
});

test('Goals modal achievements pane renders the badge grid in-place', () => {
  assert.match(
    html,
    /data-pane-title="Achievements"[\s\S]*?id="goalsAchievementsGrid"/
  );
  assert.match(js, /function getAchievementsGridRoots/);
  assert.match(js, /goalsAchievementsGrid/);
  assert.match(js, /function buildAchievementsGridHtml/);
});

test('AI and data sharing toggles live in Settings data options, not Goals modal', () => {
  assert.match(
    html,
    /data-settings-pane-title="Data options"[\s\S]*?id="aiEnabledToggle"[\s\S]*?id="contributeAnonDataToggle"[\s\S]*?id="useOpenDataToggle"/
  );
  assert.match(html, /data-settings-pane-title="Data options"[\s\S]*?id="exportContributionHistoryBtn"/);
  assert.doesNotMatch(
    html,
    /id="goalsModalOverlay"[\s\S]*?id="aiEnabledToggle"[\s\S]*?id="targetSettingsPanel"/
  );
  assert.equal((html.match(/id="aiEnabledToggle"/g) || []).length, 1);
  assert.equal((html.match(/id="contributeAnonDataToggle"/g) || []).length, 1);
  assert.equal((html.match(/id="useOpenDataToggle"/g) || []).length, 1);
});

test('Phase 4 region severity list syncs tapped body areas', () => {
  assert.match(html, /id="symptomsRegionSeverity"/);
  assert.match(html, /id="symptomsRegionSeverityList"/);
  assert.match(
    html,
    /pain-body-title[\s\S]*?id="symptomsRegionSeverity"[\s\S]*?id="painBodyDiagram"/
  );
  assert.match(js, /function renderSymptomsRegionSeverity/);
  assert.match(js, /function setPainBodyRegionLevel/);
  assert.match(css, /\.symptoms-region-severity/);
});

test('Phase 4 openGoalsModal opens Goals modal with in-modal achievements', () => {
  assert.match(js, /function openSettingsToGoalsAndAchievements/);
  assert.match(js, /function openGoalsModal\(paneIndex\)/);
  assert.match(js, /hydrateGoalControlsFromStorage/);
  assert.match(js, /initGoalsCarouselUI/);
  assert.match(js, /goalsAchievementsGrid/);
  assert.match(js, /getAchievementsGridRoots/);
  assert.doesNotMatch(js, /if \(paneIndex === 1\) \{\s*openSettingsToGoalsAndAchievements\(1\)/);
  assert.doesNotMatch(js, /settingsCarouselGo\(aiPaneIndex\)/);
});
