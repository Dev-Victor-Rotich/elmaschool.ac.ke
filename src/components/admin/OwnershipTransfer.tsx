import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const OwnershipTransfer = () => {
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const { data: eligibleUsers, isLoading } = useQuery({
    queryKey: ['eligible-super-admins'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('status', 'approved')
        .neq('id', user?.id || '');
      
      if (profilesError) throw profilesError;
      if (!profiles) return [];
      
      // Fetch roles separately
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', profiles.map(p => p.id));
      
      const rolesMap = new Map<string, string[]>();
      roles?.forEach(role => {
        const existing = rolesMap.get(role.user_id) || [];
        existing.push(role.role);
        rolesMap.set(role.user_id, existing);
      });
      
      return profiles.filter(u => {
        const userRoles = rolesMap.get(u.id) || [];
        return userRoles.some(r => ['admin', 'teacher', 'hod'].includes(r));
      }).map(u => ({
        ...u,
        user_roles: (rolesMap.get(u.id) || []).map(r => ({ role: r }))
      }));
    }
  });

  const transferMutation = useMutation({
    mutationFn: async (newSuperAdminId: string) => {
      // First check if user already has super_admin role
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', newSuperAdminId)
        .eq('role', 'super_admin')
        .single();

      if (!existingRole) {
        // Add super_admin role
        const { error: insertError } = await supabase
          .from('user_roles')
          .insert([{ user_id: newSuperAdminId, role: 'super_admin' }]);
        
        if (insertError) throw insertError;
      }

      // Log the action
      await supabase.rpc('log_admin_action', {
        p_action_type: 'transfer_ownership',
        p_target_user: newSuperAdminId,
        p_details: 'Super Admin ownership transferred'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eligible-super-admins'] });
      toast.success("Ownership transferred successfully");
      setShowConfirmDialog(false);
      setSelectedUserId('');
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to transfer ownership");
    }
  });

  const handleTransfer = () => {
    if (!selectedUserId) {
      toast.error("Please select a user");
      return;
    }
    setShowConfirmDialog(true);
  };

  const confirmTransfer = () => {
    transferMutation.mutate(selectedUserId);
  };

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-destructive/10 p-4 rounded-lg border border-destructive/20 flex gap-3">
        <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-destructive">Critical Action</p>
          <p className="text-sm text-muted-foreground">
            Transferring Super Admin ownership will grant another user full system control. 
            This action is logged and cannot be undone automatically.
          </p>
        </div>
      </div>

      <div className="bg-card p-6 rounded-lg border space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Transfer Super Admin Rights</h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Select New Super Admin
            </label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a user to promote" />
              </SelectTrigger>
              <SelectContent>
                {eligibleUsers?.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    <div className="flex items-center gap-2">
                      <span>{user.full_name}</span>
                      {user.user_roles && user.user_roles.length > 0 && (
                        <Badge variant="outline" className="ml-2">
                          {user.user_roles[0].role}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleTransfer}
            disabled={!selectedUserId || transferMutation.isPending}
            className="w-full"
          >
            {transferMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Processing...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                Promote to Super Admin
              </>
            )}
          </Button>
        </div>
      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Confirm Ownership Transfer
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                You are about to grant Super Admin privileges to this user. They will have:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Full control over all system functions</li>
                <li>Ability to manage all users and roles</li>
                <li>Access to all data and settings</li>
                <li>Ability to approve/reject signups</li>
              </ul>
              <p className="font-semibold text-foreground mt-4">
                Are you absolutely sure you want to proceed?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmTransfer} className="bg-destructive hover:bg-destructive/90">
              Yes, Transfer Ownership
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};