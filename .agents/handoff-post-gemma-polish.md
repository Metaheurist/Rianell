# Handoff — Post-Gemma polish (Phase 3c → 6)

**From:** Composer agent (context limit). **Date:** 2026-07-22 ~13:15 UTC+1  
**Repo:** `C:\Users\OnceU\OneDrive\Documents\GitHub\Health-app`  
**Plan file:** `C:\Users\OnceU\.cursor\plans\visual_pack_two-model_324758e4.plan.md`

---

## Snapshot at handoff

| Metric | Value |
|--------|--------|
| Eligible | **978** |
| Polished (C) | **841** |
| Failed | **0** |
| Pending | **~137** |
| Model | `gemma4:31b-it-qat` |
| Checkpoint | `artifacts/visual-gen/polish-checkpoint.json` (`updatedAt` ~ `2026-07-22T12:13:42Z`) |
| Gen (B) | Done earlier (`artifacts/visual-gen/checkpoint.json`) — do **not** re-run Qwen gen |

### Processes left running (DO NOT kill unless replacing carefully)

| Role | Approx PID (re-check) | Command |
|------|----------------------|---------|
| Gemma polish queue | check `visual-polish-queue` | `node scripts/dev/visual-polish-queue.mjs --force-failed` |
| QA wait loop | check `visual-polish-qa-loop` | `node scripts/dev/visual-polish-qa-loop.mjs` (waits `pending≈0`, then screenshot QA + `--gemma-review`) |
| Live A/B/C preview | check port **8766** | `node scripts/dev/visual-polish-live-preview.mjs --limit=10 --port=8766` |
| Python app + Tk dashboard | check `python -m server` | `powershell -File .\server\launch-server.ps1 -NoCompile -SkipUnitTests` → **http://localhost:8080/** |
| Ollama | `ollama serve` + llama-server | `gemma4:31b-it-qat` loaded (~20GB, num_ctx 32768) |

**Verify:**
```powershell
npm run visual:polish:status
ollama ps
Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -match 'visual-polish|python.exe.*-m server' }
# preview
Invoke-WebRequest http://localhost:8766/ -UseBasicParsing | Select StatusCode
# app
Invoke-WebRequest http://localhost:8080/ -UseBasicParsing | Select StatusCode
```

If polish died: **resume only** (never wipe checkpoint):
```powershell
node scripts/dev/visual-polish-queue.mjs --force-failed
```
If preview died:
```powershell
node scripts/dev/visual-polish-live-preview.mjs --limit=10 --port=8766
```
If Python server died (prefer PS1, not broken `npm run dev:web` on Win — ComSpec/cmd bug):
```powershell
powershell -ExecutionPolicy Bypass -File .\server\launch-server.ps1 -NoCompile -SkipUnitTests
```

**Hard rules**
- **Never** `visual:apply`, theme-icon wire, commit icon assets, or push until Phase **3c** `broken.length === 0`.
- **Never** co-load Qwen + Gemma. Polish uses Gemma only.
- **Never** `--reset-polished` / wipe `polish-checkpoint.json` (~25h work).
- C must **≠** bare A; fancy teams paint TEAM colors (not mint `currentColor`); stem siblings share glyph.
- Animations: seamless infinite loops required (see `analyzeSeamlessLoop`).

---

## User-observed animation QA notes (2026-07-22) — MUST enforce in Phase 3c

**Evidence video:** `C:\Users\OnceU\OneDrive\Desktop\Recording 2026-07-22 163349.mp4`

### 1) `animation:achPillSpin` — double spin (FAIL)

- Preview/demo was spinning a **spinner glyph** while the `@keyframes` also `rotate(0→360)`.
- Result: spinner spins *and* the whole spinner spins (nested / double rotation) — looks broken/comical.
- **QA rule:** For rotate/spin keyframes, the animated target must be the **subject** (pill / capsule / intended glyph), **not** a spinner ring. FAIL if both the demo metaphor and the keyframe apply competing rotates.
- Product CSS (`graphics-portfolio.css`): `.ach-pill-spin` uses `achPillSpin` rotate about `32px 32px` — one rotate only on the pill part.

### 2) Droplet / wave demos — tiled translate, not natural fluid (FLAG / polish guidance)

- Waves like `achPoolWave` / glucose-style demos show a **translated repeating fill** sliding under a droplet clip (`translateX`), not a natural fluid/slosh simulation.
- Product CSS for `achPoolWave` is literally `translateX(0) → translateX(-8px)` (tiled scroll) — so preview matching that is “correct to source,” but **post-polish QA should still note**:
  - If user/product intent is a **natural wave**, C should not look like a hard sliding stamp.
  - Prefer soft slosh / shape morph / opacity+Y where register context implies pool/water; keep seamless loop.
- **QA rule:** FAIL or soft-fail with reason `wave-is-hard-translate` when droplet/wave polish looks like a rigid tile sliding with a visible seam, unless A itself is only a tiny cyclic translate and C preserves that intentionally.

### 3) Human figure anatomy (FAIL) — 2026-07-22 afternoon

