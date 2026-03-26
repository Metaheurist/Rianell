# Next phase development plan (buildable)

This document is the **single build plan** to finish Rianell’s transition to a **React Native CLI** app that matches the **web/PWA** and produces **Android APK** + **iOS emulator Xcode zip** via CI releases.

**Last updated:** 2026-03-27 (Phase D native Settings parity documented)

---

## 1) Product contract (non‑negotiables)

- **One product, two primary surfaces**
  - **Web/PWA**: GitHub Pages deployment of `web/` (browser + installed PWA)
  - **Native mobile**: React Native CLI (`apps/mobile`) (iOS + Android)
- **No WebView shortcut** for core UI on mobile.
- **Capacitor is legacy delivery only**: if it remains, it must ship the **same** built web assets and behave identically. It is not the parity reference.
- **Parity scope**: features, UI hierarchy, animations/micro‑interactions, settings, data behavior, permissions rationale, and empty/error states.

**Definition of done (global):** a user can follow the same flows on web/PWA and native mobile and get the same results with the same UX intent; exceptions are listed and signed off.

---

## 2) Current repo state (assumed true)

These are treated as “already implemented” and should not be re-planned here:
- `apps/mobile` exists with navigation + settings shell + AsyncStorage-backed logs; **Settings** includes **Data management** (JSON export/import with merge/replace) and **Install & downloads** (same public `latest.json` resolution as web, opens artifact URL in the system browser).
- CI can generate **RN CLI** native artifacts (Android debug APK + iOS Xcode project zip) and attach them to GitHub Releases.
- Web settings already exposes app installation/download links driven by `latest.json` in each `App build/…/` folder (see `web/app.js` `refreshBuildDownloadLinks`).

If any of the above becomes false, fix it before moving forward.

---

## 3) Build outputs that must exist (release contract)

### 3.1 GitHub Pages site
- Deployed site includes the web app plus `App build/` download directories.

### 3.2 Native artifacts on every `mobile_release` push
- **Android (RN CLI)**:
  - `App build/RNCLI-Android/app-debug-beta.apk`
  - `App build/RNCLI-Android/latest.json` (points to file + build number)
- **iOS (RN CLI emulator zip)**:
  - `App build/iOS/Health-Tracker-ios-alpha-build-<run>.zip`
  - `App build/iOS/Health-Tracker-ios-alpha-latest.zip`
  - `App build/iOS/Health-Tracker-simulator-alpha-<run>.zip` (if used)
  - `App build/iOS/latest.json`

**Done when:** A GitHub Release created by CI contains these assets and the web Settings download links resolve to them.

---

## 4) Parity checklist (remaining work only)

**Web reference:** `web/index.html` + `web/app.js`

### 4.1 Native screens remaining
- [~] **Charts tab**: range selection (`14/30/90/all`) + `Balance/Individual/Combined` view toggle affects which sections render + trend summaries/deltas + mini trend bars + pull-to-refresh. **Balance view** shows mood/sleep/fatigue only; **empty range** shows a clear empty state (no placeholder metric rows). Full Apex/visual parity still pending.
- [~] **AI Analysis tab**: lite++ parity (range summaries + narrative sections + correlations + groups-that-change-together), deeper parity with the web AI copy/structure still pending; gated by `aiEnabled`.

### 4.2 Log wizard remaining steps (native)
- [~] **Step 3 — Symptoms & pain**: body diagram is available (tap-to-cycle) with “Use diagram text” + more regions (arms/legs joints) + **diagram + chips semantics aligned** (good/discomfort/pain). Still needs full SVG region coverage + closer web visual parity.
- [~] **Step 4 — Energy & mental clarity**: grouped tiles + search + collapsible tile section + selected summary; **icon tiles** + **group-colored tile borders**. Still needs closer web tile styling polish.
- [x] **Step 5 — Stress & triggers**: grouped tile picker + search + frequent + selected/clear + collapsible picker implemented.
- [~] **Step 6 — Lifestyle**: ensure UX matches web intent (inputs/chips placement, labels, and validation parity). (Clamp-on-save for steps/hydration/daily function + tests)
- [~] **Step 7 — Food**: ensure web-like add/remove behavior and “count badge clear” parity across all meal types. (“Clear all food”; count badge at 1+ + test)
- [~] **Step 8 — Exercise**: ensure category group UX and “Name:Minutes” parsing parity; count-badge clear parity. (“Clear all exercise”; count badge at 1+ + test)
- [~] **Step 9 — Medication & notes**: confirm remove controls, count-badge clear behavior, and Taken today? toggle parity. (“Clear all medications”; count badge at 1+ + test)

---

## 5) Execution phases (what to build next)

### Phase A — Finish the Log wizard parity loop (highest impact)
**Goal:** the wizard feels identical to the web flow, step-by-step.

**Work items (in order)**
- Step 5: implement stressor tile UX parity (grouped tiles + frequent + selected list + clear). **(done)**
- Step 3: implement native body diagram parity (SVG-equivalent interaction + intensity cycling + legend). **(in progress: diagram added; needs fuller region coverage + styling parity)**
- Step 4: implement tile UI polish (icons + collapsible behavior parity). **(in progress: collapsible behavior added; icon tile styling still pending)**
- Steps 6–9: validate and close remaining UX gaps (labels, selection summary, clear behaviors, accessibility labels).

**Done when:** a QA pass can follow the wizard on both surfaces and observe no UX/behavior differences (except signed-off exceptions).

### Phase B — Charts parity (range + views + deltas)
**Goal:** Charts tells the same story as web for the same range selection.

**Done when:** for the same logs + range, web and native surface the same metrics and deltas, and the view toggle changes what’s shown the same way.

### Phase C — AI Analysis parity (lite++ → web-structure parity)
**Goal:** AI tab outputs match web wording/sections closely, and remains correctly gated by `aiEnabled`.

**Done when:** for the same logs + range, the sections and “Important / flare-up / correlations” align closely with web.

### Phase D — Settings: Data management parity + download UX
**Goal:** Settings exposes the same data-management and install/download affordances.

**Work items**
- [x] **Native export/import (JSON)**: share-sheet export + paste import with **merge** (append new dates) and **replace all** (with confirm), using `@rianell/shared` normalization (`apps/mobile/src/data/logExportImport.ts`).
- [x] **Install/download UX parity**: Settings **Install & downloads** resolves the same public `latest.json` URLs as web (`buildDownloads.ts` → `Linking.openURL`), for legacy Android, RN CLI Android, and iOS Xcode zip.

**Done when:** both surfaces show equivalent options (export/import/install/download) and point to the same build artifacts.

**Status:** Phase D goals for native Settings are **met** (see `docs/app-and-features.md` and changelog **v1.45.8–v1.45.9**).

---

## 6) Engineering gates (how we keep parity from drifting)

### Required local commands
- `npm run typecheck:mobile`
- `npm run test:mobile`

### Required CI gates
- `security-audit` must pass (production-only audit).
- Unit tests + mobile tests must pass before release jobs run.
- Release job must attach RN CLI artifacts.

---

## 7) Working agreements (so this stays buildable)

- Every parity change must update this file by moving items between:
  - **Remaining** (section 4)
  - **Done** (recorded in commit messages and changelog; do not re-add checklist noise here)
- Avoid “plan drift”: if it isn’t in section 4 or 5, it isn’t in scope right now.

