-- Plan 21 SEC5 + Plan 23 CM1/CM3 — CSP violations + community tables
CREATE TABLE IF NOT EXISTS public.csp_violations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text,
  directive text,
  blocked_uri text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.csp_violations ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.community_tips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  condition_tag text NOT NULL,
  category text NOT NULL,
  content text NOT NULL CHECK (char_length(content) <= 500),
  upvotes integer DEFAULT 0,
  flag_count integer DEFAULT 0,
  approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.community_tips ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.community_triggers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  condition_tag text NOT NULL,
  trigger_name text NOT NULL,
  trigger_category text,
  contributor_count integer DEFAULT 1,
  approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.community_triggers ENABLE ROW LEVEL SECURITY;
