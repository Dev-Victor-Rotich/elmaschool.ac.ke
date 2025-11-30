import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const HODDepartmentAssignment = () => {
  const queryClient = useQueryClient();
  const [selectedHOD, setSelectedHOD] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');

  // Fetch all HODs
  const { data: hods } = useQuery({
    queryKey: ['hods'],
    queryFn: async () => {
      const { data: hodRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'hod');

      if (!hodRoles || hodRoles.length === 0) return [];

      const hodIds = hodRoles.map(r => r.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', hodIds);

      return profiles || [];
    }
  });

  // Fetch all departments
  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const { data } = await supabase
        .from('departments')
        .select('id, name')
        .order('name');
      return data || [];
    }
  });

  // Fetch current assignments
  const { data: assignments, isLoading } = useQuery({
    queryKey: ['hod-department-assignments'],
    queryFn: async () => {
      const { data } = await supabase
        .from('hod_departments')
        .select(`
          id,
          user_id,
          department_id,
          departments (name)
        `);

      if (!data) return [];

      const userIds = data.map(a => a.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);

      return data.map(assignment => ({
        id: assignment.id,
        user_id: assignment.user_id,
        hod_name: profileMap.get(assignment.user_id) || 'Unknown',
        department_name: (assignment.departments as any)?.name || 'Unknown'
      }));
    }
  });

  const assignMutation = useMutation({
    mutationFn: async () => {
      if (!selectedHOD || !selectedDepartment) {
        throw new Error("Please select both HOD and department");
      }

      // Check if HOD already has assignment
      const { data: existing } = await supabase
        .from('hod_departments')
        .select('id')
        .eq('user_id', selectedHOD)
        .maybeSingle();

      if (existing) {
        // Update existing assignment
        const { error } = await supabase
          .from('hod_departments')
          .update({ department_id: selectedDepartment })
          .eq('user_id', selectedHOD);
        if (error) throw error;
      } else {
        // Insert new assignment
        const { error } = await supabase
          .from('hod_departments')
          .insert({
            user_id: selectedHOD,
            department_id: selectedDepartment
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hod-department-assignments'] });
      toast.success("HOD assigned to department successfully");
      setSelectedHOD('');
      setSelectedDepartment('');
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to assign HOD");
    }
  });

  const removeMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await supabase
        .from('hod_departments')
        .delete()
        .eq('id', assignmentId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hod-department-assignments'] });
      toast.success("Assignment removed successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to remove assignment");
    }
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Assign HOD to Department</CardTitle>
          <CardDescription>Select a Head of Department and assign them to a specific department</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="hod">Select HOD</Label>
            <Select value={selectedHOD} onValueChange={setSelectedHOD}>
              <SelectTrigger id="hod">
                <SelectValue placeholder="Choose HOD..." />
              </SelectTrigger>
              <SelectContent>
                {hods?.map((hod) => (
                  <SelectItem key={hod.id} value={hod.id}>
                    {hod.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="department">Select Department</Label>
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger id="department">
                <SelectValue placeholder="Choose department..." />
              </SelectTrigger>
              <SelectContent>
                {departments?.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={() => assignMutation.mutate()}
            disabled={!selectedHOD || !selectedDepartment || assignMutation.isPending}
            className="w-full"
          >
            {assignMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Assign Department
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Assignments</CardTitle>
          <CardDescription>View and manage HOD-department assignments</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : !assignments || assignments.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              No HOD-department assignments yet
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>HOD Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell className="font-medium">{assignment.hod_name}</TableCell>
                    <TableCell>{assignment.department_name}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => removeMutation.mutate(assignment.id)}
                        disabled={removeMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
