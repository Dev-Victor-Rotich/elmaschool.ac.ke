import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider } from "@/components/ui/sidebar";
import { StudentContentSidebar } from "@/components/students/StudentContentSidebar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Menu } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
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

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const StudentContentDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("home");

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    // Handle hash-based routing
    const hash = location.hash.replace("#", "");
    if (hash && ["home", "programs", "student", "gallery"].includes(hash)) {
      setActiveSection(hash);
    }
  }, [location.hash]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      navigate("/auth");
      return;
    }

    // Check for impersonation (super admin bypass)
    const impersonationRaw = localStorage.getItem("impersonation");
    const impersonation = impersonationRaw ? JSON.parse(impersonationRaw) : null;

    if (impersonation) {
      // Super admin impersonating - allow access
      setLoading(false);
      return;
    }

    // Check if user has student_leader or class_rep role
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id);

    const hasContentEditRole = roles?.some(
      (r) => r.role === "student_leader" || r.role === "class_rep" || r.role === "super_admin"
    );

    if (!hasContentEditRole) {
      toast.error("Access denied. Student Leader or Class Rep role required.");
      navigate("/students/portal");
      return;
    }

    setLoading(false);
  };

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    window.location.hash = section;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <StudentContentSidebar 
          activeSection={activeSection} 
          onSectionChange={handleSectionChange}
        />

        <main className="flex-1 overflow-auto">
          <header className="border-b bg-card px-4 sm:px-6 py-4">
            <div className="flex items-center gap-2 sm:gap-4">
              <SidebarTrigger className="h-8 w-8 shrink-0" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Back</span>
              </Button>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold truncate">Website Content Management</h1>
                <p className="text-muted-foreground text-xs sm:text-sm hidden sm:block">
                  Manage Home, Programs, Student Voice, and Gallery sections
                </p>
              </div>
            </div>
          </header>

          <div className="p-6">
            {activeSection === "home" && <HomePageContent />}
            {activeSection === "programs" && <ProgramsContent />}
            {activeSection === "student" && <StudentVoiceContent />}
            {activeSection === "gallery" && <GalleryContent />}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

// Home Page Content Section
const HomePageContent = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-xl font-semibold">Home Page</h2>
      <p className="text-muted-foreground">
        Manage hero section, features, stats, badges, events, testimonials, and FAQs
      </p>
    </div>

    <Tabs defaultValue="hero" className="space-y-4">
      <TabsList className="inline-flex h-10 items-center gap-1 overflow-x-auto w-full max-w-full scrollbar-hide pb-1">
        <TabsTrigger value="hero" className="shrink-0">Hero</TabsTrigger>
        <TabsTrigger value="features" className="shrink-0">Features</TabsTrigger>
        <TabsTrigger value="stats" className="shrink-0">Stats</TabsTrigger>
        <TabsTrigger value="badges" className="shrink-0">Badges</TabsTrigger>
        <TabsTrigger value="events" className="shrink-0">Events</TabsTrigger>
        <TabsTrigger value="testimonials" className="shrink-0">Testimonials</TabsTrigger>
        <TabsTrigger value="faqs" className="shrink-0">FAQs</TabsTrigger>
      </TabsList>

      <TabsContent value="hero">
        <Card>
          <CardHeader>
            <CardTitle>Hero Section</CardTitle>
            <CardDescription>Main banner displayed on the homepage</CardDescription>
          </CardHeader>
          <CardContent>
            <HeroContentManager />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="features">
        <Card>
          <CardHeader>
            <CardTitle>Home Features</CardTitle>
            <CardDescription>Key features displayed on homepage</CardDescription>
          </CardHeader>
          <CardContent>
            <HomeFeaturesManager />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="stats">
        <Card>
          <CardHeader>
            <CardTitle>Site Statistics</CardTitle>
            <CardDescription>Animated counters shown on homepage</CardDescription>
          </CardHeader>
          <CardContent>
            <SiteStatsManager />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="badges">
        <Card>
          <CardHeader>
            <CardTitle>Trust Badges</CardTitle>
            <CardDescription>Trust indicators displayed below hero</CardDescription>
          </CardHeader>
          <CardContent>
            <TrustBadgesManager />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="events">
        <Card>
          <CardHeader>
            <CardTitle>Events</CardTitle>
            <CardDescription>School events displayed on homepage</CardDescription>
          </CardHeader>
          <CardContent>
            <EventsManager />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="testimonials">
        <Card>
          <CardHeader>
            <CardTitle>Community Testimonials</CardTitle>
            <CardDescription>Testimonials from parents and community</CardDescription>
          </CardHeader>
          <CardContent>
            <TestimonialsManager />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="faqs">
        <Card>
          <CardHeader>
            <CardTitle>FAQs</CardTitle>
            <CardDescription>Frequently Asked Questions</CardDescription>
          </CardHeader>
          <CardContent>
            <FAQsManager />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  </div>
);

