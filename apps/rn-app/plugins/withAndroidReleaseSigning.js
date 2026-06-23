/**
 * Release APK signing via gradle.properties (CI injects RIANELL_RELEASE_* from GitHub secrets).
 */
const { withAppBuildGradle } = require('@expo/config-plugins');

const MARKER = 'RIANELL_RELEASE_SIGNING';

module.exports = function withAndroidReleaseSigning(config) {
  return withAppBuildGradle(config, (mod) => {
    if (mod.modResults.contents.includes(MARKER)) {
      return mod;
    }
    const block = `
    // ${MARKER}
    def rianellReleaseStoreFile = project.findProperty('RIANELL_RELEASE_STORE_FILE')
    def rianellReleaseStorePassword = project.findProperty('RIANELL_RELEASE_STORE_PASSWORD')
    def rianellReleaseKeyAlias = project.findProperty('RIANELL_RELEASE_KEY_ALIAS')
    def rianellReleaseKeyPassword = project.findProperty('RIANELL_RELEASE_KEY_PASSWORD')
`;
    const signingBlock = `
        release {
            if (rianellReleaseStoreFile) {
                storeFile file(rianellReleaseStoreFile)
                storePassword rianellReleaseStorePassword
                keyAlias rianellReleaseKeyAlias
                keyPassword rianellReleaseKeyPassword
            }
        }`;
    let contents = mod.modResults.contents;
    if (!contents.includes('signingConfigs {')) {
      throw new Error('withAndroidReleaseSigning: signingConfigs block not found in app/build.gradle');
    }
    contents = contents.replace(/android\s*\{/, `android {${block}`);
    contents = contents.replace(
      /signingConfigs\s*\{([^}]*)\}/,
      (match, inner) => {
        if (inner.includes('release {')) return match;
        return `signingConfigs {${inner}${signingBlock}\n    }`;
      }
    );
    contents = contents.replace(
      /buildTypes\s*\{\s*release\s*\{/,
      'buildTypes {\n        release {\n            signingConfig signingConfigs.release'
    );
    if (contents.includes('release {\n            signingConfig signingConfigs.release\n            signingConfig')) {
      contents = contents.replace(
        /release \{\s*signingConfig signingConfigs\.release\s*signingConfig/,
        'release {\n            signingConfig'
      );
    }
    mod.modResults.contents = contents;
    return mod;
  });
};
