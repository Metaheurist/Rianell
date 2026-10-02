# On-device LLM shortlist (October 2026)

Raw results: [llm-shortlist-benchmark-2026-10.json](llm-shortlist-benchmark-2026-10.json). Harness: [`scripts/models/benchmark-llm-shortlist.mjs`](../../scripts/models/benchmark-llm-shortlist.mjs).

## Outcome

The PWA ships three Transformers.js packages, all loaded by `workers/llm-worker.js` and pinned to a commit SHA (`LLM_PACKAGES` in `apps/pwa-webapp/summary-llm.js`):

| Package | Model | Device / dtype | Download | Used when |
|---|---|---|---|---|
| small | `onnx-community/Qwen3.5-0.8B-Text-ONNX` | WebGPU, q4f16 | ~470 MB | WebGPU and (mobile, `deviceMemory <= 4`, LLM safe mode, or tier 1-2) |
| large | `onnx-community/Qwen3.5-2B-ONNX-OPT` | WebGPU, q4f16 | ~1.3 GB | WebGPU desktop, or tier 3-5 |
| wasm | `onnx-community/Qwen2.5-0.5B-Instruct` | WASM, q4 | ~760 MB | No usable WebGPU, or a WebGPU load failed on this GPU |

Qwen3.5 runs with `enable_thinking: false` (passed through `tokenizer_encode_kwargs` to the chat template). Any leaked `<think>` block is stripped before display.

The previous MLC (WebLLM) and GGUF (wllama) engines, the load ladder and the "large model on WASM" setting were removed.

## Method

- Headed Chromium (Playwright persistent context, `--enable-unsafe-webgpu`) on Windows 11, NVIDIA Blackwell adapter. Headless Chromium on Windows exposes no WebGPU adapter.
- One fresh page per run, so a renderer crash only loses that run and GPU memory is released between models.
- Six tasks per run using the en-GB prompt pack: three message-of-the-day prompts, two grounded chat questions and one summary.
- `scoreOutput()` flags empty output, `<think>` leaks, repetition, prompt echo, over-length answers, MOTD-filter rejections, ungrounded answers and AI-assistant boilerplate. Every stored output was re-scored with the same function.

Timings come from a desktop GPU. They rank the candidates but do not predict phone latency.

## Results

| Model | Device / dtype | Load | Median generate | Quality | Notes |
|---|---|---|---|---|---|
| Qwen2.5-0.5B | WebGPU q4f16 | 25.0 s | 2.3 s | 1/6 | Degenerate, repetitive output |
| Qwen2.5-0.5B | WASM q4 | 14.1 s | 31.0 s | 6/6 | Slow but correct; kept as the no-WebGPU package |
| Qwen3.5-0.8B | WebGPU q4f16 | 3.2 s (12.0 s cold) | 1.5 s | 5/6 | One chat answer was an "I am an AI" refusal |
| Qwen3.5-0.8B | WASM q4 / quantized | - | - | - | Session fails: no `GatherBlockQuantized` WASM kernel |
| LFM2.5-1.2B | WebGPU q4f16 | 2.7 s | 0.5 s | 6/6 | Fastest, but rejected (language coverage, licence) |
| LFM2.5-1.2B | WASM q4 | - | - | - | Session fails: no `GatherBlockQuantized` WASM kernel |
| Qwen3.5-2B | WebGPU q4f16 | 48.9 s | 31.2 s | 6/6 | Standard export; too slow |
| Qwen3.5-2B-ONNX-OPT | WebGPU q4f16 | 39.2 s | 1.6 s | 6/6 | Same text as the standard export, about 19x faster |
| Gemma 4 E2B | WebGPU q2f16 | 73.7 s | - | - | `tokenizer.chat_template is not set` in Transformers.js 4.3; 2.2 GB |

## Decisions

- **Language contract.** Every shipped model must cover the locales that have full prompt packs: de, en, es, fr, it, nl, pl and pt. `tests/unit/llm-model-language-coverage.test.mjs` enforces this against `MODEL_LANGUAGE_SUPPORT` in `@rianell/llm`. LFM2.5 lists English, Arabic, Chinese, French, German, Japanese, Korean and Spanish only, so it fails. Its licence is the custom `lfm1.0` (HF `license: other`), which would need a separate review; the Qwen models are Apache-2.0.
- **Qwen3.5 quantized graphs are WebGPU-only.** ONNX Runtime Web's WASM backend has no `GatherBlockQuantized` kernel. A device without WebGPU therefore gets Qwen2.5-0.5B q4, which runs on WASM. The WASM package is now kept in the browser cache rather than re-downloaded every session.
- **OPT export for the large tier.** `Qwen3.5-2B-ONNX-OPT` produced identical text to the standard export and cut median generation from 31 s to 1.6 s.
- **Gemma 4** was not pursued: no chat template in this Transformers.js version, and a 2.2 GB download.

## Cache migration

`purgeLegacyModelCaches()` runs once per `LEGACY_PURGE_VERSION`, during browser idle time. It deletes WebLLM/TVM caches and IndexedDB databases, plus Hugging Face entries in the Transformers.js cache for models the app no longer ships.
