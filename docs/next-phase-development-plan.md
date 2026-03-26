# Next phase development plan (buildable)

This document is the **single build plan** to finish Rianell’s transition to a **React Native CLI** app that matches the **web/PWA** and produces **Android APK** + **iOS emulator Xcode zip** via CI releases.

**Last updated:** 2026-03-27 (Docs: `app-and-features` native wizard + `about-and-support` pointers)

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
- [~] **Charts tab**: range (`14/30/90/all`), view toggle (`Balance/Individual/Combined`), trend summaries/deltas, mini spark bars, and **pull-to-refresh** are implemented; **Balance** limits listed metrics; **empty range** has a dedicated empty state. **Remaining:** full Apex/visual parity with web (styling, animations, richer chart chrome).
- [~] **AI Analysis tab**: lite++ parity (range summaries + narrative sections + correlations + groups-that-change-together); range chips have accessibility labels; pull-to-refresh reloads logs (test). Deeper parity with web AI copy/structure still pending; gated by `aiEnabled`.

### 4.2 Log wizard remaining steps (native)
- [~] **Step 3 — Symptoms & pain**: tap-to-cycle diagram uses **web-matching silhouette path** (`index.html` outline), **140×280** viewBox, regions scaled to canvas; chips + “Use diagram text” + semantics aligned. **Remaining:** optional per-region path shapes matching web SVG exactly (mobile uses simplified rects/circles).
- [~] **Step 4 — Energy & mental clarity**: grouped tiles + search + collapsible tile section + selected summary; **icon tiles** + **group-colored tile borders** + **stronger border on selected tile**; helper copy + **accessibility labels** on fatigue/sleep/mood fields. **Remaining:** optional closer match to web bottom-sheet tile chrome / animations.
- [x] **Step 5 — Stress & triggers**: grouped tile picker + search + frequent + selected/clear + collapsible picker implemented.
- [x] **Step 6 — Lifestyle**: clamp-on-save for daily function (0–10), steps (0–50k), hydration (0–20 glasses); tests in `LogWizardScreen.test.tsx`.
- [x] **Step 7 — Food**: clear-all per section, duplicate counts on tiles, remove controls; tests for clear + count badge.
- [x] **Step 8 — Exercise**: `Name:Minutes` parsing, category tiles, clear all + count badge; tests.
- [x] **Step 9 — Medication & notes**: medications list, Taken today?, clear all + count badge; tests.

---

## 5) Execution phases (what to build next)

### Phase A — Finish the Log wizard parity loop (highest impact)
**Goal:** the wizard feels identical to the web flow, step-by-step.

**Work items (in order)**
- Step 5: implement stressor tile UX parity (grouped tiles + frequent + selected list + clear). **(done)**
- Step 3: implement native body diagram parity (SVG-equivalent interaction + intensity cycling + legend). **(in progress: web outline + tall canvas + region scale; optional path-for-path region shapes)**
- Step 4: implement tile UI polish (icons + collapsible behavior parity). **(in progress: icons + group borders + selected-state ring + vitals field a11y; optional web sheet polish)**
- Steps 6–9: validate and close remaining UX gaps (labels, selection summary, clear behaviors, accessibility labels). **(done — clamp/save, clear-all, count badges; see section 4.2)**

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

