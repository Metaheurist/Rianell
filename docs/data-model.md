# Health log data model

Canonical log shape is defined in **`packages/shared`** (`normalizeLogEntry` in `src/index.mjs`). Web (PWA), React Native, and import/export paths all normalize through this function so JSON backups are portable.

## Storage keys

| Platform | Key | Notes |
| :--- | :--- | :--- |
| Web / PWA | `healthLogs` in `localStorage` (batched via `StorageBatcher`) | Optional IndexedDB mirror via `logs-idb.js` |
| React Native | `@rianell/shared` `LOGS_STORAGE_KEY_V1` in AsyncStorage | Legacy mobile key migrated on read |

## Entry fields

All entries require a **`date`** (`YYYY-MM-DD`). Other fields are optional; empty strings and empty arrays are stripped on normalize.

| Field | Type | Range / notes |
| :--- | :--- | :--- |
| `date` | string | Required; defaults to today if invalid |
| `flare` | `'Yes'` \| `'No'` | Default `No` |
| `bpm` | number | 30–120 |
| `weight` | string | kg as decimal string (web convention) |
| `fatigue`, `stiffness`, `sleep`, `jointPain`, `mobility`, `dailyFunction`, `swelling`, `mood`, `irritability` | number | 0–10 |
| `weatherSensitivity` | number | 1–10 |
| `steps` | number | Integer |
| `hydration` | number | Glasses / units |
| `notes` | string | Max 500 chars |
| `energyClarity` | string | Max 80 chars |
| `painLocation` | string | Max 150 chars |
| `stressors`, `symptoms` | string[] | Trimmed, capped (50 / 80 items) |
| `food` | object | `{ breakfast, lunch, dinner, snack }` arrays of items |
| `exercise` | array | `{ name, duration? }` |
| `medications` | array | Per-entry medication log |
| `subEntries` | array | L8 AM/PM partial saves: `{ id, period: 'AM'\|'PM'\|'partial', mood?, fatigue?, sleep?, jointPain?, notes?, savedAt }` |
| `cycle` | object | L7 `{ cycleDay?, phase?, flow?, pmsSymptoms?[] }` when cycle module enabled |
| `medicationDoses` | array | L3 per-dose log: `{ drug, status: 'taken'\|'skipped'\|'missed', scheduledAt? }` |

## Preferences (Plan 04 logging)

Stored in app settings / RN `Preferences` (not in each log entry):

| Field | Type | Notes |
| :--- | :--- | :--- |
| `logFavorites` | object | `{ meals[], exercises[], medCombos[] }` for one-tap re-log (L2) |
| `symptomTemplates` | array | User-learned chip sets per condition (L6) |
| `medSchedule` | array | Scheduled drugs + dose times for wizard dose chips (L3) |
| `cycleModuleEnabled` | boolean | Shows cycle fields in wizard (L7) |
| `barcodeFoodLoggingEnabled` | boolean | Open Food Facts lookup in food step (L5) |
| `guidedVoiceLogEnabled` | boolean | STT → field extraction in wizard (L11) |

`trackingProfile` (Plan 03) gates progressive wizard categories (L1): food, exercise, medications unlock on a day schedule.

## Minimal log (quick save)

Both web and RN support saving after **date + flare** only. Normalization fills missing numeric scores with defaults (typically mid-scale 5s) so charts and summaries remain valid.

## Cloud backup

Encrypted backups use AES-GCM. The encryption key for cloud sync is stored in Supabase **`user_keys`** (see [SECURITY.md](SECURITY.md)). Local logs remain plaintext in browser/RN storage unless a future at-rest encryption phase ships.

## Supabase tables (cloud)

| Table | Contents | RLS |
| :--- | :--- | :--- |
| **`health_data`** | Encrypted log backup blobs per user | Owner-only |
| **`user_keys`** | Per-user AES key (hex) for backup encryption | Owner-only |
| **`anonymized_data`** | Opt-in encrypted anonymised payloads + condition label | Owner CRUD |
| **`bug_reports`** | In-app bug reports (insert-only for clients) | Insert-only |

## Cloud deletion semantics (v1.50.0)

Unified **Delete cloud data** (PWA `deleteAllUserDataFromCloud`, RN `deleteAllUserDataFromCloud`) deletes all rows where **`user_id`** matches the signed-in user across **`health_data`**, **`user_keys`**, **`anonymized_data`**, and **`bug_reports`**. Narrower actions: delete encrypted backup only (`health_data` + `user_keys`) or anonymised contribution only (`anonymized_data`). Does not delete the Supabase **`auth.users`** record — sign out or contact operator for full account removal. See [privacy/data-subject-rights.md](privacy/data-subject-rights.md).

## Related

- [SECURITY.md](SECURITY.md) — RLS, encryption, fail-closed sync
- [app-and-features.md](app-and-features.md) — UX for logging and export/import
