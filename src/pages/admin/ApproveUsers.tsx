import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PendingUser {
  id: string;
  full_name: string;
  phone_number: string;
  created_at: string;
  email?: string;
}

const ApproveUsers = () => {
  const navigate = useNavigate();
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSuperAdmin();
    loadPendingUsers();
  }, []);

  const checkSuperAdmin = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id);

    if (!roles || roles.length === 0 || roles[0].role !== "super_admin") {
      toast.error("Access denied. Super Admin role required.");
      navigate("/admin");
    }
  };

  const loadPendingUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, phone_number, created_at")
      .eq("approval_status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load pending users");
      console.error(error);
    } else if (data) {
      // Get emails from auth.users for each profile
      const usersWithEmails = await Promise.all(
        data.map(async (profile) => {
          const { data: { user } } = await supabase.auth.admin.getUserById(profile.id);
          return {
            ...profile,
            email: user?.email
          };
        })
      );
      setPendingUsers(usersWithEmails);
    }
    setLoading(false);
  };

  const handleApprove = async (userId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    
    const { error } = await supabase
      .from("profiles")
      .update({
        approval_status: "approved",
        approved_at: new Date().toISOString(),
        approved_by: session?.user.id
      })
      .eq("id", userId);

    if (error) {
      toast.error("Failed to approve user");
    } else {
      toast.success("User approved successfully");
      loadPendingUsers();
    }
  };

  const handleReject = async (userId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    
    const { error } = await supabase
      .from("profiles")
      .update({
        approval_status: "rejected",
        approved_at: new Date().toISOString(),
        approved_by: session?.user.id
      })
      .eq("id", userId);

    if (error) {
      toast.error("Failed to reject user");
    } else {
      toast.success("User rejected");
      loadPendingUsers();
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
          <h1 className="text-2xl font-bold">Approve Users</h1>
          <p className="text-muted-foreground">Review and approve pending user registrations</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <p>Loading...</p>
        ) : pendingUsers.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">No pending users to approve</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {pendingUsers.map((user) => (
              <Card key={user.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{user.full_name}</CardTitle>
                      <CardDescription>
                        {user.email && <div>Email: {user.email}</div>}
                        {user.phone_number && <div>Phone: {user.phone_number}</div>}
                        <div className="text-xs mt-1">
                          Registered: {new Date(user.created_at).toLocaleString()}
                        </div>
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">Pending</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleApprove(user.id)}
                      className="flex-1"
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleReject(user.id)}
                      variant="destructive"
                      className="flex-1"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
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

export default ApproveUsers;