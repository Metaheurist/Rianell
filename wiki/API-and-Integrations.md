# API and Integrations

Rianell exposes a small REST surface for self-hosted and automation use cases.

## REST API

- **OpenAPI spec:** [docs/api/openapi.yaml](https://github.com/Metaheurist/Rianell/blob/main/docs/api/openapi.yaml)
- **Server routes:** Python dev server under `server/` (loopback/LAN); production edge is the PWA + Supabase.
- **Auth:** Supabase publishable (anon) key on clients; authenticated RPCs for health data. Never embed `service_role` in apps.

## Connectors and webhooks

- User webhooks and API keys are stored with RLS in Supabase (`api_keys`, `user_webhooks`).
- Connector setup: see [Features-Guide](Features-Guide) and `docs/connectors/`.

## n8n community node

- Package: `packages/n8n-nodes-rianell` (`@rianell/n8n-nodes-rianell`)
- Use for workflow automation against the Rianell Health API.

## Related docs

- [Architecture-Overview](Architecture-Overview)
- [Cloud-Sync-and-Backup](Cloud-Sync-and-Backup)
- [Developer-Setup](Developer-Setup)
