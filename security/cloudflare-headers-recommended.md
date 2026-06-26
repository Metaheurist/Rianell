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

**Permissions-Policy:** Weather opt-in needs geolocation. Keep `geolocation=(self)` in the edge header (do not use `geolocation=()`). Do **not** set `notifications=(self)` — use `notifications=()` or omit `notifications` entirely (see [Permissions-Policy](#permissions-policy-notifications) below).

## HTTP security headers (edge Transform Rule)

When you set **non-CSP** headers at Cloudflare, use this bundle (adjust host names if needed). **Do not** add deprecated **`Expect-CT`** — Chrome removed it in v106.

### Step-by-step: add `frame-ancestors` and companion headers

`frame-ancestors` **cannot** be set via the HTML meta tag; it must be an HTTP response header.

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/) → zone **rianell.com**.
2. **Rules** → **Transform Rules** → **Modify Response Header** → **Create rule**.
3. **When:** `(http.host eq "rianell.com")` or your Pages custom domain.
4. **Then** set these headers (one rule with multiple "Set static" actions, or separate rules):

```http
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: microphone=(self), geolocation=(self), camera=(), interest-cohort=(), notifications=()
Content-Security-Policy: frame-ancestors 'self'
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

5. **Save** and purge HTML cache if headers do not appear immediately.
6. Verify with [securityheaders.com](https://securityheaders.com/?q=rianell.com) — grade should not be capped by missing `frame-ancestors`.

**Note:** If you also set a full HTTP `Content-Security-Policy` (section B below), merge `frame-ancestors 'self'` into that single CSP value instead of a duplicate CSP header.

### Responsible disclosure

Ship **`/.well-known/security.txt`** from the PWA build (`apps/pwa-webapp/.well-known/security.txt`). CI verifies presence via `verify-sri-integrity.mjs`.

## Barcode food lookup (Plan 04) — required `connect-src`

Barcode logging fetches **[Open Food Facts](https://world.openfoodfacts.org/)** (`GET https://world.openfoodfacts.org/api/v2/product/{barcode}`). No API key.

| Host | Purpose |
|------|---------|
| `https://world.openfoodfacts.org` | Product lookup when user enables barcode food logging |

If missing from **HTTP** CSP, lookups fail with `violates Content Security Policy` even when the meta tag allows the host.

## Smartlook session recording — required `script-src` + `connect-src`

Opt-in session recording loads the Smartlook Web SDK and sends analytics to EU hosts. Required in **both** directives when edge CSP is set:

| Host | Purpose |
|------|---------|
| `https://web-sdk.smartlook.com` | Web SDK script |
| `https://*.smartlook.com` | Analytics API |
| `https://*.smartlook.cloud` | Analytics API (EU) |

See [docs/privacy/smartlook-session-recording.md](../docs/privacy/smartlook-session-recording.md).

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
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' https://cdn.jsdelivr.net https://www.paypal.com https://web-sdk.smartlook.com https://*.smartlook.com https://*.smartlook.cloud; worker-src 'self' blob: https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' data: https://cdn.jsdelivr.net https://fonts.gstatic.com; connect-src 'self' https://*.supabase.co https://tcoynycktablxankyriw.supabase.co https://cdn.jsdelivr.net https://huggingface.co https://*.huggingface.co https://cas-bridge.xethub.hf.co https://*.xethub.hf.co https://*.aws.cdn.hf.co https://raw.githubusercontent.com https://api.open-meteo.com https://air-quality-api.open-meteo.com https://world.openfoodfacts.org https://www.paypal.com https://www.paypalobjects.com https://www.sandbox.paypal.com https://api.paypal.com https://api.sandbox.paypal.com https://c.paypal.com https://web-sdk.smartlook.com https://*.smartlook.com https://*.smartlook.cloud; frame-src 'self' https://www.paypal.com https://www.paypalobjects.com https://www.sandbox.paypal.com; form-action 'self' https://www.paypal.com https://www.paypalobjects.com; base-uri 'self';
```

**Note:** Project-specific Supabase host and PayPal endpoints are embedded above; adjust **`connect-src`** / **`frame-src`** if your deployment uses different hosts.

## Permissions-Policy: `notifications`

Chromium may log:

`Error with Permissions-Policy header: Unrecognized feature: 'notifications'.`

The **`notifications`** token is not consistently recognised as a Permissions-Policy feature across browsers. **Remove** `notifications=(self)` from the edge **`Permissions-Policy`** header until you confirm support for your target browsers. Web Notifications can still work via the usual permission prompt; this header only pre-declares policy.

**Safer minimal example:**

```http
Permissions-Policy: microphone=(self), geolocation=(self), camera=(), interest-cohort=(), notifications=()
```

Do **not** use `notifications=(self)` — Chromium may reject the token. Web Notifications still work via the browser permission prompt.

Tune **`microphone`**, **`geolocation`**, and **`camera`** to match product needs.

### Deprecated headers — remove from Cloudflare

| Header | Action |
|--------|--------|
| `Expect-CT` | **Remove** — deprecated since Chrome 106 |
| `Feature-Policy` | **Remove** — replaced by `Permissions-Policy` |
| Duplicate narrow HTTP `Content-Security-Policy` | **Remove or align** — see section A/B above |
## Console noise that is not the site

- **`lockdown-install.js`**, **`SES Removing unpermitted intrinsics`** — often **browser extensions** (wallet / security tools), not Rianell.
- **`tabs:outgoing.message.ready`**, **`vendor.js`** — typically **extension** messaging, not app code.
- **`rokt.com`** preload — third-party / ads; often extensions or injected scripts.
- **`beforeinstallpromptevent.preventDefault()`** — PWA install UX; informational.

See also **[docs/infrastructure-and-security-edge.md](../docs/infrastructure-and-security-edge.md)** and **[SECURITY.md](../docs/SECURITY.md)** (CSP section).

## Bug reports rate limiting (Supabase REST)

`bug_reports` allows anonymous INSERT via RLS. Add a **Cloudflare WAF** custom rule:

| Setting | Value |
|---------|-------|
| Expression | `(http.request.uri.path contains "/rest/v1/bug_reports")` |
| Action | Block |
| Rate | 5 requests per minute per IP |

Document in incident response if abuse is detected.

## Artifact path redirect (post–architecture migration)

After renaming **`artifacts/`** → **`artifacts/`** on GitHub Pages, apply a **Bulk Redirect** or **Redirect Rule** in Cloudflare:

| Source | Target | Status |
|--------|--------|--------|
| `/artifacts/*` | `/artifacts/$1` | **301** |

This preserves bookmarks and external links that still use the old path with a space-encoded URL.

## Cache rules (launch audit Phase 5)

Use **Cache Rules** (or legacy Page Rules) on zone **rianell.com** to balance freshness and edge performance. Adjust if your Pages origin path differs.

| Rule name | When | Cache eligibility | Edge TTL | Browser TTL |
|-----------|------|-------------------|----------|-------------|
| **HTML no-store** | `(http.request.uri.path eq "/" or http.request.uri.path.extension eq "html")` | Bypass cache **or** TTL 0 with revalidate | 0 | `max-age=0, must-revalidate` |
| **Hashed static assets** | `(http.request.uri.path contains ".min.") or (http.request.uri.path.extension in {"js" "css" "woff2" "png" "webp" "svg" "json"})` | Eligible | 1 year | 1 year (`immutable` if fingerprinted) |
| **i18n / locale packs** | `(http.request.uri.path contains "/i18n-packs/")` | Eligible | 7 days | 1 day |
| **API / Supabase** | `(http.host contains "supabase.co")` | **Bypass** — not on rianell.com zone; document for cross-origin fetches | — | — |

**Notes:**

- Do **not** long-cache `index.html` or `sw.js` — users must receive new CSP/SRI hashes after deploy.
- After deploy, **Purge Everything** or purge `/` + `/sw.js` if HTML appears stale.
- `connect-src` fetches (Open-Meteo, Hugging Face) are **browser** caches; edge rules apply only to same-origin static assets.
- Align with [performance-budget.md](../docs/performance-budget.md) boot targets.

## DNS hygiene — dangling A records and DMARC

### Dangling A records (Moderate — subdomain takeover risk)

A **dangling A record** is a DNS A record whose IP address is no longer under your control (the resource at that IP was released, expired, or reassigned). An attacker who claims that IP can then serve content under your subdomain.

**How to audit:**

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/) → zone **rianell.com**.
2. **DNS** → **Records** — review all **A** and **AAAA** records.
3. For each A record, verify the target IP still serves rianell.com content by running:
   ```bash
   curl -I -H "Host: rianell.com" https://<IP>
   ```
4. Remove any A record whose IP does not respond correctly to your hostname.

**Common sources of dangling A records:**

- Old GitHub Pages IPs (pre-custom-domain migration) — `185.199.108.153` through `185.199.111.153`
- Cloudflare Tunnel or Argo IPs left over after tunnel deletion
- Heroku/Render/Railway ephemeral IPs
- Cloud VM IPs released when instance was deleted

**Recommended action:** Delete A records that no longer correspond to active, verified resources. If the A record is for `www.rianell.com` and the site is now served via Cloudflare Pages or a CNAME, replace the A record with a CNAME (or Cloudflare CNAME flattening) to the appropriate target.

---

### DMARC missing / misconfigured (Low — email spoofing risk)

Without a valid DMARC record, anyone can send email claiming to be from `rianell.com`. Add the following DNS TXT record:

| DNS field | Value |
|-----------|-------|
| **Name** | `_dmarc` |
| **Type** | `TXT` |
| **TTL** | 3600 |
| **Content** | `v=DMARC1; p=quarantine; rua=mailto:security@rianell.com; ruf=mailto:security@rianell.com; adkim=s; aspf=s; pct=100` |

**Policy explanation:**

- `p=quarantine` — suspicious mail goes to spam (use `p=reject` once confirmed no legitimate mail is lost)
- `rua` — aggregate reports sent to your security inbox
- `ruf` — forensic reports for individual failures
- `adkim=s` / `aspf=s` — strict alignment with DKIM and SPF

**Prerequisites:** Ensure you also have valid **SPF** and **DKIM** records:

```dns
; SPF — authorize only your mail service(s)
rianell.com   TXT  "v=spf1 include:_spf.google.com ~all"

; DKIM — check your email provider's dashboard for the public key
mail._domainkey.rianell.com  TXT  "v=DKIM1; k=rsa; p=<public-key>"
```

Replace `_spf.google.com` with your actual mail provider's SPF include. If you do **not** send email from `rianell.com`, use:

```dns
rianell.com   TXT  "v=spf1 -all"
_dmarc.rianell.com  TXT  "v=DMARC1; p=reject; adkim=s; aspf=s"
```

Verify with [MXToolbox DMARC check](https://mxtoolbox.com/DMARC.aspx) after DNS propagation (typically ≤ 1 hour at TTL 3600).

---

## AI crawler blocking

### Cloudflare "Block AI bots" toggle

Enable the native bot-blocking toggle in Cloudflare:

1. [Cloudflare Dashboard](https://dash.cloudflare.com/) → zone **rianell.com**
2. **Security** → **Bots** → **Bot Fight Mode** (or **Super Bot Fight Mode** on Pro+ plans)
3. Toggle **Block AI scrapers and crawlers** → **On**
4. Save.

This blocks known AI training crawlers at the edge before they reach the origin.

### robots.txt (HTTP-level declaration)

`apps/pwa-webapp/robots.txt` is shipped with the site and declares `Disallow: /` for all major AI training agents (GPTBot, Google-Extended, Claude-Web, CCBot, Bytespider, PerplexityBot, and others). This is honoured by compliant crawlers and signals intent for legal/policy purposes even where edge blocking is not configured.

**Verify the file is served after deploy:**

```bash
curl https://rianell.com/robots.txt
```

---

## Share link routing (`rianell.com/share/*`)

Hosted encrypted share links use GitHub Pages `404.html` to redirect `/share/{CODE}` → `/#share/{CODE}`. Cloudflare should **not** cache these paths and should rate-limit abusive access.

### WAF custom rules (Dashboard → Security → WAF → Custom rules)

| Rule | Expression | Action |
|------|------------|--------|
| **Share path rate limit** | URI Path starts with `/share/` | Rate limit: **30 requests / minute / IP** |
| **Share path injection block** | URI Path starts with `/share/` **and** URI Query contains `<`, `>`, `{`, or `}` | **Block** |

### Cache rule (Dashboard → Caching → Cache Rules)

| Rule | When | Cache status |
|------|------|--------------|
| **Bypass share paths** | URI Path starts with `/share/` | **Bypass cache** |

**Notes:**

- No `wrangler.toml` or Page Rule redirect is required — GitHub Pages serves `apps/pwa-webapp/404.html` for unmatched `/share/*` paths; Cloudflare forwards the request normally.
- The SPA decrypts share payloads client-side after fetching ciphertext from Supabase; edge cache bypass avoids serving stale HTML for share entry URLs.
- Document in incident response if share-link abuse (enumeration, brute-force passwords) is detected.
