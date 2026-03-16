
-- URGENT FIX: Allow 'anon' (unauthenticated) access because the Admin Login is local-only
-- The current Admin system does NOT log in to Supabase Auth, so the user is technically 'anon'.

-- 1. TABLE: banner_images
DROP POLICY IF EXISTS "Authenticated users full access banner_images" ON public.banner_images;
DROP POLICY IF EXISTS "Public read access for banner_images" ON public.banner_images;

-- Allow ANYONE (including the admin who is technically 'anon') to do ANYTHING
-- Note: This relies on the client-side app to hide the admin UI.
CREATE POLICY "Full access (anon)"
ON public.banner_images FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);


-- 2. STORAGE: banners
DROP POLICY IF EXISTS "Public read access for banners" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload banners" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update banners" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete banners" ON storage.objects;

-- Allow ANYONE (including the admin who is technically 'anon') to do ANYTHING on 'banners' bucket
CREATE POLICY "Full access (anon) for banners"
ON storage.objects FOR ALL
TO anon, authenticated
USING (bucket_id = 'banners')
WITH CHECK (bucket_id = 'banners');
