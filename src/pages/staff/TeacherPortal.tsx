import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { BookOpen, Users, LogOut, Crown, Shield, GraduationCap } from "lucide-react";

interface StudentWithRole {
  id: string;
  full_name: string;
  admission_number: string;
  class: string;
  user_id: string | null;
  role: string | null;
}

interface Subject {
  id: string;
  title: string;
}

const getRoleBadge = (role: string | null) => {
  switch (role) {
    case "student_leader":
      return (
        <Badge className="bg-amber-500/20 text-amber-700 border-amber-500/30 hover:bg-amber-500/30">
          <Crown className="h-3 w-3 mr-1" />
          Leader
        </Badge>
      );
    case "class_rep":
      return (
        <Badge className="bg-blue-500/20 text-blue-700 border-blue-500/30 hover:bg-blue-500/30">
          <Shield className="h-3 w-3 mr-1" />
          Class Rep
        </Badge>
      );
    case "student":
    default:
      return (
        <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-700 border-emerald-500/30 hover:bg-emerald-500/30">
          <GraduationCap className="h-3 w-3 mr-1" />
          Student
        </Badge>
      );
  }
};

const TeacherPortal = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [students, setStudents] = useState<StudentWithRole[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);

  // Result form state
  const [selectedStudent, setSelectedStudent] = useState("");
  const [subject, setSubject] = useState("");
  const [term, setTerm] = useState("");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [marks, setMarks] = useState("");
  const [grade, setGrade] = useState("");
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    checkAuth();
    loadStudents();
    loadSubjects();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    // If super admin is impersonating a teacher, bypass role checks
    const impersonationRaw = localStorage.getItem("impersonation");
    const impersonation = impersonationRaw ? JSON.parse(impersonationRaw) : null;

    const effectiveUserId = impersonation?.userId || session.user.id;

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", effectiveUserId)
      .single();

    if (profile) {
      setUserName(profile.full_name);
    }

    if (!impersonation) {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);

      if (!roles || roles.length === 0 || (roles[0].role !== "teacher" && roles[0].role !== "hod")) {
        toast.error("Access denied");
        navigate("/auth");
      }
    }
  };

  const loadStudents = async () => {
    // First get all registered students
    const { data: studentsData } = await supabase
      .from("students_data")
      .select("id, full_name, admission_number, class, user_id")
      .eq("is_registered", true)
      .order("full_name");

    if (!studentsData) {
      setStudents([]);
      return;
    }

    // Get user_ids that exist
    const userIds = studentsData
      .filter(s => s.user_id)
      .map(s => s.user_id) as string[];

    // Fetch roles for these users
    let rolesMap: Record<string, string> = {};
    if (userIds.length > 0) {
      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", userIds)
        .in("role", ["student", "student_leader", "class_rep"]);

      if (rolesData) {
        rolesData.forEach(r => {
          rolesMap[r.user_id] = r.role;
        });
      }
    }

    // Combine students with their roles
    const studentsWithRoles: StudentWithRole[] = studentsData.map(student => ({
      ...student,
      role: student.user_id ? (rolesMap[student.user_id] || "student") : "student"
    }));

    setStudents(studentsWithRoles);
  };

  const loadSubjects = async () => {
    const { data } = await supabase
      .from("subjects")
      .select("id, title")
      .order("display_order");

    if (data) {
      setSubjects(data);
    }
  };

  const handleSubmitResult = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();

    const { error } = await supabase
      .from("academic_results")
      .insert({
        student_id: selectedStudent,
        subject,
        term,
        year: parseInt(year),
        marks: parseInt(marks),
        grade,
        remarks,
        teacher_id: session?.user.id
      });

    if (error) {
      toast.error("Failed to add result");
    } else {
      toast.success("Result added successfully");
      // Reset form
      setSelectedStudent("");
      setSubject("");
      setTerm("");
      setMarks("");
      setGrade("");
      setRemarks("");
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Teacher Portal</h1>
            <p className="text-sm text-muted-foreground">Welcome, {userName}</p>
          </div>
          <Button onClick={handleLogout} variant="outline">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Add Academic Results
              </CardTitle>
              <CardDescription>Record student performance</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitResult} className="space-y-4">
                <div className="space-y-2">
                  <Label>Student</Label>
                  <Select value={selectedStudent} onValueChange={setSelectedStudent} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select student" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          <div className="flex items-center gap-2">
                            <span>{student.full_name} ({student.admission_number})</span>
                            <span className="text-xs text-muted-foreground">- {student.class}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Select value={subject} onValueChange={setSubject} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subj) => (
                        <SelectItem key={subj.id} value={subj.title}>
                          {subj.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Term</Label>
                    <Select value={term} onValueChange={setTerm} required>
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
                      required
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
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Grade</Label>
                    <Select value={grade} onValueChange={setGrade} required>
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

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Adding..." : "Add Result"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Students List
              </CardTitle>
              <CardDescription>
                Total: {students.length} students | 
                <span className="text-amber-600 ml-1">{students.filter(s => s.role === "student_leader").length} Leaders</span> | 
                <span className="text-blue-600 ml-1">{students.filter(s => s.role === "class_rep").length} Class Reps</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {students.map((student) => (
                  <div key={student.id} className="p-3 border rounded-lg flex items-center justify-between">
                    <div>
                      <p className="font-medium">{student.full_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {student.admission_number} - {student.class}
                      </p>
                    </div>
                    {getRoleBadge(student.role)}
                  </div>
                ))}
                {students.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">No students registered yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default TeacherPortal;
