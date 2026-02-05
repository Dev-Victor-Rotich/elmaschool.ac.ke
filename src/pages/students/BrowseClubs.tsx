import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users, Sparkles, Loader2 } from "lucide-react";

const BrowseClubs = () => {
  const navigate = useNavigate();

  // Fetch all active clubs
  const { data: clubs = [], isLoading: clubsLoading } = useQuery({
    queryKey: ["all-active-clubs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clubs_societies")
        .select("id, name, description, image_url, motto, member_count, patron_id, is_active")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;

      // Fetch patron names
      const clubsWithPatrons = await Promise.all(
        (data || []).map(async (club) => {
          let patronName = "Not assigned";
          if (club.patron_id) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", club.patron_id)
              .single();
            patronName = profile?.full_name || "Not assigned";
          }
          return { ...club, patron_name: patronName };
        })
      );

      return clubsWithPatrons;
    },
  });

  // Fetch current student's memberships
  const { data: myMemberships = [] } = useQuery({
    queryKey: ["my-club-memberships"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];

      // Get student ID
      const { data: student } = await supabase
        .from("students_data")
        .select("id")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (!student) return [];

      const { data: memberships, error } = await supabase
        .from("club_members")
        .select("club_id, role")
        .eq("student_id", student.id);

      if (error) throw error;
      return memberships || [];
    },
  });

  const isMemberOf = (clubId: string) => {
    return myMemberships.some((m) => m.club_id === clubId);
  };

  const getMemberRole = (clubId: string) => {
    const membership = myMemberships.find((m) => m.club_id === clubId);
    return membership?.role || null;
  };

  if (clubsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/students")}
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Browse Clubs</h1>
              <p className="text-sm opacity-90">View all school clubs and societies</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {clubs.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {clubs.map((club) => {
              const isMember = isMemberOf(club.id);
              const memberRole = getMemberRole(club.id);

              return (
                <Card
                  key={club.id}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    isMember ? "border-primary/50 bg-primary/5" : ""
                  }`}
                  onClick={() => {
                    if (isMember) {
                      navigate(`/students/clubs/${club.id}`);
                    }
                  }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-4">
                      {club.image_url ? (
                        <img
                          src={club.image_url}
                          alt={club.name}
                          className="h-16 w-16 rounded-lg object-cover shrink-0"
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Sparkles className="h-8 w-8 text-primary" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-lg">{club.name}</CardTitle>
                          {isMember && (
                            <Badge className="shrink-0 capitalize">
                              {memberRole !== "member" ? memberRole : "Member"}
                            </Badge>
                          )}
                        </div>
                        {club.motto && (
                          <p className="text-sm text-muted-foreground italic mt-1">
                            "{club.motto}"
                          </p>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {club.description}
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Patron: <span className="text-foreground">{club.patron_name}</span>
                      </span>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        {club.member_count || 0}
                      </div>
                    </div>
                    {!isMember && (
                      <p className="text-xs text-muted-foreground mt-3 text-center p-2 bg-muted/50 rounded">
                        Contact the patron to join this club
                      </p>
                    )}
                    {isMember && (
                      <Button variant="outline" size="sm" className="w-full mt-3">
                        Enter Club Space →
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Sparkles className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <CardTitle className="mb-2">No Clubs Available</CardTitle>
              <CardDescription>
                There are no active clubs at the moment. Check back later!
              </CardDescription>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default BrowseClubs;
