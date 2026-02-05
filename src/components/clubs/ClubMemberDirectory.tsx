import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Crown, Shield, Loader2 } from "lucide-react";

interface ClubMemberDirectoryProps {
  clubId: string;
  patronId?: string;
}

interface Member {
  id: string;
  student_id: string;
  role: string;
  joined_at: string;
  student_name: string;
  student_class: string;
}

const roleIcons: Record<string, React.ReactNode> = {
  chairperson: <Crown className="h-3 w-3" />,
  secretary: <Shield className="h-3 w-3" />,
  treasurer: <Shield className="h-3 w-3" />,
};

const roleColors: Record<string, string> = {
  chairperson: "bg-amber-500/20 text-amber-700 border-amber-500/30",
  secretary: "bg-blue-500/20 text-blue-700 border-blue-500/30",
  treasurer: "bg-green-500/20 text-green-700 border-green-500/30",
  member: "bg-muted text-muted-foreground",
};

const ClubMemberDirectory = ({ clubId, patronId }: ClubMemberDirectoryProps) => {
  // Fetch members with student details
  const { data: members = [], isLoading } = useQuery({
    queryKey: ["club-members-directory", clubId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("club_members")
        .select("id, student_id, role, joined_at")
        .eq("club_id", clubId)
        .order("role", { ascending: true })
        .order("joined_at", { ascending: true });

      if (error) throw error;

      // Fetch student details
      const membersWithDetails = await Promise.all(
        (data || []).map(async (member) => {
          const { data: student } = await supabase
            .from("students_data")
            .select("full_name, class")
            .eq("id", member.student_id)
            .single();

          return {
            ...member,
            student_name: student?.full_name || "Unknown",
            student_class: student?.class || "",
          };
        })
      );

      return membersWithDetails as Member[];
    },
  });

  // Fetch patron details
  const { data: patronDetails } = useQuery({
    queryKey: ["club-patron", patronId],
    queryFn: async () => {
      if (!patronId) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", patronId)
        .single();
      if (error) return null;
      return data;
    },
    enabled: !!patronId,
  });

  const getInitials = (name: string) => {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  // Sort members: leadership first, then regular members
  const sortedMembers = [...members].sort((a, b) => {
    const order = ["chairperson", "secretary", "treasurer", "member"];
    return order.indexOf(a.role) - order.indexOf(b.role);
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Patron Section */}
      {patronDetails && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-600" />
              Club Patron
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-primary/20 text-primary">
                  {getInitials(patronDetails.full_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{patronDetails.full_name}</p>
                <p className="text-sm text-muted-foreground">Teacher/Staff</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Members Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Club Members
            <Badge variant="secondary" className="ml-auto">
              {members.length} members
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sortedMembers.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {sortedMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{getInitials(member.student_name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{member.student_name}</p>
                    <p className="text-xs text-muted-foreground">{member.student_class}</p>
                  </div>
                  <Badge className={`capitalize shrink-0 ${roleColors[member.role] || roleColors.member}`}>
                    {roleIcons[member.role]}
                    <span className="ml-1">{member.role}</span>
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-6">
              No members in this club yet.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClubMemberDirectory;
