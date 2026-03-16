
-- FIX STORAGE PERMISSIONS FOR ANONYMOUS USERS (Local Admin)

-- 1. Ensure bucket is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('banners', 'banners', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Drop ALL potential conflicting policies on storage.objects
DROP POLICY IF EXISTS "Universal access to banners bucket" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for banners" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload banners" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update banners" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete banners" ON storage.objects;
DROP POLICY IF EXISTS "Full access (anon) for banners" ON storage.objects;
DROP POLICY IF EXISTS "Anon Insert Banners" ON storage.objects;
DROP POLICY IF EXISTS "Anon Select Banners" ON storage.objects;
DROP POLICY IF EXISTS "Anon Update Banners" ON storage.objects;
DROP POLICY IF EXISTS "Anon Delete Banners" ON storage.objects;

-- 3. Create EXPLICIT policies for ANONYMOUS users
-- We create separate policies for each operation to ensure maximum compatibility

-- Allow Uploads (Insert)
CREATE POLICY "Anon Insert Banners"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'banners');

-- Allow Viewing (Select)
CREATE POLICY "Anon Select Banners"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'banners');

-- Allow Updates
CREATE POLICY "Anon Update Banners"
ON storage.objects FOR UPDATE
TO anon, authenticated
USING (bucket_id = 'banners');

-- Allow Deletion
CREATE POLICY "Anon Delete Banners"
ON storage.objects FOR DELETE
TO anon, authenticated
USING (bucket_id = 'banners');
