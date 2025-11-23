import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, ClipboardCheck, AlertCircle, MessageSquare, FileText, LogOut, Eye } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { ImpersonationBanner } from "@/components/ImpersonationBanner";
import { useImpersonation } from "@/hooks/useImpersonation";

const ClassTeacherPortal = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [assignedClass, setAssignedClass] = useState<string>("");
  const { isImpersonating, impersonationData, exitImpersonation } = useImpersonation();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id);

    if (!roles || !roles.some(r => r.role === "classteacher")) {
      toast.error("Access denied. Class Teacher role required.");
      navigate("/auth");
      return;
    }

    // Fetch assigned class
    const { data: assignment } = await supabase
      .from("classteacher_assignments")
      .select("assigned_class")
      .eq("user_id", session.user.id)
      .single();

    if (assignment) {
      setAssignedClass(assignment.assigned_class);
    }

    setLoading(false);
  };

  // Fetch students in assigned class
  const { data: students = [] } = useQuery({
    queryKey: ["class-students", assignedClass],
    queryFn: async () => {
      if (!assignedClass) return [];
      const { data, error } = await supabase
        .from("students_data")
        .select("id, full_name, admission_number, email, class, user_id")
        .eq("class", assignedClass)
        .eq("approval_status", "approved")
        .order("full_name");
      if (error) throw error;
      return data || [];
    },
    enabled: !!assignedClass,
  });

  const handleViewStudent = (student: any) => {
    if (!student.user_id) {
      toast.error("This student hasn't registered yet");
      return;
    }

    localStorage.setItem('impersonation', JSON.stringify({
      userId: student.user_id,
      userName: student.full_name,
      userRole: 'student',
      userEmail: student.email || ''
    }));

    toast.success(`Now viewing as ${student.full_name}`);
    navigate('/dashboard/student');
  };

  const handleLogout = async () => {
    if (isImpersonating) {
      exitImpersonation();
      navigate('/staff/classteacher');
    } else {
      await supabase.auth.signOut();
      navigate("/auth");
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        {isImpersonating && impersonationData && (
          <ImpersonationBanner
            userName={impersonationData.userName}
            userRole={impersonationData.userRole}
            onExitImpersonation={handleLogout}
          />
        )}
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">Class Teacher Portal</h1>
            <p className="text-muted-foreground mt-2">
              Manage your class {assignedClass && `(${assignedClass})`}
            </p>
          </div>
          <Button onClick={handleLogout} variant="outline">
            <LogOut className="w-4 h-4 mr-2" />
            {isImpersonating ? 'Exit Viewing' : 'Logout'}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{students.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attendance Today</CardTitle>
              <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0%</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="students" className="space-y-4">
          <TabsList>
            <TabsTrigger value="students">
              <Users className="w-4 h-4 mr-2" />
              My Class
            </TabsTrigger>
            <TabsTrigger value="attendance">
              <ClipboardCheck className="w-4 h-4 mr-2" />
              Attendance
            </TabsTrigger>
            <TabsTrigger value="discipline">
              <AlertCircle className="w-4 h-4 mr-2" />
              Discipline
            </TabsTrigger>
            <TabsTrigger value="communication">
              <MessageSquare className="w-4 h-4 mr-2" />
              Communication
            </TabsTrigger>
            <TabsTrigger value="reports">
              <FileText className="w-4 h-4 mr-2" />
              Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="students">
            <Card>
              <CardHeader>
                <CardTitle>Class Students</CardTitle>
                <CardDescription>View and manage student profiles</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Admission No.</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          No students found in {assignedClass || "your class"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      students.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell>{student.admission_number}</TableCell>
                          <TableCell>{student.full_name}</TableCell>
                          <TableCell>{student.email || "N/A"}</TableCell>
                          <TableCell>{student.class}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewStudent(student)}
                              disabled={!student.user_id}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Dashboard
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attendance">
            <Card>
              <CardHeader>
                <CardTitle>Attendance Management</CardTitle>
                <CardDescription>Mark and view attendance records</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Attendance features coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="discipline">
            <Card>
              <CardHeader>
                <CardTitle>Discipline & Remarks</CardTitle>
                <CardDescription>Manage discipline records and remarks</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Discipline management coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="communication">
            <Card>
              <CardHeader>
                <CardTitle>Communication</CardTitle>
                <CardDescription>Message parents and teachers</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Messaging features coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>Class Reports</CardTitle>
                <CardDescription>Generate and view class performance reports</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Reports coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ClassTeacherPortal;