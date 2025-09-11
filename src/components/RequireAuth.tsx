import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface RequireAuthProps {
  children: React.ReactNode;
}

const RequireAuth = ({ children }: RequireAuthProps) => {
  const [loading, setLoading] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Listen first
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const authed = !!session?.user;
      setIsAuthed(authed);
      setLoading(false);
      if (!authed) {
        navigate("/auth");
      }
    });

    // Then fetch current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const authed = !!session?.user;
      setIsAuthed(authed);
      setLoading(false);
      if (!authed) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!isAuthed) return null;
  return <>{children}</>;
};

export default RequireAuth;
