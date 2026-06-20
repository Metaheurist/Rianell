# Cloudflare response headers (recommended for rianell.com)

The PWA ships a full **Content Security Policy** in **`apps/pwa-webapp/index.html`** (meta tag). If **Cloudflare** (or another edge) also sends **`Content-Security-Policy`** on HTML responses, browsers **combine** policies: a resource must satisfy **every** CSP. A **narrow HTTP CSP** (for example only `script-src 'self' 'unsafe-inline' https://*.supabase.co`) blocks scripts and styles that the meta tag allows, which produces console errors such as:

- `Loading the script … violates … script-src` (often **`cdn.jsdelivr.net`** — Supabase UMD, Hugging Face Transformers, helpers)
- `Loading the stylesheet … violates … style-src` (**`fonts.googleapis.com`**, **`cdn.jsdelivr.net`** Font Awesome)
- `Supabase library not loaded` / dynamic import failures for **`@huggingface/transformers`**

## Open-Meteo weather (H5) — common production break

Home weather uses **[Open-Meteo](https://open-meteo.com/)** — **free, public, no API key or subscription**. Endpoints:

| Host | Purpose |
|------|---------|
| `https://api.open-meteo.com` | Forecast (pressure, temperature) |
| `https://air-quality-api.open-meteo.com` | US AQI (optional) |

If the console shows `Fetch API cannot load https://api.open-meteo.com/... violates Content Security Policy`, the **HTTP** CSP at Cloudflare is **out of date**. The PWA **meta** tag in `index.html` already allows these hosts; a **narrower edge header** still blocks fetches because browsers require **both** policies to allow each origin.

**Symptom check:** In DevTools → Network → document response headers, find `content-security-policy`. If `connect-src` lists Supabase/Hugging Face but **not** `api.open-meteo.com`, update Cloudflare (below).

### Cloudflare: update `connect-src` (step by step)

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/) → select zone **rianell.com**.
2. **Rules** → **Transform Rules** → **Modify Response Header** (or **Rules** → **Response Header Transform Rules**).
3. Find the rule that **sets** `Content-Security-Policy` (often named for client-side security or custom headers).
4. **Either (recommended for simplicity):** **Delete** that rule so only the PWA **meta** CSP applies (single source of truth on each deploy).
5. **Or:** Edit the rule value and paste the full policy from section **B** below (must include `https://api.open-meteo.com` and `https://air-quality-api.open-meteo.com` inside `connect-src`).
6. **Save** and **Purge cache** (Caching → Purge Everything) for HTML if needed.
7. Hard-refresh the site (Ctrl+Shift+R) and confirm weather loads without CSP errors.

**Permissions-Policy:** Weather opt-in needs geolocation. Keep `geolocation=(self)` in the edge header (do not use `geolocation=()`).

**Verify locally after the change:**

```bash
npm run verify:csp
```

## Report-only CSP noise (Cloudflare challenge / monitoring)

If the console shows many lines like:

`Loading the script … violates … script-src 'unsafe-inline' 'unsafe-eval'` **and** `The policy is report-only, so the violation has been logged but no further action has been taken`

that is **not blocking** the page today — it is Cloudflare (or a security product) **logging** what *would* be blocked under a stricter policy. Typical sources:

- **Challenge platform** scripts under `/cdn-cgi/challenge-platform/`
- A **Content-Security-Policy-Report-Only** header missing `'self'`, `worker-src`, and Hugging Face / Supabase hosts

**Action:** In Cloudflare, remove duplicate **Report-Only** CSP rules, or align them with the full policy in **`index.html`**. When Cloudflare switches the same rule from report-only to **enforce**, same-origin scripts (`app.*.min.js`, `summary-llm.js`, `sw.js`) and HF model fetches will break unless `'self'` and the meta **`connect-src`** hosts are included.

CI checks: `npm run verify:csp` includes **`verify-csp-report-only-live.mjs`**, which fails when a narrow Report-Only header is detected on the live site. The security headers job also records Report-Only issues in `security/securityheaders-rianell.com.md`.

## Fix (pick one)

### A) Prefer: remove duplicate HTTP `Content-Security-Policy` (recommended)

For HTML routes on **`rianell.com`**, **do not** set **`Content-Security-Policy`** in Cloudflare **Transform Rules**, **client-side security**, or Page Rules. Rely on the **meta** CSP in **`index.html`** so one policy applies and stays in sync with releases.

### B) Align HTTP CSP with the app meta tag

If you must set CSP at the edge, copy the **`content`** value from the **`<meta http-equiv="Content-Security-Policy" content="…">`** line in **`apps/pwa-webapp/index.html`** on the same commit you deploy. **Do not** ship a shorter policy.

Single-line reference (keep in sync with that file when editing):

```http
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' https://cdn.jsdelivr.net https://www.paypal.com; worker-src 'self' blob: https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' data: https://cdn.jsdelivr.net https://fonts.gstatic.com; connect-src 'self' https://*.supabase.co https://tcoynycktablxankyriw.supabase.co https://cdn.jsdelivr.net https://huggingface.co https://*.huggingface.co https://cas-bridge.xethub.hf.co https://*.xethub.hf.co https://*.aws.cdn.hf.co https://raw.githubusercontent.com https://api.open-meteo.com https://air-quality-api.open-meteo.com https://www.paypal.com https://www.paypalobjects.com https://www.sandbox.paypal.com https://api.paypal.com https://api.sandbox.paypal.com https://c.paypal.com; frame-src 'self' https://www.paypal.com https://www.paypalobjects.com https://www.sandbox.paypal.com; form-action 'self' https://www.paypal.com https://www.paypalobjects.com; base-uri 'self';
```

**Note:** Project-specific Supabase host and PayPal endpoints are embedded above; adjust **`connect-src`** / **`frame-src`** if your deployment uses different hosts.

## Permissions-Policy: `notifications`

Chromium may log:

`Error with Permissions-Policy header: Unrecognized feature: 'notifications'.`

The **`notifications`** token is not consistently recognised as a Permissions-Policy feature across browsers. **Remove** `notifications=(self)` from the edge **`Permissions-Policy`** header until you confirm support for your target browsers. Web Notifications can still work via the usual permission prompt; this header only pre-declares policy.

**Safer minimal example:**

```http
Permissions-Policy: microphone=(self), geolocation=(self), camera=(), interest-cohort=()
```

Tune **`microphone`**, **`geolocation`**, and **`camera`** to match product needs.

## Console noise that is not the site

- **`lockdown-install.js`**, **`SES Removing unpermitted intrinsics`** — often **browser extensions** (wallet / security tools), not Rianell.
- **`tabs:outgoing.message.ready`**, **`vendor.js`** — typically **extension** messaging, not app code.
- **`rokt.com`** preload — third-party / ads; often extensions or injected scripts.
- **`beforeinstallpromptevent.preventDefault()`** — PWA install UX; informational.

See also **[docs/infrastructure-and-security-edge.md](../docs/infrastructure-and-security-edge.md)** and **[SECURITY.md](../docs/SECURITY.md)** (CSP section).

## Artifact path redirect (post–architecture migration)

After renaming **`artifacts/`** → **`artifacts/`** on GitHub Pages, apply a **Bulk Redirect** or **Redirect Rule** in Cloudflare:

| Source | Target | Status |
|--------|--------|--------|
| `/artifacts/*` | `/artifacts/$1` | **301** |

This preserves bookmarks and external links that still use the old path with a space-encoded URL.
