import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const loginType = params.get("type");

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("Session error:", sessionError);
          throw sessionError;
        }

        if (!session?.user) {
          console.log("No session found, redirecting to login");
          navigate("/login");
          return;
        }

        const user = session.user;
        console.log("Session established for user:", user.email, "type:", loginType);

        // Check user role from user_roles table (single source of truth)
        const { data: roleData, error: roleError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();

        if (roleError) {
          console.error("Role fetch error:", roleError);
        }

        const role = roleData?.role as string | undefined;

        // If no role found, redirect to login silently
        if (!role) {
          console.warn("No role assigned for user:", user.email);
          navigate("/login", { replace: true });
          return;
        }

        console.log("User role:", role);

        // Route based on role
        switch (role) {
          case "super_admin":
            navigate("/dashboard/superadmin", { replace: true });
            break;
          case "bursar":
            navigate("/dashboard/bursar", { replace: true });
            break;
          case "teacher":
            navigate("/staff/teacher", { replace: true });
            break;
          case "hod":
            navigate("/staff/hod", { replace: true });
            break;
          case "chaplain":
            navigate("/staff/chaplain", { replace: true });
            break;
          case "librarian":
            navigate("/staff/librarian", { replace: true });
            break;
          case "classteacher":
            navigate("/staff/classteacher", { replace: true });
            break;
          case "student":
          case "student_leader":
            navigate("/students/portal", { replace: true });
            break;
          case "class_rep":
            navigate("/students/class-rep", { replace: true });
            break;
          default:
            console.error("Unknown role:", role);
            navigate("/login", { replace: true });
            break;
        }
      } catch (error: any) {
        console.error("Auth callback error:", error);
        setError(error.message || "Authentication failed");
        setTimeout(() => navigate("/login"), 3000);
      }
    };

    handleCallback();
  }, [navigate, location.search]);

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
