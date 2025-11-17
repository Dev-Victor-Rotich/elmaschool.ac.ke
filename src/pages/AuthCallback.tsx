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
        // Exchange the auth code from URL params for a session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("Session error:", sessionError);
          throw sessionError;
        }

        if (!session?.user) {
          console.log("No session found, redirecting to login");
          navigate("/login");
          return;
        }

        console.log("Session established for user:", session.user.email);

        // Get user role
        const { data: roleData, error: roleError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .single();

        if (roleError) {
          console.error("Role fetch error:", roleError);
          throw new Error("Failed to fetch user role");
        }

        console.log("User role:", roleData.role);

        // Redirect based on role
        switch (roleData.role) {
          case "super_admin":
            console.log("Redirecting to super admin dashboard");
            navigate("/dashboard/superadmin", { replace: true });
            break;
          case "bursar":
            console.log("Redirecting to bursar dashboard");
            navigate("/dashboard/bursar", { replace: true });
            break;
          case "teacher":
            console.log("Redirecting to teacher portal");
            navigate("/staff/teacher", { replace: true });
            break;
          case "hod":
            console.log("Redirecting to HOD portal");
            navigate("/staff/hod", { replace: true });
            break;
          case "chaplain":
            console.log("Redirecting to chaplain portal");
            navigate("/staff/chaplain", { replace: true });
            break;
          case "librarian":
            console.log("Redirecting to librarian portal");
            navigate("/staff/librarian", { replace: true });
            break;
          case "classteacher":
            console.log("Redirecting to class teacher portal");
            navigate("/staff/classteacher", { replace: true });
            break;
          case "student":
            console.log("Redirecting to student dashboard");
            navigate("/dashboard/student", { replace: true });
            break;
          case "class_rep":
            console.log("Redirecting to class rep portal");
            navigate("/students/classrep", { replace: true });
            break;
          default:
            console.error("Unknown role:", roleData.role);
            throw new Error("Unknown role: " + roleData.role);
        }
      } catch (error: any) {
        console.error("Auth callback error:", error);
        setError(error.message || "Authentication failed");
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
