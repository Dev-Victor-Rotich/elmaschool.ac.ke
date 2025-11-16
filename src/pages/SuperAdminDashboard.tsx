import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Home, Users, Phone, LogOut, BookOpen, Award, Video, FileText, GraduationCap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import HomeContentManager from "./admin/HomeContentManager";
import AboutContentManager from "./admin/AboutContentManager";

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
            <Card>
              <CardHeader>
                <CardTitle>Programs & CBC Content</CardTitle>
                <CardDescription>Coming soon - Manage programs, subjects, departments</CardDescription>
              </CardHeader>
            </Card>
          </TabsContent>

          <TabsContent value="student">
            <Card>
              <CardHeader>
                <CardTitle>Student Voice Content</CardTitle>
                <CardDescription>Coming soon - Manage student ambassador, videos, clubs</CardDescription>
              </CardHeader>
            </Card>
          </TabsContent>

          <TabsContent value="admissions">
            <Card>
              <CardHeader>
                <CardTitle>Admissions Management</CardTitle>
                <CardDescription>Coming soon - Manage admission requests and letters</CardDescription>
              </CardHeader>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Coming soon - Manage user registrations</CardDescription>
              </CardHeader>
            </Card>
          </TabsContent>

          <TabsContent value="contact">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>Coming soon - Update contact details</CardDescription>
              </CardHeader>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
