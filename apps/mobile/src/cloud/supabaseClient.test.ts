import { getSupabaseClient, resetSupabaseClientForTests } from './supabaseClient';

beforeEach(() => {
  resetSupabaseClientForTests();
});

test('getSupabaseClient returns null when URL or key missing (jest.setup extras empty)', () => {
  expect(getSupabaseClient()).toBeNull();
});
