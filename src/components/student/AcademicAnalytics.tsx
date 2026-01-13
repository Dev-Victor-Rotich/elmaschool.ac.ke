import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, BarChart3, Lightbulb, BookOpen, Loader2 } from "lucide-react";
import ExamsList from "./ExamsList";
import PerformanceChart from "./PerformanceChart";
import PerformanceInsights from "./PerformanceInsights";
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
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [resultsDialogOpen, setResultsDialogOpen] = useState(false);

  // Fetch exams for student's class
  const { data: exams = [], isLoading: examsLoading } = useQuery({
    queryKey: ["student-exams", studentClass],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exams")
        .select("*")
        .eq("class_name", studentClass)
        .order("start_date", { ascending: false });
      if (error) throw error;
      return (data || []) as Exam[];
    },
    enabled: !!studentClass,
  });

  // Fetch all academic results for the student
  const { data: allResults = [], isLoading: resultsLoading } = useQuery({
    queryKey: ["student-all-results", studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academic_results")
        .select("*")
        .eq("student_id", studentId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as ExamResult[];
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

  // Get results for selected exam
  const selectedExamResults = selectedExamId 
    ? allResults.filter(r => r.exam_id === selectedExamId)
    : [];
  const selectedExam = exams.find(e => e.id === selectedExamId);

  // Handle view results
  const handleViewResults = (examId: string) => {
    setSelectedExamId(examId);
    setResultsDialogOpen(true);
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

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Academic Analytics
          </CardTitle>
          <CardDescription>
            Track your exams, performance trends, and get personalized insights
          </CardDescription>
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

      {/* Exam Results Dialog */}
      <Dialog open={resultsDialogOpen} onOpenChange={setResultsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedExam?.exam_name} Results</DialogTitle>
            <DialogDescription>
              Term {selectedExam?.term}, {selectedExam?.year}
            </DialogDescription>
          </DialogHeader>
          
          {selectedExamResults.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead className="text-center">Marks</TableHead>
                    <TableHead className="text-center">Grade</TableHead>
                    <TableHead>Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedExamResults.map((result) => (
                    <TableRow key={result.id}>
                      <TableCell className="font-medium">{result.subject}</TableCell>
                      <TableCell className="text-center">
                        <span className={`font-bold ${
                          result.marks >= 70 ? 'text-green-600' 
                            : result.marks >= 50 ? 'text-amber-600' 
                            : 'text-red-600'
                        }`}>
                          {result.marks}%
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{result.grade || '-'}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {result.remarks || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {/* Summary */}
              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Exam Average</span>
                  <span className="text-xl font-bold">
                    {Math.round(selectedExamResults.reduce((sum, r) => sum + r.marks, 0) / selectedExamResults.length)}%
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-center py-8 text-muted-foreground">
              No results available for this exam yet.
            </p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AcademicAnalytics;
