# Security (local secrets)

Keep **environment variables** and **encryption key material** in this directory. These paths are gitignored.

| File | Purpose |
|------|---------|
| `.env` | Copy from [`.env.example`](.env.example) in this folder. Supabase credentials, `HOST`, `PORT`, `HEALTH_APP_SENSITIVE_APIS_ON_LAN`, optional `ENCRYPTION_KEY`. |
| `.encryption_key` | Optional single-line AES key (64 hex chars) for anonymised payload crypto. If missing, the server may create this file automatically on first use. |

**Legacy:** If `Security/.env` does not exist, the server still loads a `.env` file at the **repository root** (for existing setups). Prefer `Security/.env` for new clones. For encryption keys, the server checks `Security/` first, then the repo root.

See [../SECURITY.md](../SECURITY.md) for the full security model.
