# Zapier connector template (Plan 19 CN7)

Use Rianell REST API webhooks with Zapier **Webhooks by Zapier**:

1. Trigger: Catch Hook → paste your Rianell `user_webhooks` delivery URL.
2. Action: Google Sheets / Notion / email as needed.

Scopes: `logs:read` via API key or OAuth `logs:read`.

See [docs/api/openapi.yaml](../api/openapi.yaml) for `/v1/logs`.
