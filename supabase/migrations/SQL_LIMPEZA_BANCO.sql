-- ⚠️ LIMPEZA DO BANCO DE DADOS (VSL TESTER) ⚠️
-- Copie e cole este código no seu SQL Editor do Supabase

-- 1. Remover tabelas do VSL Tester (Limpeza de "lixeira" do banco)
DROP TABLE IF EXISTS public.vsl_settings CASCADE;
DROP TABLE IF EXISTS public.vsl_test_centers CASCADE;
DROP TABLE IF EXISTS public.vsl_variants CASCADE;

-- 2. Remover colunas de variantes das tabelas de analytics (Opcional, mas recomendado para manter limpo)
ALTER TABLE public.button_clicks DROP COLUMN IF EXISTS vsl_id;
ALTER TABLE public.button_clicks DROP COLUMN IF EXISTS vsl_slug;
ALTER TABLE public.page_sessions DROP COLUMN IF EXISTS vsl_id;
ALTER TABLE public.page_sessions DROP COLUMN IF EXISTS vsl_slug;
ALTER TABLE public.video_watch_events DROP COLUMN IF EXISTS vsl_id;

-- 3. (OPCIONAL) Limpar dados antigos das mesas de analytics se desejar recomeçar do zero
-- TRUNCATE public.button_clicks;
-- TRUNCATE public.page_sessions;
-- TRUNCATE public.video_watch_events;
