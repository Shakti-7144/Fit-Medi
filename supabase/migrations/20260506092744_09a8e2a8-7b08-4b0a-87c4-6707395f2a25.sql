-- Avatars: allow direct URL access via storage.objects metadata, but prevent broad listing
DROP POLICY IF EXISTS "Avatars publicly readable" ON storage.objects;
-- Render to direct URL works via public bucket flag without SELECT policy on objects.
-- We only allow owners to list their own avatar files.
CREATE POLICY "Avatars owner list" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);