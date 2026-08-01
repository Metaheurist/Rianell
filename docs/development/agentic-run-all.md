# Agentic run-all

```bash
npm run agentic:run-all -- --dry-run
npm run agentic:run-all -- --skip=image,changelog
POST /api/agentic/run-all { "dryRun": true, "skip": [], "stopOnBroken": true }
```

Order (fixed, serial, unload between packs):

1. design 2. planning 3. i18n 4. rtl 5. a11y 6. seo 7. privacy 8. security  
9. deps 10. migration 11. changelog 12. wikisync 13. image 14. bootllm 15. perf 16. visual

State: `artifacts/agentic/run-all-state.json`.
