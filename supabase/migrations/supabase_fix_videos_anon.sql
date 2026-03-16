
-- URGENT: FIX VIDEO STORAGE POLICY FOR ANON
-- Execute this in SQL Editor to fix 'new row violates row-level security policy' for uploads

-- 1. Ensure policies exist specifically for ANON users on the 'videos' bucket
DROP POLICY IF EXISTS "Anon Insert Videos" ON storage.objects;
DROP POLICY IF EXISTS "Anon Select Videos" ON storage.objects;
DROP POLICY IF EXISTS "Anon Update Videos" ON storage.objects;
DROP POLICY IF EXISTS "Anon Delete Videos" ON storage.objects;
DROP POLICY IF EXISTS "Allow Public Video Uploads" ON storage.objects;

-- 2. CREATE PERMISSIVE POLICIES FOR 'videos' BUCKET
-- Allow Anonymous users to UPLOAD
CREATE POLICY "Anon Insert Videos"
ON storage.objects FOR INSERT
TO anon, authenticated, public
WITH CHECK (bucket_id = 'videos');

-- Allow Anonymous users to VIEW
CREATE POLICY "Anon Select Videos"
ON storage.objects FOR SELECT
TO anon, authenticated, public
USING (bucket_id = 'videos');

-- Allow Anonymous users to UPDATE
CREATE POLICY "Anon Update Videos"
ON storage.objects FOR UPDATE
TO anon, authenticated, public
USING (bucket_id = 'videos');

-- Allow Anonymous users to DELETE
CREATE POLICY "Anon Delete Videos"
ON storage.objects FOR DELETE
TO anon, authenticated, public
USING (bucket_id = 'videos');
