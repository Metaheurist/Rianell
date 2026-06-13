-- Recreate public app tables for Health-app (Supabase).
--
-- WARNING (TEST RESET): Drops public app tables AND deletes all Supabase Auth users
-- (sessions, identities, refresh tokens). Every account must sign up again.
-- Do NOT run on production.
--
-- Run in: Supabase Dashboard → SQL Editor, or: psql $DATABASE_URL -f supabase/Schema.sql
--
-- Includes Row Level Security (RLS) policies. The browser embeds the anon key; security depends on RLS.
-- Also creates public Storage bucket `llm-models` for on-device LLM ONNX weights (upload via npm run models:upload:supabase).

BEGIN;

DROP TABLE IF EXISTS public.user_privacy_profile CASCADE;
DROP TABLE IF EXISTS public.anonymized_data CASCADE;
DROP TABLE IF EXISTS public.health_data CASCADE;
DROP TABLE IF EXISTS public.user_keys CASCADE;
DROP TABLE IF EXISTS public.bug_reports CASCADE;

-- Wipe Supabase Auth (requires SQL Editor / postgres role — not anon key)
DELETE FROM auth.refresh_tokens;
DELETE FROM auth.sessions;
DELETE FROM auth.identities;
DELETE FROM auth.users;

CREATE TABLE public.user_privacy_profile (
  user_id uuid NOT NULL,
  privacy_region text NOT NULL DEFAULT 'other',
  privacy_region_source text,
  privacy_region_updated_at timestamp with time zone,
  ui_locale text NOT NULL DEFAULT 'en-GB',
  ui_locale_source text,
  ui_locale_updated_at timestamp with time zone,
  data_residency_code text DEFAULT 'default',
  data_residency_project_url text,
  policy_pack_id text NOT NULL DEFAULT 'v1.0.0',
  policy_acknowledged_at timestamp with time zone,
  policy_acknowledged_version text,
  consents jsonb NOT NULL DEFAULT '{}'::jsonb,
  feature_flags_snapshot jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_privacy_profile_pkey PRIMARY KEY (user_id),
  CONSTRAINT user_privacy_profile_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE
);

CREATE TABLE public.anonymized_data (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id uuid,
  anonymized_log text NOT NULL,
  medical_condition text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT anonymized_data_pkey PRIMARY KEY (id),
  CONSTRAINT anonymized_data_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id)
);

CREATE TABLE public.health_data (
  user_id uuid NOT NULL,
  health_logs text NOT NULL,
  app_settings text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  ai_state text,
  CONSTRAINT health_data_pkey PRIMARY KEY (user_id),
  CONSTRAINT health_data_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id)
);

CREATE TABLE public.user_keys (
  user_id uuid NOT NULL,
  encryption_key text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_keys_pkey PRIMARY KEY (user_id),
  CONSTRAINT user_keys_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id)
);

CREATE TABLE public.bug_reports (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  user_id uuid,
  client_ip text NOT NULL DEFAULT 'unknown',
  title text,
  description text NOT NULL,
  steps_to_reproduce text,
  expected_behavior text,
  actual_behavior text,
  console_output text,
  app_theme text,
  user_agent text,
  page_url text,
  client_timestamp timestamp with time zone,
  CONSTRAINT bug_reports_pkey PRIMARY KEY (id),
  CONSTRAINT bug_reports_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id)
);

-- Row Level Security
ALTER TABLE public.user_privacy_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anonymized_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bug_reports ENABLE ROW LEVEL SECURITY;

-- user_privacy_profile: owner-only CRUD
CREATE POLICY "user_privacy_profile_select_own"
  ON public.user_privacy_profile FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "user_privacy_profile_insert_own"
  ON public.user_privacy_profile FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_privacy_profile_update_own"
  ON public.user_privacy_profile FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_privacy_profile_delete_own"
  ON public.user_privacy_profile FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- anonymized_data: authenticated users insert/select own rows only
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

-- health_data: owner-only CRUD
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

-- user_keys: owner-only CRUD (encryption key stored server-side; see docs/SECURITY.md)
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

-- bug_reports: public insert (no read) for anon + authenticated; service role reads via dashboard
CREATE POLICY "bug_reports_insert_public"
  ON public.bug_reports FOR INSERT TO anon, authenticated
  WITH CHECK (char_length(description) >= 1 AND char_length(description) <= 4000);

CREATE POLICY "bug_reports_select_own"
  ON public.bug_reports FOR SELECT TO authenticated
  USING (user_id IS NOT NULL AND auth.uid() = user_id);

-- Grants (Supabase default roles). Revoke anon on sensitive tables first — Supabase
-- default privileges grant SELECT to anon, which exposes schema via pg_graphql (lint 0026).
REVOKE ALL ON public.user_privacy_profile FROM anon;
REVOKE ALL ON public.anonymized_data FROM anon;
REVOKE ALL ON public.health_data FROM anon;
REVOKE ALL ON public.user_keys FROM anon;
REVOKE ALL ON public.bug_reports FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_privacy_profile TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.anonymized_data TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.health_data TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_keys TO authenticated;
GRANT INSERT ON public.bug_reports TO anon, authenticated;
GRANT SELECT ON public.bug_reports TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE SELECT ON TABLES FROM anon;

-- App uses PostgREST only; drop pg_graphql to avoid schema introspection (lints 0026/0027).
DROP EXTENSION IF EXISTS pg_graphql CASCADE;

-- ---------------------------------------------------------------------------
-- Storage: public-read bucket for on-device LLM ONNX weights (~3.5 GB mirror).
-- Upload: npm run models:upload:supabase (SUPABASE_SERVICE_ROLE_KEY in security/.env).
-- Large ONNX files are split into 47 MB .partNNN chunks (Supabase free tier 50 MB/object limit).
-- Object path: models/onnx-community/.../resolve/main/... or .../file.onnx.part000
-- Safe to re-run: ON CONFLICT / DROP POLICY IF EXISTS.
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'llm-models',
  'llm-models',
  true,
  5242880000,
  ARRAY['application/json', 'application/octet-stream', 'text/plain']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit;

-- No SELECT policy on storage.objects — public bucket serves direct object URLs only
-- (/storage/v1/object/public/llm-models/…). A broad SELECT would let anyone list the bucket.
-- Uploads use service role only (no anon/authenticated INSERT policy).

COMMIT;
