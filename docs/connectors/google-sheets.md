# Google Sheets connector

Bidirectional sync between user-owned spreadsheets and health logs.

- **Import:** Read rows via column map → partial log entries
- **Export:** Append rows using canonical CSV columns from `@rianell/shared`
- **Scope:** `https://www.googleapis.com/auth/spreadsheets`
- **Quota:** Cap 90 days / 500 rows per sync (free tier)
- **Setup:** [SETUP.md](./SETUP.md) §3
