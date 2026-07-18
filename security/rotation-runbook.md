# Secret rotation runbook

**Product:** Rianell  
**Last updated:** 2026-06-13  
**Related:** [SECURITY.md](../docs/SECURITY.md) · [incident-response.md](../docs/incident-response.md) · [threat-model.md](../docs/threat-model.md)

---

## 1. Principles

1. **Rotate on schedule** (quarterly for high-impact secrets) and **immediately** on suspected compromise.
2. **Never** commit secrets; verify with Gitleaks after rotation.
3. **Order matters:** create new secret → deploy consumers → revoke old secret.
4. Record rotation date in [security-hardening-execution-log.md](../docs/security-hardening-execution-log.md).

---

## 2. Inventory

| Secret | Location | Exposure | Rotation cadence |
|--------|----------|----------|------------------|
| Supabase **service role** / secret key | `security/.env`, GitHub Actions | Server, CI only | 90 days / on incident |
| Supabase **anon / publishable** key | GitHub Actions → build inject, RN `EXPO_PUBLIC_*` | Public in clients | 180 days / on incident |
| Supabase **database password** | `DATABASE_URL` in operator env | Operator only | 90 days |
| Supabase **JWT secret** | Supabase dashboard | Auth tokens | Only on compromise (invalidates all sessions) |
| GitHub **PAT** (if used) | Operator machine, optional CI | Repo/deploy scope | 90 days |
| GitHub Actions **repository secrets** | Settings → Secrets | CI | With underlying key rotation |
| `HEALTH_APP_SENSITIVE_APIS_LAN_SECRET` | `security/.env` | Dev LAN | On team change |
| `ENCRYPTION_KEY` / `.encryption_key` | `security/` | Anonymized pipeline | **Avoid** rotate without migration plan |
| Cloudflare **API token** | Operator dashboard | DNS/WAF | 180 days |

---

## 3. Supabase key rotation

### 3.1 Publishable (anon) key

**Impact:** Must redeploy PWA and rebuild RN apps. Old key revoked → clients cannot connect.

