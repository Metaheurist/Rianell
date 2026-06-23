# Android hardening (React Native)

**Product:** Rianell Android (`apps/rn-app/`)  
**Last updated:** 2026-06-23  
**Status:** Launch audit Phase 7 — operator checklist.  
**Related:** [hipaa-encryption-chain.md](hipaa-encryption-chain.md) · [SECURITY.md](../SECURITY.md) · [threat-model.md](../threat-model.md)

---

## 1. At-rest encryption (Phase 7)

| Asset | Protection |
|-------|------------|
| Health logs | AES-256-GCM envelope in AsyncStorage via `logsAesGcm.ts` (device key in SecureStore) |
| Auth session | `expo-secure-store` via `secureStorageAdapter.ts` |
| Cloud payload | Application-layer AES-GCM before Supabase upload (`sync.ts`) |

---

## 2. Certificate pinning (recommended for production)

**Status:** Not enabled in open-source tree by default — document for release builds.

### Option A — Network Security Config (native)

1. After `expo prebuild`, edit `android/app/src/main/res/xml/network_security_config.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
  <domain-config cleartextTrafficPermitted="false">
    <domain includeSubdomains="true">rianell.com</domain>
    <domain includeSubdomains="true">supabase.co</domain>
    <pin-set expiration="2027-06-01">
      <!-- Replace with live SPKI pins from openssl s_client -showcerts -->
      <pin digest="SHA-256">BASE64_SPKI_PIN_HERE=</pin>
    </pin-set>
  </domain-config>
</network-security-config>
```

2. Reference in `AndroidManifest.xml`: `android:networkSecurityConfig="@xml/network_security_config"`.

3. **Rotation:** maintain backup pin; update before `expiration`.

### Option B — Expo config plugin

Use a custom config plugin in `apps/rn-app/plugins/` to inject pins at prebuild time (keeps managed workflow reproducible).

**Verify:** MITM proxy (Charles) must fail TLS handshake for pinned hosts in release builds.

---

## 3. ProGuard / R8 (release obfuscation)

Expo / RN release builds enable R8 by default. Operator checklist:

| Step | Action |
|------|--------|
| 1 | `cd apps/rn-app && npx expo prebuild --platform android` |
| 2 | Confirm `android/app/build.gradle` has `minifyEnabled true` for `release` |
| 3 | Add `android/app/proguard-rules.pro` keep rules for React Native, ONNX, Supabase |

**Suggested keep rules (starter):**

```proguard
-keep class com.facebook.react.** { *; }
-keep class expo.modules.** { *; }
-keep class ai.onnxruntime.** { *; }
-dontwarn okhttp3.**
```

4. Test release APK: cold start, log save, cloud sync, ONNX model load.

---

## 4. Permissions minimization

`app.json` declares only required plugins. Block unused dangerous permissions:

```json
"android": {
  "blockedPermissions": [
    "android.permission.READ_PHONE_STATE",
    "android.permission.READ_CONTACTS",
    "android.permission.READ_SMS"
  ]
}
```

Review after each Expo SDK upgrade — plugins may add defaults.

---

## 5. Backup and extraction

- `android.allowBackup: false` in `app.json` — prevents adb backup of app data.
- Encrypted logs reduce impact of rooted device extraction.

---

## 6. Pre-release sign-off

- [ ] Release APK tested on physical device (not Expo Go)
- [ ] ProGuard release build passes smoke tests
- [ ] Pin set documented with expiry calendar reminder
- [ ] Play Data safety matches [data-safety.xml](../../apps/rn-app/data-safety.xml)
