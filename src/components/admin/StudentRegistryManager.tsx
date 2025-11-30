import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { RoleSelector } from "./RoleSelector";

export const StudentRegistryManager = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    admission_number: '',
    class: '',
    parent_name: '',
    parent_phone: '',
    email: '',
    role: 'student' as 'student' | 'student_leader' | 'class_rep'
  });

  const { data: studentRegistry, isLoading } = useQuery({
    queryKey: ['student-registry'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students_data')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      // Fetch roles for all students
      const studentIds = data?.filter(s => s.user_id).map(s => s.user_id) || [];
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', studentIds)
        .in('role', ['student', 'student_leader', 'class_rep']);
      
      const rolesMap = new Map(roles?.map(r => [r.user_id, r.role]) || []);

      return data?.map(student => ({
        ...student,
        current_role: student.user_id ? rolesMap.get(student.user_id) : null
      }));
    }
  });

  const addStudentMutation = useMutation({
    mutationFn: async (student: typeof formData) => {
      const { role, ...studentData } = student;
      const { error } = await supabase
        .from('students_data')
        .insert({
          ...studentData,
          approval_status: 'pending',
          is_registered: false
        });
      
      if (error) throw error;
      
      // Store role temporarily in localStorage to assign after approval
      localStorage.setItem(`pending_student_role_${student.email}`, role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-registry'] });
      toast.success("Student added to registry. They can login with their email after approval.");
      setIsDialogOpen(false);
      setFormData({ full_name: '', admission_number: '', class: '', parent_name: '', parent_phone: '', email: '', role: 'student' as any });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add student");
    }
  });

  const deleteStudentMutation = useMutation({
    mutationFn: async (studentId: string) => {
      const { error } = await supabase
        .from('students_data')
        .delete()
        .eq('id', studentId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-registry'] });
      toast.success("Student removed from registry");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to remove student");
    }
  });

  const approveStudentMutation = useMutation({
    mutationFn: async ({ studentId, email }: { studentId: string; email: string }) => {
      // First, approve the student
      const { error: updateError } = await supabase
        .from('students_data')
        .update({ approval_status: 'approved' })
        .eq('id', studentId);
      
      if (updateError) throw updateError;

      // Get the student's user_id after approval
      const { data: student } = await supabase
        .from('students_data')
        .select('user_id')
        .eq('id', studentId)
        .single();

      if (student?.user_id) {
        // Retrieve the stored role preference
        const storedRole = localStorage.getItem(`pending_student_role_${email}`) || 'student';
        
        // Assign the role via user_roles table
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: student.user_id,
            role: storedRole as any
          });

        if (roleError && !roleError.message.includes('duplicate')) {
          throw roleError;
        }

        // Clean up localStorage
        localStorage.removeItem(`pending_student_role_${email}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-registry'] });
      toast.success("Student approved and role assigned");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to approve student");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.full_name || !formData.admission_number || !formData.email || !formData.class || !formData.parent_name || !formData.parent_phone) {
      toast.error("Please fill all fields");
      return;
    }

    addStudentMutation.mutate(formData);
  };

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Student Registry</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Student
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Student to Registry</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="admission_number">Admission Number</Label>
                <Input
                  id="admission_number"
                  value={formData.admission_number}
                  onChange={(e) => setFormData({ ...formData, admission_number: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="class">Class</Label>
                <Input
                  id="class"
                  value={formData.class}
                  onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                  placeholder="e.g., Form 1, Form 2"
                  required
                />
              </div>
              <div>
                <Label htmlFor="parent_name">Parent Name</Label>
                <Input
                  id="parent_name"
                  value={formData.parent_name}
                  onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="parent_phone">Parent Phone</Label>
                <Input
                  id="parent_phone"
                  value={formData.parent_phone}
                  onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Student Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <select
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="student">Student</option>
                  <option value="student_leader">Student Leader</option>
                  <option value="class_rep">Class Rep</option>
                </select>
              </div>
              <Button type="submit" className="w-full" disabled={addStudentMutation.isPending}>
                {addStudentMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Add to Registry
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {!studentRegistry || studentRegistry.length === 0 ? (
        <div className="text-center p-8 text-muted-foreground">
          No students in registry
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Admission No.</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {studentRegistry.map((student) => (
              <TableRow key={student.id}>
                <TableCell className="font-medium">{student.full_name}</TableCell>
                <TableCell>{student.admission_number}</TableCell>
                <TableCell>{student.class}</TableCell>
                <TableCell>{student.email}</TableCell>
                <TableCell>
                  {student.approval_status === 'approved' && student.user_id ? (
                    <RoleSelector 
                      studentId={student.id}
                      userId={student.user_id}
                      currentRole={student.current_role as any}
                      onRoleChange={() => queryClient.invalidateQueries({ queryKey: ['student-registry'] })}
                    />
                  ) : (
                    <span className="text-muted-foreground text-sm">Not assigned</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={student.approval_status === 'approved' ? 'default' : 'secondary'}>
                    {student.approval_status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {student.approval_status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => approveStudentMutation.mutate({ studentId: student.id, email: student.email })}
                        disabled={approveStudentMutation.isPending}
                      >
                        Approve
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteStudentMutation.mutate(student.id)}
                      disabled={deleteStudentMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};
