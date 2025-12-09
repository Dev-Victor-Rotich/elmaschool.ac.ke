import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { FileText, Search, Filter } from "lucide-react";

interface StudentResultsManagerProps {
  assignedClass: string;
}

interface AcademicResult {
  id: string;
  student_id: string;
  subject: string;
  term: string;
  year: number;
  marks: number;
  grade: string | null;
  remarks: string | null;
  teacher_id: string | null;
  created_at: string;
  student?: {
    full_name: string;
    admission_number: string;
  };
  teacher?: {
    full_name: string;
  } | null;
}

export const StudentResultsManager = ({ assignedClass }: StudentResultsManagerProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSubject, setFilterSubject] = useState("all");
  const [filterTerm, setFilterTerm] = useState("all");
  const [filterYear, setFilterYear] = useState("all");
  const [filterStudent, setFilterStudent] = useState("all");

  // Fetch students in the class
  const { data: students = [] } = useQuery({
    queryKey: ['class-students-for-results', assignedClass],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students_data')
        .select('id, full_name, admission_number')
        .eq('class', assignedClass)
        .order('full_name');

      if (error) throw error;
      return data || [];
    },
    enabled: !!assignedClass
  });

  // Fetch all academic results for students in this class
  const { data: results = [], isLoading } = useQuery({
    queryKey: ['class-academic-results', assignedClass, students.map(s => s.id)],
    queryFn: async () => {
      if (students.length === 0) return [];

      const studentIds = students.map(s => s.id);

      const { data, error } = await supabase
        .from('academic_results')
        .select('*')
        .in('student_id', studentIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get teacher names for the results
      const teacherIds = [...new Set((data || []).filter(r => r.teacher_id).map(r => r.teacher_id))];
      
      let teacherMap: Record<string, string> = {};
      if (teacherIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', teacherIds);

        if (profiles) {
          profiles.forEach(p => {
            teacherMap[p.id] = p.full_name;
          });
        }
      }

      // Map student and teacher data
      const studentMap: Record<string, { full_name: string; admission_number: string }> = {};
      students.forEach(s => {
        studentMap[s.id] = { full_name: s.full_name, admission_number: s.admission_number };
      });

      return (data || []).map(result => ({
        ...result,
        student: studentMap[result.student_id],
        teacher: result.teacher_id ? { full_name: teacherMap[result.teacher_id] || 'Unknown' } : null
      })) as AcademicResult[];
    },
    enabled: students.length > 0
  });

  // Get unique subjects, years from results
  const uniqueSubjects = [...new Set(results.map(r => r.subject))].sort();
  const uniqueYears = [...new Set(results.map(r => r.year))].sort((a, b) => b - a);

  // Filter results
  const filteredResults = results.filter(result => {
    const matchesSearch = searchTerm === "" || 
      result.student?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.student?.admission_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.subject.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSubject = filterSubject === "all" || result.subject === filterSubject;
    const matchesTerm = filterTerm === "all" || result.term === filterTerm;
    const matchesYear = filterYear === "all" || result.year.toString() === filterYear;
    const matchesStudent = filterStudent === "all" || result.student_id === filterStudent;

    return matchesSearch && matchesSubject && matchesTerm && matchesYear && matchesStudent;
  });

  // Calculate statistics
  const totalResults = filteredResults.length;
  const avgMarks = totalResults > 0 
    ? (filteredResults.reduce((sum, r) => sum + r.marks, 0) / totalResults).toFixed(1)
    : '0';

  const getGradeBadgeColor = (grade: string | null) => {
    if (!grade) return "bg-muted text-muted-foreground";
    const firstChar = grade.charAt(0);
    switch (firstChar) {
      case 'A': return "bg-emerald-500/20 text-emerald-700 border-emerald-500/30";
      case 'B': return "bg-blue-500/20 text-blue-700 border-blue-500/30";
      case 'C': return "bg-amber-500/20 text-amber-700 border-amber-500/30";
      case 'D': return "bg-orange-500/20 text-orange-700 border-orange-500/30";
      default: return "bg-red-500/20 text-red-700 border-red-500/30";
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalResults}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Marks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgMarks}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Subjects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueSubjects.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Results Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Student Results - {assignedClass}
              </CardTitle>
              <CardDescription>
                View all academic results entered by subject teachers
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Search
              </Label>
              <Input
                placeholder="Student, subject..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Student
              </Label>
              <Select value={filterStudent} onValueChange={setFilterStudent}>
                <SelectTrigger>
                  <SelectValue placeholder="All students" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Students</SelectItem>
                  {students.map(student => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Subject</Label>
              <Select value={filterSubject} onValueChange={setFilterSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="All subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {uniqueSubjects.map(subject => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Term</Label>
              <Select value={filterTerm} onValueChange={setFilterTerm}>
                <SelectTrigger>
                  <SelectValue placeholder="All terms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Terms</SelectItem>
                  <SelectItem value="1">Term 1</SelectItem>
                  <SelectItem value="2">Term 2</SelectItem>
                  <SelectItem value="3">Term 3</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Year</Label>
              <Select value={filterYear} onValueChange={setFilterYear}>
                <SelectTrigger>
                  <SelectValue placeholder="All years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {uniqueYears.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No results found</p>
              <p className="text-sm text-muted-foreground mt-1">
                {results.length === 0 
                  ? "No academic results have been entered yet"
                  : "Try adjusting your filters"}
              </p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Term</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead className="text-center">Marks</TableHead>
                    <TableHead className="text-center">Grade</TableHead>
                    <TableHead>Teacher</TableHead>
                    <TableHead>Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResults.map((result) => (
                    <TableRow key={result.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{result.student?.full_name}</p>
                          <p className="text-xs text-muted-foreground">{result.student?.admission_number}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{result.subject}</Badge>
                      </TableCell>
                      <TableCell>Term {result.term}</TableCell>
                      <TableCell>{result.year}</TableCell>
                      <TableCell className="text-center font-medium">{result.marks}%</TableCell>
                      <TableCell className="text-center">
                        <Badge className={getGradeBadgeColor(result.grade)}>
                          {result.grade || '-'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {result.teacher?.full_name || 'Unknown'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground line-clamp-1">
                          {result.remarks || '-'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentResultsManager;
