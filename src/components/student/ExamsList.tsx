import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Clock, CheckCircle2, PlayCircle, Eye } from "lucide-react";
import { format } from "date-fns";
import { getExamStatus, type Exam } from "@/lib/academic-analytics";

interface ExamsListProps {
  exams: Exam[];
  onViewResults: (examId: string) => void;
  hasResults: (examId: string) => boolean;
}

const ExamsList = ({ exams, onViewResults, hasResults }: ExamsListProps) => {
  const getStatusBadge = (exam: Exam) => {
    const status = getExamStatus(exam);
    
    switch (status) {
      case 'upcoming':
        return (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
            <Clock className="w-3 h-3 mr-1" />
            Upcoming
          </Badge>
        );
      case 'ongoing':
        return (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30 animate-pulse">
            <PlayCircle className="w-3 h-3 mr-1" />
            Ongoing
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
    }
  };

  const upcomingExams = exams.filter(e => getExamStatus(e) === 'upcoming');
  const ongoingExams = exams.filter(e => getExamStatus(e) === 'ongoing');
  const completedExams = exams.filter(e => getExamStatus(e) === 'completed');

  const sortedExams = [...ongoingExams, ...upcomingExams, ...completedExams];

  if (exams.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No exams registered for your class yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Upcoming</p>
                <p className="text-2xl font-bold text-amber-600">{upcomingExams.length}</p>
              </div>
              <Clock className="w-8 h-8 text-amber-500/50" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-blue-500/30 bg-blue-500/5">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ongoing</p>
                <p className="text-2xl font-bold text-blue-600">{ongoingExams.length}</p>
              </div>
              <PlayCircle className="w-8 h-8 text-blue-500/50" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">{completedExams.length}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Exams Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            All Exams
          </CardTitle>
          <CardDescription>
            Exams registered by your class teacher
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Exam Name</TableHead>
                  <TableHead>Term</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedExams.map((exam) => {
                  const status = getExamStatus(exam);
                  const examHasResults = hasResults(exam.id);
                  
                  return (
                    <TableRow key={exam.id}>
                      <TableCell className="font-medium">{exam.exam_name}</TableCell>
                      <TableCell>Term {exam.term}</TableCell>
                      <TableCell>{exam.year}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(exam.start_date), "MMM d")} - {format(new Date(exam.end_date), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>{getStatusBadge(exam)}</TableCell>
                      <TableCell className="text-right">
                        {status === 'completed' && examHasResults ? (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => onViewResults(exam.id)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View Results
                          </Button>
                        ) : status === 'completed' ? (
                          <span className="text-sm text-muted-foreground">Pending</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExamsList;
