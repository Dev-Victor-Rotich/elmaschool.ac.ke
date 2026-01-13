import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Trophy,
  Target,
  BarChart3,
  PieChart,
  Activity,
  Download,
  BookOpen,
  Info,
  Award,
  AlertTriangle,
  Loader2,
  MessageSquare,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart as RechartsPieChart,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  uses7SubjectCalculation,
  calculate844Points,
  calculateOverallGradeByPoints,
  DEFAULT_POINT_BOUNDARIES,
  type PointBoundary,
} from "@/lib/grading-utils";
import type { Exam, ExamResult } from "@/lib/academic-analytics";

interface ExamResultsViewProps {
  exam: Exam;
  studentId: string;
  studentClass: string;
  onBack: () => void;
}

const GRADE_COLORS: Record<string, string> = {
  "A": "hsl(142, 76%, 36%)",
  "A-": "hsl(142, 69%, 45%)",
  "B+": "hsl(120, 45%, 50%)",
  "B": "hsl(80, 55%, 50%)",
  "B-": "hsl(60, 60%, 50%)",
  "C+": "hsl(45, 80%, 50%)",
  "C": "hsl(35, 85%, 50%)",
  "C-": "hsl(25, 80%, 55%)",
  "D+": "hsl(15, 75%, 55%)",
  "D": "hsl(10, 70%, 50%)",
  "D-": "hsl(5, 75%, 50%)",
  "E": "hsl(0, 85%, 45%)",
};

const SUBJECT_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(220, 70%, 50%)",
  "hsl(160, 60%, 45%)",
  "hsl(30, 80%, 55%)",
  "hsl(280, 65%, 60%)",
  "hsl(200, 75%, 45%)",
];

