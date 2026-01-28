import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Megaphone, MessageSquare, FileText, LogOut, Edit } from "lucide-react";
import { toast } from "sonner";

// Content managers - reusing existing components
import { HeroContentManager } from "@/components/admin/HeroContentManager";
import { HomeFeaturesManager } from "@/components/admin/HomeFeaturesManager";
import { SiteStatsManager } from "@/components/admin/SiteStatsManager";
import { TrustBadgesManager } from "@/components/admin/TrustBadgesManager";
import { EventsManager } from "@/components/admin/EventsManager";
import { TestimonialsManager } from "@/components/admin/TestimonialsManager";
import { FAQsManager } from "@/components/admin/FAQsManager";
import { GalleryManager } from "@/components/admin/GalleryManager";
import { LeadershipProgramsManager } from "@/components/admin/LeadershipProgramsManager";
import { ProgramMembersManager } from "@/components/admin/ProgramMembersManager";
import { ClubsSocietiesManager } from "@/components/admin/ClubsSocietiesManager";
import { BeyondClassroomManager } from "@/components/admin/BeyondClassroomManager";
import { StudentAmbassadorManager } from "@/components/admin/StudentAmbassadorManager";
import { PreviousLeadersManager } from "@/components/admin/PreviousLeadersManager";

const ClassRepPortal = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      navigate("/auth");
      return;
    }

    // If super admin is impersonating a class rep, bypass role checks
    const impersonationRaw = localStorage.getItem("impersonation");
    const impersonation = impersonationRaw ? JSON.parse(impersonationRaw) : null;

    if (!impersonation) {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);

      if (!roles || !roles.some((r) => r.role === "class_rep")) {
        toast.error("Access denied. Class Rep role required.");
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

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">Class Rep Portal</h1>
            <p className="text-muted-foreground mt-2">Student Leadership &amp; Representation</p>
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
            <TabsTrigger value="content">
              <Edit className="w-4 h-4 mr-2" />
              Website Content
            </TabsTrigger>
          </TabsList>

          <TabsContent value="announcements">
            <Card>
              <CardHeader>
                <CardTitle>Class Announcements</CardTitle>
                <CardDescription>Post announcements for your classmates</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">Create and share announcements with your class.</p>
                <Button>Create Announcement</Button>
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
                <p className="text-muted-foreground mb-4">Share student concerns and feedback with teachers.</p>
                <Button>Submit Feedback</Button>
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
                <p className="text-muted-foreground mb-4">
                  Send messages to your class teacher and school administration.
                </p>
                <Button>Compose Message</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content">
            <WebsiteContentSection />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// Website Content Section for Class Reps
const WebsiteContentSection = () => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle>Website Content Management</CardTitle>
        <CardDescription>
          Edit content for Home Page, Programs, Student Voice, and Gallery sections
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="home" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="home">Home Page</TabsTrigger>
            <TabsTrigger value="programs">Programs</TabsTrigger>
            <TabsTrigger value="student">Student Voice</TabsTrigger>
            <TabsTrigger value="gallery">Gallery</TabsTrigger>
          </TabsList>

          <TabsContent value="home">
            <HomePageContent />
          </TabsContent>

          <TabsContent value="programs">
            <ProgramsContent />
          </TabsContent>

          <TabsContent value="student">
            <StudentVoiceContent />
          </TabsContent>

          <TabsContent value="gallery">
            <GalleryContent />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  </div>
);

// Home Page Content
const HomePageContent = () => (
  <Tabs defaultValue="hero" className="space-y-4">
    <TabsList className="flex flex-wrap">
      <TabsTrigger value="hero">Hero</TabsTrigger>
      <TabsTrigger value="features">Features</TabsTrigger>
      <TabsTrigger value="stats">Stats</TabsTrigger>
      <TabsTrigger value="badges">Badges</TabsTrigger>
      <TabsTrigger value="events">Events</TabsTrigger>
      <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
      <TabsTrigger value="faqs">FAQs</TabsTrigger>
    </TabsList>

    <TabsContent value="hero"><HeroContentManager /></TabsContent>
    <TabsContent value="features"><HomeFeaturesManager /></TabsContent>
    <TabsContent value="stats"><SiteStatsManager /></TabsContent>
    <TabsContent value="badges"><TrustBadgesManager /></TabsContent>
    <TabsContent value="events"><EventsManager /></TabsContent>
    <TabsContent value="testimonials"><TestimonialsManager /></TabsContent>
    <TabsContent value="faqs"><FAQsManager /></TabsContent>
  </Tabs>
);

// Programs Content
const ProgramsContent = () => (
  <Tabs defaultValue="leadership" className="space-y-4">
    <TabsList>
      <TabsTrigger value="leadership">Leadership</TabsTrigger>
      <TabsTrigger value="members">Members</TabsTrigger>
      <TabsTrigger value="clubs">Clubs</TabsTrigger>
      <TabsTrigger value="beyond">Beyond Classroom</TabsTrigger>
    </TabsList>

    <TabsContent value="leadership"><LeadershipProgramsManager /></TabsContent>
    <TabsContent value="members"><ProgramMembersManager /></TabsContent>
    <TabsContent value="clubs"><ClubsSocietiesManager /></TabsContent>
    <TabsContent value="beyond"><BeyondClassroomManager /></TabsContent>
  </Tabs>
);

// Student Voice Content
const StudentVoiceContent = () => (
  <Tabs defaultValue="ambassador" className="space-y-4">
    <TabsList>
      <TabsTrigger value="ambassador">Ambassador</TabsTrigger>
      <TabsTrigger value="previous">Previous Leaders</TabsTrigger>
    </TabsList>

    <TabsContent value="ambassador"><StudentAmbassadorManager /></TabsContent>
    <TabsContent value="previous"><PreviousLeadersManager /></TabsContent>
  </Tabs>
);

// Gallery Content
const GalleryContent = () => <GalleryManager />;

export default ClassRepPortal;
