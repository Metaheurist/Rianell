<a id="nav-testing-data"></a>

## 🧪 Testing Data

**Toolchain:** Run tests and scripts with **Node.js 24.14.1+** (see [Installation & usage](setup-and-usage.md) and root `package.json` `engines`). **Unit tests** (`npm run test:unit`) use the Node test runner from the repository root; **mobile** tests use Jest under `apps/rn-app`. When you bump npm/Python/CDN dependency pins, run **`npm run docs:dependencies`** and commit **`docs/dependencies.md`** (see [dependencies.md](dependencies.md)).


### v1.46.3 documentation sync

- **React Native:** After Settings or Log wizard changes, run `npx jest src/screens/SettingsScreen.test.tsx src/screens/LogWizardScreen.test.tsx` from `apps/rn-app` (or the repo’s `npm run test:mobile` if configured). Settings tests mock `expo-constants` for the app installation section.

### v1.44.2 documentation sync

- Include theme parity checks in manual smoke testing: verify non-mint themes affect loading overlay, pulse, navbar active state, and goals/targets cards.
- Include cloud settings round-trip checks for additional local setting keys during sign-in sync testing.

### Generate Sample Data

The server includes sample data generation:

1. **CSV Export**: Generate sample CSV files for testing
   - Use the "Generate CSV File" button in the server dashboard
   - Configure number of days and base weight
   - Output saved to `health_data_sample.csv`

2. **Database Testing**: 
   - Use Supabase search to find test data
   - Export data for analysis
   - Delete test data when done

### Sample Data Structure

Sample data includes realistic patterns:
- Seasonal variations (winter worse, summer better)
- Weekly patterns (weekends better)
- Flare-up cycles for chronic conditions
- Correlated metrics (sleep affects fatigue, etc.)

<a id="nav-configuration"></a>

## 🔧 Configuration

### Environment Variables (`security/.env`)

Define variables in **`security/.env`** (copy from [`security/.env.example`](../security/.env.example)). If that file is absent, a legacy **`.env`** at the repository root is still read.

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `8080` |
| `HOST` | Bind address (`127.0.0.1` = local only; `0.0.0.0` = all interfaces / LAN) | `127.0.0.1` |
| `HEALTH_APP_SENSITIVE_APIS_ON_LAN` | Allow `/api/encryption-key` and `/api/anonymized-data` from non-loopback IPs | unset (off) |
| `SUPABASE_URL` | Your Supabase project URL | Required |
| `SUPABASE_PUBLISHABLE_KEY` | **Publishable** key (Dashboard → API; safe in client builds). Legacy: `SUPABASE_ANON_KEY`. | Required (one of) |
| `SUPABASE_SECRET_KEY` | **Secret** key - use **service_role** (server only). Needed for **Generate Sample Data to Supabase** when RLS is on `anonymized_data`. Legacy: `SUPABASE_SERVICE_KEY`. | Optional |

### Supabase Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Get your project URL, **Publishable** key, and (for server sample generation) the **service_role** secret under **Secret keys** from Settings → API
3. Apply table definitions and RLS from [../supabase/Schema.sql](../supabase/Schema.sql) (test reset — wipes auth users) or incremental policies from [supabase-rls-recommended.sql](supabase-rls-recommended.sql) on staging/production
4. On an **existing** live project, run [../supabase/harden-graphql-exposure.sql](../supabase/harden-graphql-exposure.sql) in the SQL Editor to drop unused **`pg_graphql`** and revoke broad **`anon`** grants (Security Advisor lints 0026/0027) — see [SECURITY.md](SECURITY.md)
5. Add your credentials to **`security/.env`** (or legacy root `.env`) and `supabase-config.js`

### v1.53.1 CI fixes

- **Web benchmarks:** Playwright navigation timings open Settings without **`ReferenceError: global is not defined`** (`resolveSettingsPaneTitle` uses **`window.RianellI18n`**).
- **Mobile typecheck:** **`npm run typecheck:mobile`** — see [CHANGELOG.md](CHANGELOG.md) v1.53.1.

### v1.53.0 LLM model scripts (Supabase Storage)

| Script | npm alias | Purpose |
|--------|-----------|---------|
| `scripts/download-llm-models.mjs` | `npm run models:download` | Mirror ONNX weights from Hugging Face into `apps/pwa-webapp/models/` (gitignored) |
| `scripts/upload-llm-models-supabase.mjs` | `npm run models:upload:supabase` | Upload to bucket `llm-models` with 47 MB chunking; reads `security/.env`; `--purge-local` deletes local weights |
| `scripts/verify-llm-models.mjs` | `npm run models:verify` | Verify manifest; checks local files or remote Supabase when `SUPABASE_URL` set |

**Llama 3.2 download** requires `HF_TOKEN` and accepted license on huggingface.co. **Never commit** service role key or weight files.

### Security verification scripts (v1.50.0+)

Run from repo root (also enforced in CI **`security-audit`** job):

| Script | npm alias | Purpose |
|--------|-----------|---------|
| `scripts/verify-privacy-docs.mjs` | `npm run verify:privacy-docs` | Required privacy/security docs + valid `ropa.json` |
| `scripts/verify-rls-baseline.mjs` | — | RLS baseline SQL doc intact |
| `scripts/verify-csp-connect-src.mjs` | `npm run verify:csp` | CSP `connect-src` coverage |
| `scripts/verify-no-service-role-in-clients.mjs` | — | No service_role / sb_secret / hardcoded keys in **tracked** client sources |
| `scripts/generate-security-inventory.mjs` | `npm run docs:security-inventory` | Regenerate [security-inventory.md](security-inventory.md) |

**Security unit tests:** `tests/unit/security/` (XSS import preview, cloud deletion tables, verify-script smoke). Included in `npm run test:unit`.
