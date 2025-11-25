import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, Quote, CalendarDays, MessageSquare, FileText, LogOut } from "lucide-react";
import { toast } from "sonner";

const ChaplainPortal = () => {
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

    if (!roles || !roles.some(r => r.role === "chaplain")) {
      toast.error("Access denied. Chaplain role required.");
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
            <h1 className="text-4xl font-bold">Chaplain Portal</h1>
            <p className="text-muted-foreground mt-2">Mentorship & Spiritual Guidance</p>
          </div>
          <Button onClick={handleLogout} variant="outline">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        <Tabs defaultValue="mentorship" className="space-y-4">
          <TabsList>
            <TabsTrigger value="mentorship">
              <Heart className="w-4 h-4 mr-2" />
              Mentorship
            </TabsTrigger>
            <TabsTrigger value="quotes">
              <Quote className="w-4 h-4 mr-2" />
              Quotes & Reflections
            </TabsTrigger>
            <TabsTrigger value="events">
              <CalendarDays className="w-4 h-4 mr-2" />
              Events
            </TabsTrigger>
            <TabsTrigger value="messages">
              <MessageSquare className="w-4 h-4 mr-2" />
              Messages
            </TabsTrigger>
            <TabsTrigger value="reports">
              <FileText className="w-4 h-4 mr-2" />
              Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="mentorship">
            <Card>
              <CardHeader>
                <CardTitle>Mentorship Programs</CardTitle>
                <CardDescription>Manage counseling sessions and student welfare</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">Schedule and track mentorship sessions with students.</p>
                <Button>Schedule Session</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quotes">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Quotes & Reflections</CardTitle>
                <CardDescription>Post inspirational messages for students</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">Share inspirational quotes with the school community.</p>
                <Button>Add New Quote</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events">
            <Card>
              <CardHeader>
                <CardTitle>Spiritual Events</CardTitle>
                <CardDescription>Organize and manage chaplaincy events</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">Create and manage spiritual events and activities.</p>
                <Button>Create Event</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages">
            <Card>
              <CardHeader>
                <CardTitle>Student Communication</CardTitle>
                <CardDescription>Message students and parents</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">Send messages and updates to students and parents.</p>
                <Button>Compose Message</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>Welfare Reports</CardTitle>
                <CardDescription>Track mentorship sessions and student welfare</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">Generate welfare and mentorship reports.</p>
                <Button>Generate Report</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ChaplainPortal;