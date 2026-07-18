# Charts and AI

Rianell combines **interactive charts** with a **deterministic AI engine** and an optional **on-device language model** for plain-language summaries.

---

## Charts tab

- Built with **ApexCharts** - trends for vitals, scales, and activity over time.
- Optional **predictions** on supported metrics; prediction start marker and info box follow the **active global theme** on web (v1.120.0).
- Chart time axes stay **left-to-right** even in RTL languages (Arabic, Hebrew).

Explore patterns visually before diving into the AI Analysis tab. On mobile, AI sections use horizontal slides with theme-aware navigation controls (v1.120.0).

**Chapter icons (v2.2.1):** Overview uses an animated monitor sprite; **Trends & vitals** uses a heart + EKG diagram. Trend metric tiles have stronger icon contrast in light mode.

---

## AI Analysis tab

### Rule-based engine (`@rianell/ai-engine`)

A multi-layer pipeline processes your logs without sending raw data to a cloud LLM:

1. Input metrics and correlation matrix
2. Trend detection and projections
3. Correlations and patterns
4. Risk factors and flare signals
5. Cross-section analysis (food, exercise, stressors when present)
6. Prioritised insights (top items ranked for you)
7. Short plain-language summary

This runs **entirely on your device** using your stored logs.

Lifestyle impact cards compare food/exercise days with Helps / Watch badges and With / Without averages. Exercise timelines label each bar with its date. Pattern and advice strings are plain text (no leading presentation emoji).

On the Overview chapter, the wellbeing score ring shows the final number immediately when reduced motion is preferred (no count-up from zero).

### On-device LLM (optional)

For richer summaries and note suggestions, Rianell can download a **~3.5 GB** model:

- Weights are hosted on **Hugging Face** (chunked downloads, reassembled locally).
- **PWA:** Transformers.js + `summary-llm.js`

**Download UX:**

| Context | Behaviour |
|---------|-----------|
| Desktop PWA | Progress banner near **+** button |
| Installed mobile PWA | Blocking modal until cached (or skip on mobile web) |
| Settings → Performance | **Clear and redownload model** wipes cache and restarts download |

Arabic and Hebrew UI locales use **rule-based + MOTD fallback only** for LLM output (no on-device LLM in those locales).

---

## Home AI suggestions

When AI is enabled and you have enough recent logs, Home may show **0-3 suggestion chips**. Tapping opens a short answer modal with a medical disclaimer.

---

## Privacy note

LLM prompts include your **UI locale** explicitly. User notes in prompts are wrapped in delimiters; logs are not sent to third-party AI APIs by default.

---

## Read more (technical)

- [AI architecture](https://github.com/Metaheurist/Rianell/blob/main/docs/ai-architecture.md)
- [AI security](https://github.com/Metaheurist/Rianell/blob/main/docs/ai-security.md)
- [Models README](https://github.com/Metaheurist/Rianell/blob/main/apps/pwa-webapp/models/README.md)
