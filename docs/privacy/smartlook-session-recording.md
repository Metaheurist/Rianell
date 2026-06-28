# Smartlook session recording (default-on after disclosure)

**Product:** Rianell  
**Last updated:** 2026-06-21  
**Related:** [subprocessors.md](subprocessors.md) · [global-baseline.md](global-baseline.md) · [ropa.json](ropa.json) (PA-10) · [FREE-TIER-POLICY.md](../plans/FREE-TIER-POLICY.md)

---

## 1. Purpose

Optional **session recording** helps improve Rianell usability. It is **on by default after onboarding disclosure** — users are notified during first-run setup and can turn it off immediately or later in Settings. Recordings may include screens the user visits, including health data visible on screen.

**Provider:** [Smartlook Analytics s.r.o.](https://www.smartlook.com/)  
**Data region:** EU (`region: eu`)

---

## 2. User controls

| Control | Location |
|---------|----------|
| First-run disclosure | First-run wizard step **Session recording** (after cookies) — toggle default **on** |
| Opt out | Same toggle during onboarding, or Settings → **Privacy & region** → **Session recording** |
| Opt out (revoke) | **Consent dashboard** on Privacy pane → Revoke |
| Blocked in local-only mode | Listed under local-only blocked features |

Requires **health data consent** (GDPR Art. 9) before the feature is available in EEA/UK policy packs.

Users who previously opted out (`sessionRecording: false` in saved settings) remain off after upgrade.

---

## 2.1 GDPR legal basis (Art. 6)

| Processing | Legal basis | Notes |
|------------|-------------|-------|
| Session recording (analytics) | **Art. 6(1)(a) consent** | Explicit opt-in after onboarding disclosure; revocable in Settings and consent dashboard |
| Special-category data visible on screen | **Art. 9(2)(a) explicit consent** | Gated by health data consent + `sessionRecording` toggle; not activated in local-only mode |
| Legitimate interest | **Not relied upon** | Product does not use Art. 6(1)(f) for Smartlook — consent is the sole basis |

**Records:** consent timestamps `sessionRecordingAt`, `sessionRecordingDisclosureAt`; RoPA activity **PA-10** in [ropa.json](ropa.json).

---

## 3. Activation gate

Smartlook SDK does **not** start until both conditions hold:

1. Preference `sessionRecording === true`
2. Either `sessionRecordingDisclosureAt` (onboarding) or `sessionRecordingAt` (Settings enable) is set

Shared helper: `shouldActivateSessionRecording()` in `packages/shared/src/analytics/sessionRecordingPrefs.mjs`.

---

## 4. Platform implementation

| Platform | SDK / module | Init |
|----------|--------------|------|
| **PWA (web)** | Smartlook Web SDK (`https://web-sdk.smartlook.com/recorder.js`) | `apps/pwa-webapp/smartlook.js` — gated by `shouldActivateSessionRecording` |
| **React Native** | `react-native-smartlook-analytics` | `apps/rn-app/src/analytics/sessionRecording.ts` — requires dev build / prebuild (not Expo Go) |

**Shared consent model:** `sessionRecording`, `sessionRecordingAt`, `sessionRecordingDisclosureAt`; policy feature key `sessionRecording`; consent dashboard row `sessionRecording`.

**First-run step:** `sessionRecording` in `packages/shared/src/onboarding/firstRunSteps.mjs` — skipped when already disclosed or feature disabled for region.

---

## 5. Security and CSP (PWA)

CSP in `apps/pwa-webapp/index.html` allows:

- `script-src`: `https://web-sdk.smartlook.com`, `https://*.smartlook.com`, `https://*.smartlook.cloud`
- `connect-src`: same Smartlook hosts

Verified by `scripts/verify/verify-csp-connect-src.mjs`.

If Cloudflare adds a narrower HTTP CSP, mirror these hosts in edge headers — see [infrastructure-and-security-edge.md](../infrastructure-and-security-edge.md).

---

## 6. Operator notes

- Project key: `packages/shared/src/analytics/smartlookConfig.mjs` (PWA `smartlook-config.js`, RN `app.config.js` + env `EXPO_PUBLIC_SMARTLOOK_PROJECT_KEY`). GitHub Actions secret `SMARTLOOK_PROJECT_KEY` overrides on Pages deploy when set.
- Web init: `smartlook('init', projectKey, { region: 'eu' })` in `apps/pwa-webapp/smartlook.js`.
- Mobile: EU region is bound to the Smartlook project; RN uses `react-native-smartlook-analytics` with the same project key.
- Rotate in Smartlook dashboard if compromised.
- Smartlook free tier is listed in [FREE-TIER-POLICY.md](../plans/FREE-TIER-POLICY.md).
- Subprocessor register: [subprocessors.md](subprocessors.md). RoPA activity: **PA-10** in [ropa.json](ropa.json).

---

## 7. Key source paths

```
packages/shared/src/analytics/sessionRecordingPrefs.mjs
apps/pwa-webapp/smartlook.js
apps/pwa-webapp/guided-onboarding.js
apps/pwa-webapp/app.js                    # toggle, consent dashboard, loadSettings hook
apps/rn-app/src/analytics/sessionRecording.ts
apps/rn-app/src/components/FirstRunWizard.tsx
apps/rn-app/src/settings/SettingsPrivacyTrustPane.tsx
packages/shared/src/onboarding/firstRunSteps.mjs
packages/shared/src/privacy/getFeatureAvailability.mjs
packages/shared/src/settings/consentDashboard.mjs
i18n-packs/locale-packs/v1/en-GB.json     # onboarding.sessionRecording.*, settings.privacy.sessionRecording.*
```
