-- Recommended Row Level Security (RLS) baseline for Rianell + Supabase
-- Mirrors supabase/Schema.sql policies. Apply in Supabase SQL Editor (staging first).
-- The browser embeds the Supabase anon key; security depends on RLS, not on hiding the key.

ALTER TABLE public.anonymized_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bug_reports ENABLE ROW LEVEL SECURITY;

-- anonymized_data (column: anonymized_log — matches apps/pwa-webapp/cloud-sync.js)
CREATE POLICY "anonymized_data_insert_own"
  ON public.anonymized_data FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "anonymized_data_select_own"
  ON public.anonymized_data FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "anonymized_data_update_own"
  ON public.anonymized_data FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "anonymized_data_delete_own"
  ON public.anonymized_data FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- health_data
CREATE POLICY "health_data_select_own"
  ON public.health_data FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "health_data_insert_own"
  ON public.health_data FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "health_data_update_own"
  ON public.health_data FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "health_data_delete_own"
  ON public.health_data FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- user_keys
CREATE POLICY "user_keys_select_own"
  ON public.user_keys FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "user_keys_insert_own"
  ON public.user_keys FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_keys_update_own"
  ON public.user_keys FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_keys_delete_own"
  ON public.user_keys FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- bug_reports: insert-only for clients; no anon SELECT
CREATE POLICY "bug_reports_insert_public"
  ON public.bug_reports FOR INSERT TO anon, authenticated
  WITH CHECK (char_length(description) >= 1 AND char_length(description) <= 4000);

CREATE POLICY "bug_reports_select_own"
  ON public.bug_reports FOR SELECT TO authenticated
  USING (user_id IS NOT NULL AND auth.uid() = user_id);

-- GraphQL exposure (Supabase lints 0026/0027): revoke anon SELECT on sensitive tables and
-- drop pg_graphql if you do not use /graphql/v1. Full script: supabase/harden-graphql-exposure.sql
REVOKE ALL ON public.anonymized_data FROM anon;
REVOKE ALL ON public.health_data FROM anon;
REVOKE ALL ON public.user_keys FROM anon;
REVOKE ALL ON public.bug_reports FROM anon;
GRANT INSERT ON public.bug_reports TO anon, authenticated;
DROP EXTENSION IF EXISTS pg_graphql CASCADE;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE SELECT ON TABLES FROM anon;
