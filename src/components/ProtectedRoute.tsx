import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // SECURITY: Always verify session server-side first
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          setAuthorized(false);
          setLoading(false);
          return;
        }

        // Get user's actual role from database (not localStorage)
        const { data: userRoleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .single();

        const userRole = userRoleData?.role;
        const isSuperAdmin = userRole === 'super_admin';

        // Super admin has UNLIMITED access to ALL dashboards
        if (isSuperAdmin) {
          setAuthorized(true);
          setLoading(false);
          return;
        }

        // Check for impersonation - but ONLY if user is verified super admin
        const impersonationData = localStorage.getItem('impersonation');
        if (impersonationData && isSuperAdmin) {
          // Super admin is impersonating - allow access
          setAuthorized(true);
          setLoading(false);
          return;
        }

        // Normal role check for non-super-admin users
        if (requiredRole) {
          if (userRole === requiredRole) {
            setAuthorized(true);
          } else {
            setAuthorized(false);
          }
        } else {
          // No specific role required, just need to be authenticated
          setAuthorized(true);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        setAuthorized(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [requiredRole]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!authorized) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
