# Digital Services Act (DSA) - compliance notes

**Product:** Rianell  
**Last updated:** 2026-06-23  
**Status:** Launch audit Phase 4 - operator checklist. Not legal advice.  
**Related:** [app-store-declarations.md](app-store-declarations.md) · [incident-response.md](../incident-response.md) · [SECURITY.md](../SECURITY.md)

---

## 1. Service classification

| Aspect | Rianell position |
|--------|------------------|
| Hosting | Static PWA on GitHub Pages + Cloudflare; optional Supabase backend |
| Intermediary vs own content | **Own service** - no third-party user-generated public feeds |
| EU establishment | Operator documents EU contact in privacy policy |

Rianell is **not** a VLOP. Primary obligations: transparency, notice-and-action for illegal content (limited surface), and complaint handling.

---

## 2. Illegal content and notice-and-action

| Surface | Risk | Mitigation |
|---------|------|------------|
| Bug reports (`bug_reports`) | Spam / abusive text | RLS + rate limit at Cloudflare; maintainer review |
| Research pool | Low - encrypted blobs | k-anon RPCs; no public display |
| Community features | Not shipped | N/A |

**Process:** Reports to security contact in `/.well-known/security.txt`. Remove or block abusive bug-report IPs; document in incident log.

---

## 3. Transparency reporting

- Publish annual summary if EU user base grows materially (DSA Art. 15).
- Maintain [subprocessors.md](../privacy/subprocessors.md) and RoPA for data processing transparency.

---

## 4. Terms and contact

| Item | Location |
|------|----------|
| Privacy / terms | In-app Settings → Privacy; `docs/privacy/` |
| Single point of contact | SECURITY.md maintainer channel |
| security.txt | `apps/pwa-webapp/.well-known/security.txt` |

---

## 5. Trader / store obligations

- Google Play and App Store listings must match actual data practices - see [app-store-declarations.md](app-store-declarations.md).
- No dark patterns on consent toggles; reversible opt-outs in Settings.

---

## 6. Pre-launch checklist

- [ ] Confirm privacy policy URL live on store listings
- [ ] Confirm bug-report abuse WAF rule (Cloudflare) - see [cloudflare-headers-recommended.md](../../security/cloudflare-headers-recommended.md)
- [ ] Confirm EU representative if required by counsel
- [ ] Log DSA-related complaints in incident-response execution log
