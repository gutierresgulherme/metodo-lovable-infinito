
-- 1. Create the table 'banner_images' if it doesn't exist
CREATE TABLE IF NOT EXISTS public.banner_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_key TEXT NOT NULL,
    image_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable RLS on the table
ALTER TABLE public.banner_images ENABLE ROW LEVEL SECURITY;

-- 3. Create/Ensure the 'banners' storage bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('banners', 'banners', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 4. POLICIES FOR TABLE 'banner_images'
-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public read access for banner_images" ON public.banner_images;
DROP POLICY IF EXISTS "Authenticated users can insert banner_images" ON public.banner_images;
DROP POLICY IF EXISTS "Authenticated users can update banner_images" ON public.banner_images;
DROP POLICY IF EXISTS "Authenticated users can delete banner_images" ON public.banner_images;
DROP POLICY IF EXISTS "Authenticated users full access banner_images" ON public.banner_images;

-- Create comprehensive policies
CREATE POLICY "Public read access for banner_images"
ON public.banner_images FOR SELECT
USING (true);

CREATE POLICY "Authenticated users full access banner_images"
ON public.banner_images FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 5. POLICIES FOR STORAGE 'banners'
-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public read access for banners" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload banners" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update banners" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete banners" ON storage.objects;

-- Create comprehensive policies
CREATE POLICY "Public read access for banners"
ON storage.objects FOR SELECT
USING (bucket_id = 'banners');

CREATE POLICY "Authenticated users can upload banners"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'banners');

CREATE POLICY "Authenticated users can update banners"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'banners');

CREATE POLICY "Authenticated users can delete banners"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'banners');
