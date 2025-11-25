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
        // Check for impersonation first
        const impersonationData = localStorage.getItem('impersonation');
        
        if (impersonationData) {
          // Super admin is impersonating - allow ALL access with NO restrictions
          setAuthorized(true);
          setLoading(false);
          return;
        }

        // Normal authentication flow
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          setAuthorized(false);
          setLoading(false);
          return;
        }

        // Check if authenticated user is super admin
        const { data: userRoleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .single();

        const isSuperAdmin = userRoleData?.role === 'super_admin';

        // Super admin has UNLIMITED access to ALL dashboards - NEVER deny
        if (isSuperAdmin) {
          setAuthorized(true);
          setLoading(false);
          return;
        }

        // Normal role check for non-super-admin users only
        if (requiredRole) {
          if (userRoleData?.role === requiredRole) {
            setAuthorized(true);
          } else {
            setAuthorized(false);
          }
        } else {
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
