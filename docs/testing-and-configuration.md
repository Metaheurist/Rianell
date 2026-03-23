<a id="nav-testing-data"></a>

## 🧪 Testing Data

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
| `SUPABASE_SECRET_KEY` | **Secret** key — use **service_role** (server only). Needed for **Generate Sample Data to Supabase** when RLS is on `anonymized_data`. Legacy: `SUPABASE_SERVICE_KEY`. | Optional |

### Supabase Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Get your project URL, **Publishable** key, and (for server sample generation) the **service_role** secret under **Secret keys** from Settings → API
3. Create the `anonymized_data` table:
   ```sql
   CREATE TABLE anonymized_data (
     id BIGSERIAL PRIMARY KEY,
     medical_condition TEXT NOT NULL,
     anonymized_log JSONB NOT NULL,
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW()
   );
   ```
4. Add your credentials to **`security/.env`** (or legacy root `.env`) and `supabase-config.js`
