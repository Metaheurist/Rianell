import React from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { CONNECTOR_PROVIDERS } from '@rianell/shared';
import { useT } from '../i18n/I18nProvider';
import { useTheme } from '../theme/ThemeProvider';
import type { Preferences } from '../storage/preferences';

type Props = {
  prefs: Preferences;
  onChangePrefs: (next: Preferences) => void;
};

export function SettingsConnectorsPane({ prefs, onChangePrefs }: Props) {
  const { t } = useT();
  const theme = useTheme();
  const enabled = prefs.healthConnectEnabled === true;

  return (
    <View style={styles.wrap}>
      <Text style={[styles.heading, { color: theme.tokens.color.textPrimary }]}>
        {t('settings.connectors.title')}
      </Text>
      {Object.values(CONNECTOR_PROVIDERS).map((p) => (
        <Text key={p.id} style={{ color: theme.tokens.color.textMuted, fontSize: 12, marginBottom: 4 }}>
          {p.label}
        </Text>
      ))}
      <View style={styles.row}>
        <Text style={[styles.rowLabel, { color: theme.tokens.color.textPrimary }]}>
          {t('settings.connectors.healthConnect')}
        </Text>
        <Switch
          value={enabled}
          onValueChange={(healthConnectEnabled: boolean) =>
            onChangePrefs({ ...prefs, healthConnectEnabled })
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 8, marginBottom: 16 },
  heading: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 6 },
  rowLabel: { flex: 1, fontSize: 14, paddingRight: 8 },
});
