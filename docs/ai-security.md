# AI security — on-device LLM and deterministic analysis

**Product:** Rianell  
**Last updated:** 2026-06-13 (v1.60.0 — prompt packs, locale contract, UGC delimiters)  
**Related:** [ai-architecture.md](ai-architecture.md) · [threat-model.md](threat-model.md) · [dpia-health-sync.md](privacy/dpia-health-sync.md) · [SECURITY.md](SECURITY.md)

---

## 1. AI surfaces in Rianell

| Surface | Technology | Data leaves device? | User control |
|---------|------------|---------------------|--------------|
| **Deterministic analysis** | `@rianell/ai-engine` (regression, correlation, flare prediction) | No | Always on when user runs AI Analysis |
| **On-device LLM (PWA)** | Transformers.js + weights from **Supabase Storage** (chunked) or Hugging Face fallback | Weights downloaded from Supabase/HF; **prompts stay on device** | Consent modal + blocking/skippable download UI by platform |
| **On-device LLM (RN)** | `@rianell/llm` + `llmNative.ts` (chunk download + cache) | Same as PWA | `AiModelDownloadGate` blocking modal + consent |
| **Rule-based fallbacks** | Shared MOTD / summary templates | No | Automatic when LLM unavailable or times out |
| **Anonymized training pool** | Encrypted blobs in `anonymized_data` | Yes (opt-in) | Separate consent in settings |

There is **no server-side LLM inference** in the current architecture. Cloud sync stores encrypted backups and optional anonymized contributions only.

---

## 2. On-device LLM architecture

```mermaid
flowchart TB
  subgraph inputs [Inputs — user-controlled]
    Logs[Filtered health logs]
    Notes[Free-text notes]
    Intent[Intent: summary · suggest · motd]
  end

  subgraph guard [Pre-inference]
    Consent[LLM consent flag]
    Tier[Model tier setting]
    Timeout[Resilience timeout]
  end

  subgraph runtime [Runtime]
    TJ[Transformers.js pipeline]
    Cache[Model cache IDB / FS / Cache API]
    SB[Supabase Storage chunks]
    HF[Hugging Face CDN fallback]
  end

  subgraph outputs [Outputs]
    Text[Generated text]
    Fallback[Rule-based fallback]
    UI[escapeHTML / text nodes]
  end

  Logs --> Consent
  Notes --> Consent
  Intent --> Consent
  Consent --> Tier
  Tier --> TJ
  HF --> Cache --> TJ
  SB --> Cache
  TJ --> Timeout
  Timeout -->|success| Text
  Timeout -->|fail| Fallback
  Text --> UI
  Fallback --> UI
```

**Package references:** `packages/llm/src/index.mjs` (model IDs, context shape), PWA LLM loader, RN `llmNative.ts` placeholder.

---

## 3. Prompt injection and untrusted content

### 3.1 Threat

Health **notes**, **symptoms**, and imported log text are **user-controlled** and may contain adversarial instructions ("ignore previous instructions…"). Because inference runs locally, the primary impact is:

- Misleading health summaries shown to the user
- Inappropriate "suggest note" text appended to medical records
- Wasted compute / denial of UX (infinite loops rare but possible with pathological prompts)

There is **no cross-user** prompt injection path today (no shared server prompt store).

### 3.2 Controls (current)

| Control | Implementation |
|---------|----------------|
| **UGC delimiters (v1.60)** | User notes in LLM context wrapped in `---USER_NOTE---` / `---END_USER_NOTE---` (`summary-llm.js`); notes never passed through UI translation |
| Structured prompts | Intent-specific templates (`buildLlmContext`) separate system instructions from user payload |
| Output length caps | Suggest-note append capped (500 chars on medications step) |
| Timeout + fallback | Rule-based summary/MOTD if LLM stalls |
| HTML safety | User-visible LLM output rendered via `escapeHTML` / text nodes, not raw `innerHTML` |
| No tool execution | LLM has no API keys, SQL, or network tools in the pipeline |

### 3.3 Controls (backlog)

| ID | Control | Priority |
|----|---------|----------|
| AI-01 | Delimiter hardening and instruction hierarchy in prompt templates | P1 |
| AI-02 | Output schema validation (reject non-prose / markup) | P2 |
| AI-03 | Optional "strict mode" — deterministic analysis only | P2 |
| AI-04 | Log redaction layer before prompt assembly (strip URLs, script-like tokens) | P3 |

