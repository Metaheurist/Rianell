# Transformers.js v4 migration notes (Stage 8)

**Current production pin:** `@huggingface/transformers@3.3.2`  
**Stable docs reference:** v3.8.1 (npm)  
**Target:** v4 when parity gate passes

## Pre-migration checklist

1. Run `node scripts/research/factcheck-transformers-v4.mjs` (npm audit + doc diff).  
2. Bump with `TRANSFORMERS_VENDOR_VERSION=4.x.x npm run vendor:transformers` only on a spike branch.  
3. Full gate: `npm run agentic:gpu-v1 -- --track pwa` + `PROBE_TIER=5 node scripts/test/gpu-llama-matrix.mjs`.  
4. Update `llm-security-contract.mjs` CDN pin strings in `summary-llm.js`.  
5. Keep 3.3.2 vendor tarball for rollback (`localStorage.rianellTransformersCdn=1` or restore `vendor/transformers/`).

## Known v4 considerations (verify at bump time)

- Pipeline API and dtype names may change - re-run `buildPwaLoadAttempts` unit tests.  
- WebGPU remains `device: 'webgpu'` via ORT inside bundled dist.  
- WebNN devices (`webnn-gpu`, etc.) - confirm in v4 `supportedDevices` before enabling in ladder.  
- ORT WASM file names may differ - update `vendor-transformers.mjs` FILES list.  
- Do **not** bump mid-V1 WebLLM spike; v4 is Stage 8 after PWA core GPU ship.

## Rollback

1. Restore `vendor/transformers/` from 3.3.2 manifest commit.  
2. Revert package.json overrides to `3.3.2`.  
3. `npm run vendor:transformers && npm run agentic:gpu-v1 -- --track pwa`


## Automated audit (2026-06-17T21:30:19.229Z)

```json
{
  "auditReportVersion": 2,
  "vulnerabilities": {},
  "metadata": {
    "vulnerabilities": {
      "info": 0,
      "low": 0,
      "moderate": 0,
      "high": 0,
      "critical": 0,
      "total": 0
    },
    "dependencies": {
      "prod": 711,
      "dev": 357,
      "optional": 66,
      "peer": 2,
      "peerOptional": 0,
      "total": 1101
    }
  }
}

```
