import Constants from 'expo-constants';

export type LlmRuntimeKind = 'transformers-wasm' | 'native-ort';

export function detectLlmRuntime(): LlmRuntimeKind {
  // Expo Go — no custom native modules.
  if (Constants.executionEnvironment === 'storeClient') return 'transformers-wasm';
  return 'native-ort';
}

