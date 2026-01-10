import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BookOpen, GraduationCap, ChevronRight, ArrowLeft, Trash2, FileText, Calendar } from "lucide-react";
import TeacherExamResults from "@/components/teacher/TeacherExamResults";

interface TeacherAssignment {
  id: string;
  class_name: string;
  subject_id: string;
  sub_subject: string | null;
  subject: {
    id: string;
    title: string;
  };
}

interface MyClassesManagerProps {
  userId: string;
}

const MyClassesManager = ({ userId }: MyClassesManagerProps) => {
  const queryClient = useQueryClient();
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<TeacherAssignment | null>(null);
  const [selectedExam, setSelectedExam] = useState<any | null>(null);
  const [showMyResults, setShowMyResults] = useState(false);
  const [deleteResultId, setDeleteResultId] = useState<string | null>(null);

  // Get staff_registry.id using email
  const { data: staffRecord, isLoading: staffLoading } = useQuery({
    queryKey: ['my-staff-record'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) return null;
      
      const { data } = await supabase
        .from('staff_registry')
        .select('id')
        .eq('email', user.email)
        .maybeSingle();
      return data;
    }
  });

  // teacherRegistryId = staff_registry.id (used for teaching assignments lookups)
  // teacherAuthId = userId (auth.users.id - used for academic_results.teacher_id FK)
  const teacherRegistryId = staffRecord?.id;
  const teacherAuthId = userId;

  // Fetch teacher's subject assignments using registry ID (or both IDs for robustness)
  const { data: assignments, isLoading: assignmentsLoading } = useQuery({
    queryKey: ['my-teaching-assignments', teacherRegistryId, teacherAuthId],
    queryFn: async () => {
      // Query with both IDs to handle any historical data inconsistencies
      const idsToQuery = [teacherRegistryId, teacherAuthId].filter(Boolean) as string[];
      if (idsToQuery.length === 0) return [];
      
      const { data, error } = await supabase
        .from('teacher_subject_assignments')
        .select(`
          id,
          class_name,
          subject_id,
          sub_subject,
          subject:subjects!teacher_subject_assignments_subject_id_fkey (
            id,
            title
          )
        `)
        .in('teacher_id', idsToQuery);

      if (error) throw error;
      return data as unknown as TeacherAssignment[];
    },
    enabled: (!!teacherRegistryId || !!teacherAuthId) && !staffLoading
  });

  // Get unique classes
  const uniqueClasses = [...new Set(assignments?.map(a => a.class_name) || [])];

  // Get subjects for selected class
  const classSubjects = assignments?.filter(a => a.class_name === selectedClass) || [];

  // Fetch exams for selected class
  const { data: exams = [], isLoading: examsLoading } = useQuery({
    queryKey: ['class-exams', selectedClass],
    queryFn: async () => {
      if (!selectedClass) return [];
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .eq('class_name', selectedClass)
        .order('start_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedClass && !!selectedSubject
  });

  // Fetch teacher's added results (using auth user id since that's what we insert with)
  const { data: myResults, isLoading: resultsLoading } = useQuery({
    queryKey: ['my-added-results', teacherAuthId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('academic_results')
        .select(`
          id,
          student_id,
          subject,
          term,
          year,
          marks,
          grade,
          remarks,
          created_at,
          students_data!academic_results_student_id_fkey (
            full_name,
            admission_number,
            class
          )
        `)
        .eq('teacher_id', teacherAuthId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!teacherAuthId && !staffLoading
  });

  // Delete result mutation
  const deleteResultMutation = useMutation({
    mutationFn: async (resultId: string) => {
      const { error } = await supabase
        .from('academic_results')
        .delete()
        .eq('id', resultId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-added-results', teacherAuthId] });
      toast.success('Result deleted successfully');
      setDeleteResultId(null);
    },
    onError: (error: any) => {
      toast.error('Failed to delete result: ' + error.message);
    }
  });

  const handleBack = () => {
    if (selectedExam) {
      setSelectedExam(null);
    } else if (showMyResults) {
      setShowMyResults(false);
    } else if (selectedSubject) {
      setSelectedSubject(null);
    } else if (selectedClass) {
      setSelectedClass(null);
    }
  };

  if (staffLoading || assignmentsLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!assignments || assignments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            My Classes
          </CardTitle>
          <CardDescription>Subject teaching assignments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No teaching assignments yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Ask your class teacher to assign you subjects
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show Exam Results Matrix - pass teacherAuthId for academic_results.teacher_id FK
  if (selectedExam && selectedSubject) {
    return (
      <TeacherExamResults
        exam={selectedExam}
        assignedClass={selectedClass!}
        subjectTitle={selectedSubject.subject.title}
        subSubject={selectedSubject.sub_subject}
        subjectId={selectedSubject.subject_id}
        teacherId={teacherAuthId}
        onBack={handleBack}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              {showMyResults ? 'My Added Results' : 'My Classes'}
            </CardTitle>
            <CardDescription>
              {showMyResults
                ? `${myResults?.length || 0} result${(myResults?.length || 0) !== 1 ? 's' : ''} added by you`
                : selectedSubject 
                  ? `Select an exam to enter results for ${selectedSubject.subject.title}${selectedSubject.sub_subject ? ` (${selectedSubject.sub_subject})` : ''}`
                  : selectedClass 
                    ? `Subjects you teach in ${selectedClass}`
                    : `${uniqueClasses.length} class${uniqueClasses.length !== 1 ? 'es' : ''} assigned`}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {!showMyResults && !selectedClass && !selectedSubject && (
              <Button variant="outline" size="sm" onClick={() => setShowMyResults(true)}>
                <FileText className="h-4 w-4 mr-1" />
                My Results
              </Button>
            )}
            {(selectedClass || selectedSubject || showMyResults) && (
              <Button variant="ghost" size="sm" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* My Results View */}
        {showMyResults && (
          <div className="space-y-4">
            {resultsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : myResults && myResults.length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Term</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead>Marks</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {myResults.map((result: any) => (
                      <TableRow key={result.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{result.students_data?.full_name || 'Unknown'}</p>
                            <p className="text-xs text-muted-foreground">{result.students_data?.admission_number}</p>
                          </div>
                        </TableCell>
                        <TableCell>{result.students_data?.class || '-'}</TableCell>
                        <TableCell>{result.subject}</TableCell>
                        <TableCell>Term {result.term}</TableCell>
                        <TableCell>{result.year}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{result.marks}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge>{result.grade}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleteResultId(result.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No results added yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Select a class, subject, and exam to add student results
                </p>
              </div>
            )}
          </div>
        )}

        {/* Classes List */}
        {!showMyResults && !selectedClass && (
          <div className="space-y-2">
            {uniqueClasses.map((className) => {
              const subjectCount = assignments.filter(a => a.class_name === className).length;
              return (
                <div
                  key={className}
                  onClick={() => setSelectedClass(className)}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <GraduationCap className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{className}</p>
                      <p className="text-sm text-muted-foreground">
                        {subjectCount} subject{subjectCount !== 1 ? 's' : ''} assigned
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              );
            })}
          </div>
        )}

        {/* Subjects for Selected Class */}
        {!showMyResults && selectedClass && !selectedSubject && (
          <div className="space-y-2">
            {classSubjects.map((assignment) => (
              <div
                key={assignment.id}
                onClick={() => setSelectedSubject(assignment)}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-secondary">
                    <BookOpen className="h-5 w-5 text-secondary-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">{assignment.subject.title}</p>
                    {assignment.sub_subject && (
                      <Badge variant="outline" className="mt-1">
                        {assignment.sub_subject}
                      </Badge>
                    )}
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            ))}
          </div>
        )}

        {/* Exam Selector for Selected Subject */}
        {!showMyResults && selectedClass && selectedSubject && !selectedExam && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Select an exam to enter results for {selectedSubject.subject.title}
              {selectedSubject.sub_subject && ` (${selectedSubject.sub_subject})`}
            </div>
            
            {examsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : exams.length > 0 ? (
              <div className="space-y-2">
                {exams.map((exam: any) => (
                  <div
                    key={exam.id}
                    onClick={() => setSelectedExam(exam)}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-primary/10">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{exam.exam_name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">{exam.term} {exam.year}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(exam.start_date).toLocaleDateString()} - {new Date(exam.end_date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No exams available for this class</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Ask the class teacher to create exams first
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteResultId} onOpenChange={(open) => !open && setDeleteResultId(null)}>
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
              onClick={() => deleteResultId && deleteResultMutation.mutate(deleteResultId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteResultMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default MyClassesManager;
