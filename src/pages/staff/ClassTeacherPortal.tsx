import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, ClipboardCheck, AlertCircle, MessageSquare, FileText, LogOut } from "lucide-react";
import { toast } from "sonner";

const ClassTeacherPortal = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id);

    if (!roles || !roles.some(r => r.role === "classteacher")) {
      toast.error("Access denied. Class Teacher role required.");
      navigate("/auth");
      return;
    }

    setLoading(false);
  };

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
            <h1 className="text-4xl font-bold">Class Teacher Portal</h1>
            <p className="text-muted-foreground mt-2">Manage your class</p>
          </div>
          <Button onClick={handleLogout} variant="outline">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attendance Today</CardTitle>
              <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0%</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="students" className="space-y-4">
          <TabsList>
            <TabsTrigger value="students">
              <Users className="w-4 h-4 mr-2" />
              My Class
            </TabsTrigger>
            <TabsTrigger value="attendance">
              <ClipboardCheck className="w-4 h-4 mr-2" />
              Attendance
            </TabsTrigger>
            <TabsTrigger value="discipline">
              <AlertCircle className="w-4 h-4 mr-2" />
              Discipline
            </TabsTrigger>
            <TabsTrigger value="communication">
              <MessageSquare className="w-4 h-4 mr-2" />
              Communication
            </TabsTrigger>
            <TabsTrigger value="reports">
              <FileText className="w-4 h-4 mr-2" />
              Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="students">
            <Card>
              <CardHeader>
                <CardTitle>Class Students</CardTitle>
                <CardDescription>View and manage student profiles</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Student list coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attendance">
            <Card>
              <CardHeader>
                <CardTitle>Attendance Management</CardTitle>
                <CardDescription>Mark and view attendance records</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Attendance features coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="discipline">
            <Card>
              <CardHeader>
                <CardTitle>Discipline & Remarks</CardTitle>
                <CardDescription>Manage discipline records and remarks</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Discipline management coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="communication">
            <Card>
              <CardHeader>
                <CardTitle>Communication</CardTitle>
                <CardDescription>Message parents and teachers</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Messaging features coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>Class Reports</CardTitle>
                <CardDescription>Generate and view class performance reports</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Reports coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ClassTeacherPortal;