- User flagged C icons with **people in water / body figures** that have **extra limbs** (e.g. four stick-arms under a head) or missing torso.
- **QA rule:** Any human/person/body/swimmer/user figure must be anatomically plausible: one head, one torso, **exactly two arms** (bilateral), legs only if depicted. Reasons: `anatomy-extra-limbs`, `anatomy-missing-torso`.
- Enforced in: heuristic `analyzeHumanAnatomy`, Gemma vision criteria 9, polish prompts §4c.

### 4) Animation cohesion + mid-frame clipping (FAIL) — 2026-07-22 afternoon

- Motion must feel like **one cohesive intent** (no competing metaphors).
- **QA rule:** During screenshot QA, sample animation frames (~0/25/50/75/98%) and FAIL if elements are hard-clipped outside the stage/viewBox mid-loop (`anim-frame-clip`). Also CSS heuristics for large translate/scale blow-ups.
- Enforced in: DOM frame sampler in `visual-polish-screenshot-qa.mjs`, `analyzeAnimationCohesion`, Gemma vision criteria 6+10.

### 5) Stethoscope pack — disconnected / fill-blob (FAIL) — 2026-07-22 afternoon

- User flagged all `icon-stethoscope` variants (plain + fancy teams) as **broken**: floating headset arc, U-tube, and chest piece look disconnected.
- Root cause: polish fallback wrapped stroke-line glyphs with `icon-fill` + `stroke="none"`, which fills open arcs into blobs.
- **QA rule:** FAIL `stethoscope-broken` when C strips stroke / uses fill-only on open paths. Must read as one connected instrument (headset↔tube↔chest).
- Enforced in: `analyzeStethoscopeIntegrity`, Gemma vision criterion 11, `buildAdditivePolishFallback` stroke wrap, preview stage CSS stroke defaults.
- IDs: `sprite:icon-stethoscope`, `fancy:icon-stethoscope:{mint,mono,red-black,rainbow}` — must appear in `broken.json` until re-polished with stroke wrap.

### 6) QR pack — must look like a QR (FAIL if weak) — 2026-07-22 afternoon

- User flagged all `icon-qr` variants: must **look more like a QR** (not an abstract window/grid).
- Canonical silhouette: **3 finder eyes** at top-left, top-right, bottom-left + bottom-right data modules.
- **QA rule:** FAIL `qr-weak` / `qr-broken` when finders are missing/collapsed or modules become thin bars; fancy teams recolor only.
- Enforced in: `analyzeQrIntegrity`, Gemma vision criterion 12, polish prompts, preview CSS (no longer force `fill:none` on all rects — that made QR look hollow/wrong).
- IDs: `sprite:icon-qr`, `fancy:icon-qr:{mint,mono,red-black,rainbow}`.

### 7) User live-review primary focus (appendable) — 2026-07-22 evening

User is still scrolling the gallery; more flags will come. Primary targets live in:

`scripts/dev/visual-polish-qa-user-focus.json`

**Explicit FAIL / redo until fixed & removed from that list:**

| ID / prefix | Issue |
|-------------|--------|
| `fa-replace:fa-solid_fa-pizza-slice` | Not a pizza — redo wedge+toppings |
| `achievement:cycle_tracker` | Nothing to do with menstrual cycle |
| `avatar:ashspiral` | Unrecognizable — redo spiral companion |
| `fa-solid_fa-{lightbulb,moon,mug-hot,mug-saucer,person-swimming,person-walking,plane,plate-wheat,potato,utensils}` | Broken vectors / non-SVG — redo composition |
| Accessibility / backspace / balance / calendar / chart-down packs + select rainbow variants | Extra focus during Q&A |

**Enforcement:** `matchUserFocus` + `analyzeFlaggedSubjectIntegrity` in screenshot-qa; polish §4d + situational SUBJECT REPAIR; Gemma criterion 13. Reasons: `user-qa-focus`, `pizza-weak`, `cycle-tracker-mismatch`, `ashspiral-unreadable`, `broken-vector`.

**Append more:** add `{ "id": "…", "reason": "…" }` (or `idPrefix`) to the JSON — next QA run force-fails them into `broken.json` for re-polish.

**Batch 2 (2026-07-22 evening):** run/save/share/sleep/sparkle-ring/stethoscope/target/trash packs; weather cloudy/partly-cloudy/pressure/pressure-low; avatars ironbloom→vortexseed (note `avatar:moonthread` = register JS stub unresolved).

### 8) HUD **FAILED** count investigation — 2026-07-22 evening

Preview HUD `FAILED` is **polish-queue errors**, not design QA.

| Artifact | Detail |
|----------|--------|
| Report | `artifacts/visual-gen/qa/failed-investigation.json` |
| Live HUD | Controls → **Failed investigation (Q&A)** when `failed > 0` |
| API | `/api/gallery` → `failedItems[{ id, kind, reason, remediation }]` |

**Current fails (Ollama OOM / runner crash — HTTP 500):**
1. `fancy:icon-weather-pressure-high:rainbow` — siblings mint/mono/red-black OK  
2. `sprite:icon-weather-rain` — alloc failure mid-polish  
3. `fancy:icon-weather-rain:mint` — same OOM (count may show 2→3 as queue continues)

