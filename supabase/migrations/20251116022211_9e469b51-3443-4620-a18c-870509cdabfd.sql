-- Create storage policies for videos bucket to allow uploads
-- This fixes the "new row violates row-level security policy" error

-- Allow anyone to upload to the vsl folder
CREATE POLICY "Allow public uploads to vsl folder"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'videos' AND (storage.foldername(name))[1] = 'vsl');

-- Allow anyone to update files in the vsl folder
CREATE POLICY "Allow public updates to vsl folder"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'videos' AND (storage.foldername(name))[1] = 'vsl');

-- Allow anyone to delete files in the vsl folder
CREATE POLICY "Allow public deletes from vsl folder"
ON storage.objects
FOR DELETE
USING (bucket_id = 'videos' AND (storage.foldername(name))[1] = 'vsl');

-- Allow anyone to read files from the videos bucket (already public but adding explicit policy)
CREATE POLICY "Allow public reads from videos bucket"
ON storage.objects
FOR SELECT
USING (bucket_id = 'videos');