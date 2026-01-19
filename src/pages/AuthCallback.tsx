import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

/**
 * OAuth callback page - handles redirect after Google/Apple sign in.
 * Checks if profile is complete (has phone), redirects accordingly.
 */
const AuthCallback = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState("Completing sign in...");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Wait for session to be available
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Auth callback error:", sessionError);
          navigate("/auth");
          return;
        }

        if (!session?.user) {
          // No session yet, wait a moment and retry
          setStatus("Verifying authentication...");
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const { data: { session: retrySession } } = await supabase.auth.getSession();
          if (!retrySession?.user) {
            navigate("/auth");
            return;
          }
        }

        const userId = session?.user?.id;
        if (!userId) {
          navigate("/auth");
          return;
        }

        setStatus("Checking profile...");

        // Check if profile exists and has required fields
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("phone, first_name, last_name")
          .eq("user_id", userId)
          .single();

        if (profileError && profileError.code !== "PGRST116") {
          console.error("Profile fetch error:", profileError);
        }

        // If phone is missing, redirect to complete profile
        const hasPhone = profile?.phone && profile.phone.trim().length > 0;
        
        if (!hasPhone) {
          navigate("/complete-profile");
        } else {
          navigate("/menu");
        }
      } catch (error) {
        console.error("Auth callback exception:", error);
        navigate("/auth");
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground">{status}</p>
    </div>
  );
};

export default AuthCallback;
