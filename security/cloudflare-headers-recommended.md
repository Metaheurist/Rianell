# Cloudflare response headers (recommended for rianell.com)

The PWA ships a full **Content Security Policy** in **`apps/pwa-webapp/index.html`** (meta tag). If **Cloudflare** (or another edge) also sends **`Content-Security-Policy`** on HTML responses, browsers **combine** policies: a resource must satisfy **every** CSP. A **narrow HTTP CSP** (for example only `script-src 'self' 'unsafe-inline' https://*.supabase.co`) blocks scripts and styles that the meta tag allows, which produces console errors such as:

- `Loading the script … violates … script-src` (often **`cdn.jsdelivr.net`** — Supabase UMD, Hugging Face Transformers, helpers)
- `Loading the stylesheet … violates … style-src` (**`fonts.googleapis.com`**, **`cdn.jsdelivr.net`** Font Awesome)
- `Supabase library not loaded` / dynamic import failures for **`@huggingface/transformers`**

## Fix (pick one)

### A) Prefer: remove duplicate HTTP `Content-Security-Policy` (recommended)

For HTML routes on **`rianell.com`**, **do not** set **`Content-Security-Policy`** in Cloudflare **Transform Rules**, **client-side security**, or Page Rules. Rely on the **meta** CSP in **`index.html`** so one policy applies and stays in sync with releases.

### B) Align HTTP CSP with the app meta tag

If you must set CSP at the edge, copy the **`content`** value from the **`<meta http-equiv="Content-Security-Policy" content="…">`** line in **`apps/pwa-webapp/index.html`** on the same commit you deploy. **Do not** ship a shorter policy.

Single-line reference (keep in sync with that file when editing):

```http
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' https://cdn.jsdelivr.net https://www.paypal.com; worker-src 'self' blob: https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' data: https://cdn.jsdelivr.net https://fonts.gstatic.com; connect-src 'self' https://*.supabase.co https://tcoynycktablxankyriw.supabase.co https://cdn.jsdelivr.net https://huggingface.co https://*.huggingface.co https://cas-bridge.xethub.hf.co https://*.xethub.hf.co https://www.paypal.com https://www.paypalobjects.com https://www.sandbox.paypal.com https://api.paypal.com https://api.sandbox.paypal.com https://c.paypal.com; frame-src 'self' https://www.paypal.com https://www.paypalobjects.com https://www.sandbox.paypal.com; form-action 'self' https://www.paypal.com https://www.paypalobjects.com; base-uri 'self';
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
