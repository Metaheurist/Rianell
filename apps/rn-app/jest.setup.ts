import '@testing-library/jest-native/extend-expect';

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      extra: {
        supabaseUrl: '',
        supabaseAnonKey: '',
      },
    },
  },
}));

jest.mock('@expo/vector-icons/Ionicons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return function MockIonicons(props: { name?: string }) {
    return React.createElement(Text, { testID: `ionicon-${props.name ?? 'icon'}` }, props.name ?? '');
  };
});

jest.mock('react-native-svg', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Mock = React.forwardRef((props: any, ref: any) => React.createElement(View, { ...props, ref }, props.children));
  return {
    __esModule: true,
    default: Mock,
    Svg: Mock,
    Circle: Mock,
    Rect: Mock,
    Path: Mock,
    G: Mock,
  };
});

jest.mock('expo-av', () => ({
  Audio: {
    setAudioModeAsync: jest.fn(() => Promise.resolve()),
    getPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true, canAskAgain: true, status: 'granted' })),
    requestPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true, canAskAgain: true, status: 'granted' })),
  },
}));

jest.mock('@react-native-voice/voice', () => ({
  __esModule: true,
  default: {
    onSpeechPartialResults: null,
    onSpeechResults: null,
    onSpeechError: null,
    onSpeechEnd: null,
    start: jest.fn(() => Promise.resolve()),
    stop: jest.fn(() => Promise.resolve()),
    cancel: jest.fn(() => Promise.resolve()),
    destroy: jest.fn(() => Promise.resolve()),
    removeAllListeners: jest.fn(),
  },
}));

