# Global privacy baseline

**Product:** Rianell  
**Last updated:** 2026-06-13  
**Related:** [eu-gdpr.md](eu-gdpr.md) · [other-jurisdictions.md](other-jurisdictions.md) · [ropa.json](ropa.json) · [data-subject-rights.md](data-subject-rights.md)

---

## 1. Scope

Rianell is a **personal wellness** application, not a regulated medical device or covered healthcare provider. This baseline establishes cross-jurisdiction privacy principles before region-specific schedules.

**Data controller:** Rianell operator (update with legal entity name when incorporated).  
**Primary users:** Individuals tracking personal health metrics on web and mobile.

---

## 2. Framework alignment

| Framework | Alignment | Rianell implementation |
|-----------|-------------|------------------------|
| **OECD Privacy Guidelines (2013)** | Collection limitation, purpose specification, security safeguards | Opt-in cloud sync; minimal fields in bug reports; RLS + encryption |
| **NIST Privacy Framework** | Identify – Govern – Control – Communicate – Protect | RoPA (`ropa.json`), [threat-model.md](../threat-model.md), consent modals |
| **ISO/IEC 27701** (informative) | PIMS extension to ISO 27001 | Not certified; practices mapped voluntarily |
| **GDPR / UK GDPR** | Primary EU/UK schedule | [eu-gdpr.md](eu-gdpr.md) |
| **APPs (Australia)** | Transparency, access, correction | Settings + cloud export paths |
| **LGPD (Brazil)** | Legal bases, DPO contact | See [other-jurisdictions.md](other-jurisdictions.md) |

---

## 3. Privacy principles (operational)

1. **Local-first:** Core logging works offline; cloud is optional.
2. **Transparency:** In-app GDPR agreement, cookie/health consent, AI disclosure.
3. **User control:** Export, delete cloud data, disable anonymized contribution.
4. **Security by design:** RLS, AES-GCM for cloud blobs, fail-closed encrypt ([SECURITY.md](../SECURITY.md)).
5. **No sale of personal data:** No advertising network integration.
6. **Special-category care:** Explicit Art. 9 consent before health logging (EEA/UK).

---

## 4. RoPA summary

Full machine-readable register: [ropa.json](ropa.json).

| PA-ID | Activity | Purpose | Categories | Recipients | Retention |
|-------|----------|---------|------------|------------|-----------|
| PA-01 | Local health logging | Personal tracking | Health, lifestyle | Device only | Until user deletes |
| PA-02 | Cloud encrypted backup | Availability across devices | Health, settings, AI state | Supabase | Until account erasure |
| PA-03 | Anonymized research pool | Improve population insights | Pseudonymous health-derived | Supabase | Until erasure or anonymization complete |
| PA-04 | Authentication | Account security | Email, credentials | Supabase Auth | Account lifetime |
| PA-05 | On-device AI / LLM | Insights, summaries | Health (local) | None (HF weights only) | Session / cache |
| PA-06 | Bug reports | Quality improvement | Technical + optional user link | Supabase | 24 months operational |
| PA-07 | Static site delivery | Host PWA | IP, HTTP metadata | Cloudflare, GitHub | Provider logs per their policy |
| PA-08 | Donations | Support project | Payment data | PayPal | Per PayPal retention |

---

## 5. Lawful basis matrix (GDPR Art. 6 and Art. 9)

| Processing (PA-ID) | Art. 6 basis | Art. 9 condition (health data) | Notes |
|--------------------|--------------|--------------------------------|-------|
| PA-01 Local logging | **Consent** (6(1)(a)) | **Explicit consent** (9(2)(a)) | Health consent modal blocks logging without agreement |
| PA-02 Cloud backup | **Contract** (6(1)(b)) — service user requests | **Explicit consent** (9(2)(a)) | Sign-in + sync toggle |
| PA-03 Anonymized pool | **Consent** (6(1)(a)) | **Explicit consent** (9(2)(a)) | Separate settings toggle |
| PA-04 Authentication | **Contract** (6(1)(b)) | N/A (identity only) | Email/password |
| PA-05 On-device AI | **Consent** (6(1)(a)) | **Explicit consent** (9(2)(a)) | LLM consent + health consent |
| PA-06 Bug reports | **Legitimate interests** (6(1)(f)) | **Not applicable** if no health in report; **consent** if user attaches health context | Minimise console capture |
| PA-07 Site delivery | **Legitimate interests** (6(1)(f)) | N/A | Security and availability |
| PA-08 Donations | **Contract** (6(1)(b)) | N/A | Optional feature |

**UK GDPR:** Same articles; post-Brexit UK schedule in [other-jurisdictions.md](other-jurisdictions.md).

**Withdrawal of consent:** Users disable sync, revoke contribution, or delete account — see [data-subject-rights.md](data-subject-rights.md).

---

## 6. Data minimisation and retention

| Data type | Default retention | Erasure mechanism |
|-----------|-------------------|-------------------|
| Local logs | User-controlled | Clear data / uninstall |
| Cloud `health_data` | Until delete | Settings → delete cloud backup |
| `user_keys` | Until delete | Deleted with cloud backup |
| `anonymized_data` | Until erasure request | May retain if truly anonymized — legal review per row |
| Auth account | Until deletion | Supabase user delete (operator-assisted if no self-serve) |
| Bug reports | 24 months | Operator purge job |

---

## 7. DPIA triggers

Conduct or update DPIA when:

- New server-side health processing
- Passphrase/crypto architecture change ([crypto-roadmap.md](../crypto-roadmap.md))
- Sharing with new subprocessor
- Automated decisions with significant effects (Art. 22)

Current DPIA: [dpia-health-sync.md](dpia-health-sync.md).

---

## 8. Children's data

Rianell is not directed at children under 16 (EEA) / 13 (US COPPA). Do not knowingly collect children's health data. Age affirmation may be added in onboarding if required by jurisdiction.

---

## 9. Records and accountability

| Artifact | Location |
|----------|----------|
| RoPA (JSON) | [ropa.json](ropa.json) |
| DPIA | [dpia-health-sync.md](dpia-health-sync.md) |
| Subprocessors | [subprocessors.md](subprocessors.md) |
| Threat model | [threat-model.md](../threat-model.md) |
| Incident plan | [incident-response.md](../incident-response.md) |

---

## 10. Review schedule

- **Annual** full baseline review
- **Per release** when data flows change
- Next scheduled review: **2026-12-01**
