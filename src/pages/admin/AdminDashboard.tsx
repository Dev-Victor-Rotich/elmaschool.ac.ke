import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, GraduationCap, DollarSign, CalendarDays, LogOut, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import MyClassesManager from "@/components/staff/MyClassesManager";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    setUserId(session.user.id);

    // If super admin is impersonating an admin, bypass role checks
    const impersonationRaw = localStorage.getItem("impersonation");
    const impersonation = impersonationRaw ? JSON.parse(impersonationRaw) : null;

    if (!impersonation) {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);

      if (!roles || !roles.some(r => r.role === "admin")) {
        toast.error("Access denied. Admin role required.");
        navigate("/auth");
        return;
      }
    }

    setLoading(false);
  };

  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [students, staff, revenue] = await Promise.all([
        supabase.from("students_data").select("*", { count: "exact", head: true }),
        supabase.from("staff_registry").select("*", { count: "exact", head: true }),
        supabase.from("fee_payments").select("amount_paid").then(res => 
          res.data?.reduce((sum, p) => sum + Number(p.amount_paid), 0) || 0
        ),
      ]);

      return {
        totalStudents: students.count || 0,
        totalStaff: staff.count || 0,
        totalRevenue: revenue,
      };
    },
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-2">School Management & Operations</p>
          </div>
          <Button onClick={handleLogout} variant="outline">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalStudents || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalStaff || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue (KES)</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalRevenue?.toLocaleString() || 0}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">
              <Users className="w-4 h-4 mr-2" />
              Manage Users
            </TabsTrigger>
            <TabsTrigger value="myclasses">
              <GraduationCap className="w-4 h-4 mr-2" />
              My Classes
            </TabsTrigger>
            <TabsTrigger value="academic">
              <BookOpen className="w-4 h-4 mr-2" />
              Academic
            </TabsTrigger>
            <TabsTrigger value="finance">
              <DollarSign className="w-4 h-4 mr-2" />
              Finance
            </TabsTrigger>
            <TabsTrigger value="events">
              <CalendarDays className="w-4 h-4 mr-2" />
              Events
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage students, staff, and user approvals</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={() => navigate("/admin/approve-users")} className="w-full">
                  Approve Pending Users
                </Button>
                <Button onClick={() => navigate("/admin/manage-students")} className="w-full" variant="outline">
                  Manage Students
                </Button>
                <Button onClick={() => navigate("/admin/assign-roles")} className="w-full" variant="outline">
                  Assign Roles
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="myclasses">
            {userId && <MyClassesManager userId={userId} />}
          </TabsContent>

          <TabsContent value="academic">
            <Card>
              <CardHeader>
                <CardTitle>Academic Management</CardTitle>
                <CardDescription>Configure terms, grading, and view results</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Academic configuration features coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="finance">
            <Card>
              <CardHeader>
                <CardTitle>Financial Overview</CardTitle>
                <CardDescription>View revenue, expenses, and payment summaries</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => navigate("/staff/bursar")} className="w-full">
                  View Financial Reports
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events">
            <Card>
              <CardHeader>
                <CardTitle>Events & Communication</CardTitle>
                <CardDescription>Manage school events and announcements</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Event management features coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
