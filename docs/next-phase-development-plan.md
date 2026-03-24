# Next phase development plan

Build plan for the next application phase of **Rianell**. This document captures platform strategy, theming, accessibility, and AI acceleration goals so engineering can sequence work and scaffold correctly.

**Naming:** The product, repository, and local project folder should all use **Rianell** so docs, paths, and marketing stay consistent. New mobile scaffolds (e.g. React Native) should use the same name in app display title, bundle identifiers (as allowed by stores), and internal references.

---

## 1. Platform architecture

**One product.** Rianell is a **single product** experienced on **two primary surfaces** that must stay **the same**: the **web app** (hosted on **GitHub Pages**, including when installed as a **PWA**—manifest, service worker, installable / standalone behaviour) and the **React Native Expo app** on **iOS and Android**. The PWA is **not** a separate product: it is the **same** web build and must match feature-for-feature with the in-browser experience. Users should not get a “web version,” a “different PWA,” and a “different mobile version”—features, UI, UX, motion, and permission behaviour are **one contract**, implemented as **web (browser + PWA)** and **native (Expo)**, not divergent apps.

### 1.1 Split clients

| Surface | Stack | Scope |
|--------|--------|--------|
| **Web** | Existing / evolved web stack, deployed on **GitHub Pages**, **PWA-enabled** (manifest, service worker, etc.) | Canonical web build—in **browser** and as an **installed PWA**; **source of truth for parity** with Expo mobile |
| **Mobile (iOS & Android)** | **React Native (Expo)** | **Exactly the same product** as the web app (GitHub Pages + PWA) (see **1.2**); UI built in RN, not a WebView shell |

### 1.2 Web (GitHub Pages + PWA) ↔ Expo: exact parity (no WebView)

The **Expo** iOS and Android apps must match the **same web product** users get from **GitHub Pages**—whether they open it in a **tab** or **install it as a PWA**—with **exact parity** across:

- **Features** — Same capabilities, flows, and data behaviour; no “mobile-lite” subset unless explicitly documented and accepted as a platform exception.
- **UI** — Screens, components, layout hierarchy, and visual design replicated in **native React Native views** (not approximations inside a browser surface).
- **UX** — Navigation patterns, settings, feedback, empty states, and error handling aligned with the web app (browser and PWA install).
- **Animations** — Motion, transitions, and micro-interactions matched to the extent RN/Reanimated (or chosen stack) allows; where a 1:1 effect is impossible, document the closest equivalent and product sign-off.
- **Permissions** — Same permission **requests and rationale** as the web app where applicable (camera, notifications, storage, health-related APIs, etc.); parity in **when** prompts appear and **what** is gated, respecting iOS/Android rules.

**Explicit non-goal:** Do **not** ship the product UI by embedding the web app in a **WebView** (or similar “load the site in a frame”) as a substitute for building screens in React Native. Any WebView use, if allowed at all, is only for **isolated** cases (e.g. legal pages, OAuth) agreed in writing—not for core dashboard or feature UI.

**Implications**

- Expo must be **scaffolded** and implemented screen-by-screen to **replicate the web app** (browser + PWA), with a **parity checklist** (features, screens, animations, permissions) tracked to completion.
- Shared concerns (API contracts, auth, domain models, design tokens) should be centralized where practical so **web (GitHub Pages, including PWA) and Expo** stay one product.
- **Capacitor** or other wrappers, if they remain in the repo during transition, should **not define a third product**—they stay aligned with the same web build or are phased out; parity work is measured against **GitHub Pages web + PWA + Expo**.
- Platform-only gaps (store policies, OS APIs) must be **listed and signed off**; they are exceptions to parity, not silent drift.

---

## 2. Theming: system default + manual dark / light

### 2.1 Behavior (all platforms)

- **Default:** Theme follows **system appearance** (light / dark) on:
  - Web (prefers-color-scheme and related APIs)
  - iOS and Android (React Native appearance / system UI mode)
- **User override:** User can **manually toggle** between dark and light; this preference should persist per device / profile as appropriate.
- When the user clears override or chooses “system,” behavior returns to tracking the OS setting.

### 2.2 Team themes × appearance

- **Team identity stays the same** (same team selection, same brand “team”).
- **Colors are appearance-dependent:** For each team, maintain **two coordinated palettes**:
  - **Light mode:** light-appropriate surfaces, text, and accents for that team.
  - **Dark mode:** dark-appropriate surfaces, text, and accents for the same team.
