# React Native (Expo) setup

Primary mobile target is **`apps/rn-app`** (Expo SDK 55, React Native 0.83). CI builds debug APK and iOS Xcode project zips under **`App build/RNCLI-Android/`** and **`App build/iOS/`**.

## Prerequisites

- **Node.js 24.14.1+** (see root `.nvmrc`)
- From repo root: **`npm ci`** (installs workspaces including `@rianell/shared` and `@rianell/tokens`)

## Local development

```bash
npm ci
cd apps/rn-app
npm run start          # Expo dev server
npm run android        # Open on Android emulator/device
npm run ios            # Open on iOS simulator (macOS)
```

## Quality gates (match CI)

From repo root:

```bash
npm run typecheck:mobile
npm run test:mobile
```

## Native prebuild / local APK

CI runs **`expo prebuild`** then Gradle **`assembleDebug`**. Locally:

```bash
cd apps/rn-app
npx expo prebuild --platform android
cd android && ./gradlew assembleDebug
```

APK output: **`apps/rn-app/android/app/build/outputs/apk/debug/`**

## Configuration

- **Supabase**: set env / config used by `submitBugReport` and future cloud sync (see [SECURITY.md](SECURITY.md)).
- **Shared schema**: logs normalized via `@rianell/shared` — see [data-model.md](data-model.md).
- **Parity**: feature contract in [platform-parity.md](platform-parity.md).

## Legacy Capacitor shell

**`apps/capacitor-app/`** remains for legacy WebView APK builds. New work should target **`apps/rn-app`**. Capacitor copy step:

```bash
cd apps/capacitor-app && npm run copy-webapp
```

## Related

- [setup-and-usage.md](setup-and-usage.md) — install links and CI artifacts
- [CHANGELOG.md](CHANGELOG.md) — release notes