// Programs Content Section
const ProgramsContent = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-xl font-semibold">Programs</h2>
      <p className="text-muted-foreground">
        Manage leadership programs, clubs, and extracurricular activities
      </p>
    </div>

    <Tabs defaultValue="leadership" className="space-y-4">
      <TabsList>
        <TabsTrigger value="leadership">Leadership Programs</TabsTrigger>
        <TabsTrigger value="members">Program Members</TabsTrigger>
        <TabsTrigger value="clubs">Clubs & Societies</TabsTrigger>
        <TabsTrigger value="beyond">Beyond Classroom</TabsTrigger>
      </TabsList>

      <TabsContent value="leadership">
        <Card>
          <CardHeader>
            <CardTitle>Leadership Programs</CardTitle>
            <CardDescription>Student leadership and development programs</CardDescription>
          </CardHeader>
          <CardContent>
            <LeadershipProgramsManager />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="members">
        <Card>
          <CardHeader>
            <CardTitle>Program Members</CardTitle>
            <CardDescription>Members of leadership programs</CardDescription>
          </CardHeader>
          <CardContent>
            <ProgramMembersManager />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="clubs">
        <Card>
          <CardHeader>
            <CardTitle>Clubs & Societies</CardTitle>
            <CardDescription>Student clubs and organizations</CardDescription>
          </CardHeader>
          <CardContent>
            <ClubsSocietiesManager />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="beyond">
        <Card>
          <CardHeader>
            <CardTitle>Beyond Classroom</CardTitle>
            <CardDescription>Extracurricular activities and achievements</CardDescription>
          </CardHeader>
          <CardContent>
            <BeyondClassroomManager />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  </div>
);

// Student Voice Content Section
const StudentVoiceContent = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-xl font-semibold">Student Voice</h2>
      <p className="text-muted-foreground">
        Manage student ambassador and previous student leaders
      </p>
    </div>

    <Tabs defaultValue="ambassador" className="space-y-4">
      <TabsList>
        <TabsTrigger value="ambassador">Student Ambassador</TabsTrigger>
        <TabsTrigger value="previous">Previous Leaders</TabsTrigger>
      </TabsList>

      <TabsContent value="ambassador">
        <Card>
          <CardHeader>
            <CardTitle>Student Ambassador</CardTitle>
            <CardDescription>Current student ambassador information</CardDescription>
          </CardHeader>
          <CardContent>
            <StudentAmbassadorManager />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="previous">
        <Card>
          <CardHeader>
            <CardTitle>Previous Student Leaders</CardTitle>
            <CardDescription>Archive of past student leaders</CardDescription>
          </CardHeader>
          <CardContent>
            <PreviousLeadersManager />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  </div>
);

// Gallery Content Section
const GalleryContent = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-xl font-semibold">Gallery</h2>
      <p className="text-muted-foreground">
        Manage images and videos displayed on the website
      </p>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Media Gallery</CardTitle>
        <CardDescription>Upload and manage photos and videos</CardDescription>
      </CardHeader>
      <CardContent>
        <GalleryManager />
      </CardContent>
    </Card>
  </div>
);

export default StudentContentDashboard;
