import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, Minus, Trophy, Users, BarChart3, Save, Trash2, Download, BookOpen, Info, Loader2, AlertCircle } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { uses7SubjectCalculation, calculate844Points, buildSubjectKey, isSubjectDropped, calculateOverallGradeByPoints, DEFAULT_POINT_BOUNDARIES, type Calculate844PointsResult, type PointBoundary } from "@/lib/grading-utils";

interface ExamResultsMatrixProps {
  exam: any;
  assignedClass: string;
  onBack: () => void;
}

const GRADE_POINTS: Record<string, number> = {
  "A": 12, "A-": 11, "B+": 10, "B": 9, "B-": 8,
  "C+": 7, "C": 6, "C-": 5, "D+": 4, "D": 3, "D-": 2, "E": 1
};

export function ExamResultsMatrix({ exam, assignedClass, onBack }: ExamResultsMatrixProps) {
  const queryClient = useQueryClient();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{ studentId: string; subject: string; subSubject: string } | null>(null);
  const [resultForm, setResultForm] = useState({ marks: 0, remarks: "" });

  // Check if this is a historical exam (different class than currently assigned)
  const isHistoricalExam = exam.class_name !== assignedClass;

  // Fetch students - for current class exams, get all students; for historical, get students with results
  const { data: students = [], isLoading: studentsLoading, error: studentsError } = useQuery({
    queryKey: ["exam-students", exam.id, exam.class_name, assignedClass],
    queryFn: async () => {
      // For exams matching current class, use normal query
      if (!isHistoricalExam) {
        const { data, error } = await supabase
          .from("students_data")
          .select("id, full_name, admission_number")
          .eq("class", assignedClass)
          .order("full_name");
        if (error) throw error;
        return data || [];
      }
      
      // For historical exams, get current students who have results for this exam
      const { data: currentStudents, error: currentError } = await supabase
        .from("students_data")
        .select("id, full_name, admission_number")
        .eq("class", assignedClass);
      
      if (currentError) throw currentError;
      if (!currentStudents || currentStudents.length === 0) return [];
      
      const studentIds = currentStudents.map(s => s.id);
      
      // Check which of these students have results for this exam
      const { data: resultsCheck } = await supabase
        .from("academic_results")
        .select("student_id")
        .eq("exam_id", exam.id)
        .in("student_id", studentIds);
      
      const studentsWithResults = new Set(resultsCheck?.map(r => r.student_id) || []);
      
      return currentStudents.filter(s => studentsWithResults.has(s.id)).sort((a, b) => 
        a.full_name.localeCompare(b.full_name)
      );
    },
  });

  // Fetch subject offerings for this class
  const { data: subjectOfferings = [], isLoading: subjectsLoading, error: subjectsError } = useQuery({
    queryKey: ["class-subject-offerings", assignedClass],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("class_subject_offerings")
        .select("*, subjects(id, title)")
        .eq("class_name", assignedClass)
        .order("subjects(title)");
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch grade boundaries (marks-based)
  const { data: boundaries = [] } = useQuery({
    queryKey: ["grade-boundaries", assignedClass],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("grade_boundaries")
        .select("*")
        .eq("class_name", assignedClass)
        .neq("boundary_for", "points");
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch point-based boundaries for overall grade
  const { data: pointBoundaries = [] } = useQuery({
    queryKey: ["point-boundaries", assignedClass],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("grade_boundaries")
        .select("*")
        .eq("class_name", assignedClass)
        .eq("boundary_for", "points");
      if (error) throw error;
      // Transform to PointBoundary format
      return (data || []).map((b: any) => ({
        grade: b.grade,
        min_points: b.min_points,
        max_points: b.max_points,
      })) as PointBoundary[];
    },
  });

  // Fetch current exam results
  const { data: currentResults = [], isLoading: resultsLoading, error: resultsError } = useQuery({
    queryKey: ["exam-results", exam.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academic_results")
        .select("*")
        .eq("exam_id", exam.id);
      if (error) throw error;
      console.log("Fetched exam results for exam:", exam.id, "Count:", data?.length || 0, "Data:", data);
      return data || [];
    },
    staleTime: 0,
    refetchOnMount: "always",
  });

  // Fetch previous exam for comparison
  const { data: previousExam } = useQuery({
    queryKey: ["previous-exam", assignedClass, exam.start_date],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exams")
        .select("id")
        .eq("class_name", assignedClass)
        .lt("start_date", exam.start_date)
        .order("start_date", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Fetch previous exam results for comparison
  const { data: previousResults = [] } = useQuery({
    queryKey: ["exam-results", previousExam?.id],
    queryFn: async () => {
      if (!previousExam?.id) return [];
      const { data, error } = await supabase
        .from("academic_results")
        .select("*")
        .eq("exam_id", previousExam.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!previousExam?.id,
  });

  // Fetch teacher assignments - use staff_registry for teacher name lookup
  const { data: teacherAssignments = [] } = useQuery({
    queryKey: ["teacher-assignments", assignedClass],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teacher_subject_assignments")
        .select("*, staff_registry:teacher_id(full_name)")
        .eq("class_name", assignedClass);
      if (error) throw error;
      return data || [];
    },
  });

  // Calculate grade from marks
  const calculateGrade = (marks: number, subjectId?: string, subSubject?: string): { grade: string; points: number } => {
    // First try subject-specific boundaries
    if (subjectId && subSubject) {
      const subjectBoundaries = boundaries.filter(
        (b: any) => b.boundary_type === "subject" && b.subject_id === subjectId && b.sub_subject === subSubject
      );
      for (const b of subjectBoundaries) {
        if (marks >= b.min_marks && marks <= b.max_marks) {
          return { grade: b.grade, points: b.points };
        }
      }
    }
    // Fallback to overall boundaries
    const overallBoundaries = boundaries.filter((b: any) => b.boundary_type === "overall");
    for (const b of overallBoundaries) {
      if (marks >= b.min_marks && marks <= b.max_marks) {
        return { grade: b.grade, points: b.points };
      }
    }
    return { grade: "E", points: 1 };
  };

  // Build unique subjects list from offerings
  const subjects = useMemo(() => {
    const unique: { subjectId: string; title: string; subSubject: string }[] = [];
    subjectOfferings.forEach((o: any) => {
      unique.push({
        subjectId: o.subject_id,
        title: o.subjects?.title || "Unknown",
        subSubject: o.sub_subject || "",
      });
    });
    return unique.sort((a, b) => `${a.title}${a.subSubject}`.localeCompare(`${b.title}${b.subSubject}`));
  }, [subjectOfferings]);

  // Build results map for quick lookup
  const resultsMap = useMemo(() => {
    const map: Record<string, any> = {};
    currentResults.forEach((r: any) => {
      map[`${r.student_id}-${r.subject}`] = r;
    });
    console.log("Results Map built:", Object.keys(map).length, "entries. Sample keys:", Object.keys(map).slice(0, 5));
    return map;
  }, [currentResults]);

  const previousResultsMap = useMemo(() => {
    const map: Record<string, any> = {};
    previousResults.forEach((r: any) => {
      map[`${r.student_id}-${r.subject}`] = r;
    });
    return map;
  }, [previousResults]);

  // Check if this class uses 7-subject calculation (Form 3, 4, Grade 10, 11, 12)
  const uses7Subject = uses7SubjectCalculation(assignedClass);

  // Get effective point boundaries (use configured or default)
  const effectivePointBoundaries = pointBoundaries.length > 0 ? pointBoundaries : DEFAULT_POINT_BOUNDARIES;

  // Calculate student totals and positions
  const studentStats = useMemo(() => {
    const stats = students.map((student: any) => {
      let totalPoints = 0;
      let totalMarks = 0;
      let subjectCount = 0;
      let previousTotalMarks = 0;
      let sevenSubjectPoints = 0;
      let droppedSubjects: { subjectTitle: string; subSubject: string; points: number; marks: number }[] = [];
      let countingSubjects: { subjectTitle: string; subSubject: string; points: number; marks: number }[] = [];

      // Collect all student results with grades
      const studentResults: { subjectTitle: string; subSubject: string; points: number; marks: number }[] = [];

      subjects.forEach((subj) => {
        const key = buildSubjectKey(student.id, subj.title, subj.subSubject);
        const result = resultsMap[key];
        const prevResult = previousResultsMap[key];

        if (result) {
          const { points } = calculateGrade(result.marks, subj.subjectId, subj.subSubject);
          totalPoints += points;
          totalMarks += result.marks;
          subjectCount++;
          
          studentResults.push({
            subjectTitle: subj.title,
            subSubject: subj.subSubject,
            points,
            marks: result.marks,
          });
        }
        if (prevResult) {
          previousTotalMarks += prevResult.marks;
        }
      });

      // Apply 7-subject calculation for 8-4-4 classes
      if (uses7Subject && studentResults.length > 0) {
        const calculation = calculate844Points(studentResults);
        sevenSubjectPoints = calculation.countingPoints;
        droppedSubjects = calculation.droppedSubjects;
        countingSubjects = calculation.countingSubjects;
      } else {
        sevenSubjectPoints = totalPoints;
        countingSubjects = studentResults;
      }

      const meanMarks = subjectCount > 0 ? totalMarks / subjectCount : 0;
      const meanGrade = calculateGrade(meanMarks);
      const marksDiff = totalMarks - previousTotalMarks;

      // Calculate overall grade based on points (for 7-subject classes)
      const overallGrade = uses7Subject 
        ? calculateOverallGradeByPoints(sevenSubjectPoints, effectivePointBoundaries)
        : meanGrade;

      return {
        ...student,
        totalPoints,
        sevenSubjectPoints,
        totalMarks,
        subjectCount,
        meanMarks,
        meanGrade,
        overallGrade, // New: point-based overall grade
        marksDiff,
        droppedSubjects,
        countingSubjects,
      };
    });

    // Sort by 7-subject points for 8-4-4 classes, with mean as tie-breaker
    if (uses7Subject) {
      stats.sort((a, b) => {
        // Primary sort: by 7-subject points (descending)
        if (b.sevenSubjectPoints !== a.sevenSubjectPoints) {
          return b.sevenSubjectPoints - a.sevenSubjectPoints;
        }
        // Tie-breaker: by mean marks (descending)
        return b.meanMarks - a.meanMarks;
      });
    } else {
      stats.sort((a, b) => b.totalPoints - a.totalPoints);
    }
    
    stats.forEach((s, idx) => {
      s.position = idx + 1;
    });

    return stats;
  }, [students, subjects, resultsMap, previousResultsMap, calculateGrade, uses7Subject, effectivePointBoundaries]);

  // Calculate subject statistics
  const subjectStats = useMemo(() => {
    return subjects.map((subj) => {
      let totalMarks = 0;
      let count = 0;

      students.forEach((student: any) => {
        const key = `${student.id}-${subj.title}${subj.subSubject ? ` - ${subj.subSubject}` : ""}`;
        const result = resultsMap[key];
        if (result) {
          totalMarks += result.marks;
          count++;
        }
      });

      const average = count > 0 ? totalMarks / count : 0;
      const meanGrade = calculateGrade(average, subj.subjectId, subj.subSubject);

      return { ...subj, average, meanGrade, count };
    });
  }, [subjects, students, resultsMap, calculateGrade]);

  // Top 3 improved and dropped students
  const topImproved = useMemo(() => {
    return [...studentStats]
      .filter((s) => s.marksDiff > 0)
      .sort((a, b) => b.marksDiff - a.marksDiff)
      .slice(0, 3);
  }, [studentStats]);

  const topDropped = useMemo(() => {
    return [...studentStats]
      .filter((s) => s.marksDiff < 0)
      .sort((a, b) => a.marksDiff - b.marksDiff)
      .slice(0, 3);
  }, [studentStats]);

  // Subject performance analysis (replacing teacher performance)
  const subjectPerformance = useMemo(() => {
    const subjectStats: Record<string, { name: string; totalDiff: number; count: number }> = {};

    subjects.forEach((subj) => {
      const subjectLabel = subj.subSubject ? `${subj.title} - ${subj.subSubject}` : subj.title;
      subjectStats[subjectLabel] = { name: subjectLabel, totalDiff: 0, count: 0 };

      students.forEach((student: any) => {
        const key = `${student.id}-${subjectLabel}`;
        const result = resultsMap[key];
        const prevResult = previousResultsMap[key];

        if (result && prevResult) {
          subjectStats[subjectLabel].totalDiff += result.marks - prevResult.marks;
          subjectStats[subjectLabel].count++;
        }
      });
    });

    const sorted = Object.values(subjectStats)
      .filter(s => s.count > 0)
      .sort((a, b) => b.totalDiff - a.totalDiff);
    
    return {
      mostImproved: sorted[0],
      mostDropped: sorted[sorted.length - 1],
    };
  }, [subjects, students, resultsMap, previousResultsMap]);

  // PDF Export function
  const handleExportPDF = () => {
    window.print();
  };

  // Save result mutation
  const saveResultMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCell) return;

      const subjectLabel = `${selectedCell.subject}${selectedCell.subSubject ? ` - ${selectedCell.subSubject}` : ""}`;
      const { grade, points } = calculateGrade(
        resultForm.marks,
        subjects.find((s) => s.title === selectedCell.subject && s.subSubject === selectedCell.subSubject)?.subjectId,
        selectedCell.subSubject
      );

      const existingResult = resultsMap[`${selectedCell.studentId}-${subjectLabel}`];

      if (existingResult) {
        const { error } = await supabase
          .from("academic_results")
          .update({
            marks: resultForm.marks,
            grade,
            remarks: resultForm.remarks,
          })
          .eq("id", existingResult.id);
        if (error) throw error;
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase.from("academic_results").insert({
          student_id: selectedCell.studentId,
          exam_id: exam.id,
          subject: subjectLabel,
          marks: resultForm.marks,
          grade,
          remarks: resultForm.remarks,
          term: exam.term,
          year: exam.year,
          teacher_id: user?.id,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Result saved");
      queryClient.invalidateQueries({ queryKey: ["exam-results", exam.id] });
      setAddDialogOpen(false);
      setSelectedCell(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to save result");
    },
  });

  // Delete result mutation
  const deleteResultMutation = useMutation({
    mutationFn: async (resultId: string) => {
      const { error } = await supabase
        .from("academic_results")
        .delete()
        .eq("id", resultId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Result deleted");
      queryClient.invalidateQueries({ queryKey: ["exam-results", exam.id] });
      setAddDialogOpen(false);
      setDeleteConfirmOpen(false);
      setSelectedCell(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete result");
    },
  });

  // Get current result ID for delete
  const getCurrentResultId = () => {
    if (!selectedCell) return null;
    const subjectLabel = `${selectedCell.subject}${selectedCell.subSubject ? ` - ${selectedCell.subSubject}` : ""}`;
    return resultsMap[`${selectedCell.studentId}-${subjectLabel}`]?.id;
  };

  const openAddResultDialog = (studentId: string, subject: string, subSubject: string) => {
    const subjectLabel = `${subject}${subSubject ? ` - ${subSubject}` : ""}`;
    const existingResult = resultsMap[`${studentId}-${subjectLabel}`];

    setSelectedCell({ studentId, subject, subSubject });
    setResultForm({
      marks: existingResult?.marks || 0,
      remarks: existingResult?.remarks || "",
    });
    setAddDialogOpen(true);
  };

  const getDiffBadge = (diff: number) => {
    if (diff > 0) {
      return (
        <span className="flex items-center text-xs text-green-600">
          <TrendingUp className="w-3 h-3 mr-0.5" />+{diff}
        </span>
      );
    } else if (diff < 0) {
      return (
        <span className="flex items-center text-xs text-red-600">
          <TrendingDown className="w-3 h-3 mr-0.5" />{diff}
        </span>
      );
    }
    return <Minus className="w-3 h-3 text-muted-foreground" />;
  };

  // Class averages
  const classAvgPoints = useMemo(() => {
    if (studentStats.length === 0) return 0;
    // Use 7-subject points for 8-4-4, total points otherwise
    if (uses7Subject) {
      return studentStats.reduce((sum, s) => sum + s.sevenSubjectPoints, 0) / studentStats.length;
    }
    return studentStats.reduce((sum, s) => sum + s.totalPoints, 0) / studentStats.length;
  }, [studentStats, uses7Subject]);

  const classAvgMarks = useMemo(() => {
    if (studentStats.length === 0) return 0;
    return studentStats.reduce((sum, s) => sum + s.meanMarks, 0) / studentStats.length;
  }, [studentStats]);

  // Loading state
  const isLoading = studentsLoading || subjectsLoading || resultsLoading;
  const hasError = studentsError || subjectsError || resultsError;

  // Debug effect
  useEffect(() => {
    console.log("ExamResultsMatrix Debug:", {
      examId: exam.id,
      studentsCount: students.length,
      subjectsCount: subjects.length,
      resultsCount: currentResults.length,
      isLoading,
      hasError: hasError ? String(hasError) : null,
    });
  }, [exam.id, students.length, subjects.length, currentResults.length, isLoading, hasError]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading exam results...</p>
      </div>
    );
  }

  if (hasError) {
    const getErrorMessage = (err: unknown): string => {
      if (!err) return '';
      if (typeof err === 'string') return err;
      if (err instanceof Error) return err.message;
      if (typeof err === 'object' && 'message' in err) return String((err as any).message);
      return JSON.stringify(err);
    };

    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={onBack}>
          ← Back to Exam Details
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error loading data</AlertTitle>
          <AlertDescription>
            Failed to load exam results. Please try again.
            {studentsError && <div className="text-xs mt-1">Students: {getErrorMessage(studentsError)}</div>}
            {subjectsError && <div className="text-xs mt-1">Subjects: {getErrorMessage(subjectsError)}</div>}
            {resultsError && <div className="text-xs mt-1">Results: {getErrorMessage(resultsError)}</div>}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 print:space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <Button variant="ghost" onClick={onBack}>
          ← Back to Exam Details
        </Button>
        <Button onClick={handleExportPDF} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export PDF
        </Button>
      </div>
      
      {/* Print Header - Only visible when printing */}
      <div className="hidden print:block print:mb-4">
        <h1 className="text-2xl font-bold text-center">{exam.exam_name} - Results Matrix</h1>
        <p className="text-center text-muted-foreground">{assignedClass} | {exam.term} {exam.year}</p>
      </div>

      <Tabs defaultValue="matrix" className="space-y-4">
        <TabsList className="print:hidden">
          <TabsTrigger value="matrix">
            <Users className="w-4 h-4 mr-2" />
            Results Matrix
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="matrix" className="print:block">
          {/* 8-4-4 Info Banner */}
          {uses7Subject && (
            <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800 print:hidden">
              <p className="text-sm text-amber-800 dark:text-amber-200 flex items-center gap-2">
                <Info className="h-4 w-4 flex-shrink-0" />
              <span>
                  <strong>7-Subject Grading:</strong> Positions are based on 7-subject points. 
                  Dropped subjects are shown with strikethrough and marked "dropped".
                </span>
              </p>
            </div>
          )}
          
          <Card className="print-results-matrix">
            <CardHeader className="print:pb-2">
              <CardTitle className="print:text-lg">{exam.exam_name} - Results Matrix</CardTitle>
              <CardDescription className="print:hidden">
                Click on any cell to enter or edit marks. {exam.term} {exam.year}
                {uses7Subject && " • Using 7-Subject Points calculation"}
              </CardDescription>
            </CardHeader>
            <CardContent className="print:p-2">
              <ScrollArea className="w-full print:overflow-visible">
                <div className="min-w-max print:min-w-0 print:w-full">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="sticky left-0 bg-background z-10 min-w-[50px] print:static print:min-w-0">#</TableHead>
                        <TableHead className="sticky left-[50px] bg-background z-10 min-w-[150px] print:static print:min-w-0">Student</TableHead>
                        <TableHead className="sticky left-[200px] bg-background z-10 min-w-[100px] print:static print:min-w-0">Adm No.</TableHead>
                        {subjects.map((subj, idx) => (
                          <TableHead key={idx} className="text-center min-w-[80px] print:min-w-0">
                            <div className="text-xs">
                              {subj.title.substring(0, 4)}
                              {subj.subSubject && (
                                <div className="text-muted-foreground" title={subj.subSubject}>
                                  {subj.subSubject.substring(0, 4)}
                                </div>
                              )}
                            </div>
                          </TableHead>
                        ))}
                        <TableHead className="text-center min-w-[80px] bg-muted/50">
                          {uses7Subject ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="flex items-center justify-center gap-1 cursor-help">
                                    7-Subj Pts
                                    <Info className="h-3 w-3" />
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <p>Best 7 subjects: Best 2 of 3 Sciences, Best 2 of 3+ Technical, Best 2 of 3 Humanities+Religious, plus core subjects.</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : "Total Pts"}
                        </TableHead>
                        <TableHead className="text-center min-w-[80px] bg-muted/50">
                          {uses7Subject ? "Overall Grade" : "Mean Grade"}
                        </TableHead>
                        <TableHead className="text-center min-w-[80px] bg-muted/50">
                          {uses7Subject ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="flex items-center justify-center gap-1 cursor-help">
                                    Mean
                                    <Info className="h-3 w-3" />
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Used as tie-breaker when points are equal</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : "Mean"}
                        </TableHead>
                        <TableHead className="text-center min-w-[60px] bg-muted/50">Pos</TableHead>
                        <TableHead className="text-center min-w-[60px] bg-muted/50">+/-</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {studentStats.map((student: any, rowIdx: number) => (
                        <TableRow key={student.id}>
                          <TableCell className="sticky left-0 bg-background font-medium print:static">{rowIdx + 1}</TableCell>
                          <TableCell className="sticky left-[50px] bg-background font-medium print:static">{student.full_name}</TableCell>
                          <TableCell className="sticky left-[200px] bg-background text-muted-foreground text-xs print:static">
                            {student.admission_number}
                          </TableCell>
                          {subjects.map((subj, colIdx) => {
                            const key = buildSubjectKey(student.id, subj.title, subj.subSubject);
                            const result = resultsMap[key];
                            const prevResult = previousResultsMap[key];
                            const diff = result && prevResult ? result.marks - prevResult.marks : 0;
                            const isDropped = uses7Subject && isSubjectDropped(subj.title, subj.subSubject, student.droppedSubjects);

                            return (
                              <TableCell
                                key={colIdx}
                                className={`text-center cursor-pointer hover:bg-muted/50 transition-colors ${
                                  isDropped ? "bg-muted/30 opacity-60" : ""
                                }`}
                                onClick={() => openAddResultDialog(student.id, subj.title, subj.subSubject)}
                              >
                                {result ? (
                                  <div className="space-y-0.5">
                                    <div className={`font-medium ${isDropped ? "line-through text-muted-foreground" : ""}`}>
                                      {result.marks}
                                    </div>
                                    <Badge variant="outline" className={`text-xs ${isDropped ? "opacity-50" : ""}`}>
                                      {result.grade}
                                    </Badge>
                                    {prevResult && getDiffBadge(diff)}
                                    {isDropped && (
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <span className="text-[10px] text-muted-foreground block">dropped</span>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Not counted in 7-subject total</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground text-xs">-</span>
                                )}
                              </TableCell>
                            );
                          })}
                          <TableCell className="text-center bg-muted/30 font-bold">
                            {uses7Subject ? student.sevenSubjectPoints : student.totalPoints}
                          </TableCell>
                          <TableCell className="text-center bg-muted/30">
                            <Badge variant="secondary" className="text-xs font-bold">
                              {uses7Subject ? student.overallGrade.grade : student.meanGrade.grade}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center bg-muted/30">
                            <div className="text-sm">{student.meanMarks.toFixed(1)}</div>
                            {!uses7Subject && (
                              <Badge variant="outline" className="text-xs">
                                {student.meanGrade.grade}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center bg-muted/30">
                            <Badge variant={student.position <= 3 ? "default" : "outline"}>
                              {student.position}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center bg-muted/30">{getDiffBadge(student.marksDiff)}</TableCell>
                        </TableRow>
                      ))}

                      {/* Subject Averages Row */}
                      <TableRow className="bg-muted/50 font-medium">
                        <TableCell colSpan={3} className="sticky left-0 bg-muted/50 print:static">
                          Subject Averages
                        </TableCell>
                        {subjectStats.map((subj, idx) => (
                          <TableCell key={idx} className="text-center">
                            <div>{subj.average.toFixed(1)}</div>
                            <Badge variant="outline" className="text-xs">
                              {subj.meanGrade.grade}
                            </Badge>
                          </TableCell>
                        ))}
                        <TableCell className="text-center bg-muted">{classAvgPoints.toFixed(1)}</TableCell>
                        <TableCell className="text-center bg-muted">-</TableCell>
                        <TableCell className="text-center bg-muted">{classAvgMarks.toFixed(1)}</TableCell>
                        <TableCell colSpan={2}></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="print:hidden">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Top 3 Improved */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Most Improved Students
                </CardTitle>
              </CardHeader>
              <CardContent>
                {topImproved.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No improvement data available</p>
                ) : (
                  <div className="space-y-3">
                    {topImproved.map((student, idx) => (
                      <div key={student.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Trophy className={`h-4 w-4 ${idx === 0 ? "text-yellow-500" : idx === 1 ? "text-gray-400" : "text-amber-600"}`} />
                          <span className="font-medium">{student.full_name}</span>
                        </div>
                        <Badge className="bg-green-100 text-green-700">+{student.marksDiff}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top 3 Dropped */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                  Most Dropped Students
                </CardTitle>
              </CardHeader>
              <CardContent>
                {topDropped.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No drop data available</p>
                ) : (
                  <div className="space-y-3">
                    {topDropped.map((student, idx) => (
                      <div key={student.id} className="flex items-center justify-between">
                        <span className="font-medium">{student.full_name}</span>
                        <Badge variant="destructive">{student.marksDiff}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Subject Performance */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Subject Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {subjectPerformance.mostImproved && subjectPerformance.mostImproved.count > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground">Most Improved Subject</p>
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{subjectPerformance.mostImproved.name}</span>
                        <Badge className="bg-green-100 text-green-700">
                          +{subjectPerformance.mostImproved.totalDiff}
                        </Badge>
                      </div>
                    </div>
                  )}
                  {subjectPerformance.mostDropped && subjectPerformance.mostDropped.count > 0 && subjectPerformance.mostDropped.totalDiff < 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground">Needs Attention</p>
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{subjectPerformance.mostDropped.name}</span>
                        <Badge variant="destructive">{subjectPerformance.mostDropped.totalDiff}</Badge>
                      </div>
                    </div>
                  )}
                  {!subjectPerformance.mostImproved?.count && (
                    <p className="text-sm text-muted-foreground">No comparison data available</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Class Overview */}
            <Card className="md:col-span-2 lg:col-span-3">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Class Overview</CardTitle>
                {uses7Subject && (
                  <CardDescription>
                    Using 7-Subject Points calculation
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{students.length}</div>
                    <div className="text-xs text-muted-foreground">Total Students</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{classAvgPoints.toFixed(1)}</div>
                    <div className="text-xs text-muted-foreground">
                      {uses7Subject ? "Avg 7-Subj Points" : "Avg Points"}
                    </div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{classAvgMarks.toFixed(1)}%</div>
                    <div className="text-xs text-muted-foreground">Avg Mean Score</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{subjects.length}</div>
                    <div className="text-xs text-muted-foreground">Subjects</div>
                  </div>
                </div>
                
                {/* 8-4-4 Grading Rules Info */}
                {uses7Subject && (
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h4 className="font-medium text-sm text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      7-Subject Points Calculation Rules
                    </h4>
                    <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                      <li>• <strong>Sciences (Bio, Chem, Phys):</strong> Best 2 out of 3 count</li>
                      <li>• <strong>Technical (Agri, Home Sci, Comp, Bus):</strong> Best 2 out of 3+ count</li>
                      <li>• <strong>Humanities + Religious (Hist, Geo, CRE/IRE/HRE):</strong> Best 2 out of 3 count</li>
                      <li>• <strong>Core subjects:</strong> All count (Eng, Kis, Math)</li>
                      <li>• <strong>Final:</strong> Top 7 subjects by points are summed</li>
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Result Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Result</DialogTitle>
            <DialogDescription>
              {selectedCell &&
                `${students.find((s: any) => s.id === selectedCell.studentId)?.full_name} - ${selectedCell.subject}${selectedCell.subSubject ? ` (${selectedCell.subSubject})` : ""}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Marks (0-100)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={resultForm.marks}
                onChange={(e) => setResultForm({ ...resultForm, marks: parseInt(e.target.value) || 0 })}
              />
              {selectedCell && (
                <p className="text-sm text-muted-foreground">
                  Grade:{" "}
                  <Badge variant="outline">
                    {calculateGrade(
                      resultForm.marks,
                      subjects.find((s) => s.title === selectedCell.subject && s.subSubject === selectedCell.subSubject)?.subjectId,
                      selectedCell.subSubject
                    ).grade}
                  </Badge>
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Remarks (Optional)</Label>
              <Input
                placeholder="e.g., Excellent work"
                value={resultForm.remarks}
                onChange={(e) => setResultForm({ ...resultForm, remarks: e.target.value })}
              />
            </div>
            <div className="flex justify-between">
              <div>
                {getCurrentResultId() && (
                  <Button 
                    variant="destructive" 
                    onClick={() => setDeleteConfirmOpen(true)}
                    disabled={deleteResultMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Result
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => saveResultMutation.mutate()} disabled={saveResultMutation.isPending}>
                  <Save className="w-4 h-4 mr-2" />
                  {saveResultMutation.isPending ? "Saving..." : "Save Result"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Result?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this result. This action cannot be undone.
              Use this if you accidentally entered a result for the wrong subject.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                const resultId = getCurrentResultId();
                if (resultId) deleteResultMutation.mutate(resultId);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteResultMutation.isPending ? "Deleting..." : "Delete Result"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
