import React, { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer, DefaultTheme, DarkTheme, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../theme/ThemeProvider';
import { HomeScreen } from '../screens/HomeScreen';
import { LogsScreenRoute } from '../screens/LogsScreenRoute';
import { ChartsScreen } from '../screens/ChartsScreen';
import { AiScreen } from '../screens/AiScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { LogWizardScreen } from '../screens/LogWizardScreen';
import type { Preferences } from '../storage/preferences';
import type { ChartViewMode } from '../charts/summarizeCharts';
import { Permissions, type ReminderAction } from '../permissions/permissions';

export type RootStackParamList = {
  Tabs: undefined;
  LogWizard: undefined;
};

/** Bottom tab routes + params (Charts can open in Balance from Home header — web `header-buttons-wrap` parity). */
export type MainTabParamList = {
  Home: undefined;
  'View Logs': undefined;
  Charts: { initialView?: ChartViewMode } | undefined;
  'AI Analysis': undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

type TabBarIconProps = { focused: boolean; color: string; size?: number };

function TabBarIonicons({
  name,
  focused,
  size,
  accent,
  inactive,
}: {
  name: React.ComponentProps<typeof Ionicons>['name'];
  focused: boolean;
  size?: number;
  accent: string;
  inactive: string;
}) {
  return (
    <Ionicons
      name={name}
      size={size ?? 24}
      color={focused ? accent : inactive}
      allowFontScaling={false}
    />
  );
}

export function shouldShowAiTab(prefs: Preferences) {
  return prefs.aiEnabled !== false;
}

export function shouldOpenLogWizardFromReminderAction(action: ReminderAction) {
  return action === 'log-now';
}

export function shouldClearReminderAction(action: ReminderAction) {
  return action !== 'none';
}

export function shouldSnoozeReminderFromAction(action: ReminderAction) {
  return action === 'later';
}

export function shouldOpenHomeFromReminderAction(action: ReminderAction) {
  return action === 'default' || action === 'unknown';
}

export function shouldOpenHomeAfterSnoozeFailure(action: ReminderAction, snoozeScheduled: boolean) {
  return action === 'later' && !snoozeScheduled;
}

export function shouldHandleReminderAction(
  action: ReminderAction,
  lastAction: ReminderAction | null,
  lastActionAtMs: number,
  nowMs: number,
  duplicateWindowMs = 1500
) {
  if (action === 'none') return false;
  if (!lastAction) return true;
  if (action !== lastAction) return true;
  return nowMs - lastActionAtMs > duplicateWindowMs;
}

export function RootNavigator({
  prefs,
  onChangePrefs,
}: {
  prefs: Preferences;
  onChangePrefs: (next: Preferences) => void;
}) {
  const theme = useTheme();
  const navTheme = theme.mode === 'dark' ? DarkTheme : DefaultTheme;
  const navRef = useNavigationContainerRef<RootStackParamList>();
  const handledInitialActionRef = useRef(false);
  const lastActionRef = useRef<ReminderAction | null>(null);
  const lastActionAtRef = useRef(0);

  useEffect(() => {
    let mounted = true;
    let dispose = () => {};

    const openLogWizard = () => {
      if (!mounted || !navRef.isReady()) return;
      navRef.navigate('LogWizard');
    };

    const openHome = () => {
      if (!mounted || !navRef.isReady()) return;
      navRef.navigate('Tabs');
    };

    const handleAction = (action: ReminderAction) => {
      const nowMs = Date.now();
      if (!shouldHandleReminderAction(action, lastActionRef.current, lastActionAtRef.current, nowMs)) return;
      lastActionRef.current = action;
      lastActionAtRef.current = nowMs;
      if (shouldSnoozeReminderFromAction(action)) {
        void Permissions.scheduleReminderSnooze(prefs.notifications.snoozeMinutes).then((ok) => {
          if (shouldOpenHomeAfterSnoozeFailure(action, ok)) {
            openHome();
          }
        });
      }
      if (shouldOpenHomeFromReminderAction(action)) {
        openHome();
      }
      if (shouldOpenLogWizardFromReminderAction(action)) {
        openLogWizard();
      }
      if (shouldClearReminderAction(action)) {
        void Permissions.clearLastReminderAction();
      }
    };

    void Permissions.getLastReminderAction()
      .then((action) => {
        if (handledInitialActionRef.current) return;
        handledInitialActionRef.current = true;
        handleAction(action);
      })
      .catch(() => {});

    void Permissions.subscribeReminderActions((action) => {
      handleAction(action);
    }).then((cleanup) => {
      dispose = cleanup;
    });

    return () => {
      mounted = false;
      dispose();
    };
  }, [navRef, prefs.notifications.snoozeMinutes]);

  return (
    <NavigationContainer ref={navRef} theme={navTheme}>
      <Stack.Navigator>
        <Stack.Screen name="Tabs" options={{ headerShown: false }}>
          {() => <Tabs prefs={prefs} onChangePrefs={onChangePrefs} />}
        </Stack.Screen>
        <Stack.Screen
          name="LogWizard"
          component={LogWizardScreen}
          options={{
            title: 'Log today',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function Tabs({ prefs, onChangePrefs }: { prefs: Preferences; onChangePrefs: (next: Preferences) => void }) {
  const theme = useTheme();
  const tabBg =
    theme.tokens.color.background === 'linear-gradient(135deg, #a8e6cf 0%, #c8e6c9 25%, #e8f5e8 75%, #f1f8e9 100%)'
      ? '#ffffff'
      : theme.tokens.color.background;
  const accent = theme.tokens.color.accent;
  const inactiveLabel =
    theme.mode === 'dark' ? 'rgba(232, 238, 236, 0.78)' : 'rgba(0, 0, 0, 0.55)';
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIconStyle: Platform.OS === 'android' ? { marginTop: 2 } : undefined,
        tabBarStyle: {
          backgroundColor: tabBg,
          paddingTop: 4,
        },
        tabBarActiveTintColor: accent,
        tabBarInactiveTintColor: inactiveLabel,
      }}
    >
      <Tab.Screen
        name="Home"
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused, size }: TabBarIconProps) => (
            <TabBarIonicons name="home-outline" focused={focused} size={size} accent={accent} inactive={inactiveLabel} />
          ),
        }}
      >
        {() => <HomeScreen prefs={prefs} />}
      </Tab.Screen>
      <Tab.Screen
        name="View Logs"
        component={LogsScreenRoute}
        options={{
          tabBarLabel: 'Logs',
          tabBarIcon: ({ focused, size }: TabBarIconProps) => (
            <TabBarIonicons name="list-outline" focused={focused} size={size} accent={accent} inactive={inactiveLabel} />
          ),
        }}
      />
      <Tab.Screen
        name="Charts"
        options={{
          tabBarLabel: 'Charts',
          tabBarIcon: ({ focused, size }: TabBarIconProps) => (
            <TabBarIonicons name="bar-chart-outline" focused={focused} size={size} accent={accent} inactive={inactiveLabel} />
          ),
        }}
      >
        {() => <ChartsScreen prefs={prefs} />}
      </Tab.Screen>
      {shouldShowAiTab(prefs) ? (
        <Tab.Screen
          name="AI Analysis"
          options={{
            tabBarLabel: 'AI',
            tabBarIcon: ({ focused, size }: TabBarIconProps) => (
              <TabBarIonicons name="sparkles-outline" focused={focused} size={size} accent={accent} inactive={inactiveLabel} />
            ),
          }}
        >
          {() => <AiScreen prefs={prefs} />}
        </Tab.Screen>
      ) : null}
      <Tab.Screen
        name="Settings"
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ focused, size }: TabBarIconProps) => (
            <TabBarIonicons name="settings-outline" focused={focused} size={size} accent={accent} inactive={inactiveLabel} />
          ),
        }}
      >
        {() => <SettingsScreen prefs={prefs} onChangePrefs={onChangePrefs} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

