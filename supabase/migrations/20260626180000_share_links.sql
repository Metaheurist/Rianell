-- Plan: Share Link System — encrypted hosted read-only share links
-- Stores client-side encrypted snapshots; password never stored server-side.

CREATE TABLE IF NOT EXISTS public.share_links (
  id             uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  share_code     text        NOT NULL UNIQUE,
  encrypted_blob text        NOT NULL,
  salt           text        NOT NULL,
  iv             text        NOT NULL,
  kdf_iterations integer     NOT NULL DEFAULT 310000,
  created_at     timestamptz DEFAULT now() NOT NULL,
  expires_at     timestamptz NOT NULL,
  access_count   integer     DEFAULT 0 NOT NULL,
  max_accesses   integer     DEFAULT 500 NOT NULL,
  metadata       jsonb       DEFAULT '{}'::jsonb
);

ALTER TABLE share_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "share_links_anon_insert" ON share_links
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "share_links_anon_select" ON share_links
  FOR SELECT TO anon, authenticated
  USING (expires_at > now() AND access_count < max_accesses);

CREATE OR REPLACE FUNCTION public.increment_share_access(p_code text)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE share_links SET access_count = access_count + 1
  WHERE share_code = p_code AND expires_at > now();
$$;

GRANT EXECUTE ON FUNCTION public.increment_share_access(text) TO anon, authenticated;
