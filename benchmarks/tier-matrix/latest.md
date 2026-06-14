# Tier matrix performance suite

Status: **ok** · schema v4

## Run metadata

| Key | Value |
| --- | --- |
| timestamp_utc | 2026-06-14T11:32:29.799Z |
| git_sha | local |
| runner | win32 |
| node | v24.14.1 |
| pwa_root | c:\Users\OnceU\OneDrive\Documents\GitHub\Health-app\apps\pwa-webapp |
| cells | 1 |
| matrix | 1-cell |
| llm_blocked_tiers | 1,2 |

## desktop tier 1 (AI engine only — no LLM)

Run id: `desktop-t1` · status: **ok**

Profile: deferAI=true, maxChartPoints=30, useWorkers=false

| Aspect | Value |
| --- | --- |
| cold_load_ms | 878 |
| tier_observed | 1 |
| platform_observed | desktop |
| deferAI_observed | true |
| maxChartPoints_observed | 30 |
| charts_ms | 409 |
| charts_max_points_observed | 30 |
| logs_ms | 308 |
| ai_engine_ms | 1 |
| ai_engine_ok | false |
| ai_llm_network_requests | 0 |
| ai_llm_script_loaded | false |
| motd_llm_skipped | true |
| motd_title_present | true |
| settings_panes | 9 |
| settings_ms | 75 |
| console.error | 0 |
| debug_per_second_peak | 11 |
| god_mode_pass_pct | 100 |

## Optimization summary

- **slowest_run**: desktop-t1
- **slowest_aspect**: cold_load
- **failures**: 

