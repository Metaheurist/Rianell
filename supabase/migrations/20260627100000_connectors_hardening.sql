-- Plan 19 CN4–CN7 — connector token split + user_integrations hardening

CREATE TABLE IF NOT EXISTS public.connector_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL,
  access_token_encrypted text NOT NULL,
  refresh_token_encrypted text,
  expires_at timestamptz,
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, provider)
);

CREATE TABLE IF NOT EXISTS public.connector_oauth_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL,
  nonce text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.user_integrations
  ADD COLUMN IF NOT EXISTS last_sync_at timestamptz,
  ADD COLUMN IF NOT EXISTS sync_status text DEFAULT 'idle';

-- Migrate legacy token columns into connector_tokens (best-effort)
INSERT INTO public.connector_tokens (user_id, provider, access_token_encrypted, refresh_token_encrypted, updated_at)
SELECT ui.user_id, ui.provider, ui.access_token_encrypted, ui.refresh_token_encrypted, COALESCE(ui.updated_at, now())
FROM public.user_integrations ui
WHERE ui.access_token_encrypted IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.connector_tokens ct
    WHERE ct.user_id = ui.user_id AND ct.provider = ui.provider
  );

-- Dedupe before unique constraint
DELETE FROM public.user_integrations a
USING public.user_integrations b
WHERE a.id > b.id AND a.user_id = b.user_id AND a.provider = b.provider;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_integrations_user_provider_key'
  ) THEN
    ALTER TABLE public.user_integrations ADD CONSTRAINT user_integrations_user_provider_key UNIQUE (user_id, provider);
  END IF;
END $$;

ALTER TABLE public.connector_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connector_oauth_states ENABLE ROW LEVEL SECURITY;

-- No authenticated policies — service role only
REVOKE ALL ON public.connector_tokens FROM authenticated, anon;
REVOKE ALL ON public.connector_oauth_states FROM authenticated, anon;
GRANT ALL ON public.connector_tokens TO service_role;
GRANT ALL ON public.connector_oauth_states TO service_role;

CREATE INDEX IF NOT EXISTS connector_oauth_states_expires_idx ON public.connector_oauth_states (expires_at);
CREATE INDEX IF NOT EXISTS connector_tokens_user_provider_idx ON public.connector_tokens (user_id, provider);
