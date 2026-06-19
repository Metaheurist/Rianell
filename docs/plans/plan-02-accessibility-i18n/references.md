# Plan 02 — References

## Internal

- [`docs/ai-security.md §3 UGC`](../../ai-security.md))
- [`scripts/verify/i18n-all.mjs`](../../../scripts/verify/i18n-all.mjs)

## Firecrawl research (local cache)

- `.firecrawl/projects/owasp-health-mobile.json — HIPAA mobile encryption at rest`

## External (verify online)

| Topic | URL |
|-------|-----|
| OWASP MASVS | https://owasp.org/www-project-mobile-app-security/ |
| OWASP Top 10 2025 | https://owasp.org/Top10/2025/ |
| Web Push encryption | https://www.rfc-editor.org/rfc/rfc8291 |
| Supabase RLS | https://supabase.com/docs/guides/database/postgres/row-level-security |
| Transformers.js | https://huggingface.co/docs/transformers.js |

Re-run Firecrawl before major dependency bumps:

```bash
firecrawl search "<plan-specific query>" --limit 5 --scrape -o .firecrawl/projects/plan-02.json
```
