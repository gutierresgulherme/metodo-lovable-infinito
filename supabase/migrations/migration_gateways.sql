-- ADICIONAR COLUNAS DE GATEWAY NA TABELA CHECKOUT_LINKS
-- Execute este script no SQL Editor do seu Supabase.

ALTER TABLE public.checkout_links 
ADD COLUMN IF NOT EXISTS stripe_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS pushinpay_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS mundpay_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS mundpay_url TEXT;

-- Garantir que as permissões continuem corretas
GRANT ALL ON TABLE public.checkout_links TO anon, authenticated, service_role;

COMMENT ON COLUMN public.checkout_links.stripe_enabled IS 'Habilita Stripe/Cartão para esta oferta';
COMMENT ON COLUMN public.checkout_links.pushinpay_enabled IS 'Habilita PushinPay/Pix para esta oferta';
COMMENT ON COLUMN public.checkout_links.mundpay_enabled IS 'Habilita MundPay/Pix para esta oferta';
COMMENT ON COLUMN public.checkout_links.mundpay_url IS 'URL de checkout externo MundPay para esta oferta';
