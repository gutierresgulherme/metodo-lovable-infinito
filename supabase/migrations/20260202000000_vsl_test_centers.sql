-- Create or update vsl_start_centers table
CREATE TABLE IF NOT EXISTS vsl_test_centers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  domain TEXT NOT NULL UNIQUE,
  currency TEXT DEFAULT 'BRL',
  bma_name TEXT,
  status TEXT DEFAULT 'active',
  vsl_slug TEXT, -- Keeping for compatibility
  active_vsl_id UUID, -- New reference field
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create or update vsl_variants table
CREATE TABLE IF NOT EXISTS vsl_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  book_reference TEXT, -- previously book_source
  headline TEXT, -- previously hero_headline
  hero_subheadline TEXT,
  video_url TEXT,
  benefits_copy TEXT,
  method_explanation_copy TEXT,
  pricing_copy TEXT,
  guarantee_copy TEXT,
  faq_copy JSONB,
  status TEXT DEFAULT 'draft',
  is_control BOOLEAN DEFAULT false,
  is_template BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Add foreign key if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_test_center_active_vsl'
    ) THEN
        ALTER TABLE vsl_test_centers 
        ADD CONSTRAINT fk_test_center_active_vsl 
        FOREIGN KEY (active_vsl_id) 
        REFERENCES vsl_variants(id);
    END IF;
END $$;

-- Add tracking columns if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'page_sessions' AND column_name = 'vsl_slug') THEN
        ALTER TABLE page_sessions ADD COLUMN vsl_slug TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'button_clicks' AND column_name = 'vsl_slug') THEN
        ALTER TABLE button_clicks ADD COLUMN vsl_slug TEXT;
    END IF;
END $$;

-- Insert initial data if empty
INSERT INTO vsl_test_centers (name, domain, currency, bma_name)
SELECT 'Brasil Principal', 'metodo-lovable-infinito.vip', 'BRL', 'Facebook Ads Brasil'
WHERE NOT EXISTS (SELECT 1 FROM vsl_test_centers WHERE domain = 'metodo-lovable-infinito.vip');

INSERT INTO vsl_test_centers (name, domain, currency, bma_name)
SELECT 'USA Principal', 'lovable-app.vip', 'USD', 'Facebook Ads USA'
WHERE NOT EXISTS (SELECT 1 FROM vsl_test_centers WHERE domain = 'lovable-app.vip');

-- Insert template VSL if not exists
INSERT INTO vsl_variants (name, slug, description, is_template, headline, status)
SELECT 
    'VSL Original — Método Lovable Infinito',
    'original',
    'Copy original validada. Baseline de comparação.',
    true,
    'VOCÊ AINDA PAGA PRA USAR O LOVABLE?',
    'active'
WHERE NOT EXISTS (SELECT 1 FROM vsl_variants WHERE slug = 'original');
