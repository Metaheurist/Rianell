import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildTierMatrixPayload,
  BENCHMARK_RUN_SCHEMA_VERSION_V4,
} from '../../benchmarks/reporters/write-run-json.mjs';

test('buildTierMatrixPayload schema v4 shape', () => {
  const payload = buildTierMatrixPayload({
    slug: 'tier-matrix',
    meta: { git_sha: 'abc123' },
    runs: [
      {
        id: 'desktop-t1',
        tier: 1,
        platformType: 'desktop',
        aspects: {
          cold_load_ms: 2100,
          ai_engine_ms: 52,
          ai_llm_network_requests: 0,
          ai_llm_script_loaded: false,
          motd_llm_skipped: true,
        },
        status: 'ok',
      },
    ],
  });
  assert.equal(payload.schema_version, BENCHMARK_RUN_SCHEMA_VERSION_V4);
  assert.equal(payload.kind, 'tier_performance');
  assert.equal(payload.status, 'ok');
  assert.equal(payload.runs[0].aspects.ai_llm_network_requests, 0);
  assert.deepEqual(payload.meta.llm_blocked_tiers, [1, 2]);
});

test('buildTierMatrixPayload fails when any run fails', () => {
  const payload = buildTierMatrixPayload({
    slug: 'tier-matrix',
    meta: {},
    runs: [
      { id: 'desktop-t1', tier: 1, status: 'ok' },
      { id: 'desktop-t2', tier: 2, status: 'fail' },
    ],
  });
  assert.equal(payload.status, 'fail');
});
