# EU / UK GDPR compliance mapping - Rianell

**Product:** Rianell  
**Last updated:** 2026-06-13  
**Related:** [global-baseline.md](global-baseline.md) · [data-subject-rights.md](data-subject-rights.md) · [dpia-health-sync.md](dpia-health-sync.md) · [incident-response.md](../incident-response.md)

---

## 1. Applicability

This mapping covers **Regulation (EU) 2016/679 (GDPR)** and **UK GDPR** (as retained and amended) for Rianell when offered to individuals in the EEA and UK.

Rianell processes **special category data** (health) under Art. 9. Primary establishment may be outside the EU; appoint EU/UK representative if required under Art. 27 once scale thresholds are met.

---

## 2. Article-by-article mapping

| Article | Requirement | Rianell implementation | Evidence / gap |
|---------|-------------|--------------------------|----------------|
| **Art. 5** Principles | Lawfulness, fairness, transparency, purpose limitation, minimisation, accuracy, storage limitation, integrity/confidentiality, accountability | Local-first design; encrypted cloud option; RLS; RoPA | [global-baseline.md](global-baseline.md), [ropa.json](ropa.json) |
| **Art. 6** Lawful basis | Valid basis for each processing | Matrix in global-baseline §5 | Consent + contract documented in UI |
| **Art. 7** Conditions for consent | Freely given, specific, informed, unambiguous; easy withdraw | GDPR modal; settings toggles | Withdraw via disable sync |
| **Art. 8** Child consent | Parental gate for under-16 (EEA) | Not targeted at children | Age gate backlog if needed |
| **Art. 9** Special categories | Explicit consent for health | Health consent before logging | `showGDPRAgreementModal` in PWA |
| **Art. 10** Criminal data | N/A | No criminal data processed | - |
| **Art. 11** No ID needed | Cannot require ID beyond necessity | Email for account only | - |
| **Art. 12** Transparent info | Clear, accessible privacy info | In-app policy + docs | Link from settings |
| **Art. 13** Info at collection | Privacy notice at first collection | Consent modals + about | [data-subject-rights.md](data-subject-rights.md) |
| **Art. 14** Info when not from subject | N/A for direct collection | - | - |
| **Art. 15** Right of access | Copy of personal data | Export JSON + cloud fetch | PWA/RN export paths |
| **Art. 16** Rectification | Correct inaccurate data | In-app log edit | Logs edit wizard |
| **Art. 17** Erasure | Delete personal data | Delete cloud + local clear | Preserves anonymized if legally anonymized |
| **Art. 18** Restriction | Limit processing | Disable sync / AI | Settings |
| **Art. 19** Notify restriction | Inform recipients | Manual (few recipients) | Subprocessors list |
| **Art. 20** Portability | Machine-readable export | JSON export | Shared schema `@rianell/shared` |
| **Art. 21** Object | Object to processing | Disable features | Legitimate interest balancing for bug reports |
| **Art. 22** Automated decisions | No solely automated legal/significant effects | Informational AI only | [ai-security.md](../ai-security.md) §6 |
| **Art. 23** Restrictions | Member state law | Monitor national health laws | - |
| **Art. 24** Responsibility | Controller accountability | Documentation set | This folder + SECURITY.md |
| **Art. 25** Data protection by design/default | Privacy defaults | Local-first; opt-in cloud | - |
| **Art. 26** Joint controllers | N/A | Single controller model | - |
| **Art. 27** EU representative | If no EU establishment | Not appointed below Art. 27 threshold | Review on growth |
| **Art. 28** Processors | DPA with subprocessors | [subprocessors.md](subprocessors.md) | Standard DPAs |
| **Art. 29** Processing under authority | N/A | - | - |
| **Art. 30** Records (RoPA) | Written processing records | [ropa.json](ropa.json) | Machine-readable |
| **Art. 31** Cooperation with SA | Respond to authority | [incident-response.md](../incident-response.md) | - |
| **Art. 32** Security | Appropriate TOMs | RLS, encryption, CI audits | [threat-model.md](../threat-model.md) |
| **Art. 33** Breach notify SA | 72 hours | Template in incident-response | - |
| **Art. 34** Breach notify users | High risk | User notice template | - |
| **Art. 35** DPIA | High-risk processing | [dpia-health-sync.md](dpia-health-sync.md) | Health + cloud + AI |
| **Art. 36** Prior consultation | High risk after DPIA | Not triggered yet | - |
| **Art. 37-39** DPO | Mandatory in some cases | No DPO appointed (sole operator) | Reassess at scale |
| **Art. 40-43** Codes / certification | Voluntary | None | - |
| **Art. 44-49** Transfers | SCCs for third countries | Supabase/HF/US providers | Region selection |
| **Art. 77-82** Remedies | Complaint, compensation | Contact in privacy notice | - |

---

## 3. Transparency checklist (Arts. 12-14)

Privacy notice must include:

- [x] Controller identity and contact
- [x] Purposes and legal bases
- [x] Categories of personal data (health, account, technical)
- [x] Recipients / subprocessors ([subprocessors.md](subprocessors.md))
- [x] Transfers outside EEA
- [x] Retention periods
- [x] Data subject rights and how to exercise them
- [x] Right to withdraw consent
- [x] Right to lodge complaint with supervisory authority
- [x] Whether provision is statutory/contractual
- [x] Automated decision-making / profiling (none with legal effect)

---

## 4. Security measures (Art. 32)

| Measure | Status |
|---------|--------|
| Encryption in transit (TLS) | Active |
| Encryption at rest (cloud blobs AES-GCM) | Active |
| Access control (RLS, auth) | Active - verify on deploy |
| Key management | **Gap:** plaintext `user_keys` - [crypto-roadmap.md](../crypto-roadmap.md) |
| Pseudonymisation (anonymized pool) | Partial - `user_id` still linked |
| Resilience / restore | User export + cloud backup |
| Testing (CI security audit) | Active |
| Staff access minimisation | Sole maintainer |

---

## 5. DPIA and Art. 35

High-risk indicators present:

- Systematic monitoring of health (wellness context)
- Large-scale special category data (if user base grows)
- Innovative technology (on-device LLM)

**Outcome:** DPIA completed - [dpia-health-sync.md](dpia-health-sync.md). Residual risks accepted with mitigation backlog.

---

## 6. International transfers (Arts. 44-49)

| Provider | Mechanism |
|----------|-----------|
| Supabase | DPA + SCCs; prefer EU region |
| GitHub / Cloudflare / Hugging Face | Standard contractual terms + SCCs where applicable |
| PayPal | Merchant DPA |

Document transfer impact assessment (TIA) when EU user share exceeds internal threshold (e.g. 10% MAU).

---

## 7. Supervisory authority

Users may lodge complaints with their local SA. Operator without EU establishment should monitor **Art. 27** representative requirement.

**ICO (UK):** https://ico.org.uk/make-a-complaint/  
**EU list:** https://edpb.europa.eu/about-edpb/about-edpb/members_en

---

## 8. Review log

| Date | Reviewer | Notes |
|------|----------|-------|
| 2026-06-13 | Maintainer | Initial Art. 5-49 mapping for v1.49.x |

Next review: **2026-12-01** or upon crypto-roadmap milestone completion.
