-- =============================================================================
-- Rianell Supabase schema — single SQL file (tables, RLS, grants, RPCs)
-- =============================================================================
--
-- PRODUCTION APPLY (live project — keeps existing users + data):
--   1. Open Supabase Dashboard → SQL Editor → New query
--   2. Paste this ENTIRE file (§0 TEST RESET must stay commented out)
--   3. Run once; expect "Success. No rows returned"
--   4. Run §5 verification queries below (or re-select that section and Run)
--   5. Dashboard → Database → Security Advisor — confirm GraphQL lints cleared
--
-- Idempotent — safe to re-run. The browser embeds the anon key; security depends on RLS.
--
-- Includes:
--   §1 Tables (user_privacy_profile, anonymized_data + research_facets, health_data, user_keys, bug_reports)
--   §2 Row Level Security policies
--   §3 Grants + GraphQL hardening (Security Advisor lints 0026/0027)
--   §4 Plan 13 RE1 pool RPCs (get_k_anon_pool_insights, count_pool_contribution_days; anon EXECUTE revoked — lint 0028)
--   §5 Post-apply verification SELECTs
--
-- Dev/staging FULL WIPE ONLY: uncomment §0 TEST RESET (destroys all tables, auth users, data).
-- On-device LLM weights are HF-only — no Supabase Storage bucket required.
-- =============================================================================

BEGIN;

-- =============================================================================
-- §0 TEST RESET (optional — uncomment only for dev/staging wipe)
-- =============================================================================
/*
DROP TABLE IF EXISTS public.user_privacy_profile CASCADE;
DROP TABLE IF EXISTS public.anonymized_data CASCADE;
DROP TABLE IF EXISTS public.health_data CASCADE;
DROP TABLE IF EXISTS public.user_keys CASCADE;
DROP TABLE IF EXISTS public.bug_reports CASCADE;

DROP FUNCTION IF EXISTS public.get_k_anon_pool_insights(text, integer);
DROP FUNCTION IF EXISTS public.count_pool_contribution_days(text);

DELETE FROM auth.refresh_tokens;
DELETE FROM auth.sessions;
DELETE FROM auth.identities;
DELETE FROM auth.users;
*/

-- =============================================================================
-- §1 TABLES
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.user_privacy_profile (
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

CREATE TABLE IF NOT EXISTS public.anonymized_data (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id uuid,
  anonymized_log text NOT NULL,
  medical_condition text,
  research_facets jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT anonymized_data_pkey PRIMARY KEY (id),
  CONSTRAINT anonymized_data_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id)
);

ALTER TABLE public.anonymized_data
  ADD COLUMN IF NOT EXISTS research_facets jsonb;

CREATE TABLE IF NOT EXISTS public.health_data (
  user_id uuid NOT NULL,
  health_logs text NOT NULL,
  app_settings text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  ai_state text,
  CONSTRAINT health_data_pkey PRIMARY KEY (user_id),
  CONSTRAINT health_data_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id)
);

CREATE TABLE IF NOT EXISTS public.user_keys (
  user_id uuid NOT NULL,
  encryption_key text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_keys_pkey PRIMARY KEY (user_id),
  CONSTRAINT user_keys_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id)
);

