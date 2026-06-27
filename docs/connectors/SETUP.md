# Connector setup (operators)

Configure Strava, Withings, and Google Sheets OAuth for the Rianell PWA. See also [strava.md](./strava.md), [withings.md](./withings.md), [google-sheets.md](./google-sheets.md).

## Prerequisites

- Supabase project on free tier with Plan 19 migration + `20260627100000_connectors_hardening.sql` applied
- PWA deployed on HTTPS origin
- Cloud Sync enabled for test users
- Supabase CLI authenticated for deploy

## 1. Strava developer app

1. Create at https://www.strava.com/settings/api
2. Authorization Callback Domain: `<project-ref>.supabase.co`
3. Redirect URI: `https://<project-ref>.supabase.co/functions/v1/connector-callback?provider=strava`
4. Scopes: `activity:read_all`
5. `supabase secrets set STRAVA_CLIENT_ID=... STRAVA_CLIENT_SECRET=...`

## 2. Withings developer app

1. Register at https://developer.withings.com/
2. Callback URL: `https://<project-ref>.supabase.co/functions/v1/connector-callback?provider=withings`
3. Scopes: `user.metrics,user.activity`
4. `supabase secrets set WITHINGS_CLIENT_ID=... WITHINGS_CLIENT_SECRET=...`

## 3. Google Cloud / Sheets

1. Create project → enable **Google Sheets API**
2. OAuth consent screen (External, Testing, add test users)
3. OAuth client type: **Web application**
4. Redirect URI: `https://<project-ref>.supabase.co/functions/v1/connector-callback?provider=google-sheets`
5. Scope: `https://www.googleapis.com/auth/spreadsheets`
6. `supabase secrets set GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=...`

## 4. Shared secrets

```bash
supabase secrets set CONNECTOR_TOKEN_SECRET=<32-byte-base64>
supabase secrets set CONNECTOR_STATE_SECRET=<32-byte-base64>
supabase secrets set CONNECTOR_SUCCESS_REDIRECT=https://<your-pwa>/connector-success.html
```

Generate secrets: `openssl rand -base64 32` (or PowerShell equivalent).

## 5. Deploy edge functions

```bash
supabase functions deploy connector-auth connector-callback connector-disconnect \
  connector-strava connector-withings connector-google-sheets
```

## 6. Verify

1. Settings → Connectors → Strava → Connect → approve → Sync now → exercise on log
2. Repeat Withings (weight/BPM) and Google Sheets (import + export)

## 7. Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| redirect_uri_mismatch | Callback URL typo | Match provider console exactly |
| 401 on connector-auth | User not signed in | Enable Cloud Sync login |
| Empty Strava sync | No new activities / rate limit | Check Strava dashboard |
| Sheets 403 | Sheet not shared with OAuth Google account | Share sheet with connector account |
| Connect blocked | Local-only mode | Disable local-only in Privacy settings |
