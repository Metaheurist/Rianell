# EU AI Act - provider self-assessment (Rianell)

**Product:** Rianell personal health dashboard  
**Last updated:** 2026-06-23  
**Status:** Launch audit Phase 4 - operator checklist. Not legal advice.  
**Related:** [ropa.json](../privacy/ropa.json) · [ai-security.md](../ai-security.md) · [global-baseline.md](../privacy/global-baseline.md)

---

## 1. Role and scope

| Question | Assessment |
|----------|------------|
| Is Rianell a **high-risk AI system** under Annex III (health)? | **No** - on-device summaries and pattern hints are **wellness support**, not diagnostic or treatment decisions. Users retain control; outputs are not clinical directives. |
| Provider vs deployer | **Provider** for the shipped PWA; users are **deployers** of their own data on device. |
| GPAI / foundation models | Rianell downloads **open-weight** models (Hugging Face) for **local inference**; no fine-tuning of third-party GPAI for product training today. |

---

## 2. Transparency (Art. 50)

| Control | Implementation |
|---------|----------------|
| Users know when AI is used | Settings → AI & Goals; AI tab labelling; first-run disclosure for model download |
| Synthetic / generated text | Summaries labelled as AI-assisted; coach persona selectable |
| Deep fake / impersonation | Not applicable |

---

## 3. Human oversight

- Users can disable AI (`aiEnabled`), defer model download, and delete local logs.
- PHQ-9/GAD-7 screening shows crisis resources; not automated triage.
- No autonomous changes to medications or care plans.

---

## 4. Data governance

- Health logs: device-first; cloud backup encrypted when enabled.
- No automated profiling for employment, insurance, or credit.
- Anonymized pool: opt-in, k-anonymity RPCs; see Plan 13 docs.

---

## 5. Technical documentation (minimal)

| Artifact | Location |
|----------|----------|
| Threat model | [threat-model.md](../threat-model.md) |
| AI security | [ai-security.md](../ai-security.md) |
| RoPA AI activities | [ropa.json](../privacy/ropa.json) |
| Model sources | Hugging Face Hub; pinned versions in `cdn-manifest.json` |

---

## 6. Conformity actions before EU marketing claims

1. Legal review if positioning shifts toward **clinical decision support**.
2. Maintain incident process for model supply-chain issues (HF outage, malicious weights).
3. Document major model version changes in [CHANGELOG.md](../CHANGELOG.md).
4. Re-run this checklist when adding **remote** inference (non on-device).

---

## 7. Sign-off

| Field | Value |
|-------|-------|
| Reviewer | _Operator name_ |
| Date | _YYYY-MM-DD_ |
| Next review | _Quarterly or on major AI feature_ |
