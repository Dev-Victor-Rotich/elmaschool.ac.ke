import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, BookOpen, BarChart3, LogOut, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

const HODPortal = () => {
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

    if (!roles || !roles.some(r => r.role === "hod")) {
      toast.error("Access denied. HOD role required.");
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
            <h1 className="text-4xl font-bold">HOD Portal</h1>
            <p className="text-muted-foreground mt-2">Head of Department Dashboard</p>
          </div>
          <Button onClick={handleLogout} variant="outline">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        <Tabs defaultValue="teachers" className="space-y-4">
          <TabsList>
            <TabsTrigger value="teachers">
              <Users className="w-4 h-4 mr-2" />
              Manage Teachers
            </TabsTrigger>
            <TabsTrigger value="results">
              <BookOpen className="w-4 h-4 mr-2" />
              Department Results
            </TabsTrigger>
            <TabsTrigger value="reports">
              <BarChart3 className="w-4 h-4 mr-2" />
              Reports
            </TabsTrigger>
            <TabsTrigger value="communication">
              <MessageSquare className="w-4 h-4 mr-2" />
              Messages
            </TabsTrigger>
          </TabsList>

          <TabsContent value="teachers">
            <Card>
              <CardHeader>
                <CardTitle>Department Teachers</CardTitle>
                <CardDescription>Manage teachers and subject allocation</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Teacher management features coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results">
            <Card>
              <CardHeader>
                <CardTitle>Department Results</CardTitle>
                <CardDescription>Review and approve student marks</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Results approval features coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>Department Analytics</CardTitle>
                <CardDescription>View performance reports and statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Analytics features coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="communication">
            <Card>
              <CardHeader>
                <CardTitle>Communication</CardTitle>
                <CardDescription>Message teachers and admin</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Messaging features coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default HODPortal;