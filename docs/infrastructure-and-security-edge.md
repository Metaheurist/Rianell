# Infrastructure and security (edge)

Rianell is a **privacy-first** progressive web app. The public site is built as static assets and hosted on **GitHub Pages**, while **Cloudflare** provides DNS, proxying, caching, and an additional security and delivery layer in front of that origin. This document describes that architecture at a **high level** so contributors and self-hosters understand the model. It does **not** include account identifiers, API tokens, zone IDs, or other secrets. Configure those only in your own dashboard and `security/` files (see [SECURITY.md](SECURITY.md)).

## DNS and traffic flow

- **DNS** for the production hostname is managed in Cloudflare. Records point visitors at the appropriate services (for example GitHub Pages for the static site). Exact record names and targets depend on your setup; keep them out of public documentation.
- **Proxy status** (orange cloud) means HTTP(S) traffic is handled on Cloudflare’s network before it reaches the origin, which enables caching, TLS, and security features described below.

## Security posture (defence in depth)

These controls are typical for a static site behind Cloudflare. Enable and tune them in the Cloudflare dashboard for your zone; product names follow [Cloudflare’s documentation](https://developers.cloudflare.com/).

### HTTPS and HSTS

- Enforce **HTTPS** for visitors so connections are encrypted end to end between the browser and the edge. Cloudflare documents **Always Use HTTPS** under [SSL/TLS edge certificates](https://developers.cloudflare.com/ssl/edge-certificates/additional-options/always-use-https/).
- **HTTP Strict Transport Security (HSTS)** tells supporting browsers to use HTTPS only for your host, reducing the risk of downgrade attacks and cookie hijacking. See [HTTP Strict Transport Security (HSTS)](https://developers.cloudflare.com/ssl/edge-certificates/additional-options/http-strict-transport-security/). Do not enable HSTS until HTTPS is stable; follow Cloudflare’s requirements and warnings in that guide.

### Content Security Policy (CSP) and Permissions-Policy

- A **strict CSP** reduces cross-site scripting risk by restricting which scripts and origins may run or load. You may set policy at the origin, use Cloudflare **client-side security** rules (which add CSP headers per [client-side security](https://developers.cloudflare.com/client-side-security/)), or use **Response Header Transform Rules** to set or override headers on responses ([Response Header Transform Rules](https://developers.cloudflare.com/rules/transform/response-header-modification/)). If both origin and Cloudflare add CSP headers, browsers combine policies; avoid duplicate conflicting **Add** operations (see Cloudflare’s client-side security troubleshooting).
- **Permissions-Policy** (formerly Feature-Policy) can limit powerful browser features (for example microphone, camera, geolocation) to what the product actually needs. These are often set via the same response header mechanisms as CSP.

### Automated script and supply-chain visibility

- Use Cloudflare **client-side security** and monitoring features where appropriate to detect unexpected changes or risky scripts in the browser context. Complement this with your own review of build pipelines and dependencies (see [SECURITY.md](SECURITY.md)).

## Performance and delivery

- **Caching** at the edge reduces latency worldwide for static assets. Cache behaviour depends on page rules, cache rules, and response headers from the origin.
- **Modern TLS** (for example TLS 1.3) and **IPv6** support depend on Cloudflare and origin configuration; see [SSL/TLS](https://developers.cloudflare.com/ssl/) and your host’s documentation.
- **URL normalisation** (consistent paths, trailing slashes, encoded characters) avoids duplicate URLs and unnecessary misses in cache. Cloudflare **Transform Rules** can help rewrite URLs where appropriate ([Transform Rules](https://developers.cloudflare.com/rules/transform/)).

## Bot and abuse protection

- **Bot Fight Mode** (free) helps detect and mitigate obvious automated traffic; see [Bot Fight Mode](https://developers.cloudflare.com/bots/get-started/bot-fight-mode/). Paid plans may use **Super Bot Fight Mode** with more options ([Super Bot Fight Mode](https://developers.cloudflare.com/bots/get-started/super-bot-fight-mode/)). These features can affect API or automated clients; tune or add exceptions if you see false positives ([false positives](https://developers.cloudflare.com/bots/troubleshooting/false-positives/)).
- **JavaScript detections** and related bot mitigations are described in Cloudflare’s bot documentation; balance security against compatibility for legitimate users.

## Static hosting (GitHub Pages)

- Production static files are produced by CI and published with **GitHub Pages**. The app repository and workflow define the build; see [GitHub Pages documentation](https://docs.github.com/en/pages) for generic setup. Do not commit build secrets into the public repo; use GitHub **secrets** for injectable values in Actions.

## Vulnerability disclosure

- Follow the process in [SECURITY.md](SECURITY.md) and publish a **`security.txt`** file at `/.well-known/security.txt` on the live site where possible ([well-known URIs](https://www.rfc-editor.org/rfc/rfc9116) summarise the convention).

## Automated header reports (CI)

- CI writes **[SecurityHeaders.com](https://securityheaders.com/)**-style Markdown under **`security/`**: **`securityheaders-rianell.com.md`** (latest) and per-run history **`security/securityheaders-runs/run-*.md`** (GitHub Actions run number in the filename). See **[security/README.md](../security/README.md)** for how relays and fallbacks work when scans are blocked.

## Related reading

- [SECURITY.md](SECURITY.md) - threat model and application controls  
- [security/README.md](../security/README.md) - security header report artifacts and CI job  
- [setup-and-usage.md](setup-and-usage.md) - local and hosted usage  
- [testing-and-configuration.md](testing-and-configuration.md) - tests and configuration
