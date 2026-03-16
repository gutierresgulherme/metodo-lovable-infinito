
-- STRATEGY: Create a NEW bucket to bypass existing conflicts
-- 1. Create 'site_uploads' bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('site_uploads', 'site_uploads', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Create Policy for the new bucket
-- This policy allows EVERYONE (Public/Anon) to Read, Write, and Delete in this specific bucket
DROP POLICY IF EXISTS "Allow Public Site Uploads" ON storage.objects;

CREATE POLICY "Allow Public Site Uploads"
ON storage.objects FOR ALL
TO public
USING (bucket_id = 'site_uploads')
WITH CHECK (bucket_id = 'site_uploads');
