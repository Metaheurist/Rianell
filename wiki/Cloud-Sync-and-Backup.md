# Cloud Sync and Backup

Cloud sync is **optional**. By default, all health logs stay on your device only.

---

## What cloud sync provides

When you sign in with Supabase Auth:

- **Encrypted backup** of health logs in the `health_data` table
- **Per-user encryption key** stored in `user_keys` (AES-GCM via `@rianell/cloud-sync`)
- **Merge** on sync - local and cloud ciphertext are merged; local wins on conflict for the same day
- Optional **anonymised contribution** to a research pool (separate toggle)

Your publishable Supabase key in the client is safe to embed; **never** put a secret/service key in the app.

---

## Before first sync - health data consent

Under GDPR Article 9, processing special-category health data requires explicit consent. Both PWA and React Native show a **Health data processing consent** dialog before the first cloud operation. Declining keeps everything local-only.

---

## How to enable

1. Open **Settings** → **Privacy & region** or cloud pane.
2. Complete region/policy steps if prompted.
3. **Sign in** with your Supabase-backed account.
4. Accept health data consent.
5. Trigger **Sync** or enable automatic sync if offered.

Live site (rianell.com) receives Supabase URL and publishable key at **deploy time** via GitHub Actions secrets - not committed to git.

---

## What gets encrypted

Log JSON is encrypted client-side before upload. The server stores ciphertext blobs; decryption happens only on your devices with your key.

Local storage (browser/RN) remains plaintext at rest unless a future at-rest encryption phase ships.

---

## Deleting cloud data

**Settings → Delete cloud data** removes your rows from:

- `health_data`
- `user_keys`
- `user_privacy_profile`
- `user_achievements`
- `anonymized_data`
- `bug_reports`

When the **`delete-user-data`** Edge Function is deployed (production since v1.96.0), the app also removes your **Supabase Auth account** (email/login gone) and signs you out. If the function is unavailable, only table rows are deleted and you can still sign in - contact support for full account removal. See [[Privacy-and-Your-Data]].

**Third-party connectors** (Strava, Withings, Google Sheets) store OAuth status in `user_integrations` and encrypted tokens server-side (`connector_tokens`, not readable from the client). Disconnecting or deleting cloud data removes these rows.

---

## Troubleshooting sync

- Confirm you’re signed in and consent was granted.
- Check network and Supabase project status.
- Export local JSON before destructive operations.

More: [[Troubleshooting]]

---

## Read more (technical)

- [Data subject rights](https://github.com/Metaheurist/Rianell/blob/main/docs/privacy/data-subject-rights.md)
- [Security - RLS and encryption](https://github.com/Metaheurist/Rianell/blob/main/docs/SECURITY.md)