See [threat-model.md](threat-model.md) M-08.

---

## 4. Model supply chain

### 4.1 Sources

| Artifact | Source | Integrity |
|----------|--------|-----------|
| Transformers.js | Dynamic import / jsDelivr (CSP `connect-src`) | Version pinned in package lock; no SRI on dynamic import |
| Model weights | `huggingface.co` / Xet bridge hosts | Model ID whitelist in `@rianell/llm` |
| Tokenizers / configs | Bundled with model repo | HF commit hash implicit in cache |

### 4.2 Risks

- **Compromised Hugging Face account** publishing malicious weights under a similar model name
- **CDN substitution** if TLS or DNS compromised
- **Supply-chain in npm** (`@xenova/transformers` or successors)

### 4.3 Mitigations

1. **Allowlist model IDs** — only `SmolLM2-360M-Instruct` and `Llama-3.2-1B-Instruct` tiers unless explicitly extended in release notes.
2. **CI scanning** — `npm audit`, OSV-Scanner, Gitleaks per [SECURITY.md](SECURITY.md).
3. **CSP `connect-src`** — limits fetch targets to known HF hosts (see `index.html`).
4. **Cache inspection** — operators can clear model cache from settings when behaviour is anomalous.
5. **Future:** verify weight checksums against published SHA256 in repo metadata before first run.

### 4.4 Update policy

- Model tier changes require CHANGELOG entry, parity check, and DPIA delta if new data processing occurs.
- Do not auto-pull `latest` from HF; pin revision in code or config.

---

## 5. Privacy and special-category data

On-device LLM processing uses **health logs and notes** (GDPR Art. 9 special category). Legal basis and DPIA: [dpia-health-sync.md](privacy/dpia-health-sync.md), [eu-gdpr.md](privacy/eu-gdpr.md).

| Principle | Position |
|-----------|----------|
| Data minimisation | Prompts include only logs in selected date range + intent-specific fields |
| Storage limitation | Model cache is technical artifact, not health data; clearable by user |
| Transparency | Settings → Performance explains on-device AI and HF download |
| No automated legal decisions | Outputs are informational only |

---

## 6. GDPR Article 22 — automated decision-making

**Article 22** restricts decisions based **solely** on automated processing that produce **legal or similarly significant effects**.

### 6.1 Rianell position

| Question | Answer |
|----------|--------|
| Does the app make solely automated decisions with legal/similar effect? | **No.** Insights, summaries, and suggestions are informational wellness aids. |
| Could outputs influence significant health choices? | **Possibly**, but user retains full control; no binding triage, insurance, or employment decisions. |
| Is human review offered? | User reviews and edits all logs; AI output is advisory. |
| Right to contest? | User may disable LLM, ignore output, or delete logs. |

**Formal statement (for privacy policy):** Rianell does not use automated processing to make decisions that produce legal or similarly significant effects on data subjects. AI features provide optional, non-binding health insights. Users are not subject to a decision based solely on automated processing without meaningful human involvement in any regulated sense.

If future features introduce **automated triage**, **insurer reporting**, or **clinical pathways**, revisit this section and conduct a new DPIA before launch.

---

## 7. Deterministic AI engine (non-LLM)

`@rianell/ai-engine` performs statistical analysis on local logs. Risks:

| Risk | Mitigation |
|------|------------|
| Misleading correlation → user harm | Disclaimers in UI; "not medical advice" |
| Numeric instability on small samples | Low-sample guards in charts/AI UI |
| Re-identification via anonymized pool | Encryption + contribution opt-in separate from backup |

---

## 8. Incident scenarios

| Scenario | Severity | Response |
|----------|----------|----------|
| Malicious HF model served | P1 | Disable LLM via feature flag; rotate cache; notify users if integrity check fails |
| Prompt injection causes harmful text | P2 | Patch templates; document in [incident-response.md](incident-response.md) |
| LLM library CVE | P1–P2 | `npm audit` triage; emergency release |

---

## 9. Testing and assurance

- Parity gates: `parity:web`, `parity:android`, `parity:ios` include LLM consent paths.
- Manual: verify LLM disabled → fallback strings only.
- Regression: suggest-note cap, timeout fallback, CSP allows HF fetch on production host.

---

## 10. References

- Transformers.js — https://huggingface.co/docs/transformers.js
- ICO guidance on AI and data protection — https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/artificial-intelligence/
- Rianell platform parity — [platform-parity.md](platform-parity.md)
