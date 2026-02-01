-- Migration: VSL Variants for A/B Testing
-- Created: 2026-02-01

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
) ON CONFLICT (slug) DO NOTHING;
