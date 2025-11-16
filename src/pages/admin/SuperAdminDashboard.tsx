import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, UserCheck, Shield, Activity, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";
import { UserApprovalTable } from "@/components/admin/UserApprovalTable";
import { RoleManagement } from "@/components/admin/RoleManagement";
import { OwnershipTransfer } from "@/components/admin/OwnershipTransfer";
import { AuditLogs } from "@/components/admin/AuditLogs";
import { StaffRegistryManager } from "@/components/admin/StaffRegistryManager";
import HomeContentManager from "./HomeContentManager";
import AboutContentManager from "./AboutContentManager";
import { SubjectsManager } from "@/components/admin/SubjectsManager";
import { DepartmentsManager } from "@/components/admin/DepartmentsManager";
import { ClubsSocietiesManager } from "@/components/admin/ClubsSocietiesManager";
import { StudentAmbassadorManager } from "@/components/admin/StudentAmbassadorManager";
import { ContactInfoManager } from "@/components/admin/ContactInfoManager";
import { RequiredDocumentsManager } from "@/components/admin/RequiredDocumentsManager";
import { CBCPartnershipImagesManager } from "@/components/admin/CBCPartnershipImagesManager";
import { ActiveStudentsManager } from "@/components/admin/ActiveStudentsManager";
import { PreviousLeadersManager } from "@/components/admin/PreviousLeadersManager";
import { LeadershipProgramsManager } from "@/components/admin/LeadershipProgramsManager";
import { BeyondClassroomManager } from "@/components/admin/BeyondClassroomManager";
import { Button } from "@/components/ui/button";

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  useSessionTimeout();

  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [totalUsers, pendingApprovals, totalStaff, activeStudents] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('staff_registry').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('students_data').select('id', { count: 'exact', head: true })
      ]);

      return {
        totalUsers: totalUsers.count || 0,
        pendingApprovals: pendingApprovals.count || 0,
        totalStaff: totalStaff.count || 0,
        activeStudents: activeStudents.count || 0
      };
    }
  });

  useEffect(() => {
    checkSuperAdmin();
  }, []);

  const checkSuperAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    if (!roles || !roles.some(r => r.role === "super_admin")) {
      toast.error("Access denied. Super Admin privileges required.");
      navigate("/");
      return;
    }

    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6 sticky top-0 bg-background z-10 pb-4 border-b">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
        </div>
        <Button onClick={handleLogout} variant="outline">
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
      
      <Tabs defaultValue="content" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="content">Website Content</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-6">
          <Tabs defaultValue="home">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="home">Home</TabsTrigger>
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="programs">Programs</TabsTrigger>
              <TabsTrigger value="cbc">CBC</TabsTrigger>
              <TabsTrigger value="student">Student</TabsTrigger>
              <TabsTrigger value="admissions">Admissions</TabsTrigger>
              <TabsTrigger value="contact">Contact</TabsTrigger>
            </TabsList>

            <TabsContent value="home">
              <HomeContentManager />
            </TabsContent>

            <TabsContent value="about">
              <AboutContentManager />
            </TabsContent>

            <TabsContent value="programs">
              <Tabs defaultValue="subjects" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="subjects">Subjects</TabsTrigger>
                  <TabsTrigger value="departments">Departments</TabsTrigger>
                  <TabsTrigger value="beyond">Beyond Classroom</TabsTrigger>
                </TabsList>
                
                <TabsContent value="subjects">
                  <Card>
                    <CardHeader>
                      <CardTitle>Subjects</CardTitle>
                      <CardDescription>Manage curriculum subjects</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <SubjectsManager />
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="departments">
                  <Card>
                    <CardHeader>
                      <CardTitle>Departments</CardTitle>
                      <CardDescription>Manage academic departments</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <DepartmentsManager />
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="beyond">
                  <Card>
                    <CardHeader>
                      <CardTitle>Beyond Classroom Activities</CardTitle>
                      <CardDescription>Manage extracurricular activities</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <BeyondClassroomManager />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </TabsContent>
            
            <TabsContent value="cbc">
              <Card>
                <CardHeader>
                  <CardTitle>CBC Partnership Images</CardTitle>
                  <CardDescription>Manage CBC page partnership images</CardDescription>
                </CardHeader>
                <CardContent>
                  <CBCPartnershipImagesManager />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="student">
              <Tabs defaultValue="ambassador" className="space-y-6">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="ambassador">Ambassador</TabsTrigger>
                  <TabsTrigger value="clubs">Clubs</TabsTrigger>
                  <TabsTrigger value="leadership">Leadership</TabsTrigger>
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="previous">Previous</TabsTrigger>
                </TabsList>
                
                <TabsContent value="ambassador">
                  <Card>
                    <CardHeader>
                      <CardTitle>Student Ambassador</CardTitle>
                      <CardDescription>Manage student ambassador profile</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <StudentAmbassadorManager />
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="clubs">
                  <Card>
                    <CardHeader>
                      <CardTitle>Clubs & Societies</CardTitle>
                      <CardDescription>Manage student clubs and societies</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ClubsSocietiesManager />
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="leadership">
                  <Card>
                    <CardHeader>
                      <CardTitle>Leadership Programs</CardTitle>
                      <CardDescription>Manage leadership development programs</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <LeadershipProgramsManager />
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="active">
                  <Card>
                    <CardHeader>
                      <CardTitle>Active Students</CardTitle>
                      <CardDescription>Showcase current active students</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ActiveStudentsManager />
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="previous">
                  <Card>
                    <CardHeader>
                      <CardTitle>Previous Student Leaders</CardTitle>
                      <CardDescription>Manage alumni student leaders</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <PreviousLeadersManager />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </TabsContent>

            <TabsContent value="admissions">
              <Card>
                <CardHeader>
                  <CardTitle>Required Documents</CardTitle>
                  <CardDescription>Manage admission required documents list</CardDescription>
                </CardHeader>
                <CardContent>
                  <RequiredDocumentsManager />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="contact">
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                  <CardDescription>Manage school contact details and social media</CardDescription>
                </CardHeader>
                <CardContent>
                  <ContactInfoManager />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Tabs defaultValue="approvals">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="approvals">Approvals</TabsTrigger>
              <TabsTrigger value="staff">Staff</TabsTrigger>
              <TabsTrigger value="roles">Roles</TabsTrigger>
            </TabsList>

            <TabsContent value="approvals">
              <Card>
                <CardHeader>
                  <CardTitle>Pending Approvals</CardTitle>
                </CardHeader>
                <CardContent>
                  <UserApprovalTable />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="staff">
              <Card>
                <CardHeader>
                  <CardTitle>Staff Registry</CardTitle>
                </CardHeader>
                <CardContent>
                  <StaffRegistryManager />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="roles">
              <Card>
                <CardHeader>
                  <CardTitle>Role Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <RoleManagement />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.pendingApprovals || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Staff</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalStaff || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Students</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.activeStudents || 0}</div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="ownership">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="ownership">Ownership</TabsTrigger>
              <TabsTrigger value="audit">Audit Logs</TabsTrigger>
            </TabsList>

            <TabsContent value="ownership">
              <Card>
                <CardHeader>
                  <CardTitle>Transfer Super Admin Ownership</CardTitle>
                </CardHeader>
                <CardContent>
                  <OwnershipTransfer />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="audit">
              <Card>
                <CardHeader>
                  <CardTitle>Audit Logs</CardTitle>
                </CardHeader>
                <CardContent>
                  <AuditLogs />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SuperAdminDashboard;
