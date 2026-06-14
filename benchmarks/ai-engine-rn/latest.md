# ai-engine-rn

Kind: **ai_engine_rn** · Status: **ok** · schema v4

## Run metadata

| Key | Value |
| --- | --- |
| timestamp_utc | 2026-06-14T11:51:24.925Z |
| git_sha | local |
| runner | win32 |
| node | v24.14.1 |
| runtime | jest |
| fixtures | logs_30,logs_365 |
| probe_count | 4 |

## Probes

| fixture | probe | type | ms | status |
| --- | --- | --- | --- | --- |
| logs_365 | rn_summarize_14 | rn | 14 | ok |
| logs_365 | rn_summarize_30 | rn | 2 | ok |
| logs_365 | rn_summarize_90 | rn | 1 | ok |
| logs_30 | rn_package_parity | rn | 0 | ok |

## Optimization

- **slowest_probe**: "rn_summarize_14"
- **slowest_fixture**: "logs_365"
- **slowest_ms**: 14
