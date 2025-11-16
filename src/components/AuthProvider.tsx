import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ensureAdminRole } from '@/lib/auth-utils';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    // Verificar sessão existente ao carregar
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        ensureAdminRole(session.user.id, session.user.email || '');
      }
    });

    // Monitorar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          // Aguardar um pequeno delay para garantir que a sessão está totalmente estabelecida
          setTimeout(() => {
            ensureAdminRole(session.user.id, session.user.email || '');
          }, 500);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return <>{children}</>;
};
