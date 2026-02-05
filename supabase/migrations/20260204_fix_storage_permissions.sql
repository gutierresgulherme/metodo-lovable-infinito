
-- 1. Ensure 'site_uploads' bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('site_uploads', 'site_uploads', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Enable RLS on objects (it should be on by default, but ensuring)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Public Read Access (Anyone can view images)
DROP POLICY IF EXISTS "Public Read Access site_uploads" ON storage.objects;
CREATE POLICY "Public Read Access site_uploads"
ON storage.objects FOR SELECT
USING ( bucket_id = 'site_uploads' );

-- 4. Policy: Public/Anon Upload Access (Since we use supabasePublic client for uploads in ImageUpload.tsx)
-- WARNING: This allows anyone with the Anon key to upload to this bucket. 
-- In a stricter prod env, you'd restrict this, but to solve the "JWS" issues causing failures, we open it for the admin tool.
DROP POLICY IF EXISTS "Public Upload Access site_uploads" ON storage.objects;
CREATE POLICY "Public Upload Access site_uploads"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'site_uploads' );

-- 5. Policy: Allow Update/Delete for Authenticated Users (Admins)
DROP POLICY IF EXISTS "Admin Full Access site_uploads" ON storage.objects;
CREATE POLICY "Admin Full Access site_uploads"
ON storage.objects FOR ALL
USING ( bucket_id = 'site_uploads' AND auth.role() = 'authenticated' )
WITH CHECK ( bucket_id = 'site_uploads' AND auth.role() = 'authenticated' );

-- 6. Also fix 'videos' bucket just in case
UPDATE storage.buckets SET public = true WHERE id = 'videos';

DROP POLICY IF EXISTS "Public Read Access videos" ON storage.objects;
CREATE POLICY "Public Read Access videos"
ON storage.objects FOR SELECT
USING ( bucket_id = 'videos' );
