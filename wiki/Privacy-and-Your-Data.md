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
| **Access / portability** | Settings → Export JSON backup |
| **Rectification** | View logs → Edit entry |
| **Erasure** | Delete entry; Delete cloud data; clear local storage |
| **Withdraw consent** | Decline or revoke in Settings; disable cloud sync |
| **Object to research use** | Turn off anonymised contribution |

Target response time for operator-assisted requests: **30 days** (GDPR Art. 12).

Contact: **jan.andersson@rianell.com** for account deletion or access requests the app cannot fulfil alone.

---

## What we don’t do

- Sell your health logs
- Send logs to third-party LLM APIs by default (on-device model optional)
- Auto-translate your personal notes or symptom text

---

## Security highlights

- Supabase **Row Level Security** — users see only their rows
- CSP and security headers on the web app (see CI security reports)
- Client uses **publishable** Supabase key only

---

## Device performance tier (local only)

Rianell stores a small **`rianellPerfBenchmark`** entry in your browser’s local storage so the app can tune charts and AI preload for your device. It contains only:

- Performance tier (1–5), desktop/mobile flag, timestamp, and optional GPU backend hint
- No health logs, no network upload, no vendor/model fingerprint in the minimal schema

This is **strictly necessary** for on-device performance tuning (not tracking). You can clear it via God mode → clear benchmark cache, or by clearing site data for rianell.com.

---

## Read more (technical)

- [Privacy program — global baseline](https://github.com/Metaheurist/Rianell/blob/main/docs/privacy/global-baseline.md)
- [Data subject rights UX mapping](https://github.com/Metaheurist/Rianell/blob/main/docs/privacy/data-subject-rights.md)
- [SECURITY.md](https://github.com/Metaheurist/Rianell/blob/main/docs/SECURITY.md)
