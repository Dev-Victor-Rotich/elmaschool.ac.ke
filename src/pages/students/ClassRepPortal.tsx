import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Megaphone, MessageSquare, FileText, LogOut } from "lucide-react";
import { toast } from "sonner";

const ClassRepPortal = () => {
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

    if (!roles || !roles.some(r => r.role === "class_rep")) {
      toast.error("Access denied. Class Rep role required.");
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
            <h1 className="text-4xl font-bold">Class Rep Portal</h1>
            <p className="text-muted-foreground mt-2">Student Leadership & Representation</p>
          </div>
          <Button onClick={handleLogout} variant="outline">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        <Tabs defaultValue="announcements" className="space-y-4">
          <TabsList>
            <TabsTrigger value="announcements">
              <Megaphone className="w-4 h-4 mr-2" />
              Announcements
            </TabsTrigger>
            <TabsTrigger value="feedback">
              <FileText className="w-4 h-4 mr-2" />
              Feedback
            </TabsTrigger>
            <TabsTrigger value="messages">
              <MessageSquare className="w-4 h-4 mr-2" />
              Messages
            </TabsTrigger>
          </TabsList>

          <TabsContent value="announcements">
            <Card>
              <CardHeader>
                <CardTitle>Class Announcements</CardTitle>
                <CardDescription>Post announcements for your classmates</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Announcement features coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="feedback">
            <Card>
              <CardHeader>
                <CardTitle>Student Feedback</CardTitle>
                <CardDescription>Submit feedback and concerns to teachers</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Feedback submission coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages">
            <Card>
              <CardHeader>
                <CardTitle>Communication</CardTitle>
                <CardDescription>Message class teacher and admin</CardDescription>
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

export default ClassRepPortal;