**Not a design bug.** Remediation: free VRAM → `node scripts/dev/visual-polish-queue.mjs --force-failed`. Rain mono/red-black/rainbow still pending behind those fails.

### Preview HUD reminder

- Turn **Animations (GPU)** ON in the floating panel when reviewing motion; default is OFF for VRAM.
- Open: `http://localhost:8766/?id=animation:achPillSpin` and `?id=animation:achPoolWave` (names may vary — search gallery).

---

## Phase 3 — Finish C (if still pending)

1. Watch `npm run visual:polish:status` until `pending=0` and `failed=0` (or force-failed drained).
2. Live preview: **http://localhost:8766/**  
   - Lazy load +10 on scroll  
   - Floating HUD top-right: **Animations off by default** (VRAM), stats, C-only, unload  
   - Markup: `scripts/dev/visual-polish-live-preview.html`  
   - A/B/C = stages; theme variants = separate rows  
3. QA loop already running should auto-start screenshot QA when pending≈0.

---

## Phase 3c — Screenshot QA gate (mandatory before apply)

**Commands:**
```powershell
# if qa-loop not running:
node scripts/dev/visual-polish-qa-loop.mjs
# or manual:
npm run visual:polish:screenshot-qa -- --gemma-review
# after broken.json:
npm run visual:polish:repolish-qa
```

**Checks (all must pass):**
1. Screenshot every icon A/B/C card + C crop + stem contact sheets  
2. No broken / empty / invisible graphics  
3. No offset shift vs A  
4. Description / subject match  
5. Location + surrounding fitment  
6. Theme-pack cohesion per stem  
7. Seamless CSS animation loops + motion cohesion  
8. Human-figure anatomy (bilateral ≤2 arms, torso present)  
9. Mid-frame animation clipping (`anim-frame-clip`)  
10. Gemma **vision** review of every screenshot + stem sheets (`--gemma-review`)

**Outputs:**
- `artifacts/visual-gen/qa/report.json`
- `artifacts/visual-gen/qa/broken.json`
- `artifacts/visual-gen/qa/screenshots/`
- `artifacts/visual-gen/qa/stem-sheets/`

Loop: broken → re-polish from QA → re-screenshot until `broken=[]`.

**Known fixes already landed (do not regress):**
- Achievement C stubs hydrated (`achievementIconSvgMarkup` was wrapped as text)  
- Animation C `@keyframes` unwrapped from fake `<g>`  
- Preview resolves stubs + plays anim demos on designated glyphs  
- `ensurePolishedDiffers` / `buildAdditivePolishFallback` must not wrap JS stubs  
- Screenshot QA module: `scripts/dev/visual-polish-screenshot-qa.mjs`  
- Unit tests: `tests/unit/pwa/visual-polish-seamless-loop.test.mjs`, `visual-polish-screenshot-qa.test.mjs`

---

## Phase 4 — Integrate (ONLY after 3c green)

1. `npm run visual:apply` (polished-first)  
2. `npm run generate:theme-icons` (gzip budgets)  
3. Wire: FA→SVG, nav fancy, avatar-parts, `#icon-sprout`, `KNOWN_SVG_ICONS`  
4. Smoke on http://localhost:8080/ (settings / achievements / emblems)

---

## Phase 5 — Gates + docs

```powershell
npm run test:unit
npm run verify:design-tokens
node scripts/verify/doc-links.mjs --strict
# if CSP/CDN/FA touched:
npm run verify:csp
```

Docs: CHANGELOG + wiki/docs for two-model pipeline (`qwen3.6:35b` gen → `gemma4:31b-it-qat` polish).

---

## Phase 6 — Ship

Chunked commits (no force-push, no `--no-verify`, no secrets, no bulk `artifacts/visual-gen/`):
1. harness / polish tooling  
2. icons / overrides  
3. motion / keyframes / theme FX  
4. tests + docs  

Then push → run CI workflow until green → sync.

---

## Key files

| Path | Role |
|------|------|
| `scripts/dev/visual-polish-queue.mjs` | Gemma multi-pass polish |
| `scripts/dev/visual-polish-live-preview.mjs` + `.html` | A/B/C preview + HUD |
| `scripts/dev/visual-polish-screenshot-qa.mjs` | Post-polish QA gate |
| `scripts/dev/visual-polish-qa-loop.mjs` | Wait → QA → re-polish loop |
| `apps/pwa-webapp/assets/visual-register.json` | Register |
| `artifacts/visual-gen/polish-checkpoint.json` | C progress (gitignored) |
| `artifacts/visual-gen/polished/**` | C outputs |
| `server/launch-server.ps1` | App + Tk dashboard |

**npm scripts:** `visual:polish`, `visual:polish:status`, `visual:polish:live`, `visual:polish:screenshot-qa`, `visual:polish:repolish-qa`, `visual:polish:qa-loop`, `visual:apply`

---

## Outgoing agent note

Productive Node/Python/Ollama workers were **left running** for continuity. Do not wipe polish checkpoint. Next agent: confirm PIDs with the verify block above, then finish pending → 3c green → 4→5→6.
