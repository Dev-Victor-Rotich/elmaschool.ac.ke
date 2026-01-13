import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { History, Search, Printer } from "lucide-react";
import { format } from "date-fns";
import ReceiptModal from "./ReceiptModal";

interface PaymentData {
  receiptNumber: string;
  studentName: string;
  admissionNumber: string;
  studentClass: string;
  term: string;
  year: string;
  amountDue: number;
  amountPaid: number;
  balance: number;
  paymentDate: Date;
  recordedBy: string;
}

const PaymentHistoryView = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterYear, setFilterYear] = useState<string>("");
  const [filterTerm, setFilterTerm] = useState("all");
  const [showReceipt, setShowReceipt] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentData | null>(null);

  // Fetch available years from fee_payments
  const { data: availableYears } = useQuery({
    queryKey: ["payment-years"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fee_payments")
        .select("year")
        .order("year", { ascending: false });
      
      if (error) throw error;
      
      // Get unique years
      const uniqueYears = [...new Set(data?.map(p => p.year) || [])];
      return uniqueYears.length > 0 ? uniqueYears : [new Date().getFullYear()];
    },
  });

  // Set default year to latest year with payments
  useEffect(() => {
    if (availableYears && availableYears.length > 0 && !filterYear) {
      setFilterYear(availableYears[0].toString());
    }
  }, [availableYears, filterYear]);

  const { data: payments, isLoading } = useQuery({
    queryKey: ["payment-history", filterYear, filterTerm],
    queryFn: async () => {
      if (!filterYear) return [];
      
      let query = supabase
        .from("fee_payments")
        .select(`
          *,
          student:students_data(full_name, admission_number, class)
        `)
        .eq("year", parseInt(filterYear))
        .order("payment_date", { ascending: false });

      if (filterTerm !== "all") {
        query = query.eq("term", filterTerm);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!filterYear,
  });

  const filteredPayments = payments?.filter((payment) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      payment.student?.full_name?.toLowerCase().includes(search) ||
      payment.student?.admission_number?.toLowerCase().includes(search) ||
      payment.receipt_number?.toLowerCase().includes(search)
    );
  });

  const totalCollected = filteredPayments?.reduce(
    (sum, p) => sum + Number(p.amount_paid),
    0
  ) || 0;

  // Calculate totals - handle negative balances (credits)
  const totalOutstanding = filteredPayments?.reduce(
    (sum, p) => {
      const balance = Number(p.balance);
      // Only count positive balances (debts) in outstanding
      return sum + (balance > 0 ? balance : 0);
    },
    0
  ) || 0;

  const totalCredits = filteredPayments?.reduce(
    (sum, p) => {
      const balance = Number(p.balance);
      // Count negative balances (credits)
      return sum + (balance < 0 ? Math.abs(balance) : 0);
    },
    0
  ) || 0;

  const [feeBreakdown, setFeeBreakdown] = useState<{
    tuitionFee: number;
    boardingFee: number;
    activityFee: number;
    otherFees: number;
    creditFromPreviousTerms?: number;
    debtFromPreviousTerms?: number;
  } | null>(null);

  const handleViewReceipt = async (payment: any) => {
    const currentTerm = parseInt(payment.term);
    const currentYear = payment.year;
    const studentClass = payment.student?.class || "";
    const studentId = payment.student_id;

    // Fetch fee structure for breakdown
    const { data: feeStructure } = await supabase
      .from("fee_structures")
      .select("tuition_fee, boarding_fee, activity_fee, other_fees")
      .eq("class_name", studentClass)
      .eq("term", payment.term)
      .eq("year", currentYear)
      .maybeSingle();

    // Calculate balance from all previous terms (positive = debt, negative = credit)
    let previousTermsBalance = 0;

    if (currentTerm > 1) {
      // Get all previous terms' fee structures
      const { data: previousFeeStructures } = await supabase
        .from("fee_structures")
        .select("term, total_fee, tuition_fee, boarding_fee, activity_fee, other_fees")
        .eq("class_name", studentClass)
        .eq("year", currentYear)
        .lt("term", payment.term);

      // Get all previous terms' payments
      const { data: previousTermPayments } = await supabase
        .from("fee_payments")
        .select("term, amount_paid")
        .eq("student_id", studentId)
        .eq("year", currentYear)
        .lt("term", payment.term);

      // Calculate total fees due for previous terms
      const totalPreviousFeesDue = previousFeeStructures?.reduce((sum, fs) => {
        const termTotal = Number(fs.total_fee) || 
          (Number(fs.tuition_fee) + Number(fs.boarding_fee) + 
           Number(fs.activity_fee) + Number(fs.other_fees));
        return sum + termTotal;
      }, 0) || 0;

      // Calculate total payments made for previous terms
      const totalPreviousPaymentsMade = previousTermPayments?.reduce(
        (sum, p) => sum + Number(p.amount_paid), 
        0
      ) || 0;

      // Previous terms balance: positive = debt, negative = credit
      previousTermsBalance = totalPreviousFeesDue - totalPreviousPaymentsMade;
    }

    // Credit from previous terms (negative balance means credit)
    const creditFromPreviousTerms = previousTermsBalance < 0 ? Math.abs(previousTermsBalance) : 0;
    const debtFromPreviousTerms = previousTermsBalance > 0 ? previousTermsBalance : 0;

    setFeeBreakdown(feeStructure ? {
      tuitionFee: Number(feeStructure.tuition_fee),
      boardingFee: Number(feeStructure.boarding_fee),
      activityFee: Number(feeStructure.activity_fee),
      otherFees: Number(feeStructure.other_fees),
      creditFromPreviousTerms,
      debtFromPreviousTerms,
    } : null);

    setSelectedPayment({
      receiptNumber: payment.receipt_number || "N/A",
      studentName: payment.student?.full_name || "Unknown",
      admissionNumber: payment.student?.admission_number || "N/A",
      studentClass: payment.student?.class || "N/A",
      term: payment.term,
      year: payment.year.toString(),
      amountDue: Number(payment.amount_due),
      amountPaid: Number(payment.amount_paid),
      balance: Number(payment.balance),
      paymentDate: payment.payment_date ? new Date(payment.payment_date) : new Date(),
      recordedBy: "Bursar",
    });
    setShowReceipt(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Payment History
              </CardTitle>
              <CardDescription>View all recorded fee payments</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-[150px]"
                />
              </div>
              <Select value={filterTerm} onValueChange={setFilterTerm}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Terms</SelectItem>
                  <SelectItem value="1">Term 1</SelectItem>
                  <SelectItem value="2">Term 2</SelectItem>
                  <SelectItem value="3">Term 3</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterYear} onValueChange={setFilterYear}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {availableYears?.map((y) => (
                    <SelectItem key={y} value={y.toString()}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="p-3 bg-green-500/10 rounded-lg">
              <p className="text-xs text-muted-foreground">Total Collected</p>
              <p className="text-lg font-bold text-green-600">
                KES {totalCollected.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-amber-500/10 rounded-lg">
              <p className="text-xs text-muted-foreground">Outstanding Balance</p>
              <p className="text-lg font-bold text-amber-600">
                KES {totalOutstanding.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <p className="text-xs text-muted-foreground">Total Credits</p>
              <p className="text-lg font-bold text-blue-600">
                KES {totalCredits.toLocaleString()}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-muted-foreground py-4">Loading...</p>
          ) : filteredPayments?.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No payments recorded for the selected period.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Receipt #</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Term</TableHead>
                    <TableHead className="text-right">Amount Due</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments?.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="text-sm">
                        {payment.payment_date
                          ? format(new Date(payment.payment_date), "dd/MM/yyyy")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-1 rounded">
                          {payment.receipt_number || "-"}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{payment.student?.full_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {payment.student?.admission_number}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{payment.student?.class}</TableCell>
                      <TableCell>Term {payment.term}</TableCell>
                      <TableCell className="text-right">
                        {Number(payment.amount_due).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-green-600 font-medium">
                        {Number(payment.amount_paid).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {Number(payment.balance) < 0 ? (
                          <Badge className="bg-green-500 hover:bg-green-600">
                            Credit {Math.abs(Number(payment.balance)).toLocaleString()}
                          </Badge>
                        ) : Number(payment.balance) > 0 ? (
                          <Badge variant="destructive">
                            Due {Number(payment.balance).toLocaleString()}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Cleared</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewReceipt(payment)}
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ReceiptModal
        open={showReceipt}
        onClose={() => setShowReceipt(false)}
        payment={selectedPayment}
        feeBreakdown={feeBreakdown}
      />
    </>
  );
};

export default PaymentHistoryView;