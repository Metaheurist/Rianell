-- Plan 18 API1 — API keys & webhooks (idempotent)

CREATE TABLE IF NOT EXISTS public.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key_hash text NOT NULL,
  key_prefix text NOT NULL,
  label text,
  scopes text[] DEFAULT ARRAY['logs:read']::text[],
  last_used_at timestamptz,
  created_at timestamptz DEFAULT now(),
  revoked_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.user_webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url text NOT NULL,
  events text[] DEFAULT ARRAY['log.created']::text[],
  secret text,
  enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  last_delivered_at timestamptz,
  failure_count integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id uuid REFERENCES public.user_webhooks(id) ON DELETE CASCADE,
  event_type text,
  payload jsonb,
  response_status integer,
  attempt integer DEFAULT 1,
  delivered_at timestamptz DEFAULT now()
);

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "api_keys_owner" ON public.api_keys;
CREATE POLICY "api_keys_owner" ON public.api_keys FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "user_webhooks_owner" ON public.user_webhooks;
CREATE POLICY "user_webhooks_owner" ON public.user_webhooks FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "webhook_deliveries_owner" ON public.webhook_deliveries;
CREATE POLICY "webhook_deliveries_owner" ON public.webhook_deliveries FOR SELECT TO authenticated
  USING (webhook_id IN (SELECT id FROM public.user_webhooks WHERE user_id = auth.uid()));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.api_keys TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_webhooks TO authenticated;
GRANT SELECT ON public.webhook_deliveries TO authenticated;
