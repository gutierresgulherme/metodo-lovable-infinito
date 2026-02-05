-- FIX PERMISSIONS FOR IMAGE UPLOADS (SITE_UPLOADS BUCKET)

-- 1. Create the bucket if it doesn't exist (safety)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('site_uploads', 'site_uploads', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public Insert site_uploads" ON storage.objects;
DROP POLICY IF EXISTS "Public Select site_uploads" ON storage.objects;
DROP POLICY IF EXISTS "Public Update site_uploads" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete site_uploads" ON storage.objects;

-- 3. Create Permissive Policies (Allowing fallback mechanism to work)
-- This allows any user (even without valid token) to read/write to this specific bucket
-- Essential for fixing the "Invalid Compact JWS" error loop.

CREATE POLICY "Public Insert site_uploads"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'site_uploads');

CREATE POLICY "Public Select site_uploads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'site_uploads');

CREATE POLICY "Public Update site_uploads"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'site_uploads');

CREATE POLICY "Public Delete site_uploads"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'site_uploads');
