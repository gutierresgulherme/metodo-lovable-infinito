-- SAFE FIX: PERMISSIVE POLICIES ONLY (No Table Altering)
-- Run this in Supabase SQL Editor. It avoids the permission error you saw.

-- 1. Create/Update Bucket to be PUBLIC (Essential for anonymous access)
INSERT INTO storage.buckets (id, name, public)
VALUES ('site_uploads', 'site_uploads', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Drop potential conflicting policies (Clean Slate)
DROP POLICY IF EXISTS "SITE_UPLOADS_OPEN_ACCESS_POLICY" ON storage.objects;
DROP POLICY IF EXISTS "Public Insert site_uploads" ON storage.objects;
DROP POLICY IF EXISTS "Public Select site_uploads" ON storage.objects;
DROP POLICY IF EXISTS "Public Update site_uploads" ON storage.objects;

-- 3. Create the Master Policy for Public Access
-- This sends the "Invalid JWS" error away by allowing ANYONE to upload to this specific bucket.
CREATE POLICY "SITE_UPLOADS_OPEN_ACCESS_POLICY"
ON storage.objects
FOR ALL
TO public
USING (bucket_id = 'site_uploads')
WITH CHECK (bucket_id = 'site_uploads');
