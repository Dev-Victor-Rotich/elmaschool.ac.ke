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
        console.log("Session established for user:", user.email);

        // 1) Fast path: if this is a student, send them straight to the student portal
        let studentRecord: any = null;

        const { data: byUser, error: byUserError } = await supabase
          .from("students_data")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (byUserError) {
          console.error("Student lookup by user_id error:", byUserError);
        }

        if (byUser) {
          studentRecord = byUser;
        } else if (user.email) {
          const { data: byEmail, error: byEmailError } = await supabase
            .from("students_data")
            .select("id")
            .eq("email", user.email)
            .maybeSingle();

          if (byEmailError) {
            console.error("Student lookup by email error:", byEmailError);
          }

          if (byEmail) {
            studentRecord = byEmail;
          }
        }

        if (studentRecord) {
          console.log("Student account detected, redirecting to student portal");
          navigate("/students/portal", { replace: true });
          return;
        }

        // 2) Staff/admin path: use role-based routing
        const { data: roleData, error: roleError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();

        if (roleError) {
          console.error("Role fetch error:", roleError);
        }

        const role = roleData?.role as string | undefined;

        if (!role) {
          throw new Error("No role assigned to this account. Please contact your administrator.");
        }

        console.log("User role:", role);

        switch (role) {
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
          case "student_leader":
            console.log("Redirecting to student portal (role-based)");
            navigate("/students/portal", { replace: true });
            break;
          case "class_rep":
            console.log("Redirecting to class rep portal");
            navigate("/students/class-rep", { replace: true });
            break;
          default:
            console.error("Unknown role:", roleData?.role);
            throw new Error("Unknown role: " + roleData?.role);
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
