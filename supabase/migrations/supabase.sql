
-- 1. DROP EXISTING POLICIES (Storage)
DROP POLICY IF EXISTS "Public read access for banners" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload banners" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update banners" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete banners" ON storage.objects;

-- 2. RE-CREATE POLICIES (Storage)
-- Allow public READ access to ANY object in 'banners' bucket
CREATE POLICY "Public read access for banners"
ON storage.objects FOR SELECT
USING (bucket_id = 'banners');

-- Allow authenticated users to INSERT (upload) to 'banners'
CREATE POLICY "Authenticated users can upload banners"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'banners');

-- Allow authenticated users to UPDATE files in 'banners'
CREATE POLICY "Authenticated users can update banners"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'banners');

-- Allow authenticated users to DELETE files in 'banners'
CREATE POLICY "Authenticated users can delete banners"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'banners');


-- 3. DROP EXISTING POLICIES (Table: banner_images)
DROP POLICY IF EXISTS "Public read access for banner_images" ON public.banner_images;
DROP POLICY IF EXISTS "Authenticated users can insert banner_images" ON public.banner_images;
DROP POLICY IF EXISTS "Authenticated users can update banner_images" ON public.banner_images;
DROP POLICY IF EXISTS "Authenticated users can delete banner_images" ON public.banner_images;

-- 4. RE-CREATE POLICIES (Table: banner_images)
-- Allow public READ
CREATE POLICY "Public read access for banner_images"
ON public.banner_images FOR SELECT
USING (true);

-- Allow authenticated users ALL operations (Insert, Update, Delete)
CREATE POLICY "Authenticated users full access banner_images"
ON public.banner_images FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
