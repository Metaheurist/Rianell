# Developer Setup

Step-by-step setup for local development on Windows, macOS, or Linux.

---

## 1. Clone and install

```bash
git clone https://github.com/Metaheurist/Rianell.git
cd Rianell
npm ci
pip install -r requirements.txt
```

**Node.js ≥ 24.14.1** required (see `.nvmrc`). Use `nvm use` if you have nvm installed.

---

## 2. Environment variables

Create your local secrets file from [`security/.env.example`](https://github.com/Metaheurist/Rianell/blob/main/security/.env.example) following [SECURITY.md — local secrets](https://github.com/Metaheurist/Rianell/blob/main/docs/SECURITY.md#local-secrets-directory-security).

Edit your **local secrets file** in the `security/` folder (never commit it):

```env
PORT=8080
HOST=127.0.0.1
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=your_publishable_key
```

Legacy names still work: `SUPABASE_ANON_KEY` (publishable), `SUPABASE_SERVICE_KEY` (server-only secret).

**React Native:** copy the same Supabase vars into `apps/rn-app/` local env configuration or use `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY`.

Optional RN LLM endpoint: `EXPO_PUBLIC_LLM_ENDPOINT` for remote summary generation (falls back to local AIEngine if unset).

---

## 3. Run the web app locally

```bash
python -m server
```

Open `http://localhost:8080`. Windows helper:

```powershell
powershell -ExecutionPolicy Bypass -File .\server\launch-server.ps1
```

Non-compiled mode (serve raw `apps/pwa-webapp/`):

```powershell
powershell -ExecutionPolicy Bypass -File .\server\launch-server.ps1 -NoCompile
```

---

## 4. Run React Native

```bash
npm run dev
```

Or from `apps/rn-app`: `npx expo start`.

Quality gates:

```bash
npm run typecheck:mobile
npm run test:mobile
```

---

## 5. Supabase (optional)

Required for cloud sync testing and LLM model hosting:

1. Apply [`supabase/Schema.sql`](https://github.com/Metaheurist/Rianell/blob/main/supabase/Schema.sql).
2. PWA client config: `apps/pwa-webapp/supabase-config.js` (placeholders locally; CI injects on deploy).
3. LLM weights: `npm run models:download` then `npm run models:upload:supabase` (operator; server-only credentials in the `security/` folder only).

---

## 6. Build production PWA

```bash
npm run build:web
```

Output is content-hashed under `apps/pwa-webapp/` (`app.<hash>.min.js`, `styles.<hash>.css`).

---

## 7. Wiki sync (maintainers)

```bash
npm run wiki:verify
npm run wiki:sync
```

Requires git push access to `Metaheurist/Rianell.wiki.git`.

---

## Read more (technical)

- [Setup & usage](https://github.com/Metaheurist/Rianell/blob/main/docs/setup-and-usage.md)
- [React Native setup](https://github.com/Metaheurist/Rianell/blob/main/docs/react-native-setup.md)
- [SECURITY.md — local secrets](https://github.com/Metaheurist/Rianell/blob/main/docs/SECURITY.md)
