-- Recommended Row Level Security (RLS) baseline for Rianell + Supabase
-- Review your actual column names and policies in the Supabase dashboard before applying.
-- Run in Supabase SQL Editor as a privileged role. Test in a staging project first.

-- ALTER TABLE public.anonymized_data ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Example policies (uncomment and adapt to your schema / auth.uid() columns):
-- CREATE POLICY "Users insert own anonymized rows"
--   ON public.anonymized_data FOR INSERT TO authenticated
--   WITH CHECK (auth.uid() = user_id);
-- CREATE POLICY "Users select own anonymized rows"
--   ON public.anonymized_data FOR SELECT TO authenticated
--   USING (auth.uid() = user_id);

-- The browser embeds the Supabase anon key; security depends on RLS, not on hiding the key.
