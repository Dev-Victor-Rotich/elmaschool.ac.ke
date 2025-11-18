import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const StaffApprovalManager = () => {
  const queryClient = useQueryClient();

  const { data: pendingStaff, isLoading } = useQuery({
    queryKey: ['pending-staff'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff_registry')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const approveMutation = useMutation({
    mutationFn: async (staffId: string) => {
      const { error } = await supabase
        .from('staff_registry')
        .update({ status: 'active' })
        .eq('id', staffId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-staff'] });
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      toast.success("Staff member approved successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to approve staff member");
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async (staffId: string) => {
      const { error } = await supabase
        .from('staff_registry')
        .delete()
        .eq('id', staffId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-staff'] });
      toast.success("Staff member rejected");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to reject staff member");
    }
  });

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!pendingStaff || pendingStaff.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        No pending staff approvals
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Pending Staff Approvals</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Full Name</TableHead>
            <TableHead>ID Number</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pendingStaff.map((staff) => (
            <TableRow key={staff.id}>
              <TableCell className="font-medium">{staff.email}</TableCell>
              <TableCell>{staff.role}</TableCell>
              <TableCell>{staff.full_name || 'N/A'}</TableCell>
              <TableCell>{staff.id_number || 'N/A'}</TableCell>
              <TableCell>{staff.phone || 'N/A'}</TableCell>
              <TableCell>
                <Badge variant="outline">Pending</Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => approveMutation.mutate(staff.id)}
                    disabled={approveMutation.isPending || rejectMutation.isPending}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => rejectMutation.mutate(staff.id)}
                    disabled={approveMutation.isPending || rejectMutation.isPending}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
