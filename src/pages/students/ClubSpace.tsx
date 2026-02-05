import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MessageSquare, Users, Calendar, Image, Loader2 } from "lucide-react";
import ClubFeed from "@/components/clubs/ClubFeed";
import ClubMemberDirectory from "@/components/clubs/ClubMemberDirectory";

const ClubSpace = () => {
  const { clubId } = useParams<{ clubId: string }>();
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [userType, setUserType] = useState<"patron" | "student">("student");
  const [memberRole, setMemberRole] = useState<string>("member");

  useEffect(() => {
    checkAuth();
  }, [clubId]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    setUserId(session.user.id);

    // Check if user is patron of this club
    const { data: club } = await supabase
      .from("clubs_societies")
      .select("patron_id")
      .eq("id", clubId)
      .single();

    if (club?.patron_id === session.user.id) {
      setUserType("patron");
    } else {
      // Get student ID
      const { data: student } = await supabase
        .from("students_data")
        .select("id")
        .eq("user_id", session.user.id)
        .single();

      if (student) {
        setStudentId(student.id);
        
        // Get member role
        const { data: member } = await supabase
          .from("club_members")
          .select("role")
          .eq("club_id", clubId)
          .eq("student_id", student.id)
          .single();
        
        if (member) {
          setMemberRole(member.role);
        }
      }
    }
  };

  // Fetch club details
  const { data: club, isLoading } = useQuery({
    queryKey: ["club-details", clubId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clubs_societies")
        .select("*")
        .eq("id", clubId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!clubId,
  });

  // Fetch patron name
  const { data: patronData } = useQuery({
    queryKey: ["club-patron-name", club?.patron_id],
    queryFn: async () => {
      if (!club?.patron_id) return null;
      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", club.patron_id)
        .single();
      return data;
    },
    enabled: !!club?.patron_id,
  });

  if (isLoading || !userId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!club) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Club Not Found</h1>
          <p className="text-muted-foreground mb-4">This club doesn't exist or you don't have access.</p>
          <Button onClick={() => navigate("/students/portal")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Portal
          </Button>
        </div>
      </div>
    );
  }

  const features = (club.features as { feed?: boolean; gallery?: boolean; events?: boolean; resources?: boolean }) || { feed: true };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/students/portal")}
            className="mb-3"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Portal
          </Button>

          <div className="flex items-start gap-4">
            {club.image_url && (
              <img
                src={club.image_url}
                alt={club.name}
                className="h-20 w-20 rounded-lg object-cover"
              />
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold">{club.name}</h1>
                {userType === "patron" && (
                  <Badge variant="secondary">You are the Patron</Badge>
                )}
                {memberRole !== "member" && userType === "student" && (
                  <Badge className="capitalize">{memberRole}</Badge>
                )}
              </div>
              {club.motto && (
                <p className="text-muted-foreground italic mt-1">"{club.motto}"</p>
              )}
              <p className="text-sm text-muted-foreground mt-2">{club.description}</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                {patronData && (
                  <span>Patron: {patronData.full_name}</span>
                )}
                {club.meeting_schedule && (
                  <span>• {club.meeting_schedule}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="feed" className="space-y-6">
          <TabsList className="flex-wrap h-auto gap-1">
            {features.feed && (
              <TabsTrigger value="feed">
                <MessageSquare className="h-4 w-4 mr-2" />
                Feed
              </TabsTrigger>
            )}
            <TabsTrigger value="members">
              <Users className="h-4 w-4 mr-2" />
              Members
            </TabsTrigger>
            {features.gallery && (
              <TabsTrigger value="gallery">
                <Image className="h-4 w-4 mr-2" />
                Gallery
              </TabsTrigger>
            )}
            {features.events && (
              <TabsTrigger value="events">
                <Calendar className="h-4 w-4 mr-2" />
                Events
              </TabsTrigger>
            )}
          </TabsList>

          {features.feed && (
            <TabsContent value="feed">
              <ClubFeed
                clubId={club.id}
                currentUserId={userId}
                currentUserType={userType}
                currentStudentId={studentId || undefined}
                memberRole={memberRole}
              />
            </TabsContent>
          )}

          <TabsContent value="members">
            <ClubMemberDirectory clubId={club.id} patronId={club.patron_id} />
          </TabsContent>

          {features.gallery && (
            <TabsContent value="gallery">
              <Card>
                <CardHeader>
                  <CardTitle>Photo Gallery</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center py-8">
                    Gallery feature coming soon!
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {features.events && (
            <TabsContent value="events">
              <Card>
                <CardHeader>
                  <CardTitle>Club Events</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center py-8">
                    Events feature coming soon!
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
};

export default ClubSpace;
