-- =============================================================================
-- Rianell Supabase — FRESH INSTALL schema (all migrations baked in)
-- =============================================================================
--
-- USE THIS FILE when:
--   • First time setting up a brand-new Supabase project, OR
--   • Wiping dev/staging completely and starting fresh
--
-- DO NOT USE on a live project with user data — use Schema.sql instead.
--
-- §0 WIPE is ENABLED BY DEFAULT here (uncomment = off, comment = on).
-- All migrations are baked in as CREATE TABLE / CREATE FUNCTION — no
-- supabase/migrations/*.sql files need to be applied separately.
--
-- Steps:
--   1. Supabase Dashboard → SQL Editor → New query
--   2. Paste entire file → Run
--   3. Run §5 verification queries at bottom to confirm
--   4. Enable pg_cron extension if you want retention jobs (§6 below)
--
-- Project ref: gitnxgfbbpykwqvogmqq
-- =============================================================================

BEGIN;

-- =============================================================================
-- §0 FULL WIPE — always active in this file
-- =============================================================================

-- Functions (public wrappers first, then private impls)
DROP FUNCTION IF EXISTS public.increment_share_access(text);
DROP FUNCTION IF EXISTS public.get_community_triggers(text);
DROP FUNCTION IF EXISTS public.log_consent_event(text, jsonb);
DROP FUNCTION IF EXISTS public.delete_all_user_data(uuid);
DROP FUNCTION IF EXISTS public.count_pool_contribution_days(text);
DROP FUNCTION IF EXISTS public.get_k_anon_pool_insights(text, integer);
DROP FUNCTION IF EXISTS private.delete_all_user_data_impl(uuid);
DROP FUNCTION IF EXISTS private.count_pool_contribution_days_impl(text);
DROP FUNCTION IF EXISTS private.get_k_anon_pool_insights_impl(text, integer);

-- Tables (newest/most-dependent first)
DROP TABLE IF EXISTS public.share_links CASCADE;
DROP TABLE IF EXISTS public.community_triggers CASCADE;
DROP TABLE IF EXISTS public.community_tips CASCADE;
DROP TABLE IF EXISTS public.csp_violations CASCADE;
DROP TABLE IF EXISTS public.webhook_deliveries CASCADE;
DROP TABLE IF EXISTS public.user_webhooks CASCADE;
DROP TABLE IF EXISTS public.api_keys CASCADE;
DROP TABLE IF EXISTS public.user_integrations CASCADE;
DROP TABLE IF EXISTS public.oauth2_auth_codes CASCADE;
DROP TABLE IF EXISTS public.oauth2_clients CASCADE;
DROP TABLE IF EXISTS public.consent_audit_log CASCADE;
DROP TABLE IF EXISTS public.user_achievements CASCADE;
DROP TABLE IF EXISTS public.bug_reports CASCADE;
DROP TABLE IF EXISTS public.user_keys CASCADE;
DROP TABLE IF EXISTS public.health_data CASCADE;
DROP TABLE IF EXISTS public.anonymized_data CASCADE;
DROP TABLE IF EXISTS public.user_privacy_profile CASCADE;

DROP SCHEMA IF EXISTS private CASCADE;

-- Wipe auth (dev only — destroys all accounts)
DELETE FROM auth.refresh_tokens;
DELETE FROM auth.sessions;
DELETE FROM auth.identities;
DELETE FROM auth.users;

-- =============================================================================
-- §1 TABLES
-- =============================================================================

-- ── Core user profile ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_privacy_profile (
  user_id            uuid NOT NULL,
  nickname           text,
  medical_condition  text,
  share_data         boolean DEFAULT false,
  location_consent   boolean DEFAULT false,
  created_at         timestamptz DEFAULT now(),
  CONSTRAINT user_privacy_profile_pkey PRIMARY KEY (user_id),
  CONSTRAINT user_privacy_profile_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE
);

-- ── Anonymised research pool ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.anonymized_data (
  id                 uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id            uuid,
  medical_condition  text,
  log_date           date,
  anonymized_log     jsonb,
  research_facets    jsonb,
  created_at         timestamptz DEFAULT now(),
  CONSTRAINT anonymized_data_pkey PRIMARY KEY (id),
  CONSTRAINT anonymized_data_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE SET NULL
);

-- ── Per-user encrypted health log ─────────────────────────────────────────────
-- data_encrypted / data_iv / data_encrypted_v added per migration 20260626140000
CREATE TABLE IF NOT EXISTS public.health_data (
  user_id            uuid NOT NULL,
  health_logs        text NOT NULL,
  app_settings       text,
  created_at         timestamptz DEFAULT now(),
  updated_at         timestamptz DEFAULT now(),
  ai_state           text,
  data_encrypted     text,
  data_iv            text,
  data_encrypted_v   integer DEFAULT 1,
  CONSTRAINT health_data_pkey PRIMARY KEY (user_id),
  CONSTRAINT health_data_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE
);

-- ── Encryption keys (wrapped DEK support) ────────────────────────────────────
-- wrapped_dek / dek_salt / key_version added per migration 20260626130000
CREATE TABLE IF NOT EXISTS public.user_keys (
  user_id        uuid NOT NULL,
  encryption_key text,
  wrapped_dek    text,
  dek_salt       text,
  key_version    integer DEFAULT 1,
  created_at     timestamptz DEFAULT now(),
  CONSTRAINT user_keys_pkey PRIMARY KEY (user_id),
  CONSTRAINT user_keys_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE
);

-- ── Bug reports ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bug_reports (
  id          uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id     uuid,
  description text NOT NULL,
  app_version text,
  platform    text,
  created_at  timestamptz DEFAULT now(),
  CONSTRAINT bug_reports_pkey PRIMARY KEY (id),
  CONSTRAINT bug_reports_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE SET NULL
);

-- ── Achievements ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id         uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL,
  badge_id   text NOT NULL,
  earned_at  timestamptz DEFAULT now(),
  metadata   jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT user_achievements_pkey PRIMARY KEY (id),
  CONSTRAINT user_achievements_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE
);

-- ── Consent audit log (GDPR Art. 7) ──────────────────────────────────────────
-- log_consent_event RPC added per migration 20260626120000
CREATE TABLE IF NOT EXISTS public.consent_audit_log (
  id           uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL,
  consent_type text NOT NULL DEFAULT 'consent_changed',
  metadata     jsonb DEFAULT '{}'::jsonb,
  created_at   timestamptz DEFAULT now(),
  CONSTRAINT consent_audit_log_pkey PRIMARY KEY (id),
  CONSTRAINT consent_audit_log_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE
);

-- ── API keys (Plan 18) ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.api_keys (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key_hash     text NOT NULL,
  key_prefix   text NOT NULL,
  label        text,
  scopes       text[] DEFAULT ARRAY['logs:read']::text[],
  last_used_at timestamptz,
  created_at   timestamptz DEFAULT now(),
  revoked_at   timestamptz
);

-- ── Webhooks (Plan 18) ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_webhooks (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url              text NOT NULL,
  events           text[] DEFAULT ARRAY['log.created']::text[],
  secret           text,
  enabled          boolean DEFAULT true,
  created_at       timestamptz DEFAULT now(),
  last_delivered_at timestamptz,
  failure_count    integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id      uuid REFERENCES public.user_webhooks(id) ON DELETE CASCADE,
  event_type      text,
  payload         jsonb,
  response_status integer,
  attempt         integer DEFAULT 1,
  delivered_at    timestamptz DEFAULT now()
);

-- ── OAuth2 (Plan 19) ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.oauth2_clients (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id      text NOT NULL UNIQUE,
  client_name    text NOT NULL,
  redirect_uris  text[] NOT NULL DEFAULT '{}'::text[],
  allowed_scopes text[] NOT NULL DEFAULT ARRAY['logs:read']::text[],
  created_by     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at     timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.oauth2_auth_codes (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code           text NOT NULL UNIQUE,
  client_id      text NOT NULL,
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scopes         text[] NOT NULL DEFAULT '{}'::text[],
  code_challenge text NOT NULL,
  expires_at     timestamptz NOT NULL,
  used           boolean DEFAULT false,
  created_at     timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_integrations (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider                 text NOT NULL,
  access_token_encrypted   text,
  refresh_token_encrypted  text,
  sheet_id                 text,
  sheet_range              text,
  metadata                 jsonb DEFAULT '{}'::jsonb,
  last_sync_at             timestamptz,
  sync_status              text DEFAULT 'idle',
  created_at               timestamptz DEFAULT now(),
  updated_at               timestamptz DEFAULT now(),
  UNIQUE (user_id, provider)
);

CREATE TABLE IF NOT EXISTS public.connector_tokens (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider                 text NOT NULL,
  access_token_encrypted   text NOT NULL,
  refresh_token_encrypted  text,
  expires_at               timestamptz,
  updated_at               timestamptz DEFAULT now(),
  UNIQUE (user_id, provider)
);

CREATE TABLE IF NOT EXISTS public.connector_oauth_states (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider                 text NOT NULL,
  nonce                    text NOT NULL,
  expires_at               timestamptz NOT NULL,
  created_at               timestamptz DEFAULT now()
);

-- ── CSP violation reports (Plan 21) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.csp_violations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url         text,
  directive   text,
  blocked_uri text,
  created_at  timestamptz DEFAULT now()
);

-- ── Community tips & triggers (Plan 23) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.community_tips (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  condition_tag text NOT NULL,
  category      text NOT NULL,
  content       text NOT NULL CHECK (char_length(content) <= 500),
  upvotes       integer DEFAULT 0,
  flag_count    integer DEFAULT 0,
  approved      boolean DEFAULT false,
  created_at    timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.community_triggers (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  condition_tag      text NOT NULL,
  trigger_name       text NOT NULL,
  trigger_category   text,
  contributor_count  integer DEFAULT 1,
  approved           boolean DEFAULT false,
  created_at         timestamptz DEFAULT now()
);

-- ── Share links (encrypted read-only sharing) ─────────────────────────────────
-- Password never stored server-side; client encrypts before upload.
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

-- =============================================================================
-- §2 ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE public.user_privacy_profile  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anonymized_data        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_data            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_keys              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bug_reports            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_audit_log      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_webhooks          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_deliveries     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oauth2_clients         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oauth2_auth_codes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_integrations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connector_tokens       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connector_oauth_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.csp_violations         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_tips         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_triggers     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.share_links            ENABLE ROW LEVEL SECURITY;

-- user_privacy_profile
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

-- anonymized_data
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

-- health_data
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

-- user_keys
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

-- bug_reports (anon can insert; only owner reads back)
DROP POLICY IF EXISTS "bug_reports_insert_public" ON public.bug_reports;
CREATE POLICY "bug_reports_insert_public"
  ON public.bug_reports FOR INSERT TO anon, authenticated
  WITH CHECK (char_length(description) >= 1 AND char_length(description) <= 4000);

DROP POLICY IF EXISTS "bug_reports_select_own" ON public.bug_reports;
CREATE POLICY "bug_reports_select_own"
  ON public.bug_reports FOR SELECT TO authenticated
  USING (user_id IS NOT NULL AND (select auth.uid()) = user_id);

-- user_achievements
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

-- consent_audit_log (immutable — no UPDATE/DELETE policies)
DROP POLICY IF EXISTS "consent_audit_log_insert_own" ON public.consent_audit_log;
CREATE POLICY "consent_audit_log_insert_own"
  ON public.consent_audit_log FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "consent_audit_log_select_own" ON public.consent_audit_log;
CREATE POLICY "consent_audit_log_select_own"
  ON public.consent_audit_log FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

-- api_keys
DROP POLICY IF EXISTS "api_keys_owner" ON public.api_keys;
CREATE POLICY "api_keys_owner"
  ON public.api_keys FOR ALL TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- user_webhooks
DROP POLICY IF EXISTS "user_webhooks_owner" ON public.user_webhooks;
CREATE POLICY "user_webhooks_owner"
  ON public.user_webhooks FOR ALL TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- webhook_deliveries (read-only; user can see deliveries for their own webhooks)
DROP POLICY IF EXISTS "webhook_deliveries_owner" ON public.webhook_deliveries;
CREATE POLICY "webhook_deliveries_owner"
  ON public.webhook_deliveries FOR SELECT TO authenticated
  USING (
    webhook_id IN (SELECT id FROM public.user_webhooks WHERE user_id = (select auth.uid()))
  );

-- oauth2_clients
DROP POLICY IF EXISTS "oauth2_clients_read" ON public.oauth2_clients;
CREATE POLICY "oauth2_clients_read"
  ON public.oauth2_clients FOR SELECT TO authenticated
  USING (created_by IS NULL OR created_by = (select auth.uid()));

DROP POLICY IF EXISTS "oauth2_clients_insert" ON public.oauth2_clients;
CREATE POLICY "oauth2_clients_insert"
  ON public.oauth2_clients FOR INSERT TO authenticated
  WITH CHECK (created_by = (select auth.uid()));

-- oauth2_auth_codes
DROP POLICY IF EXISTS "oauth2_auth_codes_owner" ON public.oauth2_auth_codes;
CREATE POLICY "oauth2_auth_codes_owner"
  ON public.oauth2_auth_codes FOR ALL TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- user_integrations
DROP POLICY IF EXISTS "user_integrations_owner" ON public.user_integrations;
CREATE POLICY "user_integrations_owner"
  ON public.user_integrations FOR ALL TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- csp_violations — internal only; no client access
-- (RLS enabled; no policies = no rows readable by any role)

-- community_tips
DROP POLICY IF EXISTS tips_read_approved ON public.community_tips;
CREATE POLICY tips_read_approved ON public.community_tips
  FOR SELECT TO authenticated USING (approved = true AND flag_count < 3);

DROP POLICY IF EXISTS tips_insert_authenticated ON public.community_tips;
CREATE POLICY tips_insert_authenticated ON public.community_tips
  FOR INSERT TO authenticated WITH CHECK (true);

-- community_triggers — read via RPC only (get_community_triggers enforces k≥5)
-- No direct SELECT policy; the SECURITY INVOKER RPC handles access.

-- share_links — public read (within expiry/count limits) + public insert
DROP POLICY IF EXISTS "share_links_anon_insert" ON public.share_links;
CREATE POLICY "share_links_anon_insert"
  ON public.share_links FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "share_links_anon_select" ON public.share_links;
CREATE POLICY "share_links_anon_select"
  ON public.share_links FOR SELECT TO anon, authenticated
  USING (expires_at > now() AND access_count < max_accesses);

-- =============================================================================
-- §3 GRANTS + GRAPHQL HARDENING (Security Advisor lints 0026/0027)
-- =============================================================================
-- App uses PostgREST only (supabase-js), not /graphql/v1.

REVOKE ALL ON public.user_privacy_profile  FROM anon;
REVOKE ALL ON public.anonymized_data        FROM anon;
REVOKE ALL ON public.health_data            FROM anon;
REVOKE ALL ON public.user_keys              FROM anon;
REVOKE ALL ON public.bug_reports            FROM anon;
REVOKE ALL ON public.user_achievements      FROM anon;
REVOKE ALL ON public.consent_audit_log      FROM anon;
REVOKE ALL ON public.csp_violations         FROM anon, authenticated;
REVOKE ALL ON public.community_tips         FROM anon;
REVOKE ALL ON public.community_triggers     FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_privacy_profile  TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.anonymized_data        TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.health_data            TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_keys              TO authenticated;
GRANT INSERT                          ON public.bug_reports            TO anon, authenticated;
GRANT SELECT                          ON public.bug_reports            TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_achievements      TO authenticated;
GRANT SELECT, INSERT                  ON public.consent_audit_log      TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.api_keys               TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_webhooks          TO authenticated;
GRANT SELECT                          ON public.webhook_deliveries     TO authenticated;
GRANT SELECT, INSERT                  ON public.oauth2_clients         TO authenticated;
GRANT SELECT, INSERT, UPDATE          ON public.oauth2_auth_codes      TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_integrations      TO authenticated;
GRANT SELECT, INSERT                  ON public.community_tips         TO authenticated;
GRANT INSERT                          ON public.share_links            TO anon, authenticated;
GRANT SELECT                          ON public.share_links            TO anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE SELECT ON TABLES FROM anon;

DROP EXTENSION IF EXISTS pg_graphql CASCADE;

-- =============================================================================
-- §4 PRIVATE SCHEMA + POOL RPCs (Plan 13 RE1)
-- =============================================================================
-- SECURITY DEFINER bodies live in schema `private` (not PostgREST-exposed).
-- Public wrappers are SECURITY INVOKER — clears Security Advisor lint 0029.

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO postgres, service_role, authenticated;

CREATE OR REPLACE FUNCTION private.get_k_anon_pool_insights_impl(
  p_condition text,
  p_k         integer DEFAULT 5
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_k              integer := GREATEST(2, LEAST(COALESCE(p_k, 5), 20));
  v_contributors   integer;
  v_high_count     integer;
  v_low_count      integer;
  v_high_flare     numeric;
  v_low_flare      numeric;
  v_insights       jsonb := '[]'::jsonb;
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
    WHERE (
      medical_condition = trim(p_condition)
      OR lower(medical_condition) = lower(trim(p_condition))
    )
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
    (SELECT users     FROM cohorts WHERE bucket = 'high'),
    (SELECT users     FROM cohorts WHERE bucket = 'low'),
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
        'lowSleepCohort',  v_low_count,
        'highFlarePct',    round(v_high_flare * 100),
        'lowFlarePct',     round(v_low_flare  * 100)
      )
    );
  END IF;

  RETURN jsonb_build_object(
    'kMin',             v_k,
    'contributorCount', COALESCE(v_contributors, 0),
    'insights',         v_insights,
    'suppressed',       jsonb_array_length(v_insights) = 0
  );
END;
$$;

REVOKE ALL ON FUNCTION private.get_k_anon_pool_insights_impl(text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.get_k_anon_pool_insights_impl(text, integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_k_anon_pool_insights(p_condition text, p_k integer DEFAULT 5)
RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path = public AS $$
  SELECT private.get_k_anon_pool_insights_impl(p_condition, p_k);
$$;

REVOKE ALL ON FUNCTION public.get_k_anon_pool_insights(text, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_k_anon_pool_insights(text, integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_k_anon_pool_insights(text, integer) TO authenticated;

CREATE OR REPLACE FUNCTION private.count_pool_contribution_days_impl(p_condition text)
RETURNS integer LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT count(*)::integer
  FROM anonymized_data
  WHERE (
    medical_condition = trim(p_condition)
    OR lower(medical_condition) = lower(trim(p_condition))
  )
    AND research_facets IS NOT NULL;
$$;

REVOKE ALL ON FUNCTION private.count_pool_contribution_days_impl(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.count_pool_contribution_days_impl(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.count_pool_contribution_days(p_condition text)
RETURNS integer LANGUAGE sql SECURITY INVOKER SET search_path = public AS $$
  SELECT private.count_pool_contribution_days_impl(p_condition);
$$;

REVOKE ALL ON FUNCTION public.count_pool_contribution_days(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.count_pool_contribution_days(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.count_pool_contribution_days(text) TO authenticated;

-- =============================================================================
-- §4b GDPR Art. 17 — delete all user-linked rows
-- =============================================================================

CREATE OR REPLACE FUNCTION private.delete_all_user_data_impl(p_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'delete_all_user_data: p_user_id required';
  END IF;
  DELETE FROM public.webhook_deliveries
    WHERE webhook_id IN (SELECT id FROM public.user_webhooks WHERE user_id = p_user_id);
  DELETE FROM public.user_webhooks      WHERE user_id = p_user_id;
  DELETE FROM public.api_keys           WHERE user_id = p_user_id;
  DELETE FROM public.oauth2_auth_codes  WHERE user_id = p_user_id;
  DELETE FROM public.connector_oauth_states WHERE user_id = p_user_id;
  DELETE FROM public.connector_tokens   WHERE user_id = p_user_id;
  DELETE FROM public.user_integrations  WHERE user_id = p_user_id;
  DELETE FROM public.consent_audit_log  WHERE user_id = p_user_id;
  DELETE FROM public.anonymized_data    WHERE user_id = p_user_id;
  DELETE FROM public.health_data        WHERE user_id = p_user_id;
  DELETE FROM public.user_keys          WHERE user_id = p_user_id;
  DELETE FROM public.user_privacy_profile WHERE user_id = p_user_id;
  DELETE FROM public.user_achievements  WHERE user_id = p_user_id;
  DELETE FROM public.bug_reports        WHERE user_id = p_user_id;
END;
$$;

REVOKE ALL ON FUNCTION private.delete_all_user_data_impl(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.delete_all_user_data_impl(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.delete_all_user_data(p_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'delete_all_user_data: p_user_id required';
  END IF;
  IF auth.role() = 'service_role' THEN
    PERFORM private.delete_all_user_data_impl(p_user_id);
    RETURN;
  END IF;
  IF (select auth.uid()) IS NULL OR (select auth.uid()) <> p_user_id THEN
    RAISE EXCEPTION 'delete_all_user_data: forbidden';
  END IF;
  PERFORM private.delete_all_user_data_impl(p_user_id);
END;
$$;

REVOKE ALL ON FUNCTION public.delete_all_user_data(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.delete_all_user_data(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.delete_all_user_data(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_all_user_data(uuid) TO service_role;

-- =============================================================================
-- §4c Consent audit RPC (Plan: GDPR consent log)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.log_consent_event(
  p_consent_type text,
  p_metadata     jsonb DEFAULT '{}'::jsonb
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  INSERT INTO public.consent_audit_log (user_id, consent_type, metadata)
  VALUES (auth.uid(), COALESCE(p_consent_type, 'consent_changed'), COALESCE(p_metadata, '{}'::jsonb));
END;
$$;

REVOKE EXECUTE ON FUNCTION public.log_consent_event(text, jsonb) FROM anon;
GRANT EXECUTE ON FUNCTION public.log_consent_event(text, jsonb) TO authenticated;

-- =============================================================================
-- §4d Community triggers RPC (Plan 23 — k≥5 enforced here)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_community_triggers(p_condition text)
RETURNS SETOF public.community_triggers LANGUAGE sql SECURITY INVOKER SET search_path = public AS $$
  SELECT * FROM public.community_triggers
  WHERE condition_tag = trim(p_condition)
    AND approved = true
    AND contributor_count >= 5
  ORDER BY contributor_count DESC;
$$;

REVOKE EXECUTE ON FUNCTION public.get_community_triggers(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_community_triggers(text) TO authenticated;

-- =============================================================================
-- §4e Share link access counter
-- =============================================================================

CREATE OR REPLACE FUNCTION public.increment_share_access(p_code text)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE share_links SET access_count = access_count + 1
  WHERE share_code = p_code AND expires_at > now();
$$;

GRANT EXECUTE ON FUNCTION public.increment_share_access(text) TO anon, authenticated;

-- =============================================================================
-- §4f Private health photo attachments (storage bucket)
-- =============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('health-photos', 'health-photos', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "health_photos_select_own" ON storage.objects;
CREATE POLICY "health_photos_select_own"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'health-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "health_photos_insert_own" ON storage.objects;
CREATE POLICY "health_photos_insert_own"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'health-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "health_photos_delete_own" ON storage.objects;
CREATE POLICY "health_photos_delete_own"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'health-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

COMMIT;

-- =============================================================================
-- §5 POST-APPLY VERIFICATION (run after §1–§4f succeed)
-- =============================================================================

-- All public tables have RLS enabled
SELECT 'rls_enabled' AS check_type, tablename AS name,
  CASE WHEN rowsecurity THEN 'ok' ELSE 'FAIL' END AS status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- anon must not have SELECT on user health tables
SELECT 'cve_anon_select' AS check_type, table_name AS name,
  CASE WHEN count(*) = 0 THEN 'ok' ELSE 'FAIL' END AS status
FROM information_schema.role_table_grants
WHERE grantee = 'anon' AND table_schema = 'public'
  AND privilege_type = 'SELECT'
  AND table_name IN ('health_data', 'user_keys', 'anonymized_data', 'user_privacy_profile',
                     'user_achievements', 'consent_audit_log')
GROUP BY table_name;

-- All expected tables present
SELECT 'tables' AS check_type, table_name AS name, 'ok' AS status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'user_privacy_profile', 'anonymized_data', 'health_data', 'user_keys',
    'bug_reports', 'user_achievements', 'consent_audit_log',
    'api_keys', 'user_webhooks', 'webhook_deliveries',
    'oauth2_clients', 'oauth2_auth_codes', 'user_integrations',
    'csp_violations', 'community_tips', 'community_triggers',
    'share_links'
  )
ORDER BY table_name;

-- All expected RPCs present
SELECT 'rpc' AS check_type, proname AS name, 'ok' AS status
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND proname IN (
    'get_k_anon_pool_insights', 'count_pool_contribution_days',
    'delete_all_user_data', 'log_consent_event',
    'increment_share_access', 'get_community_triggers'
  )
ORDER BY proname;

-- Encryption columns present on health_data and user_keys
SELECT 'column' AS check_type,
  table_name || '.' || column_name AS name,
  'ok' AS status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
    (table_name = 'health_data' AND column_name IN ('data_encrypted', 'data_iv', 'data_encrypted_v'))
    OR (table_name = 'user_keys'   AND column_name IN ('wrapped_dek', 'dek_salt', 'key_version'))
  )
ORDER BY table_name, column_name;

-- Storage bucket created
SELECT 'storage' AS check_type, id AS name, 'ok' AS status
FROM storage.buckets WHERE id = 'health-photos';

-- =============================================================================
-- §6 PG_CRON RETENTION (optional — enable pg_cron in Dashboard → Extensions)
-- Uncomment and run in SQL Editor after enabling the extension.
-- =============================================================================
/*
SELECT cron.schedule(
  'rianell-purge-bug-reports-90d',
  '0 3 * * 0',
  $$DELETE FROM public.bug_reports WHERE created_at < now() - interval '90 days'$$
);

SELECT cron.schedule(
  'rianell-purge-consent-audit-24m',
  '0 4 1 * *',
  $$DELETE FROM public.consent_audit_log WHERE created_at < now() - interval '24 months'$$
);

SELECT cron.schedule(
  'rianell-purge-orphan-anon-36m',
  '0 5 1 * *',
  $$DELETE FROM public.anonymized_data WHERE user_id IS NULL AND created_at < now() - interval '36 months'$$
);
*/
