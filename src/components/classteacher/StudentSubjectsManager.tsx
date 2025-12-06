import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Save, X } from "lucide-react";
import { toast } from "sonner";

interface StudentSubjectsManagerProps {
  assignedClass: string;
}

export const StudentSubjectsManager = ({ assignedClass }: StudentSubjectsManagerProps) => {
  const queryClient = useQueryClient();
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSubjects, setSelectedSubjects] = useState<{ subjectId: string; subSubject: string | null }[]>([]);

  // Fetch students in the class
  const { data: students = [] } = useQuery({
    queryKey: ["class-students", assignedClass],
    queryFn: async () => {
      if (!assignedClass) return [];
      const { data, error } = await supabase
        .from("students_data")
        .select("*")
        .eq("class", assignedClass)
        .order("full_name");
      if (error) throw error;
      return data || [];
    },
    enabled: !!assignedClass,
  });

  // Fetch all subjects
  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subjects")
        .select("*")
        .order("display_order");
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch student subjects for the class
  const { data: studentSubjects = [] } = useQuery({
    queryKey: ["student-subjects", assignedClass],
    queryFn: async () => {
      if (!assignedClass) return [];
      const studentIds = students.map((s) => s.id);
      if (studentIds.length === 0) return [];

      const { data, error } = await supabase
        .from("student_subjects")
        .select("*")
        .in("student_id", studentIds);
      if (error) throw error;
      return data || [];
    },
    enabled: students.length > 0,
  });

  // Save student subjects mutation
  const saveSubjectsMutation = useMutation({
    mutationFn: async ({ studentId, subjects: subjectsList }: { studentId: string; subjects: typeof selectedSubjects }) => {
      // Delete existing assignments
      await supabase.from("student_subjects").delete().eq("student_id", studentId);

      // Insert new assignments
      if (subjectsList.length > 0) {
        const { data: { user } } = await supabase.auth.getUser();
        const inserts = subjectsList.map((s) => ({
          student_id: studentId,
          subject_id: s.subjectId,
          sub_subject: s.subSubject,
          assigned_by: user?.id,
        }));
        const { error } = await supabase.from("student_subjects").insert(inserts);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Subjects saved successfully");
      queryClient.invalidateQueries({ queryKey: ["student-subjects"] });
      setDialogOpen(false);
      setSelectedStudent(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to save subjects");
    },
  });

  const openSubjectDialog = (student: any) => {
    setSelectedStudent(student);

    // Load existing subjects for this student
    const existingSubjects = studentSubjects.filter((ss: any) => ss.student_id === student.id);
    setSelectedSubjects(
      existingSubjects.map((ss: any) => ({
        subjectId: ss.subject_id,
        subSubject: ss.sub_subject,
      }))
    );

    setDialogOpen(true);
  };

  const toggleSubject = (subjectId: string, subSubject: string | null) => {
    const exists = selectedSubjects.some(
      (s) => s.subjectId === subjectId && s.subSubject === subSubject
    );

    if (exists) {
      setSelectedSubjects(
        selectedSubjects.filter(
          (s) => !(s.subjectId === subjectId && s.subSubject === subSubject)
        )
      );
    } else {
      setSelectedSubjects([...selectedSubjects, { subjectId, subSubject }]);
    }
  };

  const isSelected = (subjectId: string, subSubject: string | null) => {
    return selectedSubjects.some(
      (s) => s.subjectId === subjectId && s.subSubject === subSubject
    );
  };

  const handleSave = () => {
    if (!selectedStudent) return;
    saveSubjectsMutation.mutate({ studentId: selectedStudent.id, subjects: selectedSubjects });
  };

  const getStudentSubjectCount = (studentId: string) => {
    return studentSubjects.filter((ss: any) => ss.student_id === studentId).length;
  };

  const getSubjectName = (subjectId: string) => {
    const subject = subjects.find((s: any) => s.id === subjectId);
    return subject?.title || "Unknown";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Student Subjects Assignment
        </CardTitle>
        <CardDescription>Assign subjects and sub-subjects to students in your class</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Admission No.</TableHead>
              <TableHead>Student Name</TableHead>
              <TableHead>Subjects Assigned</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No students in {assignedClass || "your class"}
                </TableCell>
              </TableRow>
            ) : (
              students.map((student) => {
                const subjectCount = getStudentSubjectCount(student.id);
                const studentSubjectList = studentSubjects.filter((ss: any) => ss.student_id === student.id);

                return (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.admission_number}</TableCell>
                    <TableCell>{student.full_name}</TableCell>
                    <TableCell>
                      {subjectCount > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {studentSubjectList.slice(0, 3).map((ss: any, idx: number) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {getSubjectName(ss.subject_id)}
                              {ss.sub_subject && ` (${ss.sub_subject})`}
                            </Badge>
                          ))}
                          {subjectCount > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{subjectCount - 3} more
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">No subjects assigned</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => openSubjectDialog(student)}>
                        <BookOpen className="h-4 w-4 mr-2" />
                        Assign Subjects
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Subject Assignment Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Assign Subjects to {selectedStudent?.full_name}</DialogTitle>
              <DialogDescription>
                Select subjects and sub-subjects for this student
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {subjects.map((subject: any) => {
                const hasSubSubjects = (subject.sub_subjects as string[] || []).length > 0;

                return (
                  <Card key={subject.id} className="border">
                    <CardHeader className="py-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-medium">{subject.title}</CardTitle>
                        {!hasSubSubjects && (
                          <Checkbox
                            checked={isSelected(subject.id, null)}
                            onCheckedChange={() => toggleSubject(subject.id, null)}
                          />
                        )}
                      </div>
                      <CardDescription className="text-sm">{subject.description}</CardDescription>
                    </CardHeader>
                    {hasSubSubjects && (
                      <CardContent className="pt-0 pb-3">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {(subject.sub_subjects as string[]).map((subSubject: string, idx: number) => (
                            <div
                              key={idx}
                              className="flex items-center space-x-2 p-2 rounded border hover:bg-accent/50 cursor-pointer"
                              onClick={() => toggleSubject(subject.id, subSubject)}
                            >
                              <Checkbox
                                checked={isSelected(subject.id, subSubject)}
                                onCheckedChange={() => toggleSubject(subject.id, subSubject)}
                              />
                              <span className="text-sm">{subSubject}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                {selectedSubjects.length} subject{selectedSubjects.length !== 1 ? "s" : ""} selected
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saveSubjectsMutation.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  {saveSubjectsMutation.isPending ? "Saving..." : "Save Subjects"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
