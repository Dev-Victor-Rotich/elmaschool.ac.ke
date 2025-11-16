import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { DollarSign, Receipt, LogOut } from "lucide-react";

const BursarPortal = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Payment form state
  const [selectedStudent, setSelectedStudent] = useState("");
  const [term, setTerm] = useState("");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [amountDue, setAmountDue] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [receiptNumber, setReceiptNumber] = useState("");

  useEffect(() => {
    checkAuth();
    loadStudents();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", session.user.id)
      .single();

    if (profile) {
      setUserName(profile.full_name);
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id);

    if (!roles || roles.length === 0 || roles[0].role !== "bursar") {
      toast.error("Access denied");
      navigate("/auth");
    }
  };

  const loadStudents = async () => {
    const { data } = await supabase
      .from("students_data")
      .select("id, full_name, admission_number, class")
      .eq("is_registered", true)
      .order("full_name");

    if (data) {
      setStudents(data);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    const balance = parseFloat(amountDue) - parseFloat(amountPaid);

    const { error } = await supabase
      .from("fee_payments")
      .insert({
        student_id: selectedStudent,
        term,
        year: parseInt(year),
        amount_due: parseFloat(amountDue),
        amount_paid: parseFloat(amountPaid),
        balance,
        receipt_number: receiptNumber,
        payment_date: new Date().toISOString(),
        recorded_by: session?.user.id
      });

    if (error) {
      toast.error("Failed to record payment");
    } else {
      toast.success("Payment recorded successfully");
      // Reset form
      setSelectedStudent("");
      setTerm("");
      setAmountDue("");
      setAmountPaid("");
      setReceiptNumber("");
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Bursar Portal</h1>
            <p className="text-sm text-muted-foreground">Welcome, {userName}</p>
          </div>
          <Button onClick={handleLogout} variant="outline">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Record Fee Payment
              </CardTitle>
              <CardDescription>Track student fee payments</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRecordPayment} className="space-y-4">
                <div className="space-y-2">
                  <Label>Student</Label>
                  <Select value={selectedStudent} onValueChange={setSelectedStudent} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select student" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.full_name} ({student.admission_number})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Term</Label>
                    <Select value={term} onValueChange={setTerm} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select term" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Term 1</SelectItem>
                        <SelectItem value="2">Term 2</SelectItem>
                        <SelectItem value="3">Term 3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Year</Label>
                    <Input
                      type="number"
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Amount Due (KES)</Label>
                  <Input
                    type="number"
                    value={amountDue}
                    onChange={(e) => setAmountDue(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Amount Paid (KES)</Label>
                  <Input
                    type="number"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    required
                  />
                </div>

                {amountDue && amountPaid && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium">
                      Balance: KES {(parseFloat(amountDue) - parseFloat(amountPaid)).toFixed(2)}
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Receipt Number</Label>
                  <Input
                    value={receiptNumber}
                    onChange={(e) => setReceiptNumber(e.target.value)}
                    placeholder="RCP-2024-001"
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Recording..." : "Record Payment"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Recent Payments
              </CardTitle>
              <CardDescription>Latest fee transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center py-8">
                Payment history will appear here
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default BursarPortal;