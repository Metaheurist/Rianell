# DPIA — health cloud sync, anonymized contribution, and on-device AI

**Product:** Rianell  
**Version:** v1.49.x  
**DPIA date:** 2026-06-13  
**Review date:** 2026-12-01  
**Related:** [global-baseline.md](global-baseline.md) · [eu-gdpr.md](eu-gdpr.md) · [ai-security.md](../ai-security.md) · [crypto-roadmap.md](../crypto-roadmap.md) · [threat-model.md](../threat-model.md)

---

## 1. Need for a DPIA (Art. 35)

A DPIA is required because Rianell involves:

1. **Systematic processing of health data** (special category, Art. 9).
2. **Cloud storage** of encrypted backups on multi-tenant infrastructure (Supabase).
3. **Optional research-oriented processing** (anonymized contribution pool).
4. **Innovative technology** — on-device large language models for health summaries.

---

## 2. Processing description

### 2.1 Nature

| Flow | Description |
|------|-------------|
| **Local logging** | User enters daily health metrics; stored in browser `localStorage` / RN AsyncStorage (plaintext). |
| **Cloud backup** | User authenticates; client generates AES key; stores key in `user_keys`; encrypts logs/settings/`ai_state` into `health_data`. |
| **Anonymized contribution** | Opt-in: client strips direct identifiers, encrypts payload, inserts into `anonymized_data` with optional `medical_condition` label and `user_id` link. |
| **On-device AI** | Deterministic `@rianell/ai-engine` + optional Transformers.js LLM using local logs; model weights from Hugging Face. |
| **Ephemeral health chat (PWA)** | Home discovery cards open `ai-chat.js` — multi-turn Q&A over local logs; **not persisted**; cleared on panel close. |

### 2.2 Scope

- **Geography:** Global users; Supabase region operator-selected.
- **Scale:** Personal project scale today; design supports growth.
- **Duration:** Account lifetime + defined retention for bug reports.

### 2.3 Context

Users are **consumers** tracking chronic illness / wellness — vulnerable to misunderstanding AI output as medical advice. Device sharing and malware are realistic threats.

### 2.4 Purposes

| Purpose | Legal basis |
|---------|-------------|
| Personal health diary | Art. 6(1)(a) + Art. 9(2)(a) consent |
| Cross-device backup | Art. 6(1)(b) + Art. 9(2)(a) |
| Research aggregation | Art. 6(1)(a) + Art. 9(2)(a) |
| AI insights (local) | Art. 6(1)(a) + Art. 9(2)(a) |

---

## 3. Necessity and proportionality

| Question | Assessment |
|----------|------------|
| Is cloud sync necessary? | **Proportionate** optional feature; local-only mode remains viable. |
| Is `user_id` on anonymized rows necessary? | **Debatable** — enables deduplication and erasure; weakens anonymization. Prefer future unlink or hash. |
| Is on-device LLM necessary? | **Optional**; fallbacks exist. User consent required. |
| Is ephemeral chat storage necessary? | **No** — chat transcript is held in memory only for the open session; no cloud sync of chat history. |
| Data minimisation | Logs limited by schema; notes capped; bug reports minimised. |

---

## 4. Risk assessment

| Risk ID | Description | Likelihood | Severity | Overall |
|---------|-------------|------------|----------|---------|
| R-DPIA-01 | DB operator reads `user_keys` and decrypts backups | Medium | Critical | **High** |
| R-DPIA-02 | RLS misconfiguration exposes rows | Low | Critical | **Medium** |
| R-DPIA-03 | Device theft exposes plaintext local logs | Medium | High | **High** |
| R-DPIA-04 | User mistakes AI summary for diagnosis | Medium | Medium | **Medium** |
| R-DPIA-05 | Re-identification from anonymized pool | Low | High | **Medium** |
| R-DPIA-06 | Prompt injection skews health narrative | Medium | Low | **Low** |
| R-DPIA-07 | Supply-chain compromise of LLM weights | Low | High | **Medium** |
| R-DPIA-08 | Incomplete erasure leaves cloud remnants | Low | High | **Medium** |

---

## 5. Mitigations

| Risk | Mitigation | Owner | Status |
|------|------------|-------|--------|
| R-DPIA-01 | Passphrase-derived keys; remove plaintext `user_keys` | Engineering | Planned — [crypto-roadmap.md](../crypto-roadmap.md) |
| R-DPIA-02 | Schema RLS; CI doc verification; manual Security Advisor | Engineering | Active |
| R-DPIA-03 | Future local encryption; user education on device lock | Engineering / UX | Planned |
| R-DPIA-04 | Disclaimers; no diagnostic claims; human edits logs | UX | Active |
| R-DPIA-05 | Strong anonymization review; limit quasi-identifiers | Privacy | Ongoing |
| R-DPIA-06 | Prompt structure; output caps — [ai-security.md](../ai-security.md) | Engineering | Active |
| R-DPIA-07 | Model allowlist; CI audits | Engineering | Active |
| R-DPIA-08 | Documented delete cloud flow; operator runbook | Engineering | Active |

---

## 6. Consultation

**Data subjects:** In-app consent modals explain cloud, research, and AI processing.  
**DPO:** Not appointed (sole operator below mandatory threshold).  
**Supervisory authority prior consultation (Art. 36):** Not required at current residual risk level after mitigations; reassess if plaintext `user_keys` remains at scale.

---

## 7. Decision

| Outcome | Detail |
|---------|--------|
| **Proceed with processing** | Yes, with documented residual risks and backlog |
| **Conditions** | Complete crypto-roadmap M-01 before marketing "encrypted cloud" as operator-proof |
| **Residual risk** | Medium — acceptable for voluntary wellness tool with explicit consent |

**Sign-off:** Project maintainer — 2026-06-13

---

## 8. Review triggers

- Implementation of passphrase-derived keys or Supabase Vault
- Server-side LLM or sharing with third-party analytics
- HIPAA BAA / clinical deployment
- Breach under [incident-response.md](../incident-response.md)
- User base > 10,000 MAU

---

## 9. Appendix — data inventory

| Field examples | Special category? | Cloud? | Anonymized pool? |
|----------------|-------------------|--------|------------------|
| fatigue, pain, flare | Yes | Encrypted | Possible derived metrics |
| medications, notes | Yes | Encrypted | Stripped in contribution |
| email (auth) | No | Supabase Auth | No |
| encryption_key hex | Security asset | Plaintext row | No |

Schema: [supabase/Schema.sql](../../supabase/Schema.sql)