- Conceptually: **team + (light | dark)** selects the token set; changing only appearance swaps light/dark variants without changing which team is active.

**Implementation note:** Express this as **design tokens** (e.g. semantic colors: `background.primary`, `text.primary`, `accent`) mapped per team × mode, rather than duplicating entire unrelated themes.

---

## 3. Accessibility (next phase)

Deliver accessibility as a **first-class slice** of work, surfaced in the **settings** experience.

### 3.1 Settings module: new “Accessibility” area

- Add an **Accessibility** section (tab / panel) inside the **settings modal** (or equivalent settings UX on mobile).
- Group related controls here so users discover them in one place.

### 3.2 Large text and font scaling

- **Large text mode:** Toggle (or preset) for users who need bigger UI text.
- **Font size control:** A **slider** (or stepped control) that adjusts **text scale** (and ideally spacing where needed) **across the app**, not only in one screen.
- Respect platform guidelines (e.g. avoid breaking layouts; test critical flows at max scale).

### 3.3 Text-to-speech (TTS)

- When the user **activates / focuses / taps** an element (per agreed interaction model), **read its accessible label** (and short description where defined) via TTS.
- Scope: define which roles get TTS (buttons, headings, list items, custom components) and ensure **semantic labels** exist so TTS is meaningful.

### 3.4 Colorblind support

- **Colorblind-related settings** live under **Accessibility** in settings.
- Options might include: safe palettes, patterns / icons in addition to color, contrast adjustments, or presets—**exact presets to be specified** during design; the plan is to **reserve** this surface and token hooks early.

### 3.5 Cross-platform parity

- Web and React Native should expose **the same accessibility capabilities** where OS APIs allow; document any intentional platform-only behavior.

---

## 4. AI / LLM and hardware acceleration

### 4.1 React Native (iOS & Android)

- Modern phones include **AI-oriented silicon** (NPUs, neural engines, etc.). The React Native scaffold and architecture should **plan for**:
  - **On-device inference** or **accelerated runtime** paths where models and licenses support it.
  - Clear **fallback** to cloud / server-side LLM when on-device is unavailable or insufficient.
- **Scaffolding requirement:** From the start, structure AI features behind an **abstraction** (e.g. “inference backend”) so native modules or SDKs can plug in **Core ML**, **NNAPI** / vendor SDKs, or similar **without rewriting** all call sites.
- Existing **AI elements, analysis flows, and LLM usage** in the app should be mapped to this layer so acceleration can be enabled incrementally.

### 4.2 Web (browser)

- Investigate **browser-side acceleration** for users with **AI-capable GPUs / NPUs** accessible via the web platform (e.g. **WebGPU**, **WebNN** where supported), for compatible workloads.
- Treat this as **progressive enhancement:** baseline behavior works everywhere; accelerated path activates only when APIs and hardware are available.
- Align with existing **AI architecture** documentation in the repo where applicable (`docs/ai-architecture.md`).

### 4.3 Non-goals / constraints (to validate in phase)

- Not all models can run on-device; **privacy, size, and latency** tradeoffs need explicit product decisions.
- **Hardware utilization** is platform- and browser-specific; feature flags and capability detection are required.

---

## 5. Suggested workstreams (for sequencing)

1. **Monorepo / shared packages** — API client, types, design tokens (team × mode).
2. **Theming system** — System default + persistence + team × light/dark tokens (web first, then RN).
3. **Expo (React Native) scaffold** — Navigation, settings shell, theme provider, env/config; parity checklist vs **GitHub Pages web + PWA** from day one.
4. **Feature parity** — Screen-by-screen or domain-by-domain port with a parity checklist.
5. **Accessibility** — Settings UX, dynamic type / font scale, TTS hooks, colorblind presets.
6. **AI abstraction + acceleration** — Interface + native/web adapters + capability detection.

---

## 6. Open decisions (fill in during planning)

- [ ] Exact React Native structure (single app vs. monorepo with shared `packages/`).
- [ ] Where theme and accessibility preferences sync (local only vs. account-backed).
- [ ] TTS trigger model (focus vs. explicit “read aloud” vs. both).
- [ ] Which on-device models or SDKs are approved for iOS/Android and web.

---

*This document is the build plan for the next phase; update it as scope and timelines are committed.*
