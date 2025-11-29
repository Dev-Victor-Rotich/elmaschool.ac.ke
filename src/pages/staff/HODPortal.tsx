import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, BarChart3, LogOut, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

const HODPortal = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Fetch HOD's assigned department
  const { data: hodDepartment, isLoading: isDeptLoading } = useQuery({
    queryKey: ['hod-department', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from('hod_departments')
        .select(`
          *,
          departments (
            id,
            name,
            description
          )
        `)
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId
  });

  // Fetch department staff for HOD's department
  const { data: departmentStaff, isLoading: isStaffLoading } = useQuery({
    queryKey: ['department-staff', hodDepartment?.department_id],
    queryFn: async () => {
      if (!hodDepartment?.department_id) return [];
      
      const { data, error } = await supabase
        .from('department_staff')
        .select('*')
        .eq('department_id', hodDepartment.department_id)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!hodDepartment?.department_id
  });

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

    // If super admin is impersonating an HOD, bypass role checks
    const impersonationRaw = localStorage.getItem("impersonation");
    const impersonation = impersonationRaw ? JSON.parse(impersonationRaw) : null;

    if (!impersonation) {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);

      if (!roles || !roles.some(r => r.role === "hod")) {
        toast.error("Access denied. HOD role required.");
        navigate("/auth");
        return;
      }
    }

    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading || isDeptLoading || isStaffLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!hodDepartment) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>No Department Assigned</CardTitle>
              <CardDescription>
                You have not been assigned to a department yet. Please contact the Super Admin.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleLogout} variant="outline">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const department = hodDepartment.departments;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">HOD Portal</h1>
            <p className="text-muted-foreground mt-2">Managing: {department.name}</p>
          </div>
          <Button onClick={handleLogout} variant="outline">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Department: {department.name}</CardTitle>
            <CardDescription>{department.description}</CardDescription>
          </CardHeader>
        </Card>

        <Tabs defaultValue="staff" className="space-y-4">
          <TabsList>
            <TabsTrigger value="staff">
              <Users className="w-4 h-4 mr-2" />
              Department Staff
            </TabsTrigger>
            <TabsTrigger value="reports">
              <BarChart3 className="w-4 h-4 mr-2" />
              Reports
            </TabsTrigger>
            <TabsTrigger value="messages">
              <MessageSquare className="w-4 h-4 mr-2" />
              Messages
            </TabsTrigger>
          </TabsList>

          <TabsContent value="staff">
            <Card>
              <CardHeader>
                <CardTitle>Staff Members</CardTitle>
                <CardDescription>
                  {departmentStaff?.length || 0} staff members in {department.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!departmentStaff || departmentStaff.length === 0 ? (
                  <p className="text-muted-foreground">No staff members assigned yet.</p>
                ) : (
                  <div className="space-y-4">
                    {departmentStaff.map((staff) => (
                      <div key={staff.id} className="flex items-center gap-4 p-4 border rounded-lg">
                        {staff.image_url && (
                          <img src={staff.image_url} alt={staff.name} className="w-16 h-16 rounded-full object-cover" />
                        )}
                        <div className="flex-1">
                          <h4 className="font-semibold">{staff.name}</h4>
                          <p className="text-sm text-muted-foreground">{staff.position}</p>
                          {staff.bio && <p className="text-sm mt-1">{staff.bio}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>Department Reports</CardTitle>
                <CardDescription>View and generate reports for {department.name}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button>Generate Report</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages">
            <Card>
              <CardHeader>
                <CardTitle>Messages</CardTitle>
                <CardDescription>Communication and announcements</CardDescription>
              </CardHeader>
              <CardContent>
                <Button>New Message</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default HODPortal;
