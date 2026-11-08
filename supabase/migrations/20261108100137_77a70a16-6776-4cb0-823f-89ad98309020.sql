CREATE POLICY hiring_media_read ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'hiring-media');
CREATE POLICY hiring_media_insert ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'hiring-media' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY hiring_media_update ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'hiring-media' AND public.has_role(auth.uid(), 'admin')) WITH CHECK (bucket_id = 'hiring-media' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY hiring_media_delete ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'hiring-media' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY hiring_media_insert_guard ON storage.objects AS RESTRICTIVE FOR INSERT TO anon, authenticated WITH CHECK (bucket_id <> 'hiring-media' OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY hiring_media_update_guard ON storage.objects AS RESTRICTIVE FOR UPDATE TO anon, authenticated USING (bucket_id <> 'hiring-media' OR public.has_role(auth.uid(), 'admin')) WITH CHECK (bucket_id <> 'hiring-media' OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY hiring_media_delete_guard ON storage.objects AS RESTRICTIVE FOR DELETE TO anon, authenticated USING (bucket_id <> 'hiring-media' OR public.has_role(auth.uid(), 'admin'));
