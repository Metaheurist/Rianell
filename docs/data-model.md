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

## Minimal log (quick save)

Both web and RN support saving after **date + flare** only. Normalization fills missing numeric scores with defaults (typically mid-scale 5s) so charts and summaries remain valid.

## Cloud backup

Encrypted backups use AES-GCM. The encryption key for cloud sync is stored in Supabase **`user_keys`** (see [SECURITY.md](SECURITY.md)). Local logs remain plaintext in browser/RN storage unless a future at-rest encryption phase ships.

## Related

- [SECURITY.md](SECURITY.md) — RLS, encryption, fail-closed sync
- [app-and-features.md](app-and-features.md) — UX for logging and export/import
