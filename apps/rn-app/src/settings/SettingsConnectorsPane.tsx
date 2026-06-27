import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { listOAuthConnectors, OAUTH_CONNECTOR_IDS } from '@rianell/shared';
import {
  disconnectConnector,
  mergeConnectorEntries,
  startConnectorOAuth,
  syncConnector,
  watchConnectorDeepLinks,
  type ConnectorProviderId,
} from '../connectors/oauthConnect';
import { useT } from '../i18n/I18nProvider';
import { useTheme } from '../theme/ThemeProvider';
import type { Preferences } from '../storage/preferences';
import type { LogEntry } from '../storage/logs';

type Props = {
  prefs: Preferences;
  onChangePrefs: (next: Preferences) => void;
  logs: LogEntry[];
  onLogsChange: (next: LogEntry[]) => void;
  cloudReady: boolean;
};

type IntegrationRow = {
  provider: string;
  last_sync_at?: string | null;
  sync_status?: string | null;
};

export function SettingsConnectorsPane({ prefs, onChangePrefs, logs, onLogsChange, cloudReady }: Props) {
  const { t } = useT();
  const theme = useTheme();
  const enabled = prefs.healthConnectEnabled === true;
  const [integrations, setIntegrations] = useState<IntegrationRow[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!cloudReady) {
      setIntegrations([]);
      return;
    }
    const { getSupabaseClient } = await import('../cloud/supabaseClient');
    const client = getSupabaseClient();
    if (!client) return;
    const { data: userData } = await client.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) return;
    const { data } = await client
      .from('user_integrations')
      .select('provider, last_sync_at, sync_status')
      .eq('user_id', userId);
    setIntegrations((data as IntegrationRow[]) ?? []);
  }, [cloudReady]);

  useEffect(() => {
    reload().catch(() => {});
  }, [reload]);

  useEffect(() => {
    return watchConnectorDeepLinks((provider) => {
      reload()
        .then(() => runSync(provider))
        .catch(() => {});
    });
  }, [logs]);

  const isConnected = (id: string) =>
    integrations.some(
      (r) =>
        r.provider === id &&
        (r.sync_status === 'connected' ||
          r.sync_status === 'synced' ||
          r.sync_status === 'idle' ||
          r.sync_status === 'error'),
    );

  const runSync = async (provider: ConnectorProviderId) => {
    setBusy(provider);
    try {
      const result = await syncConnector(provider, { mode: 'import', logs });
      if (result.entries?.length) {
        onLogsChange(mergeConnectorEntries(logs, result.entries));
      }
      await reload();
    } finally {
      setBusy(null);
    }
  };

  const runConnect = async (provider: ConnectorProviderId) => {
    setBusy(provider);
    try {
      await startConnectorOAuth(provider);
    } finally {
      setBusy(null);
    }
  };

  const runDisconnect = async (provider: ConnectorProviderId) => {
    setBusy(provider);
    try {
      await disconnectConnector(provider);
      await reload();
    } finally {
      setBusy(null);
    }
  };

  const oauthConnectors = listOAuthConnectors();

  return (
    <View style={styles.wrap}>
      <Text style={[styles.heading, { color: theme.tokens.color.textPrimary }]}>
        {t('settings.connectors.title')}
      </Text>
      {!cloudReady ? (
        <Text style={{ color: theme.tokens.color.textMuted, fontSize: 12, marginBottom: 8 }}>
          {t('settings.connectors.cloudRequired')}
        </Text>
      ) : null}
      {oauthConnectors.map((p) => {
        const connected = isConnected(p.id);
        const row = integrations.find((r) => r.provider === p.id);
        return (
          <View key={p.id} style={styles.connectorRow}>
            <View style={styles.connectorMeta}>
              <Text style={{ color: theme.tokens.color.textPrimary, fontWeight: '600' }}>{p.label}</Text>
              {connected && row?.last_sync_at ? (
                <Text style={{ color: theme.tokens.color.textMuted, fontSize: 11 }}>
                  {t('settings.connectors.lastSync').replace('{time}', new Date(row.last_sync_at).toLocaleString())}
                </Text>
              ) : null}
            </View>
            <View style={styles.connectorActions}>
              {busy === p.id ? <ActivityIndicator size="small" /> : null}
              {connected ? (
                <>
                  <Pressable onPress={() => runSync(p.id as ConnectorProviderId)} style={styles.btn}>
                    <Text style={styles.btnText}>{t('settings.connectors.syncNow')}</Text>
                  </Pressable>
                  <Pressable onPress={() => runDisconnect(p.id as ConnectorProviderId)} style={styles.btn}>
                    <Text style={styles.btnText}>{t('settings.connectors.disconnect')}</Text>
                  </Pressable>
                </>
              ) : (
                <Pressable
                  disabled={!cloudReady || !OAUTH_CONNECTOR_IDS.includes(p.id as ConnectorProviderId)}
                  onPress={() => runConnect(p.id as ConnectorProviderId)}
                  style={styles.btn}
                >
                  <Text style={styles.btnText}>{t('settings.connectors.connect')}</Text>
                </Pressable>
              )}
            </View>
          </View>
        );
      })}
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
  connectorRow: { marginBottom: 12, gap: 6 },
  connectorMeta: { gap: 2 },
  connectorActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  btn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(46,125,80,0.15)',
  },
  btnText: { fontSize: 12, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 6 },
  rowLabel: { flex: 1, fontSize: 14, paddingRight: 8 },
});
