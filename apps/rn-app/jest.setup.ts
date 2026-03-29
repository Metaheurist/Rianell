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

jest.mock('expo-speech-recognition', () => {
  const React = require('react');
  return {
    __esModule: true,
    ExpoSpeechRecognitionModule: {
      start: jest.fn(),
      stop: jest.fn(),
      abort: jest.fn(),
      requestPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true, status: 'granted' })),
    },
    useSpeechRecognitionEvent: (_event: string, _listener: (payload: unknown) => void) => {
      React.useEffect(() => {}, []);
    },
  };
});

