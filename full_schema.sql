-- ⚠️ WARNING: THIS SCRIPT WILL WIPE ALL DATA IN THE PUBLIC SCHEMA ⚠️
-- Use this only if you want to completely reset the database to the "Lovable Infinito" state.

DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===========================================
-- MIGRATION: 20251108214512_remix_batch_1_migrations.sql
-- ===========================================

-- Create payments table to track Mercado Pago payments
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id TEXT NOT NULL UNIQUE,
  payer_email TEXT NOT NULL,
  status TEXT NOT NULL,
  amount DECIMAL(10, 2),
  plan_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own payments
CREATE POLICY "Users can view their own payments" 
ON public.payments 
FOR SELECT 
USING (payer_email = auth.jwt() ->> 'email');

-- Create policy for service role to insert/update payments (webhook)
CREATE POLICY "Service role can insert payments" 
ON public.payments 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Service role can update payments" 
ON public.payments 
FOR UPDATE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.update_payments_updated_at();

-- Create index for faster email lookups
CREATE INDEX idx_payments_email ON public.payments(payer_email);
CREATE INDEX idx_payments_status ON public.payments(status);

-- ===========================================
-- MIGRATION: 20251113064951_564d84ff-068e-41c6-819d-b7bd40d98580.sql
-- ===========================================

-- Add explicit DELETE policy to prevent payment record deletion
CREATE POLICY "Prevent payment deletion"
ON payments
FOR DELETE
TO authenticated
USING (false);

-- Also add policy for anon role to be safe
CREATE POLICY "Prevent payment deletion anon"
ON payments
FOR DELETE
TO anon
USING (false);

-- ===========================================
-- MIGRATION: 20251116015108_cb0ae946-9130-499d-9076-4eb3dcf29742.sql
-- ===========================================

-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policy for user_roles - users can view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create vsl_video table
CREATE TABLE public.vsl_video (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on vsl_video
ALTER TABLE public.vsl_video ENABLE ROW LEVEL SECURITY;

-- RLS policies for vsl_video
CREATE POLICY "Anyone can view vsl_video"
ON public.vsl_video
FOR SELECT
TO authenticated, anon
USING (true);

-- Admins can insert vsl_video policy will be created/adjusted later

-- Create storage bucket for videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('videos', 'videos', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for videos bucket
CREATE POLICY "Anyone can view videos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'videos');

CREATE POLICY "Admins can upload videos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'videos' 
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can delete videos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'videos' 
  AND public.has_role(auth.uid(), 'admin')
);

-- ===========================================
-- MIGRATION: 20251116022211_9e469b51-3443-4620-a18c-870509cdabfd.sql
-- ===========================================

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

-- ===========================================
-- MIGRATION: 20251116025206_ac8cf1da-40cc-430d-ae64-e97acbde9791.sql
-- ===========================================

-- Remove policies if they exist (to avoid errors if run multiple times or if conflicts exist from previous steps)
-- Note: In a clean schema they won't exist but we'll include the logic
-- DROP POLICY IF EXISTS "Admins can delete vsl_video" ON vsl_video;
-- DROP POLICY IF EXISTS "Admins can insert vsl_video" ON vsl_video;

-- Create public policies for vsl_video
CREATE POLICY "Anyone can insert vsl_video"
ON vsl_video
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can delete vsl_video"
ON vsl_video
FOR DELETE
USING (true);

CREATE POLICY "Anyone can update vsl_video"
ON vsl_video
FOR UPDATE
USING (true)
WITH CHECK (true);

-- ===========================================
-- MIGRATION: 20260119055713_26160231-4854-4b31-aaba-9e4cc987273f.sql
-- ===========================================

-- Add page_key column to identify which page/section the video belongs to
ALTER TABLE public.vsl_video ADD COLUMN IF NOT EXISTS page_key TEXT NOT NULL DEFAULT 'home_vsl';

-- Add unique constraint to ensure one video per page
ALTER TABLE public.vsl_video ADD CONSTRAINT unique_page_key UNIQUE (page_key);

-- Update existing video to home_vsl
UPDATE public.vsl_video SET page_key = 'home_vsl' WHERE page_key IS NULL OR page_key = '';

-- ===========================================
-- MIGRATION: 20260119060419_ed32dfc0-f112-48bf-a1dd-8b2d4b566a94.sql
-- ===========================================

-- Create function to check if user is admin (using existing role)
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin'
  )
$$;

-- Create function to check if user is content manager (using moderator role for now)
CREATE OR REPLACE FUNCTION public.is_content_manager(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'moderator'
  )
$$;

-- ===========================================
-- MIGRATION: 20260119063659_48cee6dc-2acc-432c-a7ee-c0dd805a76ba.sql
-- ===========================================

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

-- Create table for banner images
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

-- ===========================================
-- MIGRATION: 20260201023300_create_analytics_tables.sql
-- ===========================================

-- 1. Rastreamento de cliques em botões
CREATE TABLE public.button_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  button_id TEXT NOT NULL,
  button_label TEXT,
  page_url TEXT,
  session_id TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Eventos de visualização de vídeo
CREATE TABLE public.video_watch_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  video_id TEXT DEFAULT 'vsl_main',
  event_type TEXT NOT NULL,
  current_time_seconds INTEGER,
  duration_seconds INTEGER,
  percent_watched INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Sessões de página
CREATE TABLE public.page_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL UNIQUE,
  page_url TEXT,
  referrer TEXT,
  user_agent TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  started_at TIMESTAMPTZ DEFAULT now(),
  last_activity_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.button_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_watch_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_sessions ENABLE ROW LEVEL SECURITY;

-- Policies for button_clicks
CREATE POLICY "Anyone can insert button_clicks"
ON public.button_clicks FOR INSERT TO anon, authenticated
WITH CHECK (true);

