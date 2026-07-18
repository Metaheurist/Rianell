# Data subject rights - UX mapping (PWA)

**Product:** Rianell  
**Last updated:** 2026-06-23  
**Related:** [eu-gdpr.md](eu-gdpr.md) · [global-baseline.md](global-baseline.md) · [dpia-health-sync.md](dpia-health-sync.md)

---

## 1. Overview

This document maps GDPR / UK GDPR / global privacy rights to **in-app user journeys** in the PWA (`apps/pwa-webapp/`). Operator-assisted requests use the private contact in [SECURITY.md](../SECURITY.md).

**Response SLA (target):** 30 calendar days (GDPR Art. 12(3)); extend by 60 days if complex with notice.

---

## 2. Rights matrix

| Right | GDPR | PWA path | Operator fallback |
|-------|------|----------|-------------------|
| **Access** | Art. 15 | Settings → Data management → Export / backup | Supabase service-role export (logged) |
| **Portability** | Art. 20 | JSON export (shared schema) | Email JSON bundle |
| **Rectification** | Art. 16 | View logs → Edit entry | - |
| **Erasure** | Art. 17 | Delete cloud data (Edge Function removes Auth user when deployed); clear local | `delete-user-data` Edge Function or service-role |
| **Restrict processing** | Art. 18 | Disable cloud sync; disable AI/LLM | Flag account |
| **Object** | Art. 21 | Disable anonymized contribution | - |
| **Withdraw consent** | Art. 7(3) | GDPR modal decline; revoke in settings | - |
| **Automated decision info** | Art. 22 | AI settings disclosure | [ai-security.md](../ai-security.md) |

---

## 3. Right of access (Art. 15)

### 3.1 What users receive

- All health log entries in export file
- App settings and goals included in backup export
- Account email (displayed in settings when signed in)
- AI state if cloud sync enabled

### 3.2 PWA

1. Open **Settings** (gear / header).
2. Navigate **Data management** carousel pane.
3. Use **Export** / backup download - produces JSON aligned with `@rianell/shared` normalization.
4. If cloud sync enabled: ensure latest merge via sync, then export includes merged local state.

**Code areas:** `app.js` export handlers, `cloud-sync.js` download path.

### 3.3 Gaps

- No single PDF "access report" - JSON is machine-readable portability format.
- Server-side bug reports about the user: available on request to operator.

---

## 4. Right to erasure (Art. 17)

### 4.1 In-app erasure layers

| Layer | PWA | Cloud effect |
|-------|-----|--------------|
| Single log entry | View logs → Delete | Re-sync uploads new ciphertext without entry |
| All local data | Settings → clear / reset | Local only until sync |
| Cloud backup | Settings → delete cloud data | Deletes `health_data` + `user_keys` per app flow |
| Anonymized contribution | Disable + request operator | `anonymized_data` may retain rows - see §4.3 |
| Account | Sign out; contact for full auth delete | Requires operator Supabase Auth delete |

### 4.2 PWA cloud delete behaviour

Documented in app: deletes health backup and encryption keys; **may preserve** anonymized research rows user previously contributed (pseudonymous pool).

Users wishing **full** erasure including anonymized rows should contact operator with account email.

### 4.3 Anonymized data

If `user_id` is still linked, row is **personal data** - delete on erasure request. If truly anonymized (no re-link), Art. 17 may not apply - case-by-case review per [dpia-health-sync.md](dpia-health-sync.md).

---

## 5. Right to data portability (Art. 20)

| Format | Schema | Interoperability |
|--------|--------|------------------|
| JSON export | `packages/shared` `normalizeLogEntry` | Import on PWA via existing import flow |

**Not provided:** HL7 FHIR, Apple Health XML auto-export (backlog if demanded).

---

## 6. Rectification (Art. 16)

- **Logs:** Full edit wizard (PWA).
- **Account email:** Supabase Auth user settings (if exposed) or operator ticket.
- **Medical condition label:** Settings profile field.

---

## 7. Restrict processing / object (Arts. 18, 21)

| Processing | How to stop |
|------------|-------------|
| Cloud sync | Turn off sync; sign out |
| Anonymized pool | Settings → disable contribution |
| On-device LLM | Settings → disable AI / decline consent |
| All health processing | Do not accept health consent; use uninstall |

---

## 8. Consent withdrawal (Art. 7)

| Consent type | Withdrawal |
|--------------|------------|
| Health logging (Art. 9) | Blocks new logs when declined via GDPR flow |
| Cookies | Cookie banner → reject non-essential |
| LLM | Settings → disable on-device model |
| Cloud / research | Separate settings toggles |

Withdrawal does not affect lawfulness of processing before withdrawal.

---

## 9. Identity verification

For operator-handled requests:

1. Request from registered email, or
2. Proof of account ownership via signed-in session screenshot + email match.

Do not disclose another user's data.

---

## 10. Request log template

| Field | Value |
|-------|-------|
| Request ID | DSAR-YYYY-NNN |
| Date received | |
| Right exercised | |
| Channel | In-app / email |
| Verification | |
| Response date | |
| Outcome | Fulfilled / refused + reason |

Store securely; retention 3 years.

---

## 11. Contact

Publish support contact in privacy policy. Security-sensitive erasure of breach evidence: [incident-response.md](../incident-response.md).
