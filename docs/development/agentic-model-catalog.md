# Agentic model catalog

Source of truth: [`scripts/dev/agentic-pipeline/model-catalog.json`](../../scripts/dev/agentic-pipeline/model-catalog.json).

| Pack | Recommended |
|------|-------------|
| design / planning / a11y / seo / privacy / security / deps / migration / bootllm / perf / rtl | `qwen2.5-coder:32b` |
| changelog / wikisync / image | `qwen2.5-coder:14b` |
| i18n | `translategemma:27b` |
| visual polish | `gemma4:31b-it-qat` |
| visual gen | `qwen3.6:35b` |

Exclusive groups: `visual-gen-polish`, `large-on-gpu`, `translategemma-large`, `security-apply`.  
Hardware profile probe: `npm run agentic:hw-profile`.
