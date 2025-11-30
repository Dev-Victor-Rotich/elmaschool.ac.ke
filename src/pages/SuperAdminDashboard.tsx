import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, Shield, Activity, LogOut, Menu } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";

// Content Managers
import HomeContentManager from "./admin/HomeContentManager";
import AboutContentManager from "./admin/AboutContentManager";
import { SubjectsManager } from "@/components/admin/SubjectsManager";
import { DepartmentsManager } from "@/components/admin/DepartmentsManager";
import { DepartmentStaffManager } from "@/components/admin/DepartmentStaffManager";
import { LeadershipProgramsManager } from "@/components/admin/LeadershipProgramsManager";
import { ProgramMembersManager } from "@/components/admin/ProgramMembersManager";
import { StudentAmbassadorManager } from "@/components/admin/StudentAmbassadorManager";
import { ClubsSocietiesManager } from "@/components/admin/ClubsSocietiesManager";
import { BeyondClassroomManager } from "@/components/admin/BeyondClassroomManager";
import { PreviousLeadersManager } from "@/components/admin/PreviousLeadersManager";
import { RequiredDocumentsManager } from "@/components/admin/RequiredDocumentsManager";
import { ContactInfoManager } from "@/components/admin/ContactInfoManager";
import { GalleryManager } from "@/components/admin/GalleryManager";
import { AdmissionLettersManager } from "@/components/admin/AdmissionLettersManager";
import { DutyRosterManager } from "@/components/admin/DutyRosterManager";
import SchoolOccasionsManager from "@/components/admin/SchoolOccasionsManager";
import { EventsManager } from "@/components/admin/EventsManager";

