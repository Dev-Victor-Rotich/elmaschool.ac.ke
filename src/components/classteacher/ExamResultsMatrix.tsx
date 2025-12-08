import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, TrendingUp, TrendingDown, Minus, Trophy, Users, BarChart3, Save } from "lucide-react";
import { toast } from "sonner";

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
  const [selectedCell, setSelectedCell] = useState<{ studentId: string; subject: string; subSubject: string } | null>(null);
  const [resultForm, setResultForm] = useState({ marks: 0, remarks: "" });

  // Fetch students in class
  const { data: students = [] } = useQuery({
    queryKey: ["class-students", assignedClass],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students_data")
        .select("id, full_name, admission_number")
        .eq("class", assignedClass)
        .order("full_name");
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch subject offerings for this class
  const { data: subjectOfferings = [] } = useQuery({
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

  // Fetch current exam results
  const { data: currentResults = [] } = useQuery({
    queryKey: ["exam-results", exam.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academic_results")
        .select("*")
        .eq("exam_id", exam.id);
      if (error) throw error;
      return data || [];
    },
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

  // Fetch teacher assignments
  const { data: teacherAssignments = [] } = useQuery({
    queryKey: ["teacher-assignments", assignedClass],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teacher_subject_assignments")
        .select("*, profiles:teacher_id(full_name)")
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
    return map;
  }, [currentResults]);

  const previousResultsMap = useMemo(() => {
    const map: Record<string, any> = {};
    previousResults.forEach((r: any) => {
      map[`${r.student_id}-${r.subject}`] = r;
    });
    return map;
  }, [previousResults]);

  // Calculate student totals and positions
  const studentStats = useMemo(() => {
    const stats = students.map((student: any) => {
      let totalPoints = 0;
      let totalMarks = 0;
      let subjectCount = 0;
      let previousTotalMarks = 0;

      subjects.forEach((subj) => {
        const key = `${student.id}-${subj.title}${subj.subSubject ? ` - ${subj.subSubject}` : ""}`;
        const result = resultsMap[key];
        const prevResult = previousResultsMap[key];

        if (result) {
          const { points } = calculateGrade(result.marks, subj.subjectId, subj.subSubject);
          totalPoints += points;
          totalMarks += result.marks;
          subjectCount++;
        }
        if (prevResult) {
          previousTotalMarks += prevResult.marks;
        }
      });

      const meanMarks = subjectCount > 0 ? totalMarks / subjectCount : 0;
      const meanGrade = calculateGrade(meanMarks);
      const marksDiff = totalMarks - previousTotalMarks;

      return {
        ...student,
        totalPoints,
        totalMarks,
        subjectCount,
        meanMarks,
        meanGrade,
        marksDiff,
      };
    });

    // Sort by total points for positioning
    stats.sort((a, b) => b.totalPoints - a.totalPoints);
    stats.forEach((s, idx) => {
      s.position = idx + 1;
    });

    return stats;
  }, [students, subjects, resultsMap, previousResultsMap, calculateGrade]);

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

  // Teacher performance analysis
  const teacherPerformance = useMemo(() => {
    const teacherStats: Record<string, { name: string; totalDiff: number; count: number }> = {};

    subjects.forEach((subj) => {
      const assignment = teacherAssignments.find(
        (a: any) => a.subject_id === subj.subjectId && (a.sub_subject || "") === subj.subSubject
      );
      if (!assignment) return;

      const teacherName = (assignment as any).profiles?.full_name || "Unknown";
      if (!teacherStats[teacherName]) {
        teacherStats[teacherName] = { name: teacherName, totalDiff: 0, count: 0 };
      }

      students.forEach((student: any) => {
        const key = `${student.id}-${subj.title}${subj.subSubject ? ` - ${subj.subSubject}` : ""}`;
        const result = resultsMap[key];
        const prevResult = previousResultsMap[key];

        if (result && prevResult) {
          teacherStats[teacherName].totalDiff += result.marks - prevResult.marks;
          teacherStats[teacherName].count++;
        }
      });
    });

    const sorted = Object.values(teacherStats).sort((a, b) => b.totalDiff - a.totalDiff);
    return {
      mostImproved: sorted[0],
      mostDropped: sorted[sorted.length - 1],
    };
  }, [subjects, teacherAssignments, students, resultsMap, previousResultsMap]);

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
        const { error } = await supabase.from("academic_results").insert({
          student_id: selectedCell.studentId,
          exam_id: exam.id,
          subject: subjectLabel,
          marks: resultForm.marks,
          grade,
          remarks: resultForm.remarks,
          term: exam.term,
          year: exam.year,
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
    return studentStats.reduce((sum, s) => sum + s.totalPoints, 0) / studentStats.length;
  }, [studentStats]);

  const classAvgMarks = useMemo(() => {
    if (studentStats.length === 0) return 0;
    return studentStats.reduce((sum, s) => sum + s.meanMarks, 0) / studentStats.length;
  }, [studentStats]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          ← Back to Exam Details
        </Button>
      </div>

      <Tabs defaultValue="matrix" className="space-y-4">
        <TabsList>
          <TabsTrigger value="matrix">
            <Users className="w-4 h-4 mr-2" />
            Results Matrix
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="matrix">
          <Card>
            <CardHeader>
              <CardTitle>{exam.exam_name} - Results Matrix</CardTitle>
              <CardDescription>
                Click on any cell to enter or edit marks. {exam.term} {exam.year}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="w-full">
                <div className="min-w-max">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="sticky left-0 bg-background z-10 min-w-[50px]">#</TableHead>
                        <TableHead className="sticky left-[50px] bg-background z-10 min-w-[150px]">Student</TableHead>
                        <TableHead className="sticky left-[200px] bg-background z-10 min-w-[100px]">Adm No.</TableHead>
                        {subjects.map((subj, idx) => (
                          <TableHead key={idx} className="text-center min-w-[100px]">
                            <div className="text-xs">
                              {subj.title}
                              {subj.subSubject && <div className="text-muted-foreground">{subj.subSubject}</div>}
                            </div>
                          </TableHead>
                        ))}
                        <TableHead className="text-center min-w-[80px] bg-muted/50">Total Pts</TableHead>
                        <TableHead className="text-center min-w-[80px] bg-muted/50">Mean</TableHead>
                        <TableHead className="text-center min-w-[60px] bg-muted/50">Pos</TableHead>
                        <TableHead className="text-center min-w-[60px] bg-muted/50">+/-</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {studentStats.map((student: any, rowIdx: number) => (
                        <TableRow key={student.id}>
                          <TableCell className="sticky left-0 bg-background font-medium">{rowIdx + 1}</TableCell>
                          <TableCell className="sticky left-[50px] bg-background font-medium">{student.full_name}</TableCell>
                          <TableCell className="sticky left-[200px] bg-background text-muted-foreground text-xs">
                            {student.admission_number}
                          </TableCell>
                          {subjects.map((subj, colIdx) => {
                            const key = `${student.id}-${subj.title}${subj.subSubject ? ` - ${subj.subSubject}` : ""}`;
                            const result = resultsMap[key];
                            const prevResult = previousResultsMap[key];
                            const diff = result && prevResult ? result.marks - prevResult.marks : 0;

                            return (
                              <TableCell
                                key={colIdx}
                                className="text-center cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => openAddResultDialog(student.id, subj.title, subj.subSubject)}
                              >
                                {result ? (
                                  <div className="space-y-0.5">
                                    <div className="font-medium">{result.marks}</div>
                                    <Badge variant="outline" className="text-xs">
                                      {result.grade}
                                    </Badge>
                                    {prevResult && getDiffBadge(diff)}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground text-xs">-</span>
                                )}
                              </TableCell>
                            );
                          })}
                          <TableCell className="text-center bg-muted/30 font-bold">{student.totalPoints}</TableCell>
                          <TableCell className="text-center bg-muted/30">
                            <div>{student.meanMarks.toFixed(1)}</div>
                            <Badge variant="secondary" className="text-xs">
                              {student.meanGrade.grade}
                            </Badge>
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
                        <TableCell colSpan={3} className="sticky left-0 bg-muted/50">
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

        <TabsContent value="analytics">
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

            {/* Teacher Performance */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Teacher Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {teacherPerformance.mostImproved && teacherPerformance.mostImproved.count > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground">Most Improved</p>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{teacherPerformance.mostImproved.name}</span>
                        <Badge className="bg-green-100 text-green-700">
                          +{teacherPerformance.mostImproved.totalDiff}
                        </Badge>
                      </div>
                    </div>
                  )}
                  {teacherPerformance.mostDropped && teacherPerformance.mostDropped.count > 0 && teacherPerformance.mostDropped.totalDiff < 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground">Needs Attention</p>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{teacherPerformance.mostDropped.name}</span>
                        <Badge variant="destructive">{teacherPerformance.mostDropped.totalDiff}</Badge>
                      </div>
                    </div>
                  )}
                  {!teacherPerformance.mostImproved?.count && (
                    <p className="text-sm text-muted-foreground">No comparison data available</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Class Overview */}
            <Card className="md:col-span-2 lg:col-span-3">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Class Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{students.length}</div>
                    <div className="text-xs text-muted-foreground">Total Students</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{classAvgPoints.toFixed(1)}</div>
                    <div className="text-xs text-muted-foreground">Avg Points</div>
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
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => saveResultMutation.mutate()} disabled={saveResultMutation.isPending}>
                <Save className="w-4 h-4 mr-2" />
                {saveResultMutation.isPending ? "Saving..." : "Save Result"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
