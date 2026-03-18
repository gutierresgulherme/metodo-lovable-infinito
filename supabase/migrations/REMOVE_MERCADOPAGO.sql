-- Remover gatilhos e funções de pagamentos
DROP TRIGGER IF EXISTS update_payments_updated_at ON public.payments;
DROP FUNCTION IF EXISTS public.update_payments_updated_at();

-- Remover políticas de segurança
DROP POLICY IF EXISTS "Users can view their own payments" ON public.payments;
DROP POLICY IF EXISTS "Service role can insert payments" ON public.payments;
DROP POLICY IF EXISTS "Service role can update payments" ON public.payments;
DROP POLICY IF EXISTS "Prevent payment deletion" ON public.payments;
DROP POLICY IF EXISTS "Prevent payment deletion anon" ON public.payments;

-- Remover a tabela de pagamentos e seus índices
DROP TABLE IF EXISTS public.payments CASCADE;

-- Remover logs ou referências em outras tabelas se existirem
DELETE FROM public.vsl_settings WHERE key = 'mercadopago_config';
