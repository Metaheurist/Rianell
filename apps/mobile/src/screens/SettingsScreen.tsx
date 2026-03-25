import React from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getTeamIds } from '@rianell/tokens';
import type { AppearanceMode, Preferences } from '../storage/preferences';
import { useTheme } from '../theme/ThemeProvider';
import { speakLabel } from '../accessibility/tts';

export function SettingsScreen({
  prefs,
  onChangePrefs,
}: {
  prefs: Preferences;
  onChangePrefs: (next: Preferences) => void;
}) {
  const theme = useTheme();
  const bg = theme.tokens.color.background === 'linear-gradient(135deg, #a8e6cf 0%, #c8e6c9 25%, #e8f5e8 75%, #f1f8e9 100%)' ? '#ffffff' : theme.tokens.color.background;
  const tts = { enabled: prefs.accessibility.ttsEnabled, readModeEnabled: prefs.accessibility.ttsReadModeEnabled };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Section title="Theme">
          <Row label="Enable AI features & Goals">
            <Switch
              value={prefs.aiEnabled !== false}
              onValueChange={(on) => onChangePrefs({ ...prefs, aiEnabled: on })}
            />
          </Row>

          <Row label="Appearance mode">
            <InlineChoices
              value={prefs.appearanceMode}
              options={['system', 'dark', 'light']}
              onChange={(v) => onChangePrefs({ ...prefs, appearanceMode: v as AppearanceMode })}
              tts={tts}
            />
          </Row>

          <Row label="Team">
            <InlineChoices
              value={prefs.team}
              options={getTeamIds()}
              onChange={(v) => onChangePrefs({ ...prefs, team: v })}
              tts={tts}
            />
          </Row>
        </Section>

        <Section title="Accessibility">
          <Row label="Large text">
            <Switch
              value={prefs.accessibility.largeTextEnabled}
              onValueChange={(on) =>
                onChangePrefs({
                  ...prefs,
                  accessibility: {
                    ...prefs.accessibility,
                    largeTextEnabled: on,
                    textScale: on ? Math.max(prefs.accessibility.textScale, 1.2) : 1,
                  },
                })
              }
            />
          </Row>

          <Hint>Text scale is now applied across mobile screens via theme typography scaling.</Hint>

          <Row label="Text-to-speech (tap-to-read)">
            <Switch
              value={prefs.accessibility.ttsEnabled}
              onValueChange={(on) =>
                onChangePrefs({
                  ...prefs,
                  accessibility: { ...prefs.accessibility, ttsEnabled: on },
                })
              }
            />
          </Row>

          <Row label="Read mode (auto-read on focus)">
            <Switch
              value={prefs.accessibility.ttsReadModeEnabled}
              onValueChange={(on) =>
                onChangePrefs({
                  ...prefs,
                  accessibility: { ...prefs.accessibility, ttsReadModeEnabled: on },
                })
              }
            />
          </Row>

          <Row label="Colorblind mode">
            <InlineChoices
              value={prefs.accessibility.colorblindMode}
              options={['none', 'deuteranopia', 'protanopia', 'tritanopia', 'high-contrast']}
              onChange={(v) =>
                onChangePrefs({
                  ...prefs,
                  accessibility: { ...prefs.accessibility, colorblindMode: v },
                })
              }
              tts={tts}
            />
          </Row>
        </Section>

        <Section title="Parity notes">
          <Hint>
            This settings shell is the first step toward web ↔ Expo parity. Next we’ll add the rest of the settings
            modules and start porting screens.
          </Hint>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { fontSize: theme.font(18) }]}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { fontSize: theme.font(15) }]}>{label}</Text>
      <View style={styles.rowRight}>{children}</View>
    </View>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  return <Text style={[styles.hint, { fontSize: theme.font(13) }]}>{children}</Text>;
}

function InlineChoices({
  value,
  options,
  onChange,
  tts,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
  tts: { enabled: boolean; readModeEnabled: boolean };
}) {
  const theme = useTheme();
  return (
    <View style={styles.choiceRow}>
      {options.map((o) => {
        const active = o === value;
        return (
          <Pressable
            key={o}
            onPress={() => {
              speakLabel(o, tts);
              onChange(o);
            }}
            onFocus={() => {
              if (tts.readModeEnabled) speakLabel(o, tts);
            }}
            style={[styles.choice, active && styles.choiceActive]}
            accessibilityRole="button"
            accessibilityLabel={o}
          >
            <Text style={[styles.choiceText, active && styles.choiceTextActive, { fontSize: theme.font(13) }]}>{o}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 16 },
  section: { borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.16)', padding: 14 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 10, color: '#fff' },
  sectionBody: { gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  rowLabel: { color: '#fff', fontSize: 15, flex: 1 },
  rowRight: { alignItems: 'flex-end' },
  hint: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: -4 },
  choiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end' },
  choice: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.12)' },
  choiceActive: { backgroundColor: 'rgba(255,255,255,0.32)' },
  choiceText: { color: '#fff', fontWeight: '600' },
  choiceTextActive: { color: '#000' },
});