// User Management
import { RoleManagement } from "@/components/admin/RoleManagement";
import { StudentRegistryManager } from "@/components/admin/StudentRegistryManager";
import { HODDepartmentAssignment } from "@/components/admin/HODDepartmentAssignment";
import { AuditLogs } from "@/components/admin/AuditLogs";
import { OwnershipTransfer } from "@/components/admin/OwnershipTransfer";

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  useSessionTimeout();

  const currentHash = location.hash || "#dashboard";

  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      // Get total users count from user_roles (all users with assigned roles)
      const { data: allRoles } = await supabase
        .from('user_roles')
        .select('user_id');
      
      const uniqueUserIds = new Set(allRoles?.map(r => r.user_id) || []);
      const totalUsers = uniqueUserIds.size;

      // Get pending approvals count from profiles
      const { count: pendingApprovals } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('approval_status', 'pending');

      // Get staff members count from user_roles (staff roles only)
      const { data: staffRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .in('role', ['super_admin', 'admin', 'bursar', 'chaplain', 'hod', 'teacher', 'librarian', 'classteacher']);
      
      const uniqueStaffIds = new Set(staffRoles?.map(r => r.user_id) || []);
      const staffCount = uniqueStaffIds.size;

      // Get students count (approved students only)
      const { count: studentsCount } = await supabase
        .from('students_data')
        .select('*', { count: 'exact', head: true })
        .eq('approval_status', 'approved');

      return {
        totalUsers,
        pendingApprovals: pendingApprovals || 0,
        totalStaff: staffCount,
        activeStudents: studentsCount || 0
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
    toast.success("Logged out successfully");
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-background via-background to-primary/5">
        <AdminSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-16 items-center gap-4 px-6">
              <SidebarTrigger className="-ml-2">
                <Menu className="h-5 w-5" />
              </SidebarTrigger>
              
              <div className="flex-1">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  SuperAdmin Dashboard
                </h1>
                <p className="text-sm text-muted-foreground">Manage your school's digital presence</p>
              </div>

              <Button variant="outline" onClick={handleLogout} className="gap-2">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto p-6">
            {/* Dashboard Overview */}
            {currentHash === "#dashboard" && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h2 className="text-3xl font-bold mb-2">Dashboard Overview</h2>
                  <p className="text-muted-foreground">Quick stats and system overview</p>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                  <Card
                    className="shadow-soft hover:shadow-hover transition-smooth cursor-pointer"
                    onClick={() => navigate(`${location.pathname}#users`)}
                  >
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                      <Users className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{stats?.totalUsers || 0}</div>
                      <p className="text-xs text-muted-foreground mt-1">Registered accounts</p>
                    </CardContent>
                  </Card>

                  <Card
                    className="shadow-soft hover:shadow-hover transition-smooth cursor-pointer"
                    onClick={() => navigate(`${location.pathname}#users`)}
                  >
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                      <UserCheck className="h-4 w-4 text-secondary" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{stats?.pendingApprovals || 0}</div>
                      <p className="text-xs text-muted-foreground mt-1">Awaiting review</p>
                    </CardContent>
                  </Card>

                  <Card
                    className="shadow-soft hover:shadow-hover transition-smooth cursor-pointer"
                    onClick={() => navigate(`${location.pathname}#users`)}
                  >
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Staff Members</CardTitle>
                      <Shield className="h-4 w-4 text-accent" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{stats?.totalStaff || 0}</div>
                      <p className="text-xs text-muted-foreground mt-1">Active staff</p>
                    </CardContent>
                  </Card>

                  <Card
                    className="shadow-soft hover:shadow-hover transition-smooth cursor-pointer"
                    onClick={() => navigate(`${location.pathname}#users`)}
                  >
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Students</CardTitle>
                      <Activity className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{stats?.activeStudents || 0}</div>
                      <p className="text-xs text-muted-foreground mt-1">Enrolled students</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Home Page Content */}
            {currentHash === "#home" && (
              <div className="space-y-8 animate-fadeIn">
                <div>
                  <h2 className="text-3xl font-bold mb-2">Home Page Management</h2>
                  <p className="text-muted-foreground">Manage hero section, features, and homepage content</p>
                </div>
                <HomeContentManager />
                <DutyRosterManager />
                <SchoolOccasionsManager />
              </div>
            )}

            {/* About Page Content */}
            {currentHash === "#about" && (
              <div className="space-y-8 animate-fadeIn">
                <div>
                  <h2 className="text-3xl font-bold mb-2">About Page Management</h2>
                  <p className="text-muted-foreground">Manage principal message, facilities, and alumni</p>
                </div>
                <AboutContentManager />
              </div>
            )}

            {/* Programs Content */}
            {currentHash === "#programs" && (
              <div className="space-y-8 animate-fadeIn">
                <div>
                  <h2 className="text-3xl font-bold mb-2">Programs Management</h2>
                  <p className="text-muted-foreground">Manage subjects, departments, and leadership programs</p>
                </div>
                
                <Card className="shadow-soft">
                  <CardHeader>
                    <CardTitle>Subjects</CardTitle>
                    <CardDescription>Manage academic subjects offered</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <SubjectsManager />
                  </CardContent>
                </Card>

                <Card className="shadow-soft">
                  <CardHeader>
                    <CardTitle>Departments</CardTitle>
                    <CardDescription>Manage academic departments</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <DepartmentsManager />
                  </CardContent>
                </Card>

                <Card className="shadow-soft">
                  <CardHeader>
                    <CardTitle>Department Staff</CardTitle>
                    <CardDescription>Manage HODs and department staff members</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <DepartmentStaffManager />
                  </CardContent>
                </Card>

                <Card className="shadow-soft">
                  <CardHeader>
                    <CardTitle>Leadership Programs</CardTitle>
                    <CardDescription>Manage student leadership programs</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <LeadershipProgramsManager />
                  </CardContent>
                </Card>

                <Card className="shadow-soft">
                  <CardHeader>
                    <CardTitle>Student Leaders</CardTitle>
                    <CardDescription>Manage school president and council members</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ProgramMembersManager />
                  </CardContent>
                </Card>

                <Card className="shadow-soft">
                  <CardHeader>
                    <CardTitle>Beyond the Classroom</CardTitle>
                    <CardDescription>Manage extracurricular activities and programs</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <BeyondClassroomManager />
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Student Voice Content */}
            {currentHash === "#student" && (
              <div className="space-y-8 animate-fadeIn">
                <div>
                  <h2 className="text-3xl font-bold mb-2">Student Voice Management</h2>
                  <p className="text-muted-foreground">Manage student ambassador, clubs, and achievements</p>
                </div>

                <Card className="shadow-soft">
                  <CardHeader>
                    <CardTitle>Student Ambassador</CardTitle>
                    <CardDescription>Manage featured student ambassador</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <StudentAmbassadorManager />
                  </CardContent>
                </Card>


                <Card className="shadow-soft">
                  <CardHeader>
                    <CardTitle>Clubs & Societies</CardTitle>
                    <CardDescription>Manage student clubs and societies</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ClubsSocietiesManager />
                  </CardContent>
                </Card>

                <Card className="shadow-soft">
                  <CardHeader>
                    <CardTitle>Previous Student Leaders</CardTitle>
                    <CardDescription>Manage alumni student leaders</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <PreviousLeadersManager />
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Admissions Content */}
            {currentHash === "#admissions" && (
              <div className="space-y-8 animate-fadeIn">
                <div>
                  <h2 className="text-3xl font-bold mb-2">Admissions Management</h2>
                  <p className="text-muted-foreground">Manage admission requirements and documents</p>
                </div>
                
                <Card className="shadow-soft">
                  <CardHeader>
                    <CardTitle>Admission Letters</CardTitle>
                    <CardDescription>Manage admission letters for students</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <AdmissionLettersManager />
                  </CardContent>
                </Card>

                <Card className="shadow-soft">
                  <CardHeader>
                    <CardTitle>Required Documents</CardTitle>
                    <CardDescription>Manage documents required for admission</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RequiredDocumentsManager />
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Gallery Content */}
            {currentHash === "#gallery" && (
              <div className="space-y-8 animate-fadeIn">
                <div>
                  <h2 className="text-3xl font-bold mb-2">Gallery Management</h2>
                  <p className="text-muted-foreground">Manage photos and media gallery</p>
                </div>
                <GalleryManager />
              </div>
            )}

            {/* Contact Content */}
            {currentHash === "#contact" && (
              <div className="space-y-8 animate-fadeIn">
                <div>
                  <h2 className="text-3xl font-bold mb-2">Contact Information</h2>
                  <p className="text-muted-foreground">Manage school contact details and social media</p>
                </div>
                <ContactInfoManager />
              </div>
            )}

            {/* Events Management */}
            {currentHash === "#events" && (
              <div className="space-y-8 animate-fadeIn">
                <div>
                  <h2 className="text-3xl font-bold mb-2">Events Management</h2>
                  <p className="text-muted-foreground">Manage school events and calendar</p>
                </div>
                <EventsManager />
              </div>
            )}

            {/* Users Management */}
            {currentHash === "#users" && (
              <div className="space-y-8 animate-fadeIn">
                <div>
                  <h2 className="text-3xl font-bold mb-2">User Management</h2>
                  <p className="text-muted-foreground">Manage users, roles, and permissions</p>
                </div>

                <Card className="shadow-soft">
                  <CardHeader>
                    <CardTitle>Role Management & User Approvals</CardTitle>
                    <CardDescription>Add users, assign roles, and approve registrations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RoleManagement />
                  </CardContent>
                </Card>

                <Card className="shadow-soft">
                  <CardHeader>
                    <CardTitle>Student Registry</CardTitle>
                    <CardDescription>Add student details to registry</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <StudentRegistryManager />
                  </CardContent>
                </Card>

                <Card className="shadow-soft">
                  <CardHeader>
                    <CardTitle>HOD Department Assignments</CardTitle>
                    <CardDescription>Assign Heads of Department to their departments</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <HODDepartmentAssignment />
                  </CardContent>
                </Card>
              </div>
            )}

            {/* System Management */}
            {currentHash === "#system" && (
              <div className="space-y-8 animate-fadeIn">
                <div>
                  <h2 className="text-3xl font-bold mb-2">System Settings</h2>
                  <p className="text-muted-foreground">Manage system settings and audit logs</p>
                </div>

                <Card className="shadow-soft">
                  <CardHeader>
                    <CardTitle>Audit Logs</CardTitle>
                    <CardDescription>View system activity and changes</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <AuditLogs />
                  </CardContent>
                </Card>

                <Card className="shadow-soft">
                  <CardHeader>
                    <CardTitle>Ownership Transfer</CardTitle>
                    <CardDescription>Transfer super admin ownership</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <OwnershipTransfer />
                  </CardContent>
                </Card>
              </div>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default SuperAdminDashboard;
