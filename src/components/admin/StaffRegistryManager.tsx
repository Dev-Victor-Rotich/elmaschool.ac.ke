import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

const STAFF_ROLES = ['bursar', 'chaplain', 'hod', 'teacher', 'admin'];

export const StaffRegistryManager = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    id_number: '',
    phone: '',
    email: '',
    role: ''
  });

  const { data: staffRegistry, isLoading } = useQuery({
    queryKey: ['staff-registry'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff_registry')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const addStaffMutation = useMutation({
    mutationFn: async (staff: typeof formData) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('staff_registry')
        .insert({
          ...staff,
          created_by: user?.id,
          status: 'active'
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-registry'] });
      toast.success("Staff member added to registry");
      setIsDialogOpen(false);
      setFormData({ full_name: '', id_number: '', phone: '', email: '', role: '' });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add staff member");
    }
  });

  const deleteStaffMutation = useMutation({
    mutationFn: async (staffId: string) => {
      const { error } = await supabase
        .from('staff_registry')
        .delete()
        .eq('id', staffId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-registry'] });
      toast.success("Staff member removed from registry");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to remove staff member");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.full_name || !formData.id_number || !formData.phone || !formData.email || !formData.role) {
      toast.error("Please fill all fields");
      return;
    }

    addStaffMutation.mutate(formData);
  };

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Staff Registry</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Staff Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Staff Member to Registry</DialogTitle>
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
                <Label htmlFor="id_number">ID Number</Label>
                <Input
                  id="id_number"
                  value={formData.id_number}
                  onChange={(e) => setFormData({ ...formData, id_number: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
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
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {STAFF_ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={addStaffMutation.isPending}>
                {addStaffMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Add to Registry
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {!staffRegistry || staffRegistry.length === 0 ? (
        <div className="text-center p-8 text-muted-foreground">
          No staff members in registry
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>ID Number</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staffRegistry.map((staff) => (
              <TableRow key={staff.id}>
                <TableCell className="font-medium">{staff.full_name}</TableCell>
                <TableCell>{staff.id_number}</TableCell>
                <TableCell>{staff.phone}</TableCell>
                <TableCell>{staff.email}</TableCell>
                <TableCell>
                  <Badge variant="outline">{staff.role}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={staff.status === 'active' ? 'default' : 'secondary'}>
                    {staff.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteStaffMutation.mutate(staff.id)}
                    disabled={deleteStaffMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};