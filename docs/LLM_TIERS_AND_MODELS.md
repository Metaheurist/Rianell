# On-device LLM: Tiers and models

The app uses **Transformers.js** with ONNX-converted FLAN-T5 models from the Xenova org on Hugging Face. The performance benchmark assigns a **tier (1–5)**; each tier maps to a model used for the AI summary note and suggest note.

## Tier → model and links

| Tier | Model ID | Hugging Face link | Notes |
|------|----------|--------------------|--------|
| 1 | `Xenova/flan-t5-small` | https://huggingface.co/Xenova/flan-t5-small | Smallest; fastest, lowest memory. |
| 2 | `Xenova/flan-t5-small` | https://huggingface.co/Xenova/flan-t5-small | Same as tier 1. |
| 3 | `Xenova/flan-t5-base` | https://huggingface.co/Xenova/flan-t5-base | Better quality, more RAM. |
| 4 | `Xenova/flan-t5-base` | https://huggingface.co/Xenova/flan-t5-base | Same as tier 3. |
| 5 | `Xenova/flan-t5-base` | https://huggingface.co/Xenova/flan-t5-base | Top tier; base used (see below). |

**Why tier 5 uses base:** `Xenova/flan-t5-large` (https://huggingface.co/Xenova/flan-t5-large) often returns **401 Unauthorized** when loaded from the browser (Hugging Face may gate the repo). The app therefore uses **flan-t5-base** for tier 5 so high-end devices do not hit 401s. If flan-t5-large becomes publicly accessible again, tier 5 can be switched back to it in `web/summary-llm.js` (`LLM_TIER_MODELS` and `llmTierOrSizeToModelId`).

## How models are loaded

- The library loads models from **Hugging Face** by default (config, tokenizer, and ONNX weights).
- The script uses **@huggingface/transformers@3.2.0** from the jsDelivr CDN; the pipeline then fetches model files from `https://huggingface.co/` (e.g. `Xenova/flan-t5-small`).

## Serving models from your own server (optional)

To serve the models from your own origin instead of the Hugging Face CDN:

1. **Download the model files** from the Hugging Face repo (e.g. for flan-t5-small: `config.json`, `tokenizer.json`, `tokenizer_config.json`, and the files under `onnx/`). The Transformers.js library expects the same layout (root config/tokenizer + `onnx/` subfolder).
2. **Host them** under a path your app can reach (e.g. `/models/flan-t5-small/`).
3. **Point the library at that URL**: Transformers.js supports a custom base URL via the pipeline options or environment. For example, with `allowLocalModels` and a path, or by setting a base URL if the version you use supports it, you would pass that base URL when calling `pipeline('text2text-generation', ...)`. Check the [Transformers.js docs](https://huggingface.co/docs/transformers.js) for the current API (e.g. `config.modelBasePath` or similar).
4. **CSP**: If you serve from your own domain, ensure `connect-src` in `index.html` allows your origin; no change needed for Hugging Face if you keep using HF.

The app does **not** ship model weights in the repo (they are large). Local serving is optional and useful for air-gapped or controlled environments.
