import {
  artifactUrlFromManifest,
  DEFAULT_APP_BUILD_SITE_ORIGIN,
  manifestUrlForChannel,
} from './buildDownloads';

test('manifestUrlForChannel matches web path layout', () => {
  expect(manifestUrlForChannel('androidRnCli')).toBe(
    `${DEFAULT_APP_BUILD_SITE_ORIGIN}/${encodeURI('App build/RNCLI-Android/latest.json')}`
  );
});

test('artifactUrlFromManifest uses installUrl on iOS when present', () => {
  const u = 'https://example.com/install';
  expect(
    artifactUrlFromManifest('ios', {
      file: 'ignored.zip',
      installUrl: u,
    })
  ).toBe(u);
});

test('artifactUrlFromManifest joins folder + file', () => {
  expect(
    artifactUrlFromManifest('androidLegacy', {
      file: 'app-debug-beta-1.apk',
      version: 1,
    })
  ).toBe(`${DEFAULT_APP_BUILD_SITE_ORIGIN}/${encodeURI('App build/Android/app-debug-beta-1.apk')}`);
});
