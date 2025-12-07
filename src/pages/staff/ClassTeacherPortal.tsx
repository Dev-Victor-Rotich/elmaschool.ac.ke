import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, ClipboardCheck, AlertCircle, MessageSquare, FileText, LogOut, Eye, Plus, Pencil, Trash2, BookOpen, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ImpersonationBanner } from "@/components/ImpersonationBanner";
import { useImpersonation } from "@/hooks/useImpersonation";
import { StudentSubjectsManager } from "@/components/classteacher/StudentSubjectsManager";
import { SubjectOfferingsManager } from "@/components/classteacher/SubjectOfferingsManager";
import { GradeBoundariesManager } from "@/components/classteacher/GradeBoundariesManager";

const ClassTeacherPortal = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [assignedClass, setAssignedClass] = useState<string>("");
  const { isImpersonating, impersonationData, exitImpersonation } = useImpersonation();
  
  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    full_name: "",
    admission_number: "",
    parent_name: "",
    parent_phone: "",
    email: "",
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      navigate("/auth");
      return;
    }

    const impersonationRaw = localStorage.getItem("impersonation");
    const impersonation = impersonationRaw ? JSON.parse(impersonationRaw) : null;

    const effectiveUserId = impersonation?.userId || session.user.id;

    if (!impersonation) {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);

      if (!roles || !roles.some((r) => r.role === "classteacher")) {
        toast.error("Access denied. Class Teacher role required.");
        navigate("/auth");
        return;
      }
    }

    const { data: assignment } = await supabase
      .from("classteacher_assignments")
      .select("assigned_class")
      .eq("user_id", effectiveUserId)
      .single();

    if (assignment) {
      setAssignedClass(assignment.assigned_class);
    }

    setLoading(false);
  };

  // Fetch ALL students in assigned class (not just approved)
  const { data: students = [] } = useQuery({
    queryKey: ["class-students", assignedClass],
    queryFn: async () => {
      if (!assignedClass) return [];
      const { data, error } = await supabase
        .from("students_data")
        .select("*")
        .eq("class", assignedClass)
        .order("full_name");
      if (error) throw error;
      return data || [];
    },
    enabled: !!assignedClass,
  });

  // Add student mutation
  const addStudentMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("students_data").insert({
        full_name: data.full_name,
        admission_number: data.admission_number,
        parent_name: data.parent_name,
        parent_phone: data.parent_phone,
        email: data.email || null,
        class: assignedClass,
        approval_status: "approved",
        is_registered: false,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Student added successfully");
      queryClient.invalidateQueries({ queryKey: ["class-students"] });
      setAddDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add student");
    },
  });

  // Edit student mutation
  const editStudentMutation = useMutation({
    mutationFn: async (data: typeof formData & { id: string }) => {
      const { error } = await supabase
        .from("students_data")
        .update({
          full_name: data.full_name,
          admission_number: data.admission_number,
          parent_name: data.parent_name,
          parent_phone: data.parent_phone,
          email: data.email || null,
        })
        .eq("id", data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Student updated successfully");
      queryClient.invalidateQueries({ queryKey: ["class-students"] });
      setEditDialogOpen(false);
      setSelectedStudent(null);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update student");
    },
  });

  // Delete student mutation
  const deleteStudentMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("students_data").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Student removed successfully");
      queryClient.invalidateQueries({ queryKey: ["class-students"] });
      setDeleteDialogOpen(false);
      setSelectedStudent(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to remove student");
    },
  });

  const resetForm = () => {
    setFormData({
      full_name: "",
      admission_number: "",
      parent_name: "",
      parent_phone: "",
      email: "",
    });
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name || !formData.admission_number || !formData.parent_name || !formData.parent_phone) {
      toast.error("Please fill all required fields");
      return;
    }
    addStudentMutation.mutate(formData);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    editStudentMutation.mutate({ ...formData, id: selectedStudent.id });
  };

  const openEditDialog = (student: any) => {
    setSelectedStudent(student);
    setFormData({
      full_name: student.full_name,
      admission_number: student.admission_number,
      parent_name: student.parent_name,
      parent_phone: student.parent_phone,
      email: student.email || "",
    });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (student: any) => {
    setSelectedStudent(student);
    setDeleteDialogOpen(true);
  };

  const handleViewStudent = (student: any) => {
    if (!student.user_id) {
      toast.error("This student hasn't registered yet");
      return;
    }

    localStorage.setItem(
      "impersonation",
      JSON.stringify({
        userId: student.user_id,
        userName: student.full_name,
        userRole: "student",
        userEmail: student.email || "",
      }),
    );

    toast.success(`Now viewing as ${student.full_name}`);
    navigate("/dashboard/student");
  };

  const handleLogout = async () => {
    if (isImpersonating) {
      exitImpersonation();
      navigate("/staff/classteacher");
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
            <p className="text-muted-foreground mt-2">Manage your class {assignedClass && `(${assignedClass})`}</p>
          </div>
          <Button onClick={handleLogout} variant="outline">
            <LogOut className="w-4 h-4 mr-2" />
            {isImpersonating ? "Exit Viewing" : "Logout"}
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
          <TabsList className="flex-wrap">
            <TabsTrigger value="students">
              <Users className="w-4 h-4 mr-2" />
              My Class
            </TabsTrigger>
            <TabsTrigger value="subjects">
              <BookOpen className="w-4 h-4 mr-2" />
              Subjects
            </TabsTrigger>
            <TabsTrigger value="academics">
              <GraduationCap className="w-4 h-4 mr-2" />
              Academics
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
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Class Students - {assignedClass}</CardTitle>
                  <CardDescription>Add, edit, or remove students in your class</CardDescription>
                </div>
                <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={resetForm}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Student
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Student to {assignedClass}</DialogTitle>
                      <DialogDescription>Register a new student in your class</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="full_name">Full Name *</Label>
                        <Input
                          id="full_name"
                          value={formData.full_name}
                          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="admission_number">Admission Number *</Label>
                        <Input
                          id="admission_number"
                          value={formData.admission_number}
                          onChange={(e) => setFormData({ ...formData, admission_number: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="parent_name">Parent Name *</Label>
                        <Input
                          id="parent_name"
                          value={formData.parent_name}
                          onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="parent_phone">Parent Phone *</Label>
                        <Input
                          id="parent_phone"
                          value={formData.parent_phone}
                          onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Student Email (Optional)</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={addStudentMutation.isPending}>
                          {addStudentMutation.isPending ? "Adding..." : "Add Student"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Admission No.</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Parent</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          No students found in {assignedClass || "your class"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      students.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">{student.admission_number}</TableCell>
                          <TableCell>{student.full_name}</TableCell>
                          <TableCell>{student.parent_name}</TableCell>
                          <TableCell>{student.parent_phone}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              student.is_registered 
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                            }`}>
                              {student.is_registered ? "Registered" : "Not Registered"}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewStudent(student)}
                                disabled={!student.user_id}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditDialog(student)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => openDeleteDialog(student)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subjects" className="space-y-6">
            <SubjectOfferingsManager assignedClass={assignedClass} />
            <StudentSubjectsManager assignedClass={assignedClass} />
          </TabsContent>

          <TabsContent value="academics">
            <GradeBoundariesManager assignedClass={assignedClass} />
          </TabsContent>

          <TabsContent value="attendance">
            <Card>
              <CardHeader>
                <CardTitle>Attendance Management</CardTitle>
                <CardDescription>Mark and view attendance records</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">Track daily attendance for your class.</p>
                <Button>Mark Attendance</Button>
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
                <p className="text-muted-foreground mb-4">Record and manage student discipline cases.</p>
                <Button>Add Discipline Record</Button>
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
                <p className="text-muted-foreground mb-4">Communicate with parents and other teachers.</p>
                <Button>Send Message</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>Reports</CardTitle>
                <CardDescription>View class performance and summaries</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">Generate and download class reports.</p>
                <Button>Generate Report</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Student</DialogTitle>
              <DialogDescription>Update student information</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit_full_name">Full Name *</Label>
                <Input
                  id="edit_full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_admission_number">Admission Number *</Label>
                <Input
                  id="edit_admission_number"
                  value={formData.admission_number}
                  onChange={(e) => setFormData({ ...formData, admission_number: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_parent_name">Parent Name *</Label>
                <Input
                  id="edit_parent_name"
                  value={formData.parent_name}
                  onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_parent_phone">Parent Phone *</Label>
                <Input
                  id="edit_parent_phone"
                  value={formData.parent_phone}
                  onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_email">Student Email (Optional)</Label>
                <Input
                  id="edit_email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={editStudentMutation.isPending}>
                  {editStudentMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Remove Student</DialogTitle>
              <DialogDescription>
                Are you sure you want to remove {selectedStudent?.full_name} from {assignedClass}? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => selectedStudent && deleteStudentMutation.mutate(selectedStudent.id)}
                disabled={deleteStudentMutation.isPending}
              >
                {deleteStudentMutation.isPending ? "Removing..." : "Remove Student"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ClassTeacherPortal;
