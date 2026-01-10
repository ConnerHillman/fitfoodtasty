import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useToast } from "@/hooks/use-toast";

interface RequireAdminProps {
  children: React.ReactNode;
}

const RequireAdmin = ({ children }: RequireAdminProps) => {
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);
  const navigate = useNavigate();
  const { userRole, loading: roleLoading, isAdmin } = useUserRole();
  const { toast } = useToast();

  useEffect(() => {
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const authed = !!session?.user;
      setIsAuthed(authed);
      setAuthLoading(false);
      if (!authed) {
        navigate("/auth");
      }
    });

    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const authed = !!session?.user;
      setIsAuthed(authed);
      setAuthLoading(false);
      if (!authed) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Handle role check after auth is confirmed
  useEffect(() => {
    if (!authLoading && isAuthed && !roleLoading && userRole !== null) {
      if (!isAdmin()) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access this area. Please contact an administrator if you believe this is an error.",
          variant: "destructive",
        });
        navigate("/");
      }
    }
  }, [authLoading, isAuthed, roleLoading, userRole, isAdmin, navigate, toast]);

  // Show loading while checking auth or role
  if (authLoading || roleLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <span className="text-muted-foreground">Verifying access...</span>
        </div>
      </div>
    );
  }

  // Not authenticated - will redirect via useEffect
  if (!isAuthed) return null;

  // Not admin - will redirect via useEffect
  if (!isAdmin()) return null;

  return <>{children}</>;
};

export default RequireAdmin;
