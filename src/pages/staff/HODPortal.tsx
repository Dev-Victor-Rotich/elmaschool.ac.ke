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
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              HOD Portal
            </h1>
            <p className="text-muted-foreground mt-2">
              Managing: <span className="font-semibold text-foreground">{department.name}</span>
            </p>
          </div>
          <Button onClick={handleLogout} variant="outline">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Department Overview Card */}
        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-2xl">{department.name}</CardTitle>
                <CardDescription className="text-base">{department.description}</CardDescription>
              </div>
              <Button size="sm" onClick={() => navigate(`#edit-department`)}>
                Edit Details
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5">
                <Users className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{departmentStaff?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Staff Members</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary/50">
                <BarChart3 className="w-8 h-8 text-secondary-foreground" />
                <div>
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-sm text-muted-foreground">Active Projects</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-accent/50">
                <MessageSquare className="w-8 h-8 text-accent-foreground" />
                <div>
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-sm text-muted-foreground">Announcements</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="staff" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="staff" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Staff Management</span>
              <span className="sm:hidden">Staff</span>
            </TabsTrigger>
            <TabsTrigger value="department" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Department Info</span>
              <span className="sm:hidden">Info</span>
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Communications</span>
              <span className="sm:hidden">Messages</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="staff" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Department Staff</CardTitle>
                    <CardDescription>
                      Manage staff members in {department.name}
                    </CardDescription>
                  </div>
                  <Button onClick={() => navigate(`#add-staff`)}>
                    Add Staff Member
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {!departmentStaff || departmentStaff.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground text-lg">No staff members assigned yet</p>
                    <p className="text-sm text-muted-foreground mt-2">Add staff members to get started</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {departmentStaff.map((staff) => (
                      <div 
                        key={staff.id} 
                        className="flex items-center gap-4 p-4 border rounded-lg hover:shadow-md transition-shadow"
                      >
                        {staff.image_url ? (
                          <img 
                            src={staff.image_url} 
                            alt={staff.name} 
                            className="w-16 h-16 rounded-full object-cover border-2 border-primary/20" 
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-2xl font-bold text-primary">
                              {staff.name.charAt(0)}
                            </span>
                          </div>
                        )}
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg">{staff.name}</h4>
                          <p className="text-sm text-muted-foreground">{staff.position}</p>
                          {staff.bio && (
                            <p className="text-sm mt-1 line-clamp-2">{staff.bio}</p>
                          )}
                        </div>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="department" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Department Information</CardTitle>
                <CardDescription>
                  View and update department details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">Department Name</label>
                  <p className="text-lg">{department.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Description</label>
                  <p className="text-muted-foreground">{department.description}</p>
                </div>
                <Button>Edit Department Details</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Department Communications</CardTitle>
                    <CardDescription>
                      Send announcements and messages to department staff
                    </CardDescription>
                  </div>
                  <Button>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    New Announcement
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <MessageSquare className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground text-lg">No messages yet</p>
                  <p className="text-sm text-muted-foreground mt-2">Start communicating with your department</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default HODPortal;
