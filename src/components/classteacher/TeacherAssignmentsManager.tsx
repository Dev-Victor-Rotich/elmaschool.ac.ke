import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Trash2, Search, UserCheck, BookOpen } from "lucide-react";

interface TeacherAssignmentsManagerProps {
  assignedClass: string;
}

export function TeacherAssignmentsManager({ assignedClass }: TeacherAssignmentsManagerProps) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedSubSubject, setSelectedSubSubject] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch all staff from staff_registry
  const { data: staffList, isLoading: staffLoading } = useQuery({
    queryKey: ['staff-registry-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff_registry')
        .select('*')
        .eq('status', 'active')
        .order('full_name');
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch subjects with sub-subjects
  const { data: subjects } = useQuery({
    queryKey: ['subjects-for-assignment'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .order('title');
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch class subject offerings to know what's available
  const { data: offerings } = useQuery({
    queryKey: ['class-offerings', assignedClass],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('class_subject_offerings')
        .select('*, subjects(title)')
        .eq('class_name', assignedClass);
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch current teacher assignments for this class
  const { data: assignments, isLoading: assignmentsLoading } = useQuery({
    queryKey: ['teacher-assignments', assignedClass],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teacher_subject_assignments')
        .select('*, subjects(title)')
        .eq('class_name', assignedClass);
      
      if (error) throw error;
      return data;
    }
  });

  // Get staff details for assignments
  const { data: assignedStaffDetails } = useQuery({
    queryKey: ['assigned-staff-details', assignments],
    queryFn: async () => {
      if (!assignments || assignments.length === 0) return {};
      
      const teacherIds = [...new Set(assignments.map(a => a.teacher_id))];
      const { data, error } = await supabase
        .from('staff_registry')
        .select('id, full_name, email, role')
        .in('id', teacherIds);
      
      if (error) throw error;
      
      const staffMap: Record<string, any> = {};
      data?.forEach(staff => {
        staffMap[staff.id] = staff;
      });
      return staffMap;
    },
    enabled: !!assignments && assignments.length > 0
  });

  const addAssignmentMutation = useMutation({
    mutationFn: async ({ teacherId, subjectId, subSubject }: { teacherId: string; subjectId: string; subSubject: string | null }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      console.log("TeacherAssignmentsManager: Inserting assignment", {
        teacherId,
        subjectId,
        subSubject,
        class_name: assignedClass,
        assigned_by: user?.id
      });
      
      const { data, error } = await supabase
        .from('teacher_subject_assignments')
        .insert({
          teacher_id: teacherId,
          subject_id: subjectId,
          sub_subject: subSubject,
          class_name: assignedClass,
          assigned_by: user?.id
        })
        .select();
      
      if (error) {
        console.error("TeacherAssignmentsManager: Insert error", error);
        throw error;
      }
      
      console.log("TeacherAssignmentsManager: Insert success", data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-assignments', assignedClass] });
      toast.success('Teacher assigned to subject successfully');
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      console.error("TeacherAssignmentsManager: Mutation error", error);
      if (error.message?.includes('duplicate')) {
        toast.error('This teacher is already assigned to this subject');
      } else {
        toast.error(`Failed to assign teacher: ${error.message || 'Unknown error'}`);
      }
    }
  });

  const removeAssignmentMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await supabase
        .from('teacher_subject_assignments')
        .delete()
        .eq('id', assignmentId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-assignments', assignedClass] });
      toast.success('Assignment removed');
    },
    onError: () => {
      toast.error('Failed to remove assignment');
    }
  });

  const resetForm = () => {
    setSelectedStaff(null);
    setSelectedSubject("");
    setSelectedSubSubject("");
  };

  const handleAssign = () => {
    if (!selectedStaff || !selectedSubject) {
      toast.error('Please select a staff member and subject');
      return;
    }

    addAssignmentMutation.mutate({
      teacherId: selectedStaff,
      subjectId: selectedSubject,
      subSubject: selectedSubSubject || null
    });
  };

  const filteredStaff = staffList?.filter(staff => 
    staff.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staff.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staff.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedSubjectData = subjects?.find(s => s.id === selectedSubject);

  // Get available subjects from offerings
  const availableSubjects = offerings?.map(o => {
    const subject = subjects?.find(s => s.id === o.subject_id);
    return {
      ...o,
      subjectTitle: subject?.title || 'Unknown',
      subSubjects: subject?.sub_subjects || []
    };
  }) || [];

  // Group assignments by teacher
  const assignmentsByTeacher: Record<string, any[]> = {};
  assignments?.forEach(assignment => {
    if (!assignmentsByTeacher[assignment.teacher_id]) {
      assignmentsByTeacher[assignment.teacher_id] = [];
    }
    assignmentsByTeacher[assignment.teacher_id].push(assignment);
  });

  if (staffLoading || assignmentsLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Assignments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Teacher Assignments for {assignedClass}
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Assign Teacher
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Assign Teacher to Subject</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {/* Staff Search */}
                <div className="space-y-2">
                  <Label>Search Staff</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, email, or role..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Staff List */}
                <div className="border rounded-lg max-h-48 overflow-y-auto">
                  {filteredStaff?.map(staff => (
                    <div
                      key={staff.id}
                      className={`p-3 border-b last:border-b-0 cursor-pointer hover:bg-muted/50 transition-colors ${
                        selectedStaff === staff.id ? 'bg-primary/10 border-primary' : ''
                      }`}
                      onClick={() => setSelectedStaff(staff.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{staff.full_name || 'No Name'}</p>
                          <p className="text-sm text-muted-foreground">{staff.email}</p>
                        </div>
                        <Badge variant="outline">{staff.role}</Badge>
                      </div>
                    </div>
                  ))}
                  {filteredStaff?.length === 0 && (
                    <p className="p-4 text-center text-muted-foreground">No staff found</p>
                  )}
                </div>

                {/* Subject Selection */}
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Select value={selectedSubject} onValueChange={(value) => {
                    setSelectedSubject(value);
                    setSelectedSubSubject("");
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects?.map(subject => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sub-subject Selection */}
                {selectedSubjectData?.sub_subjects && selectedSubjectData.sub_subjects.length > 0 && (
                  <div className="space-y-2">
                    <Label>Sub-Subject (Optional)</Label>
                    <Select value={selectedSubSubject} onValueChange={setSelectedSubSubject}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select sub-subject (or leave empty for all)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Sub-subjects</SelectItem>
                        {selectedSubjectData.sub_subjects.map((sub: string) => (
                          <SelectItem key={sub} value={sub}>
                            {sub}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Button 
                  onClick={handleAssign} 
                  className="w-full"
                  disabled={!selectedStaff || !selectedSubject || addAssignmentMutation.isPending}
                >
                  {addAssignmentMutation.isPending ? 'Assigning...' : 'Assign Teacher'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {Object.keys(assignmentsByTeacher).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No teachers assigned yet</p>
              <p className="text-sm">Click "Assign Teacher" to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(assignmentsByTeacher).map(([teacherId, teacherAssignments]) => {
                const staffInfo = assignedStaffDetails?.[teacherId];
                return (
                  <Card key={teacherId} className="bg-muted/30">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold">{staffInfo?.full_name || 'Unknown Staff'}</h4>
                          <p className="text-sm text-muted-foreground">{staffInfo?.email}</p>
                          <Badge variant="outline" className="mt-1">{staffInfo?.role}</Badge>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {teacherAssignments.map(assignment => (
                          <div 
                            key={assignment.id}
                            className="flex items-center gap-2 bg-background rounded-lg px-3 py-2 border"
                          >
                            <span className="text-sm">
                              {assignment.subjects?.title}
                              {assignment.sub_subject && ` - ${assignment.sub_subject}`}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-destructive hover:text-destructive"
                              onClick={() => removeAssignmentMutation.mutate(assignment.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Staff Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Staff Members</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Assigned Subjects</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staffList?.map(staff => {
                const staffAssignments = assignments?.filter(a => a.teacher_id === staff.id) || [];
                return (
                  <TableRow key={staff.id}>
                    <TableCell className="font-medium">{staff.full_name || '-'}</TableCell>
                    <TableCell>{staff.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{staff.role}</Badge>
                    </TableCell>
                    <TableCell>
                      {staffAssignments.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {staffAssignments.map(a => (
                            <Badge key={a.id} variant="secondary" className="text-xs">
                              {a.subjects?.title}{a.sub_subject ? ` (${a.sub_subject})` : ''}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Not assigned</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
