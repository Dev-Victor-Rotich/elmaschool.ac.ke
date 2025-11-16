import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DutyRosterManager } from "@/components/admin/DutyRosterManager";
import { EventsManager } from "@/components/admin/EventsManager";
import { TestimonialsManager } from "@/components/admin/TestimonialsManager";
import { GalleryManager } from "@/components/admin/GalleryManager";
import { HeroContentManager } from "@/components/admin/HeroContentManager";
import { SiteStatsManager } from "@/components/admin/SiteStatsManager";
import { TrustBadgesManager } from "@/components/admin/TrustBadgesManager";
import { HomeFeaturesManager } from "@/components/admin/HomeFeaturesManager";
import { FAQsManager } from "@/components/admin/FAQsManager";
import { CTABannerManager } from "@/components/admin/CTABannerManager";

const HomeContentManager = () => {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Home Page Content</h1>
        <p className="text-muted-foreground">
          Manage all content displayed on the home page
        </p>
      </div>

      <Tabs defaultValue="hero" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="hero">Hero</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="stats">Stats</TabsTrigger>
          <TabsTrigger value="badges">Badges</TabsTrigger>
          <TabsTrigger value="more">More</TabsTrigger>
        </TabsList>

        <TabsContent value="hero">
          <Card>
            <CardHeader>
              <CardTitle>Hero Section</CardTitle>
              <CardDescription>Main hero banner on homepage</CardDescription>
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

        <TabsContent value="more">
          <Tabs defaultValue="duty-roster" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="duty-roster">Duty Roster</TabsTrigger>
              <TabsTrigger value="events">Events</TabsTrigger>
              <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
              <TabsTrigger value="faqs">FAQs</TabsTrigger>
              <TabsTrigger value="cta">CTA Banner</TabsTrigger>
            </TabsList>

            <TabsContent value="duty-roster">
              <Card>
                <CardHeader>
                  <CardTitle>Duty Roster Management</CardTitle>
                  <CardDescription>
                    Manage termly duty rosters, quotes, and teachers on duty
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DutyRosterManager />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="events">
              <Card>
                <CardHeader>
                  <CardTitle>Events Management</CardTitle>
                  <CardDescription>
                    Add and manage school events (4 upcoming events shown on home page)
                  </CardDescription>
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
                  <CardDescription>
                    Manage testimonials from parents, alumni, and community leaders
                  </CardDescription>
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
                  <CardDescription>
                    Frequently Asked Questions shown on homepage
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FAQsManager />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="cta">
              <Card>
                <CardHeader>
                  <CardTitle>CTA Banner</CardTitle>
                  <CardDescription>
                    Call-to-action banner for enrollments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CTABannerManager />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HomeContentManager;