CREATE TABLE IF NOT EXISTS public.bug_reports (
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

CREATE TABLE IF NOT EXISTS public.user_achievements (
  user_id uuid NOT NULL,
  achievements jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_achievements_pkey PRIMARY KEY (user_id),
  CONSTRAINT user_achievements_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.consent_audit_log (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id uuid NOT NULL,
  consent_type text NOT NULL,
  consent_version text NOT NULL DEFAULT 'v1.0.0',
  accepted_at timestamp with time zone NOT NULL DEFAULT now(),
  revoked_at timestamp with time zone,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT consent_audit_log_pkey PRIMARY KEY (id),
  CONSTRAINT consent_audit_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE
);

-- =============================================================================
-- §2 ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE public.user_privacy_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anonymized_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bug_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_privacy_profile_select_own" ON public.user_privacy_profile;
CREATE POLICY "user_privacy_profile_select_own"
  ON public.user_privacy_profile FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "user_privacy_profile_insert_own" ON public.user_privacy_profile;
CREATE POLICY "user_privacy_profile_insert_own"
  ON public.user_privacy_profile FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "user_privacy_profile_update_own" ON public.user_privacy_profile;
CREATE POLICY "user_privacy_profile_update_own"
  ON public.user_privacy_profile FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "user_privacy_profile_delete_own" ON public.user_privacy_profile;
CREATE POLICY "user_privacy_profile_delete_own"
  ON public.user_privacy_profile FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "anonymized_data_insert_own" ON public.anonymized_data;
CREATE POLICY "anonymized_data_insert_own"
  ON public.anonymized_data FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "anonymized_data_select_own" ON public.anonymized_data;
CREATE POLICY "anonymized_data_select_own"
  ON public.anonymized_data FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "anonymized_data_update_own" ON public.anonymized_data;
CREATE POLICY "anonymized_data_update_own"
  ON public.anonymized_data FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "anonymized_data_delete_own" ON public.anonymized_data;
CREATE POLICY "anonymized_data_delete_own"
  ON public.anonymized_data FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "health_data_select_own" ON public.health_data;
CREATE POLICY "health_data_select_own"
  ON public.health_data FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "health_data_insert_own" ON public.health_data;
CREATE POLICY "health_data_insert_own"
  ON public.health_data FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "health_data_update_own" ON public.health_data;
CREATE POLICY "health_data_update_own"
  ON public.health_data FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "health_data_delete_own" ON public.health_data;
CREATE POLICY "health_data_delete_own"
  ON public.health_data FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "user_keys_select_own" ON public.user_keys;
CREATE POLICY "user_keys_select_own"
  ON public.user_keys FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "user_keys_insert_own" ON public.user_keys;
CREATE POLICY "user_keys_insert_own"
  ON public.user_keys FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "user_keys_update_own" ON public.user_keys;
CREATE POLICY "user_keys_update_own"
  ON public.user_keys FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "user_keys_delete_own" ON public.user_keys;
CREATE POLICY "user_keys_delete_own"
  ON public.user_keys FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "bug_reports_insert_public" ON public.bug_reports;
CREATE POLICY "bug_reports_insert_public"
  ON public.bug_reports FOR INSERT TO anon, authenticated
  WITH CHECK (char_length(description) >= 1 AND char_length(description) <= 4000);

DROP POLICY IF EXISTS "bug_reports_select_own" ON public.bug_reports;
CREATE POLICY "bug_reports_select_own"
  ON public.bug_reports FOR SELECT TO authenticated
  USING (user_id IS NOT NULL AND (select auth.uid()) = user_id);

DROP POLICY IF EXISTS "user_achievements_select_own" ON public.user_achievements;
CREATE POLICY "user_achievements_select_own"
  ON public.user_achievements FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "user_achievements_insert_own" ON public.user_achievements;
CREATE POLICY "user_achievements_insert_own"
  ON public.user_achievements FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "user_achievements_update_own" ON public.user_achievements;
CREATE POLICY "user_achievements_update_own"
  ON public.user_achievements FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "user_achievements_delete_own" ON public.user_achievements;
CREATE POLICY "user_achievements_delete_own"
  ON public.user_achievements FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "consent_audit_log_insert_own" ON public.consent_audit_log;
CREATE POLICY "consent_audit_log_insert_own"
  ON public.consent_audit_log FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "consent_audit_log_select_own" ON public.consent_audit_log;
CREATE POLICY "consent_audit_log_select_own"
  ON public.consent_audit_log FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

-- Immutable audit trail: no UPDATE or DELETE policies for consent_audit_log

-- =============================================================================
-- §3 GRANTS + GRAPHQL HARDENING (Security Advisor lints 0026/0027)
-- =============================================================================
-- App uses PostgREST only (supabase-js), not /graphql/v1.

REVOKE ALL ON public.user_privacy_profile FROM anon;
REVOKE ALL ON public.anonymized_data FROM anon;
REVOKE ALL ON public.health_data FROM anon;
REVOKE ALL ON public.user_keys FROM anon;
REVOKE ALL ON public.bug_reports FROM anon;

REVOKE ALL ON public.user_achievements FROM anon;

REVOKE ALL ON public.consent_audit_log FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_privacy_profile TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.anonymized_data TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.health_data TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_keys TO authenticated;
GRANT INSERT ON public.bug_reports TO anon, authenticated;
GRANT SELECT ON public.bug_reports TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_achievements TO authenticated;
GRANT SELECT, INSERT ON public.consent_audit_log TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE SELECT ON TABLES FROM anon;

DROP EXTENSION IF EXISTS pg_graphql CASCADE;

-- =============================================================================
-- §4 PLAN 13 RE1 — k-anonymous pool insight RPCs
-- =============================================================================
-- Uses research_facets only (numeric + date); never decrypts anonymized_log blobs.

CREATE OR REPLACE FUNCTION public.get_k_anon_pool_insights(
  p_condition text,
  p_k integer DEFAULT 5
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_k integer := GREATEST(2, LEAST(COALESCE(p_k, 5), 20));
  v_contributors integer;
  v_high_count integer;
  v_low_count integer;
  v_high_flare numeric;
  v_low_flare numeric;
  v_insights jsonb := '[]'::jsonb;
BEGIN
  IF p_condition IS NULL OR length(trim(p_condition)) < 2 THEN
    RETURN jsonb_build_object('kMin', v_k, 'contributorCount', 0, 'insights', '[]'::jsonb, 'suppressed', true);
  END IF;

  WITH per_user AS (
    SELECT
      user_id,
      avg((research_facets->>'sleep')::numeric) AS avg_sleep,
      avg(CASE WHEN (research_facets->>'flare')::int = 1 THEN 1.0 ELSE 0.0 END) AS flare_rate
    FROM anonymized_data
    WHERE medical_condition = trim(p_condition)
       OR lower(medical_condition) = lower(trim(p_condition))
      AND research_facets IS NOT NULL
      AND research_facets ? 'sleep'
    GROUP BY user_id
  ),
  cohorts AS (
    SELECT
      CASE WHEN avg_sleep >= 7 THEN 'high' ELSE 'low' END AS bucket,
      count(*) AS users,
      avg(flare_rate) AS avg_flare
    FROM per_user
    WHERE avg_sleep IS NOT NULL AND flare_rate IS NOT NULL
    GROUP BY 1
  )
  SELECT
    (SELECT count(DISTINCT user_id) FROM per_user),
    (SELECT users FROM cohorts WHERE bucket = 'high'),
    (SELECT users FROM cohorts WHERE bucket = 'low'),
    (SELECT avg_flare FROM cohorts WHERE bucket = 'high'),
    (SELECT avg_flare FROM cohorts WHERE bucket = 'low')
  INTO v_contributors, v_high_count, v_low_count, v_high_flare, v_low_flare;

  IF v_high_count >= v_k AND v_low_count >= v_k AND v_high_flare IS NOT NULL AND v_low_flare IS NOT NULL
     AND v_high_flare < v_low_flare THEN
    v_insights := jsonb_build_array(
      jsonb_build_object(
        'id', 'sleep-flare',
        'kMin', v_k,
        'highSleepCohort', v_high_count,
        'lowSleepCohort', v_low_count,
        'highFlarePct', round(v_high_flare * 100),
        'lowFlarePct', round(v_low_flare * 100)
      )
    );
  END IF;

  RETURN jsonb_build_object(
    'kMin', v_k,
    'contributorCount', COALESCE(v_contributors, 0),
    'insights', v_insights,
    'suppressed', jsonb_array_length(v_insights) = 0
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_k_anon_pool_insights(text, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_k_anon_pool_insights(text, integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_k_anon_pool_insights(text, integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.count_pool_contribution_days(p_condition text)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::integer
  FROM anonymized_data
  WHERE medical_condition = trim(p_condition)
     OR lower(medical_condition) = lower(trim(p_condition))
    AND research_facets IS NOT NULL;
$$;

REVOKE ALL ON FUNCTION public.count_pool_contribution_days(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.count_pool_contribution_days(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.count_pool_contribution_days(text) TO authenticated;

-- =============================================================================
-- §4b GDPR Art. 17 — delete all user-linked rows (service role or self via RPC)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.delete_all_user_data(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'delete_all_user_data: p_user_id required';
  END IF;

  DELETE FROM public.consent_audit_log WHERE user_id = p_user_id;
  DELETE FROM public.anonymized_data WHERE user_id = p_user_id;
  DELETE FROM public.health_data WHERE user_id = p_user_id;
  DELETE FROM public.user_keys WHERE user_id = p_user_id;
  DELETE FROM public.user_privacy_profile WHERE user_id = p_user_id;
  DELETE FROM public.user_achievements WHERE user_id = p_user_id;
  DELETE FROM public.bug_reports WHERE user_id = p_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_all_user_data(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.delete_all_user_data(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.delete_all_user_data(uuid) TO authenticated, service_role;

-- =============================================================================
-- §6 PG_CRON RETENTION (optional — enable pg_cron in Supabase Dashboard → Database → Extensions)
-- Uncomment and run in SQL Editor after enabling pg_cron. Launch audit Phase 4.
-- =============================================================================
/*
-- Purge bug_reports older than 90 days (weekly, Sunday 03:00 UTC)
SELECT cron.schedule(
  'rianell-purge-bug-reports-90d',
  '0 3 * * 0',
  $$DELETE FROM public.bug_reports WHERE created_at < now() - interval '90 days'$$
);

-- Purge consent_audit_log older than 24 months (monthly, 1st 04:00 UTC)
SELECT cron.schedule(
  'rianell-purge-consent-audit-24m',
  '0 4 1 * *',
  $$DELETE FROM public.consent_audit_log WHERE created_at < now() - interval '24 months'$$
);

-- Optional: anonymized_data contribution rows without user_id older than 36 months
SELECT cron.schedule(
  'rianell-purge-orphan-anon-36m',
  '0 5 1 * *',
  $$DELETE FROM public.anonymized_data WHERE user_id IS NULL AND created_at < now() - interval '36 months'$$
);
*/

COMMIT;

-- =============================================================================
-- §5 POST-APPLY VERIFICATION — run after §1–§4 succeed (select this block + Run)
-- =============================================================================
-- Expected: 7 tables (+ consent_audit_log), all rowsecurity = true, pool RPCs + delete_all_user_data.

-- CVE-2025-48757 audit (PostgREST RLS exposure): no public table without RLS
SELECT 'cve_rls' AS check_type, c.relname AS name,
  CASE WHEN c.relrowsecurity THEN 'ok' ELSE 'FAIL' END AS status
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r'
  AND c.relname IN (
    'user_privacy_profile', 'anonymized_data', 'health_data', 'user_keys',
    'bug_reports', 'user_achievements', 'consent_audit_log'
  )
ORDER BY c.relname;

-- CVE-2025-48757: anon must not have SELECT on user health tables
SELECT 'cve_anon_select' AS check_type, table_name AS name,
  CASE WHEN count(*) = 0 THEN 'ok' ELSE 'FAIL' END AS status
FROM information_schema.role_table_grants
WHERE grantee = 'anon' AND table_schema = 'public'
  AND privilege_type = 'SELECT'
  AND table_name IN ('health_data', 'user_keys', 'anonymized_data', 'user_privacy_profile', 'user_achievements', 'consent_audit_log')
GROUP BY table_name;

SELECT 'tables' AS check_type, table_name AS name, 'ok' AS status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'user_privacy_profile', 'anonymized_data', 'health_data', 'user_keys', 'bug_reports', 'user_achievements', 'consent_audit_log'
  )
ORDER BY table_name;

SELECT 'rls_enabled' AS check_type, tablename AS name,
  CASE WHEN rowsecurity THEN 'ok' ELSE 'FAIL' END AS status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'user_privacy_profile', 'anonymized_data', 'health_data', 'user_keys', 'bug_reports', 'user_achievements', 'consent_audit_log'
  )
ORDER BY tablename;

SELECT 'policy_count' AS check_type, tablename AS name, count(*)::text AS status
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

SELECT 'rpc' AS check_type, proname AS name, 'ok' AS status
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND proname IN ('get_k_anon_pool_insights', 'count_pool_contribution_days', 'delete_all_user_data')
ORDER BY proname;

SELECT 'column' AS check_type, 'anonymized_data.research_facets' AS name,
  CASE WHEN count(*) = 1 THEN 'ok' ELSE 'FAIL' END AS status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'anonymized_data'
  AND column_name = 'research_facets';
