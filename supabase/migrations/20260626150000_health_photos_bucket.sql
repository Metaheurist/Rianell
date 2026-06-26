-- Plan 16 VM11 — private health photo attachments bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('health-photos', 'health-photos', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "health_photos_select_own" ON storage.objects;
CREATE POLICY "health_photos_select_own"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'health-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "health_photos_insert_own" ON storage.objects;
CREATE POLICY "health_photos_insert_own"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'health-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "health_photos_delete_own" ON storage.objects;
CREATE POLICY "health_photos_delete_own"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'health-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