1. Open [Supabase Dashboard](https://app.supabase.com) → Project → **Settings** → **API**.
2. Under **Project API keys**, create or roll **anon/public** key (Supabase may label this **publishable**).
3. Update secrets:
   - GitHub → Repository → **Settings** → **Secrets and variables** → **Actions**:
     - `SUPABASE_URL` (if changed - rare)
     - `SUPABASE_ANON_KEY` or `SUPABASE_PUBLISHABLE_KEY` (match workflow names in `.github/workflows/`)
   - Local: `security/.env` → `SUPABASE_PUBLISHABLE_KEY=`
4. Trigger CI deploy (push to default branch or `workflow_dispatch`) so GitHub Pages bundle receives new `SUPABASE_CONFIG`.
5. Revoke/disable previous anon key in dashboard when traffic shows 100% on new deploy (check Supabase API logs).
7. Run smoke test: sign-in, cloud sync upload/download, bug report insert.

### 3.2 Single Supabase project (current)

Rianell uses **one** Supabase project for all users. See [single-project-residency.md](../docs/privacy/single-project-residency.md).

1. Rotate the project's anon/publishable key in the Supabase dashboard.
2. Update GitHub Actions secrets `SUPABASE_URL` and `SUPABASE_ANON_KEY` (and matching RN/PWA build env).
3. Redeploy PWA and rebuild RN binaries.
4. Verify schema parity: `node scripts/verify/verify-supabase-schema-parity.mjs`.
5. Revoke the previous anon key after traffic confirms the new deploy.

**Legacy (deprecated):** Dual EU/US projects and residency config were removed in v1.52 - archived copy at [docs/archive/residency-config.json](../docs/archive/residency-config.json); see [multi-residency.md](../docs/privacy/multi-residency.md).

### 3.3 Service role (secret) key

**Impact:** Server `POST /api/bug-report`, admin scripts, wipe tools. **Never** embed in PWA/RN.

1. Dashboard → **Settings** → **API** → **service_role** / **secret** key → **Generate new key**.
2. Update `security/.env` → `SUPABASE_SECRET_KEY=` (legacy name `SUPABASE_SERVICE_KEY` still read).
3. Update GitHub Actions secret(s) used by server deploy or maintenance workflows.
4. Restart local Python server if running.
5. Verify bug-report path and any service-role maintenance scripts.
6. Revoke old service role key immediately after verification.

### 3.3 Database password (`DATABASE_URL`)

1. Dashboard → **Settings** → **Database** → **Reset database password**.
2. Reconstruct URI: `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`
3. Update operator-only `DATABASE_URL` in `security/.env`.
4. Confirm migrations / `Schema.sql` admin tasks still work.

### 3.4 JWT secret (emergency only)

Resetting JWT secret **invalidates all user sessions**.

1. Dashboard → **Settings** → **API** → JWT Settings → rotate.
2. Communicate users must sign in again.
3. Coordinate with [incident-response.md](../docs/incident-response.md) if breach-driven.

---

## 4. GitHub PAT rotation

Use **fine-grained PAT** with minimum scope (contents, workflows, pages if needed).

1. GitHub → **Settings** → **Developer settings** → **Personal access tokens** → **Fine-grained tokens**.
2. Generate new token; note expiry (≤90 days recommended).
3. Update consuming systems:
   - Local git credential manager
   - Any CI secret referencing PAT (prefer **GITHUB_TOKEN** or OIDC instead of long-lived PAT)
4. Revoke old PAT.
5. Audit **Settings** → **Security** → **Secret scanning** alerts.

**Prefer:** GitHub Actions `GITHUB_TOKEN` or OIDC for deploy; avoid PAT in CI where possible.

---

## 5. GitHub Actions repository secrets

### 5.1 List current secrets

```bash
gh secret list
```

(Requires `gh` CLI authenticated.)

### 5.2 Update procedure

1. `gh secret set SUPABASE_PUBLISHABLE_KEY --body "<new>"`
2. `gh secret set SUPABASE_SECRET_KEY --body "<new>"` (if workflow uses it)
3. Re-run failed workflows or push empty commit to trigger CI.
4. Confirm **Security & supply-chain checks** job passes.

### 5.3 Verification

- CI **deploy** job injects keys into `apps/pwa-webapp/supabase-config.js` (or equivalent generated file).
- Gitleaks job must not flag new secrets in tree.

---

## 6. Operator encryption key (`ENCRYPTION_KEY`)

Used for **anonymized contribution** encryption when Python server participates.

**Warning:** Rotating without re-encrypting existing `anonymized_data` rows breaks decryption of historical blobs.

1. Plan maintenance window.
2. Export existing anonymized rows if needed.
3. Set new `ENCRYPTION_KEY` or `security/.encryption_key`.
4. Re-upload or migrate ciphertext if retention required.
5. Document in execution log.

For **per-user cloud backup keys** (`user_keys`), see [crypto-roadmap.md](../docs/crypto-roadmap.md) - rotation is user-driven today (new random key on re-registration).

---

## 7. Cloudflare API token

1. Cloudflare dashboard → **My Profile** → **API Tokens** → create replacement with zone DNS + cache purge minimum scope.
2. Update operator automation (if any).
3. Revoke old token.
4. Purge cache after security-related deploy: **Caching** → **Configuration** → **Purge Everything** (brief downtime acceptable) or purge `index.html` only.

---

## 8. Post-rotation checklist

- [ ] All GitHub Actions jobs green
- [ ] PWA production: auth + sync smoke test on https://rianell.com
- [ ] RN build: `EXPO_PUBLIC_*` aligned with dashboard
- [ ] Gitleaks / secret scanning clean
- [ ] Old keys revoked in Supabase/GitHub/Cloudflare
- [ ] [security-hardening-execution-log.md](../docs/security-hardening-execution-log.md) updated
- [ ] If incident-driven: [incident-response.md](../docs/incident-response.md) timeline updated

---

## 9. Emergency contacts

- Supabase support: dashboard help (paid plans)
- GitHub: https://support.github.com
- Cloudflare: dashboard support

Security vulnerability reports: private contact per [SECURITY.md](../docs/SECURITY.md).
