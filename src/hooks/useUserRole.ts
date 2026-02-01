import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

type AppRole = 'admin' | 'moderator' | 'user';

interface UseUserRoleResult {
  user: User | null;
  role: AppRole | null;
  isAdmin: boolean;
  isContentManager: boolean;
  isLoading: boolean;
}

export const useUserRole = (): UseUserRoleResult => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setUser(null);
          setRole(null);
          setIsLoading(false);
          return;
        }

        setUser(user);

        // Fetch user role from user_roles table
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();

        if (roleData?.role) {
          setRole(roleData.role as AppRole);
        } else {
          setRole('user');
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
        setRole(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserRole();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchUserRole();
      } else {
        setUser(null);
        setRole(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return {
    user,
    role,
    isAdmin: role === 'admin',
    isContentManager: role === 'moderator' || role === 'admin',
    isLoading,
  };
};
