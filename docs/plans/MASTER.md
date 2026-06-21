# Rianell execution plans — MASTER

Single source of truth for required features, execution plans, and progress. **Agents: update `Status` and `Plan status` when starting or finishing work.**

**Index:** [`00-execution-index.md`](00-execution-index.md) · [`SECURITY-PERFORMANCE-INDEX.md`](SECURITY-PERFORMANCE-INDEX.md) · [`FINAL-EXECUTION-CHECK.md`](FINAL-EXECUTION-CHECK.md) · **Last updated:** 2026-06-19 (Plans 01–14 complete; v1.111.0 CI green)

---

## Progress summary

| Metric | Count |
|--------|-------|
| Execution plans complete | 14 / 14 |
| Feature IDs done | 85 / 85 |
| Cross-cutting themes done | 5 / 5 |
| Last CI run (post-plan) | [green](https://github.com/Metaheurist/Rianell/actions/runs/27845245487) v1.111.0 |
| Last local gate | 302/302 unit tests · `verify:migration` OK |

**Status values:** `pending` · `in_progress` · `done` · `deferred`

---

## Section rollup

| Exec | § | Section | Plan | Plan status | Features done | CI |
|------|---|---------|------|-------------|---------------|-----|
| 01 | 13 | Platform & architecture | [plan-01](plan-01-platform-architecture/plan.md) | done | 2/2 | [green](https://github.com/Metaheurist/Rianell/actions/runs/27774025951) |
| 02 | 10 | Accessibility & i18n | [plan-02](plan-02-accessibility-i18n/plan.md) | done | 5/5 | [green](https://github.com/Metaheurist/Rianell/actions/runs/27775707987) |
| 03 | 6 | Settings & onboarding | [plan-03](plan-03-settings-onboarding/plan.md) | done | 8/8 | [green](https://github.com/Metaheurist/Rianell/actions/runs/27778067467) |
| 04 | 2 | Logging & data capture | [plan-04](plan-04-logging-data-capture/plan.md) | done | 9/9 | [green](https://github.com/Metaheurist/Rianell/actions/runs/27782910961) |
| 05 | 7 | Privacy & compliance | [plan-05](plan-05-privacy-compliance/plan.md) | done | 7/7 | [green](https://github.com/Metaheurist/Rianell/actions/runs/27792882132) |
| 06 | 8 | Cloud sync & portability | [plan-06](plan-06-cloud-sync/plan.md) | done | 7/7 | [green](https://github.com/Metaheurist/Rianell/actions/runs/27792882132) |
| 07 | 4 | AI engine (deterministic) | [plan-07](plan-07-ai-engine/plan.md) | done | 8/8 | [green](https://github.com/Metaheurist/Rianell/actions/runs/27806960853) |
| 08 | 5 | On-device LLM & NLP | [plan-08](plan-08-llm-nlp/plan.md) | done | 10/10 | [green](https://github.com/Metaheurist/Rianell/actions/runs/27809171398) |
| 09 | 3 | Charts & analytics | [plan-09](plan-09-charts-analytics/plan.md) | done | 10/10 | [green](https://github.com/Metaheurist/Rianell/actions/runs/27830878522) |
| 10 | 1 | Home & dashboard | [plan-10](plan-10-home-dashboard/plan.md) | done | 7/7 | [green](https://github.com/Metaheurist/Rianell/actions/runs/27834496354) |
| 11 | 9 | Notifications & engagement | [plan-11](plan-11-notifications/plan.md) | done | 6/6 | [green](https://github.com/Metaheurist/Rianell/actions/runs/27839577970) |
| 12 | 11 | Clinician & sharing | [plan-12](plan-12-clinician-sharing/plan.md) | done | 4/4 | [green](https://github.com/Metaheurist/Rianell/actions/runs/27841255831) |
| 13 | 12 | Research & anonymized pool | [plan-13](plan-13-research-community/plan.md) | done | 2/2 | [green](https://github.com/Metaheurist/Rianell/actions/runs/27842548791) |
| 14 | 14 | Cross-cutting concepts | [plan-14](plan-14-cross-cutting/plan.md) | done | 5/5 | [green](https://github.com/Metaheurist/Rianell/actions/runs/27845245487) |

---

## Agent progress protocol

1. Before starting a plan: set its **Plan status** to `in_progress` in the table above; set affected feature rows to `in_progress`.
2. After each feature ships (or is explicitly deferred): set feature **Status** to `done` or `deferred`; add one-line note if deferred.
3. When all features in a plan are `done` or `deferred`: run **[ROLLOUT-GATE](ROLLOUT-GATE.md)** (local gate → CHANGELOG → commit → CI watch loop until green).
4. Only then set **Plan status** to `done`; update plan frontmatter `status: done`; record CI run URL in §Section rollup **CI** column and **Last CI run** in progress summary.
5. Recalculate **Progress summary** counts.

---

## 1. Home & dashboard

**Plan:** [plan-10-home-dashboard/plan.md](plan-10-home-dashboard/plan.md) (exec 10)

| ID | Status | Feature | Tags | Notes |
|----|--------|---------|------|-------|
| H1 | done | **Adaptive home layout** — reorder cards by usage | M, ★ | v1.101.0 card registry |
| H2 | done | **Energy budget / pacing widget** — daily spoons from fatigue + flare history | M, ★ | v1.102.0 Home widget |
| H3 | done | **Good day streak & flare-free counter** | Q | v1.103.0 dismissible card |
| H4 | done | **Micro-check-ins** — partial logs from Mood tab | M | v1.113.0 Mood tab; was Home v1.102.0 |
| H5 | done | **Weather & environment strip** — barometric/AQI opt-in | M | v1.113.0 inline header; was card v1.103.0 |
| H6 | done | **Appointment countdown card** | Q | v1.113.0 removed from Home; CL1 PDF prep v1.109.0 |
| H7 | done | **Contextual home questions** — LLM from yesterday's gaps | M, ★ | v1.104.0 gap detection |

---

## 2. Logging & data capture

**Plan:** [plan-04-logging-data-capture/plan.md](plan-04-logging-data-capture/plan.md) (exec 04)

| ID | Status | Feature | Tags | Notes |
|----|--------|---------|------|-------|
| L1 | done | **Progressive tracking profiles** | M, ★ | Pairs S2 |
| L2 | done | **Favorite meals / exercises / med combos** | Q | |
| L3 | done | **Medication scheduler** | L | Blocks R2 |
| L5 | done | **Barcode / photo food logging** | L | Open Food Facts on RN |
| L6 | done | **Symptom templates by condition** | M | User-learned in settings; not global |
| L7 | done | **Menstrual cycle module** | M | Blocks C4 |
| L8 | done | **Multi-entry per day** | M | Pairs H4 |
| L9 | done | **Offline queue on RN** | Q | Wire offlineQueue.ts |
| L11 | done | **Guided voice log** | L, ★ | Deterministic extract + flag |

---

## 3. Charts & analytics

**Plan:** [plan-09-charts-analytics/plan.md](plan-09-charts-analytics/plan.md) (exec 09)

| ID | Status | Feature | Tags | Notes |
|----|--------|---------|------|-------|
| C1 | done | **Automatic correlation cards** | M, ★ | v1.98.0 Charts PWA+RN |
| C2 | done | **Flare post-mortem view** | M | v1.98.0 7-day window |
| C3 | done | **Radar / spider chart on RN** | M | v1.100.0 SVG radar |
| C4 | done | **Menstrual overlay on charts** | M | v1.99.0 phase bands PWA+RN |
| C5 | done | **Compare periods** | M | v1.99.0 month vs month |
| C6 | done | **Export chart PNG/PDF** | Q | v1.100.0 PWA+RN PDF |
| C7 | done | **Uncertainty bands on predictions** | Q | v1.98.0 lower/upper band |
| C8 | done | **Custom metrics** | M | v1.100.0 schema + picker |
| C9 | done | **Spoon / pacing chart** | M | v1.99.0 planned vs actual |
| C10 | done | **Remember chart view preference** | Q | v1.98.0 PWA restore saved chartView |

---

## 4. AI engine & deterministic analysis

**Plan:** [plan-07-ai-engine/plan.md](plan-07-ai-engine/plan.md) (exec 07)

| ID | Status | Feature | Tags | Notes |
|----|--------|---------|------|-------|
| A1 | done | **Unify neural pipeline in @rianell/ai-engine** | M, ★ | v1.94.0 shared ranking |
| A2 | done | **Insight confidence & why expansion** | M | v1.94.0 RN tap expand |
| A3 | done | **Trigger hypothesis engine** | M, ★ | v1.94.0 flare lift |
| A4 | done | **Treatment A/B timeline** | M | v1.94.0 compareTreatmentWindows |
| A5 | done | **Anomaly detection alerts** | M | v1.94.0 local baseline |
| A6 | done | **Weekly digest (deterministic)** | Q | v1.94.0 |
| A7 | done | **Condition-specific analysis packs** | L | v1.94.0 migraine/IBS |
| A8 | done | **Export analysis JSON for research** | M | v1.94.0 opt-in export |

---

## 5. On-device LLM & NLP

**Plan:** [plan-08-llm-nlp/plan.md](plan-08-llm-nlp/plan.md) (exec 08)

| ID | Status | Feature | Tags | Notes |
|----|--------|---------|------|-------|
| N1 | done | **Bounded Ask about my week chat** | L, ★ | v1.96.0 max 5 turns |
| N2 | done | **Clinician visit prep brief** | M, ★ | v1.95.0 RN + PWA |
| N3 | done | **Explain this chart** | M, ★ | v1.95.0 RN Charts |
| N4 | done | **Multilingual LLM enforcement** | Q | v1.95.0 ui-only gate |
| N5 | done | **Structured JSON output mode** | M | v1.95.0 schema validate |
| N6 | done | **Diary coach personas** | Q | v1.96.0 settings + prompt pack |
| N7 | done | **Smaller instant model tier** | L | v1.96.0 MOTD/suggest → tier1 |
| N9 | done | **Golden prompt regression expansion** | Q | v1.97.0 8×14 locale audit + CI |
| N10 | done | **GGUF Path 3 completion** | L | v1.97.0 adapter API + gguf branch |
| N11 | done | **Remote LLM parity on PWA** | M | v1.97.0 on-device-only policy |

---

## 6. Settings, personalization & onboarding

**Plan:** [plan-03-settings-onboarding/plan.md](plan-03-settings-onboarding/plan.md) (exec 03)

| ID | Status | Feature | Tags | Notes |
|----|--------|---------|------|-------|
| S1 | done | **RN tutorial parity** | M | v1.92.7 |
| S2 | done | **Tracking profile wizard** | M | v1.92.7; unblocks L1 |
| S3 | done | **Smart defaults from region/locale** | Q | v1.92.7 |
| S4 | done | **Settings search** | Q | v1.92.7 |
| S5 | done | **Simple mode toggle** | Q | v1.92.7 |
| S6 | done | **Profile avatars / display name themes** | Q | v1.92.7 |
| S7 | done | **Consent dashboard** | M, ★ | v1.92.7 |
| S8 | done | **Export settings + goals profile** | Q | v1.92.7 |

---

## 7. Privacy, compliance & trust

**Plan:** [plan-05-privacy-compliance/plan.md](plan-05-privacy-compliance/plan.md) (exec 05)

| ID | Status | Feature | Tags | Notes |
|----|--------|---------|------|-------|
| P1 | done | **Full policy document viewer** | M | Body paragraphs in RN + PWA |
| P2 | done | **Data processing activity log** | M, ★ | S7 trust pane |
| P3 | done | **Local-only mode** | M, ★ | Network gates PWA + RN |
| P4 | done | **E2E encrypted export** | M | PBKDF2 + AES-GCM |
| P5 | done | **DPIA helper for contributors** | Q | Anon pool field checklist |
| P6 | done | **Teen / caregiver mode** | L | v1.93.1 proxy metadata on logs |
| P7 | done | **Biometric app lock** | M | RN biometrics; PWA passcode |

---

## 8. Cloud sync & data portability

**Plan:** [plan-06-cloud-sync/plan.md](plan-06-cloud-sync/plan.md) (exec 06)

| ID | Status | Feature | Tags | Notes |
|----|--------|---------|------|-------|
| D1 | done | **RN CSV export/import** | Q | v1.93.0; PWA parity |
| D2 | done | **Scheduled auto-sync** | M | On app open; P3 respected |
| D3 | done | **Conflict resolution UI** | M | RN alert + PWA modal |
| D4 | done | **FHIR-lite export bundle** | L | v1.93.1 LOINC-lite Observations |
| D5 | done | **Import Bearable / Flaredown / CSV** | M | v1.93.1 migration assistants |
| D6 | done | **Clinician read-only link** | L | v1.93.1 encrypted share envelope |
| D7 | done | **Backup to user-owned cloud** | L | v1.93.1 WebDAV PUT |

---

## 9. Notifications & engagement

**Plan:** [plan-11-notifications/plan.md](plan-11-notifications/plan.md) (exec 11)

| ID | Status | Feature | Tags | Notes |
|----|--------|---------|------|-------|
| R1 | done | **Smart reminder timing** | M | v1.105.0 median + 30min nudge |
| R2 | done | **Medication dose reminders** | M | v1.106.0 L3 local reminders |
| R3 | done | **Flare risk nudge** | M, ★ | v1.106.0 A5 fatigue week |
| R4 | done | **Web Push on PWA (production)** | M | v1.107.0 VAPID + consent gates |
| R5 | done | **Gentle re-engagement** | Q | v1.107.0 7-day idle nudge |
| R6 | done | **Achievement-free streaks** | Q | v1.108.0 H3-paired optional nudge |

---

## 10. Accessibility & internationalization

**Plan:** [plan-02-accessibility-i18n/plan.md](plan-02-accessibility-i18n/plan.md) (exec 02)

| ID | Status | Feature | Tags | Notes |
|----|--------|---------|------|-------|
| I1 | done | **Close i18n gaps** | Q | v1.92.6 |
| I2 | done | **Plain-language / B1 reading level option** | M | v1.92.6 |
| I3 | done | **Haptic feedback patterns (RN)** | Q | v1.92.6 |
| I4 | done | **Audio log playback (TTS)** | Q | v1.92.6 |
| I5 | done | **High-contrast chart palettes** | Q | v1.92.6; chart QA with plan 09 |

---

## 11. Clinician & sharing workflows

**Plan:** [plan-12-clinician-sharing/plan.md](plan-12-clinician-sharing/plan.md) (exec 12)

| ID | Status | Feature | Tags | Notes |
|----|--------|---------|------|-------|
| CL1 | done | **Appointment mode PDF** | M, ★ | v1.109.0 H6 prep → PDF |
| CL2 | done | **QR code handoff** | M | v1.109.0 P4 encrypted ephemeral |
| CL4 | done | **Medication timeline** | M | v1.109.0 A4-aligned rows |
| CL5 | done | **Questions for my doctor (LLM)** | M, ★ | v1.109.0 doctorQuestions intent |

---

## 12. Community & research (anonymized pool)

**Plan:** [plan-13-research-community/plan.md](plan-13-research-community/plan.md) (exec 13)

| ID | Status | Feature | Tags | Notes |
|----|--------|---------|------|-------|
| RE1 | done | **Aggregate insights back to contributors** | L, ★ | v1.110.0 k≥5 RPC + AI panel |
| RE4 | done | **Export personal contribution history** | Q | v1.110.0 JSON export Settings |

---

## 13. Platform, architecture & developer experience

**Plan:** [plan-01-platform-architecture/plan.md](plan-01-platform-architecture/plan.md) (exec 01)

| ID | Status | Feature | Tags | Notes |
|----|--------|---------|------|-------|
| T1 | done | **Component extraction (PWA)** | L | `modules/settings.js` |
| T2 | done | **Design system Storybook / catalog** | M | static `design-catalog/` |

---

## 14. Cross-cutting concepts

**Plan:** [plan-14-cross-cutting/plan.md](plan-14-cross-cutting/plan.md) (exec 14)

| ID | Status | Theme | Integrates |
|----|--------|-------|------------|
| X14.1 | done | **Weekly Health Review / command center** | A6, N2, CL1, C1, R4 | v1.111.0 Home card + 5-step PDF |
| X14.2 | done | **On-device AI as the moat** | P3, N*, RE opt-in | v1.111.0 Settings moat copy |
| X14.3 | done | **Progressive disclosure philosophy** | L1, S2, S5 | v1.111.0 milestone schedule |
| X14.4 | done | **Telehealth companion mode** | CL1, C6 | v1.111.0 charts presentation mode |
| X14.5 | done | **Mental health adjacency (careful scope)** | PHQ-2/GAD-2 + stepped PHQ-9/GAD-7 follow-up, crisis links | v1.116.0 stepped follow-up; v1.111.0 initial screeners |

---

## Excluded (NR)

H8, L4, L10, L12, I6, N8, CL3, RE2, RE3, T3, T4, T5, T6 — not scheduled; do not implement without MASTER amendment.

**L10 / N8 rationale:** Wearables (HealthKit, Health Connect, Fitbit) require Xcode, paid Apple Developer account, and platform-specific external setup — excluded per free-tier / no-paid-external-setup policy.

---

## Dependency clusters

| Cluster | IDs | Plan hints |
|---------|-----|------------|
| Pacing | H2, C9, L8, H4 | Plans 04, 09, 10 |
| Cycle | L7, C4 | Plans 04, 09 |
| Meds | L3, R2, CL4, A4 | Plans 04, 07, 11, 12 |
| Clinician prep | H6, N2, CL1, CL5, C6 | Plans 08, 10, 12 |
| Onboarding | L1, S2, S1 | Plans 03, 04 |
| Parity fixes | L9, D1, C10, A1, I1 | Plans 02, 04, 06, 07, 09 |
| Privacy | P2, P3, S7, P7 | Plans 03, 05 |
