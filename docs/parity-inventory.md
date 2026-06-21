# Platform parity inventory

Generated: 2026-06-21T21:30:02.605Z

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
| simpleMode | yes | yes |
| trackingProfile | yes | yes |
| profileAvatar | yes | yes |
| dateFormat | yes | yes |
| firstDayOfWeek | yes | yes |
| logFavorites | yes | yes |
| symptomTemplates | yes | yes |
| medSchedule | yes | yes |
| cycleModuleEnabled | yes | yes |
| barcodeFoodLoggingEnabled | deferred (hidden) | deferred (hidden) |
| guidedVoiceLogEnabled | deferred (hidden) | deferred (hidden) |
| localOnlyMode | yes | yes |
| appLockEnabled | yes | yes |
| processingActivityLog | yes | yes |
| cloudAutoSyncOnOpen | yes | yes |
| cloudAutoSyncDailyTime | yes | yes |
| achievements | yes | yes |

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

## Achievements cloud sync exports

| Symbol | PWA achievements-sync.js | RN cloud/achievementsSync.ts |
|--------|--------------------------|------------------------------|
| loadAchievementsFromCloud | yes | yes |
| syncAchievementsToCloud | yes | yes |
| mergeLocalAndCloudAchievements | no | yes |

## Legacy Capacitor (must be absent post-sunset)

- apps/capacitor-app: absent (ok)
- flan-t5 in PWA source: absent (ok)

## Gaps

_No inventory gaps detected._
