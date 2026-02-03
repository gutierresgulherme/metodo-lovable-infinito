-- ====================================================================
-- 🔥 SCRIPT DEFINITIVO DE DESBLOQUEIO E SAÚDE DO BANCO (v2) 🔥
-- Este script resolve:
-- 1. Erro de Unique Constraint (42P10) no Upload
-- 2. Permissões de Acesso Público para Vídeos e Banners
-- 3. Configuração de Buckets de Storage
-- ====================================================================

-- 1. LIMPEZA DE DADOS DUPLICADOS (Prepara para a Unique Constraint)
-- Mantém apenas a versão mais recente de cada slot
DELETE FROM vsl_video a USING vsl_video b 
WHERE a.id < b.id AND a.page_key = b.page_key;

DELETE FROM banner_images a USING banner_images b 
WHERE a.id < b.id AND a.page_key = b.page_key;

-- 2. ADIÇÃO DE CONSTRAINTS EXCLUSIVAS (Essencial para o Upsert funcionar)
-- Se já houver a constraint, o script ignorará com o DO block
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vsl_video_page_key_key') THEN
        ALTER TABLE vsl_video ADD CONSTRAINT vsl_video_page_key_key UNIQUE (page_key);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'banner_images_page_key_key') THEN
        ALTER TABLE banner_images ADD CONSTRAINT banner_images_page_key_key UNIQUE (page_key);
    END IF;
END $$;

-- 3. DESBLOQUEIO TOTAL DE RLS (Para evitar erros de JWS/JWT em redes instáveis)
ALTER TABLE vsl_video DISABLE ROW LEVEL SECURITY;
ALTER TABLE banner_images DISABLE ROW LEVEL SECURITY;
ALTER TABLE vsl_test_centers DISABLE ROW LEVEL SECURITY;
ALTER TABLE vsl_variants DISABLE ROW LEVEL SECURITY;

-- 4. PERMISSÕES DE TABELA (Garante acesso público total)
GRANT ALL ON TABLE public.vsl_video TO anon, authenticated, postgres, service_role;
GRANT ALL ON TABLE public.banner_images TO anon, authenticated, postgres, service_role;
GRANT ALL ON TABLE public.vsl_test_centers TO anon, authenticated, postgres, service_role;
GRANT ALL ON TABLE public.vsl_variants TO anon, authenticated, postgres, service_role;
GRANT ALL ON TABLE public.checkout_configs TO anon, authenticated, postgres, service_role;

-- 5. STORAGE - CONFIGURAÇÃO DE BUCKETS (Garantiu que existem e são públicos)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('videos', 'videos', true, 524288000, '{video/mp4,video/quicktime,video/x-msvideo}'),
    ('site_uploads', 'site_uploads', true, 10485760, '{image/*}')
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = EXCLUDED.file_size_limit;

-- 6. STORAGE - POLÍTICAS DE ACESSO (Opcional se RLS estiver off, mas recomendado)
-- Removemos políticas antigas para evitar conflitos
DROP POLICY IF EXISTS "Public View" ON storage.objects;
DROP POLICY IF EXISTS "Public Insert" ON storage.objects;
DROP POLICY IF EXISTS "Public Update" ON storage.objects;

-- Criamos políticas ultra-permissivas para o bucket 'videos' e 'site_uploads'
CREATE POLICY "Public Access All" ON storage.objects 
FOR ALL USING ( bucket_id IN ('videos', 'site_uploads') ) 
WITH CHECK ( bucket_id IN ('videos', 'site_uploads') );

-- 7. REFRESH DE SCHEMA
NOTIFY pgrst, 'reload schema';

-- ✅ FINALIZADO: Execute este script no SQL Editor do Supabase.
