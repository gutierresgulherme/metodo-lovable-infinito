
-- 1. Ensure vsl_video table is readable by everyone
ALTER TABLE vsl_video DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE vsl_video TO anon, authenticated, postgres, service_role;

-- 2. Ensure vsl_variants table is readable by everyone
ALTER TABLE vsl_variants DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE vsl_variants TO anon, authenticated, postgres, service_role;

-- 3. Ensure test centers are readable
ALTER TABLE vsl_test_centers DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE vsl_test_centers TO anon, authenticated, postgres, service_role;

-- 4. Fix page_sessions and button_clicks columns
ALTER TABLE page_sessions ADD COLUMN IF NOT EXISTS vsl_slug TEXT;
ALTER TABLE button_clicks ADD COLUMN IF NOT EXISTS vsl_slug TEXT;
GRANT ALL ON TABLE page_sessions TO anon, authenticated, postgres, service_role;
GRANT ALL ON TABLE button_clicks TO anon, authenticated, postgres, service_role;
