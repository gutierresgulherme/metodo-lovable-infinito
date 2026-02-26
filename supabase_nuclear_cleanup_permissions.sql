-- ☢️ SCRIPT NUCLEAR DE LIMPEZA E PERMISSÕES ☢️
-- Rode este script no SQL EDITOR do Supabase se o seu site parar de funcionar por causa de cota.

-- 1. DESABILITAR RLS TEMPORARIAMENTE (Para permitir que o botão do Dashboard limpe os dados)
ALTER TABLE public.button_clicks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_watch_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_sessions DISABLE ROW LEVEL SECURITY;

-- 2. CONCEDER PERMISSÕES TOTAIS (Garante que os scripts de limpeza funcionem)
GRANT ALL ON TABLE public.button_clicks TO anon, authenticated, postgres, service_role;
GRANT ALL ON TABLE public.video_watch_events TO anon, authenticated, postgres, service_role;
GRANT ALL ON TABLE public.page_sessions TO anon, authenticated, postgres, service_role;

-- 3. LIMPEZA IMEDIATA (Libera espaço lógico agora)
DELETE FROM public.button_clicks WHERE created_at < NOW() - INTERVAL '24 hours';
DELETE FROM public.video_watch_events WHERE created_at < NOW() - INTERVAL '24 hours';
DELETE FROM public.page_sessions WHERE started_at < NOW() - INTERVAL '24 hours';

-- 4. COMPACTAÇÃO (Libera o espaço físico no disco - O MAIS IMPORTANTE)
-- ATENÇÃO: Se as tabelas forem muito grandes, isso pode demorar alguns segundos.
VACUUM FULL public.button_clicks;
VACUUM FULL public.video_watch_events;
VACUUM FULL public.page_sessions;

-- 5. STORAGE (DICA):
-- Se o erro persistir, vá no Storage -> Bucket 'videos' e apague vídeos de teste antigos.
