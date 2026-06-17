/** Metro stub for @huggingface/transformers during expo export (CI Hermes gate). */
export const env = {
  allowRemoteModels: false,
  allowLocalModels: false,
  remoteHost: 'https://huggingface.co/',
  remotePathTemplate: '{model}/resolve/{revision}/',
  useBrowserCache: false,
  cacheDir: '',
};

export async function pipeline() {
  return async () => [{ generated_text: '' }];
}
