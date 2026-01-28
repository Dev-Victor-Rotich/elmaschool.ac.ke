import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calendar, BarChart3, Lightbulb, BookOpen, Loader2 } from "lucide-react";
import ExamsList from "./ExamsList";
import PerformanceChart from "./PerformanceChart";
import PerformanceInsights from "./PerformanceInsights";
import ExamResultsView from "./ExamResultsView";
import AcademicYearSelector from "@/components/shared/AcademicYearSelector";
import {
  type Exam,
  type ExamResult,
  groupResultsByExam,
  calculateSubjectTrends,
  calculateOverallStats,
  generateInsights,
} from "@/lib/academic-analytics";

interface AcademicAnalyticsProps {
  studentId: string;
  studentClass: string;
}

const AcademicAnalytics = ({ studentId, studentClass }: AcademicAnalyticsProps) => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [viewingResults, setViewingResults] = useState(false);

  // Fetch exams for student's class filtered by academic year
  const { data: exams = [], isLoading: examsLoading } = useQuery({
    queryKey: ["student-exams", studentClass, selectedYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exams")
        .select("*")
        .eq("class_name", studentClass)
        .eq("year", selectedYear)
        .order("start_date", { ascending: false });
      if (error) throw error;
      return (data || []) as Exam[];
    },
    enabled: !!studentClass,
  });

  // Fetch all academic results for the student filtered by academic year
  const { data: allResults = [], isLoading: resultsLoading } = useQuery({
    queryKey: ["student-all-results", studentId, selectedYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academic_results")
        .select("*")
        .eq("student_id", studentId)
        .eq("year", selectedYear)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as ExamResult[];
    },
    enabled: !!studentId,
  });

  // Fetch available years for this student
  const { data: availableYears = [] } = useQuery({
    queryKey: ["student-available-years", studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academic_results")
        .select("year")
        .eq("student_id", studentId);
      if (error) throw error;
      const years = [...new Set((data || []).map(r => r.year))].sort((a, b) => b - a);
      return years;
    },
    enabled: !!studentId,
  });

  // Process data for analytics
  const examWithResults = groupResultsByExam(allResults, exams);
  const subjectTrends = calculateSubjectTrends(allResults, exams);
  const stats = calculateOverallStats(allResults, exams);
  const insights = generateInsights(allResults, exams, stats, subjectTrends);

  // Check if exam has results
  const hasResults = (examId: string) => {
    return allResults.some(r => r.exam_id === examId);
  };

  // Handle view results
  const handleViewResults = (examId: string) => {
    const exam = exams.find(e => e.id === examId);
    if (exam) {
      setSelectedExam(exam);
      setViewingResults(true);
    }
  };

  // Handle back from results view
  const handleBackFromResults = () => {
    setSelectedExam(null);
    setViewingResults(false);
  };

  const isLoading = examsLoading || resultsLoading;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" />
          <p className="text-muted-foreground mt-4">Loading academic data...</p>
        </CardContent>
      </Card>
    );
  }

  // Show detailed results view if viewing an exam
  if (viewingResults && selectedExam) {
    return (
      <ExamResultsView
        exam={selectedExam}
        studentId={studentId}
        studentClass={studentClass}
        onBack={handleBackFromResults}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Academic Analytics
            </CardTitle>
            <CardDescription>
              Track your exams, performance trends, and get personalized insights
            </CardDescription>
          </div>
          <AcademicYearSelector
            selectedYear={selectedYear}
            onYearChange={setSelectedYear}
            availableYears={availableYears}
          />
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="exams" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="exams" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              My Exams
              {exams.length > 0 && (
                <Badge variant="secondary" className="ml-1">{exams.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="trends" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Performance Trends
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              Insights & Predictions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="exams">
            <ExamsList 
              exams={exams} 
              onViewResults={handleViewResults}
              hasResults={hasResults}
            />
          </TabsContent>

          <TabsContent value="trends">
            <PerformanceChart 
              examWithResults={examWithResults}
              subjectTrends={subjectTrends}
              stats={stats}
            />
          </TabsContent>

          <TabsContent value="insights">
            <PerformanceInsights 
              insights={insights}
              stats={stats}
              subjectTrends={subjectTrends}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AcademicAnalytics;
