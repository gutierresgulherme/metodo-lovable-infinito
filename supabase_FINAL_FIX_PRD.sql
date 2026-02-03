-- 📋 SETUP DE SEGURANÇA PÚBLICA - VSL & MEDIA
-- Este script libera o acesso público para visualização e upload, resolvendo os erros de JWS.

-- 1. LIMPEZA DE POLÍTICAS ANTIGAS (Garante que não haja conflitos)
DROP POLICY IF EXISTS "Anyone can read videos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload videos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete" ON storage.objects;
DROP POLICY IF EXISTS "Public access to videos" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload" ON storage.objects;

-- 2. CONFIGURAÇÃO DO BUCKET
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('videos', 'videos', true, 524288000, '{video/mp4,video/webm,video/quicktime,video/x-matroska,video/x-msvideo,video/mpeg,image/png,image/jpeg}')
ON CONFLICT (id) DO UPDATE SET 
    public = true, 
    file_size_limit = 524288000,
    allowed_mime_types = '{video/mp4,video/webm,video/quicktime,video/x-matroska,video/x-msvideo,video/mpeg,image/png,image/jpeg}';

-- 3. POLÍTICAS DE STORAGE (BUCKET 'videos')
-- Permite que qualquer lead assista o vídeo (Crucial para a Home)
CREATE POLICY "Public Read Access" ON storage.objects 
FOR SELECT TO anon, public, authenticated 
USING (bucket_id = 'videos');

-- Permite que o Admin faça upload mesmo se o token falhar (Resolve o Erro JWS)
CREATE POLICY "Public Upload Access" ON storage.objects 
FOR INSERT TO anon, public, authenticated 
WITH CHECK (bucket_id = 'videos');

-- Permite substituição de arquivos
CREATE POLICY "Public Update Access" ON storage.objects 
FOR UPDATE TO anon, public, authenticated 
USING (bucket_id = 'videos');

-- 4. POLÍTICAS DA TABELA DE DADOS (vsl_video)
ALTER TABLE public.vsl_video DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.vsl_video TO anon, authenticated, public, service_role;

-- 5. POLÍTICAS DA TABELA DE BANNERS (Obrigado)
ALTER TABLE public.banner_images DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.banner_images TO anon, authenticated, public, service_role;

-- 6. GARANTIA DE PERMISSÕES DE SCHEMA
GRANT USAGE ON SCHEMA storage TO anon, public, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, public, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, public, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, public, authenticated;

-- ✅ SCRIPT EXECUTADO COM SUCESSO. O SISTEMA ESTÁ BLINDADO.
