-- Create table for managing checkout links
CREATE TABLE IF NOT EXISTS public.checkout_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vsl_type TEXT NOT NULL, -- 'home' or 'thankyou'
    button_index INT NOT NULL, -- 1, 2, 3...
    button_text TEXT NOT NULL, -- Text to identify the button
    offer_value DECIMAL(10,2), -- Price found
    checkout_url TEXT NOT NULL, -- The destination URL
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.checkout_links ENABLE ROW LEVEL SECURITY;

-- Policy: Public read access (VSL pages need to fetch the links)
CREATE POLICY "Public Read Access" 
ON public.checkout_links FOR SELECT 
USING (true);

-- Policy: Authenticated users (Admin) can do everything
CREATE POLICY "Admin Full Access" 
ON public.checkout_links FOR ALL 
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Create unique index to prevent duplicate buttons for same VSL
CREATE UNIQUE INDEX IF NOT EXISTS idx_checkout_links_vsl_btn 
ON public.checkout_links (vsl_type, button_index);

-- Output success message
SELECT 'Tabela checkout_links criada com sucesso!' as status;
