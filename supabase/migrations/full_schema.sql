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



-- Create index for faster email lookups
CREATE INDEX idx_payments_email ON public.payments(payer_email);
CREATE INDEX idx_payments_status ON public.payments(status);

-- ===========================================
-- MIGRATION: 20251113064951_564d84ff-068e-41c6-819d-b7bd40d98580.sql
-- ===========================================



-- Also add policy for anon role to be safe


-- NOTE: This policy relies on user_roles, which is created above.


-- Policies for video_watch_events




-- Policies for page_sessions






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




-- 3. Índices para performance
CREATE INDEX IF NOT EXISTS idx_button_clicks_vsl_id ON public.button_clicks(vsl_id);
CREATE INDEX IF NOT EXISTS idx_page_sessions_vsl_id ON public.page_sessions(vsl_id);
CREATE INDEX IF NOT EXISTS idx_video_watch_vsl_id ON public.video_watch_events(vsl_id);
CREATE INDEX IF NOT EXISTS idx_vsl_variants_slug ON public.vsl_variants(slug);
CREATE INDEX IF NOT EXISTS idx_vsl_variants_status ON public.vsl_variants(status);

-- 4. Enable RLS
ALTER TABLE public.vsl_variants ENABLE ROW LEVEL SECURITY;

-- 5. Policies para vsl_variants

CREATE INDEX IF NOT EXISTS idx_button_clicks_composite_metrics ON public.button_clicks (button_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_sessions_vsl_id_started_at ON public.page_sessions (vsl_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_vsl_settings_region ON public.vsl_settings (region);



