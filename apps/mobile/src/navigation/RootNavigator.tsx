import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
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

export type RootStackParamList = {
  Tabs: undefined;
  LogWizard: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

export function shouldShowAiTab(prefs: Preferences) {
  return prefs.aiEnabled !== false;
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
  return (
    <NavigationContainer theme={navTheme}>
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
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.tokens.color.background === 'linear-gradient(135deg, #a8e6cf 0%, #c8e6c9 25%, #e8f5e8 75%, #f1f8e9 100%)' ? '#ffffff' : theme.tokens.color.background },
        headerTintColor: theme.tokens.color.text,
        tabBarStyle: { backgroundColor: theme.tokens.color.background === 'linear-gradient(135deg, #a8e6cf 0%, #c8e6c9 25%, #e8f5e8 75%, #f1f8e9 100%)' ? '#ffffff' : theme.tokens.color.background },
        tabBarActiveTintColor: theme.tokens.color.accent,
        tabBarInactiveTintColor: theme.tokens.color.text,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size ?? 24} color={color} />,
        }}
      />
      <Tab.Screen
        name="View Logs"
        component={LogsScreenRoute}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="list-outline" size={size ?? 24} color={color} />,
        }}
      />
      <Tab.Screen
        name="Charts"
        component={ChartsScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="bar-chart-outline" size={size ?? 24} color={color} />,
        }}
      />
      {shouldShowAiTab(prefs) ? (
        <Tab.Screen
          name="AI Analysis"
          component={AiScreen}
          options={{
            tabBarIcon: ({ color, size }) => <Ionicons name="sparkles-outline" size={size ?? 24} color={color} />,
          }}
        />
      ) : null}
      <Tab.Screen
        name="Settings"
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size ?? 24} color={color} />,
        }}
      >
        {() => <SettingsScreen prefs={prefs} onChangePrefs={onChangePrefs} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

