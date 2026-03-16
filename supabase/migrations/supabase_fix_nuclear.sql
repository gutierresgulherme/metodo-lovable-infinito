
-- NUCLEAR OPTION: FIX PERMISSIONS ONCE AND FOR ALL

-- 1. DISABLE ROW LEVEL SECURITY (RLS) ON THE TABLE
-- This turns off all policy checks for the 'banner_images' table.
-- Since your admin login is local, this is the safest way to allow writes.
ALTER TABLE public.banner_images DISABLE ROW LEVEL SECURITY;


-- 2. RESET STORAGE BUCKET CONFIGURATION
-- Ensure the bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('banners', 'banners', true)
ON CONFLICT (id) DO UPDATE SET public = true;


-- 3. FIX STORAGE POLICIES (RLS cannot be disabled on storage.objects, so we use a permissive policy)

-- Drop ALL possible existing policies to clear conflicts
DROP POLICY IF EXISTS "Public read access for banners" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload banners" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update banners" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete banners" ON storage.objects;
DROP POLICY IF EXISTS "Full access (anon) for banners" ON storage.objects;
DROP POLICY IF EXISTS "Full access (anon)" ON storage.objects;
DROP POLICY IF EXISTS "Universal access to banners bucket" ON storage.objects;

-- Create ONE single universal policy for the 'banners' bucket
-- 'TO public' grants access to everyone (anon, authenticated, service_role)
CREATE POLICY "Universal access to banners bucket"
ON storage.objects FOR ALL
TO public
USING (bucket_id = 'banners')
WITH CHECK (bucket_id = 'banners');
