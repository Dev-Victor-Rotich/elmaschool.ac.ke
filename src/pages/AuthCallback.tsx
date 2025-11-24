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

        if (sessionError) throw sessionError;

        if (!session?.user) {
          navigate("/login");
          return;
        }

        // Get user role
        const { data: roleData, error: roleError } = await supabase
           .from("user_roles")
           .select("role")
           .eq("user_id", session.user.id)
           .maybeSingle();
 
         if (roleError) throw new Error("Failed to fetch user role");
 
         let role = roleData?.role as string | undefined;
 
         // Fallback: infer role for approved students without an assigned role
         if (!role && session.user.email) {
           const { data: studentRecord, error: studentError } = await supabase
             .from("students_data")
             .select("id, approval_status")
             .eq("email", session.user.email)
             .eq("approval_status", "approved")
             .maybeSingle();
 
           if (studentRecord) {
             // Link user to student record and assign student role
             const { error: linkError } = await supabase
               .from("students_data")
               .update({ user_id: session.user.id, is_registered: true })
               .eq("id", studentRecord.id);
 
             if (!linkError) {
               const { error: insertRoleError } = await supabase
                 .from("user_roles")
                 .insert({ user_id: session.user.id, role: "student" as any });
 
               if (!insertRoleError) {
                 role = "student";
               }
             }
           }
         }
 
         if (!role) {
           throw new Error("No role assigned to this account. Please contact your administrator.");
         }
 
         // Redirect based on role
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
            navigate("/dashboard/student", { replace: true });
            break;
          case "class_rep":
            navigate("/students/classrep", { replace: true });
            break;
          default:
            throw new Error("Unknown role: " + roleData.role);
        }
      } catch (error: any) {
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
