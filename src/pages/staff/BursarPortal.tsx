import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { DollarSign, Receipt, LogOut, BookOpen, Settings, Users, Loader2 } from "lucide-react";
import MyClassesManager from "@/components/staff/MyClassesManager";
import FeeStructureManager from "@/components/bursar/FeeStructureManager";
import PaymentHistoryView from "@/components/bursar/PaymentHistoryView";
import StudentFeeStatus from "@/components/bursar/StudentFeeStatus";
import ReceiptModal from "@/components/bursar/ReceiptModal";

const BursarPortal = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [calculatingFee, setCalculatingFee] = useState(false);

  // Payment form state
  const [selectedStudent, setSelectedStudent] = useState("");
  const [term, setTerm] = useState("");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [amountDue, setAmountDue] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [receiptNumber, setReceiptNumber] = useState("");

  // Fee breakdown state
  const [feeBreakdown, setFeeBreakdown] = useState<{
    tuitionFee: number;
    boardingFee: number;
    activityFee: number;
    otherFees: number;
    totalFee: number;
    previousPayments: number;
    creditFromPreviousTerms: number;
    debtFromPreviousTerms?: number;
  } | null>(null);

  // Running balance state for receipt
  const [runningBalanceData, setRunningBalanceData] = useState<{
    totalFeesYear: number;
    totalPaidYear: number;
    cumulativeBalance: number;
  } | null>(null);

  // Selected student info
  const [selectedStudentInfo, setSelectedStudentInfo] = useState<{
    fullName: string;
    admissionNumber: string;
    class: string;
  } | null>(null);

  // Receipt modal state
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptPayment, setReceiptPayment] = useState<any>(null);

  useEffect(() => {
    checkAuth();
    loadStudents();
  }, []);

  // Auto-calculate amount due when student, term, or year changes
  useEffect(() => {
    if (selectedStudent && term && year) {
      calculateAmountDue();
    } else {
      setAmountDue("");
      setFeeBreakdown(null);
    }
  }, [selectedStudent, term, year]);

  // Update selected student info when student changes
  useEffect(() => {
    if (selectedStudent) {
      const student = students.find(s => s.id === selectedStudent);
      if (student) {
        setSelectedStudentInfo({
          fullName: student.full_name,
          admissionNumber: student.admission_number,
          class: student.class
        });
      }
    } else {
      setSelectedStudentInfo(null);
    }
  }, [selectedStudent, students]);

  // Auto-generate receipt number when form is ready
  useEffect(() => {
    if (selectedStudent && term && year && !receiptNumber) {
      generateReceiptNumber();
    }
  }, [selectedStudent, term, year]);

  const checkAuth = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      navigate("/auth");
      return;
    }

    const impersonationRaw = localStorage.getItem("impersonation");
    const impersonation = impersonationRaw ? JSON.parse(impersonationRaw) : null;

    const effectiveUserId = impersonation?.userId || session.user.id;
    setUserId(effectiveUserId);

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", effectiveUserId)
      .single();

    if (profile) {
      setUserName(profile.full_name);
    }

    if (!impersonation) {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);

      if (!roles || roles.length === 0 || roles[0].role !== "bursar") {
        toast.error("Access denied");
        navigate("/auth");
      }
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

  const generateReceiptNumber = async () => {
    const currentYear = new Date().getFullYear();
    
    // Get count of payments this year for sequential numbering
    const { count } = await supabase
      .from("fee_payments")
      .select("*", { count: "exact", head: true })
      .gte("created_at", `${currentYear}-01-01`);
    
    const sequenceNumber = ((count || 0) + 1).toString().padStart(4, "0");
    setReceiptNumber(`RCP-${currentYear}-${sequenceNumber}`);
  };

  const calculateAmountDue = async () => {
    if (!selectedStudent || !term || !year) return;

    setCalculatingFee(true);
    
    const student = students.find(s => s.id === selectedStudent);
    if (!student) {
      setCalculatingFee(false);
      return;
    }

    const currentTerm = parseInt(term);
    const currentYear = parseInt(year);

    // Fetch fee structure for this class, term, and year
    const { data: feeStructure } = await supabase
      .from("fee_structures")
      .select("*")
      .eq("class_name", student.class)
      .eq("term", term)
      .eq("year", currentYear)
      .single();

    if (!feeStructure) {
      toast.error(`No fee structure found for ${student.class}, Term ${term}, ${year}`);
      setAmountDue("");
      setFeeBreakdown(null);
      setCalculatingFee(false);
      return;
    }

    // Calculate balance from all previous terms in the same year
    // Positive = still owed, Negative = credit available
    let previousTermsBalance = 0;

    if (currentTerm > 1) {
      // Get all previous terms' fee structures
      const { data: previousFeeStructures } = await supabase
        .from("fee_structures")
        .select("term, total_fee, tuition_fee, boarding_fee, activity_fee, other_fees")
        .eq("class_name", student.class)
        .eq("year", currentYear)
        .lt("term", term);

      // Get all previous terms' payments
      const { data: previousTermPayments } = await supabase
        .from("fee_payments")
        .select("term, amount_paid")
        .eq("student_id", selectedStudent)
        .eq("year", currentYear)
        .lt("term", term);

      // Calculate total fees due for previous terms
      const totalPreviousFeesDue = previousFeeStructures?.reduce((sum, fs) => {
        const termTotal = Number(fs.total_fee) || 
          (Number(fs.tuition_fee) + Number(fs.boarding_fee) + 
           Number(fs.activity_fee) + Number(fs.other_fees));
        return sum + termTotal;
      }, 0) || 0;

      // Calculate total payments made for previous terms
      const totalPreviousPaymentsMade = previousTermPayments?.reduce(
        (sum, payment) => sum + Number(payment.amount_paid), 
        0
      ) || 0;

      // Previous terms balance: positive = still owed, negative = overpaid (credit)
      previousTermsBalance = totalPreviousFeesDue - totalPreviousPaymentsMade;
    }

    // Fetch current term payments for this student
    const { data: currentTermPayments } = await supabase
      .from("fee_payments")
      .select("amount_paid")
      .eq("student_id", selectedStudent)
      .eq("term", term)
      .eq("year", currentYear);

    const totalCurrentTermPayments = currentTermPayments?.reduce(
      (sum, payment) => sum + Number(payment.amount_paid), 
      0
    ) || 0;

    const totalFee = Number(feeStructure.total_fee) || 
      (Number(feeStructure.tuition_fee) + Number(feeStructure.boarding_fee) + 
       Number(feeStructure.activity_fee) + Number(feeStructure.other_fees));

    // Net amount due for this term:
    // = Term fee + any debt from previous terms - any credit from previous terms - current term payments
    // If previousTermsBalance is negative (credit), it reduces the amount due
    // If previousTermsBalance is positive (debt), it increases the amount due
    const effectiveAmountDue = totalFee + previousTermsBalance - totalCurrentTermPayments;

    // Credit from previous terms (for display) - only if there's a credit
    const creditFromPreviousTerms = previousTermsBalance < 0 ? Math.abs(previousTermsBalance) : 0;
    // Debt from previous terms (for display) - only if there's a debt
    const debtFromPreviousTerms = previousTermsBalance > 0 ? previousTermsBalance : 0;

    setFeeBreakdown({
      tuitionFee: Number(feeStructure.tuition_fee),
      boardingFee: Number(feeStructure.boarding_fee),
      activityFee: Number(feeStructure.activity_fee),
      otherFees: Number(feeStructure.other_fees),
      totalFee,
      previousPayments: totalCurrentTermPayments,
      creditFromPreviousTerms,
      debtFromPreviousTerms,
    });

    // Store the actual amount due (can be negative if student has credit)
    setAmountDue(effectiveAmountDue.toString());
    setCalculatingFee(false);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();
    
    const dueAmount = parseFloat(amountDue);
    const paidAmount = parseFloat(amountPaid);
    const balance = dueAmount - paidAmount;

    const { error } = await supabase.from("fee_payments").insert({
      student_id: selectedStudent,
      term,
      year: parseInt(year),
      amount_due: dueAmount,
      amount_paid: paidAmount,
      balance: balance,
      receipt_number: receiptNumber,
      payment_date: new Date().toISOString(),
      recorded_by: session?.user.id,
    });

    if (error) {
      toast.error("Failed to record payment");
      setLoading(false);
      return;
    }

    // Calculate cumulative running balance AFTER this payment (for all terms up to current)
    const currentTerm = parseInt(term);
    const currentYear = parseInt(year);
    const studentClass = selectedStudentInfo?.class || "";

    // Fetch all fee structures for this class and year
    const { data: allFeeStructures } = await supabase
      .from("fee_structures")
      .select("term, total_fee, tuition_fee, boarding_fee, activity_fee, other_fees")
      .eq("class_name", studentClass)
      .eq("year", currentYear);

    // Fetch ALL payments for this student for this year (including the one just made)
    const { data: allPayments } = await supabase
      .from("fee_payments")
      .select("term, amount_paid")
      .eq("student_id", selectedStudent)
      .eq("year", currentYear);

    // Calculate cumulative totals up to current term
    let totalFeesYear = 0;
    let totalPaidYear = 0;

    for (let t = 1; t <= currentTerm; t++) {
      const termFeeStructure = allFeeStructures?.find(fs => fs.term === t.toString());
      const termFee = termFeeStructure
        ? (Number(termFeeStructure.total_fee) || 
           (Number(termFeeStructure.tuition_fee) + Number(termFeeStructure.boarding_fee) + 
            Number(termFeeStructure.activity_fee) + Number(termFeeStructure.other_fees)))
        : 0;
      
      const termPayments = allPayments
        ?.filter(p => p.term === t.toString())
        .reduce((sum, p) => sum + Number(p.amount_paid), 0) || 0;

      totalFeesYear += termFee;
      totalPaidYear += termPayments;
    }

    const cumulativeBalance = totalFeesYear - totalPaidYear;

    // Store running balance for receipt
    setRunningBalanceData({
      totalFeesYear,
      totalPaidYear,
      cumulativeBalance,
    });

    // Prepare receipt data
    setReceiptPayment({
      receiptNumber,
      studentName: selectedStudentInfo?.fullName || "",
      admissionNumber: selectedStudentInfo?.admissionNumber || "",
      studentClass: selectedStudentInfo?.class || "",
      term,
      year,
      amountDue: dueAmount,
      amountPaid: paidAmount,
      balance,
      paymentDate: new Date(),
      recordedBy: userName
    });

    toast.success("Payment recorded successfully");
    setShowReceipt(true);
    
    // Reset form
    setSelectedStudent("");
    setTerm("");
    setAmountDue("");
    setAmountPaid("");
    setReceiptNumber("");
    setFeeBreakdown(null);
    setSelectedStudentInfo(null);
    
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
        <Tabs defaultValue="fees" className="space-y-6">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="fees">
              <Receipt className="h-4 w-4 mr-2" />
              Record Payment
            </TabsTrigger>
            <TabsTrigger value="history">
              <DollarSign className="h-4 w-4 mr-2" />
              Payment History
            </TabsTrigger>
            <TabsTrigger value="structure">
              <Settings className="h-4 w-4 mr-2" />
              Fee Structure
            </TabsTrigger>
            <TabsTrigger value="status">
              <Users className="h-4 w-4 mr-2" />
              Student Status
            </TabsTrigger>
            <TabsTrigger value="classes">
              <BookOpen className="h-4 w-4 mr-2" />
              My Classes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="fees">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    Record Fee Payment
                  </CardTitle>
                  <CardDescription>Track student fee payments with auto-calculated amounts</CardDescription>
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
                              {student.full_name} ({student.admission_number}) - {student.class}
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
                        <Input type="number" value={year} onChange={(e) => setYear(e.target.value)} required />
                      </div>
                    </div>

                    {/* Fee Breakdown Display */}
                    {calculatingFee && (
                      <div className="flex items-center justify-center p-4 bg-muted rounded-lg">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        <span className="text-sm">Calculating fees...</span>
                      </div>
                    )}

                    {feeBreakdown && !calculatingFee && (
                      <div className="p-4 bg-muted/50 rounded-lg space-y-2 text-sm">
                        <h4 className="font-semibold">Fee Breakdown</h4>
                        <div className="grid grid-cols-2 gap-2">
                          <span className="text-muted-foreground">Tuition Fee:</span>
                          <span>KES {feeBreakdown.tuitionFee.toLocaleString()}</span>
                          <span className="text-muted-foreground">Boarding Fee:</span>
                          <span>KES {feeBreakdown.boardingFee.toLocaleString()}</span>
                          <span className="text-muted-foreground">Activity Fee:</span>
                          <span>KES {feeBreakdown.activityFee.toLocaleString()}</span>
                          <span className="text-muted-foreground">Other Fees:</span>
                          <span>KES {feeBreakdown.otherFees.toLocaleString()}</span>
                        </div>
                        <div className="border-t pt-2 mt-2 space-y-1">
                          <div className="flex justify-between font-medium">
                            <span>Term {term} Fee:</span>
                            <span>KES {feeBreakdown.totalFee.toLocaleString()}</span>
                          </div>
                          {feeBreakdown.debtFromPreviousTerms && feeBreakdown.debtFromPreviousTerms > 0 && (
                            <div className="flex justify-between text-destructive font-medium">
                              <span>Balance from Previous Terms:</span>
                              <span>+ KES {feeBreakdown.debtFromPreviousTerms.toLocaleString()}</span>
                            </div>
                          )}
                          {feeBreakdown.creditFromPreviousTerms > 0 && (
                            <div className="flex justify-between text-green-600 font-medium">
                              <span>Credit from Previous Terms:</span>
                              <span>- KES {feeBreakdown.creditFromPreviousTerms.toLocaleString()}</span>
                            </div>
                          )}
                          {feeBreakdown.previousPayments > 0 && (
                            <div className="flex justify-between text-green-600">
                              <span>Paid This Term:</span>
                              <span>- KES {feeBreakdown.previousPayments.toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>Net Amount Due (KES)</Label>
                      <div className="relative">
                        <Input
                          type="number"
                          value={amountDue}
                          readOnly
                          className={`bg-muted ${parseFloat(amountDue) < 0 ? 'text-green-600 font-semibold' : ''}`}
                          placeholder={calculatingFee ? "Calculating..." : "Select student, term & year"}
                        />
                        {amountDue && parseFloat(amountDue) < 0 && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-green-600 font-medium">
                            (Credit)
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {parseFloat(amountDue) < 0 
                          ? "Student has a credit balance - excess will carry forward" 
                          : "Auto-calculated from fee structure with carry-forward"}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Amount Paid (KES)</Label>
                      <Input
                        type="number"
                        value={amountPaid}
                        onChange={(e) => setAmountPaid(e.target.value)}
                        placeholder="Enter amount being paid"
                        step="0.01"
                        required
                      />
                    </div>

                    {amountDue && amountPaid && (
                      <div className={`p-3 rounded-lg ${
                        (parseFloat(amountDue) - parseFloat(amountPaid)) < 0 
                          ? 'bg-green-500/10 border border-green-500/20' 
                          : (parseFloat(amountDue) - parseFloat(amountPaid)) > 0 
                            ? 'bg-destructive/10 border border-destructive/20' 
                            : 'bg-primary/10'
                      }`}>
                        <p className="text-sm font-medium">
                          {(parseFloat(amountDue) - parseFloat(amountPaid)) < 0 ? (
                            <>
                              Credit After Payment: <span className="text-green-600">
                                KES {Math.abs(parseFloat(amountDue) - parseFloat(amountPaid)).toLocaleString()}
                              </span>
                              <span className="block text-xs text-green-600/80 mt-1">
                                This credit will carry forward to the next term
                              </span>
                            </>
                          ) : (parseFloat(amountDue) - parseFloat(amountPaid)) > 0 ? (
                            <>
                              Remaining Balance: <span className="text-destructive">
                                KES {(parseFloat(amountDue) - parseFloat(amountPaid)).toLocaleString()}
                              </span>
                            </>
                          ) : (
                            <span className="text-green-600">Fully Cleared</span>
                          )}
                        </p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>Receipt Number</Label>
                      <Input
                        value={receiptNumber}
                        readOnly
                        className="bg-muted font-mono"
                        placeholder="Auto-generated"
                      />
                      <p className="text-xs text-muted-foreground">Auto-generated receipt number</p>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={loading || !amountDue || !amountPaid}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Recording...
                        </>
                      ) : (
                        "Record Payment & Generate Receipt"
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Quick Stats Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Guide</CardTitle>
                  <CardDescription>How to record a payment</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium">1</div>
                      <div>
                        <p className="font-medium">Select Student</p>
                        <p className="text-sm text-muted-foreground">Choose the student making payment</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium">2</div>
                      <div>
                        <p className="font-medium">Select Term & Year</p>
                        <p className="text-sm text-muted-foreground">Amount due will auto-calculate from fee structure</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium">3</div>
                      <div>
                        <p className="font-medium">Enter Amount Paid</p>
                        <p className="text-sm text-muted-foreground">Enter the amount the student is paying</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium">4</div>
                      <div>
                        <p className="font-medium">Record & Print Receipt</p>
                        <p className="text-sm text-muted-foreground">Receipt will be generated automatically</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Important</p>
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                      Ensure fee structure is set up for the class before recording payments. 
                      Go to "Fee Structure" tab to configure fees.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history">
            <PaymentHistoryView />
          </TabsContent>

          <TabsContent value="structure">
            <FeeStructureManager />
          </TabsContent>

          <TabsContent value="status">
            <StudentFeeStatus />
          </TabsContent>

          <TabsContent value="classes">
            {userId && <MyClassesManager userId={userId} />}
          </TabsContent>
        </Tabs>
      </main>

      {/* Receipt Modal */}
      <ReceiptModal
        open={showReceipt}
        onClose={() => setShowReceipt(false)}
        payment={receiptPayment}
        feeBreakdown={feeBreakdown ? {
          tuitionFee: feeBreakdown.tuitionFee,
          boardingFee: feeBreakdown.boardingFee,
          activityFee: feeBreakdown.activityFee,
          otherFees: feeBreakdown.otherFees
        } : undefined}
        runningBalance={runningBalanceData}
      />
    </div>
  );
};

export default BursarPortal;
