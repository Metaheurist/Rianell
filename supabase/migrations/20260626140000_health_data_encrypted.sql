-- Plan 15 FC5: encrypted health_data payload
ALTER TABLE public.health_data
  ADD COLUMN IF NOT EXISTS data_encrypted text,
  ADD COLUMN IF NOT EXISTS data_iv text,
  ADD COLUMN IF NOT EXISTS data_encrypted_v integer DEFAULT 1;
