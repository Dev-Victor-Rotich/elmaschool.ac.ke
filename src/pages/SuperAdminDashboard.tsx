import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Home, Users, Phone, LogOut, BookOpen, Award, Video, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import HomeContentManager from "./admin/HomeContentManager";
import AboutContentManager from "./admin/AboutContentManager";
import { SubjectsManager } from "@/components/admin/SubjectsManager";
import { DepartmentsManager } from "@/components/admin/DepartmentsManager";
import { LeadershipProgramsManager } from "@/components/admin/LeadershipProgramsManager";
import { StudentAmbassadorManager } from "@/components/admin/StudentAmbassadorManager";
import { ActiveStudentsManager } from "@/components/admin/ActiveStudentsManager";
import { ClubsSocietiesManager } from "@/components/admin/ClubsSocietiesManager";
import { BeyondClassroomManager } from "@/components/admin/BeyondClassroomManager";
import { RequiredDocumentsManager } from "@/components/admin/RequiredDocumentsManager";
import { UserApprovalTable } from "@/components/admin/UserApprovalTable";
import { RoleManagement } from "@/components/admin/RoleManagement";
import { StaffRegistryManager } from "@/components/admin/StaffRegistryManager";
import { AuditLogs } from "@/components/admin/AuditLogs";
import { OwnershipTransfer } from "@/components/admin/OwnershipTransfer";
import { ContactInfoManager } from "@/components/admin/ContactInfoManager";

const SuperAdminDashboard = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <h1 className="text-2xl font-bold">SuperAdmin Dashboard</h1>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      <div className="container py-8">
        <Tabs defaultValue="home" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 gap-2">
            <TabsTrigger value="home">
              <Home className="h-4 w-4 mr-2" />
              Home
            </TabsTrigger>
            <TabsTrigger value="about">
              <BookOpen className="h-4 w-4 mr-2" />
              About
            </TabsTrigger>
            <TabsTrigger value="programs">
              <Award className="h-4 w-4 mr-2" />
              Programs
            </TabsTrigger>
            <TabsTrigger value="student">
              <Video className="h-4 w-4 mr-2" />
              Student Voice
            </TabsTrigger>
            <TabsTrigger value="admissions">
              <FileText className="h-4 w-4 mr-2" />
              Admissions
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="h-4 w-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="contact">
              <Phone className="h-4 w-4 mr-2" />
              Contact
            </TabsTrigger>
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
                <TabsTrigger value="leadership">Leadership Programs</TabsTrigger>
              </TabsList>

              <TabsContent value="subjects">
                <SubjectsManager />
              </TabsContent>

              <TabsContent value="departments">
                <DepartmentsManager />
              </TabsContent>

              <TabsContent value="leadership">
                <LeadershipProgramsManager />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="student">
            <Tabs defaultValue="ambassador" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="ambassador">Student Ambassador</TabsTrigger>
                <TabsTrigger value="active">Active Students</TabsTrigger>
                <TabsTrigger value="clubs">Clubs & Societies</TabsTrigger>
                <TabsTrigger value="beyond">Beyond Classroom</TabsTrigger>
              </TabsList>

              <TabsContent value="ambassador">
                <StudentAmbassadorManager />
              </TabsContent>

              <TabsContent value="active">
                <ActiveStudentsManager />
              </TabsContent>

              <TabsContent value="clubs">
                <ClubsSocietiesManager />
              </TabsContent>

              <TabsContent value="beyond">
                <BeyondClassroomManager />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="admissions">
            <RequiredDocumentsManager />
          </TabsContent>

          <TabsContent value="users">
            <Tabs defaultValue="approval" className="space-y-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="approval">Approve Users</TabsTrigger>
                <TabsTrigger value="roles">Assign Roles</TabsTrigger>
                <TabsTrigger value="staff">Staff Registry</TabsTrigger>
                <TabsTrigger value="audit">Audit Logs</TabsTrigger>
                <TabsTrigger value="transfer">Ownership Transfer</TabsTrigger>
              </TabsList>

              <TabsContent value="approval">
                <UserApprovalTable />
              </TabsContent>

              <TabsContent value="roles">
                <RoleManagement />
              </TabsContent>

              <TabsContent value="staff">
                <StaffRegistryManager />
              </TabsContent>

              <TabsContent value="audit">
                <AuditLogs />
              </TabsContent>

              <TabsContent value="transfer">
                <OwnershipTransfer />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="contact">
            <ContactInfoManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
