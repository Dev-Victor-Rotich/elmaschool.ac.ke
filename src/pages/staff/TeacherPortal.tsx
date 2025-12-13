import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Users, LogOut, Crown, Shield, GraduationCap, Edit, Trash2, ClipboardList } from "lucide-react";
import MyClassesManager from "@/components/staff/MyClassesManager";

interface StudentWithRole {
  id: string;
  full_name: string;
  admission_number: string;
  class: string;
  user_id: string | null;
  role: string | null;
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
  created_at: string;
  student_name?: string;
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
  const [myResults, setMyResults] = useState<AcademicResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentTeacherId, setCurrentTeacherId] = useState<string | null>(null);

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingResult, setEditingResult] = useState<AcademicResult | null>(null);
  const [editMarks, setEditMarks] = useState("");
  const [editGrade, setEditGrade] = useState("");
  const [editRemarks, setEditRemarks] = useState("");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    const impersonationRaw = localStorage.getItem("impersonation");
    const impersonation = impersonationRaw ? JSON.parse(impersonationRaw) : null;
    const effectiveUserId = impersonation?.userId || session.user.id;
    setCurrentTeacherId(effectiveUserId);

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
        return;
      }
    }

    await loadStudents();
    await loadMyResults(effectiveUserId);
  };

  const loadStudents = async () => {
    const { data: rolesData } = await supabase
      .from("user_roles")
      .select("user_id, role")
      .in("role", ["student", "student_leader", "class_rep"]);

    if (!rolesData || rolesData.length === 0) {
      setStudents([]);
      return;
    }

    const userIds = rolesData.map(r => r.user_id);
    const rolesMap: Record<string, string> = {};
    rolesData.forEach(r => {
      rolesMap[r.user_id] = r.role;
    });

    const { data: studentsData } = await supabase
      .from("students_data")
      .select("id, full_name, admission_number, class, user_id")
      .in("user_id", userIds)
      .order("full_name");

    if (!studentsData) {
      setStudents([]);
      return;
    }

    const studentsWithRoles: StudentWithRole[] = studentsData.map(student => ({
      ...student,
      role: student.user_id ? rolesMap[student.user_id] : "student"
    }));

    setStudents(studentsWithRoles);
  };

  const loadMyResults = async (teacherId: string) => {
    const { data } = await supabase
      .from("academic_results")
      .select("*")
      .eq("teacher_id", teacherId)
      .order("created_at", { ascending: false });

    if (data && data.length > 0) {
      const studentIds = [...new Set(data.map(r => r.student_id))];
      const { data: studentsData } = await supabase
        .from("students_data")
        .select("id, full_name")
        .in("id", studentIds);

      const studentNameMap: Record<string, string> = {};
      studentsData?.forEach(s => {
        studentNameMap[s.id] = s.full_name;
      });

      const resultsWithNames = data.map(r => ({
        ...r,
        student_name: studentNameMap[r.student_id] || "Unknown"
      }));

      setMyResults(resultsWithNames);
    } else {
      setMyResults([]);
    }
  };

  const handleEditClick = (result: AcademicResult) => {
    setEditingResult(result);
    setEditMarks(result.marks.toString());
    setEditGrade(result.grade || "");
    setEditRemarks(result.remarks || "");
    setEditModalOpen(true);
  };

  const handleUpdateResult = async () => {
    if (!editingResult) return;

    setLoading(true);
    const { error } = await supabase
      .from("academic_results")
      .update({
        marks: parseInt(editMarks),
        grade: editGrade,
        remarks: editRemarks
      })
      .eq("id", editingResult.id);

    if (error) {
      toast.error("Failed to update result");
    } else {
      toast.success("Result updated successfully");
      setEditModalOpen(false);
      setEditingResult(null);
      if (currentTeacherId) {
        await loadMyResults(currentTeacherId);
      }
    }
    setLoading(false);
  };

  const handleDeleteResult = async (resultId: string) => {
    if (!confirm("Are you sure you want to delete this result?")) return;

    const { error } = await supabase
      .from("academic_results")
      .delete()
      .eq("id", resultId);

    if (error) {
      toast.error("Failed to delete result");
    } else {
      toast.success("Result deleted");
      if (currentTeacherId) {
        await loadMyResults(currentTeacherId);
      }
    }
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
        <Tabs defaultValue="my-classes" className="space-y-6">
          <TabsList>
            <TabsTrigger value="my-classes">
              <GraduationCap className="h-4 w-4 mr-2" />
              My Classes
            </TabsTrigger>
            <TabsTrigger value="students">
              <Users className="h-4 w-4 mr-2" />
              All Students
            </TabsTrigger>
            <TabsTrigger value="my-results">
              <ClipboardList className="h-4 w-4 mr-2" />
              My Results
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-classes">
            {currentTeacherId && <MyClassesManager userId={currentTeacherId} />}
          </TabsContent>

          <TabsContent value="students">
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
                    <p className="text-center text-muted-foreground py-4">No students with assigned roles yet.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="my-results">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" />
                  My Added Results
                </CardTitle>
                <CardDescription>
                  Results you have recorded ({myResults.length} total)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {myResults.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {myResults.map((result) => (
                      <div key={result.id} className="p-4 border rounded-lg flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{result.student_name}</p>
                            <Badge variant="outline">{result.subject}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Term {result.term}, {result.year} • Marks: {result.marks}% • Grade: {result.grade}
                          </p>
                          {result.remarks && (
                            <p className="text-xs text-muted-foreground mt-1">Remarks: {result.remarks}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditClick(result)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteResult(result.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">No results added yet.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Edit Result Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Result</DialogTitle>
          </DialogHeader>
          {editingResult && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium">{editingResult.student_name}</p>
                <p className="text-sm text-muted-foreground">
                  {editingResult.subject} • Term {editingResult.term}, {editingResult.year}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Marks</Label>
                  <Input
                    type="number"
                    value={editMarks}
                    onChange={(e) => setEditMarks(e.target.value)}
                    min="0"
                    max="100"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Grade</Label>
                  <Select value={editGrade} onValueChange={setEditGrade}>
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
                <Label>Remarks</Label>
                <Input
                  value={editRemarks}
                  onChange={(e) => setEditRemarks(e.target.value)}
                  placeholder="Teacher's comments"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateResult} disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeacherPortal;