const ExamResultsView = ({ exam, studentId, studentClass, onBack }: ExamResultsViewProps) => {
  const [activeTab, setActiveTab] = useState("results");

  // Fetch current exam results
  const { data: currentResults = [], isLoading: resultsLoading } = useQuery({
    queryKey: ["exam-results-student", exam.id, studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academic_results")
        .select("*")
        .eq("exam_id", exam.id)
        .eq("student_id", studentId);
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch grade boundaries
  const { data: boundaries = [] } = useQuery({
    queryKey: ["grade-boundaries", studentClass],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("grade_boundaries")
        .select("*")
        .eq("class_name", studentClass)
        .neq("boundary_for", "points");
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch point-based boundaries
  const { data: pointBoundaries = [] } = useQuery({
    queryKey: ["point-boundaries", studentClass],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("grade_boundaries")
        .select("*")
        .eq("class_name", studentClass)
        .eq("boundary_for", "points");
      if (error) throw error;
      return (data || []).map((b: any) => ({
        grade: b.grade,
        min_points: b.min_points,
        max_points: b.max_points,
      })) as PointBoundary[];
    },
  });

  // Fetch previous exam for comparison
  const { data: previousExam } = useQuery({
    queryKey: ["previous-exam-student", studentClass, exam.start_date],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exams")
        .select("id, exam_name")
        .eq("class_name", studentClass)
        .lt("start_date", exam.start_date)
        .order("start_date", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Fetch previous exam results
  const { data: previousResults = [] } = useQuery({
    queryKey: ["previous-results-student", previousExam?.id, studentId],
    queryFn: async () => {
      if (!previousExam?.id) return [];
      const { data, error } = await supabase
        .from("academic_results")
        .select("*")
        .eq("exam_id", previousExam.id)
        .eq("student_id", studentId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!previousExam?.id,
  });

  // Fetch all students' results for class position (anonymized)
  const { data: classResults = [] } = useQuery({
    queryKey: ["class-results-position", exam.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academic_results")
        .select("student_id, marks")
        .eq("exam_id", exam.id);
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch previous exam's class results for position comparison
  const { data: previousClassResults = [] } = useQuery({
    queryKey: ["previous-class-results-position", previousExam?.id],
    queryFn: async () => {
      if (!previousExam?.id) return [];
      const { data, error } = await supabase
        .from("academic_results")
        .select("student_id, marks")
        .eq("exam_id", previousExam.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!previousExam?.id,
  });

  // Check if this class uses 7-subject calculation
  const uses7Subject = uses7SubjectCalculation(studentClass);
  const effectivePointBoundaries = pointBoundaries.length > 0 ? pointBoundaries : DEFAULT_POINT_BOUNDARIES;

  // Calculate grade from marks
  const calculateGrade = (marks: number): { grade: string; points: number } => {
    const overallBoundaries = boundaries.filter((b: any) => b.boundary_type === "overall");
    for (const b of overallBoundaries) {
      if (marks >= b.min_marks && marks <= b.max_marks) {
        return { grade: b.grade, points: b.points };
      }
    }
    // Default grading fallback
    if (marks >= 80) return { grade: "A", points: 12 };
    if (marks >= 75) return { grade: "A-", points: 11 };
    if (marks >= 70) return { grade: "B+", points: 10 };
    if (marks >= 65) return { grade: "B", points: 9 };
    if (marks >= 60) return { grade: "B-", points: 8 };
    if (marks >= 55) return { grade: "C+", points: 7 };
    if (marks >= 50) return { grade: "C", points: 6 };
    if (marks >= 45) return { grade: "C-", points: 5 };
    if (marks >= 40) return { grade: "D+", points: 4 };
    if (marks >= 35) return { grade: "D", points: 3 };
    if (marks >= 30) return { grade: "D-", points: 2 };
    return { grade: "E", points: 1 };
  };

  // Process results
  const processedResults = useMemo(() => {
    const previousMap: Record<string, any> = {};
    previousResults.forEach((r: any) => {
      previousMap[r.subject] = r;
    });

    return currentResults.map((result: any) => {
      const { grade, points } = calculateGrade(result.marks);
      const previousResult = previousMap[result.subject];
      const diff = previousResult ? result.marks - previousResult.marks : null;
      const previousGrade = previousResult ? calculateGrade(previousResult.marks) : null;

      // Parse subject name for 7-subject calculation
      const subjectParts = result.subject.split(" - ");
      const subjectTitle = subjectParts[0];
      const subSubject = subjectParts[1] || "";

      return {
        ...result,
        grade: result.grade || grade,
        points,
        diff,
        previousMarks: previousResult?.marks,
        previousGrade: previousGrade?.grade,
        subjectTitle,
        subSubject,
      };
    }).sort((a, b) => a.subject.localeCompare(b.subject));
  }, [currentResults, previousResults, calculateGrade]);

  // Calculate 7-subject points if applicable
  const calculationResult = useMemo(() => {
    if (!uses7Subject || processedResults.length === 0) return null;

    const studentResults = processedResults.map((r) => ({
      subjectTitle: r.subjectTitle,
      subSubject: r.subSubject,
      points: r.points,
      marks: r.marks,
    }));

    return calculate844Points(studentResults);
  }, [uses7Subject, processedResults]);

  // Calculate totals
  const totals = useMemo(() => {
    if (processedResults.length === 0) {
      return { totalMarks: 0, totalPoints: 0, meanMarks: 0, overallGrade: { grade: "-", points: 0 } };
    }

    const totalMarks = processedResults.reduce((sum, r) => sum + r.marks, 0);
    const totalPoints = processedResults.reduce((sum, r) => sum + r.points, 0);
    const meanMarks = totalMarks / processedResults.length;

    // Use 7-subject points for overall grade if applicable
    const overallGrade = uses7Subject && calculationResult
      ? calculateOverallGradeByPoints(calculationResult.countingPoints, effectivePointBoundaries)
      : calculateGrade(meanMarks);

    return {
      totalMarks,
      totalPoints: uses7Subject && calculationResult ? calculationResult.countingPoints : totalPoints,
      meanMarks,
      overallGrade,
    };
  }, [processedResults, uses7Subject, calculationResult, effectivePointBoundaries]);

  // Calculate class position
  const classPosition = useMemo(() => {
    const studentTotals: Record<string, number> = {};
    classResults.forEach((r: any) => {
      studentTotals[r.student_id] = (studentTotals[r.student_id] || 0) + r.marks;
    });

    const sortedStudents = Object.entries(studentTotals)
      .sort(([, a], [, b]) => b - a);
    
    const position = sortedStudents.findIndex(([id]) => id === studentId) + 1;
    const totalStudents = sortedStudents.length;
    const classAverage = totalStudents > 0 
      ? Object.values(studentTotals).reduce((a, b) => a + b, 0) / totalStudents / (processedResults.length || 1)
      : 0;

    return { position, totalStudents, classAverage };
  }, [classResults, studentId, processedResults.length]);

  // Calculate previous position for comparison
  const positionComparison = useMemo(() => {
    if (previousClassResults.length === 0) {
      return { previousPosition: null, positionDiff: null };
    }

    const prevStudentTotals: Record<string, number> = {};
    previousClassResults.forEach((r: any) => {
      prevStudentTotals[r.student_id] = (prevStudentTotals[r.student_id] || 0) + r.marks;
    });

    const sortedPrev = Object.entries(prevStudentTotals)
      .sort(([, a], [, b]) => b - a);
    
    const previousPosition = sortedPrev.findIndex(([id]) => id === studentId) + 1;
    
    // Position diff: positive means improved (moved up in rank), negative means dropped
    const positionDiff = previousPosition > 0 && classPosition.position > 0
      ? previousPosition - classPosition.position
      : null;

    return { previousPosition: previousPosition || null, positionDiff };
  }, [previousClassResults, studentId, classPosition.position]);

  // Previous exam comparison totals
  const comparisonTotals = useMemo(() => {
    if (previousResults.length === 0) return null;
    
    const prevTotal = previousResults.reduce((sum, r: any) => sum + r.marks, 0);
    const currTotal = processedResults.reduce((sum, r) => sum + r.marks, 0);
    
    return {
      previousTotal: prevTotal,
      currentTotal: currTotal,
      difference: currTotal - prevTotal,
      previousExamName: previousExam?.exam_name || "Previous Exam",
    };
  }, [previousResults, processedResults, previousExam]);

  // Chart data
  const barChartData = useMemo(() => {
    return processedResults.map((r, idx) => ({
      subject: r.subject.length > 15 ? r.subject.substring(0, 12) + "..." : r.subject,
      fullName: r.subject,
      marks: r.marks,
      previousMarks: r.previousMarks || 0,
      fill: SUBJECT_COLORS[idx % SUBJECT_COLORS.length],
    }));
  }, [processedResults]);

  const pieChartData = useMemo(() => {
    const gradeCount: Record<string, number> = {};
    processedResults.forEach((r) => {
      const g = r.grade || calculateGrade(r.marks).grade;
      gradeCount[g] = (gradeCount[g] || 0) + 1;
    });
    return Object.entries(gradeCount).map(([grade, count]) => ({
      name: grade,
      value: count,
      fill: GRADE_COLORS[grade] || "hsl(var(--muted))",
    }));
  }, [processedResults]);

  const radarChartData = useMemo(() => {
    return processedResults.map((r) => ({
      subject: r.subject.split(" - ")[0].substring(0, 10),
      marks: r.marks,
      fullMark: 100,
    }));
  }, [processedResults]);

  // Get strongest and weakest subjects
  const subjectAnalysis = useMemo(() => {
    if (processedResults.length === 0) return { strongest: null, weakest: null, improved: null, dropped: null };

    const sorted = [...processedResults].sort((a, b) => b.marks - a.marks);
    const strongest = sorted[0];
    const weakest = sorted[sorted.length - 1];

    const withDiffs = processedResults.filter((r) => r.diff !== null);
    const sortedByDiff = [...withDiffs].sort((a, b) => (b.diff || 0) - (a.diff || 0));
    const improved = sortedByDiff[0]?.diff > 0 ? sortedByDiff[0] : null;
    const dropped = sortedByDiff[sortedByDiff.length - 1]?.diff < 0 ? sortedByDiff[sortedByDiff.length - 1] : null;

    return { strongest, weakest, improved, dropped };
  }, [processedResults]);

  // Remarks compilation
  const remarksWithContent = useMemo(() => {
    return processedResults.filter((r) => r.remarks && r.remarks.trim() !== "");
  }, [processedResults]);

  const chartConfig: ChartConfig = {
    marks: { label: "Marks", color: "hsl(var(--chart-1))" },
    previousMarks: { label: "Previous", color: "hsl(var(--muted))" },
  };

  const getDiffIcon = (diff: number | null) => {
    if (diff === null) return <Minus className="w-3 h-3 text-muted-foreground" />;
    if (diff > 0) return <ChevronUp className="w-4 h-4 text-green-600" />;
    if (diff < 0) return <ChevronDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-3 h-3 text-muted-foreground" />;
  };

  if (resultsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (processedResults.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No results available for this exam yet.</p>
          <Button onClick={onBack} variant="outline" className="mt-4">
            ← Back to Exams
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button onClick={onBack} variant="ghost" size="sm">
          ← Back to Exams
        </Button>
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Download className="w-4 h-4 mr-2" />
          Download Report
        </Button>
      </div>

      {/* Exam Title */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">{exam.exam_name}</CardTitle>
              <CardDescription>Term {exam.term}, {exam.year} | {studentClass}</CardDescription>
            </div>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {totals.overallGrade.grade}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
        {/* Overall Grade */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overall Grade</p>
                <p 
                  className="text-3xl font-bold"
                  style={{ color: GRADE_COLORS[totals.overallGrade.grade] || "hsl(var(--foreground))" }}
                >
                  {totals.overallGrade.grade}
                </p>
              </div>
              <Award className="w-8 h-8 text-primary/50" />
            </div>
          </CardContent>
        </Card>

        {/* Total Marks */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Marks</p>
                <p className="text-2xl font-bold">{totals.totalMarks}</p>
              </div>
              <Target className="w-8 h-8 text-primary/50" />
            </div>
          </CardContent>
        </Card>

        {/* Mean Score */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Mean Score</p>
                <p className="text-2xl font-bold">{totals.meanMarks.toFixed(1)}%</p>
              </div>
              <Activity className="w-8 h-8 text-blue-500/50" />
            </div>
          </CardContent>
        </Card>

        {/* Points */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {uses7Subject ? "7-Subj Points" : "Total Points"}
                </p>
                <p className="text-2xl font-bold">{totals.totalPoints}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-amber-500/50" />
            </div>
          </CardContent>
        </Card>

        {/* Position with +/- */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Position</p>
                <p className="text-2xl font-bold">
                  {classPosition.position}/{classPosition.totalStudents}
                </p>
                {positionComparison.positionDiff !== null && (
                  <div className={`flex items-center text-sm font-medium ${
                    positionComparison.positionDiff > 0 
                      ? "text-green-600" 
                      : positionComparison.positionDiff < 0 
                        ? "text-red-600" 
                        : "text-muted-foreground"
                  }`}>
                    {positionComparison.positionDiff > 0 ? (
                      <>
                        <ChevronUp className="w-4 h-4" />
                        +{positionComparison.positionDiff}
                      </>
                    ) : positionComparison.positionDiff < 0 ? (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        {positionComparison.positionDiff}
                      </>
                    ) : (
                      <>
                        <Minus className="w-3 h-3 mr-1" />
                        0
                      </>
                    )}
                  </div>
                )}
              </div>
              <Trophy className="w-8 h-8 text-yellow-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comparison Banner */}
      {comparisonTotals && (
        <Card className={comparisonTotals.difference >= 0 ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5"}>
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {comparisonTotals.difference >= 0 ? (
                  <TrendingUp className="w-5 h-5 text-green-600" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-600" />
                )}
                <span className="text-sm">
                  Compared to <strong>{comparisonTotals.previousExamName}</strong>
                </span>
              </div>
              <Badge className={comparisonTotals.difference >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                {comparisonTotals.difference >= 0 ? "+" : ""}{comparisonTotals.difference} marks
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 7-Subject Info */}
      {uses7Subject && calculationResult && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="py-3">
            <div className="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-200">
              <Info className="w-4 h-4" />
              <span>
                <strong>7-Subject Calculation:</strong> {calculationResult.countingSubjects.length} counting, {calculationResult.droppedSubjects.length} dropped
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="results" className="flex items-center gap-1">
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Results</span>
          </TabsTrigger>
          <TabsTrigger value="charts" className="flex items-center gap-1">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Charts</span>
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-1">
            <Activity className="w-4 h-4" />
            <span className="hidden sm:inline">Analysis</span>
          </TabsTrigger>
          <TabsTrigger value="comparison" className="flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            <span className="hidden sm:inline">Compare</span>
          </TabsTrigger>
        </TabsList>

        {/* Results Tab */}
        <TabsContent value="results">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Subject Results</CardTitle>
              <CardDescription>Complete breakdown of your exam performance</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead className="text-center">Marks</TableHead>
                      <TableHead className="text-center">Grade</TableHead>
                      <TableHead className="text-center">Points</TableHead>
                      {previousResults.length > 0 && (
                        <TableHead className="text-center">+/-</TableHead>
                      )}
                      {uses7Subject && <TableHead className="text-center">Status</TableHead>}
                      <TableHead>Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processedResults.map((result) => {
                      const isDropped = uses7Subject && calculationResult
                        ? calculationResult.droppedSubjects.some(
                            d => d.subjectTitle === result.subjectTitle && d.subSubject === result.subSubject
                          )
                        : false;

                      return (
                        <TableRow key={result.id} className={isDropped ? "opacity-60" : ""}>
                          <TableCell className={`font-medium ${isDropped ? "line-through" : ""}`}>
                            {result.subject}
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={`font-bold ${
                              result.marks >= 70 ? "text-green-600"
                                : result.marks >= 50 ? "text-amber-600"
                                : "text-red-600"
                            }`}>
                              {result.marks}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className={isDropped ? "opacity-50" : ""}>
                              {result.grade}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center font-medium">{result.points}</TableCell>
                          {previousResults.length > 0 && (
                            <TableCell className="text-center">
                              {result.diff !== null ? (
                                <div className="flex items-center justify-center gap-1">
                                  {getDiffIcon(result.diff)}
                                  <span className={
                                    result.diff > 0 ? "text-green-600"
                                      : result.diff < 0 ? "text-red-600"
                                      : "text-muted-foreground"
                                  }>
                                    {result.diff > 0 ? "+" : ""}{result.diff}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                          )}
                          {uses7Subject && (
                            <TableCell className="text-center">
                              {isDropped ? (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Badge variant="secondary" className="text-xs">Dropped</Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      Not counted in 7-subject total
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              ) : (
                                <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600">
                                  Counting
                                </Badge>
                              )}
                            </TableCell>
                          )}
                          <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                            {result.remarks || "-"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Charts Tab */}
        <TabsContent value="charts">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Bar Chart */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Subject Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                  <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="subject" 
                      angle={-45} 
                      textAnchor="end" 
                      height={80}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis domain={[0, 100]} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="marks" radius={[4, 4, 0, 0]}>
                      {barChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                    {previousResults.length > 0 && (
                      <Bar dataKey="previousMarks" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} opacity={0.5} />
                    )}
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Grade Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[250px] w-full">
                  <RechartsPieChart>
                    <Pie
                      data={pieChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </RechartsPieChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Radar Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Subject Strength Map
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[250px] w-full">
                  <RadarChart data={radarChartData} cx="50%" cy="50%" outerRadius="70%">
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar
                      name="Marks"
                      dataKey="marks"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.5}
                    />
                  </RadarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Strengths & Weaknesses */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  Subject Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {subjectAnalysis.strongest && (
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                    <p className="text-sm font-medium text-green-700 dark:text-green-300">
                      Strongest Subject
                    </p>
                    <p className="font-bold">{subjectAnalysis.strongest.subject}</p>
                    <p className="text-2xl font-bold text-green-600">{subjectAnalysis.strongest.marks}%</p>
                  </div>
                )}
                {subjectAnalysis.weakest && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                    <p className="text-sm font-medium text-red-700 dark:text-red-300">
                      Needs Improvement
                    </p>
                    <p className="font-bold">{subjectAnalysis.weakest.subject}</p>
                    <p className="text-2xl font-bold text-red-600">{subjectAnalysis.weakest.marks}%</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Improvement/Drop Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  Change from Previous
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {subjectAnalysis.improved ? (
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                    <p className="text-sm font-medium text-green-700 dark:text-green-300">
                      Biggest Improvement
                    </p>
                    <p className="font-bold">{subjectAnalysis.improved.subject}</p>
                    <p className="text-xl font-bold text-green-600">+{subjectAnalysis.improved.diff} marks</p>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No previous exam data to compare</p>
                )}
                {subjectAnalysis.dropped && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                    <p className="text-sm font-medium text-red-700 dark:text-red-300">
                      Biggest Drop
                    </p>
                    <p className="font-bold">{subjectAnalysis.dropped.subject}</p>
                    <p className="text-xl font-bold text-red-600">{subjectAnalysis.dropped.diff} marks</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Class Context */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-500" />
                  Class Context
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Your Position</span>
                  <Badge variant="outline" className="text-lg">
                    {classPosition.position} of {classPosition.totalStudents}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Class Average</span>
                  <span className="font-bold">{classPosition.classAverage.toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Your Average</span>
                  <span className="font-bold">{totals.meanMarks.toFixed(1)}%</span>
                </div>
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-muted-foreground">Performance vs Class</span>
                    <span className={`text-sm font-medium ${
                      totals.meanMarks >= classPosition.classAverage ? "text-green-600" : "text-red-600"
                    }`}>
                      {totals.meanMarks >= classPosition.classAverage ? "+" : ""}
                      {(totals.meanMarks - classPosition.classAverage).toFixed(1)}%
                    </span>
                  </div>
                  <Progress 
                    value={Math.min((totals.meanMarks / 100) * 100, 100)} 
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Teacher Remarks */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-purple-500" />
                  Teacher Remarks
                </CardTitle>
              </CardHeader>
              <CardContent>
                {remarksWithContent.length > 0 ? (
                  <div className="space-y-3 max-h-[200px] overflow-y-auto">
                    {remarksWithContent.map((r) => (
                      <div key={r.id} className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs font-medium text-muted-foreground mb-1">{r.subject}</p>
                        <p className="text-sm">{r.remarks}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No remarks from teachers yet.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Comparison Tab */}
        <TabsContent value="comparison">
          {previousResults.length > 0 ? (
            <div className="space-y-4">
              {/* Summary Comparison */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {previousExam?.exam_name} → {exam.exam_name}
                  </CardTitle>
                  <CardDescription>Subject by subject comparison</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3 mb-6">
                    <Card className="bg-muted/50">
                      <CardContent className="pt-4 text-center">
                        <p className="text-sm text-muted-foreground">Previous Total</p>
                        <p className="text-2xl font-bold">{comparisonTotals?.previousTotal}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-muted/50">
                      <CardContent className="pt-4 text-center">
                        <p className="text-sm text-muted-foreground">Current Total</p>
                        <p className="text-2xl font-bold">{comparisonTotals?.currentTotal}</p>
                      </CardContent>
                    </Card>
                    <Card className={comparisonTotals && comparisonTotals.difference >= 0 
                      ? "bg-green-500/10 border-green-500/30" 
                      : "bg-red-500/10 border-red-500/30"
                    }>
                      <CardContent className="pt-4 text-center">
                        <p className="text-sm text-muted-foreground">Difference</p>
                        <p className={`text-2xl font-bold ${
                          comparisonTotals && comparisonTotals.difference >= 0 ? "text-green-600" : "text-red-600"
                        }`}>
                          {comparisonTotals && comparisonTotals.difference >= 0 ? "+" : ""}
                          {comparisonTotals?.difference}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Comparison Chart */}
                  <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="subject" 
                        angle={-45} 
                        textAnchor="end" 
                        height={80}
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis domain={[0, 100]} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Bar dataKey="previousMarks" name="Previous" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} opacity={0.5} />
                      <Bar dataKey="marks" name="Current" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Detailed Comparison Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Detailed Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subject</TableHead>
                        <TableHead className="text-center">Previous</TableHead>
                        <TableHead className="text-center">Current</TableHead>
                        <TableHead className="text-center">Change</TableHead>
                        <TableHead className="text-center">Trend</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {processedResults.map((result) => (
                        <TableRow key={result.id}>
                          <TableCell className="font-medium">{result.subject}</TableCell>
                          <TableCell className="text-center">
                            {result.previousMarks !== undefined ? (
                              <span className="text-muted-foreground">{result.previousMarks}</span>
                            ) : "-"}
                          </TableCell>
                          <TableCell className="text-center font-bold">{result.marks}</TableCell>
                          <TableCell className="text-center">
                            {result.diff !== null ? (
                              <span className={
                                result.diff > 0 ? "text-green-600 font-medium"
                                  : result.diff < 0 ? "text-red-600 font-medium"
                                  : "text-muted-foreground"
                              }>
                                {result.diff > 0 ? "+" : ""}{result.diff}
                              </span>
                            ) : "-"}
                          </TableCell>
                          <TableCell className="text-center">
                            {result.diff !== null ? (
                              result.diff > 0 ? (
                                <TrendingUp className="w-4 h-4 text-green-600 mx-auto" />
                              ) : result.diff < 0 ? (
                                <TrendingDown className="w-4 h-4 text-red-600 mx-auto" />
                              ) : (
                                <Minus className="w-4 h-4 text-muted-foreground mx-auto" />
                              )
                            ) : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <AlertTriangle className="w-12 h-12 mx-auto text-amber-500 mb-4" />
                <p className="text-muted-foreground">
                  No previous exam results available for comparison.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  This feature will show data after you complete more exams.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ExamResultsView;
