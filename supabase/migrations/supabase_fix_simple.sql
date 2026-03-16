-- SIMPLIFIED FIX FOR STORAGE PERMISSIONS
-- Run this directly in Supabase SQL Editor

-- 1. Create Bucket (Safe Insert)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('site_uploads', 'site_uploads', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Drop Old Policies (Safe Drops)
DROP POLICY IF EXISTS "Public Insert site_uploads" ON storage.objects;
DROP POLICY IF EXISTS "Public Select site_uploads" ON storage.objects;
DROP POLICY IF EXISTS "Public Update site_uploads" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete site_uploads" ON storage.objects;

-- 3. Create New Permissive Policies
-- These grant FULL access to the 'site_uploads' bucket for everyone (public)
-- This fixes the "Invalid JWS" blocking anonymous uploads

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
