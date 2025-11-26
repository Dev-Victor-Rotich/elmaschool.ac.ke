import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, BookMarked, Clock, FileText, LogOut } from "lucide-react";
import { toast } from "sonner";

const LibrarianPortal = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      navigate("/auth");
      return;
    }

    // If super admin is impersonating a librarian, bypass role checks
    const impersonationRaw = localStorage.getItem("impersonation");
    const impersonation = impersonationRaw ? JSON.parse(impersonationRaw) : null;

    if (!impersonation) {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);

      if (!roles || !roles.some((r) => r.role === "librarian")) {
        toast.error("Access denied. Librarian role required.");
        navigate("/auth");
        return;
      }
    }

    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">Library Portal</h1>
            <p className="text-muted-foreground mt-2">Library Management System</p>
          </div>
          <Button onClick={handleLogout} variant="outline">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Books</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Borrowed</CardTitle>
              <BookMarked className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="books" className="space-y-4">
          <TabsList>
            <TabsTrigger value="books">
              <BookOpen className="w-4 h-4 mr-2" />
              Manage Books
            </TabsTrigger>
            <TabsTrigger value="borrow">
              <BookMarked className="w-4 h-4 mr-2" />
              Borrow & Return
            </TabsTrigger>
            <TabsTrigger value="reports">
              <FileText className="w-4 h-4 mr-2" />
              Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="books">
            <Card>
              <CardHeader>
                <CardTitle>Book Catalog</CardTitle>
                <CardDescription>Add, edit, and manage library books</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">Manage your library's book collection.</p>
                <Button>Add New Book</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="borrow">
            <Card>
              <CardHeader>
                <CardTitle>Borrow & Return Management</CardTitle>
                <CardDescription>Track book loans and returns</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">Record book borrowing and return transactions.</p>
                <Button>Process Loan/Return</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>Library Reports</CardTitle>
                <CardDescription>View library activity and statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">Generate library activity reports and statistics.</p>
                <Button>View Reports</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default LibrarianPortal;