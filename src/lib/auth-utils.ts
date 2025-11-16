import { supabase } from '@/integrations/supabase/client';

const ADMIN_EMAIL = 'joamelloair40@gmail.com';

/**
 * Verifica e atribui automaticamente a role admin para o email específico
 * Esta função é executada após o login do usuário
 */
export const ensureAdminRole = async (userId: string, userEmail: string) => {
  // Verificar se é o email específico que deve ser admin
  if (userEmail !== ADMIN_EMAIL) {
    return;
  }

  try {
    // Verificar se o usuário já tem a role admin
    const { data: existingRole, error: checkError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();

    if (checkError) {
      console.error('Error checking admin role:', checkError);
      return;
    }

    // Se já tem a role admin, não fazer nada
    if (existingRole) {
      return;
    }

    // Inserir a role admin para este usuário
    const { error: insertError } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role: 'admin'
      });

    if (insertError) {
      console.error('Error assigning admin role:', insertError);
      return;
    }

    console.log('Admin role assigned successfully to:', userEmail);
  } catch (error) {
    console.error('Error in ensureAdminRole:', error);
  }
};
