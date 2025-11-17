import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Shield, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

const AVAILABLE_ROLES = ['super_admin', 'admin', 'bursar', 'chaplain', 'hod', 'teacher', 'student', 'parent'];

interface UserWithRoles {
  id: string;
  full_name: string;
  id_number: string | null;
  phone_number: string | null;
  email: string;
  user_roles: Array<{id: string, role: string}>;
}

export const RoleManagement = () => {
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');

  const { data: users, isLoading: usersLoading } = useQuery<UserWithRoles[]>({
    queryKey: ['all-users'],
    queryFn: async () => {
      // Fetch staff from staff_registry
      const { data: staffRegistry, error: staffError } = await supabase
        .from('staff_registry')
        .select('*')
        .eq('status', 'active')
        .order('email');
      
      if (staffError) throw staffError;
      if (!staffRegistry) return [];
      
      // Get all auth users to map emails to user_ids  
      const emailToUserIdMap = new Map<string, string>();
      
      // Fetch user_id for each staff email
      for (const staff of staffRegistry) {
        const { data: { user } } = await supabase.auth.admin.getUserById(staff.id);
        if (user?.email) {
          emailToUserIdMap.set(user.email, user.id);
        }
      }
      
      // Fetch all user roles
      const userIds = Array.from(emailToUserIdMap.values());
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('id, user_id, role')
        .in('user_id', userIds);
      
      if (rolesError) throw rolesError;
      
      const rolesMap = new Map<string, Array<{id: string, role: string}>>();
      roles?.forEach(role => {
        const existing = rolesMap.get(role.user_id) || [];
        existing.push({ id: role.id, role: role.role });
        rolesMap.set(role.user_id, existing);
      });
      
      // Map staff registry to user format
      const data: UserWithRoles[] = staffRegistry
        .map(staff => {
          const userId = emailToUserIdMap.get(staff.email);
          if (!userId) return null;
          
          return {
            id: userId,
            full_name: staff.full_name || staff.email.split('@')[0],
            id_number: staff.id_number,
            phone_number: staff.phone,
            email: staff.email,
            user_roles: rolesMap.get(userId) || []
          };
        })
        .filter((u): u is UserWithRoles => u !== null);
      
      return data;
    }
  });

  const addRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { error } = await supabase
        .from('user_roles')
        .insert([{ user_id: userId, role: role as any }]);
      
      if (error) throw error;

      await supabase.rpc('log_admin_action', {
        p_action_type: 'assign_role',
        p_target_user: userId,
        p_details: `Assigned role: ${role}`
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      toast.success("Role assigned successfully");
      setSelectedUserId('');
      setSelectedRole('');
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to assign role");
    }
  });

  const removeRoleMutation = useMutation({
    mutationFn: async ({ roleId, userId, role }: { roleId: string; userId: string; role: string }) => {
      // Check if trying to remove super_admin
      if (role === 'super_admin') {
        const { count } = await supabase
          .from('user_roles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'super_admin');
        
        if (count && count <= 1) {
          throw new Error('Cannot remove the last Super Admin');
        }
      }

      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', roleId);
      
      if (error) throw error;

      await supabase.rpc('log_admin_action', {
        p_action_type: 'remove_role',
        p_target_user: userId,
        p_details: `Removed role: ${role}`
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      toast.success("Role removed successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to remove role");
    }
  });

  if (usersLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-card p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Assign New Role
        </h3>
        <div className="flex gap-4">
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select user" />
            </SelectTrigger>
            <SelectContent>
              {users?.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.full_name} ({user.id_number || 'N/A'})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              {AVAILABLE_ROLES.map((role) => (
                <SelectItem key={role} value={role}>
                  {role.replace('_', ' ').toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={() => {
              if (selectedUserId && selectedRole) {
                addRoleMutation.mutate({ userId: selectedUserId, role: selectedRole });
              }
            }}
            disabled={!selectedUserId || !selectedRole || addRoleMutation.isPending}
          >
            {addRoleMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Assign Role'
            )}
          </Button>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Current Role Assignments</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>ID Number</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.full_name}</TableCell>
                <TableCell>{user.id_number || 'N/A'}</TableCell>
                <TableCell>{user.id}</TableCell>
                <TableCell>
                  <div className="flex gap-2 flex-wrap">
                    {user.user_roles && user.user_roles.length > 0 ? (
                      user.user_roles.map((ur) => (
                        <Badge key={ur.id} variant="secondary">
                          {ur.role}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground">No roles</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2 flex-wrap">
                    {user.user_roles?.map((ur) => (
                      <Button
                        key={ur.id}
                        size="sm"
                        variant="destructive"
                        onClick={() => removeRoleMutation.mutate({
                          roleId: ur.id, 
                          userId: user.id,
                          role: ur.role 
                        })}
                        disabled={removeRoleMutation.isPending}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Remove {ur.role}
                      </Button>
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};