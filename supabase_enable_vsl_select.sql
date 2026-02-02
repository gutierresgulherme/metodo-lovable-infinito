-- Enable public read access for vsl_video table
ALTER TABLE vsl_video ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on vsl_video"
ON vsl_video
FOR SELECT
TO anon, authenticated
USING (true);

-- Just in case, grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.vsl_video TO anon, authenticated;
