import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface RequireAuthProps {
  children: React.ReactNode;
}

const RequireAuth = ({ children }: RequireAuthProps) => {
  const [loading, setLoading] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);
  const [profileComplete, setProfileComplete] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAuthAndProfile = async (userId: string) => {
      // Check if profile has required fields (phone)
      const { data: profile } = await supabase
        .from("profiles")
        .select("phone")
        .eq("user_id", userId)
        .single();

      const hasPhone = profile?.phone && profile.phone.trim().length > 0;
      setProfileComplete(hasPhone);

      if (!hasPhone && location.pathname !== "/complete-profile") {
        navigate("/complete-profile");
      }
    };

    // Listen first
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const authed = !!session?.user;
      setIsAuthed(authed);
      
      if (!authed) {
        setLoading(false);
        navigate("/auth");
      } else if (session?.user) {
        // Check profile completeness
        checkAuthAndProfile(session.user.id).finally(() => setLoading(false));
      }
    });

    // Then fetch current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const authed = !!session?.user;
      setIsAuthed(authed);
      
      if (!authed) {
        setLoading(false);
        navigate("/auth");
      } else if (session?.user) {
        checkAuthAndProfile(session.user.id).finally(() => setLoading(false));
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, location.pathname]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!isAuthed || !profileComplete) return null;
  return <>{children}</>;
};

export default RequireAuth;
