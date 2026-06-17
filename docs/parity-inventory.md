# Platform parity inventory

Generated: 2026-06-17T14:07:37.622Z

## Settings / preferences field parity

| Field | PWA appSettings | RN preferences |
|-------|-----------------|----------------|
| privacyRegion | yes | yes |
| privacyRegionSource | yes | yes |
| policyAcknowledgedVersion | yes | yes |
| uiLocale | yes | yes |
| userName | yes | yes |
| medicalCondition | yes | yes |
| weightUnit | yes | yes |
| contributeAnonData | yes | yes |
| useOpenData | yes | yes |
| aiEnabled | yes | yes |
| demoMode | yes | yes |
| preferredLlmModelSize | yes | yes |
| aiModelDownloadConsent | yes | yes |
| backup | yes | yes |
| compress | yes | yes |
| animations | yes | yes |
| lazy | yes | yes |

## Cloud sync exports

| Symbol | PWA cloud-sync.js | RN cloud/sync.ts |
|--------|-------------------|------------------|
| syncToCloud | yes | yes |
| loadFromCloud | yes | yes |
| syncAnonymizedData | yes | yes |
| mergeHealthLogs | yes | yes |
| deleteCloudLogs | yes | yes |
| deleteAllUserDataFromCloud | yes | yes |
| fetchPrivacyProfileAndApply | yes | yes |
| upsertPrivacyProfile | yes | yes |

## Legacy Capacitor (must be absent post-sunset)

- apps/capacitor-app: absent (ok)
- flan-t5 in PWA source: absent (ok)

## Gaps

_No inventory gaps detected._
