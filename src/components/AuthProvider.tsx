import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ensureAdminRole } from '@/lib/auth-utils';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    // Verificar e atribuir role admin imediatamente ao carregar
    const initializeAdminRole = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        console.log('[AuthProvider] Sessão detectada, verificando role admin...');
        await ensureAdminRole(session.user.id, session.user.email || '');
      }
    };

    // Executar imediatamente
    initializeAdminRole();

    // Monitorar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('[AuthProvider] Login detectado, atribuindo role admin...');
          // Executar imediatamente sem delay
          await ensureAdminRole(session.user.id, session.user.email || '');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return <>{children}</>;
};
