-- Recreate public app tables for Health-app (Supabase).
--
-- WARNING: This drops existing tables (and dependent objects via CASCADE), then recreates them.
-- All data in these tables will be lost. auth.users is NOT modified.
--
-- Run in: Supabase Dashboard → SQL Editor, or: psql $DATABASE_URL -f supabase/recreate_public_tables.sql
--
-- After running, re-apply Row Level Security policies and grants if your project used custom ones.

BEGIN;

-- Drop in dependency-safe order (no cross-FKs between these tables; CASCADE clears any policies/triggers).
DROP TABLE IF EXISTS public.anonymized_data CASCADE;
DROP TABLE IF EXISTS public.health_data CASCADE;
DROP TABLE IF EXISTS public.user_keys CASCADE;

CREATE TABLE public.anonymized_data (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id uuid,
  anonymized_logs text NOT NULL,
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

COMMIT;
