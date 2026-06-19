# Plan 09 — References

## Internal

- [`apps/rn-app/src/screens/ChartsScreen.tsx`](../../../apps/rn-app/src/screens/ChartsScreen.tsx)
- [`apps/pwa-webapp/styles-charts.css`](../../../apps/pwa-webapp/styles-charts.css)

## Firecrawl research (local cache)

- `Chart.js/ApexCharts performance docs — debounce resize handlers`

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
firecrawl search "<plan-specific query>" --limit 5 --scrape -o .firecrawl/projects/plan-09.json
```
