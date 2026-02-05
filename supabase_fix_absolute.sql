-- 🔥 CORREÇÃO FINAL E ABSOLUTA (MÍDIAS) 🔥
-- Este script faz tudo: Cria buckets, desativa restrições e libera geral.

-- 1. Garante que os Buckets existam e sejam PÚBLICOS
INSERT INTO storage.buckets (id, name, public) VALUES ('site_uploads', 'site_uploads', true) ON CONFLICT (id) DO UPDATE SET public = true;
INSERT INTO storage.buckets (id, name, public) VALUES ('videos', 'videos', true) ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Limpa todas as regras antigas (faxina completa)
DROP POLICY IF EXISTS "Liberar Geral site_uploads" ON storage.objects;
DROP POLICY IF EXISTS "Liberar Geral videos" ON storage.objects;
DROP POLICY IF EXISTS "Public Insert site_uploads" ON storage.objects;
DROP POLICY IF EXISTS "SITE_UPLOADS_OPEN_ACCESS_POLICY" ON storage.objects;

-- 3. Cria a Regra de Ouro: LIBERAR TUDO PARA TODOS (Public e Anon)
-- Isso permite upload sem login (corrige erro JWS) e leitura sem login (corrige imagem quebrada)

CREATE POLICY "Liberar Geral site_uploads"
ON storage.objects FOR ALL TO public
USING (bucket_id = 'site_uploads')
WITH CHECK (bucket_id = 'site_uploads');

CREATE POLICY "Liberar Geral videos"
ON storage.objects FOR ALL TO public
USING (bucket_id = 'videos')
WITH CHECK (bucket_id = 'videos');

-- 4. Garante que RLS está ATIVO (necessário para as policies funcionarem)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
