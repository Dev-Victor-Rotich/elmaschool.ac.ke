import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, GraduationCap, Calendar, DollarSign } from "lucide-react";
import { toast } from "sonner";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState("");
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalEvents: 0,
    pendingApprovals: 0,
  });

  useEffect(() => {
    checkAuth();
    loadStats();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", session.user.id)
      .single();

    if (profile) {
      setUserName(profile.full_name);
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id);

    if (roles && roles.length > 0) {
      setUserRole(roles[0].role);
    } else {
      toast.error("No role assigned");
      navigate("/auth");
    }
  };

  const loadStats = async () => {
    const { data: students } = await supabase
      .from("students_data")
      .select("id", { count: "exact" });

    const { data: events } = await supabase
      .from("events")
      .select("id", { count: "exact" });

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id", { count: "exact" })
      .eq("approval_status", "pending");

    setStats({
      totalStudents: students?.length || 0,
      totalEvents: events?.length || 0,
      pendingApprovals: profiles?.length || 0,
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Admin Portal</h1>
            <p className="text-sm text-muted-foreground">
              Welcome, {userName} ({userRole})
            </p>
          </div>
          <Button onClick={handleLogout} variant="outline">
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStudents}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEvents}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingApprovals}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Button size="sm" className="w-full">View All</Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {userRole === "super_admin" && (
            <Card>
              <CardHeader>
                <CardTitle>Super Admin Actions</CardTitle>
                <CardDescription>Manage users and system settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full" onClick={() => navigate("/admin/manage-students")}>
                  Manage Students
                </Button>
                <Button className="w-full" onClick={() => navigate("/admin/approve-users")}>
                  Approve Users
                </Button>
                <Button className="w-full" onClick={() => navigate("/admin/assign-roles")}>
                  Assign Staff Roles
                </Button>
              </CardContent>
            </Card>
          )}

          {(userRole === "teacher" || userRole === "hod") && (
            <Card>
              <CardHeader>
                <CardTitle>Academic Management</CardTitle>
                <CardDescription>Manage results and performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full">Add Results</Button>
                <Button className="w-full" variant="outline">
                  View Students
                </Button>
              </CardContent>
            </Card>
          )}

          {userRole === "bursar" && (
            <Card>
              <CardHeader>
                <CardTitle>Finance Management</CardTitle>
                <CardDescription>Manage fees and payments</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full">Record Payment</Button>
                <Button className="w-full" variant="outline">
                  View Balances
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
