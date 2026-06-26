import React from 'react';
import { Text, View } from 'react-native';
import { CONNECTOR_PROVIDERS } from '@rianell/shared';
import { SwitchRow } from './SwitchRow';
import { useT } from '../i18n/I18nProvider';
import { useTheme } from '../theme/ThemeProvider';
import type { Preferences } from '../storage/preferences';

type Props = {
  prefs: Preferences;
  onChangePrefs: (next: Preferences) => void;
};

export function SettingsConnectorsPane({ prefs, onChangePrefs }: Props) {
  const t = useT();
  const theme = useTheme();
  const enabled = prefs.healthConnectEnabled === true;

  return (
    <View>
      <Text style={{ color: theme.tokens.color.text, fontSize: theme.font(16), fontWeight: '600', marginBottom: 8 }}>
        {t('settings.connectors.title')}
      </Text>
      {Object.values(CONNECTOR_PROVIDERS).map((p) => (
        <Text key={p.id} style={{ color: theme.tokens.color.textMuted, fontSize: theme.font(12), marginBottom: 4 }}>
          {p.label}
        </Text>
      ))}
      <SwitchRow
        label={t('settings.connectors.healthConnect')}
        value={enabled}
        onValueChange={(healthConnectEnabled) => onChangePrefs({ ...prefs, healthConnectEnabled })}
      />
    </View>
  );
}
