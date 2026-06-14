# ai-engine-package

Kind: **ai_engine_package** · Status: **ok** · schema v4

## Run metadata

| Key | Value |
| --- | --- |
| timestamp_utc | 2026-06-14T11:50:49.927Z |
| git_sha | local |
| runner | win32 |
| node | v24.14.1 |
| runtime | node |
| fixtures | logs_30,logs_365,logs_1200,sparse_no_food,dense_symptoms |
| probe_count | 17 |

## Probes

| fixture | probe | type | ms | status |
| --- | --- | --- | --- | --- |
| logs_30 | analyzeHealthMetrics | package_export | 12 | ok |
| logs_30 | predictFutureValues | package_export | 0 | ok |
| logs_30 | filterLogsByRange | package_export | 0 | ok |
| logs_30 | suggestLogNote | package_export | 0 | ok |
| logs_30 | generateAnalysisNote | package_export | 0 | ok |
| logs_365 | analyzeHealthMetrics | package_export | 1 | ok |
| logs_365 | predictFutureValues | package_export | 0 | ok |
| logs_365 | filterLogsByRange | package_export | 1 | ok |
| logs_1200 | analyzeHealthMetrics | package_export | 2 | ok |
| logs_1200 | predictFutureValues | package_export | 2 | ok |
| logs_1200 | filterLogsByRange | package_export | 1 | ok |
| sparse_no_food | analyzeHealthMetrics | package_export | 0 | ok |
| sparse_no_food | predictFutureValues | package_export | 0 | ok |
| sparse_no_food | filterLogsByRange | package_export | 0 | ok |
| dense_symptoms | analyzeHealthMetrics | package_export | 0 | ok |
| dense_symptoms | predictFutureValues | package_export | 0 | ok |
| dense_symptoms | filterLogsByRange | package_export | 0 | ok |

## Optimization

- **slowest_probe**: "analyzeHealthMetrics"
- **slowest_fixture**: "logs_30"
- **slowest_ms**: 12
