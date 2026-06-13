import { readFileSync } from 'fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

test('Schema.sql defines user_privacy_profile with RLS policies', () => {
  const sql = readFileSync('supabase/Schema.sql', 'utf8');
  assert.match(sql, /CREATE TABLE public\.user_privacy_profile/);
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

test('Schema.sql defines public llm-models storage bucket without list policy', () => {
  const sql = readFileSync('supabase/Schema.sql', 'utf8');
  assert.match(sql, /INSERT INTO storage\.buckets/);
  assert.match(sql, /'llm-models'/);
  assert.doesNotMatch(sql, /CREATE POLICY "Public read llm-models"/);
});
