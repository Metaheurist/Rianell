import React from 'react';
import { Text, View } from 'react-native';
import { useT } from '../i18n/I18nProvider';
import { useTheme } from '../theme/ThemeProvider';

export function SettingsDeveloperPane() {
  const t = useT();
  const theme = useTheme();

  return (
    <View>
      <Text style={{ color: theme.tokens.color.text, fontSize: theme.font(16), fontWeight: '600', marginBottom: 8 }}>
        {t('settings.developer.title')}
      </Text>
      <Text style={{ color: theme.tokens.color.textMuted, fontSize: theme.font(13), marginBottom: 6 }}>
        {t('settings.developer.apiKeys')}
      </Text>
      <Text style={{ color: theme.tokens.color.textMuted, fontSize: theme.font(13) }}>
        {t('settings.developer.webhooks')}
      </Text>
    </View>
  );
}
