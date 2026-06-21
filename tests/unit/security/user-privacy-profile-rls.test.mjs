import { readFileSync } from 'fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

test('Schema.sql defines user_privacy_profile with RLS policies', () => {
  const sql = readFileSync('supabase/Schema.sql', 'utf8');
  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.user_privacy_profile/);
  assert.match(sql, /ALTER TABLE public\.user_privacy_profile ENABLE ROW LEVEL SECURITY/);
  assert.match(sql, /user_privacy_profile_select_own/);
  assert.match(sql, /user_privacy_profile_insert_own/);
  assert.match(sql, /user_privacy_profile_update_own/);
  assert.match(sql, /user_privacy_profile_delete_own/);
  assert.match(sql, /auth\.uid\(\) = user_id/);
});

test('Schema grants authenticated CRUD on user_privacy_profile', () => {
  const sql = readFileSync('supabase/Schema.sql', 'utf8');
  assert.match(sql, /GRANT SELECT, INSERT, UPDATE, DELETE ON public\.user_privacy_profile TO authenticated/);
  assert.match(sql, /REVOKE ALL ON public\.user_privacy_profile FROM anon/);
});

test('Schema.sql does not require llm-models storage bucket (HF-only weights)', () => {
  const sql = readFileSync('supabase/Schema.sql', 'utf8');
  assert.doesNotMatch(sql, /INSERT INTO storage\.buckets/);
  assert.doesNotMatch(sql, /'llm-models'/);
});

test('Schema.sql defines user_achievements with RLS policies', () => {
  const sql = readFileSync('supabase/Schema.sql', 'utf8');
  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.user_achievements/);
  assert.match(sql, /ALTER TABLE public\.user_achievements ENABLE ROW LEVEL SECURITY/);
  assert.match(sql, /user_achievements_select_own/);
  assert.match(sql, /user_achievements_insert_own/);
  assert.match(sql, /user_achievements_update_own/);
  assert.match(sql, /user_achievements_delete_own/);
});

test('Schema grants authenticated CRUD on user_achievements', () => {
  const sql = readFileSync('supabase/Schema.sql', 'utf8');
  assert.match(sql, /GRANT SELECT, INSERT, UPDATE, DELETE ON public\.user_achievements TO authenticated/);
  assert.match(sql, /REVOKE ALL ON public\.user_achievements FROM anon/);
});

test('Schema.sql defines Plan 13 RE1 pool insight RPCs', () => {
  const sql = readFileSync('supabase/Schema.sql', 'utf8');
  assert.match(sql, /research_facets jsonb/);
  assert.match(sql, /CREATE OR REPLACE FUNCTION public\.get_k_anon_pool_insights/);
  assert.match(sql, /CREATE OR REPLACE FUNCTION public\.count_pool_contribution_days/);
  assert.match(sql, /GRANT EXECUTE ON FUNCTION public\.get_k_anon_pool_insights/);
});
