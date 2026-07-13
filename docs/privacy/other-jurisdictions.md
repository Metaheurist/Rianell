# Privacy - other jurisdictions

**Product:** Rianell  
**Last updated:** 2026-06-13  
**Related:** [global-baseline.md](global-baseline.md) · [eu-gdpr.md](eu-gdpr.md) · [incident-response.md](../incident-response.md)

---

## 1. Purpose

Supplements EU/UK GDPR coverage with high-level obligations for users in other markets. **Not legal advice** - engage qualified counsel before regulated health deployments.

---

## 2. United Kingdom

| Topic | Requirement | Rianell alignment |
|-------|-------------|-------------------|
| **UK GDPR** | Same principles as EU GDPR post-UK adequacy | [eu-gdpr.md](eu-gdpr.md) applies mutatis mutandis |
| **ICO registration** | Fee if processing personal data as controller | Assess when UK user base is material |
| **PECR** | Cookies / similar technologies | Cookie consent banner in PWA |
| **Art. 22** | Automated decisions | [ai-security.md](../ai-security.md) |
| **Breach** | 72h to ICO | [incident-response.md](../incident-response.md) |

---

## 3. United States

### 3.1 HIPAA

| Question | Rianell position |
|----------|------------------|
| Is Rianell a covered entity or business associate? | **No** - consumer wellness app; operator is not a healthcare provider, health plan, or clearinghouse. |
| Can users store PHI? | Users may enter health information; operator does not provide HIPAA-compliant BAA by default. |
| Enterprise HIPAA need | Evaluate **Supabase HIPAA Projects** - [crypto-roadmap.md](../crypto-roadmap.md) |

**User notice:** "Rianell is not HIPAA-compliant. Do not use as a substitute for professional medical records systems unless your organisation has executed appropriate agreements."

### 3.2 CCPA / CPRA (California)

| Element | Implementation |
|---------|----------------|
| Categories collected | Health metrics, identifiers, internet activity (IP via CDN) |
| Sale / share | **No sale**; no cross-context behavioral advertising |
| Sensitive personal information | Health data - limit use to providing app features |
| Rights | Know, delete, correct, opt-out of sale (N/A), limit SPI use |
| Notice at collection | Privacy policy + in-app disclosures |
| **DSAR** | [data-subject-rights.md](data-subject-rights.md) |

### 3.3 FTC Health Breach Notification Rule (HBNR)

Applies to **PHR vendors** and related entities not covered by HIPAA.

| Factor | Assessment |
|--------|------------|
| Is Rianell a PHR vendor? | **Likely not** at current scale/product definition - monitor FTC guidance if positioning changes to "personal health record" with provider integrations. |
| If HBNR applies | Notify FTC + users **without unreasonable delay** (60 days historically cited; verify current rule). |

### 3.4 Other US states

Virginia (VCDPA), Colorado (CPA), Connecticut (CTDPA), Texas, Oregon, etc. - align with GDPR-style rights where applicable; maintain unified DSAR process.

---

## 4. Canada (PIPEDA / provincial)

| Topic | Notes |
|-------|-------|
| **PIPEDA** | Consent, limiting collection, safeguards, openness |
| **Alberta HIA / BC FIPPA** | Extra health-specific rules for custodians - Rianell is not a custodian |
| **Breach** | Report to OPC if real risk of significant harm |
| **Cross-border** | Subprocessors in US - disclose in privacy notice |

---

## 5. Brazil (LGPD)

| LGPD element | Rianell approach |
|--------------|------------------|
| Legal bases | Consent for health (sensitive); contract for account |
| ANPD | Monitor registration guidance for small controllers |
| Rights | Confirmation, access, correction, anonymization, portability, deletion |
| DPO | Not mandatory for all controllers - assess |
| International transfer | SCC-style mechanisms via subprocessors |

---

## 6. Australia

| Framework | Requirement |
|-----------|-------------|
| **Privacy Act 1988 + APPs** | Open/transparent; collection notice; security; access/correction |
| **Notifiable Data Breaches** | 30-day assessment; notify OAIC + individuals if serious harm likely - [incident-response.md](../incident-response.md) §6 |
| **My Health Records Act** | N/A - Rianell does not integrate with My Health Record |
| **TGA** | Wellness positioning; not a medical device unless therapeutic claims added |

---

## 7. India (DPDPA 2023)

| Element | Notes |
|---------|-------|
| Significant data fiduciary | Unlikely at current scale |
| Consent | Free, specific, informed; health is sensitive personal data |
| Cross-border | Government notification rules may evolve - monitor |
| Rights | Access, correction, erasure |
| Children's data | Verifiable parental consent under 18 |

---

## 8. Cross-jurisdiction incident matrix

| Jurisdiction | Authority | Deadline | Template location |
|--------------|-----------|----------|-------------------|
| EU/EEA | Lead SA | 72h | [incident-response.md](../incident-response.md) Art. 33 |
| UK | ICO | 72h | Same template |
| Australia | OAIC | ASASP after assessment (≤30d) | incident-response §6 |
| US (state) | AG (varies) | 30-72h typical | State AG portals |
| Canada | OPC / provincial | ASASP | OPC breach form |
| Brazil | ANPD | Reasonable time | ANPD guidance |

---

## 9. Product positioning safeguards

To avoid triggering heavier health regimes:

- Do not claim diagnosis, treatment, or cure.
- Do not integrate with provider EHR without BAAs.
- Do not market as HIPAA-compliant until BAA + controls in place.

---

## 10. Review

| Date | Change |
|------|--------|
| 2026-06-13 | Initial multi-jurisdiction schedule |

Next review: **2026-12-01**
