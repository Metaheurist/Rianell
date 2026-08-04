# Agentic model catalog

Source of truth: [`scripts/dev/agentic-pipeline/model-catalog.json`](../../scripts/dev/agentic-pipeline/model-catalog.json).

| Pack | Recommended |
|------|-------------|
| design / planning / a11y / seo / privacy / security / deps / migration / bootllm / perf / rtl | `qwen3.6:35b` |
| changelog / wikisync / image | `qwen3:14b` |
| i18n | `translategemma:27b` |
| visual polish | `gemma4:31b-it-qat` |
| visual gen | `qwen3.6:35b` |

Qwen 2.5 models remain listed only as `rejectedDefault` (never recommended).

Exclusive groups: `visual-gen-polish`, `large-on-gpu`, `translategemma-large`, `security-apply`.

## Hardware profiles

Catalog: [`scripts/dev/agentic-pipeline/hardware-profiles.json`](../../scripts/dev/agentic-pipeline/hardware-profiles.json).

| Profile | Typical hardware | Model VRAM budget |
|---------|------------------|-------------------|
| `auto` | Probe each run | (detected) |
| `cpu_only` | No NVIDIA GPU | ≤ 4 GB |
| `single_8` | ~6–10 GB | ≤ 8 GB |
| `single_12` | ~10–14 GB | ≤ 12 GB |
| `single_16` | ~14–20 GB | ≤ 19 GB |
| `single_24` | ~20–28 GB | ≤ 24 GB |
| `dual_12_16` | ~12 + ~16 GB | ≤ 22 GB |
| `dual_balanced` | Other multi-GPU | ≤ 22 GB (largest card) |
| `workstation_48` | 40 GB+ | ≤ 48 GB |

- Probe: `npm run agentic:hw-profile`
- Override: Settings → **Hardware profile**, or `artifacts/agentic/mode.json` → `hardwareProfile`
- Live packs pass the effective profile into `resolvePackModel` so recommended models downshift to the largest **allowed** fit (e.g. `qwen3.6:35b` → `qwen3:14b` on `single_12`).
