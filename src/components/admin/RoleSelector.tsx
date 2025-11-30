import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface RoleSelectorProps {
  studentId: string;
  userId: string;
  currentRole: 'student' | 'student_leader' | 'class_rep' | null;
  onRoleChange: () => void;
}

export const RoleSelector = ({ studentId, userId, currentRole, onRoleChange }: RoleSelectorProps) => {
  const [selectedRole, setSelectedRole] = useState(currentRole || 'student');

  const updateRoleMutation = useMutation({
    mutationFn: async (newRole: string) => {
      // Delete existing student role
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .in('role', ['student', 'student_leader', 'class_rep']);

      // Insert new role
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: newRole as any });

      if (error) throw error;
    },
    onSuccess: () => {
      onRoleChange();
      toast.success("Student role updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update role");
    }
  });

  const handleRoleChange = (newRole: string) => {
    setSelectedRole(newRole as 'student' | 'student_leader' | 'class_rep');
    updateRoleMutation.mutate(newRole);
  };

  return (
    <Select value={selectedRole} onValueChange={handleRoleChange} disabled={updateRoleMutation.isPending}>
      <SelectTrigger className="w-[140px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="student">Student</SelectItem>
        <SelectItem value="student_leader">Student Leader</SelectItem>
        <SelectItem value="class_rep">Class Rep</SelectItem>
      </SelectContent>
    </Select>
  );
};
