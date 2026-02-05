import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Search, Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";

interface ClubMemberManagerProps {
  clubId: string;
  patronId: string;
}

const memberRoles = [
  { value: "member", label: "Member" },
  { value: "chairperson", label: "Chairperson" },
  { value: "secretary", label: "Secretary" },
  { value: "treasurer", label: "Treasurer" },
];

const ClubMemberManager = ({ clubId, patronId }: ClubMemberManagerProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState("member");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch current members
  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ["club-members", clubId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("club_members")
        .select("*")
        .eq("club_id", clubId)
        .order("role")
        .order("joined_at");

      if (error) throw error;

      // Fetch student names
      const membersWithNames = await Promise.all(
        (data || []).map(async (member) => {
          const { data: student } = await supabase
            .from("students_data")
            .select("full_name, class, admission_number")
            .eq("id", member.student_id)
            .single();
          return { ...member, student };
        })
      );

      return membersWithNames;
    },
  });

  // Fetch all students for adding
  const { data: allStudents = [] } = useQuery({
    queryKey: ["all-students-for-club"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students_data")
        .select("id, full_name, class, admission_number")
        .eq("is_registered", true)
        .order("full_name");
      if (error) throw error;
      return data || [];
    },
    enabled: addDialogOpen,
  });

  // Filter out students already in the club
  const memberStudentIds = members.map((m: any) => m.student_id);
  const availableStudents = allStudents.filter(
    (s) => !memberStudentIds.includes(s.id)
  );

  // Filter students by search term
  const filteredStudents = availableStudents.filter(
    (s) =>
      s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.admission_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.class.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Add member mutation
  const addMemberMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("club_members").insert({
        club_id: clubId,
        student_id: selectedStudentId,
        role: selectedRole,
        added_by: patronId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["club-members", clubId] });
      toast.success("Member added successfully");
      setSelectedStudentId("");
      setSelectedRole("member");
      setAddDialogOpen(false);
    },
    onError: () => {
      toast.error("Failed to add member");
    },
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: string }) => {
      const { error } = await supabase
        .from("club_members")
        .update({ role })
        .eq("id", memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["club-members", clubId] });
      toast.success("Role updated");
    },
    onError: () => {
      toast.error("Failed to update role");
    },
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from("club_members")
        .delete()
        .eq("id", memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["club-members", clubId] });
      toast.success("Member removed");
    },
    onError: () => {
      toast.error("Failed to remove member");
    },
  });

  if (membersLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Club Members</h3>
          <p className="text-sm text-muted-foreground">
            {members.length} members in this club
          </p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Member
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Club Member</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, class, or admission number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2 border rounded-lg p-2">
                {filteredStudents.map((student) => (
                  <div
                    key={student.id}
                    className={`p-3 rounded-md cursor-pointer transition-colors ${
                      selectedStudentId === student.id
                        ? "bg-primary/10 border-primary border"
                        : "hover:bg-muted border border-transparent"
                    }`}
                    onClick={() => setSelectedStudentId(student.id)}
                  >
                    <p className="font-medium">{student.full_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {student.admission_number} • {student.class}
                    </p>
                  </div>
                ))}
                {filteredStudents.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">
                    {searchTerm ? "No students found" : "All students are already members"}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Role</label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {memberRoles.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                className="w-full"
                onClick={() => addMemberMutation.mutate()}
                disabled={!selectedStudentId || addMemberMutation.isPending}
              >
                {addMemberMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Add Member
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member: any) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{member.student?.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {member.student?.admission_number}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{member.student?.class}</TableCell>
                  <TableCell>
                    <Select
                      value={member.role}
                      onValueChange={(role) =>
                        updateRoleMutation.mutate({ memberId: member.id, role })
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {memberRoles.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm("Remove this member from the club?")) {
                          removeMemberMutation.mutate(member.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {members.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No members yet. Add some students to get started!
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClubMemberManager;
