-- Plan 15 FC4: wrapped DEK columns
ALTER TABLE public.user_keys
  ADD COLUMN IF NOT EXISTS wrapped_dek text,
  ADD COLUMN IF NOT EXISTS dek_salt text,
  ADD COLUMN IF NOT EXISTS key_version integer DEFAULT 1;
