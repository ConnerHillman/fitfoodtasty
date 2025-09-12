import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'admin' | 'moderator' | 'user';

export const useUserRole = () => {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setUserRole(null);
          setLoading(false);
          return;
        }

        // Fetch user roles
        const { data: userRoles, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching user roles:', error);
          setUserRole('user'); // Default to user role
        } else {
          // Check for admin role first, then moderator, then default to user
          const roles = userRoles?.map(r => r.role) || [];
          if (roles.includes('admin')) {
            setUserRole('admin');
          } else if (roles.includes('moderator')) {
            setUserRole('moderator');
          } else {
            setUserRole('user');
          }
        }
      } catch (error) {
        console.error('Error in fetchUserRole:', error);
        setUserRole('user');
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchUserRole();
    });

    return () => subscription.unsubscribe();
  }, []);

  const hasRole = (role: UserRole): boolean => {
    if (!userRole) return false;
    
    // Admin has all permissions
    if (userRole === 'admin') return true;
    
    // Moderator has user permissions
    if (userRole === 'moderator' && (role === 'moderator' || role === 'user')) return true;
    
    // User only has user permissions
    if (userRole === 'user' && role === 'user') return true;
    
    return false;
  };

  const isAdmin = (): boolean => hasRole('admin');
  const isModerator = (): boolean => hasRole('moderator');

  return {
    userRole,
    loading,
    hasRole,
    isAdmin,
    isModerator,
  };
};