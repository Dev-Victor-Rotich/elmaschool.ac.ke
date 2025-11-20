import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Shield, Trash2, Loader2, Plus, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const AVAILABLE_ROLES = ['super_admin', 'admin', 'bursar', 'chaplain', 'hod', 'teacher', 'librarian', 'classteacher', 'student_leader', 'class_rep'];
 
 interface UserWithRoles {
   id: string;
   full_name: string;
   email: string;
   phone_number: string | null;
   id_number: string | null;
   status: string;
   approval_status?: string | null;
   user_roles: Array<{id: string, role: string}>;
 }

export const RoleManagement = () => {
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({
    email: '',
    full_name: '',
    phone_number: '',
    id_number: '',
    role: 'teacher'
  });

  const { data: allUsers, isLoading } = useQuery<UserWithRoles[]>({
    queryKey: ['all-users-with-roles'],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (profilesError) throw profilesError;
      if (!profiles) return [];

      const { data: { users: authUsers } } = await supabase.auth.admin.listUsers();
      const emailMap = new Map<string, string>();
      if (authUsers) {
        authUsers.forEach((u: any) => {
          if (u.id && u.email) {
            emailMap.set(u.id, u.email);
          }
        });
      }
      
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('id, user_id, role')
        .in('user_id', profiles.map(p => p.id));
      
      if (rolesError) throw rolesError;
      
      const rolesMap = new Map<string, Array<{id: string, role: string}>>();
      roles?.forEach(role => {
        const existing = rolesMap.get(role.user_id) || [];
        existing.push({ id: role.id, role: role.role });
        rolesMap.set(role.user_id, existing);
      });
      
      return profiles.map(profile => ({
        id: profile.id,
        full_name: profile.full_name,
        email: emailMap.get(profile.id) || '',
        phone_number: profile.phone_number,
        id_number: profile.id_number,
        approval_status: profile.approval_status,
        status: profile.approval_status || profile.status || 'pending',
        user_roles: rolesMap.get(profile.id) || []
      }));
    }
  });

  const pendingUsers = allUsers?.filter(u => u.approval_status === 'pending') || [];
  const approvedUsers = allUsers?.filter(u => u.approval_status === 'approved') || [];

  const addUserMutation = useMutation({
    mutationFn: async (userData: typeof newUserData) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No active session');

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create user');
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-users-with-roles'] });
      toast.success("User added successfully");
      setIsAddUserDialogOpen(false);
      setNewUserData({ email: '', full_name: '', phone_number: '', id_number: '', role: 'teacher' });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add user");
    }
  });

  const approveMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          status: 'approved',
          approved_by: (await supabase.auth.getUser()).data.user?.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (error) throw error;

      await supabase.rpc('log_admin_action', {
        p_action_type: 'approve_user',
        p_target_user: userId,
        p_details: 'User approved'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-users-with-roles'] });
      toast.success("User approved successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to approve user");
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'rejected' })
        .eq('id', userId);
      
      if (error) throw error;

      await supabase.rpc('log_admin_action', {
        p_action_type: 'reject_user',
        p_target_user: userId,
        p_details: 'User rejected'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-users-with-roles'] });
      toast.success("User rejected");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to reject user");
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
      queryClient.invalidateQueries({ queryKey: ['all-users-with-roles'] });
      toast.success("Role assigned successfully");
      setSelectedUserId('');
      setSelectedRole('');
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to assign role");
    }
  });

  const removeRoleMutation = useMutation({
    mutationFn: async (roleId: string) => {
      const { data: role } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .eq('id', roleId)
        .single();

      if (role?.role === 'super_admin') {
        const { count } = await supabase
          .from('user_roles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'super_admin');
        
        if (count === 1) {
          throw new Error("Cannot remove the last super admin");
        }
      }

      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', roleId);
      
      if (error) throw error;

      if (role) {
        await supabase.rpc('log_admin_action', {
          p_action_type: 'remove_role',
          p_target_user: role.user_id,
          p_details: `Removed role: ${role.role}`
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-users-with-roles'] });
      toast.success("Role removed successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to remove role");
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      // Check if this is a super admin
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      const isSuperAdmin = userRoles?.some(r => r.role === 'super_admin');
      if (isSuperAdmin) {
        const { count } = await supabase
          .from('user_roles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'super_admin');

        if (count === 1) {
          throw new Error("Cannot delete the last super admin");
        }
      }

      // Delete user roles first
      const { error: rolesError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (rolesError) throw rolesError;

      // Delete from students_data if exists
      await supabase
        .from('students_data')
        .delete()
        .eq('user_id', userId);

      // Soft-delete profile: mark as deleted so it no longer appears in lists
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ approval_status: 'deleted', status: 'deleted' })
        .eq('id', userId);
 
       if (profileError) throw profileError;
 
       await supabase.rpc('log_admin_action', {
         p_action_type: 'delete_user',
         p_target_user: userId,
         p_details: 'User deleted'
       });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-users-with-roles'] });
      toast.success("User deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete user");
    }
  });

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="assign-roles" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="assign-roles">
            <Shield className="h-4 w-4 mr-2" />
            Assign & Manage Roles
          </TabsTrigger>
          <TabsTrigger value="approvals">
            <UserPlus className="h-4 w-4 mr-2" />
            User Approvals ({pendingUsers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assign-roles" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Role Management</h3>
              <p className="text-sm text-muted-foreground">Assign and manage user roles</p>
            </div>
            <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add New User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New User</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newUserData.email}
                      onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                      placeholder="user@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={newUserData.full_name}
                      onChange={(e) => setNewUserData({ ...newUserData, full_name: e.target.value })}
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={newUserData.phone_number}
                      onChange={(e) => setNewUserData({ ...newUserData, phone_number: e.target.value })}
                      placeholder="+254..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="id_number">ID Number</Label>
                    <Input
                      id="id_number"
                      value={newUserData.id_number}
                      onChange={(e) => setNewUserData({ ...newUserData, id_number: e.target.value })}
                      placeholder="12345678"
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">Initial Role</Label>
                    <Select value={newUserData.role} onValueChange={(value) => setNewUserData({ ...newUserData, role: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AVAILABLE_ROLES.map((role) => (
                          <SelectItem key={role} value={role}>
                            {role.replace('_', ' ').toUpperCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={() => addUserMutation.mutate(newUserData)}
                    disabled={addUserMutation.isPending || !newUserData.email || !newUserData.full_name}
                  >
                    {addUserMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Add User
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <h4 className="font-semibold">Assign Role to User</h4>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Select User</Label>
                  <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose user" />
                    </SelectTrigger>
                    <SelectContent>
                      {approvedUsers?.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.full_name} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Select Role</Label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose role" />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_ROLES.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role.replace('_', ' ').toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button 
                onClick={() => addRoleMutation.mutate({ userId: selectedUserId, role: selectedRole })}
                disabled={!selectedUserId || !selectedRole || addRoleMutation.isPending}
                className="w-full"
              >
                <Shield className="h-4 w-4 mr-2" />
                Assign Role
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h4 className="font-semibold">All Users & Their Roles</h4>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>ID Number</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {approvedUsers?.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.full_name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.phone_number || 'N/A'}</TableCell>
                      <TableCell>{user.id_number || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant={user.approval_status === 'approved' ? 'default' : 'secondary'}>
                          {user.approval_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.user_roles.map((role) => (
                            <Badge key={role.id} variant="outline" className="gap-1">
                              {role.role.replace('_', ' ').toUpperCase()}
                              <button
                                onClick={() => removeRoleMutation.mutate(role.id)}
                                disabled={removeRoleMutation.isPending}
                                className="ml-1 hover:text-destructive"
                              >
                                ×
                              </button>
                            </Badge>
                          ))}
                          {user.user_roles.length === 0 && (
                            <span className="text-muted-foreground text-sm">No roles</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedUserId(user.id)}
                          >
                            Add Role
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete ${user.full_name}? This action cannot be undone.`)) {
                                deleteUserMutation.mutate(user.id);
                              }
                            }}
                            disabled={deleteUserMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approvals" className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Pending User Approvals</h3>
            <p className="text-sm text-muted-foreground">Review and approve new users</p>
          </div>

          {pendingUsers.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              No pending approvals
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>ID Number</TableHead>
                  <TableHead>Assigned Roles</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.full_name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.phone_number || 'N/A'}</TableCell>
                    <TableCell>{user.id_number || 'N/A'}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.user_roles.map((role) => (
                          <Badge key={role.id} variant="outline">
                            {role.role.replace('_', ' ').toUpperCase()}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => approveMutation.mutate(user.id)}
                          disabled={approveMutation.isPending || rejectMutation.isPending}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => rejectMutation.mutate(user.id)}
                          disabled={approveMutation.isPending || rejectMutation.isPending}
                        >
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
