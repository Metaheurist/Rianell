# Smartlook session recording (opt-in)

**Product:** Rianell  
**Last updated:** 2026-06-20  
**Related:** [subprocessors.md](subprocessors.md) · [global-baseline.md](global-baseline.md) · [ropa.json](ropa.json) (PA-10) · [FREE-TIER-POLICY.md](../plans/FREE-TIER-POLICY.md)

---

## 1. Purpose

Optional **session recording** helps improve Rianell usability. It is **off by default** and requires explicit consent. Recordings may include screens the user visits, including health data visible on screen.

**Provider:** [Smartlook Analytics s.r.o.](https://www.smartlook.com/)  
**Data region:** EU (`region: eu`)

---

## 2. User controls

| Control | Location |
|---------|----------|
| Opt in | Settings → **Privacy & region** → **Session recording** (confirmation dialog) |
| Opt out | Same toggle, or **Consent dashboard → Revoke** |
| Blocked in local-only mode | Listed under local-only blocked features |

Requires **health data consent** (GDPR Art. 9) before the feature is available in EEA/UK policy packs.

---

## 3. Platform implementation

| Platform | SDK / module | Init |
|----------|--------------|------|
| **PWA (web)** | Smartlook Web SDK (`https://web-sdk.smartlook.com/recorder.js`) | `apps/pwa-webapp/smartlook.js` — loaded after settings; gated by `appSettings.sessionRecording` |
| **React Native** | `react-native-smartlook-analytics` | `apps/rn-app/src/analytics/sessionRecording.ts` — requires dev build / prebuild (not Expo Go) |

**Shared consent model:** preference field `sessionRecording` + `sessionRecordingAt`; policy feature key `sessionRecording`; consent dashboard row `sessionRecording`.

---

## 4. Security and CSP (PWA)

CSP in `apps/pwa-webapp/index.html` allows:

- `script-src`: `https://web-sdk.smartlook.com`, `https://*.smartlook.com`, `https://*.smartlook.cloud`
- `connect-src`: same Smartlook hosts

Verified by `scripts/verify/verify-csp-connect-src.mjs`.

If Cloudflare adds a narrower HTTP CSP, mirror these hosts in edge headers — see [infrastructure-and-security-edge.md](../infrastructure-and-security-edge.md).

---

## 5. Operator notes

- Project key: `packages/shared/src/analytics/smartlookConfig.mjs` (PWA `smartlook-config.js`, RN `app.config.js` + env `EXPO_PUBLIC_SMARTLOOK_PROJECT_KEY`). GitHub Actions secret `SMARTLOOK_PROJECT_KEY` overrides on Pages deploy when set.
- Web init: `smartlook('init', projectKey, { region: 'eu' })` in `apps/pwa-webapp/smartlook.js`.
- Mobile: EU region is bound to the Smartlook project; RN uses `react-native-smartlook-analytics` with the same project key.
- Rotate in Smartlook dashboard if compromised.
- Smartlook free tier is listed in [FREE-TIER-POLICY.md](../plans/FREE-TIER-POLICY.md).
- Subprocessor register: [subprocessors.md](subprocessors.md). RoPA activity: **PA-10** in [ropa.json](ropa.json).

---

## 6. Key source paths

```
apps/pwa-webapp/smartlook.js
apps/pwa-webapp/app.js                    # toggle, consent dashboard, loadSettings hook
apps/rn-app/src/analytics/sessionRecording.ts
apps/rn-app/src/settings/SettingsPrivacyTrustPane.tsx
packages/shared/src/privacy/getFeatureAvailability.mjs
packages/shared/src/settings/consentDashboard.mjs
packages/shared/src/privacy/localOnlyMode.mjs
i18n-packs/locale-packs/v1/en-GB.json     # settings.privacy.sessionRecording.*
```
