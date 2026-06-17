/**
 * Metro stub for react-native-transformers during `expo export` (CI Hermes gate).
 * On-device ORT inference is validated in dev/prod builds; export only needs the app graph to bundle.
 */
export const Pipeline = {
  TextGeneration: {
    init: async () => {},
    generate: async () => '',
    dispose: async () => {},
  },
};
