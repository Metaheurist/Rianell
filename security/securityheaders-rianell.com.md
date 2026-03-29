---
source: securityheaders.com
scan_url: "https://securityheaders.com/?q=rianell.com&followRedirects=on"
generated_utc: 2026-03-29T17:40:43.434Z
github_run_number: 212
github_sha: 2c90097
github_run_id: 23715003414
securityheaders_http_status: 403
securityheaders_scan: blocked_or_unavailable
---

# Security headers report (CI)

The automated request to **[securityheaders.com](https://securityheaders.com/)** did not return a usable scan page from this runner (often **HTTP 403**: bot protection / Cloudflare on datacenter IPs). Below is a **direct fetch** of response headers from the live site.

## Live site response headers

**URL:** https://rianell.com

**HTTP status:** 403  
**Final URL:** https://rianell.com/  
**Response body length (bytes):** 5257

| Header | Value |
| --- | --- |
| accept-ch | Sec-CH-UA-Bitness, Sec-CH-UA-Arch, Sec-CH-UA-Full-Version, Sec-CH-UA-Mobile, Sec-CH-UA-Model, Sec-CH-UA-Platform-Version, Sec-CH-UA-Full-Version-List, Sec-CH-UA-Platform, Sec-CH-UA, UA-Bitness, UA-Arch, UA-Full-Version, UA-Mobile, UA-Model, UA-Platform-Version, UA-Platform, UA |
| alt-svc | h3=":443"; ma=86400 |
| cf-mitigated | challenge |
| cf-ray | 9e40a94bbfd6ebeb-SJC |
| connection | close |
| content-encoding | br |
| content-security-policy | default-src 'self'; script-src 'self' 'unsafe-inline' https://*.supabase.co; connect-src 'self' https://*.supabase.co wss://*.supabase.co; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://*.supabase.co; |
| content-type | text/html; charset=UTF-8 |
| critical-ch | Sec-CH-UA-Bitness, Sec-CH-UA-Arch, Sec-CH-UA-Full-Version, Sec-CH-UA-Mobile, Sec-CH-UA-Model, Sec-CH-UA-Platform-Version, Sec-CH-UA-Full-Version-List, Sec-CH-UA-Platform, Sec-CH-UA, UA-Bitness, UA-Arch, UA-Full-Version, UA-Mobile, UA-Model, UA-Platform-Version, UA-Platform, UA |
| cross-origin-embedder-policy | require-corp |
| cross-origin-opener-policy | same-origin |
| cross-origin-resource-policy | same-origin |
| date | Sun, 29 Mar 2026 17:40:43 GMT |
| expect-ct | max-age=86400, enforce |
| nel | {"report_to":"cf-nel","success_fraction":0.0,"max_age":604800} |
| origin-agent-cluster | ?1 |
| permissions-policy | accelerometer=(),browsing-topics=(),camera=(),clipboard-read=(),clipboard-write=(),geolocation=(),gyroscope=(),hid=(),interest-cohort=(),magnetometer=(),microphone=(),payment=(),publickey-credentials-get=(),screen-wake-lock=(),serial=(),sync-xhr=(),usb=(), microphone=(self), geolocation=(self), notifications=(self), camera=(), interest-cohort=() |
| referrer-policy | same-origin |
| report-to | {"group":"cf-nel","max_age":604800,"endpoints":[{"url":"https://a.nel.cloudflare.com/report/v4?s=%2BjdH0F1KBF1IyPHO1xEcBi3Pg8Tlu40vk99ZOT4fSQdOlLStgx3PtGuLkv%2B5etjUczucQ7VICxLN64BKuyodxIuV4LF0iQ58kznlev3aE0Nph6tCkVH2xYV1ps201g%3D%3D"}]} |
| server | cloudflare |
| server-timing | chlray;desc="9e40a94bbfd6ebeb", cfEdge;dur=3,cfOrigin;dur=0 |
| speculation-rules | "/cdn-cgi/speculation" |
| strict-transport-security | max-age=2592000; includeSubDomains; preload |
| transfer-encoding | chunked |
| x-content-type-options | nosniff |
| x-frame-options | SAMEORIGIN |
| x-xss-protection | 1; mode=block |

