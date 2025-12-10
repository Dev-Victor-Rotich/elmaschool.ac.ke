import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Users, GraduationCap, ChevronRight, Plus, ArrowLeft } from "lucide-react";

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

interface Student {
  id: string;
  full_name: string;
  admission_number: string;
  class: string;
}

interface MyClassesManagerProps {
  userId: string;
}

const MyClassesManager = ({ userId }: MyClassesManagerProps) => {
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<TeacherAssignment | null>(null);
  const [isAddResultOpen, setIsAddResultOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [marks, setMarks] = useState("");
  const [grade, setGrade] = useState("");
  const [remarks, setRemarks] = useState("");
  const [term, setTerm] = useState("");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [loading, setLoading] = useState(false);

  // Fetch teacher's subject assignments
  const { data: assignments, isLoading: assignmentsLoading } = useQuery({
    queryKey: ['my-teaching-assignments', userId],
    queryFn: async () => {
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
        .eq('teacher_id', userId);

      if (error) throw error;
      return data as unknown as TeacherAssignment[];
    },
    enabled: !!userId
  });

  // Get unique classes from assignments
  const uniqueClasses = [...new Set(assignments?.map(a => a.class_name) || [])];

  // Get subjects for selected class
  const classSubjects = assignments?.filter(a => a.class_name === selectedClass) || [];

  // Fetch students in selected class who take the selected subject
  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ['class-subject-students', selectedClass, selectedSubject?.subject_id, selectedSubject?.sub_subject],
    queryFn: async () => {
      if (!selectedClass || !selectedSubject) return [];

      // First get students in this class
      const { data: classStudents, error: classError } = await supabase
        .from('students_data')
        .select('id, full_name, admission_number, class')
        .eq('class', selectedClass)
        .order('full_name');

      if (classError) throw classError;
      if (!classStudents || classStudents.length === 0) return [];

      // Then filter by those who have this subject assigned
      const studentIds = classStudents.map(s => s.id);
      
      let query = supabase
        .from('student_subjects')
        .select('student_id')
        .eq('subject_id', selectedSubject.subject_id)
        .in('student_id', studentIds);

      if (selectedSubject.sub_subject) {
        query = query.eq('sub_subject', selectedSubject.sub_subject);
      }

      const { data: enrolledStudents, error: enrollError } = await query;

      if (enrollError) throw enrollError;

      // If no specific enrollments found, check if this is a compulsory subject
      if (!enrolledStudents || enrolledStudents.length === 0) {
        const { data: offerings } = await supabase
          .from('class_subject_offerings')
          .select('offering_type')
          .eq('class_name', selectedClass)
          .eq('subject_id', selectedSubject.subject_id)
          .maybeSingle();

        // If compulsory, return all class students
        if (offerings?.offering_type === 'compulsory') {
          return classStudents;
        }
        return [];
      }

      const enrolledIds = new Set(enrolledStudents.map(e => e.student_id));
      return classStudents.filter(s => enrolledIds.has(s.id));
    },
    enabled: !!selectedClass && !!selectedSubject
  });

  const handleAddResult = async () => {
    if (!selectedStudent || !marks || !grade || !term || !selectedSubject) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    
    const subjectName = selectedSubject.sub_subject 
      ? `${selectedSubject.subject.title} (${selectedSubject.sub_subject})`
      : selectedSubject.subject.title;

    const { error } = await supabase
      .from('academic_results')
      .insert({
        student_id: selectedStudent,
        subject: subjectName,
        term,
        year: parseInt(year),
        marks: parseInt(marks),
        grade,
        remarks: remarks || null,
        teacher_id: userId
      });

    if (error) {
      if (error.code === '23505') {
        toast.error("Result already exists for this student, subject, term and year");
      } else {
        toast.error("Failed to add result: " + error.message);
      }
    } else {
      toast.success("Result added successfully");
      setIsAddResultOpen(false);
      setSelectedStudent("");
      setMarks("");
      setGrade("");
      setRemarks("");
    }
    setLoading(false);
  };

  const handleBack = () => {
    if (selectedSubject) {
      setSelectedSubject(null);
    } else if (selectedClass) {
      setSelectedClass(null);
    }
  };

  if (assignmentsLoading) {
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              My Classes
            </CardTitle>
            <CardDescription>
              {selectedSubject 
                ? `Students taking ${selectedSubject.subject.title}${selectedSubject.sub_subject ? ` (${selectedSubject.sub_subject})` : ''} in ${selectedClass}`
                : selectedClass 
                  ? `Subjects you teach in ${selectedClass}`
                  : `${uniqueClasses.length} class${uniqueClasses.length !== 1 ? 'es' : ''} assigned`}
            </CardDescription>
          </div>
          {(selectedClass || selectedSubject) && (
            <Button variant="ghost" size="sm" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Classes List */}
        {!selectedClass && (
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
        {selectedClass && !selectedSubject && (
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

        {/* Students for Selected Subject */}
        {selectedClass && selectedSubject && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {students?.length || 0} student{(students?.length || 0) !== 1 ? 's' : ''}
                </span>
              </div>
              <Button size="sm" onClick={() => setIsAddResultOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Add Result
              </Button>
            </div>

            {studentsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : students && students.length > 0 ? (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {students.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{student.full_name}</p>
                      <p className="text-sm text-muted-foreground">{student.admission_number}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedStudent(student.id);
                        setIsAddResultOpen(true);
                      }}
                    >
                      Add Result
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No students enrolled in this subject</p>
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* Add Result Dialog */}
      <Dialog open={isAddResultOpen} onOpenChange={setIsAddResultOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Academic Result</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Student</Label>
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger>
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  {students?.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.full_name} ({student.admission_number})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Term</Label>
                <Select value={term} onValueChange={setTerm}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select term" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Term 1</SelectItem>
                    <SelectItem value="2">Term 2</SelectItem>
                    <SelectItem value="3">Term 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Year</Label>
                <Input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Marks</Label>
                <Input
                  type="number"
                  value={marks}
                  onChange={(e) => setMarks(e.target.value)}
                  placeholder="0-100"
                  min="0"
                  max="100"
                />
              </div>
              <div className="space-y-2">
                <Label>Grade</Label>
                <Select value={grade} onValueChange={setGrade}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">A</SelectItem>
                    <SelectItem value="A-">A-</SelectItem>
                    <SelectItem value="B+">B+</SelectItem>
                    <SelectItem value="B">B</SelectItem>
                    <SelectItem value="B-">B-</SelectItem>
                    <SelectItem value="C+">C+</SelectItem>
                    <SelectItem value="C">C</SelectItem>
                    <SelectItem value="C-">C-</SelectItem>
                    <SelectItem value="D+">D+</SelectItem>
                    <SelectItem value="D">D</SelectItem>
                    <SelectItem value="D-">D-</SelectItem>
                    <SelectItem value="E">E</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Remarks (Optional)</Label>
              <Input
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Teacher's comments"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddResultOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddResult} disabled={loading}>
              {loading ? "Adding..." : "Add Result"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default MyClassesManager;
