-- Plan 13 RE1 — k-anonymous pool insights RPC (deploy to Supabase SQL editor).
-- Uses research_facets only (numeric + date); never decrypts anonymized_log blobs.

CREATE OR REPLACE FUNCTION public.get_k_anon_pool_insights(
  p_condition text,
  p_k integer DEFAULT 5
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_k integer := GREATEST(2, LEAST(COALESCE(p_k, 5), 20));
  v_contributors integer;
  v_high_count integer;
  v_low_count integer;
  v_high_flare numeric;
  v_low_flare numeric;
  v_insights jsonb := '[]'::jsonb;
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
    WHERE lower(medical_condition) = lower(trim(p_condition))
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
    (SELECT users FROM cohorts WHERE bucket = 'high'),
    (SELECT users FROM cohorts WHERE bucket = 'low'),
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
        'lowSleepCohort', v_low_count,
        'highFlarePct', round(v_high_flare * 100),
        'lowFlarePct', round(v_low_flare * 100)
      )
    );
  END IF;

  RETURN jsonb_build_object(
    'kMin', v_k,
    'contributorCount', COALESCE(v_contributors, 0),
    'insights', v_insights,
    'suppressed', jsonb_array_length(v_insights) = 0
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_k_anon_pool_insights(text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_k_anon_pool_insights(text, integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.count_pool_contribution_days(p_condition text)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::integer
  FROM anonymized_data
  WHERE lower(medical_condition) = lower(trim(p_condition))
    AND research_facets IS NOT NULL;
$$;

REVOKE ALL ON FUNCTION public.count_pool_contribution_days(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.count_pool_contribution_days(text) TO authenticated;
