---
source: securityheaders.com
scan_url: "https://securityheaders.com/?q=rianell.com&followRedirects=on"
generated_utc: 2026-10-02T14:40:52.447Z
github_run_number: 849
github_sha: c564dd9
github_run_id: 37021074795
securityheaders_http_status: 403
securityheaders_scan_relay: direct
securityheaders_scan: blocked_or_unavailable
---

# Security headers report (CI)

The **[securityheaders.com](https://securityheaders.com/)** scan page was not usable after **direct** fetch and optional **relay** attempts (`allorigins`, `corsproxy.io`). Datacenter IPs are often blocked. Browser-only proxy homepages (e.g. Proxyium) are not used — they have no stable API for CI.

Below: **response headers** from the live site URL(s) (`SECURITY_HEADERS_LIVE_URLS` / `SECURITY_HEADERS_FALLBACK_SITE`), fetched with a **browser-like** User-Agent. **HTTP 403** may still include useful `Content-Security-Policy`, `Strict-Transport-Security`, etc., when Cloudflare serves a challenge page.

## Live site response headers

**URLs tried (in order):** `https://rianell.com`, `https://www.rianell.com`

**Chosen URL:** https://rianell.com  
**HTTP status:** 403  
**Final URL:** https://rianell.com/  
**Response body length (bytes):** 5849

| Header | Value |
| --- | --- |
| accept-ch | Sec-CH-UA-Bitness, Sec-CH-UA-Arch, Sec-CH-UA-Full-Version, Sec-CH-UA-Mobile, Sec-CH-UA-Model, Sec-CH-UA-Platform-Version, Sec-CH-UA-Full-Version-List, Sec-CH-UA-Platform, Sec-CH-UA, UA-Bitness, UA-Arch, UA-Full-Version, UA-Mobile, UA-Model, UA-Platform-Version, UA-Platform, UA |
| alt-svc | h3=":443"; ma=86400 |
| cf-mitigated | challenge |
| cf-ray | a44476f87d3073eb-IAD |
| connection | close |
| content-encoding | br |
| content-security-policy | default-src 'none'; script-src 'nonce-coJwQhxTBAL1EsoGsKQjSV' 'unsafe-eval' https://challenges.cloudflare.com; script-src-attr 'none'; style-src 'unsafe-inline'; img-src 'self' https://challenges.cloudflare.com; connect-src 'self' https://challenges.cloudflare.com; frame-src 'self' https://challenges.cloudflare.com blob:; child-src 'self' https://challenges.cloudflare.com blob:; worker-src blob:; form-action http: https:; base-uri 'self' |
| content-type | text/html; charset=UTF-8 |
| critical-ch | Sec-CH-UA-Bitness, Sec-CH-UA-Arch, Sec-CH-UA-Full-Version, Sec-CH-UA-Mobile, Sec-CH-UA-Model, Sec-CH-UA-Platform-Version, Sec-CH-UA-Full-Version-List, Sec-CH-UA-Platform, Sec-CH-UA, UA-Bitness, UA-Arch, UA-Full-Version, UA-Mobile, UA-Model, UA-Platform-Version, UA-Platform, UA |
| cross-origin-embedder-policy | require-corp |
| cross-origin-opener-policy | same-origin |
| cross-origin-resource-policy | same-origin |
| date | Fri, 02 Oct 2026 14:40:52 GMT |
| expect-ct | max-age=86400, enforce |
| nel | {"report_to":"cf-nel","success_fraction":0.0,"max_age":604800} |
| origin-agent-cluster | ?1 |
| permissions-policy | accelerometer=(),camera=(),clipboard-read=(),clipboard-write=(),geolocation=(),gyroscope=(),hid=(),magnetometer=(),microphone=(),payment=(),publickey-credentials-get=(),screen-wake-lock=(),serial=(),sync-xhr=(),usb=(),xr-spatial-tracking=* |
| referrer-policy | same-origin |
| report-to | {"group":"cf-nel","max_age":604800,"endpoints":[{"url":"https://a.nel.cloudflare.com/report/v4?s=cxAuay%2B22N2kqkN2Uao3bt0Tt38lyqbLn%2BfaoMCJtlSB%2BWZ%2FDKMZ8V%2BYUVcDv%2B%2FXj7xS%2B96GrKCrITEc6FfZuVjQIgqgXtRJMAVonWsjvmvQZV81dHY5gsnotXZD%2Bg%3D%3D"}]} |
| server | cloudflare |
| server-timing | chlray;desc="a44476f87d3073eb" |
| speculation-rules | "/cdn-cgi/speculation" |
| strict-transport-security | max-age=31536000; includeSubDomains; preload |
| transfer-encoding | chunked |
| x-content-type-options | nosniff |
| x-frame-options | SAMEORIGIN |
| x-xss-protection | 1; mode=block |

