module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        'babel-preset-expo',
        {
          // transformers.js dist uses import.meta; Hermes needs the Expo polyfill.
          unstable_transformImportMeta: true,
        },
      ],
    ],
  };
};
