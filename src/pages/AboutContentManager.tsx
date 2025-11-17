import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PrincipalMessageManager } from "@/components/admin/PrincipalMessageManager";
import { ParentTestimonialsManager } from "@/components/admin/ParentTestimonialsManager";
import { FacilitiesManager } from "@/components/admin/FacilitiesManager";
import { AcademicExcellenceManager } from "@/components/admin/AcademicExcellenceManager";
import { NotableAlumniManager } from "@/components/admin/NotableAlumniManager";

const AboutContentManager = () => {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">About Page Content</h1>
        <p className="text-muted-foreground">
          Manage all content displayed on the about page
        </p>
      </div>

      <Tabs defaultValue="principal" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="principal">Principal</TabsTrigger>
          <TabsTrigger value="parents">Parents</TabsTrigger>
          <TabsTrigger value="facilities">Facilities</TabsTrigger>
          <TabsTrigger value="academic">Academic</TabsTrigger>
          <TabsTrigger value="alumni">Alumni</TabsTrigger>
        </TabsList>

        <TabsContent value="principal">
          <Card>
            <CardHeader>
              <CardTitle>Principal Message</CardTitle>
              <CardDescription>Update the principal's message and photo</CardDescription>
            </CardHeader>
            <CardContent>
              <PrincipalMessageManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="parents">
          <Card>
            <CardHeader>
              <CardTitle>Parent Testimonials</CardTitle>
              <CardDescription>Manage parent reviews and ratings</CardDescription>
            </CardHeader>
            <CardContent>
              <ParentTestimonialsManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="facilities">
          <Card>
            <CardHeader>
              <CardTitle>Facilities & Amenities</CardTitle>
              <CardDescription>Manage school facilities with images and descriptions</CardDescription>
            </CardHeader>
            <CardContent>
              <FacilitiesManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="academic">
          <Card>
            <CardHeader>
              <CardTitle>Academic Excellence</CardTitle>
              <CardDescription>Showcase top students and their achievements</CardDescription>
            </CardHeader>
            <CardContent>
              <AcademicExcellenceManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alumni">
          <Card>
            <CardHeader>
              <CardTitle>Notable Alumni</CardTitle>
              <CardDescription>Highlight successful alumni and their accomplishments</CardDescription>
            </CardHeader>
            <CardContent>
              <NotableAlumniManager />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AboutContentManager;
