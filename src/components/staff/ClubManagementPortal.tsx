import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { LayoutDashboard, Users, MessageSquare, Settings, Loader2 } from "lucide-react";
import ClubMemberManager from "@/components/clubs/ClubMemberManager";
import ClubFeed from "@/components/clubs/ClubFeed";
import ClubSettings from "@/components/clubs/ClubSettings";

interface ClubManagementPortalProps {
  clubId: string;
  userId: string;
}

const ClubManagementPortal = ({ clubId, userId }: ClubManagementPortalProps) => {
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

  // Fetch member count
  const { data: memberCount = 0 } = useQuery({
    queryKey: ["club-member-count", clubId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("club_members")
        .select("*", { count: "exact", head: true })
        .eq("club_id", clubId);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!clubId,
  });

  // Fetch recent activity count (posts in last 7 days)
  const { data: recentActivity = 0 } = useQuery({
    queryKey: ["club-recent-activity", clubId],
    queryFn: async () => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const { count, error } = await supabase
        .from("club_posts")
        .select("*", { count: "exact", head: true })
        .eq("club_id", clubId)
        .gte("created_at", weekAgo.toISOString());
      if (error) throw error;
      return count || 0;
    },
    enabled: !!clubId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!club) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Club not found</p>
      </div>
    );
  }

  const features = (club.features as { feed?: boolean; gallery?: boolean; events?: boolean; resources?: boolean }) || { feed: true };

  return (
    <div className="space-y-6">
      {/* Club Header */}
      <div className="flex items-center gap-4">
        {club.image_url && (
          <img
            src={club.image_url}
            alt={club.name}
            className="h-16 w-16 rounded-lg object-cover"
          />
        )}
        <div>
          <h2 className="text-2xl font-bold">{club.name}</h2>
          <p className="text-muted-foreground">{club.description}</p>
        </div>
        <Badge variant={club.is_active ? "default" : "secondary"} className="ml-auto">
          {club.is_active ? "Active" : "Inactive"}
        </Badge>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList>
          <TabsTrigger value="dashboard">
            <LayoutDashboard className="h-4 w-4 mr-2" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="members">
            <Users className="h-4 w-4 mr-2" />
            Members
          </TabsTrigger>
          <TabsTrigger value="feed">
            <MessageSquare className="h-4 w-4 mr-2" />
            Feed
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Members</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{memberCount}</div>
                <p className="text-xs text-muted-foreground">Active members</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{recentActivity}</div>
                <p className="text-xs text-muted-foreground">Posts this week</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Features Enabled</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1">
                  {features.feed && <Badge variant="outline">Feed</Badge>}
                  {features.gallery && <Badge variant="outline">Gallery</Badge>}
                  {features.events && <Badge variant="outline">Events</Badge>}
                  {features.resources && <Badge variant="outline">Resources</Badge>}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Manage your club efficiently</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm">
                • Use the <strong>Members</strong> tab to add students and assign roles
              </p>
              <p className="text-sm">
                • Post announcements and updates in the <strong>Feed</strong> tab
              </p>
              <p className="text-sm">
                • Customize features and details in <strong>Settings</strong>
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members">
          <ClubMemberManager clubId={clubId} patronId={userId} />
        </TabsContent>

        <TabsContent value="feed">
          <ClubFeed
            clubId={clubId}
            currentUserId={userId}
            currentUserType="patron"
            memberRole="patron"
          />
        </TabsContent>

        <TabsContent value="settings">
          <ClubSettings
            club={{
              id: club.id,
              name: club.name,
              description: club.description,
              image_url: club.image_url,
              motto: club.motto,
              meeting_schedule: club.meeting_schedule,
              features: features as any,
              is_active: club.is_active,
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClubManagementPortal;
