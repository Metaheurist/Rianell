# Settings and Languages

Open the **gear icon** to access a scrollable **settings carousel** with grouped options.

---

## Settings panes (overview)

| Pane | Examples |
|------|----------|
| **Display** | Global theme, colour-blind mode, notification preferences |
| **Data options** | Demo mode, import/export, clear local data |
| **Data management** | App version, install links (web) or release links (native) |
| **Performance** | On-device AI model download, clear/redownload, benchmarks |
| **Privacy & region** | Language, region gate, policy viewer, health consent, optional **Session recording (Smartlook)**, consent dashboard |
| **Cloud** | Sign-in, sync, delete cloud data, anonymised contribution |
| **Goals** | Targets shown on Home |
| **Accessibility** | Text sizing and contrast-related options where available |

Exact pane count may vary slightly by platform; native Settings mirrors web section titles for parity.

---

## Languages (13 locales)

| Locale | Notes |
|--------|-------|
| en-GB (default), en-US, en-AU | English variants |
| pt-BR, pt-PT | Portuguese |
| fr-FR, de-DE, es-ES, it-IT, pl-PL, nl-NL | European languages |
| ar, he | **RTL** — layout mirrors; chart time axes stay LTR |

Change language: **Settings → Privacy & region → Language**. The UI refreshes **all tabs** without a full page reload (PWA) or app restart (RN).

---

## User-generated content policy

Log **notes**, **symptoms**, and **medications** stay exactly as you type them — the app does not auto-translate your health text. Export localises **headers** only.

---

## LLM locale

AI prompts use your **active UI locale**. Arabic and Hebrew use rule-based insights and MOTD quotes for LLM paths (no on-device LLM generation in those locales).

---

## Themes

Global theme persists from first paint (including loading overlay). Report theme bugs with theme name + screenshots of Home, navbar, and goals block.

---

## Read more (technical)

- [App overview — i18n sections](https://github.com/Metaheurist/Rianell/blob/main/docs/app-and-features.md)
- [Platform parity — RTL and catalog](https://github.com/Metaheurist/Rianell/blob/main/docs/platform-parity.md)
