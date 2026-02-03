-- 1. CLEANUP RLS ON CRITICAL TABLES
ALTER TABLE public.vsl_video DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.banner_images DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_centers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.vsl_variants DISABLE ROW LEVEL SECURITY;

-- 2. CLEANUP RLS ON STORAGE
ALTER TABLE storage.buckets DISABLE ROW LEVEL SECURITY;
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- 3. ENSURE PERMISSIONS ARE EXPLICITLY GRANTED TO PUBLIC (LEADS) AND ANON (AUTH-LESS)
GRANT ALL ON TABLE public.vsl_video TO anon, authenticated, public, service_role;
GRANT ALL ON TABLE public.banner_images TO anon, authenticated, public, service_role;
GRANT ALL ON TABLE public.test_centers TO anon, authenticated, public, service_role;
GRANT ALL ON TABLE public.vsl_variants TO anon, authenticated, public, service_role;

GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, public, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, public, service_role;

-- 4. STORAGE BUCKET CONFIGURATION
-- Force create/update bucket with high limits
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('videos', 'videos', true, 524288000, '{video/mp4,video/webm,image/png,image/jpeg}')
ON CONFLICT (id) DO UPDATE SET 
    public = true, 
    file_size_limit = 524288000,
    allowed_mime_types = '{video/mp4,video/webm,image/png,image/jpeg}';

-- Grant storage permissions
GRANT ALL ON schema storage TO anon, authenticated, public, service_role;
GRANT ALL ON TABLE storage.buckets TO anon, authenticated, public, service_role;
GRANT ALL ON TABLE storage.objects TO anon, authenticated, public, service_role;

-- 5. SEED INITIAL VALUES IF MISSING (To ensure something is always there)
INSERT INTO public.vsl_video (page_key, video_url, created_at)
SELECT 'home_vsl', 'https://eidcxqxjmraargwhrdai.supabase.co/storage/v1/object/public/videos/vsl/home_vsl.mp4', NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.vsl_video WHERE page_key = 'home_vsl');

INSERT INTO public.vsl_video (page_key, video_url, created_at)
SELECT 'thankyou_upsell', 'https://eidcxqxjmraargwhrdai.supabase.co/storage/v1/object/public/videos/vsl/thankyou_upsell.mp4', NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.vsl_video WHERE page_key = 'thankyou_upsell');
