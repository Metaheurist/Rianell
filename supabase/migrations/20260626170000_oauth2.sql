-- Plan 19 CN1/CN4 — OAuth2 & user integrations (idempotent)

CREATE TABLE IF NOT EXISTS public.oauth2_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id text NOT NULL UNIQUE,
  client_name text NOT NULL,
  redirect_uris text[] NOT NULL DEFAULT '{}'::text[],
  allowed_scopes text[] NOT NULL DEFAULT ARRAY['logs:read']::text[],
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.oauth2_auth_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  client_id text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scopes text[] NOT NULL DEFAULT '{}'::text[],
  code_challenge text NOT NULL,
  expires_at timestamptz NOT NULL,
  used boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL,
  access_token_encrypted text,
  refresh_token_encrypted text,
  sheet_id text,
  sheet_range text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.oauth2_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oauth2_auth_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_integrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "oauth2_clients_read" ON public.oauth2_clients;
CREATE POLICY "oauth2_clients_read" ON public.oauth2_clients FOR SELECT TO authenticated
  USING (created_by IS NULL OR created_by = auth.uid());

DROP POLICY IF EXISTS "oauth2_clients_insert" ON public.oauth2_clients;
CREATE POLICY "oauth2_clients_insert" ON public.oauth2_clients FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "oauth2_auth_codes_owner" ON public.oauth2_auth_codes;
CREATE POLICY "oauth2_auth_codes_owner" ON public.oauth2_auth_codes FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "user_integrations_owner" ON public.user_integrations;
CREATE POLICY "user_integrations_owner" ON public.user_integrations FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

GRANT SELECT, INSERT ON public.oauth2_clients TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.oauth2_auth_codes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_integrations TO authenticated;
