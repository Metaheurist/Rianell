# Neural Network Plan (Rianell AI)

This document expands the architecture described in `docs/ai-architecture.md` and defines the practical implementation plan for the neural-style analysis pipeline.

## v1.44.2 documentation sync

- No neural pipeline scope change in this pass; updates are UI/theming parity, settings navigation polish, and cloud settings sync coverage.

## Goals

- Use the widest safe data context (training history + selected range) without repeated heavy passes.
- Improve relevance by ranking insights into a short, deduplicated "what matters most" list.
- Keep UX responsive on lower-end devices by reusing precomputed features and skipping non-applicable branches.
- Keep outputs understandable in plain language (summary first, then details).

## Current design principles

- **Single-pass feature build:** prepare shared features once in Layer 1.
- **Reuse over recompute:** correlation matrix and temporal features are shared across layers.
- **Guard rails:** skip branches where source data does not exist (for example food/exercise).
- **Deterministic ranking:** produce stable prioritised insights for consistent UI rendering.
- **Explainability-first output:** every high-priority insight should map to observable user data.

## Layer-by-layer implementation plan

### Layer 1 - Input (feature space)

Build in one pass:

- `metricsData` (series, avg, variance, fill-rate, rolling 7/30 means)
- `fullNumericMatrix`
- `correlationMatrix`
- temporal context (`dayOfWeek`, `daysSinceLastFlare`, flare flags)

Planned improvements:

- Validate sparse metrics early and attach confidence/fill tags.
- Add cheap outlier pre-flags for later ranking.

### Layer 2 - Trend

- Keep per-metric trend + projection output.
- Normalize significance consistently (sigmoid over confidence-weighted signal).

Planned improvements:

- Confidence penalties for low sample size.
- Stronger monotonic trend checks before "improving/worsening" labels.

### Layers 3a/3b - Correlation

- Use precomputed matrix where possible.
- Keep pairwise and multi-metric flows separate but merge into one correlation output schema.

Planned improvements:

- False-positive controls via minimum overlap + minimum effect thresholds.
- Explicit "insufficient overlap" reason codes for suppressed findings.

### Layer 4 - Pattern

- Anomalies, repeating patterns, acceleration signals from recent logs.

Planned improvements:

- Distinguish one-off spikes from persistent shifts.
- Attach persistence score for ranking in Layer 9.

### Layer 5 - Risk

- Risk factor scoring + flare prediction branch.

Planned improvements:

- Calibrate risk output against temporal context (days-since-flare and cadence).
- Emit structured contributors to support transparent UI explanations.

### Layer 6 - Cross-section

- Food/exercise, stressor, symptom, and pain-location effects.
- Skip food/exercise branch when missing.

Planned improvements:

- Stronger sparse-data guards to avoid noisy associations.
- Harmonized labels for UI grouping (symptom vs. function vs. behaviour).

### Layers 7a/7b/7c - Cluster, time-series, outliers

- Keep heavy analysis branch but run only when data volume thresholds are met.

Planned improvements:

- Device-aware execution budget (defer expensive branch on low-tier hardware).
- Cache intermediate outputs per date range where safe.

### Layer 8 - Advice

- Generate actionable advice from top evidence and trend/risk context.

Planned improvements:

- Tighten advice dedupe and contradiction checks.
- Ensure each advice item links to at least one evidence block.

### Layer 9 - Interpretation (priority ranking)

- Build `prioritisedInsights` (top 5-7).
- Rank anomalies/risk above weak correlations, remove duplicates.

Planned improvements:

- Explicit scoring rubric:
  - severity/impact
  - confidence/coverage
  - recency/persistence
  - actionability
- Enforce per-category caps so one category does not flood output.

### Layer 10 - Summary

- Produce 2-3 sentence plain-language summary.

Planned improvements:

- Stable template ordering: trend -> key risk/pattern -> action.
- Ensure summary mirrors top-ranked insights (not low-priority noise).

## Performance plan

- Precompute once in Layer 1, pass shared structures by reference.
- Avoid repeated JSON transforms across layers.
- Add branch-level fast exits for empty/sparse data.
- Keep time-budget guards for startup/interactive flows.
- Maintain low-device fallback behavior.

## Validation and quality checks

- Unit tests for:
  - feature generation integrity
  - ranking stability
  - skip-logic correctness
  - summary coherence with ranked insights
- Regression tests on representative datasets:
  - sparse logs
  - high-frequency logs
  - mixed symptom-heavy and behaviour-heavy periods
- Output checks:
  - no duplicate top insights
  - no unsupported claims without source signals
  - stable ordering on identical input

## Delivery phases

1. **Phase 1 (core):** solidify Layer 1 data model + ranking rubric in Layer 9.
2. **Phase 2 (quality):** improve sparse-data guards and confidence scoring.
3. **Phase 3 (perf):** branch budget tuning + optional caching for heavier layers.
4. **Phase 4 (UX):** tighter summary phrasing and evidence traceability in UI.

## References

- Architecture overview: `docs/ai-architecture.md`
- Runtime implementation: `web/AIEngine.js`
