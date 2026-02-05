import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ApprovedUser {
  id: string;
  full_name: string;
  phone_number: string;
  email?: string;
  currentRole?: string;
}

const AssignRoles = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<ApprovedUser[]>([]);
  const [loading, setLoading] = useState(true);

  const roles = [
    { value: "teacher", label: "Teacher" },
    { value: "hod", label: "HOD (Head of Department)" },
    { value: "bursar", label: "Bursar" },
    { value: "chaplain", label: "Chaplain" },
    { value: "student_leader", label: "Student Leader" },
    { value: "class_rep", label: "Class Representative" },
  ];

  useEffect(() => {
    checkSuperAdmin();
    loadApprovedUsers();
  }, []);

  const checkSuperAdmin = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id);

    if (!roleData || roleData.length === 0 || roleData[0].role !== "super_admin") {
      toast.error("Access denied. Super Admin role required.");
      navigate("/admin");
    }
  };

  const loadApprovedUsers = async () => {
    setLoading(true);
    
    try {
      // Get approved users with email from profiles table
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, phone_number, email")
        .eq("approval_status", "approved");

      if (profiles) {
        const usersWithRoles = await Promise.all(
          profiles.map(async (profile) => {
            // Get current role
            const { data: roleData } = await supabase
              .from("user_roles")
              .select("role")
              .eq("user_id", profile.id)
              .maybeSingle();

            // Skip if student
            if (roleData?.role === "student") return null;

            return {
              ...profile,
              email: (profile as any).email || undefined,
              currentRole: roleData?.role
            };
          })
        );

        setUsers(usersWithRoles.filter(Boolean) as ApprovedUser[]);
      }
    } catch (error) {
      console.error("Failed to load users:", error);
      toast.error("Failed to load users");
    }
    setLoading(false);
  };

  const handleAssignRole = async (userId: string, role: string) => {
    // Check if user already has a role
    const { data: existingRole } = await supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (existingRole) {
      // Update existing role
      const { error } = await supabase
        .from("user_roles")
        .update({ role: role as any })
        .eq("user_id", userId);

      if (error) {
        toast.error("Failed to update role");
      } else {
        toast.success("Role updated successfully");
        loadApprovedUsers();
      }
    } else {
      // Insert new role
      const { error } = await supabase
        .from("user_roles")
        .insert([{ user_id: userId, role: role as any }]);

      if (error) {
        toast.error("Failed to assign role");
      } else {
        toast.success("Role assigned successfully");
        loadApprovedUsers();
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/admin")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold">Assign Staff Roles</h1>
          <p className="text-muted-foreground">Assign roles to approved staff members</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <p>Loading...</p>
        ) : users.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">No users available for role assignment</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {users.map((user) => (
              <Card key={user.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{user.full_name}</CardTitle>
                      <CardDescription>
                        {user.email && <div>Email: {user.email}</div>}
                        {user.phone_number && <div>Phone: {user.phone_number}</div>}
                      </CardDescription>
                    </div>
                    {user.currentRole && (
                      <Badge>{user.currentRole.replace(/_/g, ' ').toUpperCase()}</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 items-center">
                    <Select
                      onValueChange={(value) => handleAssignRole(user.id, value)}
                      defaultValue={user.currentRole}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default AssignRoles;