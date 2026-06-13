-- Resolve Supabase Security Advisor lints 0026 + 0027 (pg_graphql_*_table_exposed).
--
-- Health-app uses PostgREST via supabase-js only — not the /graphql/v1 endpoint.
-- RLS protects rows; pg_graphql introspection still exposes table/column names when
-- anon or authenticated hold SELECT grants.
--
-- Run in: Supabase Dashboard → SQL Editor (staging first, then production).
-- Safe to re-run (idempotent REVOKE / GRANT / DROP EXTENSION IF EXISTS).

BEGIN;

-- 1) Remove GraphQL schema surface (clears all eight pg_graphql_* advisor findings).
DROP EXTENSION IF EXISTS pg_graphql CASCADE;

-- 2) Strip Supabase default broad grants from anon on sensitive tables.
REVOKE ALL ON public.anonymized_data FROM anon;
REVOKE ALL ON public.health_data FROM anon;
REVOKE ALL ON public.user_keys FROM anon;
REVOKE ALL ON public.bug_reports FROM anon;

-- 3) Least-privilege grants (must match supabase/Schema.sql + RLS policies).
GRANT SELECT, INSERT, UPDATE, DELETE ON public.anonymized_data TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.health_data TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_keys TO authenticated;
GRANT INSERT ON public.bug_reports TO anon, authenticated;
GRANT SELECT ON public.bug_reports TO authenticated;

-- 4) New tables should not auto-inherit SELECT for anon (GraphQL + REST discovery).
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE SELECT ON TABLES FROM anon;

COMMIT;
