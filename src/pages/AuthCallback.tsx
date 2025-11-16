import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (!session) {
          throw new Error("No session found");
        }

        // Get user role
        const { data: roleData, error: roleError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .single();

        if (roleError) {
          throw new Error("Failed to fetch user role");
        }

        // Redirect based on role
        switch (roleData.role) {
          case "super_admin":
            navigate("/dashboard/superadmin");
            break;
          case "bursar":
            navigate("/dashboard/bursar");
            break;
          case "student":
            navigate("/dashboard/student");
            break;
          default:
            throw new Error("Unknown role");
        }
      } catch (error: any) {
        console.error("Auth callback error:", error);
        setError(error.message);
        setTimeout(() => navigate("/login"), 3000);
      }
    };

    handleCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <p className="text-destructive">Authentication Error: {error}</p>
          <p className="text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
        <p className="text-muted-foreground">Verifying your login...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
