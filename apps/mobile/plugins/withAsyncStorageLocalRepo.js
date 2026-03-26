/**
 * Async Storage v3 ships `storage-android` via a local Maven repo under
 * `node_modules/@react-native-async-storage/async-storage/android/local_repo`.
 * Without this, Gradle cannot resolve `org.asyncstorage.shared_storage:storage-android:1.0.0`.
 * @see https://github.com/react-native-async-storage/async-storage/issues/1262
 */
const { withProjectBuildGradle } = require('@expo/config-plugins');

const MARKER = 'Async Storage v3 local_repo (shared_storage)';

module.exports = function withAsyncStorageLocalRepo(config) {
  return withProjectBuildGradle(config, (mod) => {
    if (mod.modResults.contents.includes(MARKER)) {
      return mod;
    }
    const needle = "maven { url 'https://www.jitpack.io' }";
    const injection = `
    // ${MARKER}
    maven {
        url "\${rootDir}/../node_modules/@react-native-async-storage/async-storage/android/local_repo"
    }`;
    if (!mod.modResults.contents.includes(needle)) {
      throw new Error(
        'withAsyncStorageLocalRepo: expected jitpack maven line in android/build.gradle; update plugin for this Expo/RN template.'
      );
    }
    mod.modResults.contents = mod.modResults.contents.replace(needle, needle + injection);
    return mod;
  });
};
