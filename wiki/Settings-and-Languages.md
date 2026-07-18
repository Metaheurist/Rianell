# Settings and Languages

Open the **gear icon** to access a scrollable **settings carousel** with grouped options.

---

## Settings panes (overview)

| Pane | Examples |
|------|----------|
| **Display** | Global theme, colour-blind mode, **profile companion** (carousel), notification preferences |
| **Data options** | Demo mode, import/export, clear local data, enable AI features, anonymised contribution toggles |
| **Data management** | App version, install links (web) or release links (native) |
| **Performance** | On-device AI model download, clear/redownload, benchmarks |
| **Privacy & region** | Language, region gate, policy documents, health consent, **session recording disclosure**, consent dashboard (revoke consents), optional Smartlook toggle |
| **Cloud** | Sign-in, sync, delete cloud data, anonymised contribution |
| **Accessibility** | Text sizing and contrast-related options where available |
| **Integrations** | Strava, Withings, Google Sheets OAuth connectors (cloud sign-in required); import wizard for Bearable/Flaredown/etc. |

Exact pane count may vary slightly by platform; native Settings mirrors web section titles for parity.

**Daily targets** open from the Home header **Goals & targets** button (Goals modal). That modal also has an **Achievements** pane with the badge grid.

**Enable AI features** and anonymised contribution toggles live under **Settings → Data options** (not inside the Goals modal).

**Achievements** are only in the Goals modal Achievements pane — not on Home and not inside Settings.

---

## Languages (13 locales)

| Locale | Notes |
|--------|-------|
| en-GB (default), en-US, en-AU | English variants |
| pt-BR, pt-PT | Portuguese |
| fr-FR, de-DE, es-ES, it-IT, pl-PL, nl-NL | European languages |
| ar, he | **RTL** - layout mirrors; chart time axes stay LTR |

Change language: **Settings → Privacy & region → Language**. The UI refreshes **all tabs** without a full page reload.

---

## User-generated content policy

Log **notes**, **symptoms**, and **medications** stay exactly as you type them - the app does not auto-translate your health text. Export localises **headers** only.

---

## LLM locale

AI prompts use your **active UI locale**. Arabic and Hebrew use rule-based insights and MOTD quotes for LLM paths (no on-device LLM generation in those locales).

---

## Themes

Global theme persists from first paint (including loading overlay). **v1.120.0:** Non-mint themes (Red/Black, Mono, Rainbow) apply to Food/Exercise modals, AI Analysis carousel controls, Mood tab scores, and chart prediction markers - not only the top navigation bar. **v2.2.8:** Light-mode toggles, inputs, Skip/Save, and settings chrome use `--accent-*` tokens so Red/Black (and other teams) no longer keep mint borders on those controls.

Report theme bugs with theme name + screenshots of Home, navbar, modals, and AI Analysis.

---

## Read more (technical)

- [App overview - i18n sections](https://github.com/Metaheurist/Rianell/blob/main/docs/app-and-features.md)
