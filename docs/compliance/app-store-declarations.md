# App store declarations (Google Play / Apple App Store)

**Product:** Rianell  
**Last updated:** 2026-06-23  
**Status:** Launch audit Phase 4 - copy-paste reference for store consoles.  
**Related:** [data-safety.xml](../../apps/rn-app/data-safety.xml) · [dsa-compliance.md](dsa-compliance.md) · [global-baseline.md](../privacy/global-baseline.md)

---

## 1. Data collected (summary)

| Category | Collected | Shared | Encrypted in transit | User can request deletion |
|----------|-----------|--------|----------------------|---------------------------|
| Health & fitness | Yes (symptom logs, mood) | No (default local-only) | Yes (TLS if cloud sync) | Yes |
| Email / account | Optional (cloud sync) | Supabase processor | Yes | Yes |
| Diagnostics | Optional bug reports | Supabase | Yes | Yes |
| Analytics | Opt-in session recording (Smartlook EU) | Smartlook | Yes | Yes (opt out) |
| Device IDs | Benchmark cache (local) | No | N/A | Clear app data |

---

## 2. Google Play - Data safety

Use `apps/rn-app/data-safety.xml` as the canonical field mapping. Highlights:

- **Health data:** collected, not sold, encrypted on device when Phase 7 RN encryption enabled; cloud backup encrypted at application layer.
- **Data deletion:** in-app export/delete; `delete_all_user_data` RPC for cloud erasure.
- **Security practices:** encryption in transit; optional app lock PIN.

---

## 3. Apple App Store - Privacy Nutrition Labels

| Data type | Linked to user | Used for tracking |
|-----------|----------------|-------------------|
| Health & Fitness | Yes (if account) | No |
| Contact Info (email) | Yes (if account) | No |
| Diagnostics | Optional | No |

**Tracking:** Smartlook is **not** ATT tracking; disclosed as analytics with opt-out.

---

## 4. Permissions justification (Android)

| Permission | Why |
|------------|-----|
| INTERNET | Sync, weather, model download |
| RECORD_AUDIO | Optional voice notes (expo-speech-recognition) |
| ACCESS_FINE_LOCATION | Optional weather (user prompt) |
| POST_NOTIFICATIONS | Reminders (Android 13+) |
| USE_BIOMETRIC | Optional app lock |

No SMS, contacts, or call log access.

---

## 5. Content rating

- Health/wellness logging; PHQ-9/GAD-7 screening with crisis links.
- No user-generated public content.
- Recommend **PEGI 3 / Everyone** with health disclaimer in listing.

---

## 6. Store listing copy (boilerplate)

> Rianell is a personal health dashboard for symptom and wellness tracking. It is not a medical device and does not provide diagnosis or treatment. AI features run on your device where possible. You control cloud backup and research contribution.

---

## 7. Operator sign-off

| Store | Version | Declared by | Date |
|-------|---------|-------------|------|
| Google Play | | | |
| Apple App Store | | | |
