# Self-hosted Rianell (Plan 20 SH1)

Run Rianell on your own infrastructure with Docker Compose.

## Prerequisites

- Docker and Docker Compose v2
- Supabase project (cloud mode) or `RIANELL_MODE=local` for offline-only

## Quick start

```bash
cp .env.example .env
# Edit SUPABASE_URL and SUPABASE_ANON_KEY (skip for local-only)
docker compose up --build
```

- PWA: http://localhost:8080
- Python server (FHIR + API helpers): http://localhost:8081

## Modes

| `RIANELL_MODE` | Behaviour |
|----------------|-----------|
| `cloud` (default) | Full Supabase sync |
| `local` | IndexedDB/AsyncStorage only; cloud sync disabled |

## Upgrade

1. Pull latest release tag
2. `docker compose down`
3. `docker compose up --build -d`

## Troubleshooting

- **Port in use:** change host ports in `docker-compose.yml`
- **FHIR 404:** ensure `rianell-server` is running; try `GET /fhir/r4/metadata`
