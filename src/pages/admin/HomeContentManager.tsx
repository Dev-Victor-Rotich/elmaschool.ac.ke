import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DutyRosterManager } from "@/components/admin/DutyRosterManager";
import { EventsManager } from "@/components/admin/EventsManager";
import { TestimonialsManager } from "@/components/admin/TestimonialsManager";
import { GalleryManager } from "@/components/admin/GalleryManager";

const HomeContentManager = () => {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Home Page Content</h1>
        <p className="text-muted-foreground">
          Manage all content displayed on the home page
        </p>
      </div>

      <Tabs defaultValue="duty-roster" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="duty-roster">Duty Roster</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
          <TabsTrigger value="gallery">Gallery Preview</TabsTrigger>
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

        <TabsContent value="gallery">
          <Card>
            <CardHeader>
              <CardTitle>Gallery Management</CardTitle>
              <CardDescription>
                First 4 images uploaded will be displayed on the home page
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GalleryManager />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HomeContentManager;