-- NOTE: This policy relies on user_roles, which is created above.
CREATE POLICY "Admins can view button_clicks"
ON public.button_clicks FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Policies for video_watch_events
CREATE POLICY "Anyone can insert video_watch_events"
ON public.video_watch_events FOR INSERT TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins can view video_watch_events"
ON public.video_watch_events FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Policies for page_sessions
CREATE POLICY "Anyone can insert page_sessions"
ON public.page_sessions FOR INSERT TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Anyone can update own session"
ON public.page_sessions FOR UPDATE TO anon, authenticated
USING (true);

CREATE POLICY "Admins can view page_sessions"
ON public.page_sessions FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Indexes for performance
CREATE INDEX idx_button_clicks_button_id ON public.button_clicks(button_id);
CREATE INDEX idx_button_clicks_created_at ON public.button_clicks(created_at);
CREATE INDEX idx_button_clicks_session_id ON public.button_clicks(session_id);
CREATE INDEX idx_video_watch_session ON public.video_watch_events(session_id);
CREATE INDEX idx_video_watch_created_at ON public.video_watch_events(created_at);
CREATE INDEX idx_page_sessions_started_at ON public.page_sessions(started_at);

-- ===========================================
-- MIGRATION: 20260201031500_vsl_variants.sql
-- ===========================================

-- 1. Tabela de variantes de VSL
CREATE TABLE IF NOT EXISTS public.vsl_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  book_reference TEXT,
  description TEXT,
  headline TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'winner')),
  is_control BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Adicionar vsl_id nas tabelas existentes
ALTER TABLE public.button_clicks ADD COLUMN IF NOT EXISTS vsl_id UUID REFERENCES public.vsl_variants(id);
ALTER TABLE public.page_sessions ADD COLUMN IF NOT EXISTS vsl_id UUID REFERENCES public.vsl_variants(id);
ALTER TABLE public.video_watch_events ADD COLUMN IF NOT EXISTS vsl_id UUID REFERENCES public.vsl_variants(id);

-- 3. Índices para performance
CREATE INDEX IF NOT EXISTS idx_button_clicks_vsl_id ON public.button_clicks(vsl_id);
CREATE INDEX IF NOT EXISTS idx_page_sessions_vsl_id ON public.page_sessions(vsl_id);
CREATE INDEX IF NOT EXISTS idx_video_watch_vsl_id ON public.video_watch_events(vsl_id);
CREATE INDEX IF NOT EXISTS idx_vsl_variants_slug ON public.vsl_variants(slug);
CREATE INDEX IF NOT EXISTS idx_vsl_variants_status ON public.vsl_variants(status);

-- 4. Enable RLS
ALTER TABLE public.vsl_variants ENABLE ROW LEVEL SECURITY;

-- 5. Policies para vsl_variants
CREATE POLICY "Anyone can view active vsl_variants" 
ON public.vsl_variants FOR SELECT TO anon, authenticated
USING (status = 'active' OR status = 'winner');

CREATE POLICY "Admins can manage vsl_variants"
ON public.vsl_variants FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 6. Inserir VSL padrão (controle)
INSERT INTO public.vsl_variants (name, slug, book_reference, headline, status, is_control)
VALUES (
  'VSL Original (Controle)',
  'default',
  'Original',
  'VOCÊ AINDA PAGA PRA USAR O LOVABLE?',
  'active',
  true
-- ===========================================
-- MIGRATION: 20260201223000_analytics_and_config.sql
-- ===========================================

-- 1. Checkout Configs Table
CREATE TABLE IF NOT EXISTS public.checkout_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  url TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Ensure RLS on all tables
ALTER TABLE public.checkout_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view configs" ON public.checkout_configs FOR SELECT USING (true);
CREATE POLICY "Anyone can manage configs" ON public.checkout_configs FOR ALL USING (true);

-- 3. VSL Variant Enhancements
ALTER TABLE public.vsl_variants ADD COLUMN IF NOT EXISTS video_url TEXT;

-- 4. VSL Settings for Domain Mapping
CREATE TABLE IF NOT EXISTS public.vsl_settings (
  region TEXT PRIMARY KEY, -- 'BR' or 'USA'
  vsl_slug TEXT REFERENCES public.vsl_variants(slug) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. RLS for VSL Settings
ALTER TABLE public.vsl_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view vsl_settings" ON public.vsl_settings FOR SELECT USING (true);
CREATE POLICY "Anyone can update vsl_settings" ON public.vsl_settings FOR ALL USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_checkout_configs_key ON public.checkout_configs(key);

-- Pre-fill default links
INSERT INTO public.checkout_configs (key, url)
VALUES 
  ('br_prata', 'https://go.pepperpay.com.br/lonsw'),
  ('br_gold', 'https://go.pepperpay.com.br/ukrg2'),
  ('usa_prata', 'https://go.pepperpay.com.br/lonsw'),
  ('usa_gold', 'https://go.pepperpay.com.br/ukrg2')
ON CONFLICT (key) DO UPDATE SET url = EXCLUDED.url;

-- Pre-fill VSL settings
INSERT INTO public.vsl_settings (region, vsl_slug)
VALUES 
  ('BR', 'default'),
  ('USA', 'default')
ON CONFLICT (region) DO NOTHING;

-- 6. Performance Indexes (Supabase Recommendations)
-- Optimized for analytics and regional filtering
CREATE INDEX IF NOT EXISTS idx_button_clicks_vsl_id_created_at ON public.button_clicks (vsl_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_button_clicks_composite_metrics ON public.button_clicks (button_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_sessions_vsl_id_started_at ON public.page_sessions (vsl_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_vsl_settings_region ON public.vsl_settings (region);

