import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ArrowLeft, TrendingUp, TrendingDown, Minus, Save, Trash2, Trophy, Users, BarChart3, Download } from "lucide-react";
import { toast } from "sonner";

interface TeacherExamResultsProps {
  exam: any;
  assignedClass: string;
  subjectTitle: string;
  subSubject: string | null;
  subjectId: string;
  teacherId: string;
  onBack: () => void;
}

const GRADE_POINTS: Record<string, number> = {
  "A": 12, "A-": 11, "B+": 10, "B": 9, "B-": 8,
  "C+": 7, "C": 6, "C-": 5, "D+": 4, "D": 3, "D-": 2, "E": 1
};

export function TeacherExamResults({ 
  exam, 
  assignedClass, 
  subjectTitle, 
  subSubject, 
  subjectId,
  teacherId,
  onBack 
}: TeacherExamResultsProps) {
  const queryClient = useQueryClient();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<{ id: string; name: string } | null>(null);
  const [resultForm, setResultForm] = useState({ marks: 0, remarks: "" });
  const [resultToDelete, setResultToDelete] = useState<string | null>(null);

  const subjectLabel = subSubject ? `${subjectTitle} - ${subSubject}` : subjectTitle;

  // Fetch students enrolled in this subject
  const { data: students = [] } = useQuery({
    queryKey: ["subject-students", assignedClass, subjectId, subSubject],
    queryFn: async () => {
      // Get all class students
      const { data: classStudents, error: classError } = await supabase
        .from("students_data")
        .select("id, full_name, admission_number")
        .eq("class", assignedClass)
        .order("full_name");
      
      if (classError) throw classError;
      if (!classStudents || classStudents.length === 0) return [];

      // Check if compulsory subject
      const { data: offerings } = await supabase
        .from("class_subject_offerings")
        .select("offering_type")
        .eq("class_name", assignedClass)
        .eq("subject_id", subjectId)
        .maybeSingle();

      if (offerings?.offering_type === "compulsory") {
        return classStudents;
      }

      // Get students enrolled in this subject
      const studentIds = classStudents.map(s => s.id);
      let query = supabase
        .from("student_subjects")
        .select("student_id")
        .eq("subject_id", subjectId)
        .in("student_id", studentIds);

      if (subSubject) {
        query = query.eq("sub_subject", subSubject);
      }

      const { data: enrolled } = await query;
      if (!enrolled || enrolled.length === 0) return [];

      const enrolledIds = new Set(enrolled.map(e => e.student_id));
      return classStudents.filter(s => enrolledIds.has(s.id));
    },
  });

  // Fetch grade boundaries
  const { data: boundaries = [] } = useQuery({
    queryKey: ["grade-boundaries", assignedClass],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("grade_boundaries")
        .select("*")
        .eq("class_name", assignedClass);
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch current exam results for this subject
  const { data: currentResults = [] } = useQuery({
    queryKey: ["teacher-exam-results", exam.id, subjectLabel],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academic_results")
        .select("*")
        .eq("exam_id", exam.id)
        .eq("subject", subjectLabel);
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch previous exam for comparison
  const { data: previousExam } = useQuery({
    queryKey: ["previous-exam", assignedClass, exam.start_date],
    queryFn: async () => {
      const { data } = await supabase
        .from("exams")
        .select("id")
        .eq("class_name", assignedClass)
        .lt("start_date", exam.start_date)
        .order("start_date", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  // Fetch previous exam results
  const { data: previousResults = [] } = useQuery({
    queryKey: ["teacher-prev-results", previousExam?.id, subjectLabel],
    queryFn: async () => {
      if (!previousExam?.id) return [];
      const { data } = await supabase
        .from("academic_results")
        .select("*")
        .eq("exam_id", previousExam.id)
        .eq("subject", subjectLabel);
      return data || [];
    },
    enabled: !!previousExam?.id,
  });

  // Calculate grade from marks
  const calculateGrade = (marks: number): { grade: string; points: number } => {
    // Subject-specific boundaries first
    const subjectBoundaries = boundaries.filter(
      (b: any) => b.boundary_type === "subject" && b.subject_id === subjectId && (b.sub_subject || "") === (subSubject || "")
    );
    for (const b of subjectBoundaries) {
      if (marks >= b.min_marks && marks <= b.max_marks) {
        return { grade: b.grade, points: b.points };
      }
    }
    // Overall boundaries
    const overallBoundaries = boundaries.filter((b: any) => b.boundary_type === "overall");
    for (const b of overallBoundaries) {
      if (marks >= b.min_marks && marks <= b.max_marks) {
        return { grade: b.grade, points: b.points };
      }
    }
    return { grade: "E", points: 1 };
  };

  // Build results and previous results map
  const resultsMap = useMemo(() => {
    const map: Record<string, any> = {};
    currentResults.forEach((r: any) => { map[r.student_id] = r; });
    return map;
  }, [currentResults]);

  const prevResultsMap = useMemo(() => {
    const map: Record<string, any> = {};
    previousResults.forEach((r: any) => { map[r.student_id] = r; });
    return map;
  }, [previousResults]);

  // Student stats with rankings
  const studentStats = useMemo(() => {
    const stats = students.map((student: any) => {
      const result = resultsMap[student.id];
      const prevResult = prevResultsMap[student.id];
      const marks = result?.marks || null;
      const prevMarks = prevResult?.marks || null;
      const diff = marks !== null && prevMarks !== null ? marks - prevMarks : null;
      const gradeInfo = marks !== null ? calculateGrade(marks) : { grade: "-", points: 0 };

      return {
        ...student,
        marks,
        grade: gradeInfo.grade,
        points: gradeInfo.points,
        prevMarks,
        diff,
        remarks: result?.remarks || "",
        resultId: result?.id,
      };
    });

    // Sort by marks for positioning
    const sorted = [...stats].filter(s => s.marks !== null).sort((a, b) => (b.marks || 0) - (a.marks || 0));
    sorted.forEach((s, idx) => { s.position = idx + 1; });

    return stats.map(s => ({
      ...s,
      position: sorted.find(x => x.id === s.id)?.position || null
    }));
  }, [students, resultsMap, prevResultsMap]);

  // Analytics
  const subjectAverage = useMemo(() => {
    const withMarks = studentStats.filter(s => s.marks !== null);
    if (withMarks.length === 0) return 0;
    return withMarks.reduce((sum, s) => sum + s.marks, 0) / withMarks.length;
  }, [studentStats]);

  const topImproved = useMemo(() => {
    return [...studentStats]
      .filter(s => s.diff !== null && s.diff > 0)
      .sort((a, b) => (b.diff || 0) - (a.diff || 0))
      .slice(0, 3);
  }, [studentStats]);

  const topDropped = useMemo(() => {
    return [...studentStats]
      .filter(s => s.diff !== null && s.diff < 0)
      .sort((a, b) => (a.diff || 0) - (b.diff || 0))
      .slice(0, 3);
  }, [studentStats]);

  // Save result mutation
  const saveResultMutation = useMutation({
    mutationFn: async () => {
      if (!selectedStudent) return;

      const { grade } = calculateGrade(resultForm.marks);
      const existingResult = resultsMap[selectedStudent.id];

      if (existingResult) {
        const { error } = await supabase
          .from("academic_results")
          .update({ marks: resultForm.marks, grade, remarks: resultForm.remarks })
          .eq("id", existingResult.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("academic_results").insert({
          student_id: selectedStudent.id,
          exam_id: exam.id,
          subject: subjectLabel,
          marks: resultForm.marks,
          grade,
          remarks: resultForm.remarks,
          term: exam.term,
          year: exam.year,
          teacher_id: teacherId,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Result saved");
      queryClient.invalidateQueries({ queryKey: ["teacher-exam-results", exam.id, subjectLabel] });
      setAddDialogOpen(false);
      setSelectedStudent(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to save result");
    },
  });

  // Delete result mutation
  const deleteResultMutation = useMutation({
    mutationFn: async (resultId: string) => {
      const { error } = await supabase.from("academic_results").delete().eq("id", resultId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Result deleted");
      queryClient.invalidateQueries({ queryKey: ["teacher-exam-results", exam.id, subjectLabel] });
      setDeleteConfirmOpen(false);
      setResultToDelete(null);
      setAddDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete result");
    },
  });

  const openResultDialog = (student: any) => {
    setSelectedStudent({ id: student.id, name: student.full_name });
    setResultForm({
      marks: student.marks || 0,
      remarks: student.remarks || "",
    });
    setAddDialogOpen(true);
  };

  const getDiffBadge = (diff: number | null) => {
    if (diff === null) return <Minus className="w-4 h-4 text-muted-foreground" />;
    if (diff > 0) return <span className="flex items-center text-xs text-green-600"><TrendingUp className="w-3 h-3 mr-0.5" />+{diff}</span>;
    if (diff < 0) return <span className="flex items-center text-xs text-red-600"><TrendingDown className="w-3 h-3 mr-0.5" />{diff}</span>;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6 print:space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Exams
        </Button>
        <Button onClick={handleExportPDF} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export PDF
        </Button>
      </div>
      
      {/* Print Header - Only visible when printing */}
      <div className="hidden print:block print:mb-4">
        <h1 className="text-2xl font-bold text-center">{exam.exam_name} - {subjectLabel}</h1>
        <p className="text-center text-muted-foreground">{assignedClass} | {exam.term} {exam.year}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
            <p className="text-xs text-muted-foreground">enrolled in {subjectLabel}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Subject Average</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subjectAverage.toFixed(1)}%</div>
            <Badge variant="outline">{calculateGrade(subjectAverage).grade}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center"><TrendingUp className="w-4 h-4 mr-1 text-green-600" />Top Improved</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {topImproved.length > 0 ? topImproved.map((s, i) => (
              <div key={s.id} className="text-xs flex justify-between">
                <span>{i + 1}. {s.full_name}</span>
                <span className="text-green-600">+{s.diff}</span>
              </div>
            )) : <p className="text-xs text-muted-foreground">No data</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center"><TrendingDown className="w-4 h-4 mr-1 text-red-600" />Most Dropped</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {topDropped.length > 0 ? topDropped.map((s, i) => (
              <div key={s.id} className="text-xs flex justify-between">
                <span>{i + 1}. {s.full_name}</span>
                <span className="text-red-600">{s.diff}</span>
              </div>
            )) : <p className="text-xs text-muted-foreground">No data</p>}
          </CardContent>
        </Card>
      </div>

      {/* Results Table */}
      <Card>
        <CardHeader>
          <CardTitle>{exam.exam_name} - {subjectLabel}</CardTitle>
          <CardDescription>Click on any student to enter or edit marks. {exam.term} {exam.year}</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Adm No.</TableHead>
                  <TableHead className="text-center">Marks</TableHead>
                  <TableHead className="text-center">Grade</TableHead>
                  <TableHead className="text-center">Position</TableHead>
                  <TableHead className="text-center">+/-</TableHead>
                  <TableHead>Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {studentStats.map((student: any, idx: number) => (
                  <TableRow 
                    key={student.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => openResultDialog(student)}
                  >
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell className="font-medium">{student.full_name}</TableCell>
                    <TableCell>{student.admission_number}</TableCell>
                    <TableCell className="text-center">
                      {student.marks !== null ? (
                        <Badge variant="outline">{student.marks}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge>{student.grade}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {student.position !== null ? (
                        student.position <= 3 ? (
                          <Badge className="bg-amber-500 text-white">{student.position}</Badge>
                        ) : student.position
                      ) : "-"}
                    </TableCell>
                    <TableCell className="text-center">{getDiffBadge(student.diff)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                      {student.remarks || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Add/Edit Result Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedStudent?.name ? `Result for ${selectedStudent.name}` : "Add Result"}</DialogTitle>
            <DialogDescription>{subjectLabel} - {exam.exam_name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Marks (0-100)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={resultForm.marks}
                onChange={(e) => setResultForm({ ...resultForm, marks: parseInt(e.target.value) || 0 })}
              />
              {resultForm.marks > 0 && (
                <p className="text-sm text-muted-foreground">
                  Grade: <Badge>{calculateGrade(resultForm.marks).grade}</Badge>
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Remarks (Optional)</Label>
              <Input
                value={resultForm.remarks}
                onChange={(e) => setResultForm({ ...resultForm, remarks: e.target.value })}
                placeholder="Teacher's comments"
              />
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            <div>
              {selectedStudent && resultsMap[selectedStudent.id] && (
                <Button
                  variant="destructive"
                  onClick={() => {
                    setResultToDelete(resultsMap[selectedStudent.id].id);
                    setDeleteConfirmOpen(true);
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
              <Button onClick={() => saveResultMutation.mutate()} disabled={saveResultMutation.isPending}>
                <Save className="w-4 h-4 mr-2" />
                {saveResultMutation.isPending ? "Saving..." : "Save Result"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Result</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this result? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => resultToDelete && deleteResultMutation.mutate(resultToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteResultMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default TeacherExamResults;
