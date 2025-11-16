import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const UserApprovalTable = () => {
  const queryClient = useQueryClient();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const { data: pendingUsers, isLoading } = useQuery({
    queryKey: ['pending-users'],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (profilesError) throw profilesError;
      if (!profiles) return [];
      
      // Fetch roles separately
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', profiles.map(p => p.id));
      
      if (rolesError) throw rolesError;
      
      const rolesMap = new Map(roles?.map(r => [r.user_id, r.role]) || []);
      
      const data = profiles.map(profile => ({
        ...profile,
        user_role: rolesMap.get(profile.id)
      }));
      return data;
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

      // Log the action
      await supabase.rpc('log_admin_action', {
        p_action_type: 'approve_user',
        p_target_user: userId,
        p_details: 'User approved by super admin'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-users'] });
      toast.success("User approved successfully");
      setProcessingId(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to approve user");
      setProcessingId(null);
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'rejected' })
        .eq('id', userId);
      
      if (error) throw error;

      // Log the action
      await supabase.rpc('log_admin_action', {
        p_action_type: 'reject_user',
        p_target_user: userId,
        p_details: 'User rejected by super admin'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-users'] });
      toast.success("User rejected");
      setProcessingId(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to reject user");
      setProcessingId(null);
    }
  });

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!pendingUsers || pendingUsers.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        No pending approvals
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>ID Number</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {pendingUsers.map((user) => (
          <TableRow key={user.id}>
            <TableCell className="font-medium">{user.full_name}</TableCell>
            <TableCell>{user.id}</TableCell>
            <TableCell>{user.phone_number}</TableCell>
            <TableCell>{user.id_number}</TableCell>
            <TableCell>
              {user.user_role ? (
                <Badge variant="outline">{user.user_role}</Badge>
              ) : (
                <span className="text-muted-foreground">No role</span>
              )}
            </TableCell>
            <TableCell>
              <Badge variant="secondary">{user.status}</Badge>
            </TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => {
                    setProcessingId(user.id);
                    approveMutation.mutate(user.id);
                  }}
                  disabled={processingId === user.id}
                >
                  {processingId === user.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  <span className="ml-1">Approve</span>
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    setProcessingId(user.id);
                    rejectMutation.mutate(user.id);
                  }}
                  disabled={processingId === user.id}
                >
                  {processingId === user.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  <span className="ml-1">Reject</span>
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};