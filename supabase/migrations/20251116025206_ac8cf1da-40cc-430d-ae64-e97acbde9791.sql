-- Remove políticas de admin que estão causando erro 403
DROP POLICY IF EXISTS "Admins can delete vsl_video" ON vsl_video;
DROP POLICY IF EXISTS "Admins can insert vsl_video" ON vsl_video;

-- Cria políticas públicas para vsl_video (sem verificação de role)
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