# HIPAA encryption chain (stub)

**Status:** Phase 2 launch audit - operator checklist. Not legal advice.

## Data flow

| Layer | Health logs | Auth tokens | Anonymized pool |
|-------|-------------|-------------|-----------------|
| Device (PWA) | `localStorage` / IndexedDB - **plaintext** | Supabase session in browser storage | AES-GCM via shared anon key |
| Transit | TLS 1.2+ (Supabase, Cloudflare) | TLS | TLS |
| Supabase `health_data` | Text column - **server-side at rest** per Supabase AES-256 | N/A | `anonymized_log` encrypted blob |
| Supabase `user_keys` | N/A | **GAP-01:** plaintext hex in column | N/A |

## BAA and subprocessors

- Confirm Supabase **HIPAA add-on** and signed BAA before processing PHI in cloud tables.
- Document subprocessors in `docs/privacy/ropa.json` (PA entries).

## Controls to complete before HIPAA marketing

1. Envelope encryption for `user_keys` (see `docs/crypto-roadmap.md`).
2. Client-side encryption of `health_data` payload before upload (GAP-02).
3. Audit logging via `consent_audit_log` + access reviews.
4. `delete_all_user_data(uuid)` + Edge Function hard-delete auth user on erasure request.

See also [SECURITY.md](../SECURITY.md) and [ropa.json](../privacy/ropa.json).
