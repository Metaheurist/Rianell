-- Plan 15 FC3: consent audit RPC
CREATE OR REPLACE FUNCTION public.log_consent_event(p_consent_type text, p_metadata jsonb DEFAULT '{}'::jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  INSERT INTO public.consent_audit_log (user_id, consent_type, metadata)
  VALUES (auth.uid(), COALESCE(p_consent_type, 'consent_changed'), COALESCE(p_metadata, '{}'::jsonb));
END;
$$;

REVOKE EXECUTE ON FUNCTION public.log_consent_event(text, jsonb) FROM anon;
GRANT EXECUTE ON FUNCTION public.log_consent_event(text, jsonb) TO authenticated;
