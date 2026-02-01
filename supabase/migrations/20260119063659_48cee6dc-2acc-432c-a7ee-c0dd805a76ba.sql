-- Create storage bucket for banner images
INSERT INTO storage.buckets (id, name, public)
VALUES ('banners', 'banners', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to banners
CREATE POLICY "Public read access for banners"
ON storage.objects FOR SELECT
USING (bucket_id = 'banners');

-- Allow authenticated users to upload/update banners
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

-- Create table for banner images (similar to vsl_video)
CREATE TABLE IF NOT EXISTS public.banner_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_key TEXT NOT NULL DEFAULT 'default',
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.banner_images ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Public read access for banner_images"
ON public.banner_images FOR SELECT
USING (true);

-- Allow authenticated users to manage banners
CREATE POLICY "Authenticated users can insert banner_images"
ON public.banner_images FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update banner_images"
ON public.banner_images FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete banner_images"
ON public.banner_images FOR DELETE
TO authenticated
USING (true);