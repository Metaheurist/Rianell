# Privacy and Your Data

Rianell is **local-first**: your health logs live on your device unless you opt into cloud backup or anonymised contribution.

---

## Core principles

| Principle | What it means for you |
|-----------|------------------------|
| **Local by default** | No account required; data in browser or phone storage |
| **Explicit consent** | Cloud sync and health-data processing need your OK |
| **Encryption in transit/at cloud** | Backups are AES-GCM encrypted before upload |
| **You can delete** | Remove cloud data or individual entries in-app |
| **UGC stays yours** | Notes and symptoms are never auto-translated |

---

## Region and policy gate

On first use (and when changing region), you may see policy summaries for your selected region. Machine-translated policy text includes a disclaimer; **English (en-GB)** remains authoritative in the repo.

Settings → **Privacy & region** controls language and regional policies.

---

## Your rights (summary)

| Right | In-app path |
|-------|-------------|
| **Access / portability** | Settings → Export JSON backup; or create an encrypted share link |
| **Rectification** | View logs → Edit entry |
| **Erasure** | Delete entry; Delete cloud data; clear local storage |
| **Withdraw consent** | Decline or revoke in Settings; disable cloud sync; revoke **Session recording (Smartlook)** or **Barcode food logging (camera)** in the consent dashboard |
| **Object to research use** | Turn off anonymised contribution |

Target response time for operator-assisted requests: **30 days** (GDPR Art. 12).

Contact: **jan.andersson@rianell.com** for account deletion or access requests the app cannot fulfil alone.

---

## Optional barcode food logging

When you enable **Barcode food logging** in Settings → Data options, Rianell can:

| | |
|---|---|
| **Camera use** | Your browser asks for camera access only while the scanner is open |
| **What is sent** | The barcode number is sent to [Open Food Facts](https://world.openfoodfacts.org/) to look up product name and nutrition |
| **What stays local** | Your meal log; camera video is not uploaded |
| **How to stop** | Turn off the toggle in Settings, or **Consent dashboard → Revoke** for barcode food logging |

---

## Optional session recording (Smartlook)

Rianell uses optional session analytics to improve usability. During onboarding you choose **yes** or **no** on a friendly card - nothing is pre-ticked for EEA/UK users.

| | |
|---|---|
| **When it runs** | After you complete the first-run **Session recording** step (default on), or when you explicitly enable it in Settings |
| **What it may capture** | Anonymised heatmaps and error data - screens you visit may be included, but recordings are not reviewed individually for health content |
| **Where data goes** | Smartlook Analytics (EU region) - see [subprocessor register](https://github.com/Metaheurist/Rianell/blob/main/docs/privacy/subprocessors.md) |
| **How to stop** | Turn the toggle off during onboarding, in Settings → Privacy & region, or **Consent dashboard → Revoke** |
| **Local-only mode** | Blocks session recording along with other network features |

Technical details: [Smartlook session recording](https://github.com/Metaheurist/Rianell/blob/main/docs/privacy/smartlook-session-recording.md).

---

## What we don’t do

- Sell your health logs
- Send logs to third-party LLM APIs by default (on-device model optional)
- Start session recording before onboarding disclosure (you can opt out during setup)
- Auto-translate your personal notes or symptom text

---

## Security highlights

- Supabase **Row Level Security** - users see only their rows
- CSP and security headers on the web app (see CI security reports)
- Client uses **publishable** Supabase key only

---

## Device performance tier (local only)

Rianell stores a small **`rianellPerfBenchmark`** entry in your browser’s local storage so the app can tune charts and AI preload for your device. It contains only:

- Performance tier (1-5), desktop/mobile flag, timestamp, and optional GPU backend hint
- No health logs, no network upload, no vendor/model fingerprint in the minimal schema

This is **strictly necessary** for on-device performance tuning (not tracking). You can clear it via God mode → clear benchmark cache, or by clearing site data for rianell.com.

---

## Read more (technical)

- [Privacy program - global baseline](https://github.com/Metaheurist/Rianell/blob/main/docs/privacy/global-baseline.md)
- [Smartlook session recording (technical)](https://github.com/Metaheurist/Rianell/blob/main/docs/privacy/smartlook-session-recording.md)
- [Data subject rights UX mapping](https://github.com/Metaheurist/Rianell/blob/main/docs/privacy/data-subject-rights.md)
- [SECURITY.md](https://github.com/Metaheurist/Rianell/blob/main/docs/SECURITY.md)
